const DISCOGS_API_BASE = "https://api.discogs.com";
const DISCOGS_USER_AGENT = "TheJeppsensVinylApp/1.0 +https://thejeppsens.com";

export type DiscogsSearchResult = {
  id: number;
  title: string;
  year?: string;
  thumb?: string;
  cover_image?: string;
  format?: string[];
  label?: string[];
  catno?: string;
  genre?: string[];
  style?: string[];
};

export type DiscogsRelease = {
  id: number;
  title: string;
  artists?: { name: string }[];
  year?: number;
  genres?: string[];
  styles?: string[];
  labels?: { name: string; catno?: string }[];
  formats?: { name: string; qty?: string; descriptions?: string[] }[];
  tracklist?: { position?: string; title: string; type_?: string }[];
  images?: { type?: string; uri?: string; uri150?: string }[];
  notes?: string;
  country?: string;
  released?: string;
};

function discogsHeaders() {
  return {
    "User-Agent": DISCOGS_USER_AGENT,
    Authorization: `Discogs token=${process.env.DISCOGS_TOKEN}`,
  };
}

export async function searchDiscogsReleases(query: string) {
  if (!process.env.DISCOGS_TOKEN) return null;

  const url = new URL(`${DISCOGS_API_BASE}/database/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("type", "release");
  url.searchParams.set("format", "Vinyl");
  url.searchParams.set("per_page", "12");

  const response = await fetch(url, { headers: discogsHeaders() });
  if (!response.ok) throw new Error(`Discogs search failed (${response.status})`);

  const data = (await response.json()) as { results?: DiscogsSearchResult[] };
  const results = data.results ?? [];

  // Belt-and-suspenders: Discogs' own format filter isn't airtight, so drop
  // anything that slips through without "Vinyl" in its format list (CDs, DVDs,
  // cassettes of the same title do turn up otherwise).
  return results.filter((result) => (result.format ?? []).some((format) => format.toLowerCase() === "vinyl"));
}

export async function fetchDiscogsRelease(releaseId: string) {
  if (!process.env.DISCOGS_TOKEN) return null;

  const response = await fetch(`${DISCOGS_API_BASE}/releases/${releaseId}`, {
    headers: discogsHeaders(),
  });
  if (!response.ok) throw new Error(`Discogs release lookup failed (${response.status})`);

  return (await response.json()) as DiscogsRelease;
}

export type DiscogsPrice = { currency: string; value: number };

export type DiscogsPriceSuggestions = Record<string, DiscogsPrice>;

export type DiscogsMarketplaceStats = {
  lowest_price: DiscogsPrice | null;
  num_for_sale: number;
  blocked_from_sale?: boolean;
};

export const DISCOGS_GRADES = [
  "Mint (M)",
  "Near Mint (NM or M-)",
  "Very Good Plus (VG+)",
  "Very Good (VG)",
  "Good Plus (G+)",
  "Good (G)",
  "Fair (F)",
  "Poor (P)",
] as const;

export function normalizeConditionToDiscogsGrade(condition?: string): { grade: string; isGuess: boolean } {
  const value = (condition ?? "").trim().toLowerCase();

  if (value.includes("near mint") || value === "nm" || value.includes("m-")) {
    return { grade: "Near Mint (NM or M-)", isGuess: false };
  }
  if (value.includes("sealed") || value.includes("new") || value === "m" || value.includes("mint (m)")) {
    return { grade: "Mint (M)", isGuess: false };
  }
  if (value.includes("vg+") || value.includes("very good plus")) {
    return { grade: "Very Good Plus (VG+)", isGuess: false };
  }
  if (value.includes("vg") || value.includes("very good")) {
    return { grade: "Very Good (VG)", isGuess: false };
  }
  if (value.includes("g+") || value.includes("good plus")) {
    return { grade: "Good Plus (G+)", isGuess: false };
  }
  if (value.includes("good")) {
    return { grade: "Good (G)", isGuess: false };
  }
  if (value.includes("fair")) {
    return { grade: "Fair (F)", isGuess: false };
  }
  if (value.includes("poor")) {
    return { grade: "Poor (P)", isGuess: false };
  }

  return { grade: "Very Good Plus (VG+)", isGuess: true };
}

export async function fetchDiscogsPriceSuggestions(releaseId: string) {
  if (!process.env.DISCOGS_TOKEN) return null;

  const response = await fetch(`${DISCOGS_API_BASE}/marketplace/price_suggestions/${releaseId}`, {
    headers: discogsHeaders(),
  });
  if (response.status === 404) return {} as DiscogsPriceSuggestions;
  if (!response.ok) throw new Error(`Discogs price suggestions failed (${response.status})`);

  return (await response.json()) as DiscogsPriceSuggestions;
}

export async function fetchDiscogsMarketplaceStats(releaseId: string) {
  if (!process.env.DISCOGS_TOKEN) return null;

  const url = new URL(`${DISCOGS_API_BASE}/marketplace/stats/${releaseId}`);
  url.searchParams.set("curr_abbr", "USD");

  const response = await fetch(url, { headers: discogsHeaders() });
  if (!response.ok) throw new Error(`Discogs marketplace stats failed (${response.status})`);

  return (await response.json()) as DiscogsMarketplaceStats;
}
