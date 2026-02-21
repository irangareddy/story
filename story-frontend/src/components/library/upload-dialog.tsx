import { useState, useRef } from "react";
import { toast } from "sonner";
import { useUploadBook } from "@/hooks/use-books";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UploadDialog() {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const upload = useUploadBook();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    upload.mutate(file, {
      onSuccess: (data) => {
        toast.success(`Uploaded "${data.title}"`);
        setOpen(false);
        if (fileRef.current) fileRef.current.value = "";
      },
      onError: (err) => {
        toast.error(err.message || "Upload failed");
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Upload Book</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload a Book</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Book file (.txt, .epub, .pdf)</Label>
            <Input
              id="file"
              ref={fileRef}
              type="file"
              accept=".txt,.epub,.pdf"
              required
            />
          </div>
          <Button type="submit" disabled={upload.isPending} className="w-full">
            {upload.isPending ? "Uploading..." : "Upload"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
