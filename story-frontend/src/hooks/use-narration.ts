import { useMutation } from "@tanstack/react-query";
import { narrate } from "@/lib/api";

export function useNarrate() {
  return useMutation({
    mutationFn: ({ text, voiceId, speed }: {
      text: string;
      voiceId?: string;
      speed?: number;
    }) => narrate(text, voiceId, speed),
  });
}
