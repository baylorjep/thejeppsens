import Header from "@/components/Header";
import DiscogsMatcher from "@/components/DiscogsMatcher";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Baylor & Isabel - Match to Discogs",
  description: "Bulk-link vinyl records to Discogs releases.",
};

export default function DiscogsMatchPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <DiscogsMatcher />
      </section>
    </main>
  );
}
