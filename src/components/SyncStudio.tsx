import React, { useState, useEffect } from 'react';
import { Play, ChevronLeft, ChevronRight, ListMusic } from 'lucide-react';
import { LyricsLine } from '../types';

interface SyncStudioProps {
  rawLrcText: string;
}

export const SyncStudio: React.FC<SyncStudioProps> = ({ rawLrcText }) => {
  const [lines, setLines] = useState<LyricsLine[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);

  // Parse raw LRC string into lines
  useEffect(() => {
    if (!rawLrcText) {
      setLines([]);
      setCurrentIdx(0);
      return;
    }

    const rawLines = rawLrcText.split('\n');
    const parsed: LyricsLine[] = [];

    rawLines.forEach((line) => {
      const timeMatch = line.match(/\[(\d+):(\d+\.\d+)\]/);
      const text = line.replace(/\[.*?\]/g, '').trim();

      if (text) {
        if (timeMatch) {
          const mins = parseInt(timeMatch[1], 10);
          const secs = parseFloat(timeMatch[2]);
          parsed.push({
            time: `[${timeMatch[1]}:${timeMatch[2]}]`,
            seconds: mins * 60 + secs,
            text,
          });
        } else {
          parsed.push({ text });
        }
      }
    });

    setLines(parsed);
    setCurrentIdx(0);
  }, [rawLrcText]);

  const handleNext = () => {
    if (lines.length === 0) return;
    setCurrentIdx((prev) => Math.min(prev + 1, lines.length - 1));
  };

  const handlePrev = () => {
    if (lines.length === 0) return;
    setCurrentIdx((prev) => Math.max(prev - 1, 0));
  };

  const currentLine = lines[currentIdx]?.text || 'No lyrics loaded yet. Load lyrics above to begin.';

  return (
    <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListMusic className="w-4 h-4 text-[#8aa4ff]" />
          <h3 className="text-base font-bold text-white tracking-wide">Sync Studio</h3>
        </div>
        {lines.length > 0 && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#8aa4ff]/10 border border-[#8aa4ff]/30 text-[#8aa4ff] font-mono">
            Line {currentIdx + 1} of {lines.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Teleprompter Box & Controls */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-3">
          <div className="bg-gradient-to-b from-[#080a0f]/80 to-[#0d1118]/90 border border-[#78d8d0]/30 rounded-2xl p-6 text-center shadow-inner flex flex-col justify-center min-h-[160px]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#78d8d0]/70 mb-2">
              Teleprompter Display
            </span>
            <p className="text-2xl md:text-3xl font-extrabold text-[#78d8d0] leading-snug tracking-tight">
              "{currentLine}"
            </p>
            {lines[currentIdx]?.time && (
              <span className="mt-2 text-xs font-mono text-white/40">
                Timestamp: {lines[currentIdx].time}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handlePrev}
              disabled={lines.length === 0 || currentIdx === 0}
              className="py-3 px-4 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 transition-all disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4 text-[#78d8d0]" />
              Previous Line
            </button>
            <button
              onClick={handleNext}
              disabled={lines.length === 0 || currentIdx === lines.length - 1}
              className="py-3 px-4 bg-[#78d8d0] hover:bg-[#8aa4ff] text-[#071016] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-30"
            >
              Next Line
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Lyrics Picker List */}
        <div className="md:col-span-7 bg-white/[0.02] border border-white/5 rounded-2xl p-3 max-h-[260px] overflow-y-auto space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-white/50 block mb-2 px-2">
            Interactive Lyrics Picker
          </span>

          {lines.length === 0 ? (
            <div className="text-xs text-white/30 text-center py-8">
              Click "Find & Load Lyrics" to populate synced lyrics lines.
            </div>
          ) : (
            lines.map((item, idx) => {
              const isActive = idx === currentIdx;
              return (
                <div
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#78d8d0]/20 to-[#8aa4ff]/15 border border-[#78d8d0]/50 text-white font-bold shadow-md'
                      : 'bg-white/[0.02] border border-white/5 text-white/70 hover:bg-white/[0.05] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`font-mono text-[11px] px-2 py-0.5 rounded-md ${
                        isActive ? 'bg-[#78d8d0] text-[#071016] font-bold' : 'bg-white/5 text-white/40'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="truncate">{item.text}</span>
                  </div>
                  {item.time && (
                    <span className="font-mono text-[10px] text-white/40 ml-2 shrink-0">
                      {item.time}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
