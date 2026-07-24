import React, { useState } from 'react';
import { Search, Download, Music, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { SongSearchResult, SongAssets } from '../types';

interface SongSourceProps {
  onSongSelected: (song: SongAssets) => void;
  onMetadataUpdated: (artist: string, title: string) => void;
}

export const SongSource: React.FC<SongSourceProps> = ({
  onSongSelected,
  onMetadataUpdated,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState<string>('Ready to search');
  const [results, setResults] = useState<SongSearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SongSearchResult | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setStatus('Searching songs on music network...');
    setResults([]);
    setSelectedResult(null);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.results && data.results.length > 0) {
        setResults(data.results);
        setSelectedResult(data.results[0]);
        setStatus(`Found ${data.results.length} results.`);
      } else {
        setStatus('No results found for query.');
      }
    } catch (err: any) {
      setStatus(`Search failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedResult) {
      setStatus('Error: No song selected.');
      return;
    }

    setDownloading(true);
    setStatus(`Downloading audio via yt-dlp for: ${selectedResult.title}...`);

    try {
      const res = await fetch("/api/download-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: selectedResult.videoId,
          title: selectedResult.title,
          artists: selectedResult.artists,
        })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to download song");
      }

      const assets: SongAssets = {
        title: selectedResult.title,
        artists: selectedResult.artists,
        videoId: selectedResult.videoId,
        audioUrl: data.audioUrl,
        coverUrl: data.coverUrl || selectedResult.thumbUrl,
        songDir: data.songDir,
      };

      onSongSelected(assets);
      onMetadataUpdated(selectedResult.artists, selectedResult.title);

      setStatus(`Successfully loaded assets for: ${selectedResult.title}`);
    } catch (err: any) {
      setStatus(`Download error: ${err.message}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md transition-all hover:border-[#8aa4ff]/30">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[#78d8d0]/10 border border-[#78d8d0]/30 flex items-center justify-center text-[#78d8d0]">
          <Music className="w-4 h-4" />
        </div>
        <h2 className="text-lg font-bold text-white tracking-wide">1. Song Source</h2>
      </div>

      <form onSubmit={handleSearch} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">
            Song name / artist
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. SAVASHUIA TIF or Lartiste"
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#78d8d0]/50 focus:ring-1 focus:ring-[#78d8d0]/30 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-[#78d8d0] hover:bg-[#8aa4ff] text-[#071016] font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              Search
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-white/60 mb-1">
              Select Result
            </label>
            <select
              value={selectedResult?.videoId || ''}
              onChange={(e) => {
                const found = results.find((r) => r.videoId === e.target.value);
                if (found) setSelectedResult(found);
              }}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#78d8d0]/50"
            >
              {results.map((r) => (
                <option key={r.videoId} value={r.videoId} className="bg-[#0d1118] text-white">
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="button"
          onClick={handleDownload}
          disabled={!selectedResult || downloading}
          className="w-full py-2.5 bg-gradient-to-r from-white/10 to-white/5 hover:from-[#78d8d0]/20 hover:to-[#8aa4ff]/20 text-white border border-white/10 hover:border-[#78d8d0]/40 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#78d8d0]" />
          ) : (
            <Download className="w-4 h-4 text-[#78d8d0]" />
          )}
          Download Assets
        </button>

        <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 text-xs font-mono text-[#8aa4ff] min-h-[38px] flex items-center gap-2">
          {status.startsWith('Error') ? (
            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
          ) : status.startsWith('Successfully') || status.startsWith('Found') ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-[#78d8d0] shrink-0" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-[#78d8d0] animate-pulse shrink-0" />
          )}
          <span className="truncate">{status}</span>
        </div>
      </form>
    </div>
  );
};
