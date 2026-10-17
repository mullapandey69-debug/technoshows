import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Kind = "watchlist" | "favorite";

export function useLibrary() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["library", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("watchlist").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useProgress() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("watch_progress").select("*").order("updated_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleLibrary() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (v: { show_id: number; kind: Kind; title: string; poster_path: string | null; on: boolean }) => {
      if (!user) throw new Error("Sign in required");
      if (v.on) {
        const { error } = await supabase.from("watchlist").upsert({ user_id: user.id, show_id: v.show_id, kind: v.kind, title: v.title, poster_path: v.poster_path });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("watchlist").delete().match({ user_id: user.id, show_id: v.show_id, kind: v.kind });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["library"] }),
  });
}

export async function saveProgress(userId: string, row: { show_id: number; season: number; episode: number; title: string; poster_path: string | null; backdrop_path: string | null; episode_name: string | null }) {
  await supabase.from("watch_progress").upsert({ ...row, user_id: userId, updated_at: new Date().toISOString() });
}

const LS = (id: number) => `ts:last:${id}`;
export function rememberEpisode(id: number, season: number, episode: number) {
  try { localStorage.setItem(LS(id), JSON.stringify({ season, episode })); } catch { /* ignore */ }
}
export function recallEpisode(id: number): { season: number; episode: number } | null {
  try { const v = localStorage.getItem(LS(id)); return v ? JSON.parse(v) : null; } catch { return null; }
}
