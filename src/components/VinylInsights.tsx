"use client";

import { VinylRecord } from "@/data/vinyls";
import DonutChart from "@/components/DonutChart";
import { formatDiscogsMoney, useCollectionValue, useDiscogsArtistBreakdown } from "@/lib/discogsClient";
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
  narrative,
  items,
  totalCount,
  barColor = "bg-gray-950",
  linkBase,
  formatCount = (count) => String(count),
}: {
  title: string;
  narrative?: string;
  items: { label: string; count: number }[];
  totalCount: number;
  barColor?: string;
  linkBase?: string;
  formatCount?: (count: number) => string;
}) {
  const [showAll, setShowAll] = useState(false);
  // Bars are sized relative to the largest value, not necessarily items[0] -
  // some breakdowns (value by decade) are sorted chronologically rather
  // than by count, so items[0] isn't reliably the max.
  const topCount = Math.max(...items.map((item) => item.count), 1);
  const visible = showAll ? items : items.slice(0, 8);

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
        />
        <BreakdownSection
          title="Top artists"
          narrative={categoryNarratives.artist}
          items={artistBreakdown}
          totalCount={artistBreakdown.reduce((sum, item) => sum + item.count, 0)}
          barColor="bg-blue-500"
        />
        <BreakdownSection
          title="By release decade"
          narrative={categoryNarratives.releaseDecade}
          items={snapshot.releaseDecadeBreakdown}
          totalCount={allRecords.length}
          barColor="bg-amber-500"
          linkBase="/vinyl?decade="
        />
        <BreakdownSection
          title="By recording decade"
          narrative={categoryNarratives.recordingDecade}
          items={snapshot.recordingDecadeBreakdown}
          totalCount={allRecords.length}
          barColor="bg-orange-400"
        />
        <BreakdownSection
          title="By format"
          narrative={categoryNarratives.format}
          items={snapshot.formatBreakdown}
          totalCount={allRecords.length}
          barColor="bg-purple-500"
        />
        <BreakdownSection
          title="By label"
          narrative={categoryNarratives.label}
          items={snapshot.labelBreakdown}
          totalCount={allRecords.length}
          barColor="bg-rose-500"
        />
        <BreakdownSection
          title="Top moods"
          narrative={categoryNarratives.mood}
          items={snapshot.moodBreakdown}
          totalCount={moodTotal}
          barColor="bg-violet-500"
          linkBase="/vinyl?mood="
        />
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">By status</h2>
          {categoryNarratives.status ? (
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{categoryNarratives.status}</p>
          ) : null}
          <div className="mt-5">
            <DonutChart items={snapshot.statusBreakdown} />
          </div>
        </section>
      </div>

      {collectionValue?.byFormat && collectionValue.byFormat.length > 1 ? (
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Value by format</h2>
          <p className="mt-1 text-xs text-gray-400">Estimated value split across the formats in your collection.</p>
          <div className="mt-5">
            <DonutChart
              items={collectionValue.byFormat.map((entry) => ({ label: entry.format, count: Math.round(entry.total) }))}
              formatCount={(count) => formatDiscogsMoney({ currency: collectionValue.currency, value: count }, { cents: false })}
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
        />
      ) : null}

      {collectionValue?.byGenre && collectionValue.byGenre.length > 1 ? (
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Value by genre</h2>
          <p className="mt-1 text-xs text-gray-400">Which genres carry the most estimated value.</p>
          <div className="mt-5">
            <DonutChart
              items={collectionValue.byGenre.map((entry) => ({ label: entry.genre, count: Math.round(entry.total) }))}
              formatCount={(count) => formatDiscogsMoney({ currency: collectionValue.currency, value: count }, { cents: false })}
            />
          </div>
        </section>
      ) : null}

      {collectionValue && collectionValue.originalCount + collectionValue.reissueCount > 1 ? (
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Original vs. reissue</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            {Math.round(
              (collectionValue.originalCount / (collectionValue.originalCount + collectionValue.reissueCount)) * 100,
            )}
            % of your linked records are original pressings, the rest are reissues or represses.
          </p>
          <div className="mt-5">
            <DonutChart
              items={[
                { label: "Original pressing", count: collectionValue.originalCount },
                { label: "Reissue / repress", count: collectionValue.reissueCount },
              ].filter((item) => item.count > 0)}
            />
          </div>
        </section>
      ) : null}

      {collectionValue?.byCountry && collectionValue.byCountry.length > 1 ? (
        <section className="rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Country of origin</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            Your pressings come from {collectionValue.byCountry.length} different countries, mostly{" "}
            {collectionValue.byCountry[0].country}.
          </p>
          <div className="mt-5">
            <DonutChart
              items={
                collectionValue.byCountry.length > 6
                  ? [
                      ...collectionValue.byCountry.slice(0, 6).map((entry) => ({ label: entry.country, count: entry.count })),
                      {
                        label: "Other",
                        count: collectionValue.byCountry.slice(6).reduce((sum, entry) => sum + entry.count, 0),
                      },
                    ]
                  : collectionValue.byCountry.map((entry) => ({ label: entry.country, count: entry.count }))
              }
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}
