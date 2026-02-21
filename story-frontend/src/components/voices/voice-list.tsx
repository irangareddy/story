import { toast } from "sonner";
import { useDeleteVoice } from "@/hooks/use-voices";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Voice } from "@/lib/types";

interface VoiceListProps {
  voices: Voice[];
}

export function VoiceList({ voices }: VoiceListProps) {
  const deleteMutation = useDeleteVoice();

  const handleDelete = (voice: Voice) => {
    if (!confirm(`Delete voice "${voice.name}"?`)) return;

    deleteMutation.mutate(voice.voice_id, {
      onSuccess: () => toast.success(`Deleted "${voice.name}"`),
      onError: (err) => toast.error(err.message || "Delete failed"),
    });
  };

  if (voices.length === 0) {
    return (
      <p className="text-center py-8 text-muted-foreground">
        No voices available.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Voice ID</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="w-20" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {voices.map((v) => (
          <TableRow key={v.voice_id}>
            <TableCell className="font-medium">{v.name}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {v.voice_id}
            </TableCell>
            <TableCell>
              {v.cloned ? (
                <Badge variant="secondary">Cloned</Badge>
              ) : (
                <Badge variant="outline">Built-in</Badge>
              )}
            </TableCell>
            <TableCell>
              {v.cloned && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(v)}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
