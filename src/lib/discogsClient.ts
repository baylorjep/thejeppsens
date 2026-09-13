import { VinylRecord } from "@/data/vinyls";
import { getBreakdown } from "@/lib/vinylAnalytics";
import { getReleaseDecade } from "@/lib/vinylRecordUtils";
import { useEffect, useState } from "react";

export type DiscogsMoney = { currency: string; value: number };

// A handful of 5-star votes shouldn't outrank a release with a real track
// record of ratings, so "highest rated" requires a minimum sample size.
const MIN_RATINGS_FOR_HIGHEST = 10;

export type DiscogsValueResponse = {
  grade: string;
  isGuess: boolean;
  estimate: DiscogsMoney | null;
  lowestListing: DiscogsMoney | null;
  numForSale: number;
  have: number | null;
  want: number | null;
  ratingAverage: number | null;
  ratingCount: number | null;
  formatDescriptions: string[];
  country: string | null;
  artists: string[];
  cached: boolean;
};

const REISSUE_KEYWORDS = ["reissue", "repress", "remaster"];

function isReissue(formatDescriptions: string[]) {
  return formatDescriptions.some((description) =>
    REISSUE_KEYWORDS.some((keyword) => description.toLowerCase().includes(keyword)),
  );
}

export function formatDiscogsMoney({ currency, value }: DiscogsMoney, options: { cents?: boolean } = {}) {
  const { cents = true } = options;

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: cents ? 2 : 0,
    }).format(value);
  } catch {
    return `${currency} ${cents ? value.toFixed(2) : Math.round(value)}`;
  }
}

// Every hook below shares this cache so two hooks needing the same
// (releaseId, condition) - useCollectionValue and useDiscogsArtistBreakdown
// both want owned+linked records, for instance - only fetch it once per
// page session. There's deliberately no client-side pacing/queueing here
// anymore: Discogs' rate limit is protected once, at the source, by the
// server (discogsServer.ts's dispatch queue) - a cache hit costs Discogs
// nothing, so gating it behind an artificial client-side delay just made
// a warm cache feel as slow as a cold one for no reason.
const discogsValueCache = new Map<string, Promise<DiscogsValueResponse | null>>();

async function rawFetchDiscogsValue(
  releaseId: number,
  condition?: string,
  forceRefresh?: boolean,
): Promise<DiscogsValueResponse | null> {
  const url = new URL(`/api/discogs/value/${releaseId}`, window.location.origin);
  if (condition) url.searchParams.set("condition", condition);
  if (forceRefresh) url.searchParams.set("refresh", "true");

  const response = await fetch(url);
  if (!response.ok) return null;

  return (await response.json()) as DiscogsValueResponse;
}

export function fetchDiscogsValue(
  releaseId: number,
  condition?: string,
  options: { forceRefresh?: boolean } = {},
): Promise<DiscogsValueResponse | null> {
  const key = `${releaseId}::${condition ?? ""}`;

  if (options.forceRefresh) {
    const run = rawFetchDiscogsValue(releaseId, condition, true);
    discogsValueCache.set(key, run);
    return run;
  }

  const cached = discogsValueCache.get(key);
  if (cached) return cached;

  const run = rawFetchDiscogsValue(releaseId, condition);
  discogsValueCache.set(key, run);
  return run;
}

export type CollectionValueSummary = {
  total: number;
  currency: string;
  pricedCount: number;
  linkedCount: number;
  unverifiedCount: number;
  mostValuable?: { record: VinylRecord; value: number };
  cheapest?: { record: VinylRecord; value: number };
  rarest?: { record: VinylRecord; have: number };
  mostWanted?: { record: VinylRecord; want: number };
  highestRated?: { record: VinylRecord; average: number; count: number };
  byFormat: { format: string; total: number; count: number }[];
  byDecade: { decade: string; total: number; count: number }[];
  byGenre: { genre: string; total: number; count: number }[];
  currentlyListedCount: number;
  originalCount: number;
  reissueCount: number;
};

