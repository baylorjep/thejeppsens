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
