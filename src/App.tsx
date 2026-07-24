import React, { useState } from 'react';
import { SongSource } from './components/SongSource';
import { LyricsAndBackground } from './components/LyricsAndBackground';
import { YouTubeMetadata } from './components/YouTubeMetadata';
import { AssetsPreview } from './components/AssetsPreview';
import { SyncStudio } from './components/SyncStudio';
import { ExportData } from './components/ExportData';
import { CliPipelineRunner } from './components/CliPipelineRunner';
import { SongAssets, YouTubeMetadataOutput } from './types';
import { Sparkles, Music2 } from 'lucide-react';

export default function App() {
  const [songAssets, setSongAssets] = useState<SongAssets | null>(null);
  const [artistInput, setArtistInput] = useState<string>('');
  const [titleInput, setTitleInput] = useState<string>('');
  const [rawLrcText, setRawLrcText] = useState<string>('');
  const [generatedBgUrl, setGeneratedBgUrl] = useState<string | null>(null);
  const [metadataOutput, setMetadataOutput] = useState<YouTubeMetadataOutput | null>(null);

  const handleSongSelected = (assets: SongAssets) => {
    setSongAssets(assets);
  };

  const handleMetadataFieldsUpdated = (artist: string, title: string) => {
    setArtistInput(artist);
    setTitleInput(title);
  };

  return (
    <div className="min-h-screen bg-[#080a0f] text-[#f6f7fb] pb-12 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#78d8d0]/10 blur-[120px] pointer-events-none" />
      <div className="fixed top-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#8aa4ff]/10 blur-[150px] pointer-events-none" />

      <div className="max-w-[1320px] mx-auto px-4 py-8 relative z-10">
        {/* Page Header */}
        <header className="mb-8 border-b border-white/10 pb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#78d8d0]">
              Automation Studio
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#78d8d0]" />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <Music2 className="w-8 h-8 text-[#78d8d0]" />
            Lyrics Automation Studio
          </h1>
          <p className="mt-2 text-sm md:text-base text-white/60 max-w-2xl">
            Search songs, download assets, fetch synced LRC lyrics, generate 16:9 wallpapers, and create YouTube metadata in one clean flow.
          </p>
        </header>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column Controls */}
          <div className="lg:col-span-4 space-y-6">
            <div className="relative">
              <SongSource
                onSongSelected={handleSongSelected}
                onMetadataUpdated={handleMetadataFieldsUpdated}
              />
            </div>

            <div className={`transition-all duration-500 ${!songAssets ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
              <LyricsAndBackground
                songAssets={songAssets}
                onLyricsLoaded={(lrc) => setRawLrcText(lrc)}
                onBackgroundGenerated={(bgUrl) => setGeneratedBgUrl(bgUrl)}
              />
            </div>

            <div className={`transition-all duration-500 ${!songAssets ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
              <YouTubeMetadata
                initialArtist={artistInput}
                initialTitle={titleInput}
                lyricsText={rawLrcText}
                onMetadataGenerated={(meta) => setMetadataOutput(meta)}
              />
            </div>
          </div>

          {/* Right Column Main Workspace */}
          <div className="lg:col-span-8 space-y-6">
            <AssetsPreview
              songAssets={songAssets}
              generatedBgUrl={generatedBgUrl}
            />

            <div className={`transition-all duration-500 ${!rawLrcText ? 'opacity-40 pointer-events-none' : ''}`}>
              <SyncStudio rawLrcText={rawLrcText} />
            </div>

            <ExportData
              rawLrcText={rawLrcText}
              metadata={metadataOutput}
              songAssets={songAssets}
            />

            <div className={`transition-all duration-500 ${!songAssets || !rawLrcText || !metadataOutput ? 'opacity-40 pointer-events-none' : ''}`}>
              <CliPipelineRunner
                songAssets={songAssets}
                rawLrcText={rawLrcText}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