function aggregateCollectionValue(
  results: { record: VinylRecord; value: DiscogsValueResponse | null }[],
  linkedCount: number,
): CollectionValueSummary {
  let total = 0;
  let currency = "USD";
  let pricedCount = 0;
  let unverifiedCount = 0;
  let mostValuable: { record: VinylRecord; value: number } | undefined;
  let cheapest: { record: VinylRecord; value: number } | undefined;
  let rarest: { record: VinylRecord; have: number } | undefined;
  let mostWanted: { record: VinylRecord; want: number } | undefined;
  let highestRated: { record: VinylRecord; average: number; count: number } | undefined;
  let currentlyListedCount = 0;
  let originalCount = 0;
  let reissueCount = 0;
  const byFormatMap = new Map<string, { total: number; count: number }>();
  const byDecadeMap = new Map<string, { total: number; count: number }>();
  const byGenreMap = new Map<string, { total: number; count: number }>();

  for (const { record, value: recordValue } of results) {
    const priced = recordValue?.estimate ?? recordValue?.lowestListing;
    if (priced) {
      total += priced.value;
      currency = priced.currency;
      pricedCount += 1;
      if (!record.discogsVerified) unverifiedCount += 1;
      if (!mostValuable || priced.value > mostValuable.value) {
        mostValuable = { record, value: priced.value };
      }
      if (!cheapest || priced.value < cheapest.value) {
        cheapest = { record, value: priced.value };
      }

      const formatKey = record.format || "Unknown";
      const existingFormat = byFormatMap.get(formatKey) ?? { total: 0, count: 0 };
      byFormatMap.set(formatKey, { total: existingFormat.total + priced.value, count: existingFormat.count + 1 });

      const decadeKey = getReleaseDecade(record);
      if (decadeKey !== "Unknown") {
        const existingDecade = byDecadeMap.get(decadeKey) ?? { total: 0, count: 0 };
        byDecadeMap.set(decadeKey, { total: existingDecade.total + priced.value, count: existingDecade.count + 1 });
      }

      for (const genre of record.genres) {
        const existingGenre = byGenreMap.get(genre) ?? { total: 0, count: 0 };
        byGenreMap.set(genre, { total: existingGenre.total + priced.value, count: existingGenre.count + 1 });
      }
    }

    if ((recordValue?.numForSale ?? 0) > 0) currentlyListedCount += 1;

    if (recordValue) {
      if (isReissue(recordValue.formatDescriptions)) reissueCount += 1;
      else originalCount += 1;
    }

    if (typeof recordValue?.have === "number") {
      if (!rarest || recordValue.have < rarest.have) {
        rarest = { record, have: recordValue.have };
      }
    }
    if (typeof recordValue?.want === "number") {
      if (!mostWanted || recordValue.want > mostWanted.want) {
        mostWanted = { record, want: recordValue.want };
      }
    }
    if (typeof recordValue?.ratingAverage === "number" && (recordValue.ratingCount ?? 0) >= MIN_RATINGS_FOR_HIGHEST) {
      if (!highestRated || recordValue.ratingAverage > highestRated.average) {
        highestRated = { record, average: recordValue.ratingAverage, count: recordValue.ratingCount ?? 0 };
      }
    }
  }

  const byFormat = [...byFormatMap.entries()]
    .map(([format, { total: formatTotal, count }]) => ({ format, total: formatTotal, count }))
    .sort((a, b) => b.total - a.total);

  const byDecade = [...byDecadeMap.entries()]
    .map(([decade, { total: decadeTotal, count }]) => ({ decade, total: decadeTotal, count }))
    .sort((a, b) => a.decade.localeCompare(b.decade));

  const byGenre = [...byGenreMap.entries()]
    .map(([genre, { total: genreTotalValue, count }]) => ({ genre, total: genreTotalValue, count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  return {
    total,
    currency,
    pricedCount,
    linkedCount,
    unverifiedCount,
    mostValuable,
    cheapest,
    rarest,
    mostWanted,
    highestRated,
    byFormat,
    byDecade,
    byGenre,
    currentlyListedCount,
    originalCount,
    reissueCount,
  };
}

/**
 * Estimated total value of owned, Discogs-linked records. Every record's
 * fetch fires immediately (no client-side pacing - see the comment above
 * discogsValueCache), and the summary updates as each one resolves. With a
 * warm cache this settles in seconds; a cold one is bounded by the server's
 * own paced queue instead.
 */
export function useCollectionValue(records: VinylRecord[]) {
  const [value, setValue] = useState<CollectionValueSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const ownedLinkedRecords = records.filter((record) => record.status === "owned" && record.discogsReleaseId);
    if (!ownedLinkedRecords.length) {
      setValue(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    const collected: { record: VinylRecord; value: DiscogsValueResponse | null }[] = [];
    let remaining = ownedLinkedRecords.length;

    ownedLinkedRecords.forEach((record) => {
      fetchDiscogsValue(record.discogsReleaseId!, record.condition).then((recordValue) => {
        if (cancelled) return;
        collected.push({ record, value: recordValue });
        setValue(aggregateCollectionValue(collected, ownedLinkedRecords.length));
        remaining -= 1;
        if (remaining <= 0) setIsLoading(false);
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records]);

  return { value, isLoading };
}

/**
 * A record's `artist` field is one free-text string, so a collaboration
 * credit ("Frank Sinatra & Antônio Carlos Jobim") counts as its own bucket
 * instead of adding to either artist's total - undercounting anyone who
 * appears on duets/collabs. Splitting that text ourselves isn't safe (real
 * act names like "Hall & Oates" or "Simon and Garfunkel" would get shredded
 * too), but Discogs already stores each release's artist credits as a
 * proper list of separate names, so for linked records we use that instead.
 * Unlinked records fall back to the raw `artist` string as one entry.
 *
 * Shares the same fetch cache as useCollectionValue, so for records both
 * hooks need (owned + linked), this doesn't cost any extra requests.
 */
export function useDiscogsArtistBreakdown(records: VinylRecord[]) {
  const [breakdown, setBreakdown] = useState<{ label: string; count: number }[] | null>(null);

  useEffect(() => {
    const linkedRecords = records.filter((record) => record.discogsReleaseId);
    setBreakdown(getBreakdown(records.map((record) => record.artist)));

    if (!linkedRecords.length) return;

    let cancelled = false;
    const creditsByRecordId = new Map<string, string[]>();

    linkedRecords.forEach((record) => {
      fetchDiscogsValue(record.discogsReleaseId!, record.condition).then((recordValue) => {
        if (cancelled) return;
        if (recordValue?.artists.length) creditsByRecordId.set(record.id, recordValue.artists);

        const allCredits = records.flatMap((r) => creditsByRecordId.get(r.id) ?? [r.artist]);
        setBreakdown(getBreakdown(allCredits));
      });
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records]);

  return breakdown;
}
