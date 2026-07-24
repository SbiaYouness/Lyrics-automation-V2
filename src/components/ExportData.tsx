import React from 'react';
import { Download, FileText, Youtube } from 'lucide-react';
import { YouTubeMetadataOutput, SongAssets } from '../types';

interface ExportDataProps {
  rawLrcText: string;
  metadata: YouTubeMetadataOutput | null;
  songAssets: SongAssets | null;
}

export const ExportData: React.FC<ExportDataProps> = ({
  rawLrcText,
  metadata,
  songAssets,
}) => {
  const handleDownloadLrc = () => {
    if (!rawLrcText) return;
    const blob = new Blob([rawLrcText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = songAssets?.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'lyrics';
    link.download = `${safeTitle}.lrc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadMetadata = () => {
    if (!metadata) return;
    const content = `TITLE:\n${metadata.titleHeader}\n\nTAGS:\n${metadata.tags}\n\nBODY:\n${metadata.body}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = songAssets?.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'metadata';
    link.download = `${safeTitle}_youtube_metadata.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md transition-all">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4 text-[#78d8d0]" />
        <h3 className="text-base font-bold text-white tracking-wide">Export Data</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Raw Lyrics */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5 flex flex-col justify-between space-y-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Raw LRC Lyrics
              </span>
              {rawLrcText && (
                <button
                  onClick={handleDownloadLrc}
                  className="px-2.5 py-1 bg-[#78d8d0]/20 hover:bg-[#78d8d0]/30 text-[#78d8d0] border border-[#78d8d0]/40 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                >
                  <Download className="w-3 h-3" />
                  Download .lrc
                </button>
              )}
            </div>
            <textarea
              readOnly
              rows={8}
              value={rawLrcText || 'No lyrics text loaded yet.'}
              className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-xs font-mono text-white/80 focus:outline-none resize-none"
            />
          </div>
        </div>

        {/* YouTube Metadata */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3.5 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
              <Youtube className="w-3.5 h-3.5 text-red-400" />
              YouTube Metadata Output
            </span>
            {metadata && (
              <button
                onClick={handleDownloadMetadata}
                className="px-2.5 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
              >
                <Download className="w-3 h-3" />
                Download Metadata TXT
              </button>
            )}
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono text-white/40 mb-1">
              Title Header
            </label>
            <input
              type="text"
              readOnly
              value={metadata?.titleHeader || 'Pending metadata generation...'}
              className="w-full bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-[#78d8d0] font-mono focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono text-white/40 mb-1">
              Tags
            </label>
            <textarea
              readOnly
              rows={2}
              value={metadata?.tags || 'Pending tags generation...'}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs font-mono text-white/80 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-mono text-white/40 mb-1">
              Description Body
            </label>
            <textarea
              readOnly
              rows={4}
              value={metadata?.body || 'Pending body description generation...'}
              className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-xs font-mono text-white/80 focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
