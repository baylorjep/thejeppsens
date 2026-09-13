import { VinylRecord } from "@/data/vinyls";
import { useEffect, useState } from "react";

export type DiscogsMoney = { currency: string; value: number };

export type DiscogsValueResponse = {
  grade: string;
  isGuess: boolean;
  estimate: DiscogsMoney | null;
  lowestListing: DiscogsMoney | null;
  numForSale: number;
};

export function formatDiscogsMoney({ currency, value }: DiscogsMoney) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
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

      for (const { record, value: recordValue } of results) {
        const priced = recordValue?.estimate ?? recordValue?.lowestListing;
        if (!priced) continue;
        total += priced.value;
        currency = priced.currency;
        pricedCount += 1;
        if (!record.discogsVerified) unverifiedCount += 1;
        if (!mostValuable || priced.value > mostValuable.value) {
          mostValuable = { record, value: priced.value };
        }
      }

      setValue({ total, currency, pricedCount, linkedCount: ownedLinkedRecords.length, unverifiedCount, mostValuable });
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records]);

  return { value, isLoading };
}
