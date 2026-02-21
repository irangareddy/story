import { useMutation } from "@tanstack/react-query";
import { narrate } from "@/lib/api";

export function useNarrate() {
  return useMutation({
    mutationFn: ({ text, voiceId, speed, bookId }: {
      text: string;
      voiceId?: string;
      speed?: number;
      bookId?: string;
    }) => narrate(text, voiceId, speed, bookId),
  });
}
