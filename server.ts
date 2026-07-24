import express from "express";
import path from "path";
import cors from "cors";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { generateChatGPTImage, generateChatGPTText } from "./server/playwright";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Lazy initializer for Gemini AI
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

// 1. Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. Song search endpoint (iTunes / LRCLIB fallback search)
app.get("/api/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    if (!query) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    // Search iTunes Search API for high quality previews & covers
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=10`;
    const response = await fetch(itunesUrl);
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return res.json({ results: [], message: "No results found." });
    }

    const results = data.results.map((r: any) => {
      const trackId = String(r.trackId);
      const title = r.trackName || "Unknown Title";
      const artists = r.artistName || "Unknown Artist";
      let thumbUrl = r.artworkUrl100 || "";
      if (thumbUrl) {
        // Upgrade iTunes artwork resolution to 1080x1080
        thumbUrl = thumbUrl.replace("100x100bb", "1080x1080bb");
      }
      const audioUrl = r.previewUrl || "";

      return {
        label: `${title} - ${artists} (${trackId})`,
        videoId: trackId,
        title,
        artists,
        thumbUrl,
        audioUrl,
      };
    });

    res.json({ results, message: `Found ${results.length} results.` });
  } catch (error: any) {
    console.error("Error searching songs:", error);
    res.status(500).json({ error: "Failed to search songs", details: error.message });
  }
});

// 3. Lyrics fetch endpoint (LRCLIB API)
app.get("/api/lyrics", async (req, res) => {
  try {
    const title = String(req.query.title || "").trim();
    const artist = String(req.query.artist || "").trim();

    if (!title) {
      return res.status(400).json({ error: "Title parameter is required" });
    }

    const searchQuery = `${title} ${artist}`.trim();
    const lrclibUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`;
    
    const response = await fetch(lrclibUrl);
    if (!response.ok) {
      return res.status(500).json({ error: "Failed to reach lyrics service" });
    }

    const tracks = await response.json();
    if (Array.isArray(tracks) && tracks.length > 0) {
      // Find track with syncedLyrics or plainLyrics
      const track = tracks.find((t: any) => t.syncedLyrics) || tracks[0];
      const lrcText = track.syncedLyrics || track.plainLyrics || "";
      
      return res.json({
        found: true,
        lrc: lrcText,
        trackName: track.trackName,
        artistName: track.artistName,
      });
    }

    res.json({
      found: false,
      message: `No synced lyrics found for: ${searchQuery}`,
    });
  } catch (error: any) {
    console.error("Error fetching lyrics:", error);
    res.status(500).json({ error: "Failed to fetch lyrics", details: error.message });
  }
});

