"use client";

import { VinylRecord } from "@/data/vinyls";
import DonutChart from "@/components/DonutChart";
import { formatDiscogsMoney, useCollectionValue, useDiscogsArtistBreakdown } from "@/lib/discogsClient";
import { getCollectionSnapshot } from "@/lib/vinylAnalytics";
import { getDecade, getRecordingDecade, getReleaseDecade, isOriginalPressing } from "@/lib/vinylRecordUtils";
import { fetchVinylRecords } from "@/lib/vinylApi";
import { readQueuedVinyls } from "@/lib/vinylQueue";
import { Disc3 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type VinylInsightsProps = {
  records: VinylRecord[];
};

const RARITY_PAGE_SIZE = 10;

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
  const selectedRecords = selectedLabel ? recordsByLabel[selectedLabel] : undefined;

  return (
    <>
      <DonutChart
        items={items}
        formatCount={formatCount}
        selectedLabel={selectedLabel}
        onSelectLabel={(label) => setSelectedLabel((current) => (current === label ? null : label))}
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
            {selectedRecords.map((record) => (
              <li key={record.id}>
                <Link href={`/vinyl/${record.id}`} className="block truncate rounded-md px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-950">
                  {record.title}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </>
  );
}

function BreakdownSection({
  title,
  narrative,
  items,
  totalCount,
  barColor = "bg-gray-950",
  linkBase,
  formatCount = (count) => String(count),
  detailRecordsByLabel,
}: {
  title: string;
  narrative?: string;
  items: { label: string; count: number }[];
  totalCount: number;
  barColor?: string;
  linkBase?: string;
  formatCount?: (count: number) => string;
  detailRecordsByLabel?: Record<string, VinylRecord[]>;
}) {
  const [showAll, setShowAll] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  // Bars are sized relative to the largest value, not necessarily items[0] -
  // some breakdowns (value by decade) are sorted chronologically rather
  // than by count, so items[0] isn't reliably the max.
  const topCount = Math.max(...items.map((item) => item.count), 1);
  const visible = showAll ? items : items.slice(0, 8);
  const selectedRecords = selectedLabel ? detailRecordsByLabel?.[selectedLabel] : undefined;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold text-gray-950 sm:text-xl">{title}</h2>
      {narrative ? <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{narrative}</p> : null}
      <div className="mt-5 space-y-3">
        {visible.map((item) => {
          const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
          const inner = (
            <>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-xs sm:text-sm">
                <span className="min-w-0 flex-1 truncate font-medium text-gray-900">{item.label}</span>
                <span className="shrink-0 tabular-nums text-gray-500">
                  {formatCount(item.count)} · {pct}%
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
                onClick={() => setSelectedLabel((current) => (current === item.label ? null : item.label))}
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
      {items.length > 8 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="mt-4 text-xs font-medium text-gray-400 transition-colors hover:text-gray-700"
        >
          {showAll ? "Show less" : `Show all ${items.length}`}
        </button>
      )}
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
            {selectedRecords.map((record) => (
              <li key={record.id}>
                <Link href={`/vinyl/${record.id}`} className="block truncate rounded-md px-2 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-950">
                  {record.title}
                </Link>
              </li>
            ))}
          </ol>
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
  const [allRecords, setAllRecords] = useState(records);
  const [selectedRarityTier, setSelectedRarityTier] = useState<string | null>(null);
  const [rarityPage, setRarityPage] = useState(0);
  const [selectedWantTier, setSelectedWantTier] = useState<string | null>(null);
  const [wantPage, setWantPage] = useState(0);

  useEffect(() => {
    const queuedRecords = readQueuedVinyls();
    fetchVinylRecords()
      .then((response) => {
        setAllRecords(response.source === "supabase" ? response.records : [...response.records, ...queuedRecords]);
      })
      .catch(() => setAllRecords([...records, ...queuedRecords]));
  }, [records]);

  const snapshot = useMemo(() => getCollectionSnapshot(allRecords), [allRecords]);

  const { value: collectionValue, isLoading: isLoadingValue } = useCollectionValue(allRecords);
  const discogsArtistBreakdown = useDiscogsArtistBreakdown(allRecords);
  const artistBreakdown = discogsArtistBreakdown ?? snapshot.artistBreakdown;

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
  const countryTotal = snapshot.countryBreakdown.reduce((s, i) => s + i.count, 0);

  const topRealArtist = artistBreakdown.find(
    (a) => a.label.toLowerCase() !== "various artists",
  );

  const narrative = useMemo(() => {
    if (!allRecords.length) return [];

    const lines: string[] = [];
    const total = allRecords.length;
    const genrePct = Math.round((snapshot.topGenre.count / total) * 100);

    const leadingArtist = topRealArtist?.label ?? snapshot.topArtist.value;
    const leadingArtistCount = (topRealArtist ?? artistBreakdown[0])?.count ?? 0;

    lines.push(
      `${genrePct}% of your collection is ${snapshot.topGenre.value}, led by ${leadingArtist} with ${leadingArtistCount} records, mostly from the ${snapshot.topReleaseEra.value}.`,
    );

    const [firstGenre, secondGenre] = snapshot.genreBreakdown;
    if (firstGenre && secondGenre) {
      const combinedPct = Math.round(((firstGenre.count + secondGenre.count) / total) * 100);
      lines.push(`${firstGenre.label} and ${secondGenre.label} together make up ${combinedPct}% of what you own.`);
    }

    const [firstDecade, secondDecade] = snapshot.releaseDecadeBreakdown;
    if (firstDecade && secondDecade) {
      lines.push(
        `Most of your records come from the ${firstDecade.label}, with the ${secondDecade.label} close behind at ${secondDecade.count} records.`,
      );
    } else if (firstDecade) {
      lines.push(`Most of your records come from the ${firstDecade.label}.`);
    }

    const withYear = allRecords.filter(
      (record): record is VinylRecord & { releaseYear: number } => typeof record.releaseYear === "number",
    );
    if (withYear.length >= 2) {
      const oldest = withYear.reduce((a, b) => (b.releaseYear < a.releaseYear ? b : a));
      const newest = withYear.reduce((a, b) => (b.releaseYear > a.releaseYear ? b : a));
      if (oldest.id !== newest.id) {
        lines.push(
          `Your oldest record is ${oldest.title} (${oldest.releaseYear}), and your newest is ${newest.title} (${newest.releaseYear}), a ${newest.releaseYear - oldest.releaseYear}-year span.`,
        );
      }
    }

    if (snapshot.topMood.value !== "None") {
      lines.push(
        `When it comes to mood, ${snapshot.topMood.value} is your most-tagged vibe, showing up on ${snapshot.topMood.count} records.`,
      );
    }

    const [firstFormat] = snapshot.formatBreakdown;
    if (firstFormat && snapshot.formats > 1) {
      const formatPct = Math.round((firstFormat.count / total) * 100);
      lines.push(`${formatPct}% of your records are ${firstFormat.label}, spread across ${snapshot.formats} different formats in total.`);
    }

    if (snapshot.favorites > 0) {
      const ratio = Math.round(total / snapshot.favorites);
      lines.push(`You've marked ${snapshot.favorites} records as favorites, about 1 in every ${ratio} you own.`);
    }

    return lines;
  }, [allRecords, snapshot, topRealArtist, artistBreakdown]);

  const discogsLinkedCount = useMemo(
    () => allRecords.filter((record) => record.discogsReleaseId).length,
    [allRecords],
  );
  const discogsVerifiedCount = useMemo(
    () => allRecords.filter((record) => record.discogsVerified).length,
    [allRecords],
  );

  const categoryNarratives = useMemo(() => {
    const pctOf = (count: number, total: number) => (total > 0 ? Math.round((count / total) * 100) : 0);
    const lines: Record<string, string | undefined> = {};

    const [topGenre, secondGenre] = snapshot.genreBreakdown;
    if (topGenre) {
      lines.genre = secondGenre
        ? `${topGenre.label} is your most common genre at ${pctOf(topGenre.count, genreTotal)}%, followed by ${secondGenre.label}.`
        : `${topGenre.label} is your only genre so far, across ${topGenre.count} records.`;
    }

    const [topArtist] = artistBreakdown;
    if (topArtist) {
      lines.artist = `${topArtist.label} tops your artist list with ${topArtist.count} record${topArtist.count === 1 ? "" : "s"}, out of ${snapshot.artists} artists in all.`;
    }

    const [topReleaseDecade] = snapshot.releaseDecadeBreakdown;
    if (topReleaseDecade) {
      lines.releaseDecade = `The ${topReleaseDecade.label} is your best-represented decade, with ${topReleaseDecade.count} records (${pctOf(topReleaseDecade.count, allRecords.length)}%).`;
    }

    const [topRecordingDecade] = snapshot.recordingDecadeBreakdown;
    if (topRecordingDecade) {
      lines.recordingDecade = `Most of your music was originally recorded in the ${topRecordingDecade.label}.`;
    }

    const [topFormatCount, secondFormatCount] = snapshot.formatBreakdown;
    if (topFormatCount) {
      lines.format = secondFormatCount
        ? `${topFormatCount.label} makes up ${pctOf(topFormatCount.count, allRecords.length)}% of your collection, with ${snapshot.formats - 1} other formats mixed in.`
        : `Every record you own is ${topFormatCount.label} so far.`;
    }

    const [topLabelCount] = snapshot.labelBreakdown;
    if (topLabelCount && topLabelCount.label !== "Unknown") {
      lines.label = `${topLabelCount.label} presses more of your records than any other label, with ${topLabelCount.count} titles.`;
    }

    const [topMoodCount] = snapshot.moodBreakdown;
    if (topMoodCount) {
      lines.mood = `${topMoodCount.label} is the mood you reach for most, tagged on ${topMoodCount.count} records.`;
    }

    const [topCountry, secondCountry] = snapshot.countryBreakdown;
    if (topCountry) {
      lines.country = secondCountry
        ? `${topCountry.label} is where the most records in your collection were pressed, with ${topCountry.count} titles, followed by ${secondCountry.label}.`
        : `${topCountry.label} is the only pressing country recorded so far, across ${topCountry.count} titles.`;
    }

    const [topPlant, secondPlant] = snapshot.pressingPlantBreakdown;
    if (topPlant) {
      const known = snapshot.pressingPlantBreakdown.reduce((sum, item) => sum + item.count, 0);
      lines.pressingPlant = secondPlant
        ? `${topPlant.label} pressed more of your records than anywhere else, out of ${known} records with a known plant.`
        : `${topPlant.label} is the only pressing plant identified so far, across ${topPlant.count} records.`;
    }

    if (allRecords.length > 0) {
      const parts = [`${snapshot.owned} owned`];
      if (snapshot.wishlist > 0) parts.push(`${snapshot.wishlist} on the wishlist`);
      if (snapshot.upgrade > 0) parts.push(`${snapshot.upgrade} marked for an upgrade`);
      lines.status = `${parts.join(", ")}.`;
    }

    return lines;
  }, [allRecords.length, snapshot, genreTotal, artistBreakdown]);

  const needsAttention = useMemo(
    () => ({
      missingPhotos: allRecords.filter(
        (record) => record.status === "owned" && (!record.coverImage || !record.backCoverImage),
      ).length,
      notLinked: allRecords.filter((record) => !record.discogsReleaseId && !record.discogsNoMatch).length,
      unverifiedLinked: allRecords.filter((record) => record.discogsReleaseId && !record.discogsVerified).length,
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

  const recordsByArtist = useMemo(() => {
    const map: Record<string, VinylRecord[]> = {};
    for (const record of allRecords) (map[record.artist] ??= []).push(record);
    return map;
  }, [allRecords]);

  const chartRecords = useMemo(() => ({
    genre: groupRecordsByLabel(allRecords, (record) => record.genres),
    artist: recordsByArtist,
    releaseDecade: groupRecordsByLabel(allRecords, (record) => [getReleaseDecade(record)]),
    recordingDecade: groupRecordsByLabel(allRecords, (record) => [getRecordingDecade(record)]),
    decade: groupRecordsByLabel(allRecords, (record) => [getDecade(record)]),
    format: groupRecordsByLabel(allRecords, (record) => [record.format ?? "Unknown"]),
    label: groupRecordsByLabel(allRecords, (record) => [record.label ?? "Unknown"]),
    country: groupRecordsByLabel(allRecords, (record) => [record.country ?? "Unknown"]),
    pressingPlant: groupRecordsByLabel(allRecords, (record) => [record.pressingPlant ?? "Unknown"]),
    mood: groupRecordsByLabel(allRecords, (record) => record.moods),
    status: groupRecordsByLabel(allRecords, (record) => [record.status]),
    originalStatus: groupRecordsByLabel(
      allRecords.filter((record) => record.discogsVerified && record.pressingYear && record.originalReleaseYear),
      (record) => [isOriginalPressing(record) ? "Original pressing" : "Reissue / repress"],
    ),
  }), [allRecords, recordsByArtist]);

  const artistCommunityFact = useMemo(() => {
    const artist = topRealArtist?.label;
    if (!artist) return null;
    const artistRecords = recordsByArtist[artist] ?? [];
    const communityRecords = collectionValue?.rarityTiers.flatMap((tier) => tier.records) ?? [];
    const have = communityRecords
      .filter((entry) => entry.record.artist === artist)
      .reduce((sum, entry) => sum + entry.have, 0);
    return { artist, yours: artistRecords.length, have, known: communityRecords.some((entry) => entry.record.artist === artist) };
  }, [collectionValue, recordsByArtist, topRealArtist]);

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
    return {
      weighedCount: weighed.length,
      totalGrams: weighed.reduce((sum, record) => sum + (record.weightGrams ?? 0), 0),
      timedCount: timed.length,
      totalSeconds: timed.reduce((sum, record) => sum + (record.runtimeSeconds ?? 0), 0),
    };
  }, [allRecords]);

  const statCards = [
    { label: "Records", value: snapshot.owned },
    { label: "Artists", value: snapshot.artists },
    { label: "Genres", value: snapshot.genres },
    { label: "Favorites", value: snapshot.favorites },
    { label: "Wishlist", value: snapshot.wishlist },
    { label: "Originals", value: originalPressingStats.original },
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

      {/* Collection DNA */}
      {narrative.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-400">
            Collection DNA
          </p>
          <div className="space-y-2">
            {narrative.map((line, index) => (
              <p key={index} className="text-sm leading-relaxed text-gray-700 sm:text-base">
                {line}
              </p>
            ))}
          </div>
        </div>
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
        {statCards.map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-2 text-xl font-semibold text-gray-950 sm:text-2xl">
              <AnimatedNumber value={value} />
            </p>
          </div>
        ))}
      </div>

      {/* Collection value */}
      {isLoadingValue || collectionValue ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Collection value</h2>
          {!collectionValue ? (
            <div className="mt-4 h-9 w-32 animate-pulse rounded bg-gray-100" />
          ) : (
            <div className="mt-4 flex flex-wrap items-end gap-8">
              <div>
                <p className="text-xs text-gray-500">Estimated total</p>
                <p className="mt-1 text-3xl font-semibold text-gray-950">
                  {formatDiscogsMoney({ currency: collectionValue.currency, value: collectionValue.total })}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {collectionValue.pricedCount} of {collectionValue.linkedCount} Discogs-linked records priced
                </p>
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

      {artistCommunityFact ? (
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Interesting facts</h2>
          <div className="mt-4 rounded-lg bg-gray-50 p-4">
            <p className="text-sm leading-relaxed text-gray-700">
              {artistCommunityFact.known
                ? `Discogs collectors report ${artistCommunityFact.have.toLocaleString()} copies across ${artistCommunityFact.artist}'s pressings represented here; you have ${artistCommunityFact.yours}.`
                : `You have ${artistCommunityFact.yours} ${artistCommunityFact.artist} album${artistCommunityFact.yours === 1 ? "" : "s"}. Link a pressing to Discogs to compare it with other collectors.`}
            </p>
          </div>
        </section>
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
          title="By genre"
          narrative={categoryNarratives.genre}
          items={snapshot.genreBreakdown}
          totalCount={genreTotal}
          barColor="bg-teal-500"
          linkBase="/vinyl?genre="
          detailRecordsByLabel={chartRecords.genre}
        />
        <BreakdownSection
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
          totalCount={allRecords.length}
          barColor="bg-orange-400"
          detailRecordsByLabel={chartRecords.recordingDecade}
        />
        <BreakdownSection
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
          items={snapshot.labelBreakdown}
          totalCount={allRecords.length}
          barColor="bg-rose-500"
          detailRecordsByLabel={chartRecords.label}
        />
        <BreakdownSection
          title="By country"
          narrative={categoryNarratives.country}
          items={snapshot.countryBreakdown}
          totalCount={countryTotal}
          barColor="bg-sky-500"
          detailRecordsByLabel={chartRecords.country}
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
          totalCount={moodTotal}
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
            <InteractiveDonut items={snapshot.statusBreakdown} recordsByLabel={chartRecords.status} />
          </div>
        </section>
      </div>

      {collectionValue?.byFormat && collectionValue.byFormat.length > 1 ? (
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Value by format</h2>
          <p className="mt-1 text-xs text-gray-400">Estimated value split across the formats in your collection.</p>
          <div className="mt-5">
            <InteractiveDonut
              items={collectionValue.byFormat.map((entry) => ({ label: entry.format, count: Math.round(entry.total) }))}
              formatCount={(count) => formatDiscogsMoney({ currency: collectionValue.currency, value: count }, { cents: false })}
              recordsByLabel={chartRecords.format}
            />
          </div>
        </section>
      ) : null}

      {collectionValue?.byDecade && collectionValue.byDecade.length > 1 ? (
        <BreakdownSection
          title="Value by decade"
          narrative="Where the money in your collection actually sits, by the decade each record was released."
          items={collectionValue.byDecade.map((entry) => ({ label: entry.decade, count: Math.round(entry.total) }))}
          totalCount={collectionValue.byDecade.reduce((sum, entry) => sum + Math.round(entry.total), 0)}
          barColor="bg-emerald-500"
          formatCount={(count) => formatDiscogsMoney({ currency: collectionValue.currency, value: count }, { cents: false })}
          detailRecordsByLabel={chartRecords.releaseDecade}
        />
      ) : null}

      {collectionValue?.byGenre && collectionValue.byGenre.length > 1 ? (
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Value by genre</h2>
          <p className="mt-1 text-xs text-gray-400">Which genres carry the most estimated value.</p>
          <div className="mt-5">
            <InteractiveDonut
              items={collectionValue.byGenre.map((entry) => ({ label: entry.genre, count: Math.round(entry.total) }))}
              formatCount={(count) => formatDiscogsMoney({ currency: collectionValue.currency, value: count }, { cents: false })}
              recordsByLabel={chartRecords.genre}
            />
          </div>
        </section>
      ) : null}

      {originalPressingStats.known > 1 ? (
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Original vs. reissue</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            {Math.round((originalPressingStats.original / originalPressingStats.known) * 100)}% of your{" "}
            {originalPressingStats.known} confirmed pressings with a known first-release year are true original
            pressings, the rest are reissues or represses. Compared against each release&apos;s Discogs master year,
            not guessed from the format description.
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
                  Total weight of your {funStats.weighedCount} weighed record{funStats.weighedCount === 1 ? "" : "s"}.
                  About {Math.max(1, Math.round(funStats.totalGrams / 453.592 / 12))} bowling ball
                  {Math.max(1, Math.round(funStats.totalGrams / 453.592 / 12)) === 1 ? "" : "s"} worth of vinyl (using a 12 lb ball).
                </p>
              </div>
            ) : null}
            {collectionValue ? (
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-2xl font-semibold tabular-nums text-gray-950">
                  {Math.max(0, Math.round(collectionValue.total / 50)).toLocaleString("en-US")}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">
                  bowling balls we could have bought with the estimated value of my collection, at about $50 each.
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
                  Total runtime of your {funStats.timedCount} timed record{funStats.timedCount === 1 ? "" : "s"}. How
                  long it would take to play the whole stack back to back, no breaks. That is {formatRuntimeComparison(funStats.totalSeconds)}.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
