import Header from "@/components/Header";
import VinylCatalog from "@/components/VinylCatalog";
import { vinyls } from "@/data/vinyls";
import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function VinylPage() {
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
          <div className="flex items-center gap-3">
            <Link
              href="/vinyl/insights"
              className="inline-flex w-fit items-center gap-2 rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:border-gray-500"
            >
              <Sparkles className="h-4 w-4" />
              Analytics
            </Link>
            <Link
              href="/vinyl/manage"
              className="inline-flex w-fit rounded-md bg-gray-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
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
