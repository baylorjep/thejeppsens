import Header from "@/components/Header";
import VinylInsights from "@/components/VinylInsights";
import { vinyls } from "@/data/vinyls";

export default function VinylInsightsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <VinylInsights records={vinyls} />
      </section>
    </main>
  );
}
