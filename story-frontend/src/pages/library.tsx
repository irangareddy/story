import { useBooks } from "@/hooks/use-books";
import { BookCard } from "@/components/library/book-card";
import { UploadDialog } from "@/components/library/upload-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Library() {
  const { data: books, isLoading, error } = useBooks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Library</h1>
        <UploadDialog />
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {books.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
