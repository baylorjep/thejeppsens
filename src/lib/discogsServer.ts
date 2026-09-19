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
  tracklist?: { position?: string; title: string; type_?: string; duration?: string }[];
  images?: { type?: string; uri?: string; uri150?: string }[];
  notes?: string;
  country?: string;
  released?: string;
  community?: { have?: number; want?: number; rating?: { average?: number; count?: number } };
  estimated_weight?: number;
  master_id?: number;
  companies?: { name: string; entity_type_name?: string }[];
};

function discogsHeaders() {
  return {
    "User-Agent": DISCOGS_USER_AGENT,
    Authorization: `Discogs token=${process.env.DISCOGS_TOKEN}`,
  };
}

// Discogs allows ~60 authenticated requests/minute. This is the one place
// every actual outbound Discogs HTTP call passes through (search, release,
// price suggestions, marketplace stats), so it's the right place to pace
// them - not the callers, and not the client. ~1.1s between real dispatches
// keeps sustained throughput under the limit regardless of how many
// concurrent requests land on the app (cache hits elsewhere never reach
// this queue at all, since they never needed to call Discogs).
const DISCOGS_DISPATCH_DELAY_MS = 1100;
let discogsDispatchQueue: Promise<unknown> = Promise.resolve();

function queueDiscogsDispatch<T>(task: () => Promise<T>): Promise<T> {
  const run = discogsDispatchQueue.then(task, task);
  discogsDispatchQueue = run.then(
    () => new Promise((resolve) => setTimeout(resolve, DISCOGS_DISPATCH_DELAY_MS)),
    () => new Promise((resolve) => setTimeout(resolve, DISCOGS_DISPATCH_DELAY_MS)),
  );
  return run;
}

/**
 * A 429 here is a "slow down," not a real failure - retry with backoff
 * (honoring Retry-After when Discogs sends one) instead of surfacing it as
 * missing data. The retry itself also goes through the paced queue.
 */
async function discogsFetch(url: string | URL, attempt = 0, signal?: AbortSignal): Promise<Response> {
  const response = await queueDiscogsDispatch(() => { signal?.throwIfAborted(); return fetch(url, { headers: discogsHeaders(), signal }); });
  // Interactive matching falls back to review on throttling instead of waiting through retries.
  if (response.status !== 429 || attempt >= 3 || signal) return response;

  const retryAfterHeader = response.headers.get("retry-after");
  const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : (attempt + 1) * 2000;

  await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfterMs) ? retryAfterMs : 2000));
  return discogsFetch(url, attempt + 1, signal);
}

export async function searchDiscogsReleases(query: string) {
  if (!process.env.DISCOGS_TOKEN) return null;

  const url = new URL(`${DISCOGS_API_BASE}/database/search`);
  url.searchParams.set("q", query);
  url.searchParams.set("type", "release");
  url.searchParams.set("format", "Vinyl");
  url.searchParams.set("per_page", "12");

  const response = await discogsFetch(url);
  if (!response.ok) throw new Error(`Discogs search failed (${response.status})`);

  const data = (await response.json()) as { results?: DiscogsSearchResult[] };
  const results = data.results ?? [];

  // Belt-and-suspenders: Discogs' own format filter isn't airtight, so drop
  // anything that slips through without "Vinyl" in its format list (CDs, DVDs,
  // cassettes of the same title do turn up otherwise).
  return results.filter((result) => (result.format ?? []).some((format) => format.toLowerCase() === "vinyl"));
}

export type DiscogsArtistAlbum = { id: number; artist: string; title: string; year: number | null; cover: string | null };

// Formats that mean "not a plain album" on a Discogs master (its format list is the
// union of every release under it, so compilations and singles show up tagged).
const NON_ALBUM_FORMATS = new Set(["compilation", "box set", "club edition", "promo", "ep", "single", "unofficial release", "bootleg", "mini-album"]);

/**
 * Albums Discogs lists for an artist, one row per master (so reissues collapse into
 * the album). Discogs search is fuzzy on artist, so callers should treat this as a
 * discovery list, not a complete or authoritative discography.
 */
