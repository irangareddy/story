import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBooks, getBook, uploadBook } from "@/lib/api";

export function useBooks() {
  return useQuery({
    queryKey: ["books"],
    queryFn: getBooks,
    staleTime: 30_000,
  });
}

export function useBook(bookId: string) {
  return useQuery({
    queryKey: ["books", bookId],
    queryFn: () => getBook(bookId),
    staleTime: 30_000,
    enabled: !!bookId,
  });
}

export function useUploadBook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadBook(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["books"] });
    },
  });
}
