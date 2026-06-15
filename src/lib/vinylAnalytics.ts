import { VinylRecord } from "@/data/vinyls";
import { getDecade } from "@/lib/vinylRecordUtils";

export type VinylSortKey =
  | "date-added"
  | "artist"
  | "title"
  | "year-desc"
  | "year-asc"
  | "favorites";

export function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export function getTopValue(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  let topValue = "None";
  let topCount = 0;

  for (const [value, count] of counts.entries()) {
    if (count > topCount || (count === topCount && value.localeCompare(topValue) < 0)) {
      topValue = value;
      topCount = count;
    }
  }

  return { value: topValue, count: topCount };
}

export function getBreakdown(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function getStatusTone(status: VinylRecord["status"]) {
  if (status === "wishlist") {
    return {
      card: "border-amber-200 bg-amber-50/70",
      badge: "border-amber-300 bg-amber-100 text-amber-800",
    };
  }

  if (status === "upgrade") {
    return {
      card: "border-sky-200 bg-sky-50/70",
      badge: "border-sky-300 bg-sky-100 text-sky-800",
    };
  }

  return {
    card: "border-gray-200 bg-white",
    badge: "border-gray-200 bg-white text-gray-600",
  };
}

export function sortVinylRecords(records: VinylRecord[], sortKey: VinylSortKey) {
  const next = [...records];

  if (sortKey === "artist") {
    return next.sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
  }

  if (sortKey === "title") {
    return next.sort((a, b) => a.title.localeCompare(b.title) || a.artist.localeCompare(b.artist));
  }

  if (sortKey === "year-desc") {
    return next.sort((a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0) || a.title.localeCompare(b.title));
  }

  if (sortKey === "year-asc") {
    return next.sort((a, b) => (a.releaseYear ?? 9999) - (b.releaseYear ?? 9999) || a.title.localeCompare(b.title));
  }

  if (sortKey === "favorites") {
    return next.sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || a.title.localeCompare(b.title));
  }

  return next.sort((a, b) => (b.dateAdded ?? "").localeCompare(a.dateAdded ?? "") || a.title.localeCompare(b.title));
}

export function getCollectionSnapshot(records: VinylRecord[]) {
  return {
    artists: uniqueSorted(records.map((record) => record.artist)).length,
    genres: uniqueSorted(records.flatMap((record) => record.genres)).length,
    favorites: records.filter((record) => record.favorite).length,
    topGenre: getTopValue(records.flatMap((record) => record.genres)),
    topArtist: getTopValue(records.map((record) => record.artist)),
    topMood: getTopValue(records.flatMap((record) => record.moods)),
    topEra: getTopValue(records.map(getDecade).filter((decade) => decade !== "Unknown")),
    genreBreakdown: getBreakdown(records.flatMap((record) => record.genres)),
    artistBreakdown: getBreakdown(records.map((record) => record.artist)),
    decadeBreakdown: getBreakdown(records.map(getDecade).filter((decade) => decade !== "Unknown")),
    moodBreakdown: getBreakdown(records.flatMap((record) => record.moods)),
    statusBreakdown: getBreakdown(records.map((record) => record.status)),
  };
}
