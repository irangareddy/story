import { useBooks } from "@/hooks/use-books";
import { BookCard } from "@/components/library/book-card";
import { UploadDialog } from "@/components/library/upload-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function Library() {
  const { data: books, isLoading, error } = useBooks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Library</h1>
          {books && books.length > 0 && (
            <Badge variant="secondary">{books.length}</Badge>
          )}
        </div>
        <UploadDialog />
      </div>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] rounded-lg" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-3 w-1/2 mx-auto" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">
          Failed to load books: {error.message}
        </p>
      )}

      {books && books.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No books yet. Upload one to get started.</p>
        </div>
      )}

      {books && books.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {books.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
