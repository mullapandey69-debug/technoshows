import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useLibrary, useProgress } from "@/lib/library";
import { ShowCard, btn } from "@/components/ui-kit";

export const Route = createFileRoute("/my-list")({
  head: () => ({
    meta: [
      { title: "My List — TechnoShows" },
      { name: "description", content: "Your watchlist, favourites and recently watched shows." },
      { property: "og:title", content: "My List — TechnoShows" },
      { property: "og:description", content: "Your saved shows on TechnoShows." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyList,
});

function MyList() {
  const { user, loading } = useAuth();
  const lib = useLibrary();
  const prog = useProgress();
  if (loading) return <div className="px-4 pt-32"><div className="skeleton mx-auto h-40 max-w-xl rounded-2xl" /></div>;
  if (!user) return (
    <div className="px-4 pt-32 text-center">
      <h1 className="text-2xl font-bold">Your list lives here</h1>
      <p className="mt-2 text-muted-foreground">Sign in to save shows and keep track of what you've watched.</p>
      <Link to="/auth" className={`${btn.primary} mt-6`}>Sign in</Link>
    </div>
  );
  const sections = [
    { title: "Watchlist", items: lib.data?.filter((r) => r.kind === "watchlist") ?? [] },
    { title: "Favourites", items: lib.data?.filter((r) => r.kind === "favorite") ?? [] },
    { title: "Recently watched", items: prog.data ?? [] },
  ];
  return (
    <div className="mx-auto max-w-[1500px] space-y-12 px-4 pt-28 md:px-10">
      {sections.map((s) => (
        <section key={s.title}>
          <h2 className="mb-4 text-xl font-semibold">{s.title}</h2>
          {lib.isLoading ? <div className="skeleton h-60 rounded-xl" /> : s.items.length === 0 ? (
            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nothing here yet. <Link to="/search" className="text-primary hover:underline">Find a show</Link></p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 [&>a]:w-full">
              {s.items.map((r) => <ShowCard key={r.show_id} show={{ id: r.show_id, name: r.title, poster_path: r.poster_path }} />)}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
