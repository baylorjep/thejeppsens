"use client";

import { VinylRecord } from "@/data/vinyls";
import { getCollectionSnapshot } from "@/lib/vinylAnalytics";
import { fetchVinylRecords } from "@/lib/vinylApi";
import { readQueuedVinyls } from "@/lib/vinylQueue";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type VinylInsightsProps = {
  records: VinylRecord[];
};

function BreakdownSection({
  title,
  items,
}: {
  title: string;
  items: { label: string; count: number }[];
}) {
  const topCount = items[0]?.count ?? 1;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-xl font-semibold text-gray-950">{title}</h2>
      <div className="mt-5 space-y-3">
        {items.slice(0, 8).map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-gray-900">{item.label}</span>
              <span className="shrink-0 text-gray-500">{item.count}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-gray-950"
                style={{ width: `${(item.count / topCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function VinylInsights({ records }: VinylInsightsProps) {
  const [allRecords, setAllRecords] = useState(records);

  useEffect(() => {
    const queuedRecords = readQueuedVinyls();
    fetchVinylRecords()
      .then((response) => {
        setAllRecords(response.source === "supabase" ? response.records : [...response.records, ...queuedRecords]);
      })
      .catch(() => setAllRecords([...records, ...queuedRecords]));
  }, [records]);

  const snapshot = useMemo(() => getCollectionSnapshot(allRecords), [allRecords]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-gray-500">Collection analytics</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">
            Vinyl insights
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600 sm:text-lg">
            A deeper look at the shape of Isabel&apos;s collection, from decades and genres to the
            artists and moods that show up the most.
          </p>
        </div>
        <Link
          href="/vinyl"
          className="inline-flex w-fit rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
        >
          Back to catalog
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Records", allRecords.length],
          ["Artists", snapshot.artists],
          ["Genres", snapshot.genres],
          ["Favorites", snapshot.favorites],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-950 sm:text-3xl">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Owned", value: snapshot.owned },
          { label: "Wishlist", value: snapshot.wishlist },
          { label: "Upgrades", value: snapshot.upgrade },
          { label: "Formats", value: snapshot.formats },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-950 sm:text-3xl">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Top label", value: snapshot.topLabel.value, sublabel: `${snapshot.topLabel.count} records` },
          { label: "Top format", value: snapshot.topFormat.value, sublabel: `${snapshot.topFormat.count} records` },
          {
            label: "Top release era",
            value: snapshot.topReleaseEra.value,
            sublabel: `${snapshot.topReleaseEra.count} records`,
          },
          {
            label: "Top recording era",
            value: snapshot.topRecordingEra.value,
            sublabel: `${snapshot.topRecordingEra.count} records`,
          },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="mt-2 text-lg font-semibold text-gray-950">{item.value}</p>
            <p className="mt-1 text-sm text-gray-500">{item.sublabel}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownSection title="By recording decade" items={snapshot.recordingDecadeBreakdown} />
        <BreakdownSection title="By release decade" items={snapshot.releaseDecadeBreakdown} />
        <BreakdownSection title="By genre" items={snapshot.genreBreakdown} />
        <BreakdownSection title="By format" items={snapshot.formatBreakdown} />
        <BreakdownSection title="By label" items={snapshot.labelBreakdown} />
        <BreakdownSection title="Top artists" items={snapshot.artistBreakdown} />
        <BreakdownSection title="Top moods" items={snapshot.moodBreakdown} />
        <BreakdownSection title="By status" items={snapshot.statusBreakdown} />
      </div>
    </div>
  );
}
