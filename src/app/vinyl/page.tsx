import Header from "@/components/Header";
import VinylCatalog from "@/components/VinylCatalog";
import { vinyls } from "@/data/vinyls";
import { listSupabaseVinylRecords } from "@/lib/supabaseVinylServer";
import { Compass, Sparkles, Trophy } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Baylor & Isabel - Vinyl Catalog",
  description: "Isabel's vinyl collection.",
};

export const dynamic = "force-dynamic";

export default async function VinylPage() {
  let records = vinyls;
  try {
    const liveRecords = await listSupabaseVinylRecords();
    if (liveRecords) records = liveRecords;
  } catch {
    // Fall back to the seed data; VinylCatalog will retry the live fetch client-side.
  }
  const needsIdentification = records.some((record) => record.status === "owned" && !record.discogsVerified);

  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
              Isabel&apos;s collection
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-950 sm:text-6xl">
              Vinyl catalog
            </h1>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            {needsIdentification ? (
              <Link href="/vinyl/identify" className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:border-gray-500">
                Identify pressings
              </Link>
            ) : null}
            <Link
              href="/vinyl/achievements"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-500 sm:w-fit"
            >
              <Trophy className="h-4 w-4" />
              Achievements
            </Link>
            <Link
              href="/vinyl/insights"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-500 sm:w-fit"
            >
              <Sparkles className="h-4 w-4" />
              Analytics
            </Link>
            <Link
              href="/vinyl/research"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-500 sm:w-fit"
            >
              <Compass className="h-4 w-4" />
              Research
            </Link>
            <Link
              href="/vinyl/manage"
              className="col-span-2 inline-flex items-center justify-center rounded-md bg-gray-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 sm:col-span-1 sm:w-fit"
            >
              Add records
            </Link>
          </div>
        </div>
        <VinylCatalog records={vinyls} />
      </section>
    </main>
  );
}
