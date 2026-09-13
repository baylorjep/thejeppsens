import { VinylRecord } from "@/data/vinyls";

export type DiscogsSearchResult = {
  id: number;
  title: string;
  year?: string;
  thumb?: string;
  format?: string[];
  label?: string[];
  catno?: string;
  country?: string;
};

export type DiscogsReleaseDetails = {
  id: number;
  title: string;
  artists?: { name: string }[];
  year?: number;
  genres?: string[];
  styles?: string[];
  labels?: { name: string; catno?: string }[];
  formats?: { name: string; qty?: string; descriptions?: string[] }[];
  tracklist?: { title: string; type_?: string }[];
  images?: { type?: string; uri?: string }[];
};

export function buildDiscogsMatchQuery(record: VinylRecord) {
  return [record.artist, record.title, record.catalogNumber].filter(Boolean).join(" ");
}

export async function searchDiscogsReleases(query: string): Promise<DiscogsSearchResult[]> {
  const response = await fetch(`/api/discogs/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) return [];

  const data = (await response.json()) as { results?: DiscogsSearchResult[] };
  return data.results ?? [];
}

export async function fetchDiscogsReleaseDetails(releaseId: number): Promise<DiscogsReleaseDetails | null> {
  const response = await fetch(`/api/discogs/release/${releaseId}`);
  if (!response.ok) return null;

  const data = (await response.json()) as { release?: DiscogsReleaseDetails };
  return data.release ?? null;
}

/**
 * Merges a confirmed Discogs release into a record without touching fields the
 * record already has filled in (a real photo, a hand-typed genre list, etc.) —
 * only label/catalog number/release id are always set, since confirming those
 * against the physical pressing is the whole point of a match.
 */
export function applyDiscogsMatchToRecord(record: VinylRecord, release: DiscogsReleaseDetails): VinylRecord {
  const primaryLabel = release.labels?.[0];
  const primaryFormat = release.formats?.[0];
  const format = primaryFormat?.descriptions?.[0] ?? primaryFormat?.name;
  const discCount = primaryFormat?.qty ? Number(primaryFormat.qty) : undefined;
  const genres = [...new Set([...(release.genres ?? []), ...(release.styles ?? [])])];
  const trackList = (release.tracklist ?? [])
    .filter((track) => !track.type_ || track.type_ === "track")
    .map((track) => track.title)
    .filter(Boolean);
  const coverImage = release.images?.find((image) => image.type === "primary")?.uri ?? release.images?.[0]?.uri;

  return {
    ...record,
    discogsReleaseId: release.id,
    label: primaryLabel?.name ?? record.label,
    catalogNumber: primaryLabel?.catno ?? record.catalogNumber,
    format: record.format || format || record.format,
    discCount: record.discCount || discCount || record.discCount,
    genres: record.genres.length ? record.genres : genres.length ? genres : record.genres,
    trackList: record.trackList?.length ? record.trackList : trackList.length ? trackList : record.trackList,
    coverImage: record.coverImage || coverImage || record.coverImage,
  };
}
