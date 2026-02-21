import { ScrollArea } from "@/components/ui/scroll-area";

interface ChapterContentProps {
  title: string;
  text: string;
}

export function ChapterContent({ title, text }: ChapterContentProps) {
  return (
    <ScrollArea className="h-[calc(100vh-10rem)] flex-1">
      <article className="max-w-prose mx-auto py-6 px-4">
        <h2 className="text-xl font-semibold mb-4">{title}</h2>
        <div className="prose prose-neutral dark:prose-invert whitespace-pre-wrap leading-relaxed">
          {text}
        </div>
      </article>
    </ScrollArea>
  );
}
