export interface Chapter {
  index: number;
  title: string;
  text: string;
}

export interface Book {
  _id: string;
  _creationTime: number;
  filename: string;
  title: string;
  format: string;
  pageCount?: number;
  chapters: Chapter[];
}

export interface Voice {
  voice_id: string;
  name: string;
  tags: Record<string, unknown>;
  cloned: boolean;
}

export interface NarrateRequest {
  text: string;
  voice_id?: string;
  speed?: number;
  sample_rate?: number;
  book_id?: string;
}

export interface NarrateResponse {
  chunk_id: string;
  voice_id: string;
  duration_sec: number;
  status: string;
}

export interface UploadResponse {
  filename: string;
  title: string;
  pages?: number;
  chapters: Chapter[];
  book_id: string;
}

export interface CloneVoiceResponse {
  voice_id: string;
  name: string;
  status: string;
}

export interface TranscriptionResponse {
  transcription_id: string;
  transcription: string;
  audio_length: number;
  language: string;
}
