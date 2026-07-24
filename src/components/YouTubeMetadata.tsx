import React, { useState } from 'react';
import { Youtube, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { YouTubeMetadataOutput } from '../types';

interface YouTubeMetadataProps {
  initialArtist: string;
  initialTitle: string;
  lyricsText: string;
  onMetadataGenerated: (meta: YouTubeMetadataOutput) => void;
}

export const YouTubeMetadata: React.FC<YouTubeMetadataProps> = ({
  initialArtist,
  initialTitle,
  lyricsText,
  onMetadataGenerated,
}) => {
  const [artist, setArtist] = useState(initialArtist);
  const [title, setTitle] = useState(initialTitle);
  const [quote, setQuote] = useState('li kayfham skoutek kayfham 9lbek');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('Ready for metadata generation');

  // Sync if initial props change
  React.useEffect(() => {
    if (initialArtist) setArtist(initialArtist);
    if (initialTitle) setTitle(initialTitle);
  }, [initialArtist, initialTitle]);

  const handleGenerate = async () => {
    if (!artist || !title) {
      setStatus('Error: Artist and Title must be provided.');
      return;
    }

    setLoading(true);
    setStatus('Generating YouTube title, description, and tags...');

    try {
      const res = await fetch('/api/generate-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artist,
          title,
          quote,
          lyricsText,
        }),
      });

      const data = await res.json();
      if (res.ok && data.body) {
        onMetadataGenerated({
          titleHeader: data.titleHeader,
          tags: data.tags,
          body: data.body,
        });
        setStatus('YouTube Metadata generated successfully!');
      } else {
        setStatus(`Error: ${data.error || 'Failed to generate metadata'}`);
      }
    } catch (err: any) {
      setStatus(`Metadata error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md transition-all hover:border-[#8aa4ff]/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
          <Youtube className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-wide">3. YouTube Meta</h2>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">
            Artist
          </label>
          <input
            type="text"
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="e.g. Lartiste"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#78d8d0]/50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Africallez"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#78d8d0]/50"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">
            Quote
          </label>
          <input
            type="text"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
            placeholder="e.g. li kayfham skoutek kayfham 9lbek"
            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#78d8d0]/50"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !artist || !title}
          className="w-full py-2.5 bg-gradient-to-r from-red-500/20 to-[#8aa4ff]/20 hover:from-red-500/30 hover:to-[#8aa4ff]/30 text-white border border-red-500/30 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
          ) : (
            <Sparkles className="w-4 h-4 text-red-400" />
          )}
          Generate Metadata
        </button>

        <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 text-xs font-mono text-[#8aa4ff] min-h-[38px] flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#78d8d0] shrink-0" />
          <span className="truncate">{status}</span>
        </div>
      </div>
    </div>
  );
};
