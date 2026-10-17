import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { getShow } from "@/lib/tmdb.functions";
import { img, year } from "@/lib/tmdb-types";
import { DataNotice, Rating, Row, btn } from "@/components/ui-kit";
import { LibraryButtons } from "@/components/LibraryButtons";

export const showQuery = (id: number) => queryOptions({ queryKey: ["show", id], queryFn: () => getShow({ data: { id } }), staleTime: 600_000 });

export const Route = createFileRoute("/show/$id")({
  loader: async ({ context, params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw notFound();
    return context.queryClient.ensureQueryData(showQuery(id));
  },
  head: ({ loaderData }) => {
    const s = loaderData?.ok ? loaderData.show : null;
    const title = s ? `${s.name} — TechnoShows` : "Show — TechnoShows";
    const desc = s?.overview?.slice(0, 155) || "TV show details on TechnoShows.";
    const image = s ? img(s.backdrop_path, "w1280") : null;
    return {
      meta: [
        { title }, { name: "description", content: desc },
        { property: "og:title", content: title }, { property: "og:description", content: desc },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
        ...(image ? [{ property: "og:image", content: image }, { name: "twitter:image", content: image }] : []),
      ],
    };
  },
  pendingComponent: () => <div className="skeleton h-[60vh] w-full" />,
  component: ShowPage,
});

function ShowPage() {
  const id = Number(Route.useParams().id);
  const { data } = useSuspenseQuery(showQuery(id));
  if (!data.ok) return <div className="px-4 pt-32"><DataNotice reason={data.reason} /></div>;
  const s = data.show;
  const seasons = s.seasons.filter((x) => x.season_number > 0 && x.episode_count > 0);
  return (
    <>
      <section className="relative min-h-[70vh] overflow-hidden">
        {s.backdrop_path && <img src={img(s.backdrop_path, "original")!} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="bg-hero-fade absolute inset-0" />
        <div className="relative mx-auto flex max-w-[1500px] flex-col gap-8 px-4 pb-12 pt-32 md:flex-row md:items-end md:px-10">
          {s.poster_path && <img src={img(s.poster_path, "w500")!} alt={s.name} className="w-44 rounded-2xl shadow-card ring-1 ring-border md:w-60" />}
          <div className="max-w-2xl">
            <h1 className="text-4xl font-extrabold md:text-5xl">{s.name}</h1>
            {s.tagline && <p className="mt-2 italic text-muted-foreground">{s.tagline}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span>{year(s.first_air_date)}</span><span>•</span><Rating value={s.vote_average} /><span>•</span>
              <span>{s.number_of_seasons} season{s.number_of_seasons === 1 ? "" : "s"} · {s.number_of_episodes} episodes</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">{s.genres.map((g) => <span key={g.id} className="rounded-full border px-3 py-1 text-xs">{g.name}</span>)}</div>
            <p className="mt-5 text-foreground/85">{s.overview || "No description available."}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link to="/watch/$id" params={{ id: String(s.id) }} className={btn.primary}><Play className="h-4 w-4 fill-current" />Watch Now</Link>
              <LibraryButtons id={s.id} title={s.name} poster={s.poster_path} />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1500px] px-4 md:px-10">
        <h2 className="mb-4 text-xl font-semibold">Seasons</h2>
        {seasons.length === 0 ? <p className="text-sm text-muted-foreground">No season information available yet.</p> : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
            {seasons.map((se) => (
              <Link key={se.id} to="/watch/$id" params={{ id: String(s.id) }} search={{ s: se.season_number, e: 1 }} className="group">
                <div className="aspect-[2/3] overflow-hidden rounded-xl bg-muted ring-1 ring-border group-hover:ring-primary/60">
                  {img(se.poster_path ?? s.poster_path) && <img src={img(se.poster_path ?? s.poster_path)!} alt={se.name} loading="lazy" className="h-full w-full object-cover" />}
                </div>
                <p className="mt-2 text-sm font-medium">{se.name}</p>
                <p className="text-xs text-muted-foreground">{se.episode_count} episodes · {year(se.air_date)}</p>
              </Link>
            ))}
          </div>
        )}
      </section>
      {s.recommendations?.results.length ? <div className="mt-12"><Row title="More like this" shows={s.recommendations.results.filter((r) => r.poster_path)} /></div> : null}
    </>
  );
}