export async function searchDiscogsArtistAlbums(artist: string): Promise<DiscogsArtistAlbum[] | null> {
  if (!process.env.DISCOGS_TOKEN) return null;

  const url = new URL(`${DISCOGS_API_BASE}/database/search`);
  url.searchParams.set("type", "master");
  url.searchParams.set("artist", artist);
  url.searchParams.set("format", "Album");
  url.searchParams.set("per_page", "100");

  const response = await discogsFetch(url);
  if (!response.ok) throw new Error(`Discogs artist search failed (${response.status})`);

  const data = (await response.json()) as { results?: (DiscogsSearchResult & { cover_image?: string })[] };
  const wanted = artist.toLowerCase();
  const seen = new Set<string>();
  const albums: DiscogsArtistAlbum[] = [];

  for (const result of data.results ?? []) {
    const [credited, ...rest] = result.title.split(" - ");
    const title = rest.join(" - ").trim();
    const creditedLower = credited.toLowerCase();
    // Lead credit only, and not a different artist who shares the name ("Frank Sinatra Jr.").
    if (!title || !creditedLower.startsWith(wanted) || /^\s+(jr|sr)\b/.test(creditedLower.slice(wanted.length))) continue;

    const formats = (result.format ?? []).map((format) => format.toLowerCase());
    if (!formats.some((format) => format === "vinyl" || format === "lp")) continue;
    if (formats.some((format) => NON_ALBUM_FORMATS.has(format))) continue;

    const key = title.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (seen.has(key)) continue;
    seen.add(key);

    const year = Number(result.year);
    albums.push({
      id: result.id,
      artist: credited.replace(/\s*\(\d+\)$/, "").trim(),
      title,
      year: Number.isFinite(year) && year > 0 ? year : null,
      cover: result.cover_image ?? result.thumb ?? null,
    });
  }

  return albums.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
}

export type DiscogsGenreAlbum = DiscogsArtistAlbum & { have: number; want: number };

const DISCOGS_GENRES = new Set(["blues", "brass & military", "children's", "classical", "electronic", "folk, world, & country", "funk / soul", "hip hop", "jazz", "latin", "non-music", "pop", "reggae", "rock", "stage & screen"]);

async function searchMasterAlbums(filters: Record<string, string>, sort: "have" | "want", label: string): Promise<DiscogsGenreAlbum[]> {
  const url = new URL(`${DISCOGS_API_BASE}/database/search`);
  url.searchParams.set("type", "master");
  url.searchParams.set("format", "Album");
  for (const [key, value] of Object.entries(filters)) url.searchParams.set(key, value);
  url.searchParams.set("sort", sort);
  url.searchParams.set("sort_order", "desc");
  url.searchParams.set("per_page", "50");

  const response = await discogsFetch(url);
  if (!response.ok) throw new Error(`Discogs ${label} search failed (${response.status})`);

  const data = (await response.json()) as { results?: (DiscogsSearchResult & { community?: { have?: number; want?: number } })[] };
  const albums: DiscogsGenreAlbum[] = [];
  const seen = new Set<string>();

  for (const result of data.results ?? []) {
    const [credited, ...rest] = result.title.split(" - ");
    const title = rest.join(" - ").trim();
    if (!title) continue;

    const formats = (result.format ?? []).map((format) => format.toLowerCase());
    if (!formats.some((format) => format === "vinyl" || format === "lp")) continue;
    if (formats.some((format) => NON_ALBUM_FORMATS.has(format))) continue;

    const key = `${credited}|${title}`.toLowerCase().replace(/[^a-z0-9|]+/g, "");
    if (seen.has(key)) continue;
    seen.add(key);

    const year = Number(result.year);
    albums.push({
      id: result.id,
      artist: credited.replace(/\s*\(\d+\)$/, "").trim(),
      title,
      year: Number.isFinite(year) && year > 0 ? year : null,
      cover: result.cover_image ?? result.thumb ?? null,
      have: result.community?.have ?? 0,
      want: result.community?.want ?? 0,
    });
  }

  return albums;
}

/** Most-collected albums Discogs lists for a genre or style, one row per master. */
export async function searchDiscogsGenreAlbums(name: string): Promise<DiscogsGenreAlbum[] | null> {
  if (!process.env.DISCOGS_TOKEN) return null;
  const filters = { [DISCOGS_GENRES.has(name.toLowerCase()) ? "genre" : "style"]: name };
  return searchMasterAlbums(filters, "have", "genre");
}

