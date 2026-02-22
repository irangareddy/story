import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useCloneVoice } from "@/hooks/use-voices";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { MicrophoneWaveform } from "@/components/ui/waveform";
import { Mic, Square, Play, Pause, RotateCcw, Upload } from "lucide-react";

const MIN_DURATION = 5;
const MAX_DURATION = 15;

function formatTime(sec: number) {
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const remainder = s % 60;
  return `${m}:${remainder.toString().padStart(2, "0")}`;
}

/** Decode any browser-supported audio blob to a 16-bit PCM WAV blob. */
async function blobToWav(blob: Blob): Promise<Blob> {
  const ctx = new AudioContext();
  const arrayBuf = await blob.arrayBuffer();
  const audio = await ctx.decodeAudioData(arrayBuf);
  await ctx.close();

  const numChannels = 1;
  const sampleRate = audio.sampleRate;
  const pcm = audio.getChannelData(0);
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcm.length * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < pcm.length; i++) {
    const s = Math.max(-1, Math.min(1, pcm[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function CloneVoiceDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [tab, setTab] = useState("record");
  const [isPlaying, setIsPlaying] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const clone = useCloneVoice();
  const recorder = useAudioRecorder();

  // Auto-stop at MAX_DURATION
  useEffect(() => {
    if (recorder.isRecording && recorder.durationSec >= MAX_DURATION) {
      recorder.stopRecording();
    }
  }, [recorder.isRecording, recorder.durationSec, recorder.stopRecording]);

  // Sync play/pause state with audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => setIsPlaying(false);
    const handlePause = () => setIsPlaying(false);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
    };
  }, [recorder.audioUrl]);

  const resetAll = useCallback(() => {
    recorder.resetRecording();
    setName("");
    setIsPlaying(false);
    if (fileRef.current) fileRef.current.value = "";
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [recorder]);

  // Reset everything when dialog closes
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetAll();
    setOpen(nextOpen);
  };

  // Stop recording when switching tabs
  const handleTabChange = (value: string) => {
    if (recorder.isRecording) recorder.stopRecording();
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    setTab(value);
  };

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio || !recorder.audioUrl) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    let file: File | undefined;

    if (tab === "record") {
      if (!recorder.audioBlob) return;
      try {
        const wavBlob = await blobToWav(recorder.audioBlob);
        file = new File([wavBlob], "voice-sample.wav", { type: "audio/wav" });
      } catch {
        toast.error("Failed to convert recording to WAV");
        return;
      }
    } else {
      file = fileRef.current?.files?.[0];
      if (!file) return;
    }

    clone.mutate(
      { name: trimmedName, file },
      {
        onSuccess: (data) => {
          toast.success(`Cloned voice "${data.name}"`);
          setOpen(false);
          resetAll();
        },
        onError: (err) => {
          toast.error(err.message || "Clone failed");
        },
      }
    );
  };

  const recordingDuration = recorder.audioBlob
    ? recorder.durationSec
    : recorder.isRecording
      ? recorder.durationSec
      : 0;

  const canSubmitRecord =
    recorder.audioBlob && recordingDuration >= MIN_DURATION;
  const canSubmitUpload = fileRef.current?.files?.[0];
  const canSubmit =
    name.trim() && (tab === "record" ? canSubmitRecord : canSubmitUpload);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>Clone Voice</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone a Voice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 min-w-0 overflow-hidden">
          <div className="space-y-2">
            <Label htmlFor="voice-name">Voice Name</Label>
            <Input
              id="voice-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My custom voice"
              required
            />
          </div>

          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="record" className="flex-1">
                <Mic className="size-4 mr-1.5" />
                Record
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex-1">
                <Upload className="size-4 mr-1.5" />
                Upload
              </TabsTrigger>
            </TabsList>

            <TabsContent value="record" className="space-y-4 pt-2">
              {recorder.error && (
                <p className="text-sm text-destructive">{recorder.error}</p>
              )}

              {/* Idle state */}
              {!recorder.isRecording && !recorder.audioBlob && !recorder.error && (
                <div className="space-y-3">
                  <MicrophoneWaveform
                    active={false}
                    height={80}
                    className="w-full rounded-md border bg-muted/30"
                  />
                  <p className="text-sm text-muted-foreground text-center">
                    Record 5–15 seconds of clear speech
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={recorder.startRecording}
                  >
                    <Mic className="size-4 mr-2" />
                    Start Recording
                  </Button>
                </div>
              )}

              {/* Recording state */}
              {recorder.isRecording && (
                <div className="space-y-3">
                  <MicrophoneWaveform
                    active={true}
                    height={80}
                    className="w-full rounded-md border"
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-destructive font-medium flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-destructive animate-pulse" />
                      Recording
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatTime(recorder.durationSec)} / {formatTime(MAX_DURATION)}
                    </span>
                  </div>
                  <Progress
                    value={(recorder.durationSec / MAX_DURATION) * 100}
                    className="h-1.5"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={recorder.stopRecording}
                  >
                    <Square className="size-4 mr-2" />
                    Stop Recording
                  </Button>
                </div>
              )}

              {/* Review state */}
              {!recorder.isRecording && recorder.audioBlob && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm tabular-nums">
                      {formatTime(recordingDuration)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={togglePlayback}
                      >
                        {isPlaying ? (
                          <Pause className="size-4" />
                        ) : (
                          <Play className="size-4" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          recorder.resetRecording();
                          setIsPlaying(false);
                          if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                          }
                        }}
                      >
                        <RotateCcw className="size-4" />
                      </Button>
                    </div>
                  </div>
                  {recordingDuration < MIN_DURATION && (
                    <p className="text-sm text-destructive">
                      Recording too short — minimum {MIN_DURATION} seconds required.
                    </p>
                  )}
                  {recorder.audioUrl && (
                    <audio ref={audioRef} src={recorder.audioUrl} preload="auto" />
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload" className="space-y-2 pt-2">
              <Label htmlFor="voice-file">Audio Sample (.wav, .mp3)</Label>
              <Input
                id="voice-file"
                ref={fileRef}
                type="file"
                accept=".wav,.mp3"
                onChange={() => {
                  // Force re-render so canSubmit updates
                  setName((n) => n);
                }}
              />
            </TabsContent>
          </Tabs>

          <Button
            type="submit"
            disabled={!canSubmit || clone.isPending}
            className="w-full"
          >
            {clone.isPending ? "Cloning..." : "Clone Voice"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
