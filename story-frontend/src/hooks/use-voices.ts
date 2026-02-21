import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getVoices, cloneVoice, deleteVoice } from "@/lib/api";

export function useVoices() {
  return useQuery({
    queryKey: ["voices"],
    queryFn: getVoices,
    staleTime: 30_000,
  });
}

export function useCloneVoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ name, file }: { name: string; file: File }) => cloneVoice(name, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["voices"] });
    },
  });
}

export function useDeleteVoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (voiceId: string) => deleteVoice(voiceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["voices"] });
    },
  });
}
