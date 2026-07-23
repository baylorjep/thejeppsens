import Header from "@/components/Header";
import VinylAlbumDetail from "@/components/VinylAlbumDetail";
import { vinyls } from "@/data/vinyls";
import { listSupabaseVinylRecords } from "@/lib/supabaseVinylServer";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  let record = vinyls.find((vinyl) => vinyl.id === id);
  try {
    const liveRecords = await listSupabaseVinylRecords();
    const liveRecord = liveRecords?.find((vinyl) => vinyl.id === id);
    if (liveRecord) record = liveRecord;
  } catch (error) {
    console.error("Could not load live vinyl record for metadata", error);
  }

  if (!record) {
    return { title: "Baylor & Isabel - Vinyl" };
  }

  return {
    title: `Baylor & Isabel - ${record.title}`,
    description: `${record.title} by ${record.artist}`,
    openGraph: record.coverImage
      ? { images: [{ url: record.coverImage, alt: `${record.title} cover art` }] }
      : undefined,
    twitter: record.coverImage
      ? { card: "summary_large_image", images: [record.coverImage] }
      : undefined,
  };
}

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
