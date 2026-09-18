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
  uri?: string;
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
  companies?: { name: string; entity_type_name?: string }[];
  country?: string;
  released?: string;
  estimated_weight?: number;
  identifiers?: { type: string; value: string; description?: string }[];
  tracklist?: { title: string; type_?: string }[];
  images?: { type?: string; uri?: string }[];
};

function stripParentheticals(value: string) {
  return value.replace(/\([^)]*\)|\[[^\]]*\]/g, " ").replace(/\s+/g, " ").trim();
}

export function buildDiscogsMatchQuery(record: VinylRecord) {
  const cleanTitle = stripParentheticals(record.title) || record.title;
  const primaryArtist = record.artist.split(/[,/]| and | & /i)[0].trim() || record.artist;

  return [primaryArtist, cleanTitle, record.label, record.catalogNumber].filter(Boolean).join(" ");
}

export function discogsReleaseUrl(result: { id: number; uri?: string }) {
  return result.uri ? `https://www.discogs.com${result.uri}` : `https://www.discogs.com/release/${result.id}`;
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
  const pressingPlant =
    release.companies?.find((company) => company.entity_type_name === "Pressed By")?.name ??
    release.companies?.find((company) => company.entity_type_name === "Manufactured By")?.name;
  const barcodes = release.identifiers?.filter((identifier) => identifier.type === "Barcode") ?? [];
  const barcode = (barcodes.find((b) => b.description === "Text") ?? barcodes[0])?.value;
  const releasedDate = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(release.released ?? "") ? release.released : undefined;

  return {
    ...record,
    discogsReleaseId: release.id,
    discogsVerified: true,
    label: primaryLabel?.name ?? record.label,
    catalogNumber: primaryLabel?.catno ?? record.catalogNumber,
    pressingPlant: pressingPlant ?? record.pressingPlant,
    country: release.country ?? record.country,
    barcode: barcode ?? record.barcode,
    releasedDate: releasedDate ?? record.releasedDate,
    weightGrams: release.estimated_weight ?? record.weightGrams,
    format: record.format || format || record.format,
    discCount: record.discCount || discCount || record.discCount,
    genres: record.genres.length ? record.genres : genres.length ? genres : record.genres,
    trackList: record.trackList?.length ? record.trackList : trackList.length ? trackList : record.trackList,
    coverImage: record.coverImage || coverImage || record.coverImage,
  };
}
