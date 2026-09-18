import { VinylRecord } from "@/data/vinyls";

export function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function slugifyVinylId(title: string, artist: string) {
  return `${artist}-${title}`
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function isVinylRecord(value: unknown): value is VinylRecord {
  const record = value as Partial<VinylRecord>;
  return Boolean(
    record &&
      record.id &&
      record.title &&
      record.artist &&
      Array.isArray(record.genres) &&
      Array.isArray(record.moods) &&
      record.status,
  );
}

export function statusLabel(status: VinylRecord["status"]) {
  if (status === "wishlist") return "Wishlist";
  if (status === "upgrade") return "Upgrade wanted";
  return "Owned";
}

function decadeFromYear(year?: number) {
  if (!year) return "Unknown";
  return `${Math.floor(year / 10) * 10}s`;
}

export function getDecade(record: VinylRecord) {
  const recordingYears = record.recordingYears?.match(/\b(\d{4})\b/);
  const recordingDecade = record.recordingYears?.match(/\b(\d{4})s\b/);
  const year = recordingYears ? Number(recordingYears[1]) : recordingDecade ? Number(recordingDecade[1]) : record.releaseYear;

  return decadeFromYear(year);
}

export function getReleaseDecade(record: VinylRecord) {
  return decadeFromYear(record.releaseYear);
}

export function getRecordingDecade(record: VinylRecord) {
  const recordingYears = record.recordingYears?.match(/\b(\d{4})\b/);
  const recordingDecade = record.recordingYears?.match(/\b(\d{4})s\b/);
  const year = recordingYears ? Number(recordingYears[1]) : recordingDecade ? Number(recordingDecade[1]) : undefined;
  return decadeFromYear(year);
}

/**
 * True only when a confirmed pressing's year matches the album's true first-release
 * year AND Discogs doesn't describe this specific release as a reissue/repress --
 * i.e. this copy is (as far as the confirmed Discogs data shows) the first pressing
 * of this release, not a later run.
 */
export function isOriginalPressing(record: VinylRecord) {
  if (!record.discogsVerified || !record.pressingYear || !record.originalReleaseYear) return false;
  if (record.pressingYear !== record.originalReleaseYear) return false;
  return !/reissue|repress|remaster/i.test(record.format ?? "");
}

/**
 * Pulls a stated total print-run size out of the confirmed release's own Discogs
 * notes (e.g. "limited to 3,000 copies"), when Discogs actually states one. Never
 * inferred or estimated -- most pressings have no such number and this returns null.
 */
export function getLimitedEditionSize(record: VinylRecord): number | null {
  if (!record.discogsVerified) return null;
  const notes = record.pressingNotes ?? "";
  const match =
    notes.match(/(?:limited(?: edition)?(?: of)?(?: to)?|numbered edition of)\s+([\d,]{3,7})(?:\s*(?:copies|units))?/i) ??
    notes.match(/([\d,]{3,7})\s*(?:numbered\s+)?copies/i);
  if (!match) return null;
  const size = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(size) && size > 0 ? size : null;
}

/** Splits a release's Discogs notes into distinct fact bullets for display. */
export function getPressingFacts(record: VinylRecord): string[] {
  if (!record.discogsVerified) return [];
  return (record.pressingNotes ?? "")
    .split(/\n{2,}/)
    .map((fact) => fact.trim())
    .filter(Boolean);
}
