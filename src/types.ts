export interface SongSearchResult {
  label: string;
  videoId: string;
  title: string;
  artists: string;
  thumbUrl: string;
  audioUrl?: string;
}

export interface SongAssets {
  title: string;
  artists: string;
  videoId?: string;
  audioUrl?: string;
  coverUrl?: string;
  songDir?: string;
}

export interface LyricsLine {
  time?: string;
  seconds?: number;
  text: string;
}

export interface YouTubeMetadataOutput {
  titleHeader: string;
  tags: string;
  body: string;
  filePath?: string;
}

export interface PipelineConfig {
  song_title: string;
  artist: string;
  slug: string;
  output_dir: string;
  audio: {
    type: string;
    path: string;
  };
  cover: {
    type: string;
    path: string;
  };
  lyrics: {
    source: string;
    text: string;
  };
  metadata_style: {
    title_template: string;
    description_template: string;
    tag_seed: string[];
  };
  canva: {
    enabled: boolean;
    template_id: string;
  };
  upload: {
    enabled: boolean;
  };
}

export interface PipelineArtifacts {
  audio: string;
  cover: string;
  lyrics_txt: string;
  lyrics_json: string;
  cleaned_cover: string;
  metadata_json: string;
  canva_payload_json: string;
  upload_manifest_json: string;
  notes: string[];
}
