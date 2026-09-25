"use client";

import { VinylRecord } from "@/data/vinyls";
import DonutChart from "@/components/DonutChart";
import { formatDiscogsMoney, useCollectionValue } from "@/lib/discogsClient";
import { getBreakdown, getCollectionSnapshot, getFormatGroup, getFoundCountry } from "@/lib/vinylAnalytics";
import { getVinylPersona } from "@/lib/vinylPersona";
import { getDecade, getPressRun, getRecordingDecade, getReleaseDecade, groupRecordsByArtist, isOriginalPressing } from "@/lib/vinylRecordUtils";
import { fetchVinylRecords } from "@/lib/vinylApi";
import { readQueuedVinyls } from "@/lib/vinylQueue";
import { Disc3, Dna } from "lucide-react";
import Link from "next/link";
import ArtistBingo from "@/components/ArtistBingo";
import CollectionTimeline from "@/components/CollectionTimeline";
import CrateMap from "@/components/CrateMap";
import {
  AGE_UNITS,
  DISTANCE_UNITS,
  HEIGHT_UNITS,
  RUNTIME_UNITS,
  VALUE_UNITS,
  WEIGHT_UNITS,
  describeCount,
  describeRuntime,
  formatCount,
  formatHeight,
  nounFor,
  randomIndexAvoiding,
  unitYears,
} from "@/lib/funComparisons";
import { useEffect, useMemo, useState } from "react";

type VinylInsightsProps = {
  records: VinylRecord[];
};

const RARITY_PAGE_SIZE = 10;
const DETAIL_PAGE_SIZE = 12;

function DetailPager({ page, pages, onPageChange }: { page: number; pages: number; onPageChange: (page: number) => void }) {
  if (pages <= 1) return null;
  return <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
    <button type="button" disabled={page === 0} onClick={() => onPageChange(page - 1)} className="rounded px-2 py-2 text-gray-700 hover:bg-gray-100 disabled:text-gray-300">Previous</button>
    <span>Page {page + 1} of {pages}</span>
    <button type="button" disabled={page >= pages - 1} onClick={() => onPageChange(page + 1)} className="rounded px-2 py-2 text-gray-700 hover:bg-gray-100 disabled:text-gray-300">Next</button>
  </div>;
}

// "Columbia", "Columbia Records" and "Columbia Masterworks" are one label family.
function labelFamily(label: string) {
  return label.split(" / ")[0].replace(/\s*\(.*?\)/g, "").replace(/\b(records?|recordings|masterworks|music)\b/gi, "").replace(/\s+/g, " ").trim();
}

// "US" reads as "in US" in a sentence; these need an article.
function placeName(country: string) {
  return /^(US|UK|USA|United States|United Kingdom)$/i.test(country) ? `the ${country}` : country;
}

function groupRecordsByLabel(records: VinylRecord[], getLabels: (record: VinylRecord) => string[]) {
  const grouped: Record<string, VinylRecord[]> = {};
  for (const record of records) {
    for (const label of getLabels(record)) {
      if (!label) continue;
      (grouped[label] ??= []).push(record);
    }
  }
  return grouped;
}

const MOVIE_MARATHONS = [
  { label: "the Harry Potter series", minutes: 1178 },
  { label: "the extended Lord of the Rings trilogy", minutes: 686 },
  { label: "the original Star Wars trilogy", minutes: 402 },
  { label: "the Toy Story movies", minutes: 385 },
  { label: "the Back to the Future trilogy", minutes: 342 },
  { label: "the Jurassic Park movies", minutes: 575 },
];

function formatRuntimeComparison(totalSeconds: number) {
  const totalMinutes = totalSeconds / 60;
  if (totalMinutes < 100) return "one very long movie, with popcorn breaks included";

  let remaining = totalMinutes;
  const picks: { label: string; count: number }[] = [];

  // Give each franchise a turn before repeating any of them, so longer
  // collections read like a fun movie-night itinerary.
  for (const marathon of MOVIE_MARATHONS) {
    if (remaining < marathon.minutes) continue;
    picks.push({ label: marathon.label, count: 1 });
    remaining -= marathon.minutes;
  }

  // Once every marathon that fits has been used, repeat the largest ones to
  // keep the comparison useful for very large collections.
  for (const marathon of MOVIE_MARATHONS) {
    const extra = Math.floor(remaining / marathon.minutes);
    if (!extra) continue;
    const existing = picks.find((pick) => pick.label === marathon.label);
    if (existing) existing.count += extra;
    else picks.push({ label: marathon.label, count: extra });
    remaining -= extra * marathon.minutes;
  }

  if (!picks.length) {
    const closest = MOVIE_MARATHONS[ MOVIE_MARATHONS.length - 1];
    return `partway through ${closest.label}`;
  }

  const descriptions = picks.map(({ label, count }) => (count === 1 ? label : `${label} ${count} times`));
  return descriptions.length === 1
    ? `all of ${descriptions[0]}`
    : `all of ${descriptions.slice(0, -1).join(", ")}, and ${descriptions.at(-1)}`;
}

function InteractiveDonut({
  items,
  recordsByLabel,
  formatCount,
}: {
  items: { label: string; count: number }[];
  recordsByLabel: Record<string, VinylRecord[]>;
  formatCount?: (count: number) => string;
}) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [detailPage, setDetailPage] = useState(0);
  const selectedRecords = selectedLabel ? recordsByLabel[selectedLabel] : undefined;
  const detailPages = Math.max(1, Math.ceil((selectedRecords?.length ?? 0) / DETAIL_PAGE_SIZE));

  return (
    <>
      <DonutChart
        items={items}
        formatCount={formatCount}
        selectedLabel={selectedLabel}
        onSelectLabel={(label) => { setSelectedLabel((current) => (current === label ? null : label)); setDetailPage(0); }}
      />
      {selectedRecords ? (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-950">
              {selectedLabel} <span className="font-normal text-gray-400">({selectedRecords.length} albums)</span>
            </h3>
            <button type="button" onClick={() => setSelectedLabel(null)} className="text-xs text-gray-400 underline-offset-4 hover:text-gray-700 hover:underline">
              Close
            </button>
          </div>
          <ol className="mt-3 grid gap-1 sm:grid-cols-2">
            {selectedRecords.slice(detailPage * DETAIL_PAGE_SIZE, (detailPage + 1) * DETAIL_PAGE_SIZE).map((record) => (
              <li key={record.id}>
                <Link href={`/vinyl/${record.id}`} className="block truncate rounded-md px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-950">
                  {record.title}
                </Link>
              </li>
            ))}
          </ol>
          <DetailPager page={detailPage} pages={detailPages} onPageChange={setDetailPage} />
        </div>
      ) : null}
    </>
  );
}

