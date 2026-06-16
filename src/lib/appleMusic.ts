import { VinylRecord } from "@/data/vinyls";

export function getAppleMusicSearchUrl(record: VinylRecord) {
  const term = encodeURIComponent(`${record.title} ${record.artist}`.trim());
  return `https://music.apple.com/us/search?term=${term}`;
}
