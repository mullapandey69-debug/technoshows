import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Show, ShowDetail, SeasonDetail, TmdbResult } from "./tmdb-types";

async function tmdb<T>(path: string, params: Record<string, string> = {}): Promise<TmdbResult<T>> {
  const key = process.env['TMDB_API_KEY'];
  if (!key) return { ok: false, reason: "not_configured" };
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  const headers: Record<string, string> = { accept: "application/json" };
  // v4 read tokens are long JWTs; v3 keys are 32 hex chars.
  if (key.length > 40) headers['Authorization'] = `Bearer ${key}`;
  else url.searchParams.set("api_key", key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  try {
    const res = await fetch(url.toString(), { headers });
    if (res.status === 401) return { ok: false, reason: "bad_key" };
    if (res.status === 404) return { ok: false, reason: "not_found" };
    if (!res.ok) return { ok: false, reason: "error" };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, reason: "error" };
  }
}

type List = { results: Show[] };
type CatalogItem = {
  id: number;
  media_type: "movie" | "tv";
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  vote_average: number;
};
type MultiSearchItem =
  | (Show & { media_type: "tv" })
  | { id: number; media_type: "movie"; title: string; overview: string; poster_path: string | null; backdrop_path: string | null; release_date?: string; vote_average: number }
  | { media_type: "person" };

export const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const [trending, popular, recent, recommended] = await Promise.all([
    tmdb<List>("/trending/tv/week"),
    tmdb<List>("/tv/popular"),
    tmdb<List>("/tv/on_the_air"),
    tmdb<List>("/tv/top_rated"),
  ]);
  if (!trending.ok) return { ok: false as const, reason: trending.reason };
  const pick = (r: TmdbResult<List>) => (r.ok ? r.data.results.filter((s) => s.poster_path) : []);
  return {
    ok: true as const,
    trending: pick(trending),
    popular: pick(popular),
    recent: pick(recent),
    recommended: pick(recommended),
  };
});

export const searchShows = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ q: z.string().trim().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const r = await tmdb<List>("/search/tv", { query: data.q, include_adult: "false" });
    if (!r.ok) return { ok: false as const, reason: r.reason };
    return { ok: true as const, results: r.data.results };
  });

// Search movies and TV shows together for the Browse/Search page.
// Keep the existing TV-only search function above for compatibility with other callers.
export const searchCatalog = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ q: z.string().trim().min(1).max(100) }).parse(d))
  .handler(async ({ data }) => {
    const r = await tmdb<{ results: MultiSearchItem[] }>("/search/multi", {
      query: data.q,
      include_adult: "false",
      page: "1",
    });
    if (!r.ok) return { ok: false as const, reason: r.reason };
    const results: CatalogItem[] = r.data.results.flatMap((item) => {
      if (item.media_type === "tv") {
        return [{
          id: item.id,
          media_type: "tv" as const,
          name: item.name,
          overview: item.overview,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          ...(item.first_air_date ? { first_air_date: item.first_air_date } : {}),
          vote_average: item.vote_average,
        }];
      }
      if (item.media_type === "movie") {
        return [{
          id: item.id,
          media_type: "movie" as const,
          name: item.title,
          overview: item.overview,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          ...(item.release_date ? { first_air_date: item.release_date } : {}),
          vote_average: item.vote_average,
        }];
      }
      return [];
    });
    return { ok: true as const, results };
  });

export const getShow = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.number().int().positive() }).parse(d))
  .handler(async ({ data }) => {
    const r = await tmdb<ShowDetail>(`/tv/${data.id}`, { append_to_response: "recommendations" });
    if (!r.ok) return { ok: false as const, reason: r.reason };
    return { ok: true as const, show: r.data };
  });

export const getMovie = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.number().int().positive() }).parse(d))
  .handler(async ({ data }) => {
    const r = await tmdb<{
      id: number;
      title: string;
      overview: string;
      poster_path: string | null;
      backdrop_path: string | null;
      release_date?: string;
      vote_average: number;
      runtime?: number;
      genres?: { id: number; name: string }[];
    }>(`/movie/${data.id}`);
    if (!r.ok) return { ok: false as const, reason: r.reason };
    return { ok: true as const, movie: r.data };
  });

export const getSeason = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.number().int().positive(), season: z.number().int().min(0) }).parse(d))
  .handler(async ({ data }) => {
    const r = await tmdb<SeasonDetail>(`/tv/${data.id}/season/${data.season}`);
    if (!r.ok) return { ok: false as const, reason: r.reason };
    return { ok: true as const, season: r.data };
  });
