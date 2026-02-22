import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useVoices } from "@/hooks/use-voices";
import { useNarrate } from "@/hooks/use-narration";
import { useAudioStore } from "@/stores/audio-store";
import { Button } from "@/components/ui/button";
import { Loader2, SkipForward } from "lucide-react";
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
}

export function NarrateButton({ text, chapterTitle }: NarrateButtonProps) {
  const [voiceId, setVoiceId] = useState<string>("");
  const [speed, setSpeed] = useState("1");
  const [elapsed, setElapsed] = useState(0);
  const [remainingText, setRemainingText] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { data: voices } = useVoices();
  const narrateMutation = useNarrate();
  const play = useAudioStore((s) => s.play);

  // Reset remaining text when chapter text changes
  useEffect(() => {
    setRemainingText(null);
  }, [text]);

  useEffect(() => {
    if (narrateMutation.isPending) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [narrateMutation.isPending]);

  const doNarrate = (inputText: string) => {
    narrateMutation.mutate(
      {
        text: inputText,
        voiceId: voiceId || undefined,
        speed: parseFloat(speed),
      },
      {
        onSuccess: (data) => {
          play(data.audioUrl, chapterTitle, data.narratedText, data.durationSec);
          // Calculate remaining text after what was narrated
          // Backend replaces newlines with spaces in the header, so normalize before matching
          const normalized = inputText.replace(/\n/g, " ");
          const idx = normalized.indexOf(data.narratedText);
          if (idx !== -1) {
            const rest = inputText.slice(idx + data.narratedText.length).trimStart();
            setRemainingText(rest || null);
          } else {
            setRemainingText(null);
          }
        },
        onError: (err) => {
          toast.error(err.message || "Narration failed");
        },
      }
    );
  };

  const handleNarrate = () => {
    setRemainingText(null);
    doNarrate(text);
  };

  const handleNext = () => {
    if (remainingText) doNarrate(remainingText);
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
        {narrateMutation.isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            <span className="tabular-nums">{elapsed}s</span>
          </>
        ) : (
          "Narrate"
        )}
      </Button>

      {remainingText && !narrateMutation.isPending && (
        <Button variant="outline" onClick={handleNext}>
          <SkipForward className="size-4" />
          Next
        </Button>
      )}
    </div>
  );
}
