import { VinylRecord } from "@/data/vinyls";
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
};

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

export async function fetchDiscogsValue(releaseId: number, condition?: string) {
  const url = new URL(`/api/discogs/value/${releaseId}`, window.location.origin);
  if (condition) url.searchParams.set("condition", condition);

  const response = await fetch(url);
  if (!response.ok) return null;

  return (await response.json()) as DiscogsValueResponse;
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
};

/**
 * Estimated total value of owned, Discogs-linked records. Fetches one
 * price lookup per linked record, so keep it to pages that actually
 * display the number rather than calling it from every list render.
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

    let active = true;
    setIsLoading(true);

    Promise.all(
      ownedLinkedRecords.map(async (record) => ({
        record,
        value: await fetchDiscogsValue(record.discogsReleaseId!, record.condition),
      })),
    ).then((results) => {
      if (!active) return;

      let total = 0;
      let currency = "USD";
      let pricedCount = 0;
      let unverifiedCount = 0;
      let mostValuable: { record: VinylRecord; value: number } | undefined;
      let cheapest: { record: VinylRecord; value: number } | undefined;
      let rarest: { record: VinylRecord; have: number } | undefined;
      let mostWanted: { record: VinylRecord; want: number } | undefined;
      let highestRated: { record: VinylRecord; average: number; count: number } | undefined;
      const byFormatMap = new Map<string, { total: number; count: number }>();

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
          const existing = byFormatMap.get(formatKey) ?? { total: 0, count: 0 };
          byFormatMap.set(formatKey, { total: existing.total + priced.value, count: existing.count + 1 });
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

      setValue({
        total,
        currency,
        pricedCount,
        linkedCount: ownedLinkedRecords.length,
        unverifiedCount,
        mostValuable,
        cheapest,
        rarest,
        mostWanted,
        highestRated,
        byFormat,
      });
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records]);

  return { value, isLoading };
}
