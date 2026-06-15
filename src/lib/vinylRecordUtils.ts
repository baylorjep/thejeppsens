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

export function getDecade(record: VinylRecord) {
  const recordingYears = record.recordingYears?.match(/\b(\d{4})\b/);
  const recordingDecade = record.recordingYears?.match(/\b(\d{4})s\b/);
  const year = recordingYears ? Number(recordingYears[1]) : recordingDecade ? Number(recordingDecade[1]) : record.releaseYear;

  if (!year) return "Unknown";
  return `${Math.floor(year / 10) * 10}s`;
}
