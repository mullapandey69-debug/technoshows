import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { getShowsByProvider, getStreamingProviders } from "@/lib/tmdb.functions";
import { DataNotice, ShowCard, btn } from "@/components/ui-kit";

export const Route = createFileRoute("/platforms/$providerId")({
  validateSearch: (search: Record<string, unknown>) => ({ name: typeof search.name === "string" ? search.name : "Streaming platform" }),
  component: PlatformPage,
});

function PlatformPage() {
  const { providerId } = Route.useParams();
  const { name } = Route.useSearch();
  const id = Number(providerId);
  const providers = useQuery({ queryKey: ["streaming-providers", "IN"], queryFn: () => getStreamingProviders(), staleTime: 60 * 60_000 });
  const shows = useQuery({ queryKey: ["platform-shows", id, "IN"], enabled: Number.isInteger(id) && id > 0, queryFn: () => getShowsByProvider({ data: { providerId: id } }), staleTime: 10 * 60_000 });
  const provider = providers.data?.ok ? providers.data.results.find((item) => item.provider_id === id) : undefined;
  return <main className="mx-auto min-h-screen max-w-[1500px] px-4 pb-16 pt-28 md:px-10">
    <Link to="/" className={btn.ghost + " mb-8"}><ArrowLeft className="h-4 w-4" />Home</Link>
    <div className="mb-8 flex items-center gap-4">{provider?.logo_path && <img src={"https://image.tmdb.org/t/p/w185" + provider.logo_path} alt="" className="h-16 w-16 rounded-2xl bg-white object-contain p-2" />}<div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Now streaming in India</p><h1 className="mt-1 text-3xl font-bold">{provider?.provider_name ?? name}</h1><p className="mt-1 text-sm text-muted-foreground">Popular TV shows available on this platform</p></div></div>
    {shows.isLoading ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton aspect-[2/3] rounded-xl" />)}</div> : shows.isError ? <DataNotice reason="error" /> : shows.data && !shows.data.ok ? <DataNotice reason={shows.data.reason} /> : shows.data?.ok && shows.data.results.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{shows.data.results.map((show) => <ShowCard key={show.id} show={show} />)}</div> : <p className="py-16 text-center text-muted-foreground">No shows found for this platform in India right now.</p>}
  </main>;
}
