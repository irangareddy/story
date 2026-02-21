import { useState, useRef } from "react";
import { toast } from "sonner";
import { useCloneVoice } from "@/hooks/use-voices";
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

export function CloneVoiceDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const clone = useCloneVoice();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !name.trim()) return;

    clone.mutate(
      { name: name.trim(), file },
      {
        onSuccess: (data) => {
          toast.success(`Cloned voice "${data.name}"`);
          setOpen(false);
          setName("");
          if (fileRef.current) fileRef.current.value = "";
        },
        onError: (err) => {
          toast.error(err.message || "Clone failed");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Clone Voice</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clone a Voice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="voice-name">Voice Name</Label>
            <Input
              id="voice-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My custom voice"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="voice-file">Audio Sample (.wav, .mp3)</Label>
            <Input
              id="voice-file"
              ref={fileRef}
              type="file"
              accept=".wav,.mp3"
              required
            />
          </div>
          <Button type="submit" disabled={clone.isPending} className="w-full">
            {clone.isPending ? "Cloning..." : "Clone Voice"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
