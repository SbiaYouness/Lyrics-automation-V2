import React, { useState } from 'react';
import { Terminal, Play, FileCode, CheckCircle2, Loader2, Download } from 'lucide-react';
import { SongAssets, PipelineConfig, PipelineArtifacts } from '../types';

interface CliPipelineRunnerProps {
  songAssets: SongAssets | null;
  rawLrcText: string;
}

export const CliPipelineRunner: React.FC<CliPipelineRunnerProps> = ({
  songAssets,
  rawLrcText,
}) => {
  const [running, setRunning] = useState(false);
  const [artifacts, setArtifacts] = useState<PipelineArtifacts | null>(null);
  const [status, setStatus] = useState<string>('Ready to run pipeline');

  const defaultConfig: PipelineConfig = {
    song_title: songAssets?.title || 'Sample Song',
    artist: songAssets?.artists || 'Sample Artist',
    slug: (songAssets?.title || 'sample-song').toLowerCase().replace(/\s+/g, '-'),
    output_dir: 'projects',
    audio: {
      type: 'local_file',
      path: songAssets?.audioUrl || 'projects/sample-song/audio/source.mp3',
    },
    cover: {
      type: 'local_file',
      path: songAssets?.coverUrl || 'projects/sample-song/cover/source.jpg',
    },
    lyrics: {
      source: 'manual',
      text: rawLrcText || '[Intro]\nSample lyrics line 1\nSample lyrics line 2',
    },
    metadata_style: {
      title_template: '{artist} - {song_title} (Lyrics)',
      description_template: 'Official-style lyrics video for {song_title} by {artist}.',
      tag_seed: ['lyrics', 'official lyrics', 'music', 'moroccan rap'],
    },
    canva: {
      enabled: true,
      template_id: 'canva-lyrics-template-16-9',
    },
    upload: {
      enabled: false,
    },
  };

  const [configJson, setConfigJson] = useState<string>(
    JSON.stringify(defaultConfig, null, 2)
  );

  // Sync config when songAssets or rawLrcText change
  React.useEffect(() => {
    if (songAssets) {
      const updated: PipelineConfig = {
        song_title: songAssets.title,
        artist: songAssets.artists,
        slug: songAssets.title.toLowerCase().replace(/[^a-zA-Z0-9_-]/g, '-'),
        output_dir: 'projects',
        audio: {
          type: 'local_file',
          path: songAssets.audioUrl || `projects/${songAssets.title}/audio/source.mp3`,
        },
        cover: {
          type: 'local_file',
          path: songAssets.coverUrl || `projects/${songAssets.title}/cover/source.jpg`,
        },
        lyrics: {
          source: 'manual',
          text: rawLrcText || '[Intro]\nLine 1',
        },
        metadata_style: {
          title_template: '{artist} - {song_title} (Lyrics)',
          description_template: 'Official-style lyrics video for {song_title} by {artist}.',
          tag_seed: ['lyrics', 'official lyrics', 'music', 'moroccan rap'],
        },
        canva: {
          enabled: true,
          template_id: 'canva-lyrics-template-16-9',
        },
        upload: {
          enabled: false,
        },
      };
      setConfigJson(JSON.stringify(updated, null, 2));
    }
  }, [songAssets, rawLrcText]);

  const handleRunPipeline = async () => {
    try {
      const parsedConfig = JSON.parse(configJson);
      setRunning(true);
      setStatus('Validating configuration and building project layout...');

      const res = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedConfig),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setArtifacts(data.artifacts);
        setStatus(`Pipeline completed! Artifacts created under ${data.slug}`);
      } else {
        setStatus(`Pipeline failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setStatus(`JSON syntax or execution error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const handleDownloadArtifactsJson = () => {
    if (!artifacts) return;
    const content = JSON.stringify(
      {
        config: JSON.parse(configJson),
        artifacts,
      },
      null,
      2
    );
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pipeline_artifacts_${artifacts.audio.split('/')[1] || 'project'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#121722]/90 border border-white/10 rounded-2xl p-5 shadow-xl backdrop-blur-md transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#8aa4ff]" />
          <h3 className="text-base font-bold text-white tracking-wide">CLI Pipeline Automation</h3>
        </div>
        <span className="text-xs text-white/50 font-mono">lyrics_pipeline runner</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Config JSON Editor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/60 flex items-center gap-1">
              <FileCode className="w-3.5 h-3.5 text-[#78d8d0]" />
              Config JSON
            </label>
            <button
              onClick={handleRunPipeline}
              disabled={running}
              className="px-3 py-1.5 bg-[#78d8d0] hover:bg-[#8aa4ff] text-[#071016] font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40"
            >
              {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              Run Pipeline
            </button>
          </div>
          <textarea
            rows={10}
            value={configJson}
            onChange={(e) => setConfigJson(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs font-mono text-[#78d8d0] focus:outline-none focus:border-[#78d8d0]/50 resize-none"
          />
        </div>

        {/* Artifacts & Output Log */}
        <div className="space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
                Pipeline Artifacts
              </label>
              {artifacts && (
                <button
                  onClick={handleDownloadArtifactsJson}
                  className="px-2.5 py-1 bg-[#8aa4ff]/20 hover:bg-[#8aa4ff]/30 text-[#8aa4ff] border border-[#8aa4ff]/40 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
                >
                  <Download className="w-3 h-3" />
                  Export Artifacts Manifest
                </button>
              )}
            </div>

            <div className="bg-black/40 border border-white/10 rounded-xl p-3 min-h-[180px] font-mono text-xs space-y-1.5 overflow-y-auto">
              {artifacts ? (
                <>
                  <div className="text-[#78d8d0] font-bold">✓ Audio: {artifacts.audio}</div>
                  <div className="text-[#78d8d0] font-bold">✓ Cover: {artifacts.cover}</div>
                  <div className="text-[#78d8d0] font-bold">✓ Lyrics TXT: {artifacts.lyrics_txt}</div>
                  <div className="text-[#78d8d0] font-bold">✓ Lyrics JSON: {artifacts.lyrics_json}</div>
                  <div className="text-[#8aa4ff] font-bold">✓ Cleaned Cover: {artifacts.cleaned_cover}</div>
                  <div className="text-[#8aa4ff] font-bold">✓ Metadata JSON: {artifacts.metadata_json}</div>
                  <div className="text-[#8aa4ff] font-bold">✓ Canva Payload: {artifacts.canva_payload_json}</div>
                  <div className="text-[#8aa4ff] font-bold">✓ Upload Manifest: {artifacts.upload_manifest_json}</div>
                </>
              ) : (
                <div className="text-white/30 text-center py-10">
                  Configure JSON on left and click "Run Pipeline" to generate artifacts.
                </div>
              )}
            </div>
          </div>

          <div className="bg-black/30 border border-white/5 rounded-xl p-2.5 text-xs font-mono text-[#8aa4ff] flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#78d8d0] shrink-0" />
            <span className="truncate">{status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
