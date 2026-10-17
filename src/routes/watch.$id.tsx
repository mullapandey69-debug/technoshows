import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { ChevronLeft, ChevronRight, Maximize, Play, PlugZap, Clock } from "lucide-react";
import { getSeason } from "@/lib/tmdb.functions";
import { img, year, type Episode } from "@/lib/tmdb-types";
import { DataNotice, Rating, btn } from "@/components/ui-kit";
import { LibraryButtons } from "@/components/LibraryButtons";
import { activeProvider, isSafeEmbedUrl } from "@/lib/providers";
import { recallEpisode, rememberEpisode, saveProgress } from "@/lib/library";
import { useAuth } from "@/hooks/use-auth";
import { showQuery } from "./show.$id";

export const Route = createFileRoute("/watch/$id")({
  validateSearch: z.object({ s: z.coerce.number().int().min(0).optional(), e: z.coerce.number().int().min(1).optional() }),
  loader: async ({ context, params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw notFound();
    return context.queryClient.ensureQueryData(showQuery(id));
  },
  head: ({ loaderData }) => {
    const s = loaderData?.ok ? loaderData.show : null;
    const title = s ? `Watch ${s.name} — TechnoShows` : "Watch — TechnoShows";
    const desc = s?.overview?.slice(0, 155) || "Watch TV shows on TechnoShows.";
    const image = s ? img(s.backdrop_path, "w1280") : null;
    return { meta: [{ title }, { name: "description", content: desc }, { property: "og:title", content: title }, { property: "og:description", content: desc }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : [])] };
  },
  pendingComponent: () => <div className="mx-auto max-w-[1300px] px-4 pt-28"><div className="skeleton aspect-video w-full rounded-2xl" /></div>,
  component: WatchPage,
});

