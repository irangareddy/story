import { Pause, Play, Square } from "lucide-react";
import { useAudioStore } from "@/stores/audio-store";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

export function AudioPlayerBar() {
  const {
    audioUrl,
    chapterTitle,
    isPlaying,
    currentTime,
    duration,
    speed,
    pause,
    resume,
    setSpeed,
    seek,
    stop,
  } = useAudioStore();

  if (!audioUrl) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background p-3">
      <div className="container mx-auto flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={isPlaying ? pause : resume}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={stop}>
            <Square className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 space-y-1">
          {chapterTitle && (
            <p className="text-xs text-muted-foreground truncate">
              {chapterTitle}
            </p>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs tabular-nums w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 1}
              step={0.1}
              onValueChange={([v]) => seek(v)}
              className="flex-1"
            />
            <span className="text-xs tabular-nums w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {speed}x
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {speeds.map((s) => (
              <DropdownMenuItem key={s} onClick={() => setSpeed(s)}>
                {s}x
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
