"use client";

import AlbumSuggestionGrid, { SuggestedAlbum } from "@/components/AlbumSuggestionGrid";
import { VinylRecord } from "@/data/vinyls";
import { isAlbumInCollection } from "@/lib/vinylRecordUtils";
import { useEffect, useMemo, useState } from "react";

export default function MoreByArtist({ artist, records }: { artist: string; records: VinylRecord[] }) {
  const [albums, setAlbums] = useState<SuggestedAlbum[] | null>(null);
  const isCompilationArtist = /^various/i.test(artist);

  useEffect(() => {
    if (isCompilationArtist) return;
    let active = true;
    fetch(`/api/discogs/artist-albums?artist=${encodeURIComponent(artist)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { albums?: SuggestedAlbum[] } | null) => {
        if (active) setAlbums(data?.albums ?? []);
      })
      .catch(() => {
        if (active) setAlbums([]);
      });
    return () => {
      active = false;
    };
  }, [artist, isCompilationArtist]);

  const missingCount = useMemo(
    () => (albums ?? []).filter((album) => !isAlbumInCollection(album, records)).length,
    [albums, records],
  );

  if (isCompilationArtist || !albums || !missingCount) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">More by {artist}</h3>
      <p className="mt-1 text-sm text-gray-600">
        {missingCount} {missingCount === 1 ? "album" : "albums"} on Discogs that aren&apos;t in your collection or wishlist.
      </p>
      <div className="mt-4">
        <AlbumSuggestionGrid albums={albums} records={records} />
      </div>
    </div>
  );
}
