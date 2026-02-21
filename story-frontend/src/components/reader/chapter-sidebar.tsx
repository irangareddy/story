import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Chapter } from "@/lib/types";

interface ChapterSidebarProps {
  chapters: Chapter[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function ChapterSidebar({ chapters, activeIndex, onSelect }: ChapterSidebarProps) {
  if (chapters.length <= 1) return null;

  return (
    <aside className="w-64 shrink-0 border-r">
      <ScrollArea className="h-[calc(100vh-10rem)]">
        <div className="p-2 space-y-1">
          {chapters.map((ch) => (
            <button
              key={ch.index}
              onClick={() => onSelect(ch.index)}
              className={cn(
                "w-full text-left rounded-md px-3 py-2 text-sm transition-colors",
                activeIndex === ch.index
                  ? "bg-accent text-accent-foreground font-medium"
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              {ch.title || `Chapter ${ch.index + 1}`}
            </button>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
