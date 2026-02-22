import { useAudioStore } from "@/stores/audio-store";
import { streamUrl } from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TranscriptViewerContainer,
  TranscriptViewerWords,
  TranscriptViewerAudio,
  TranscriptViewerPlayPauseButton,
  TranscriptViewerScrubBar,
} from "@/components/ui/transcript-viewer";

interface ChapterContentProps {
  title: string;
  text: string;
}

export function ChapterContent({ title, text }: ChapterContentProps) {
  const chunkId = useAudioStore((s) => s.chunkId);
  const narrationText = useAudioStore((s) => s.narrationText);
  const alignment = useAudioStore((s) => s.alignment);

  const isNarrating = !!(chunkId && alignment && narrationText);

  return (
    <ScrollArea className="h-[calc(100vh-10rem)] flex-1">
      <article className="max-w-prose mx-auto py-6 px-4">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>

        {isNarrating ? (
          <TranscriptViewerContainer
            audioSrc={streamUrl(chunkId)}
            audioType="audio/wav"
            alignment={alignment}
          >
            <TranscriptViewerAudio />
            <TranscriptViewerWords className="prose prose-neutral dark:prose-invert whitespace-pre-wrap leading-relaxed" />
            <div className="flex items-center gap-3 mt-6 sticky bottom-0 bg-background py-3">
              <TranscriptViewerPlayPauseButton />
              <TranscriptViewerScrubBar className="flex-1" />
            </div>
          </TranscriptViewerContainer>
        ) : (
          <div className="prose prose-neutral dark:prose-invert whitespace-pre-wrap leading-relaxed">
            {text}
          </div>
        )}
      </article>
    </ScrollArea>
  );
}
