import { useState } from "react";
import { toast } from "sonner";
import { useVoices } from "@/hooks/use-voices";
import { useNarrate } from "@/hooks/use-narration";
import { useAudioStore } from "@/stores/audio-store";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NarrateButtonProps {
  text: string;
  chapterTitle: string;
  bookId?: string;
}

export function NarrateButton({ text, chapterTitle, bookId }: NarrateButtonProps) {
  const [voiceId, setVoiceId] = useState<string>("");
  const [speed, setSpeed] = useState("1");
  const { data: voices } = useVoices();
  const narrateMutation = useNarrate();
  const play = useAudioStore((s) => s.play);

  const handleNarrate = () => {
    narrateMutation.mutate(
      {
        text,
        voiceId: voiceId || undefined,
        speed: parseFloat(speed),
        bookId,
      },
      {
        onSuccess: (data) => {
          play(data.chunk_id, chapterTitle, data.narrated_text, data.duration_sec);
        },
        onError: (err) => {
          toast.error(err.message || "Narration failed");
        },
      }
    );
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={voiceId} onValueChange={setVoiceId}>
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Default voice" />
        </SelectTrigger>
        <SelectContent>
          {voices?.map((v) => (
            <SelectItem key={v.voice_id} value={v.voice_id}>
              {v.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={speed} onValueChange={setSpeed}>
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
            <SelectItem key={s} value={String(s)}>
              {s}x
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={handleNarrate} disabled={narrateMutation.isPending}>
        {narrateMutation.isPending ? "Narrating..." : "Narrate"}
      </Button>
    </div>
  );
}
