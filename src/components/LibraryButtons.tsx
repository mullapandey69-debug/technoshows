import { Link } from "@tanstack/react-router";
import { Heart, Plus, Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLibrary, useToggleLibrary, type Kind } from "@/lib/library";
import { btn } from "./ui-kit";

export function LibraryButtons({ id, title, poster }: { id: number; title: string; poster: string | null }) {
  const { user } = useAuth();
  const lib = useLibrary();
  const toggle = useToggleLibrary();
  if (!user) return <Link to="/auth" className={btn.ghost}><Plus className="h-4 w-4" />Sign in to save</Link>;
  const has = (k: Kind) => !!lib.data?.some((r) => r.show_id === id && r.kind === k);
  const flip = (k: Kind) => toggle.mutate({ show_id: id, kind: k, title, poster_path: poster, on: !has(k) });
  return (
    <>
      <button className={btn.ghost} onClick={() => flip("watchlist")} disabled={toggle.isPending} aria-pressed={has("watchlist")}>
        {has("watchlist") ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}Watchlist
      </button>
      <button className={btn.icon + " h-11 w-11"} onClick={() => flip("favorite")} disabled={toggle.isPending} aria-pressed={has("favorite")} aria-label="Favourite">
        <Heart className={`h-4 w-4 ${has("favorite") ? "fill-primary text-primary" : ""}`} />
      </button>
    </>
  );
}
