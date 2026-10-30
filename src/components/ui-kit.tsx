import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Star, User as UserIcon, KeyRound, Menu, X } from "lucide-react";
import mark from "@/assets/mark.png";
import { img, year, type Show, type TmdbFailure } from "@/lib/tmdb-types";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const btn = {
  primary: "inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 shadow-glow disabled:opacity-50",
  ghost: "inline-flex items-center justify-center gap-2 rounded-full bg-secondary/80 px-5 py-3 text-sm font-semibold text-secondary-foreground backdrop-blur transition hover:bg-accent disabled:opacity-40",
  icon: "inline-flex h-10 w-10 items-center justify-center rounded-full bg-secondary/80 text-foreground transition hover:bg-accent disabled:opacity-40",
};

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="TechnoShows home">
      <img src={mark} alt="" width={28} height={28} className="h-7 w-7" />
      <span className="font-display text-lg font-bold tracking-tight">Techno<span className="text-primary">Shows</span></span>
    </Link>
  );
}

export function Header() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 20);
    f(); window.addEventListener("scroll", f); return () => window.removeEventListener("scroll", f);
  }, []);
  const nav = [{ to: "/", label: "Home" }, { to: "/search", label: "Browse" }, { to: "/my-list", label: "My List" }] as const;
  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition ${scrolled || open ? "bg-background/90 backdrop-blur-lg border-b" : "bg-gradient-to-b from-background/80 to-transparent"}`}>
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-6 px-4 md:px-10">
        <Logo />
        <nav className="hidden gap-6 text-sm md:flex">
          {nav.map((n) => (
            <Link key={n.to} to={n.to} className="text-muted-foreground transition hover:text-foreground" activeProps={{ className: "text-foreground font-semibold" }} activeOptions={{ exact: true }}>{n.label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/search" className={btn.icon} aria-label="Search"><Search className="h-4 w-4" /></Link>
          {user ? (
            <button className="hidden rounded-full bg-secondary px-4 py-2 text-xs font-semibold md:block" onClick={() => supabase.auth.signOut()}>Sign out</button>
          ) : (
            <Link to="/auth" className="hidden rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground md:flex items-center gap-1"><UserIcon className="h-3.5 w-3.5" />Sign in</Link>
          )}
          <button className={`${btn.icon} md:hidden`} aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}</button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 px-4 pb-4 md:hidden">
          {nav.map((n) => <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 hover:bg-secondary">{n.label}</Link>)}
          {user ? <button className="rounded-lg px-3 py-3 text-left hover:bg-secondary" onClick={() => supabase.auth.signOut()}>Sign out</button>
            : <Link to="/auth" onClick={() => setOpen(false)} className="rounded-lg px-3 py-3 text-primary hover:bg-secondary">Sign in</Link>}
        </nav>
      )}
    </header>
  );
}

export function Rating({ value }: { value: number }) {
  return <span className="inline-flex items-center gap-1 text-gold"><Star className="h-3.5 w-3.5 fill-current" />{value ? value.toFixed(1) : "N/A"}</span>;
}

export function ShowCard({ show }: { show: Pick<Show, "id" | "name" | "poster_path"> & Partial<Show> }) {
  const src = img(show.poster_path, "w342");
  return (
    <Link to="/show/$id" params={{ id: String(show.id) }} className="group block w-[140px] shrink-0 snap-start sm:w-[170px] lg:w-[190px]">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted shadow-card ring-1 ring-border transition duration-300 group-hover:ring-primary/60 group-focus-visible:ring-primary md:group-hover:-translate-y-1">
        {src ? <img src={src} alt={show.name} loading="lazy" className="h-full w-full object-cover transition duration-500 md:group-hover:scale-105" />
          : <div className="flex h-full items-center justify-center p-3 text-center text-xs text-muted-foreground">{show.name}</div>}
        {show.vote_average != null && <div className="absolute left-2 top-2 rounded-md bg-background/80 px-1.5 py-0.5 text-[11px] backdrop-blur"><Rating value={show.vote_average} /></div>}
      </div>
      <p className="mt-2 truncate text-sm font-medium">{show.name}</p>
      {show.first_air_date !== undefined && <p className="text-xs text-muted-foreground">{year(show.first_air_date)}</p>}
    </Link>
  );
}

export function Row({ title, shows }: { title: string; shows: Show[] }) {
  const ref = useRef<HTMLDivElement>(null);
  if (!shows.length) return null;
  const scroll = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="group/row relative">
      <div className="mb-3 flex items-end justify-between px-4 md:px-10">
        <h2 className="text-lg font-semibold md:text-xl">{title}</h2>
        <div className="hidden gap-2 md:flex">
          <button className={btn.icon} onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`}><ChevronLeft className="h-4 w-4" /></button>
          <button className={btn.icon} onClick={() => scroll(1)} aria-label={`Scroll ${title} right`}><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>
      <div ref={ref} className="scrollbar-none flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:gap-4 md:px-10">
        {shows.map((s) => <ShowCard key={s.id} show={s} />)}
      </div>
    </section>
  );
}

export function RowSkeleton() {
  return (
    <div className="px-4 md:px-10">
      <div className="skeleton mb-3 h-5 w-40 rounded" />
      <div className="flex gap-4 overflow-hidden">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-[2/3] w-[140px] shrink-0 rounded-xl sm:w-[170px] lg:w-[190px]" />)}</div>
    </div>
  );
}

const messages: Record<TmdbFailure, { title: string; body: string }> = {
  not_configured: { title: "Show data isn't connected yet", body: "Add a free TMDB API key to load real shows, search, seasons and episodes." },
  bad_key: { title: "The TMDB key was rejected", body: "The saved key appears invalid. Replace it with a valid TMDB API key or read token." },
  not_found: { title: "Show not found", body: "We couldn't find this show. It may have been removed." },
  error: { title: "Couldn't reach the show catalogue", body: "TMDB didn't respond. Please try again in a moment." },
};

export function DataNotice({ reason }: { reason: TmdbFailure }) {
  const m = messages[reason];
  return (
    <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center shadow-card">
      <KeyRound className="mx-auto h-8 w-8 text-primary" />
      <h2 className="mt-4 text-xl font-semibold">{m.title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{m.body}</p>
      {(reason === "not_configured" || reason === "bad_key") && <Link to="/setup" className={`${btn.primary} mt-6`}>View setup guide</Link>}
      {reason === "not_found" && <Link to="/" className={`${btn.ghost} mt-6`}>Back home</Link>}
    </div>
  );
}