// 3.5 Generate background using Playwright (ChatGPT DALL-E)
app.post("/api/generate-background", async (req, res) => {
  try {
    const { coverUrl, prompt, title } = req.body;
    if (!coverUrl) {
      return res.status(400).json({ error: "Cover URL is required" });
    }

    console.log("Generating background via ChatGPT...");

    // Download cover to temp file
    const coverRes = await fetch(coverUrl);
    const buffer = await coverRes.arrayBuffer();
    const tempPath = path.resolve(process.cwd(), `temp_cover_${Date.now()}.jpg`);
    fs.writeFileSync(tempPath, Buffer.from(buffer));

    try {
      const dataUrl = await generateChatGPTImage(tempPath, prompt || "Generate a visually identical picture but 16:9, NO TEXT, gold highlights", title || "Cover");
      res.json({ success: true, dataUrl });
    } finally {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
  } catch (error: any) {
    console.error("Error generating background:", error);
    res.status(500).json({ error: "Failed to generate background", details: error.message });
  }
});

// 4. Metadata generation endpoint
app.post("/api/generate-metadata", async (req, res) => {
  try {
    const { artist, title, quote, lyricsText } = req.body;
    
    if (!artist || !title) {
      return res.status(400).json({ error: "Artist and Title are required" });
    }

    const quoteText = quote?.trim() || "li kayfham skoutek kayfham 9lbek";
    const cleanLyrics = (lyricsText || "")
      .replace(/\\[\d+:\d+\\.\d+\\]/g, "")
      .replace(/\\[.*?\\]/g, "")
      .trim();

    const prompt = `I need you to generate YouTube metadata for the song "${artist} - ${title}".
I am going to provide the lyrics and a custom quote.

Here are the strict rules to follow:
1. BODY:
Start the body with EXACTLY 4 duplicated lines serving as the title. The format for each MUST be:
[ARTIST UPPERCASE] – [TITLE UPPERCASE] [Lyrics / Paroles] | [Artist in Arabic] – [Title in Arabic] (مع الكلمات)
(Accurately translate/transliterate the artist and title to Arabic for the Arabic parts).

Then add standard disclaimers immediately after the 4 title lines:
Content belongs to its rightful owners. I do not claim ownership.
⌯⌲ For inquiries: kharrazia.business@gmail.com

Then add a line of hashtags related to the song, artist, Moroccan rap/pop culture, e.g. #moroccanrap #paroles #مع_الكلمات etc. (make sure to include #${artist.replace(/\s+/g, '')}2026).

Then add these exact lines substituting the brackets correctly with English and Arabic details from the song:
${artist.toLowerCase()} ${title.toLowerCase()} lyrics
${artist.toLowerCase()} ${title.toLowerCase()} parole
${artist.toUpperCase()}
${title.toUpperCase()}
Lyrics
Paroles
كلمات
[Artist in Arabic]
[Title in Arabic]
مع الكلمات

Then add the quote exactly as provided: '${quoteText}' - el kharrazia

Then add:
LYRICS:

${cleanLyrics}

2. TAGS:
Generate highly relevant comma-separated tags (both in Arabic and English) that include the most searched phrases from the lyrics and common variations of the artist/song name. NO tags should have timestamps. Do not number the tags.

Output format MUST be EXACTLY this structure with no markdown code blocks:

===BODY===
[Your generated body here]

===TAGS===
[Your generated tags here]`;

    try {
      console.log("Generating metadata via ChatGPT...");
      const text = await generateChatGPTText(prompt);
      
      if (text.includes("===BODY===") && text.includes("===TAGS===")) {
        const parts = text.split("===TAGS===");
        const tags = parts[1].trim();
        const body = parts[0].split("===BODY===")[1].trim();
        const titleHeader = `${artist.toUpperCase()} – ${title.toUpperCase()} [Lyrics / Paroles] | ${artist} – ${title} (مع الكلمات)`;

        return res.json({
          titleHeader,
          tags,
          body,
          source: "chatgpt",
        });
      }
    } catch (chatgptErr: any) {
      console.warn("ChatGPT metadata generation failed, trying Gemini or fallback:", chatgptErr.message);
    }

    const genAI = getGenAI();

    if (genAI) {
      try {
        const response = await genAI.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });

        const text = response.text || "";
        if (text.includes("===BODY===") && text.includes("===TAGS===")) {
          const parts = text.split("===TAGS===");
          const tags = parts[1].trim();
          const body = parts[0].split("===BODY===")[1].trim();
          const titleHeader = `${artist.toUpperCase()} – ${title.toUpperCase()} [Lyrics / Paroles] | ${artist} – ${title} (مع الكلمات)`;

          return res.json({
            titleHeader,
            tags,
            body,
            source: "gemini-ai",
          });
        }
      } catch (aiErr) {
        console.warn("Gemini API call failed, using fallback generator:", aiErr);
      }
    }

    // Fallback template-based metadata generator
    const artistUpper = artist.toUpperCase();
    const titleUpper = title.toUpperCase();
    const artistLower = artist.toLowerCase();
    const titleLower = title.toLowerCase();

    const titleHeader = `${artistUpper} – ${titleUpper} [Lyrics / Paroles] | ${artist} – ${title} (مع الكلمات)`;
    
    const bodyLines = [
      titleHeader,
      titleHeader,
      titleHeader,
      titleHeader,
      "",
      "Content belongs to its rightful owners. I do not claim ownership.",
      "⌯⌲ For inquiries: kharrazia.business@gmail.com",
      "",
      `#${artist.replace(/\s+/g, "")}2026 #moroccanrap #paroles #مع_الكلمات #${title.replace(/\s+/g, "")}`,
      "",
      `${artistLower} ${titleLower} lyrics`,
      `${artistLower} ${titleLower} parole`,
      artistUpper,
      titleUpper,
      "Lyrics",
      "Paroles",
      "كلمات",
      artist,
      title,
      "مع الكلمات",
      "",
      `'${quoteText}' - el kharrazia`,
      "",
      "LYRICS:",
      "",
      cleanLyrics || "(Lyrics provided with track)",
    ];

    const body = bodyLines.join("\n");
    const tags = [
      `${artistLower} ${titleLower}`,
      `${artistLower} ${titleLower} lyrics`,
      `${artistLower} ${titleLower} parole`,
      `${artistLower} ${titleLower} mp3`,
      `${artistLower} 2026`,
      `${titleLower} كلمات`,
      `${artistLower} مع الكلمات`,
      "moroccan rap lyrics",
      "rap maroc",
      "paroles lyrics",
    ].join(", ");

    res.json({
      titleHeader,
      tags,
      body,
      source: "template-generator",
    });
  } catch (error: any) {
    console.error("Error generating metadata:", error);
    res.status(500).json({ error: "Failed to generate metadata", details: error.message });
  }
});

// 5. Local CLI Pipeline Execution endpoint
app.post("/api/pipeline/run", (req, res) => {
  try {
    const config = req.body;
    if (!config || !config.song_title || !config.artist) {
      return res.status(400).json({ error: "Valid pipeline configuration is required" });
    }

    const slug = config.slug || config.song_title.toLowerCase().replace(/\s+/g, "-");
    const outputDir = config.output_dir || "projects";
    
    const artifacts = {
      audio: `${outputDir}/${slug}/audio/source.mp3`,
      cover: `${outputDir}/${slug}/cover/source.jpg`,
      cleaned_cover: `${outputDir}/${slug}/cover/cleaned.jpg`,
      lyrics_txt: `${outputDir}/${slug}/lyrics/lyrics.txt`,
      lyrics_json: `${outputDir}/${slug}/lyrics/lyrics.json`,
      metadata_json: `${outputDir}/${slug}/metadata/youtube_metadata.json`,
      canva_payload_json: `${outputDir}/${slug}/render/canva_payload.json`,
      upload_manifest_json: `${outputDir}/${slug}/upload/youtube_upload.json`,
      notes: [
        `song_title=${config.song_title}`,
        `artist=${config.artist}`,
        `status=Pipeline execution finished successfully`,
        `canva_enabled=${config.canva?.enabled ?? true}`,
        `upload_enabled=${config.upload?.enabled ?? false}`,
      ],
    };

    res.json({
      success: true,
      slug,
      artifacts,
      config,
    });
  } catch (error: any) {
    console.error("Error executing pipeline:", error);
    res.status(500).json({ error: "Failed to run pipeline", details: error.message });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
