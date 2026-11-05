import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Play, Info } from "lucide-react";
import { getHome } from "@/lib/tmdb.functions";
import { img, year } from "@/lib/tmdb-types";
import { Row, RowSkeleton, Rating, DataNotice, btn } from "@/components/ui-kit";
import { useProgress } from "@/lib/library";
import { useAuth } from "@/hooks/use-auth";
import { HomepagePopup } from "@/components/homepage-popup";

const homeQuery = queryOptions({ queryKey: ["home"], queryFn: () => getHome(), staleTime: 10 * 60_000 });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TechnoShows — Trending TV Shows to Stream" },
      { name: "description", content: "Trending, popular and newly added TV shows on TechnoShows." },
      { property: "og:title", content: "TechnoShows — Trending TV Shows" },
      { property: "og:description", content: "Discover trending and popular TV shows on TechnoShows." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  pendingComponent: () => (
    <div className="pt-16">
      <div className="skeleton h-[70vh] w-full" />
      <div className="mt-8 space-y-10"><RowSkeleton /><RowSkeleton /></div>
    </div>
  ),
  component: Home,
});

function ContinueWatching() {
  const { user } = useAuth();
  const { data } = useProgress();
  if (!user || !data?.length) return null;
  return (
    <section>
      <h2 className="mb-3 px-4 text-lg font-semibold md:px-10 md:text-xl">Continue Watching</h2>
      <div className="scrollbar-none flex gap-4 overflow-x-auto px-4 md:px-10">
        {data.map((p) => (
          <Link key={p.show_id} to="/watch/$id" params={{ id: String(p.show_id) }} search={{ s: p.season, e: p.episode }} className="group w-[260px] shrink-0 md:w-[320px]">
            <div className="relative aspect-video overflow-hidden rounded-xl bg-muted ring-1 ring-border group-hover:ring-primary/60">
              {img(p.backdrop_path, "w780") && <img src={img(p.backdrop_path, "w780")!} alt="" loading="lazy" className="h-full w-full object-cover" />}
              <div className="absolute inset-0 flex items-center justify-center bg-background/30 opacity-0 transition group-hover:opacity-100"><Play className="h-10 w-10 fill-current" /></div>
            </div>
            <p className="mt-2 truncate text-sm font-medium">{p.title}</p>
            <p className="truncate text-xs text-muted-foreground">S{p.season} · E{p.episode}{p.episode_name ? ` — ${p.episode_name}` : ""}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  if (!data.ok) return <div className="px-4 pt-32"><DataNotice reason={data.reason} /></div>;
  const hero = data.trending.find((s) => s.backdrop_path) ?? data.trending[0];
  return (
    <>
      <HomepagePopup />
      {hero && (
        <section className="relative h-[78vh] min-h-[520px] w-full overflow-hidden">
          <img src={img(hero.backdrop_path, "original") ?? ""} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="bg-hero-fade absolute inset-0" />
          <div className="relative mx-auto flex h-full max-w-[1500px] flex-col justify-end px-4 pb-16 md:px-10 md:pb-24">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">#1 Trending this week</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-extrabold md:text-6xl">{hero.name}</h1>
            <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              <span>{year(hero.first_air_date)}</span><span>•</span><Rating value={hero.vote_average} />
            </div>
            <p className="mt-4 line-clamp-3 max-w-xl text-sm text-foreground/80 md:text-base">{hero.overview}</p>
            <div className="mt-6 flex gap-3">
              <Link to="/watch/$id" params={{ id: String(hero.id) }} className={btn.primary}><Play className="h-4 w-4 fill-current" />Watch Now</Link>
              <Link to="/show/$id" params={{ id: String(hero.id) }} className={btn.ghost}><Info className="h-4 w-4" />Details</Link>
            </div>
          </div>
        </section>
      )}
      <div className="relative z-10 -mt-8 space-y-10">
        <ContinueWatching />
        <Row title="Trending" shows={data.trending} />
        <Row title="Popular Shows" shows={data.popular} />
        <Row title="Recently Added" shows={data.recent} />
        <Row title="Recommended" shows={data.recommended} />
      </div>
    </>
  );
}

