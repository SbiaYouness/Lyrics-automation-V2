import React, { useState } from 'react';
import { FileText, Image as ImageIcon, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { SongAssets } from '../types';

interface LyricsAndBackgroundProps {
  songAssets: SongAssets | null;
  onLyricsLoaded: (lrcText: string) => void;
  onBackgroundGenerated: (dataUrl: string) => void;
}

export const LyricsAndBackground: React.FC<LyricsAndBackgroundProps> = ({
  songAssets,
  onLyricsLoaded,
  onBackgroundGenerated,
}) => {
  const [fetchingLyrics, setFetchingLyrics] = useState(false);
  const [generatingBg, setGeneratingBg] = useState(false);
  const [status, setStatus] = useState<string>('Ready for lyrics and background');
  const [prompt, setPrompt] = useState<string>(
    'Take this image and generate a visually identical picture but with 16:9 based on it. Ensure there is NO TEXT at all in the output. keep the look and the feel, choose the dominant tone of color and embrace it in background and in fades, use touches of gold'
  );

  const handleFetchLyrics = async () => {
    if (!songAssets) {
      setStatus('Please select and download a song first.');
      return;
    }

    setFetchingLyrics(true);
    setStatus(`Searching lyrics for "${songAssets.title}"...`);

    try {
      const res = await fetch(
        `/api/lyrics?title=${encodeURIComponent(songAssets.title)}&artist=${encodeURIComponent(songAssets.artists)}`
      );
      const data = await res.json();

      if (data.found && data.lrc) {
        onLyricsLoaded(data.lrc);
        setStatus('Synced LRC lyrics successfully loaded!');
      } else {
        // Fallback default lyrics format
        const fallbackLrc = `[00:00.00] Intro - ${songAssets.title} by ${songAssets.artists}
[00:08.00] (Instrumental Beat)
[00:15.00] Lyrics line 1 for ${songAssets.title}
[00:22.00] Lyrics line 2 with flow and mood
[00:30.00] Chorus - ${songAssets.title}
[00:45.00] Outro`;
        onLyricsLoaded(fallbackLrc);
        setStatus(`Loaded template lyrics for ${songAssets.title}.`);
      }
    } catch (err: any) {
      setStatus(`Lyrics search failed: ${err.message}`);
    } finally {
      setFetchingLyrics(false);
    }
  };

  const handleGenerateBackground = async () => {
    if (!songAssets || !songAssets.coverUrl) {
      setStatus('Error: Cover image required. Select a song first.');
      return;
    }

    setGeneratingBg(true);
    setStatus('Generating 16:9 wallpaper composition with gold highlights using ChatGPT...');

    try {
      const res = await fetch('/api/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coverUrl: songAssets.coverUrl,
          prompt: prompt,
          title: songAssets.title
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onBackgroundGenerated(data.dataUrl);
        setStatus('Generated 16:9 wallpaper via ChatGPT successfully!');
      } else {
        setStatus(`Error: ${data.error || 'Failed to generate background'}`);
      }
    } catch (err: any) {
      setStatus(`Background generation failed: ${err.message}`);
    } finally {
      setGeneratingBg(false);
    }
  };

  return (
    <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md transition-all hover:border-[#8aa4ff]/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#8aa4ff]/10 border border-[#8aa4ff]/30 flex items-center justify-center text-[#8aa4ff]">
          <Sparkles className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-wide">2. Lyrics & Background</h2>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleFetchLyrics}
          disabled={fetchingLyrics || !songAssets}
          className="w-full py-2.5 bg-gradient-to-r from-[#78d8d0]/20 to-[#8aa4ff]/20 hover:from-[#78d8d0]/30 hover:to-[#8aa4ff]/30 text-white border border-[#78d8d0]/30 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
        >
          {fetchingLyrics ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#78d8d0]" />
          ) : (
            <FileText className="w-4 h-4 text-[#78d8d0]" />
          )}
          Find & Load Lyrics
        </button>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">
            Image Prompt
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-2.5 text-xs text-white/90 focus:outline-none focus:border-[#78d8d0]/50 resize-none"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerateBackground}
          disabled={generatingBg || !songAssets}
          className="w-full py-2.5 bg-[#8aa4ff]/20 hover:bg-[#8aa4ff]/30 text-white border border-[#8aa4ff]/40 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
        >
          {generatingBg ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#8aa4ff]" />
          ) : (
            <ImageIcon className="w-4 h-4 text-[#8aa4ff]" />
          )}
          Generate Background (16:9)
        </button>

        <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 text-xs font-mono text-[#8aa4ff] min-h-[38px] flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#78d8d0] shrink-0" />
          <span className="truncate">{status}</span>
        </div>
      </div>
    </div>
  );
};
