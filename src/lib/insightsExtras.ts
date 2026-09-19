import type { VinylRecord } from "../data/vinyls";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/** First letter of an artist for the A to Z grid, ignoring "The " and accents; "#" for digits and symbols. */
export function artistLetter(name: string) {
  const trimmed = name.trim().replace(/^the\s+/i, "");
  const first = trimmed.normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

/** Artists (with record counts) grouped under their letter, biggest first within each letter. */
export function groupArtistsByLetter(artists: { artist: string; count: number }[]) {
  const byLetter = new Map<string, { artist: string; count: number }[]>();
  for (const entry of artists) {
    const letter = artistLetter(entry.artist);
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), entry]);
  }
  for (const list of byLetter.values()) list.sort((a, b) => b.count - a.count || a.artist.localeCompare(b.artist));
  return byLetter;
}

export function alphabetTiles(byLetter: Map<string, unknown>) {
  return byLetter.has("#") ? [...LETTERS, "#"] : LETTERS;
}

export type CrateSummary = {
  name: string;
  count: number;
  topGenre: { name: string; count: number } | null;
  topArtist: { name: string; count: number } | null;
  records: VinylRecord[];
};

const UNASSIGNED = "Not in a crate yet";

/** Owned records grouped by storage location (natural order: Crate 2 before Crate 10), unassigned last. */
export function summarizeCrates(records: VinylRecord[]): CrateSummary[] {
  const byCrate = new Map<string, VinylRecord[]>();
  for (const record of records) {
    const name = record.storageLocation?.trim() || UNASSIGNED;
    byCrate.set(name, [...(byCrate.get(name) ?? []), record]);
  }

  const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
  const top = (counts: Map<string, number>) => {
    const best = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    return best ? { name: best[0], count: best[1] } : null;
  };

  return [...byCrate]
    .map(([name, group]) => {
      const genres = new Map<string, number>();
      const artists = new Map<string, number>();
      for (const record of group) {
        for (const genre of new Set(record.genres)) genres.set(genre, (genres.get(genre) ?? 0) + 1);
        if (!/^various/i.test(record.artist)) artists.set(record.artist, (artists.get(record.artist) ?? 0) + 1);
      }
      return {
        name,
        count: group.length,
        topGenre: top(genres),
        topArtist: top(artists),
        records: [...group].sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title)),
      };
    })
    .sort((a, b) => {
      if (a.name === UNASSIGNED) return 1;
      if (b.name === UNASSIGNED) return -1;
      return collator.compare(a.name, b.name);
    });
}
