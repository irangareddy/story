import { useVoices } from "@/hooks/use-voices";
import { VoiceList } from "@/components/voices/voice-list";
import { CloneVoiceDialog } from "@/components/voices/clone-voice-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function VoiceManager() {
  const { data: voices, isLoading, error } = useVoices();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Voices</h1>
        <CloneVoiceDialog />
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">
          Failed to load voices: {error.message}
        </p>
      )}

      {voices && <VoiceList voices={voices} />}
    </div>
  );
}
