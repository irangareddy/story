import { useState } from "react";
import { useParams } from "react-router-dom";
import { useBook } from "@/hooks/use-books";
import { ChapterSidebar } from "@/components/reader/chapter-sidebar";
import { ChapterContent } from "@/components/reader/chapter-content";
import { NarrateButton } from "@/components/reader/narrate-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function BookReader() {
  const { bookId } = useParams<{ bookId: string }>();
  const { data: book, isLoading, error } = useBook(bookId!);
  const [activeChapter, setActiveChapter] = useState(0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[60vh]" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <p className="text-sm text-destructive">
        {error?.message || "Book not found"}
      </p>
    );
  }

  const chapter = book.chapters[activeChapter];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">{book.title}</h1>
        {chapter && (
          <NarrateButton
            text={chapter.text}
            chapterTitle={chapter.title || `Chapter ${activeChapter + 1}`}
            bookId={book._id}
          />
        )}
      </div>

      <Separator />

      <div className="flex">
        <ChapterSidebar
          chapters={book.chapters}
          activeIndex={activeChapter}
          onSelect={setActiveChapter}
        />
        {chapter && (
          <ChapterContent
            title={chapter.title || `Chapter ${activeChapter + 1}`}
            text={chapter.text}
          />
        )}
      </div>
    </div>
  );
}
