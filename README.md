# Lyrics Automation

A toolkit for preparing lyrics video assets: search songs, download audio and cover art, fetch synced lyrics, generate 16:9 backgrounds and YouTube metadata with ChatGPT, and run a modular pipeline for local-file workflows.

Two entry points depending on your use case.

---

## Entry points

**`web_app.py`** — Gradio UI for the full end-to-end workflow: search → download → lyrics → background → metadata.

**`lyrics_pipeline` CLI** — Config-driven pipeline for songs you already have as local files.

---

## Features

### Web app

| Step | What it does |
|---|---|
| Song search | Searches YouTube Music via ytmusicapi |
| Asset download | Downloads MP3 and cover art with yt-dlp into a per-song folder |
| Lyrics | Fetches synced LRC lyrics with syncedlyrics |
| Background | Uses Playwright to upload the cover to ChatGPT and save a 16:9 image |
| YouTube metadata | Uses ChatGPT to generate title, tags, and description (English + Arabic) |
| Sync studio | Line-by-line lyrics viewer for manual timing |

### CLI pipeline

- Creates a standardized per-song project folder
- Copies local audio and cover files into the project layout
- Parses lyrics into `.txt` and structured `.json`
- Generates YouTube metadata JSON
- Builds a Canva render payload and YouTube upload manifest
- Runs independent acquisition tasks in parallel where possible

---

## Requirements

- Python 3.11+
- yt-dlp — required for audio download in the web app
- Playwright Chromium — required for ChatGPT automation

```bash
pip install gradio ytmusicapi requests syncedlyrics playwright
pip install -e .
playwright install chromium
```

---

## Quick start — web app

1. Set the path to your yt-dlp executable in `web_app.py`:

```python
YTDLP_PATH = r"C:\path\to\yt-dlp.exe"
```

2. Run:

```bash
python web_app.py
```

3. Open the URL shown in the terminal (default port 7862).

4. Workflow: Search → select a result → Download Assets → Find & Load Lyrics → Generate Background → Fill in artist/title/quote → Generate Metadata.

On first run, the automated browser may ask you to log into ChatGPT. Sessions are stored in `chatgpt_local_profile/` so you stay logged in between runs.

Set `PLAYWRIGHT_HEADLESS=0` to show the browser window during ChatGPT automation.

---

## Quick start — CLI pipeline

Use this when you already have audio, cover, and lyrics as local files.

```bash
cp examples/sample_song.json my_song.json
# edit my_song.json with your paths and song details
python -m lyrics_pipeline.cli --config my_song.json
```

The command prints a JSON summary with artifact paths and metadata.

---

## Config reference — CLI

```json
{
  "song_title": "Sample Song",
  "artist": "Sample Artist",
  "slug": "sample-song",
  "output_dir": "projects",
  "audio": {
    "type": "local_file",
    "path": "C:/path/to/audio.mp3"
  },
  "cover": {
    "type": "local_file",
    "path": "C:/path/to/cover.jpg"
  },
  "lyrics": {
    "source": "manual",
    "text": "[Intro]\nLine one\nLine two"
  },
  "metadata_style": {
    "title_template": "{artist} - {song_title} (Lyrics)",
    "description_template": "Official-style lyrics video for {song_title} by {artist}.",
    "tag_seed": ["lyrics", "official lyrics", "music"]
  },
  "canva": {
    "enabled": true,
    "template_id": "your-template-id"
  },
  "upload": {
    "enabled": false
  }
}
```

Required keys: `song_title`, `artist`, `audio`, `cover`, `lyrics`.

---

## Output layout

### Web app

```
Song Title/
├── Song Title_<videoId>.mp3
├── Song Title_<videoId>.jpg
├── Song Title_16_9.png
├── lyrics.lrc
└── youtube_metadata.txt
```

### CLI pipeline

```
projects/<slug>/
├── audio/source.mp3
├── cover/
│   ├── source.jpg
│   ├── cleaned.jpg
│   └── cleanup_request.json
├── lyrics/
│   ├── lyrics.txt
│   └── lyrics.json
├── metadata/youtube_metadata.json
├── render/canva_payload.json
├── upload/youtube_upload.json
└── notes/work_notes.txt
```

---

## Project structure

```
.
├── web_app.py
├── search_song.py
├── examples/
│   └── sample_song.json
└── src/lyrics_pipeline/
    ├── cli.py
    ├── pipeline.py
    ├── config.py
    ├── models.py
    ├── project.py
    ├── sources/
    ├── processors/
    ├── renderers/
    └── uploads/
```

---

## Legal notice

This tool is intended for content you own, have licensed, or are otherwise permitted to use. Downloading copyrighted music from YouTube or third-party sites may violate terms of service or copyright law. The CLI pipeline only supports local file sources and does not automate third-party downloads.

---

## License

Proprietary — see `pyproject.toml`.