function BreakdownSection({
  id,
  title,
  narrative,
  items,
  totalCount,
  barColor = "bg-gray-950",
  linkBase,
  formatCount = (count) => String(count),
  detailRecordsByLabel,
  subBreakdown,
  showPercentage = true,
}: {
  id?: string;
  title: string;
  narrative?: string;
  items: { label: string; count: number }[];
  totalCount: number;
  barColor?: string;
  linkBase?: string;
  formatCount?: (count: number) => string;
  detailRecordsByLabel?: Record<string, VinylRecord[]>;
  // A smaller second list shown under the main bars, e.g. US states under countries.
  subBreakdown?: { title: string; items: { label: string; count: number }[]; barColor: string };
  showPercentage?: boolean;
}) {
  const [page, setPage] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [detailPage, setDetailPage] = useState(0);
  const [query, setQuery] = useState("");
  // Bars are sized relative to the largest value, not necessarily items[0] -
  // some breakdowns (value by decade) are sorted chronologically rather
  // than by count, so items[0] isn't reliably the max.
  const topCount = Math.max(...items.map((item) => item.count), 1);
  // Paged instead of "show all" so a long list (labels, formats) doesn't run the page down on mobile.
  const pageSize = 8;
  const filteredItems = query ? items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())) : items;
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const visible = filteredItems.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const selectedRecords = selectedLabel ? detailRecordsByLabel?.[selectedLabel] : undefined;
  const detailPages = Math.max(1, Math.ceil((selectedRecords?.length ?? 0) / DETAIL_PAGE_SIZE));

  return (
    <section id={id} className="scroll-mt-24 rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold text-gray-950 sm:text-xl">{title}</h2>
      {narrative ? <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{narrative}</p> : null}
      {detailRecordsByLabel ? <p className="mt-2 text-xs text-gray-500">Tap a bar to see its albums.</p> : null}
      {items.length > 8 ? <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); setSelectedLabel(null); }} placeholder={`Find ${title.toLowerCase().replace(/^by /, "")}`} aria-label={`Search ${title.toLowerCase()}`} className="mt-4 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-500" /> : null}
      <div className="mt-5 space-y-3">
        {visible.length === 0 ? <p className="text-sm text-gray-500">{query ? "No matching categories." : "No data recorded yet."}</p> : null}
        {visible.map((item) => {
          const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
          const inner = (
            <>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs sm:text-sm">
                <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{item.label}</span>
                <span className="shrink-0 tabular-nums text-gray-500">
                  {formatCount(item.count)}{showPercentage ? ` · ${pct}%` : ""}
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

          if (detailRecordsByLabel) {
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => { setSelectedLabel((current) => (current === item.label ? null : item.label)); setDetailPage(0); }}
                aria-expanded={selectedLabel === item.label}
                className={`block w-full -mx-2 rounded-md px-2 py-1 text-left transition-colors hover:bg-gray-50 ${selectedLabel === item.label ? "bg-gray-50" : ""}`}
              >
                {inner}
              </button>
            );
          }

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
      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <button
            type="button"
            onClick={() => { setPage(Math.max(0, currentPage - 1)); setSelectedLabel(null); }}
            disabled={currentPage === 0}
            className="rounded-md px-2 py-1 font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
          >
            Previous
          </button>
          <span className="tabular-nums">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => { setPage(Math.min(totalPages - 1, currentPage + 1)); setSelectedLabel(null); }}
            disabled={currentPage >= totalPages - 1}
            className="rounded-md px-2 py-1 font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
          >
            Next
          </button>
        </div>
      ) : null}
      {subBreakdown && subBreakdown.items.length > 1 ? (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <h3 className="text-sm font-semibold text-gray-950">{subBreakdown.title}</h3>
          <div className="mt-3 space-y-2.5">
            {subBreakdown.items.map((item) => {
              const subTotal = subBreakdown.items.reduce((sum, entry) => sum + entry.count, 0);
              const subTop = Math.max(...subBreakdown.items.map((entry) => entry.count), 1);
              return (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{item.label}</span>
                    <span className="shrink-0 tabular-nums text-gray-500">
                      {item.count} · {Math.round((item.count / subTotal) * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100">
                    <div className={`h-1.5 rounded-full ${subBreakdown.barColor}`} style={{ width: `${(item.count / subTop) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {selectedRecords ? (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-gray-950">
              {selectedLabel} <span className="font-normal text-gray-400">({selectedRecords.length} albums)</span>
            </h3>
            <button
              type="button"
              onClick={() => setSelectedLabel(null)}
              className="text-xs text-gray-400 underline-offset-4 hover:text-gray-700 hover:underline"
            >
              Close
            </button>
          </div>
          <ol className="mt-3 grid gap-1 sm:grid-cols-2">
            {selectedRecords.slice(detailPage * DETAIL_PAGE_SIZE, (detailPage + 1) * DETAIL_PAGE_SIZE).map((record) => (
              <li key={record.id}>
                <Link href={`/vinyl/${record.id}`} className="block truncate rounded-md px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-950">
                  {record.title}
                </Link>
              </li>
            ))}
          </ol>
          <DetailPager page={detailPage} pages={detailPages} onPageChange={setDetailPage} />
          {linkBase ? <Link href={`${linkBase}${encodeURIComponent(selectedLabel ?? "")}`} className="mt-3 inline-block text-xs font-medium text-gray-700 underline-offset-4 hover:underline">View in catalog</Link> : null}
        </div>
      ) : null}
    </section>
  );
}

function TierBreakdownSection({
  title,
  description,
  tiers,
  selectedTier,
  onSelectTier,
  page,
  onPageChange,
}: {
  title: string;
  description: string;
  tiers: { tier: string; count: number; records: { record: VinylRecord; value: number }[] }[];
  selectedTier: string | null;
  onSelectTier: (label: string) => void;
  page: number;
  onPageChange: (page: number) => void;
}) {
  const activeTier = tiers.find((entry) => entry.tier === selectedTier);
  const totalPages = activeTier ? Math.max(1, Math.ceil(activeTier.records.length / RARITY_PAGE_SIZE)) : 1;
  const clampedPage = Math.min(page, totalPages - 1);
  const pageRecords = activeTier
    ? activeTier.records.slice(clampedPage * RARITY_PAGE_SIZE, (clampedPage + 1) * RARITY_PAGE_SIZE)
    : [];

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold text-gray-950 sm:text-xl">{title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{description}</p>
      <div className="mt-5">
        <DonutChart
          items={tiers.map((entry) => ({ label: entry.tier, count: entry.count }))}
          selectedLabel={selectedTier}
          onSelectLabel={onSelectTier}
        />
      </div>
      {activeTier ? (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-950">
              {activeTier.tier} <span className="font-normal text-gray-400">({activeTier.records.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => onSelectTier(activeTier.tier)}
              className="text-xs text-gray-400 underline-offset-4 hover:text-gray-700 hover:underline"
            >
              Close
            </button>
          </div>
          <ol className="mt-3 space-y-1">
            {pageRecords.map((entry, index) => (
              <li key={entry.record.id}>
                <Link
                  href={`/vinyl/${entry.record.id}`}
                  className="-mx-2 flex items-center justify-between gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-gray-50"
                >
                  <span className="min-w-0 flex-1 truncate text-sm text-gray-900">
                    <span className="mr-2 tabular-nums text-gray-400">{clampedPage * RARITY_PAGE_SIZE + index + 1}.</span>
                    {entry.record.title}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-gray-500">{entry.value.toLocaleString()}</span>
                </Link>
              </li>
            ))}
          </ol>
          {totalPages > 1 ? (
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <button
                type="button"
                onClick={() => onPageChange(Math.max(0, clampedPage - 1))}
                disabled={clampedPage === 0}
                className="rounded-md px-2 py-1 font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
              >
                Previous
              </button>
              <span className="tabular-nums">
                Page {clampedPage + 1} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => onPageChange(Math.min(totalPages - 1, clampedPage + 1))}
                disabled={clampedPage >= totalPages - 1}
                className="rounded-md px-2 py-1 font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
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
  const [everyRecord, setEveryRecord] = useState(records);
  // Collection charts exclude wishlist records; the status chart includes them.
  const allRecords = useMemo(() => everyRecord.filter((record) => record.status !== "wishlist"), [everyRecord]);
  const wishlistCount = everyRecord.length - allRecords.length;
  // The Just for fun cards rotate through a pool on each page load. They start on the default
  // so the server and first client render match, then re-roll once mounted.
  const [funPick, setFunPick] = useState({ weight: 0, value: 0, runtime: -1, height: 0, distance: 0, age: 0 });
  useEffect(() => {
    const timer = window.setTimeout(
      () =>
        setFunPick({
          weight: randomIndexAvoiding(WEIGHT_UNITS.length, "insights-fun-weight"),
          value: randomIndexAvoiding(VALUE_UNITS.length, "insights-fun-value"),
          // -1 is the movie marathon itinerary; 0 and up are the RUNTIME_UNITS.
          runtime: randomIndexAvoiding(RUNTIME_UNITS.length + 1, "insights-fun-runtime", 1),
          height: randomIndexAvoiding(HEIGHT_UNITS.length, "insights-fun-height"),
          distance: randomIndexAvoiding(DISTANCE_UNITS.length, "insights-fun-distance"),
          age: randomIndexAvoiding(AGE_UNITS.length, "insights-fun-age"),
        }),
      0,
    );
    return () => window.clearTimeout(timer);
  }, []);
  const [selectedRarityTier, setSelectedRarityTier] = useState<string | null>(null);
  const [rarityPage, setRarityPage] = useState(0);
  const [selectedWantTier, setSelectedWantTier] = useState<string | null>(null);
  const [wantPage, setWantPage] = useState(0);

  useEffect(() => {
    const queuedRecords = readQueuedVinyls();
    fetchVinylRecords()
      .then((response) => {
        setEveryRecord(response.source === "supabase" ? response.records : [...response.records, ...queuedRecords]);
      })
      .catch(() => setEveryRecord([...records, ...queuedRecords]));
  }, [records]);

  const snapshot = useMemo(() => getCollectionSnapshot(allRecords), [allRecords]);
  const statusBreakdown = useMemo(() => getBreakdown(everyRecord.map((record) => record.status)), [everyRecord]);
  const persona = useMemo(() => getVinylPersona(allRecords), [allRecords]);

  const { value: collectionValue, isLoading: isLoadingValue } = useCollectionValue(allRecords);
  const artistBreakdown = snapshot.artistBreakdown;

  const recentlyAdded = useMemo(
    () =>
      [...allRecords]
        .filter((r) => r.dateAdded)
        .sort((a, b) => (b.dateAdded ?? "").localeCompare(a.dateAdded ?? ""))
        .slice(0, 5),
    [allRecords],
  );

  const countryTotal = snapshot.countryBreakdown.reduce((s, i) => s + i.count, 0);
  const recordingTotal = snapshot.recordingDecadeBreakdown.reduce((s, i) => s + i.count, 0);
  const pricedChartRecords = useMemo(() => {
    const priced = collectionValue?.pricedRecords.map((entry) => entry.record) ?? [];
    return {
      decade: groupRecordsByLabel(priced, (record) => [getReleaseDecade(record)]),
      genre: groupRecordsByLabel(priced, (record) => record.genres),
    };
  }, [collectionValue]);
  const [showAllFacts, setShowAllFacts] = useState(false);

  const topRealArtist = artistBreakdown.find(
    (a) => a.label.toLowerCase() !== "various artists",
  );

  // Collection DNA: short "big number + one line" facts, only ones the data can back up.
  const narrative = useMemo(() => {
    if (!allRecords.length) return [];

    const facts: { stat: string; text: string }[] = [];
    const total = allRecords.length;
    const plural = (count: number, word: string) => `${count.toLocaleString()} ${word}${count === 1 ? "" : "s"}`;

    facts.push({ stat: `${Math.round((snapshot.topGenre.count / total) * 100)}%`, text: `of your collection is ${snapshot.topGenre.value}, your top genre.` });

    const [firstGenre, secondGenre] = snapshot.genreBreakdown;
    if (firstGenre && secondGenre) {
      const inEitherGenre = allRecords.filter((record) => record.genres.includes(firstGenre.label) || record.genres.includes(secondGenre.label)).length;
      facts.push({
        stat: `${Math.round((inEitherGenre / total) * 100)}%`,
        text: `of what you own is ${firstGenre.label} or ${secondGenre.label}, your top two genres.`,
      });
    }

    const leadingArtist = topRealArtist?.label ?? snapshot.topArtist.value;
    const leadingArtistCount = (topRealArtist ?? artistBreakdown[0])?.count ?? 0;
    if (leadingArtistCount > 1) facts.push({ stat: String(leadingArtistCount), text: `records by ${leadingArtist}, your most collected artist.` });

    const [firstDecade, secondDecade] = snapshot.releaseDecadeBreakdown;
    if (firstDecade) {
      facts.push({
        stat: firstDecade.label,
        text: secondDecade
          ? `is the decade most of your records come from. The ${secondDecade.label} are close behind with ${secondDecade.count}.`
          : "is the decade most of your records come from.",
      });
    }

    // An "original" year before recorded music existed is a composition date (e.g. Messiah, 1741), not a release.
    const firstYear = (record: VinylRecord) =>
      record.originalReleaseYear && record.originalReleaseYear >= 1890 ? record.originalReleaseYear : record.releaseYear;
    const dated = allRecords.filter((record) => typeof firstYear(record) === "number");
    if (dated.length >= 2) {
      const oldest = dated.reduce((a, b) => (firstYear(b)! < firstYear(a)! ? b : a));
      const newest = dated.reduce((a, b) => (firstYear(b)! > firstYear(a)! ? b : a));
      if (oldest.id !== newest.id) {
        facts.push({
          stat: `${firstYear(newest)! - firstYear(oldest)!} years`,
          text: `of music, from ${oldest.title} (${firstYear(oldest)}) to ${newest.title} (${firstYear(newest)}).`,
        });
      }

      const byYear = new Map<number, number>();
      for (const record of dated) byYear.set(firstYear(record)!, (byYear.get(firstYear(record)!) ?? 0) + 1);
      const [bestYear, bestCount] = [...byYear.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0];
      if (bestCount > 1) facts.push({ stat: String(bestYear), text: `is the year the most of your albums came out, ${bestCount} of them.` });

      const averageYear = Math.round(dated.reduce((sum, record) => sum + firstYear(record)!, 0) / dated.length);
      facts.push({ stat: `${new Date().getFullYear() - averageYear} years`, text: `old is your average album, first released around ${averageYear}.` });
    }

    const namedArtists = artistBreakdown.filter((artist) => artist.label.toLowerCase() !== "various artists");
    if (namedArtists.length) {
      const oneTimers = namedArtists.filter((artist) => artist.count === 1).length;
      facts.push({ stat: namedArtists.length.toLocaleString(), text: `different artists, and ${oneTimers} of them show up just once.` });
    }

    const families = new Map<string, number>();
    for (const record of allRecords) {
      const family = record.label ? labelFamily(record.label) : "";
      if (family) families.set(family, (families.get(family) ?? 0) + 1);
    }
    const [topFamily, secondFamily] = [...families.entries()].sort((a, b) => b[1] - a[1]);
    if (topFamily && topFamily[1] > 1) {
      facts.push({
        stat: String(topFamily[1]),
        text: `records on ${topFamily[0]}, your biggest label${secondFamily ? `, ahead of ${secondFamily[0]} with ${secondFamily[1]}` : ""}.`,
      });
    }

    // Only confirmed pressings have a real pressing year, so this is the oldest one we can prove.
    const pressed = allRecords.filter(
      (record): record is VinylRecord & { pressingYear: number } => Boolean(record.discogsVerified) && typeof record.pressingYear === "number",
    );
    if (pressed.length) {
      const oldestPressing = pressed.reduce((a, b) => (b.pressingYear < a.pressingYear ? b : a));
      facts.push({ stat: String(oldestPressing.pressingYear), text: `is when your oldest confirmed pressing was made: ${oldestPressing.title}.` });
    }

    const confirmed = allRecords.filter((record) => record.discogsVerified).length;
    if (confirmed) {
      const originals = allRecords.filter(isOriginalPressing).length;
      facts.push({ stat: String(confirmed), text: `pressings identified down to the exact edition${originals ? `, including ${originals} first pressings` : ""}.` });
    }

    const runs = allRecords
      .map((record) => ({ record, run: getPressRun(record) }))
      .filter((entry): entry is { record: VinylRecord; run: { size: number; source: string } } => Boolean(entry.run));
    if (runs.length) {
      const smallest = runs.reduce((a, b) => (b.run.size < a.run.size ? b : a));
      facts.push({
        stat: `${smallest.run.size.toLocaleString()} copies`,
        text: `in your smallest known press run, ${smallest.record.title}.${runs.length > 1 ? ` You own ${runs.length} limited pressings in all.` : ""}`,
      });
    }

    const colored = allRecords.filter((record) => record.vinylColor && !/^black$/i.test(record.vinylColor.trim()));
    if (colored.length) {
      const pictureDiscs = colored.filter((record) => /picture/i.test(record.vinylColor!)).length;
      facts.push({
        stat: String(colored.length),
        text: `${colored.length === 1 ? "record that isn't" : "records that aren't"} black vinyl${pictureDiscs ? `, including ${plural(pictureDiscs, "picture disc")}` : ""}.`,
      });
    }

    // Format strings are too inconsistent to group, so this uses disc count instead.
    const multiDisc = allRecords.filter((record) => (record.discCount ?? 1) > 1).length;
    if (multiDisc) {
      facts.push({ stat: `${Math.round(((total - multiDisc) / total) * 100)}%`, text: `of your records are single discs, and ${multiDisc} are sets of two or more.` });
    }

    const songs = allRecords.reduce((sum, record) => sum + (record.trackList?.length ?? 0), 0);
    const discs = allRecords.reduce((sum, record) => sum + Math.max(1, record.discCount ?? 1), 0);
    if (songs) facts.push({ stat: songs.toLocaleString(), text: `songs across the track lists of your records, spread over ${discs.toLocaleString()} discs.` });

    if (snapshot.favorites > 0) {
      facts.push({ stat: String(snapshot.favorites), text: `favorites, about 1 in every ${Math.round(total / snapshot.favorites)} records you own.` });
    }

    return facts;
  }, [allRecords, snapshot, topRealArtist, artistBreakdown]);

  const discogsLinkedCount = useMemo(
    () => allRecords.filter((record) => record.discogsReleaseId).length,
    [allRecords],
  );
  const discogsVerifiedCount = useMemo(
    () => allRecords.filter((record) => record.discogsVerified).length,
    [allRecords],
  );

  const labelFamilyBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const record of allRecords) {
      const family = labelFamily(record.label ?? "") || "Unknown";
      counts.set(family, (counts.get(family) ?? 0) + 1);
    }
    return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  }, [allRecords]);

  const categoryNarratives = useMemo(() => {
    const pctOf = (count: number, total: number) => (total > 0 ? Math.round((count / total) * 100) : 0);
    const lines: Record<string, string | undefined> = {};

    const [topGenre, secondGenre] = snapshot.genreBreakdown;
    if (topGenre) {
      lines.genre = secondGenre
        ? `${topGenre.label} is your most common genre at ${pctOf(topGenre.count, allRecords.length)}% of your records, followed by ${secondGenre.label}. Albums can have multiple genres.`
        : `${topGenre.label} is your only genre so far, across ${topGenre.count} records.`;
    }

    const [topArtist] = artistBreakdown;
    if (topArtist) {
      lines.artist = `${topArtist.label} tops your artist list with ${topArtist.count} record${topArtist.count === 1 ? "" : "s"}, out of ${snapshot.artists} artists in all.`;
    }

    const [topReleaseDecade] = snapshot.releaseDecadeBreakdown;
    if (topReleaseDecade) {
      lines.releaseDecade = `The ${topReleaseDecade.label} are your best-represented decade, with ${topReleaseDecade.count} records (${pctOf(topReleaseDecade.count, allRecords.length)}%).`;
    }

    const [topRecordingDecade] = snapshot.recordingDecadeBreakdown;
    if (topRecordingDecade) {
      lines.recordingDecade = `Among ${recordingTotal} records with known recording years, the ${topRecordingDecade.label} appear most often. Years are unknown for ${allRecords.length - recordingTotal}.`;
    }

    // Raw format strings ("1, Vinyl, LP, Album") don't read well in a sentence, so describe disc counts instead.
    const multiDiscCount = allRecords.filter((record) => (record.discCount ?? 1) > 1).length;
    if (allRecords.length) {
      lines.format = multiDiscCount
        ? `Most of your records are single discs, and ${multiDiscCount} are sets of two or more.`
        : "Every record you own is a single disc.";
    }

    const [topLabelCount] = labelFamilyBreakdown;
    if (topLabelCount) {
      lines.label = `${topLabelCount.label} released more of your records than any other label, with ${topLabelCount.count} titles.`;
    }

    const [topMoodCount] = snapshot.moodBreakdown;
    if (topMoodCount) {
      lines.mood = `${topMoodCount.label} is the most common mood, tagged on ${topMoodCount.count} of ${allRecords.length} records. Albums can have multiple moods.`;
    }

    const [topCountry, secondCountry] = snapshot.countryBreakdown;
    if (topCountry) {
      lines.country = secondCountry
        ? `Among ${countryTotal} records with a known pressing country, ${placeName(topCountry.label)} leads with ${topCountry.count} titles, followed by ${placeName(secondCountry.label)}.`
        : `Every record with a known pressing country was pressed in ${placeName(topCountry.label)}, ${topCountry.count} titles in all.`;
    }

    const abroad = snapshot.foundCountryBreakdown.filter((item) => item.label !== "United States" && item.label !== "Unknown");
    if (abroad.length) {
      const found = abroad.reduce((sum, item) => sum + item.count, 0);
      const names = abroad.map((item) => item.label);
      const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}` : names[0];
      lines.foundCountry = `${found} of your records were found outside the US, in ${list}.`;
    }
    const unknownFound = snapshot.foundCountryBreakdown.find((item) => item.label === "Unknown")?.count ?? 0;
    if (unknownFound) lines.foundCountry = `${lines.foundCountry ? `${lines.foundCountry} ` : ""}Where ${unknownFound} records were found is not recorded.`;

    const [topPlant, secondPlant] = snapshot.pressingPlantBreakdown;
    if (topPlant) {
      const known = snapshot.pressingPlantBreakdown.reduce((sum, item) => sum + item.count, 0);
      lines.pressingPlant = secondPlant
        ? `${topPlant.label} pressed more of your records than anywhere else, out of ${known} records with a known plant.`
        : `${topPlant.label} is the only pressing plant identified so far, across ${topPlant.count} records.`;
    }

    if (allRecords.length > 0) {
      const parts = [`${snapshot.owned} owned`];
      if (wishlistCount > 0) parts.push(`${wishlistCount} on the wishlist`);
      if (snapshot.upgrade > 0) parts.push(`${snapshot.upgrade} marked for an upgrade`);
      lines.status = `${parts.join(", ")}.`;
    }

    return lines;
  }, [allRecords, snapshot, recordingTotal, countryTotal, artistBreakdown, wishlistCount, labelFamilyBreakdown]);

  const needsAttention = useMemo(
    () => ({
      missingPhotos: allRecords.filter(
        (record) => record.status === "owned" && (!record.coverImage || !record.backCoverImage),
      ).length,
      notLinked: allRecords.filter((record) => !record.discogsReleaseId && !record.discogsNoMatch).length,
      unverifiedLinked: allRecords.filter((record) => record.discogsReleaseId && !record.discogsVerified && !record.discogsNoMatch).length,
    }),
    [allRecords],
  );

  // Confirmed pressings only, and only ones with both years on file - this
  // compares against Discogs' own master-release year (the album's true first
  // release), not a keyword guess off the format description.
  const originalPressingStats = useMemo(() => {
    const known = allRecords.filter((record) => record.discogsVerified && record.pressingYear && record.originalReleaseYear);
    const original = known.filter(isOriginalPressing).length;
    return { known: known.length, original, reissue: known.length - original };
  }, [allRecords]);


  const recordsByArtist = useMemo(() => Object.fromEntries(groupRecordsByArtist(allRecords)) as Record<string, VinylRecord[]>, [allRecords]);

  const chartRecords = useMemo(() => ({
    genre: groupRecordsByLabel(allRecords, (record) => record.genres),
    artist: recordsByArtist,
    releaseDecade: groupRecordsByLabel(allRecords, (record) => [getReleaseDecade(record)]),
    recordingDecade: groupRecordsByLabel(allRecords, (record) => [getRecordingDecade(record)]),
    decade: groupRecordsByLabel(allRecords, (record) => [getDecade(record)]),
    format: groupRecordsByLabel(allRecords, (record) => [getFormatGroup(record)]),
    label: groupRecordsByLabel(allRecords, (record) => [labelFamily(record.label ?? "") || "Unknown"]),
    country: groupRecordsByLabel(allRecords, (record) => [record.country ?? "Unknown"]),
    foundCountry: groupRecordsByLabel(allRecords, (record) => [getFoundCountry(record)]),
    pressingPlant: groupRecordsByLabel(allRecords, (record) => [record.pressingPlant ?? "Unknown"]),
    mood: groupRecordsByLabel(allRecords, (record) => record.moods),
    status: groupRecordsByLabel(everyRecord, (record) => [record.status]),
    originalStatus: groupRecordsByLabel(
      allRecords.filter((record) => record.discogsVerified && record.pressingYear && record.originalReleaseYear),
      (record) => [isOriginalPressing(record) ? "Original pressing" : "Reissue / repress"],
    ),
  }), [allRecords, everyRecord, recordsByArtist]);

  const foundStories = useMemo(() => {
    const ownedRecords = allRecords.filter((record) => record.status === "owned");
    const withStory = ownedRecords.filter((record) => record.whereWeGotIt?.trim());
    const samples = [...withStory].sort((a, b) => a.id.localeCompare(b.id)).slice(0, 3);

    return {
      total: ownedRecords.length,
      told: withStory.length,
      missing: ownedRecords.length - withStory.length,
      samples,
    };
  }, [allRecords]);

  // Just-for-fun stats, not analysis - kept at the very bottom of the page.
  const funStats = useMemo(() => {
    const owned = allRecords.filter((record) => record.status === "owned");
    const weighed = owned.filter((record) => (record.weightGrams ?? 0) > 0);
    const timed = owned.filter((record) => (record.runtimeSeconds ?? 0) > 0);
    const discCount = allRecords.reduce((sum, record) => sum + Math.max(1, record.discCount ?? 1), 0);
    const thisYear = new Date().getFullYear();
    const aged = allRecords.filter((record) => typeof record.releaseYear === "number" && record.releaseYear <= thisYear);
    return {
      weighedCount: weighed.length,
      totalGrams: weighed.reduce((sum, record) => sum + (record.weightGrams ?? 0), 0),
      timedCount: timed.length,
      totalSeconds: timed.reduce((sum, record) => sum + (record.runtimeSeconds ?? 0), 0),
      recordCount: allRecords.length,
      discCount,
      stackInches: allRecords.reduce((sum, record) => sum + 0.2 + 0.15 * (Math.max(1, record.discCount ?? 1) - 1), 0),
      agedCount: aged.length,
      totalAgeYears: aged.reduce((sum, record) => sum + (thisYear - record.releaseYear!), 0),
    };
  }, [allRecords]);

  // Record-count cards open the catalog filtered to exactly those records;
  // Artists/Genres/Formats are category counts, so they jump to their breakdown below.
  const statCards = [
    { label: "Records", value: snapshot.owned, href: "/vinyl?status=Owned" },
    { label: "Artists", value: snapshot.artists, href: "#top-artists" },
    { label: "Genres", value: snapshot.genres, href: "#by-genre" },
    { label: "Favorites", value: snapshot.favorites, href: "/vinyl?filter=favorites" },
    { label: "Wishlist", value: wishlistCount, href: "/vinyl?filter=wishlist" },
    { label: "Originals", value: originalPressingStats.original, href: "/vinyl?filter=originals" },
    { label: "Formats", value: snapshot.formats, href: "#by-format" },
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
            A deeper look at the shape of your collection, from decades and genres to the
            artists and moods that show up the most.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/vinyl/achievements"
            className="inline-flex w-fit shrink-0 rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
          >
            Achievements
          </Link>
          <Link
            href="/vinyl"
            className="inline-flex w-fit shrink-0 rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
          >
            Back to catalog
          </Link>
        </div>
      </div>

      <nav aria-label="Insights sections" className="flex gap-2 overflow-x-auto pb-1 text-xs sm:text-sm">
        {[["#collection-value", "Value"], ["#by-genre", "Breakdowns"], ["#collection-timeline", "Timeline"], ["#artist-az", "Artists A–Z"], ["#crate-map", "Crates"]].map(([href, label]) => (
          <a key={href} href={href} className="shrink-0 rounded-full border border-gray-200 px-3 py-2 text-gray-700 hover:border-gray-500 hover:text-gray-950">{label}</a>
        ))}
      </nav>

      {persona.length > 0 ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">The record-store read</p>
          <h2 className="mt-2 text-xl font-semibold tracking-tight text-gray-950 sm:text-2xl">If we only knew your records…</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Here&apos;s our playful read on you. These are guesses from the music on your shelves, not personal facts.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {persona.map((guess) => (
              <div key={guess.label} className="rounded-lg border border-amber-100 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-amber-700">{guess.label}</p>
                <p className="mt-2 text-xl font-semibold tracking-tight text-gray-950">{guess.value}</p>
                <p className="mt-2 text-sm leading-6 text-gray-600">{guess.reason}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Collection DNA */}
      {narrative.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-gradient-to-br from-stone-50 via-white to-indigo-50/60 p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Dna className="h-4 w-4 text-indigo-500" />
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Collection DNA</h2>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {narrative.slice(0, showAllFacts ? undefined : 6).map((fact) => (
              <div key={fact.text} className="rounded-lg border border-gray-100 bg-white/80 p-4 shadow-sm">
                <p className="text-2xl font-semibold tracking-tight text-gray-950 tabular-nums">{fact.stat}</p>
                <p className="mt-1 text-sm leading-6 text-gray-600">{fact.text}</p>
              </div>
            ))}
          </div>
          {narrative.length > 6 ? <button type="button" onClick={() => setShowAllFacts((value) => !value)} className="mt-4 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400">{showAllFacts ? "Show fewer facts" : `Show all ${narrative.length} facts`}</button> : null}
        </section>
      )}

      {/* Needs attention */}
      {allRecords.length > 0 &&
      (needsAttention.missingPhotos > 0 || needsAttention.notLinked > 0 || needsAttention.unverifiedLinked > 0) ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Needs attention</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Link
              href="/vinyl/manage"
              className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-400"
            >
              <p className="text-2xl font-semibold text-gray-950">{needsAttention.missingPhotos}</p>
              <p className="mt-1 text-sm text-gray-600">owned records missing a front or back photo</p>
            </Link>
            <Link
              href="/vinyl/manage/match"
              className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-400"
            >
              <p className="text-2xl font-semibold text-gray-950">{needsAttention.notLinked}</p>
              <p className="mt-1 text-sm text-gray-600">records not yet linked to Discogs</p>
            </Link>
            <Link
              href="/vinyl/manage/match"
              className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-400"
            >
              <p className="text-2xl font-semibold text-gray-950">{needsAttention.unverifiedLinked}</p>
              <p className="mt-1 text-sm text-gray-600">linked records with an unconfirmed pressing</p>
            </Link>
          </div>
        </div>
      ) : null}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {statCards.map(({ label, value, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-lg border border-gray-200 bg-white p-4 transition-colors hover:border-gray-400"
          >
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-2 text-xl font-semibold text-gray-950 sm:text-2xl">
              <AnimatedNumber value={value} />
            </p>
          </Link>
        ))}
      </div>

      {/* Collection value */}
      {allRecords.length > 0 ? (
        <div id="collection-value" className="scroll-mt-24 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Collection value</h2>
          {!collectionValue ? (
            isLoadingValue ? <div className="mt-4 h-9 w-32 animate-pulse rounded bg-gray-100" /> : <p className="mt-3 text-sm text-gray-500">No records have a Discogs price yet.</p>
          ) : (
            <div className="mt-4 flex flex-wrap items-end gap-8">
              <div>
                <p className="text-xs text-gray-500">Priced subtotal</p>
                <p className="mt-1 text-3xl font-semibold text-gray-950">
                  {formatDiscogsMoney({ currency: collectionValue.currency, value: collectionValue.total })}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {collectionValue.pricedCount} of {snapshot.owned} owned records priced ({collectionValue.linkedCount} linked to Discogs)
                </p>
                {isLoadingValue ? <p className="mt-1 text-xs text-amber-700" role="status">Still checking prices… subtotal may increase.</p> : null}
                {collectionValue.unverifiedCount > 0 ? (
                  <p className="mt-1 text-xs text-amber-600">
                    Includes {collectionValue.unverifiedCount} record{collectionValue.unverifiedCount === 1 ? "" : "s"}{" "}
                    with an unconfirmed pressing match
                  </p>
                ) : null}
                <p className="mt-3 text-xs text-gray-400">
                  {discogsLinkedCount} of {allRecords.length} records linked to Discogs
                  {discogsVerifiedCount ? ` (${discogsVerifiedCount} confirmed)` : ""}
                </p>
                {collectionValue.currentlyListedCount > 0 ? (
                  <p className="mt-1 text-xs text-gray-400">
                    {collectionValue.currentlyListedCount} of your records have copies for sale on Discogs right now
                  </p>
                ) : null}
              </div>
              {collectionValue.mostValuable ? (
                <Link
                  href={`/vinyl/${collectionValue.mostValuable.record.id}`}
                  className="rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:border-gray-400"
                >
                  <p className="text-xs text-gray-500">Most valuable</p>
                  <p className="mt-1 text-sm font-medium text-gray-950">
                    {collectionValue.mostValuable.record.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDiscogsMoney({ currency: collectionValue.currency, value: collectionValue.mostValuable.value })}
                  </p>
                </Link>
              ) : null}
              {collectionValue.cheapest && collectionValue.cheapest.record.id !== collectionValue.mostValuable?.record.id ? (
                <Link
                  href={`/vinyl/${collectionValue.cheapest.record.id}`}
                  className="rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:border-gray-400"
                >
                  <p className="text-xs text-gray-500">Least valuable</p>
                  <p className="mt-1 text-sm font-medium text-gray-950">{collectionValue.cheapest.record.title}</p>
                  <p className="text-xs text-gray-500">
                    {formatDiscogsMoney({ currency: collectionValue.currency, value: collectionValue.cheapest.value })}
                  </p>
                </Link>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {/* Discogs community stats */}
      {collectionValue?.rarest || collectionValue?.mostWanted || collectionValue?.highestRated ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Community stats, via Discogs</h2>
          <p className="mt-1 text-xs text-gray-400">
            Based on how many Discogs users report owning, wanting, or rating each exact pressing.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {collectionValue.rarest ? (
              <Link
                href={`/vinyl/${collectionValue.rarest.record.id}`}
                className="rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:border-gray-400"
              >
                <p className="text-xs text-gray-500">Rarest (fewest owners)</p>
                <p className="mt-1 text-sm font-medium text-gray-950">{collectionValue.rarest.record.title}</p>
                <p className="text-xs text-gray-500">
                  {collectionValue.rarest.have} {collectionValue.rarest.have === 1 ? "person has" : "people have"} this
                  pressing
                </p>
              </Link>
            ) : null}
            {collectionValue.mostWanted ? (
              <Link
                href={`/vinyl/${collectionValue.mostWanted.record.id}`}
                className="rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:border-gray-400"
              >
                <p className="text-xs text-gray-500">Most wanted</p>
                <p className="mt-1 text-sm font-medium text-gray-950">{collectionValue.mostWanted.record.title}</p>
                <p className="text-xs text-gray-500">
                  {collectionValue.mostWanted.want} people want this pressing
                </p>
              </Link>
            ) : null}
            {collectionValue.highestRated ? (
              <Link
                href={`/vinyl/${collectionValue.highestRated.record.id}`}
                className="rounded-lg border border-gray-200 px-4 py-3 transition-colors hover:border-gray-400"
              >
                <p className="text-xs text-gray-500">Highest rated</p>
                <p className="mt-1 text-sm font-medium text-gray-950">{collectionValue.highestRated.record.title}</p>
                <p className="text-xs text-gray-500">
                  {collectionValue.highestRated.average.toFixed(1)} / 5 ({collectionValue.highestRated.count} ratings)
                </p>
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Rarity + demand breakdowns */}
      {(collectionValue?.rarityTiers?.length ?? 0) > 1 || (collectionValue?.wantTiers?.length ?? 0) > 1 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {collectionValue?.rarityTiers && collectionValue.rarityTiers.length > 1 ? (
            <TierBreakdownSection
              title="Rarity breakdown"
              description="Ultra rare means fewer than 100 Discogs users report owning that exact pressing; common means 2,000 or more. Click a tier to see what's in it."
              tiers={collectionValue.rarityTiers.map((entry) => ({
                tier: entry.tier,
                count: entry.count,
                records: entry.records.map((r) => ({ record: r.record, value: r.have })),
              }))}
              selectedTier={selectedRarityTier}
              onSelectTier={(label) => {
                setSelectedRarityTier((current) => (current === label ? null : label));
                setRarityPage(0);
              }}
              page={rarityPage}
              onPageChange={setRarityPage}
            />
          ) : null}
          {collectionValue?.wantTiers && collectionValue.wantTiers.length > 1 ? (
            <TierBreakdownSection
              title="Demand breakdown"
              description="How many Discogs users have this exact pressing on their wantlist. Click a tier to see what's in it."
              tiers={collectionValue.wantTiers.map((entry) => ({
                tier: entry.tier,
                count: entry.count,
                records: entry.records.map((r) => ({ record: r.record, value: r.want })),
              }))}
              selectedTier={selectedWantTier}
              onSelectTier={(label) => {
                setSelectedWantTier((current) => (current === label ? null : label));
                setWantPage(0);
              }}
              page={wantPage}
              onPageChange={setWantPage}
            />
          ) : null}
        </div>
      ) : null}

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
          id="by-genre"
          title="By genre"
          narrative={categoryNarratives.genre}
          items={snapshot.genreBreakdown}
          totalCount={allRecords.length}
          barColor="bg-teal-500"
          linkBase="/vinyl?genre="
          detailRecordsByLabel={chartRecords.genre}
        />
        <BreakdownSection
          id="top-artists"
          title="Top artists"
          narrative={categoryNarratives.artist}
          items={artistBreakdown}
          totalCount={artistBreakdown.reduce((sum, item) => sum + item.count, 0)}
          barColor="bg-blue-500"
          detailRecordsByLabel={chartRecords.artist}
        />
        <BreakdownSection
          title="By release decade"
          narrative={categoryNarratives.releaseDecade}
          items={snapshot.releaseDecadeBreakdown}
          totalCount={allRecords.length}
          barColor="bg-amber-500"
          linkBase="/vinyl?decade="
          detailRecordsByLabel={chartRecords.releaseDecade}
        />
        <BreakdownSection
          title="By recording decade"
          narrative={categoryNarratives.recordingDecade}
          items={snapshot.recordingDecadeBreakdown}
          totalCount={recordingTotal}
          barColor="bg-orange-400"
          detailRecordsByLabel={chartRecords.recordingDecade}
        />
        <BreakdownSection
          id="by-format"
          title="By format"
          narrative={categoryNarratives.format}
          items={snapshot.formatBreakdown}
          totalCount={allRecords.length}
          barColor="bg-purple-500"
          detailRecordsByLabel={chartRecords.format}
        />
        <BreakdownSection
          title="By label"
          narrative={categoryNarratives.label}
          items={labelFamilyBreakdown}
          totalCount={allRecords.length}
          barColor="bg-rose-500"
          detailRecordsByLabel={chartRecords.label}
        />
        <BreakdownSection
          title="By country pressed"
          narrative={categoryNarratives.country}
          items={snapshot.countryBreakdown}
          totalCount={countryTotal}
          barColor="bg-sky-500"
          detailRecordsByLabel={chartRecords.country}
        />
        <BreakdownSection
          title="By country found"
          narrative={categoryNarratives.foundCountry}
          items={snapshot.foundCountryBreakdown}
          totalCount={allRecords.length}
          barColor="bg-emerald-500"
          detailRecordsByLabel={chartRecords.foundCountry}
          subBreakdown={{ title: "Found in the US, by state", items: snapshot.foundStateBreakdown, barColor: "bg-emerald-300" }}
        />
        {snapshot.pressingPlantBreakdown.length > 0 ? (
          <BreakdownSection
            title="By pressing plant"
            narrative={categoryNarratives.pressingPlant}
            items={snapshot.pressingPlantBreakdown}
            totalCount={snapshot.pressingPlantBreakdown.reduce((sum, item) => sum + item.count, 0)}
            barColor="bg-cyan-600"
            detailRecordsByLabel={chartRecords.pressingPlant}
          />
        ) : null}
        <BreakdownSection
          title="Top moods"
          narrative={categoryNarratives.mood}
          items={snapshot.moodBreakdown}
          totalCount={allRecords.length}
          barColor="bg-violet-500"
          linkBase="/vinyl?mood="
          detailRecordsByLabel={chartRecords.mood}
        />
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">By status</h2>
          {categoryNarratives.status ? (
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{categoryNarratives.status}</p>
          ) : null}
          <div className="mt-5">
            <InteractiveDonut items={statusBreakdown} recordsByLabel={chartRecords.status} />
          </div>
        </section>
      </div>

      {collectionValue?.byDecade && collectionValue.byDecade.length > 1 ? (
        <BreakdownSection
          title="Value by decade"
          narrative="Priced albums by release decade. Albums without an estimated price are excluded."
          items={collectionValue.byDecade.map((entry) => ({ label: entry.decade, count: Math.round(entry.total) }))}
          totalCount={collectionValue.byDecade.reduce((sum, entry) => sum + Math.round(entry.total), 0)}
          barColor="bg-emerald-500"
          formatCount={(count) => formatDiscogsMoney({ currency: collectionValue.currency, value: count }, { cents: false })}
          detailRecordsByLabel={pricedChartRecords.decade}
        />
      ) : null}

      {collectionValue?.byGenre && collectionValue.byGenre.length > 1 ? (
        <BreakdownSection
          title="Value by genre"
          narrative="Estimated value of priced albums in each genre. An album with multiple genres counts in each one."
          items={collectionValue.byGenre.map((entry) => ({ label: entry.genre, count: Math.round(entry.total) }))}
          totalCount={collectionValue.total}
          barColor="bg-emerald-500"
          showPercentage={false}
          formatCount={(count) => formatDiscogsMoney({ currency: collectionValue.currency, value: count }, { cents: false })}
          detailRecordsByLabel={pricedChartRecords.genre}
        />
      ) : null}

      {originalPressingStats.known > 1 ? (
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Original vs. reissue</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            {Math.round((originalPressingStats.original / originalPressingStats.known) * 100)}% of your{" "}
            {originalPressingStats.known} confirmed pressings are true originals, and the rest are reissues or represses.
            Each one is checked against the album&apos;s original release year on Discogs, not guessed from the format.
          </p>
          <div className="mt-5">
            <InteractiveDonut
              items={[
                { label: "Original pressing", count: originalPressingStats.original },
                { label: "Reissue / repress", count: originalPressingStats.reissue },
              ].filter((item) => item.count > 0)}
              recordsByLabel={chartRecords.originalStatus}
            />
          </div>
        </section>
      ) : null}

      {foundStories.total > 0 && (
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Where you found them</h2>
            <span className="text-xs text-gray-400">
              {foundStories.told} of {foundStories.total} stories told
            </span>
          </div>
          {foundStories.missing > 0 ? (
            <Link
              href="/vinyl/manage"
              className="mt-3 inline-flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 transition-colors hover:bg-amber-100"
            >
              {foundStories.missing} owned record{foundStories.missing === 1 ? "" : "s"} still {foundStories.missing === 1 ? "doesn't" : "don't"} have a story. Add one.
            </Link>
          ) : null}
          {foundStories.samples.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {foundStories.samples.map((record) => (
                <Link
                  key={record.id}
                  href={`/vinyl/${record.id}`}
                  className="rounded-lg border border-gray-200 p-4 transition-colors hover:border-gray-400"
                >
                  <p className="text-sm font-medium text-gray-950">{record.title}</p>
                  <p className="text-xs text-gray-500">{record.artist}</p>
                  <p className="mt-2 text-xs leading-relaxed text-gray-600 line-clamp-4">{record.whereWeGotIt}</p>
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      )}

      <CollectionTimeline records={allRecords} />

      <ArtistBingo records={allRecords} />

      <CrateMap records={allRecords} />

      {funStats.weighedCount > 0 || funStats.timedCount > 0 || collectionValue ? (
        <section className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Just for fun</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {funStats.weighedCount > 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-2xl font-semibold tabular-nums text-gray-950">
                  {(funStats.totalGrams / 453.592).toLocaleString("en-US", { maximumFractionDigits: 1 })} lb
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  What your {funStats.weighedCount} weighed record{funStats.weighedCount === 1 ? "" : "s"} add up to. That&apos;s about the weight of{" "}
                  {describeCount(funStats.totalGrams / 453.592 / WEIGHT_UNITS[funPick.weight].pounds, WEIGHT_UNITS[funPick.weight])} ({WEIGHT_UNITS[funPick.weight].note}).
                </p>
              </div>
            ) : null}
            {collectionValue ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-2xl font-semibold tabular-nums text-gray-950">
                  {formatCount(Math.max(0, collectionValue.total / VALUE_UNITS[funPick.value].dollars))}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  {nounFor(collectionValue.total / VALUE_UNITS[funPick.value].dollars, VALUE_UNITS[funPick.value])} we could have bought with the estimated value of my collection ({VALUE_UNITS[funPick.value].note}).
                </p>
              </div>
            ) : null}
            {funStats.timedCount > 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-2xl font-semibold tabular-nums text-gray-950">
                  {(() => {
                    const hours = Math.floor(funStats.totalSeconds / 3600);
                    const days = Math.floor(hours / 24);
                    return days > 0 ? `${days}d ${hours % 24}h` : `${hours}h ${Math.round((funStats.totalSeconds % 3600) / 60)}m`;
                  })()}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  How long it would take to play your {funStats.timedCount} timed record{funStats.timedCount === 1 ? "" : "s"} back to
                  back, no breaks. That&apos;s{" "}
                  {funPick.runtime < 0
                    ? formatRuntimeComparison(funStats.totalSeconds)
                    : describeRuntime(funStats.totalSeconds / 60, RUNTIME_UNITS[funPick.runtime])}.
                </p>
              </div>
            ) : null}
            {funStats.recordCount > 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-2xl font-semibold tabular-nums text-gray-950">{formatHeight(funStats.stackInches)}</p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  How tall your {funStats.recordCount} records get stacked on top of each other. That&apos;s about{" "}
                  {describeCount(funStats.stackInches / HEIGHT_UNITS[funPick.height].inches, HEIGHT_UNITS[funPick.height])} ({HEIGHT_UNITS[funPick.height].note}).
                </p>
              </div>
            ) : null}
            {funStats.discCount > 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-2xl font-semibold tabular-nums text-gray-950">
                  {formatCount(funStats.discCount * 0.559)} miles
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  How far the grooves on your {funStats.discCount} discs would stretch if you unspooled them, at about 900 meters each. That&apos;s about{" "}
                  {describeCount((funStats.discCount * 0.559) / DISTANCE_UNITS[funPick.distance].miles, DISTANCE_UNITS[funPick.distance])} ({DISTANCE_UNITS[funPick.distance].note}).
                </p>
              </div>
            ) : null}
            {funStats.agedCount > 0 ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-2xl font-semibold tabular-nums text-gray-950">
                  {Math.round(funStats.totalAgeYears).toLocaleString("en-US")} years
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  The combined age of your {funStats.agedCount} records, counted from each release year. That&apos;s about{" "}
                  {describeCount(funStats.totalAgeYears / unitYears(AGE_UNITS[funPick.age]), AGE_UNITS[funPick.age])} ({AGE_UNITS[funPick.age].note}).
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