/**
 * The albums from the last two years that Discogs collectors want most. Discogs has no "viral"
 * signal, so wantlist counts on new releases stand in for what is buzzing right now.
 */
export async function searchDiscogsTrendingAlbums(): Promise<DiscogsGenreAlbum[] | null> {
  if (!process.env.DISCOGS_TOKEN) return null;
  const thisYear = new Date().getFullYear();
  const recent = await Promise.all([thisYear, thisYear - 1].map((year) => searchMasterAlbums({ year: String(year) }, "want", "trending")));
  return recent.flat().sort((a, b) => b.want - a.want);
}

export async function fetchDiscogsRelease(releaseId: string) {
  if (!process.env.DISCOGS_TOKEN) return null;

  const response = await discogsFetch(`${DISCOGS_API_BASE}/releases/${releaseId}`);
  if (!response.ok) throw new Error(`Discogs release lookup failed (${response.status})`);

  return (await response.json()) as DiscogsRelease;
}

// The release's own `year` is when *this pressing* came out; the master's `year`
// is when the album was *first* released, full stop. Comparing the two is the
// only reliable way to tell an original pressing from a later reissue.
export async function fetchDiscogsMasterYear(masterId: number): Promise<number | null> {
  if (!process.env.DISCOGS_TOKEN) return null;

  const response = await discogsFetch(`${DISCOGS_API_BASE}/masters/${masterId}`);
  if (!response.ok) return null;

  const data = (await response.json()) as { year?: number };
  return data.year && data.year > 0 ? data.year : null;
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
  if (value === "m" || value === "mint" || value === "mint (m)") {
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

  return { grade: "Unknown", isGuess: true };
}

export async function fetchDiscogsPriceSuggestions(releaseId: string) {
  if (!process.env.DISCOGS_TOKEN) return null;

  const response = await discogsFetch(`${DISCOGS_API_BASE}/marketplace/price_suggestions/${releaseId}`);
  if (response.status === 404) return {} as DiscogsPriceSuggestions;
  if (!response.ok) throw new Error(`Discogs price suggestions failed (${response.status})`);

  return (await response.json()) as DiscogsPriceSuggestions;
}

export async function fetchDiscogsMarketplaceStats(releaseId: string) {
  if (!process.env.DISCOGS_TOKEN) return null;

  const url = new URL(`${DISCOGS_API_BASE}/marketplace/stats/${releaseId}`);
  url.searchParams.set("curr_abbr", "USD");

  const response = await discogsFetch(url);
  if (!response.ok) throw new Error(`Discogs marketplace stats failed (${response.status})`);

  return (await response.json()) as DiscogsMarketplaceStats;
}


/** Bounded candidate lookup: incomplete pages or any failed release block confirmation. */
export async function fetchPressingCandidates(artist: string, title: string) {
  if (!process.env.DISCOGS_TOKEN) throw new Error("Discogs is not configured");
  const signal = AbortSignal.timeout(22_000);
  const url = new URL(`${DISCOGS_API_BASE}/database/search`);
  url.search = new URLSearchParams({ artist, release_title: title, type: "release", format: "Vinyl", per_page: "100" }).toString();
  const response = await discogsFetch(url, 0, signal);
  if (!response.ok) throw new Error("Discogs search unavailable");
  const search = await response.json() as { results?: { id: number }[]; pagination?: { pages: number; items: number } };
  const ids = [...new Set((search.results ?? []).map(r => r.id))];
  const complete = search.pagination?.pages === 1 && search.pagination.items === ids.length && ids.length <= 12;
  if (!complete) return { releases: [], complete: false };
  const releases: import("./pressingMatcher").MatchRelease[] = [];
  for (const id of ids) {
    if (!Number.isSafeInteger(id) || id < 1) throw new Error("Invalid Discogs result");
    const result = await discogsFetch(`${DISCOGS_API_BASE}/releases/${id}`, 0, signal);
    if (!result.ok) throw new Error("Discogs release unavailable");
    const release = await result.json();
    if (release.id !== id) throw new Error("Discogs result mismatch");
    releases.push(release);
  }
  return { releases, complete };
}
