import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Play, ExternalLink, Maximize } from "lucide-react";
import { getMovie } from "@/lib/tmdb.functions";
import { img, year } from "@/lib/tmdb-types";
import { activeProvider, isSafeEmbedUrl } from "@/lib/providers";
import { DataNotice, Rating, btn } from "@/components/ui-kit";

export const Route = createFileRoute("/movie/$id")({
  loader: async ({ context, params }) => {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) throw notFound();
    return getMovie({ data: { id } });
  },
  head: ({ loaderData }) => {
    const movie = loaderData?.ok ? loaderData.movie : null;
    const title = movie ? `Watch ${movie.title} — TechnoShows` : "Watch Movie — TechnoShows";
    return {
      meta: [
        { title },
        { name: "description", content: movie?.overview?.slice(0, 155) || "Watch movies on TechnoShows." },
      ],
    };
  },
  component: MoviePage,
});

function MoviePage() {
  const data = Route.useLoaderData();
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!data.ok) return <div className="px-4 pt-32"><DataNotice reason={data.reason} /></div>;

  const movie = data.movie;
  const url = activeProvider?.buildEmbedUrl(movie.id, 0, 1, "movie", "eng") ?? null;
  const valid = url ? isSafeEmbedUrl(url) : false;

  return (
    <main className="mx-auto max-w-[1400px] px-4 pt-24 md:px-10">
      <div className="flex flex-col gap-5 sm:flex-row">
        {movie.poster_path && <img src={img(movie.poster_path, "w342")!} alt={movie.title} className="hidden w-32 rounded-xl ring-1 ring-border sm:block" />}
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-extrabold md:text-4xl">{movie.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{year(movie.release_date)}</span><span>•</span><Rating value={movie.vote_average} />
            {movie.runtime ? <><span>•</span><span>{movie.runtime} min</span></> : null}
          </div>
          {movie.genres?.length ? <p className="mt-2 text-sm text-muted-foreground">{movie.genres.map((genre) => genre.name).join(", ")}</p> : null}
          <p className="mt-3 max-w-3xl text-sm text-foreground/80">{movie.overview || "No overview available."}</p>
        </div>
      </div>

      <section id="player" className="relative mt-8 aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-border">
        {url && valid && !failed ? (
          <iframe
            src={url}
            title={`Watch ${movie.title}`}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
            referrerPolicy="origin"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        ) : null}
        {(!url || !valid || failed) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <Play className="h-10 w-10 text-primary" />
            <h2 className="mt-3 text-xl font-semibold">Player unavailable</h2>
            <p className="mt-2 max-w-lg text-sm text-muted-foreground">ScreenScape may not have this movie available, or it may block embedding. Try opening the provider directly.</p>
            {url && valid && <a href={url} target="_blank" rel="noreferrer" className={`${btn.primary} mt-4`}><ExternalLink className="h-4 w-4" />Open ScreenScape</a>}
          </div>
        )}
        {url && valid && !failed && (
          <button
            onClick={() => document.getElementById("player")?.requestFullscreen?.().catch(() => {})}
            aria-label="Fullscreen"
            className={`${btn.icon} absolute right-3 top-3 z-10 opacity-80`}
          ><Maximize className="h-4 w-4" /></button>
        )}
        {url && valid && !loaded && !failed && <p className="pointer-events-none absolute bottom-3 left-3 rounded bg-black/70 px-3 py-1 text-xs text-white">Loading player…</p>}
      </section>
      <p className="mt-3 text-xs text-muted-foreground">Playback is provided by ScreenScape. Availability depends on the provider.</p>
    </main>
  );
}
