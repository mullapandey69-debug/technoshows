import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search as SearchIcon, Loader2, Film } from "lucide-react";
import { z } from "zod";
import { searchCatalog, getHome } from "@/lib/tmdb.functions";
import { ShowCard, DataNotice } from "@/components/ui-kit";
import { img, year, type Show } from "@/lib/tmdb-types";

type CatalogResult = {
  id: number;
  media_type: "movie" | "tv";
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  vote_average: number;
};

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Search Movies & TV Shows — TechnoShows" },
      { name: "description", content: "Search movies and TV shows on TechnoShows." },
      { property: "og:title", content: "Search — TechnoShows" },
      { property: "og:description", content: "Find movies and TV shows by title." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

const suggestions = ["Breaking Bad", "The Last of Us", "Severance", "Stranger Things", "The Bear", "Shōgun", "Dune", "Inception"];

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [text, setText] = useState(q);
  const [debounced, setDebounced] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => {
      const value = text.trim();
      setDebounced(value);
      navigate({ search: value ? { q: value } : {}, replace: true });
    }, 350);
    return () => clearTimeout(t);
  }, [text, navigate]);

  const res = useQuery({
    queryKey: ["catalog-search", debounced],
    enabled: debounced.length > 0,
    queryFn: () => searchCatalog({ data: { q: debounced } }),
  });
  const popular = useQuery({
    queryKey: ["home"],
    enabled: debounced.length === 0,
    queryFn: () => getHome(),
    staleTime: 600_000,
  });

  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-28 md:px-10">
      <label className="relative block">
        <span className="sr-only">Search movies and TV shows</span>
        <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Search movies and TV shows…"
          className="h-14 w-full rounded-full border bg-card pl-14 pr-12 text-base outline-none transition focus:border-primary"
        />
        {res.isFetching && <Loader2 className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-primary" />}
      </label>

      {!debounced && (
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} onClick={() => setText(s)} className="rounded-full border bg-secondary/60 px-4 py-1.5 text-sm hover:border-primary">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10">
        {debounced ? (
          res.isLoading ? <Grid>{Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton aspect-[2/3] rounded-xl" />)}</Grid>
          : res.isError ? <DataNotice reason="error" />
          : res.data && !res.data.ok ? <DataNotice reason={res.data.reason} />
          : res.data?.ok && res.data.results.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg font-semibold">No movies or shows match “{debounced}”</p>
              <p className="mt-1 text-sm text-muted-foreground">Check the spelling or try a different title.</p>
            </div>
          ) : res.data?.ok ? (
            <>
              <p className="mb-4 text-sm text-muted-foreground">{res.data.results.length} results · Movies and TV shows</p>
              <Grid>
                {res.data.results.map((item) => <CatalogCard key={`${item.media_type}-${item.id}`} item={item} />)}
              </Grid>
            </>
          ) : null
        ) : popular.data && !popular.data.ok ? <DataNotice reason={popular.data.reason} />
          : popular.data?.ok ? (
            <>
              <h2 className="mb-4 text-lg font-semibold">Popular TV shows right now</h2>
              <Grid>{popular.data.popular.slice(0, 18).map((s) => <ShowCard key={s.id} show={s} />)}</Grid>
              <p className="mt-5 text-sm text-muted-foreground">Search above to find movies and more TV shows.</p>
            </>
          ) : null}
      </div>
    </div>
  );
}

function CatalogCard({ item }: { item: CatalogResult }) {
  const src = img(item.poster_path, "w342");
  const show: Show = {
    id: item.id,
    name: item.name,
    overview: item.overview,
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    ...(item.first_air_date ? { first_air_date: item.first_air_date } : {}),
    vote_average: item.vote_average,
  };

  // Existing show cards retain their existing detail/player route. Movies are
  // shown as search results only; do not send them into the TV episode player.
  if (item.media_type === "tv") return <ShowCard show={show} />;

  return (
    <article className="group block w-full min-w-0">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-muted shadow-card ring-1 ring-border transition duration-300 group-hover:ring-primary/60">
        {src ? <img src={src} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          : <div className="flex h-full items-center justify-center p-3 text-center text-xs text-muted-foreground">{item.name}</div>}
        <div className="absolute left-2 top-2 flex items-center gap-1 rounded-md bg-background/85 px-1.5 py-1 text-[11px] backdrop-blur">
          <Film className="h-3 w-3" /> Movie
        </div>
        <div className="absolute right-2 top-2 rounded-md bg-background/85 px-1.5 py-0.5 text-[11px] backdrop-blur">
          ★ {item.vote_average ? item.vote_average.toFixed(1) : "N/A"}
        </div>
      </div>
      <p className="mt-2 truncate text-sm font-medium" title={item.name}>{item.name}</p>
      <p className="text-xs text-muted-foreground">{year(item.first_air_date)} · Movie</p>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.overview || "No overview available."}</p>
    </article>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 [&>a]:w-full">{children}</div>;
}
