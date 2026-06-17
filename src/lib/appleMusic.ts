import { VinylRecord } from "@/data/vinyls";

export function getAppleMusicSearchUrl(record: VinylRecord) {
  const q = encodeURIComponent(`${record.artist} ${record.title} apple music`);
  return `https://www.google.com/search?q=${q}`;
}

function normalizeAppleText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export async function getAppleMusicAlbumUrl(record: VinylRecord) {
  const fallback = getAppleMusicSearchUrl(record);
  const term = encodeURIComponent(`${record.artist} ${record.title}`.trim());

  try {
    const response = await fetch(
      `https://itunes.apple.com/search?term=${term}&entity=album&limit=25&country=US`,
    );
    if (!response.ok) return fallback;

    const data = (await response.json()) as {
      results?: Array<{
        collectionType?: string;
        collectionName?: string;
        artistName?: string;
        collectionViewUrl?: string;
        collectionExplicitness?: string;
      }>;
    };

    const targetTitle = normalizeAppleText(record.title);
    const targetArtist = normalizeAppleText(record.artist);

    const matches = (data.results ?? []).filter((item) => {
      if (item.collectionType !== "Album" || !item.collectionViewUrl) return false;
      const collectionName = normalizeAppleText(item.collectionName ?? "");
      const artistName = normalizeAppleText(item.artistName ?? "");
      return collectionName.includes(targetTitle) && artistName.includes(targetArtist);
    });

    // Prefer clean version over explicit when both exist
    const result =
      matches.find((item) => item.collectionExplicitness !== "explicit") ?? matches[0];

    return result?.collectionViewUrl ?? fallback;
  } catch {
    return fallback;
  }
}
