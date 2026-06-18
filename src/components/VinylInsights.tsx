"use client";

import { VinylRecord } from "@/data/vinyls";
import { getCollectionSnapshot } from "@/lib/vinylAnalytics";
import { fetchVinylRecords } from "@/lib/vinylApi";
import { readQueuedVinyls } from "@/lib/vinylQueue";
import { Disc3 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type VinylInsightsProps = {
  records: VinylRecord[];
};

function BreakdownSection({
  title,
  items,
  totalCount,
  barColor = "bg-gray-950",
  linkBase,
}: {
  title: string;
  items: { label: string; count: number }[];
  totalCount: number;
  barColor?: string;
  linkBase?: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const topCount = items[0]?.count ?? 1;
  const visible = showAll ? items : items.slice(0, 8);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold text-gray-950 sm:text-xl">{title}</h2>
      <div className="mt-5 space-y-3">
        {visible.map((item) => {
          const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
          const inner = (
            <>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs sm:text-sm">
                <span className="truncate font-medium text-gray-900">{item.label}</span>
                <span className="shrink-0 tabular-nums text-gray-500">
                  {item.count} · {pct}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full ${barColor}`}
                  style={{ width: `${(item.count / topCount) * 100}%` }}
                />
              </div>
            </>
          );

          if (linkBase) {
            return (
              <Link
                key={item.label}
                href={`${linkBase}${encodeURIComponent(item.label)}`}
                className="block -mx-2 rounded-md px-2 py-1 transition-colors hover:bg-gray-50"
              >
                {inner}
              </Link>
            );
          }

          return <div key={item.label}>{inner}</div>;
        })}
      </div>
      {items.length > 8 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 text-xs font-medium text-gray-400 transition-colors hover:text-gray-700"
        >
          {showAll ? "Show less" : `Show all ${items.length}`}
        </button>
      )}
    </section>
  );
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 700;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [value]);

  return <>{displayValue}</>;
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

  const recentlyAdded = useMemo(
    () =>
      [...allRecords]
        .filter((r) => r.dateAdded)
        .sort((a, b) => (b.dateAdded ?? "").localeCompare(a.dateAdded ?? ""))
        .slice(0, 5),
    [allRecords],
  );

  const genreTotal = snapshot.genreBreakdown.reduce((s, i) => s + i.count, 0);
  const moodTotal = snapshot.moodBreakdown.reduce((s, i) => s + i.count, 0);

  const topRealArtist = snapshot.artistBreakdown.find(
    (a) => a.label.toLowerCase() !== "various artists",
  );

  const genrePct =
    allRecords.length > 0 ? Math.round((snapshot.topGenre.count / allRecords.length) * 100) : 0;
  const dna =
    allRecords.length > 0
      ? `${genrePct}% of the collection is ${snapshot.topGenre.value}, led by ${topRealArtist?.label ?? snapshot.topArtist.value}, mostly from the ${snapshot.topReleaseEra.value}.`
      : "";

  const statCards = [
    { label: "Records", value: allRecords.length },
    { label: "Artists", value: snapshot.artists },
    { label: "Genres", value: snapshot.genres },
    { label: "Favorites", value: snapshot.favorites },
    { label: "Owned", value: snapshot.owned },
    { label: "Wishlist", value: snapshot.wishlist },
    { label: "Upgrades", value: snapshot.upgrade },
    { label: "Formats", value: snapshot.formats },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-gray-500">
            Collection analytics
          </p>
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
          className="inline-flex w-fit shrink-0 rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
        >
          Back to catalog
        </Link>
      </div>

      {/* Collection DNA */}
      {dna && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Collection DNA
          </p>
          <p className="text-sm leading-relaxed text-gray-700 sm:text-base">{dna}</p>
        </div>
      )}

      {/* Stats — unified 8-card grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {statCards.map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-2 text-xl font-semibold text-gray-950 sm:text-2xl">
              <AnimatedNumber value={value} />
            </p>
          </div>
        ))}
      </div>

      {/* Recently Added */}
      {recentlyAdded.length > 0 && (
        <div>
          <h2 className="mb-4 text-base font-semibold text-gray-950 sm:text-lg">Recently added</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {recentlyAdded.map((record) => (
              <Link
                key={record.id}
                href={`/vinyl/${record.id}`}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-colors hover:border-gray-400"
              >
                <div className="aspect-square bg-gray-100">
                  {record.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={record.coverImage}
                      alt={record.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Disc3 className="h-10 w-10 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <div className="truncate text-sm font-semibold text-gray-900">{record.title}</div>
                  <div className="mt-0.5 truncate text-xs text-gray-500">{record.artist}</div>
                  {record.dateAdded && (
                    <div className="mt-1 text-[10px] text-gray-400">
                      {new Date(record.dateAdded).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Breakdowns */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BreakdownSection
          title="By genre"
          items={snapshot.genreBreakdown}
          totalCount={genreTotal}
          barColor="bg-teal-500"
          linkBase="/vinyl?genre="
        />
        <BreakdownSection
          title="Top artists"
          items={snapshot.artistBreakdown}
          totalCount={allRecords.length}
          barColor="bg-blue-500"
        />
        <BreakdownSection
          title="By release decade"
          items={snapshot.releaseDecadeBreakdown}
          totalCount={allRecords.length}
          barColor="bg-amber-500"
          linkBase="/vinyl?decade="
        />
        <BreakdownSection
          title="By recording decade"
          items={snapshot.recordingDecadeBreakdown}
          totalCount={allRecords.length}
          barColor="bg-orange-400"
        />
        <BreakdownSection
          title="By format"
          items={snapshot.formatBreakdown}
          totalCount={allRecords.length}
          barColor="bg-purple-500"
        />
        <BreakdownSection
          title="By label"
          items={snapshot.labelBreakdown}
          totalCount={allRecords.length}
          barColor="bg-rose-500"
        />
        <BreakdownSection
          title="Top moods"
          items={snapshot.moodBreakdown}
          totalCount={moodTotal}
          barColor="bg-violet-500"
          linkBase="/vinyl?mood="
        />
        <BreakdownSection
          title="By status"
          items={snapshot.statusBreakdown}
          totalCount={allRecords.length}
          barColor="bg-slate-500"
        />
      </div>
    </div>
  );
}
