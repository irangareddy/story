import { create } from "zustand";
import type { CharacterAlignmentResponseModel } from "@elevenlabs/elevenlabs-js/api/types/CharacterAlignmentResponseModel";
import { buildSyntheticAlignment } from "@/lib/alignment";

const audio = new Audio();

interface AudioState {
  audioUrl: string | null;
  chapterTitle: string | null;
  narrationText: string | null;
  alignment: CharacterAlignmentResponseModel | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  play: (audioUrl: string, chapterTitle: string, text: string, durationSec: number) => void;
  pause: () => void;
  resume: () => void;
  setSpeed: (speed: number) => void;
  seek: (time: number) => void;
  stop: () => void;
}

export const useAudioStore = create<AudioState>((set, get) => {
  audio.addEventListener("timeupdate", () => {
    set({ currentTime: audio.currentTime });
  });

  audio.addEventListener("loadedmetadata", () => {
    set({ duration: audio.duration });
  });

  audio.addEventListener("ended", () => {
    set({ isPlaying: false });
  });

  audio.addEventListener("pause", () => {
    set({ isPlaying: false });
  });

  audio.addEventListener("play", () => {
    set({ isPlaying: true });
  });

  return {
    audioUrl: null,
    chapterTitle: null,
    narrationText: null,
    alignment: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    speed: 1,

    play: (audioUrl, chapterTitle, text, durationSec) => {
      const prev = get().audioUrl;
      if (prev) URL.revokeObjectURL(prev);
      const alignment = buildSyntheticAlignment(text, durationSec);
      audio.src = audioUrl;
      audio.playbackRate = useAudioStore.getState().speed;
      audio.play();
      set({
        audioUrl,
        chapterTitle,
        narrationText: text,
        alignment,
        currentTime: 0,
        duration: 0,
      });
    },

    pause: () => {
      audio.pause();
    },

    resume: () => {
      audio.play();
    },

    setSpeed: (speed) => {
      audio.playbackRate = speed;
      set({ speed });
    },

    seek: (time) => {
      audio.currentTime = time;
      set({ currentTime: time });
    },

    stop: () => {
      const prev = get().audioUrl;
      if (prev) URL.revokeObjectURL(prev);
      audio.pause();
      audio.src = "";
      set({
        audioUrl: null,
        chapterTitle: null,
        narrationText: null,
        alignment: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
      });
    },
  };
});