function WatchPage() {
  const id = Number(Route.useParams().id);
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/watch/$id" });
  const { user } = useAuth();
  const { data } = useSuspenseQuery(showQuery(id));
  const show = data.ok ? data.show : null;
  const seasons = show?.seasons.filter((x) => x.season_number > 0 && x.episode_count > 0) ?? [];

  // Resolve season/episode: URL → remembered → first.
  useEffect(() => {
    if (!show || search.s != null) return;
    const r = recallEpisode(id);
    navigate({ search: { s: r?.season ?? seasons[0]?.season_number ?? 1, e: r?.episode ?? 1 }, replace: true });
  }, [show, search.s, id]); // eslint-disable-line react-hooks/exhaustive-deps

  const seasonNum = search.s ?? seasons[0]?.season_number ?? 1;
  const epNum = search.e ?? 1;
  const season = useQuery({ queryKey: ["season", id, seasonNum], enabled: !!show, queryFn: () => getSeason({ data: { id, season: seasonNum } }), staleTime: 600_000 });
  const episodes: Episode[] = season.data?.ok ? season.data.season.episodes : [];
  const ep = episodes.find((e) => e.episode_number === epNum);
  const idx = ep ? episodes.indexOf(ep) : -1;
  const sIdx = seasons.findIndex((x) => x.season_number === seasonNum);

  useEffect(() => {
    if (!show || !ep) return;
    rememberEpisode(id, seasonNum, epNum);
    if (user) void saveProgress(user.id, { show_id: id, season: seasonNum, episode: epNum, title: show.name, poster_path: show.poster_path, backdrop_path: ep.still_path ?? show.backdrop_path, episode_name: ep.name });
  }, [show, ep, user, id, seasonNum, epNum]);

  if (!show) return <div className="px-4 pt-32"><DataNotice reason={data.ok ? "error" : data.reason} /></div>;

  const go = (s: number, e: number) => navigate({ search: { s, e } });
  const next = () => {
    const ne = idx >= 0 ? episodes[idx + 1] : undefined;
    const ns = sIdx >= 0 ? seasons[sIdx + 1] : undefined;
    if (ne) go(seasonNum, ne.episode_number);
    else if (ns) go(ns.season_number, 1);
  };
  const prev = () => {
    const pe = idx > 0 ? episodes[idx - 1] : undefined;
    const ps = sIdx > 0 ? seasons[sIdx - 1] : undefined;
    if (pe) go(seasonNum, pe.episode_number);
    else if (ps) go(ps.season_number, ps.episode_count);
  };
  const hasNext = (idx >= 0 && idx < episodes.length - 1) || (sIdx >= 0 && sIdx < seasons.length - 1);
  const hasPrev = idx > 0 || sIdx > 0;
  const aired = ep?.air_date ? new Date(ep.air_date) <= new Date() : false;

  return (
    <div className="mx-auto max-w-[1400px] px-4 pt-24 md:px-10">
      {/* Title block */}
      <div className="flex gap-5">
        {show.poster_path && <img src={img(show.poster_path, "w185")!} alt="" className="hidden w-24 rounded-xl ring-1 ring-border sm:block md:w-28" />}
        <div className="min-w-0 flex-1">
          <Link to="/show/$id" params={{ id: String(id) }} className="text-3xl font-extrabold hover:text-primary md:text-4xl">{show.name}</Link>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{year(show.first_air_date)}</span><span>•</span><span>{show.genres.map((g) => g.name).join(", ") || "TV"}</span><span>•</span><Rating value={show.vote_average} />
          </div>
          <p className="mt-2 line-clamp-2 max-w-3xl text-sm text-foreground/80">{show.overview}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button className={btn.primary} onClick={() => document.getElementById("player")?.scrollIntoView({ behavior: "smooth", block: "center" })}>
              <Play className="h-4 w-4 fill-current" />Continue Watching · S{seasonNum} E{epNum}
            </button>
            <LibraryButtons id={id} title={show.name} poster={show.poster_path} />
          </div>
        </div>
      </div>

      {/* Player */}
      <Player key={`${seasonNum}-${epNum}`} id={id} season={seasonNum} episode={epNum} still={img(ep?.still_path ?? show.backdrop_path, "w1280")} available={!!ep && aired} loading={season.isLoading} />

      {/* Episode info + nav */}
      <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Season {seasonNum} · Episode {epNum}</p>
          <h2 className="mt-1 text-2xl font-bold">{ep?.name ?? (season.isLoading ? "Loading…" : "Episode not found")}</h2>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {ep?.air_date && <span>Aired {ep.air_date}</span>}
            {ep?.runtime ? <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{ep.runtime} min</span> : null}
            {ep && !aired && <span className="text-gold">Not yet aired</span>}
          </div>
          {ep?.overview && <p className="mt-2 max-w-3xl text-sm text-foreground/80">{ep.overview}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <button className={btn.ghost} onClick={prev} disabled={!hasPrev}><ChevronLeft className="h-4 w-4" />Previous</button>
          <button className={btn.primary} onClick={next} disabled={!hasNext}>Next Episode<ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Seasons + episodes */}
      <section className="mt-10">
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4" role="tablist" aria-label="Seasons">
          {seasons.map((se) => (
            <button key={se.id} role="tab" aria-selected={se.season_number === seasonNum} onClick={() => go(se.season_number, 1)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${se.season_number === seasonNum ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-accent"}`}>
              {se.name}
            </button>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {season.isLoading && Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)}
          {season.data && !season.data.ok && <p className="text-sm text-muted-foreground">Episode list couldn't be loaded for this season.</p>}
          {episodes.map((e) => {
            const active = e.episode_number === epNum;
            return (
              <button key={e.id} onClick={() => go(seasonNum, e.episode_number)} aria-current={active}
                className={`flex gap-3 rounded-xl p-2 text-left ring-1 transition ${active ? "bg-secondary ring-primary" : "ring-border hover:bg-secondary/60"}`}>
                <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {img(e.still_path, "w342") && <img src={img(e.still_path, "w342")!} alt="" loading="lazy" className="h-full w-full object-cover" />}
                  {active && <div className="absolute inset-0 flex items-center justify-center bg-background/50"><Play className="h-6 w-6 fill-current text-primary" /></div>}
                </div>
                <div className="min-w-0 py-1">
                  <p className="text-xs text-muted-foreground">Episode {e.episode_number}{e.runtime ? ` · ${e.runtime}m` : ""}</p>
                  <p className="truncate text-sm font-semibold">{e.name}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">{e.overview}</p>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Player({ id, season, episode, still, available, loading }: { id: number; season: number; episode: number; still: string | null; available: boolean; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const url = activeProvider?.buildEmbedUrl(id, season, episode) ?? null;
  const valid = url ? isSafeEmbedUrl(url) : false;

  useEffect(() => {
    if (!url) return;
    const t = setTimeout(() => { if (!loaded) setFailed(true); }, 15000);
    return () => clearTimeout(t);
  }, [url, loaded]);

  const fullscreen = () => ref.current?.requestFullscreen?.().catch(() => {});

  let overlay: React.ReactNode = null;
  if (loading) overlay = <div className="skeleton absolute inset-0" />;
  else if (!activeProvider) overlay = (
    <Notice icon={<PlugZap className="h-8 w-8 text-primary" />} title="No video provider connected"
      body="Episode details are live, but playback needs an authorized embedding provider. Once one is connected, episodes will play right here." link />
  );
  else if (!available) overlay = <Notice title="Episode unavailable" body="This episode hasn't aired yet or isn't listed for this season." />;
  else if (!valid) overlay = <Notice title="Invalid player link" body="The provider returned an unusable link for this episode." />;
  else if (failed) overlay = <Notice title="The player didn't load" body="The provider may be blocking embeds or is temporarily down. Try again later." />;

  return (
    <div id="player" ref={ref} className="group relative mt-8 aspect-video w-full overflow-hidden rounded-2xl bg-player shadow-card ring-1 ring-border">
      {still && !url && <img src={still} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
      {url && valid && available && !failed && (
        <iframe src={url} title={`Season ${season} Episode ${episode}`} className="absolute inset-0 h-full w-full" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowFullScreen referrerPolicy="origin" onLoad={() => setLoaded(true)} />
      )}
      {overlay}
      <button onClick={fullscreen} aria-label="Fullscreen" className={`${btn.icon} absolute right-3 top-3 z-10 opacity-70 hover:opacity-100`}><Maximize className="h-4 w-4" /></button>
    </div>
  );
}

function Notice({ icon, title, body, link }: { icon?: React.ReactNode; title: string; body: string; link?: boolean }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-player/70 p-6 text-center">
      {icon}
      <h3 className="mt-3 text-lg font-semibold md:text-xl">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {link && <Link to="/setup" className="mt-4 text-sm font-semibold text-primary hover:underline">How to connect a provider</Link>}
    </div>
  );
}
