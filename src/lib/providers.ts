/**
 * Supported third-party embed providers.
 * Provider identities stay internal; the player UI shows generic server labels.
 */
export interface EmbedProvider {
  id: string;
  name: string;
  buildEmbedUrl(
    tmdbId: number,
    season: number,
    episode: number,
    type?: "movie" | "tv",
    language?: string
  ): string | null;
}

export const providers: EmbedProvider[] = [
  {
    id: "vidrift",
    name: "Server 1",
    buildEmbedUrl(tmdbId, season, episode, type = "tv") {
      if (!Number.isInteger(tmdbId) || tmdbId <= 0) return null;
      if (type === "tv") {
        if (!Number.isInteger(season) || season < 0 || !Number.isInteger(episode) || episode <= 0) return null;
        return `https://embed.vidrift.net/embed/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://embed.vidrift.net/embed/movie/${tmdbId}`;
    },
  },
  {
    id: "vidora",
    name: "Server 2",
    buildEmbedUrl(tmdbId, season, episode, type = "tv") {
      if (!Number.isInteger(tmdbId) || tmdbId <= 0) return null;
      if (type === "tv") {
        if (!Number.isInteger(season) || season < 0 || !Number.isInteger(episode) || episode <= 0) return null;
        return `https://vidora.ac/tv/${tmdbId}/${season}/${episode}`;
      }
      return `https://vidora.ac/movie/${tmdbId}`;
    },
  },
  {
    id: "screenscape",
    name: "Server 3",
    buildEmbedUrl(tmdbId, season, episode, type = "tv", language = "eng") {
      if (!Number.isInteger(tmdbId) || tmdbId <= 0) return null;
      const url = new URL("https://web.screenscape.fun/embed");
      const params = new URLSearchParams({
        tmdb: String(tmdbId),
        type,
        lan: language,
      });
      if (type === "tv") {
        if (!Number.isInteger(season) || season < 0 || !Number.isInteger(episode) || episode <= 0) return null;
        params.set("s", String(season));
        params.set("e", String(episode));
      }
      url.search = params.toString();
      return url.href;
    },
  },
];

export const activeProvider = providers[0] ?? null;

const safeEmbedHosts = new Set(["web.screenscape.fun", "embed.vidrift.net", "vidora.ac"]);

export function isSafeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && safeEmbedHosts.has(parsed.hostname);
  } catch {
    return false;
  }
}
