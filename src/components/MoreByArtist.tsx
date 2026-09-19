"use client";

import { VinylRecord } from "@/data/vinyls";
import { saveVinylRecord } from "@/lib/vinylApi";
import { slugifyVinylId } from "@/lib/vinylRecordUtils";
import { Check, Disc3, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ArtistAlbum = { id: number; artist: string; title: string; year: number | null; cover: string | null };

const PAGE_SIZE = 8;

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, "")
    .replace(/&/g, "and")
    .replace(/^the\s+/, "")
    .replace(/[^a-z0-9]+/g, "");
}

export default function MoreByArtist({ artist, records }: { artist: string; records: VinylRecord[] }) {
  const [albums, setAlbums] = useState<ArtistAlbum[] | null>(null);
  const [page, setPage] = useState(0);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [addedIds, setAddedIds] = useState<Record<number, string>>({});
  const [error, setError] = useState("");

  const isCompilationArtist = /^various/i.test(artist);

  useEffect(() => {
    if (isCompilationArtist) return;
    let active = true;
    fetch(`/api/discogs/artist-albums?artist=${encodeURIComponent(artist)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { albums?: ArtistAlbum[] } | null) => {
        if (active) setAlbums(data?.albums ?? []);
      })
      .catch(() => {
        if (active) setAlbums([]);
      });
    return () => {
      active = false;
    };
  }, [artist, isCompilationArtist]);

  // Hide anything already on the shelf or wishlist, matching on title (the artist is the same).
  const missing = useMemo(() => {
    const have = new Set(records.filter((record) => normalize(record.artist) === normalize(artist)).map((record) => normalize(record.title)));
    return (albums ?? []).filter((album) => !have.has(normalize(album.title)));
  }, [albums, artist, records]);

  const addToWishlist = async (album: ArtistAlbum) => {
    setSavingId(album.id);
    setError("");
    const record: VinylRecord = {
      id: slugifyVinylId(album.title, album.artist),
      title: album.title,
      artist: album.artist,
      releaseYear: album.year ?? undefined,
      originalReleaseYear: album.year ?? undefined,
      genres: [],
      moods: [],
      status: "wishlist",
      source: "Discogs artist discovery",
      coverImage: album.cover ?? undefined,
      dateAdded: new Date().toISOString().slice(0, 10),
    };

    try {
      const response = await saveVinylRecord(record);
      setAddedIds((current) => ({ ...current, [album.id]: response.record.id }));
    } catch {
      setError(`Could not add ${album.title}. Try again.`);
    } finally {
      setSavingId(null);
    }
  };

  if (isCompilationArtist || !albums || !missing.length) return null;

  const pageCount = Math.ceil(missing.length / PAGE_SIZE);
  const currentPage = Math.min(page, pageCount - 1);
  const visible = missing.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">More by {artist}</h3>
      <p className="mt-1 text-sm text-gray-600">
        {missing.length} {missing.length === 1 ? "album" : "albums"} on Discogs that aren&apos;t in your collection or wishlist.
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {visible.map((album) => {
          const addedId = addedIds[album.id];
          return (
            <li key={album.id} className="flex flex-col overflow-hidden rounded-lg border border-gray-200">
              <div className="aspect-square bg-gray-100">
                {album.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={album.cover} alt={album.title} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Disc3 className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900" title={album.title}>{album.title}</p>
                  {album.year ? <p className="text-xs text-gray-500">{album.year}</p> : null}
                </div>
                {addedId ? (
                  <Link href={`/vinyl/${encodeURIComponent(addedId)}`} className="mt-auto inline-flex items-center justify-center gap-1 rounded-md bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-800">
                    <Check className="h-3.5 w-3.5" /> On wishlist
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => void addToWishlist(album)}
                    disabled={savingId === album.id}
                    className="mt-auto inline-flex items-center justify-center gap-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs font-medium text-gray-900 transition-colors hover:border-gray-500 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> {savingId === album.id ? "Adding..." : "Add to wishlist"}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {error ? <p role="alert" className="mt-3 text-sm text-red-700">{error}</p> : null}
      {pageCount > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={() => setPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0}
            className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-900 transition-colors hover:border-gray-500 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-gray-500">
            Page {currentPage + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage(Math.min(pageCount - 1, currentPage + 1))}
            disabled={currentPage >= pageCount - 1}
            className="rounded-md border border-gray-300 px-3 py-1.5 font-medium text-gray-900 transition-colors hover:border-gray-500 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
