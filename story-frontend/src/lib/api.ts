import type {
  Book,
  Voice,
  NarrateResponse,
  UploadResponse,
  CloneVoiceResponse,
  TranscriptionResponse,
} from "./types";

const API_PREFIX = "/api";

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_PREFIX}${url}`, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || res.statusText);
  }
  return res.json();
}

export async function getBooks(): Promise<Book[]> {
  const data = await apiFetch<{ books: Book[] }>("/books");
  return data.books;
}

export async function getBook(bookId: string): Promise<Book> {
  return apiFetch<Book>(`/books/${bookId}`);
}

export async function uploadBook(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  return apiFetch<UploadResponse>("/upload", { method: "POST", body: form });
}

export async function getVoices(): Promise<Voice[]> {
  const data = await apiFetch<{ voices: Voice[] }>("/voices");
  return data.voices;
}

export async function cloneVoice(
  name: string,
  file: File
): Promise<CloneVoiceResponse> {
  const form = new FormData();
  form.append("name", name);
  form.append("file", file);
  return apiFetch<CloneVoiceResponse>("/clone", {
    method: "POST",
    body: form,
  });
}

export async function deleteVoice(voiceId: string): Promise<void> {
  await apiFetch(`/voices/${voiceId}`, { method: "DELETE" });
}

export async function narrate(
  text: string,
  voiceId?: string,
  speed?: number,
  bookId?: string
): Promise<NarrateResponse> {
  return apiFetch<NarrateResponse>("/narrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      voice_id: voiceId,
      speed,
      book_id: bookId,
    }),
  });
}

export function streamUrl(chunkId: string): string {
  return `${API_PREFIX}/stream/${chunkId}`;
}

export function bookFileUrl(filename: string): string {
  return `${API_PREFIX}/files/${encodeURIComponent(filename)}`;
}

export function coverUrl(filename: string): string {
  return `${API_PREFIX}/covers/${encodeURIComponent(filename)}`;
}

export async function transcribe(
  file: File,
  language = "en"
): Promise<TranscriptionResponse> {
  const form = new FormData();
  form.append("file", file);
  form.append("language", language);
  return apiFetch<TranscriptionResponse>("/transcribe", {
    method: "POST",
    body: form,
  });
}
