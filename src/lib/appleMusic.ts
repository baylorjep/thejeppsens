import { VinylRecord } from "@/data/vinyls";

export function getAppleMusicSearchUrl(record: VinylRecord) {
  const term = encodeURIComponent(`${record.title} ${record.artist}`.trim());
  return `https://music.apple.com/us/search?term=${term}`;
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
    const response = await fetch(`https://itunes.apple.com/search?term=${term}&entity=album&limit=25&country=US`);
    if (!response.ok) return fallback;

    const data = (await response.json()) as {
      results?: Array<{
        collectionType?: string;
        collectionName?: string;
        artistName?: string;
        collectionViewUrl?: string;
      }>;
    };

    const targetTitle = normalizeAppleText(record.title);
    const targetArtist = normalizeAppleText(record.artist);
    const result = data.results?.find((item) => {
      if (item.collectionType !== "Album" || !item.collectionViewUrl) return false;
      const collectionName = normalizeAppleText(item.collectionName ?? "");
      const artistName = normalizeAppleText(item.artistName ?? "");
      return collectionName.includes(targetTitle) && artistName.includes(targetArtist);
    });

    return result?.collectionViewUrl ?? fallback;
  } catch {
    return fallback;
  }
}
