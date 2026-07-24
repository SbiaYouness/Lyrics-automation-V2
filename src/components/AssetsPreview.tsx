import React from 'react';
import { Music, Image as ImageIcon, Download, Layers } from 'lucide-react';
import { SongAssets } from '../types';

interface AssetsPreviewProps {
  songAssets: SongAssets | null;
  generatedBgUrl: string | null;
}

export const AssetsPreview: React.FC<AssetsPreviewProps> = ({
  songAssets,
  generatedBgUrl,
}) => {
  const handleDownloadBg = () => {
    if (!generatedBgUrl) return;
    const link = document.createElement('a');
    link.href = generatedBgUrl;
    const safeTitle = songAssets?.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'background';
    link.download = `${safeTitle}_16_9.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#78d8d0]" />
          <h3 className="text-base font-bold text-white tracking-wide">Assets Preview</h3>
        </div>
        {songAssets && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#78d8d0]/10 border border-[#78d8d0]/30 text-[#78d8d0] font-mono">
            {songAssets.title} - {songAssets.artists}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Audio Player */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-white/70 mb-2">
            <Music className="w-3.5 h-3.5 text-[#78d8d0]" />
            <span>Audio Preview</span>
          </div>
          {songAssets?.audioUrl ? (
            <audio controls src={songAssets.audioUrl} className="w-full h-10 accent-[#78d8d0]" />
          ) : (
            <div className="h-10 bg-black/20 rounded-lg flex items-center justify-center text-xs text-white/30 border border-dashed border-white/10">
              No audio loaded. Search and select a song above.
            </div>
          )}
        </div>

        {/* Images Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Original Cover */}
          <div className="md:col-span-1 bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col">
            <span className="text-xs font-semibold text-white/70 mb-2 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#8aa4ff]" />
              Original Cover
            </span>
            <div className="aspect-square rounded-lg overflow-hidden bg-black/30 border border-white/5 flex items-center justify-center relative">
              {songAssets?.coverUrl ? (
                <img
                  src={songAssets.coverUrl}
                  alt="Original Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-xs text-white/30 text-center p-3">
                  Original artwork will show here
                </div>
              )}
            </div>
          </div>

          {/* Generated 16:9 Wallpaper */}
          <div className="md:col-span-2 bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#78d8d0]" />
                  Generated 16:9 Background
                </span>
                {generatedBgUrl && (
                  <button
                    onClick={handleDownloadBg}
                    className="px-2.5 py-1 bg-[#78d8d0]/20 hover:bg-[#78d8d0]/30 text-[#78d8d0] border border-[#78d8d0]/40 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                  >
                    <Download className="w-3 h-3" />
                    Download PNG
                  </button>
                )}
              </div>
              <div className="aspect-video rounded-lg overflow-hidden bg-black/40 border border-white/5 flex items-center justify-center relative">
                {generatedBgUrl ? (
                  <img
                    src={generatedBgUrl}
                    alt="Generated 16:9 Background"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-xs text-white/30 text-center p-4">
                    Click "Generate Background" to create a 16:9 wallpaper composition
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
