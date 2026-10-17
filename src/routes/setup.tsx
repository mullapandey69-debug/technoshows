import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "Setup Guide — TechnoShows" },
      { name: "description", content: "Connect show data and an authorized video provider to TechnoShows." },
      { property: "og:title", content: "Setup Guide — TechnoShows" },
      { property: "og:description", content: "How to configure TechnoShows." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Setup,
});

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">Step {n}</p>
      <h2 className="mt-1 text-xl font-semibold">{title}</h2>
      <div className="mt-3 space-y-2 text-sm text-foreground/80">{children}</div>
    </div>
  );
}

function Setup() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 pt-28">
      <h1 className="text-3xl font-extrabold">Setup guide</h1>
      <p className="text-muted-foreground">Show data and the ScreenScape player are connected.</p>
      <Step n={1} title="Show data (TMDB) — required">
        <p>Create a free account at themoviedb.org, then open Settings → API and request a key (choose “Developer”).</p>
        <p>Copy either the <b>API Key</b> or the <b>API Read Access Token</b> and give it to the TechnoShows builder in chat. It's stored securely on the server as <code className="rounded bg-muted px-1">TMDB_API_KEY</code> and never shown in the page.</p>
      </Step>
      <Step n={2} title="Video provider — ScreenScape connected">
        <p>The website owner authorized nxsha.screenscape.me and supplied its episode player link. Episodes use their TMDB show ID, season and episode, with English selected.</p>
        <p>Playback depends on ScreenScape’s available videos and whether its security settings allow the embedded player to load.</p>
      </Step>
      <Step n={3} title="Publishing">
        <p>Use the Publish button in the editor to put TechnoShows online for free on a lovable.app address, or connect your own domain.</p>
      </Step>
    </div>
  );
}
