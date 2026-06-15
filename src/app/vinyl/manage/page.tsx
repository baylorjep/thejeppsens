import Header from "@/components/Header";
import VinylManager from "@/components/VinylManager";
import Link from "next/link";

export default function VinylManagePage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
              Vinyl queue
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-950 sm:text-6xl">
              Add records
            </h1>
            <p className="mt-5 text-base leading-7 text-gray-600 sm:text-lg">
              Start with front and back cover photos, fill in the details, and save records straight
              into the collection.
            </p>
          </div>
          <Link
            href="/vinyl"
            className="inline-flex w-fit rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
          >
            View catalog
          </Link>
        </div>

        <VinylManager />
      </section>
    </main>
  );
}
