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
 * True when Discogs' own format descriptions flag this confirmed release as a
 * later reissue/repress -- shown as the counterpart to isOriginalPressing so a
 * confirmed reissue gets a clear "not the original" signal instead of just
 * silently not showing the original-pressing badge (which reads as unknown).
 */
export function isReissuePressing(record: VinylRecord) {
  return Boolean(record.discogsVerified) && /reissue|repress|remaster/i.test(record.format ?? "");
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

// Discogs notes use its own wiki markup: [l123] / [l=Name] / [a123] / [r123]
// link to a label/artist/release by internal id or inline name; [url=...]
// text[/url] wraps a link. We don't resolve numeric ids to names, so strip
// them rather than show raw brackets. A label reference is almost always the
// release's own label, which we already have, so substitute that in instead
// of just deleting it.
function cleanDiscogsMarkup(text: string, labelName?: string): string {
  const label = labelName?.replace(/\s*\(\d+\)\s*$/, "").trim();
  return text
    .replace(/\[url(?:=[^\]]*)?\](.*?)\[\/url\]/gi, "$1")
    .replace(/\[l=([^\]]+)\]/gi, (_, name: string) => name.trim())
    .replace(/\[l\d+\]/gi, label || "this")
    .replace(/\[[ar](?:\d+|=[^\]]+)\]/gi, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,])/g, "$1")
    .trim();
}

// Boilerplate that's technically part of the release notes but isn't a "fact"
// anyone finds interesting: copyright/phonogram lines, publishing-rights
// credits, pure matrix-engraving mechanics, and purely cosmetic printing
// trivia (embossing, font weight) that reads as filler rather than color.
const BORING_LINE_PATTERNS = [
  /^\(?[©℗cp]\)?\s+\d{4}\b/i,
  /^(all\s+)?(songs?|selections?|tracks?)\s+(are\s+|is\s+)?(published|licensed|copyright)/i,
  /\bpublished by\b.*\b(BMI|ASCAP|SESAC|GEMA|PRS)\b/i,
  /^(all\s+)?(songs?|selections?|tracks?)\s+(are|is)\s+(published by\s+)?(BMI|ASCAP|SESAC|GEMA|PRS)\b/i,
  /\bperformance\s+(clearing|rights)\b/i,
  /^\W*(ASCAP|BMI|SESAC|GEMA|PRS)\W*\.?\W*$/i,
  /^(the\s+)?runout(s)?\s+(details?\s+|area\s+)?(is|are)?\s*(etched|stamped|scribed)\b.*\b(etched|stamped|scribed)\b/i,
  /\bis\s+(slightly\s+)?embossed\b/i,
  /^distinguishing features of this (submission|entry)\s*:?\s*$/i,
  /^notes not on (the\s+)?release\s*:?\s*$/i,
  /^mfd\.?\s+by\b/i,
  /^manufactured by\b.*\b(inc|corp|ltd)\.?\b/i,
  /^(printed|made)\s+(and\s+(printed|made)\s+)?in\s+/i,
  /,\s*inc\.?\s*production\.?\s*$/i,
  /^title as (printed|shown)\s+on\b/i,
];

function isBoringLine(line: string): boolean {
  return BORING_LINE_PATTERNS.some((pattern) => pattern.test(line));
}

/** Splits a release's Discogs notes into distinct fact bullets for display. */
export function getPressingFacts(record: VinylRecord): string[] {
  if (!record.discogsVerified) return [];
  return (record.pressingNotes ?? "")
    .split(/\n+/)
    .map((line) => cleanDiscogsMarkup(line.trim(), record.label))
    .filter(Boolean)
    .filter((line) => !isBoringLine(line));
}

/**
 * How many other owned records share this record's primary (first-listed)
 * artist, by simple substring match on the raw `artist` field -- deliberately
 * not splitting collaboration credits ourselves (real act names like "Hall &
 * Oates" would get shredded), just checking whether the primary artist's name
 * appears in each record's credit. Returns null when there's nothing to
 * celebrate (fewer than 2 in the collection).
 */
export function getArtistCollectionStat(record: VinylRecord, allRecords: VinylRecord[]) {
  const primaryArtist = record.artist.split(/[,/]| and | & /i)[0].trim();
  if (!primaryArtist) return null;

  const matches = allRecords.filter(
    (r) => r.status === "owned" && r.artist.toLowerCase().includes(primaryArtist.toLowerCase()),
  );
  if (matches.length < 2) return null;

  const sorted = [...matches].sort((a, b) => (a.dateAdded ?? "").localeCompare(b.dateAdded ?? ""));
  const position = sorted.findIndex((r) => r.id === record.id) + 1;
  return { artist: primaryArtist, total: matches.length, position: position || matches.length };
}
