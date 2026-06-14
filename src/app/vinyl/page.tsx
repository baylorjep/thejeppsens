import Header from "@/components/Header";
import VinylCatalog from "@/components/VinylCatalog";
import { vinyls } from "@/data/vinyls";

export default function VinylPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
            Isabel&apos;s collection
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-950 sm:text-6xl">
            Vinyl catalog
          </h1>
          <p className="mt-5 text-base leading-7 text-gray-600 sm:text-lg">
            A simple place to keep track of the records she already has, favorites, pressings,
            and notes for future gifts.
          </p>
        </div>
        <VinylCatalog records={vinyls} />
      </section>
    </main>
  );
}
