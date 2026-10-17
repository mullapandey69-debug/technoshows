import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search as SearchIcon, Loader2 } from "lucide-react";
import { z } from "zod";
import { searchShows, getHome } from "@/lib/tmdb.functions";
import { ShowCard, DataNotice } from "@/components/ui-kit";

export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().optional() }),
  head: () => ({
    meta: [
      { title: "Search TV Shows — TechnoShows" },
      { name: "description", content: "Search thousands of TV shows on TechnoShows." },
      { property: "og:title", content: "Search — TechnoShows" },
      { property: "og:description", content: "Find any TV show by title." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

const suggestions = ["Breaking Bad", "The Last of Us", "Severance", "Stranger Things", "The Bear", "Shōgun"];

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [text, setText] = useState(q);
  const [debounced, setDebounced] = useState(q);
  useEffect(() => {
    const t = setTimeout(() => { setDebounced(text.trim()); navigate({ search: text.trim() ? { q: text.trim() } : {}, replace: true }); }, 350);
    return () => clearTimeout(t);
  }, [text, navigate]);

  const res = useQuery({ queryKey: ["search", debounced], enabled: debounced.length > 0, queryFn: () => searchShows({ data: { q: debounced } }) });
  const popular = useQuery({ queryKey: ["home"], enabled: debounced.length === 0, queryFn: () => getHome(), staleTime: 600_000 });

  return (
    <div className="mx-auto max-w-[1500px] px-4 pt-28 md:px-10">
      <label className="relative block">
        <span className="sr-only">Search shows</span>
        <SearchIcon className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Search for a TV show…" className="h-14 w-full rounded-full border bg-card pl-14 pr-12 text-base outline-none transition focus:border-primary" />
        {res.isFetching && <Loader2 className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-primary" />}
      </label>
      {!debounced && (
        <div className="mt-4 flex flex-wrap gap-2">
          {suggestions.map((s) => <button key={s} onClick={() => setText(s)} className="rounded-full border bg-secondary/60 px-4 py-1.5 text-sm hover:border-primary">{s}</button>)}
        </div>
      )}

      <div className="mt-10">
        {debounced ? (
          res.isLoading ? <Grid>{Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton aspect-[2/3] rounded-xl" />)}</Grid>
          : res.isError ? <DataNotice reason="error" />
          : res.data && !res.data.ok ? <DataNotice reason={res.data.reason} />
          : res.data?.ok && res.data.results.length === 0 ? (
            <div className="py-20 text-center"><p className="text-lg font-semibold">No shows match “{debounced}”</p><p className="mt-1 text-sm text-muted-foreground">Check the spelling or try a different title.</p></div>
          ) : res.data?.ok ? (
            <>
              <p className="mb-4 text-sm text-muted-foreground">{res.data.results.length} results</p>
              <Grid>{res.data.results.map((s) => <ShowCard key={s.id} show={s} />)}</Grid>
            </>
          ) : null
        ) : popular.data && !popular.data.ok ? <DataNotice reason={popular.data.reason} />
          : popular.data?.ok ? (<><h2 className="mb-4 text-lg font-semibold">Popular right now</h2><Grid>{popular.data.popular.slice(0, 18).map((s) => <ShowCard key={s.id} show={s} />)}</Grid></>) : null}
      </div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 [&>a]:w-full">{children}</div>;
}
