import Header from "@/components/Header";
import ResearchBoard from "@/components/ResearchBoard";
import { vinyls } from "@/data/vinyls";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Baylor & Isabel - Vinyl Research",
  description: "Records we might want next, based on what we already own and love.",
};

export default function VinylResearchPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <ResearchBoard records={vinyls} />
      </section>
    </main>
  );
}
