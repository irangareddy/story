import { useState } from "react";
import { useParams } from "react-router-dom";
import { useBook } from "@/hooks/use-books";
import { bookFileUrl } from "@/lib/api";
import { ChapterSidebar } from "@/components/reader/chapter-sidebar";
import { ChapterContent } from "@/components/reader/chapter-content";
import { NarrateButton } from "@/components/reader/narrate-button";
import { EpubViewer } from "@/components/reader/epub-viewer";
import { PdfViewer } from "@/components/reader/pdf-viewer";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

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
  const hasVisualReader = book.format === "epub" || book.format === "pdf";

  const textView = (
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
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">{book.title}</h1>
        {chapter && (
          <NarrateButton
            text={chapter.text}
            chapterTitle={chapter.title || `Chapter ${activeChapter + 1}`}
          />
        )}
      </div>

      <Separator />

      {hasVisualReader ? (
        <Tabs defaultValue="book">
          <TabsList>
            <TabsTrigger value="book">Book</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
          </TabsList>

          <TabsContent value="book">
            {book.format === "epub" && (
              <EpubViewer
                url={bookFileUrl(book.filename)}
                title={book.title}
              />
            )}
            {book.format === "pdf" && (
              <PdfViewer url={bookFileUrl(book.filename)} />
            )}
          </TabsContent>

          <TabsContent value="text">{textView}</TabsContent>
        </Tabs>
      ) : (
        textView
      )}
    </div>
  );
}
