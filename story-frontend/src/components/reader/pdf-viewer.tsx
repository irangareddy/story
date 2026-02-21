import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon-sm"
          disabled={pageNumber <= 1}
          onClick={() => setPageNumber((p) => p - 1)}
        >
          <ChevronLeft />
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {pageNumber} of {numPages || "…"}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={pageNumber >= numPages}
          onClick={() => setPageNumber((p) => p + 1)}
        >
          <ChevronRight />
        </Button>
      </div>

      <div className="max-h-[calc(100vh-18rem)] overflow-auto border rounded-md flex justify-center bg-muted/30">
        <Document
          file={url}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          loading={
            <div className="flex items-center justify-center h-96 text-sm text-muted-foreground">
              Loading PDF…
            </div>
          }
        >
          <Page pageNumber={pageNumber} width={700} />
        </Document>
      </div>
    </div>
  );
}
