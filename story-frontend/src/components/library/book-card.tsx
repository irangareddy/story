import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Book } from "@/lib/types";
import { coverUrl } from "@/lib/api";

function hashTitle(title: string): number {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function coverGradient(title: string): string {
  const h = hashTitle(title);
  const hue1 = h % 360;
  const hue2 = (hue1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 55%, 45%), hsl(${hue2}, 60%, 35%))`;
}

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const navigate = useNavigate();
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className="group cursor-pointer"
      onClick={() => navigate(`/books/${book._id}`)}
    >
      {/* Cover */}
      <div
        className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-sm transition-all duration-200 group-hover:shadow-lg group-hover:scale-[1.02]"
        style={imgFailed ? { background: coverGradient(book.title) } : undefined}
      >
        {!imgFailed ? (
          <img
            src={coverUrl(book.filename)}
            alt={book.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <span className="text-white font-semibold text-center text-sm leading-snug drop-shadow-md line-clamp-4">
              {book.title}
            </span>
          </div>
        )}
        <span className="absolute bottom-2 right-2 bg-black/30 text-white text-[10px] font-medium px-1.5 py-0.5 rounded backdrop-blur-sm">
          {book.format.toUpperCase()}
        </span>
      </div>

      {/* Info below cover */}
      <div className="mt-2 text-center space-y-0.5 px-1">
        <p className="text-sm font-medium leading-tight line-clamp-2">
          {book.title}
        </p>
        <p className="text-xs text-muted-foreground">
          {book.chapters.length} {book.chapters.length === 1 ? "chapter" : "chapters"}
        </p>
      </div>
    </div>
  );
}
