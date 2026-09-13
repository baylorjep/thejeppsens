import Header from "@/components/Header";
import AchievementsBoard from "@/components/AchievementsBoard";
import { vinyls } from "@/data/vinyls";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Baylor & Isabel - Vinyl Achievements",
  description: "Milestones unlocked across our vinyl collection.",
};

export default function VinylAchievementsPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <AchievementsBoard records={vinyls} />
      </section>
    </main>
  );
}
