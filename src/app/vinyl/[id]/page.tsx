import Header from "@/components/Header";
import VinylAlbumDetail from "@/components/VinylAlbumDetail";
import { vinyls } from "@/data/vinyls";

export default async function VinylAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <VinylAlbumDetail id={id} staticRecords={vinyls} />
      </section>
    </main>
  );
}
