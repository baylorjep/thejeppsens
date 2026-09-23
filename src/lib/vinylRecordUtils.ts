import type { VinylRecord } from "@/data/vinyls";

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

function normalizeForMatch(value: string) {
  return value
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/&/g, "and")
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * True when an album is already in the collection or on the wishlist. Deliberately generous so a
 * suggestion never shows something you already have: same id, or a related artist plus the same
 * title or one that contains the other ("Sgt. Pepper" vs "Sgt. Pepper (2017 Mix)").
 */
export function isAlbumInCollection(album: { title: string; artist: string }, records: VinylRecord[]) {
  const id = slugifyVinylId(album.title, album.artist);
  const title = normalizeForMatch(album.title);
  const artist = normalizeForMatch(album.artist);
  if (!title || !artist) return false;

  return records.some((record) => {
    if (record.id === id) return true;
    const recordArtist = normalizeForMatch(record.artist);
    if (!recordArtist || !(recordArtist.includes(artist) || artist.includes(recordArtist))) return false;
    const recordTitle = normalizeForMatch(record.title);
    if (recordTitle === title) return true;
    const [short, long] = recordTitle.length <= title.length ? [recordTitle, title] : [title, recordTitle];
    return short.length >= 6 && long.includes(short);
  });
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
 * True for Record Store Day releases: Discogs' own format tag or notes on a confirmed
 * release, or wording in your own fields (where you got it, notes, source).
 */
export function isRecordStoreDay(record: VinylRecord) {
  const pattern = /record store day|\bRSD\b/i;
  const discogsText = record.discogsVerified ? [record.format, record.pressingNotes] : [];
  const yourText = [record.whereWeGotIt, record.notes, record.source, record.pressing];
  return [...discogsText, ...yourText].some((text) => Boolean(text) && pattern.test(text!));
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
    notes.match(/(?:limited(?: edition| run| pressing)?(?: of| on| to)*|numbered edition of|pressed to(?: a quantity of)?|quantity of)\s+([\d,]{3,7})(?:\s*(?:copies|units))?/i) ??
    notes.match(/([\d,]{3,7})\s*(?:numbered\s+)?copies/i);
  if (!match) return null;
  const size = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(size) && size > 0 ? size : null;
}

/**
 * How many copies were in this pressing's run, only when a real source states it:
 * a size entered on the record (with its source) or a run stated in the confirmed
 * release's Discogs notes. Never estimated. Most pressings have no public number.
 */
export function getPressRun(record: VinylRecord): { size: number; source: string } | null {
  if (record.pressRunSize && record.pressRunSize > 0) {
    return { size: record.pressRunSize, source: record.pressRunSource?.trim() || "stated on the record" };
  }
  const size = getLimitedEditionSize(record);
  return size ? { size, source: "Discogs release notes" } : null;
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

const CREDIT_DELIMITERS = /\s*(?:,|\/|;|&|\band\b|\bfeaturing\b|\bfeat\.?|\bft\.?|\bwith\b)\s*/i;

function normalizeCredit(value: string) {
  return value.replace(/[()[\]]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Who is credited on each record, keyed by record id -- the single source of
 * truth for every "how many records by X" number in the app (album-page stat,
 * Insights breakdown, top artist), so they can't disagree.
 *
 * A record's raw `artist` string is one free-text field, so real collaboration
 * credits ("Frank Sinatra & Antônio Carlos Jobim") and featured artists that
 * only appear in the title ("Tommy Dorsey and His Orchestra Featuring Frank
 * Sinatra") would otherwise be invisible to per-artist counts. Splitting the
 * text blindly isn't safe (real acts like "Hall & Oates" would get shredded),
 * so a piece of a credit only counts as its own artist when that exact name
 * also appears as a whole artist credit on some other record in the collection.
 * Unrecognized pieces are ignored, and a record with no recognized pieces keeps
 * its whole credit string as one entry.
 */
export function buildArtistCredits(records: VinylRecord[]): Map<string, string[]> {
  const knownArtists = new Map<string, string>();
  for (const record of records) {
    const name = normalizeCredit(record.artist);
    if (name && !knownArtists.has(name.toLowerCase())) knownArtists.set(name.toLowerCase(), name);
  }

  const credits = new Map<string, string[]>();
  for (const record of records) {
    const whole = normalizeCredit(record.artist);
    const parts = record.artist.split(CREDIT_DELIMITERS).map(normalizeCredit).filter(Boolean);
    const matchedFromArtist = parts.length > 1 ? parts.filter((part) => knownArtists.has(part.toLowerCase())) : [];

    const featuredText = record.title.match(/\b(?:featuring|feat\.?|ft\.?)\s+(.+)$/i)?.[1] ?? "";
    const matchedFromTitle = featuredText
      .split(CREDIT_DELIMITERS)
      .map(normalizeCredit)
      .filter((part) => part && knownArtists.has(part.toLowerCase()));

    // A composite credit line is replaced by the artists we recognize in it;
    // a single act's credit line is kept alongside anyone featured in the title.
    const base = matchedFromArtist.length ? matchedFromArtist : [whole];
    const unique = new Map<string, string>();
    for (const name of [...base, ...matchedFromTitle]) {
      const display = knownArtists.get(name.toLowerCase()) ?? name;
      unique.set(display.toLowerCase(), display);
    }
    credits.set(record.id, [...unique.values()]);
  }
  return credits;
}

/** Catch-all labels on compilations -- not an artist anyone has a favorite of. */
export function isCatchAllArtist(name: string) {
  return /^various(\s+artists)?$/i.test(name.trim());
}

/**
 * THE way to group or count records by artist anywhere in the app. Every
 * per-artist number (album-page "#N of X" stat, Insights artist chart and its
 * click-through lists, top artist, artist counts) must come from this so they
 * can never disagree -- never group by the raw `record.artist` string, which
 * misses collaborations and featured credits (Sinatra: 14 solo vs. 19 real).
 */
export function groupRecordsByArtist(records: VinylRecord[]): Map<string, VinylRecord[]> {
  const credits = buildArtistCredits(records);
  const groups = new Map<string, VinylRecord[]>();
  for (const record of records) {
    for (const artist of credits.get(record.id) ?? [record.artist]) {
      if (isCatchAllArtist(artist)) continue;
      const group = groups.get(artist);
      if (group) group.push(record);
      else groups.set(artist, [record]);
    }
  }
  return groups;
}

/** Artists ranked by record count (ties alphabetical), derived from groupRecordsByArtist. */
export function getArtistBreakdown(records: VinylRecord[]) {
  return [...groupRecordsByArtist(records)]
    .map(([label, group]) => ({ label, count: group.length }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/**
 * The artist stat for an album page: "#N of X <artist> albums you own", using
 * whichever credited artist on this record has the most owned records (needs
 * at least 2, or there's nothing to celebrate).
 */
export function getArtistCollectionStat(record: VinylRecord, allRecords: VinylRecord[]) {
  if (record.status === "wishlist") return null;
  const groups = groupRecordsByArtist(allRecords.filter((item) => item.status !== "wishlist"));
  const credited = [...groups].filter(([, group]) => group.some((r) => r.id === record.id));

  let best: { artist: string; total: number; position: number } | null = null;
  for (const [artist, group] of credited) {
    const owned = group.filter((r) => r.status === "owned");
    if (owned.length < 2 || (best && owned.length <= best.total)) continue;

    const sorted = [...owned].sort((a, b) => (a.dateAdded ?? "").localeCompare(b.dateAdded ?? "") || a.id.localeCompare(b.id));
    const position = sorted.findIndex((r) => r.id === record.id) + 1;
    best = { artist, total: owned.length, position: position || owned.length };
  }
  return best;
}
