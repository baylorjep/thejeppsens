import { VinylRecord } from "@/data/vinyls";
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
  pricedRecords: { record: VinylRecord; value: number }[];
  currentlyListedCount: number;
  originalCount: number;
  reissueCount: number;
  rarestRecords: { record: VinylRecord; have: number }[];
  mostWantedRecords: { record: VinylRecord; want: number }[];
  rarityTiers: { tier: string; count: number; records: { record: VinylRecord; have: number }[] }[];
  wantTiers: { tier: string; count: number; records: { record: VinylRecord; want: number }[] }[];
};

export const RARITY_TIERS = [
  { label: "Ultra rare", max: 100 },
  { label: "Rare", max: 500 },
  { label: "Uncommon", max: 2000 },
  { label: "Common", max: Infinity },
] as const;

export function rarityTierLabel(have: number) {
  return RARITY_TIERS.find((tier) => have < tier.max)?.label ?? RARITY_TIERS[RARITY_TIERS.length - 1].label;
}

export const WANT_TIERS = [
  { label: "Low demand", max: 25 },
  { label: "Some demand", max: 100 },
  { label: "In demand", max: 500 },
  { label: "Highly wanted", max: Infinity },
] as const;

export function wantTierLabel(want: number) {
  return WANT_TIERS.find((tier) => want < tier.max)?.label ?? WANT_TIERS[WANT_TIERS.length - 1].label;
}

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
  let highestRated: { record: VinylRecord; average: number; count: number } | undefined;
  let currentlyListedCount = 0;
  let originalCount = 0;
  let reissueCount = 0;
  const byFormatMap = new Map<string, { total: number; count: number }>();
  const byDecadeMap = new Map<string, { total: number; count: number }>();
  const byGenreMap = new Map<string, { total: number; count: number }>();
  const haveEntries: { record: VinylRecord; have: number }[] = [];
  const wantEntries: { record: VinylRecord; want: number }[] = [];
  const pricedRecords: { record: VinylRecord; value: number }[] = [];

  for (const { record, value: recordValue } of results) {
    const priced = recordValue?.estimate;
    if (priced) {
      pricedRecords.push({ record, value: priced.value });
      total += priced.value;
      currency = priced.currency;
      pricedCount += 1;
      if (!record.discogsVerified && !record.discogsNoMatch) unverifiedCount += 1;
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

    // A not-on-Discogs record's have count belongs to its closest comparable, not to it.
    if (typeof recordValue?.have === "number" && !record.discogsNoMatch) {
      // You own this copy, so at least one person has it even if nobody has logged it on Discogs.
      haveEntries.push({ record, have: Math.max(1, recordValue.have) });
    }
    if (typeof recordValue?.want === "number") {
      wantEntries.push({ record, want: recordValue.want });
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

  const rarestRecords = [...haveEntries].sort((a, b) => a.have - b.have).slice(0, 10);
  const mostWantedRecords = [...wantEntries].sort((a, b) => b.want - a.want).slice(0, 10);

  const tierRecords = new Map<string, { record: VinylRecord; have: number }[]>(
    RARITY_TIERS.map((tier) => [tier.label, []]),
  );
  for (const entry of haveEntries) {
    const tier = rarityTierLabel(entry.have);
    tierRecords.get(tier)?.push(entry);
  }
  const rarityTiers = RARITY_TIERS.map((tier) => ({
    tier: tier.label,
    count: tierRecords.get(tier.label)?.length ?? 0,
    records: (tierRecords.get(tier.label) ?? []).sort((a, b) => a.have - b.have),
  })).filter((entry) => entry.count > 0);

  const wantTierRecords = new Map<string, { record: VinylRecord; want: number }[]>(
    WANT_TIERS.map((tier) => [tier.label, []]),
  );
  for (const entry of wantEntries) {
    const tier = wantTierLabel(entry.want);
    wantTierRecords.get(tier)?.push(entry);
  }
  const wantTiers = WANT_TIERS.map((tier) => ({
    tier: tier.label,
    count: wantTierRecords.get(tier.label)?.length ?? 0,
    records: (wantTierRecords.get(tier.label) ?? []).sort((a, b) => b.want - a.want),
  })).filter((entry) => entry.count > 0);

  return {
    total,
    currency,
    pricedCount,
    linkedCount,
    unverifiedCount,
    mostValuable,
    cheapest,
    rarest: rarestRecords[0],
    mostWanted: mostWantedRecords[0],
    highestRated,
    byFormat,
    byDecade,
    byGenre,
    pricedRecords,
    currentlyListedCount,
    originalCount,
    reissueCount,
    rarestRecords,
    mostWantedRecords,
    rarityTiers,
    wantTiers,
  };
}

/**
 * Estimated total value of owned, Discogs-linked records. Every record's
 * fetch fires immediately (no client-side pacing - see the comment above
 * discogsValueCache), and the summary updates as each one resolves. With a
 * warm cache this settles in seconds; a cold one is bounded by the server's
 * own paced queue instead.
 */
/**
 * When the exact pressing has never sold on Discogs, borrow the price from the
 * record's chosen twin release. Owners/wants stay the pressing's own.
 */
export async function fetchDiscogsValueWithReference(record: VinylRecord): Promise<DiscogsValueResponse | null> {
  const own = await fetchDiscogsValue(record.discogsReleaseId!, record.condition);
  if (!record.priceReferenceReleaseId || own?.estimate || own?.lowestListing) return own;
  const twin = await fetchDiscogsValue(record.priceReferenceReleaseId, record.condition);
  if (!twin || (!twin.estimate && !twin.lowestListing)) return own;
  return own ? { ...own, estimate: twin.estimate, lowestListing: twin.lowestListing, numForSale: twin.numForSale } : twin;
}

export function useCollectionValue(records: VinylRecord[]) {
  const [value, setValue] = useState<CollectionValueSummary | null>(null);
  const [isLoading, setIsLoading] = useState(() => records.some((record) => record.status === "owned" && record.discogsReleaseId));

  useEffect(() => {
    let cancelled = false;
    const ownedLinkedRecords = records.filter((record) => record.status === "owned" && record.discogsReleaseId);  // owned only: wishlist never counts toward value
    if (!ownedLinkedRecords.length) {
      queueMicrotask(() => { if (!cancelled) { setValue(null); setIsLoading(false); } });
      return () => { cancelled = true; };
    }

    queueMicrotask(() => { if (!cancelled) { setValue(null); setIsLoading(true); } });
    const collected: { record: VinylRecord; value: DiscogsValueResponse | null }[] = [];
    let remaining = ownedLinkedRecords.length;

    ownedLinkedRecords.forEach((record) => {
      fetchDiscogsValueWithReference(record).catch(() => null).then((recordValue) => {
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
  }, [records]);

  return { value, isLoading };
}
