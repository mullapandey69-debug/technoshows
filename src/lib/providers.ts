
/**
 * ScreenScape embed provider for TechnoShows.
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
    id: "screenscape",
    name: "ScreenScape",

    buildEmbedUrl(
      tmdbId,
      season,
      episode,
      type = "tv",
      language = "eng"
    ) {
      if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
        return null;
      }

      const url = new URL(
        "https://nxsha.screenscape.me/embed"
      );

      const params = new URLSearchParams({
        tmdb: String(tmdbId),
        type,
        lan: language,
      });

      if (type === "tv") {
        if (
          !Number.isInteger(season) ||
          season < 0 ||
          !Number.isInteger(episode) ||
          episode <= 0
        ) {
          return null;
        }

        params.set("s", String(season));
        params.set("e", String(episode));
      }

      url.search = params.toString();
      return url.href;
    },
  },
];

export const activeProvider = providers[0] ?? null;

export function isSafeEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);

    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "nxsha.screenscape.me"
    );
  } catch {
    return false;
  }
}
