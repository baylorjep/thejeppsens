"use client";

import AlbumSuggestionGrid, { SuggestedAlbum } from "@/components/AlbumSuggestionGrid";
import { VinylRecord } from "@/data/vinyls";
import { fetchVinylRecords } from "@/lib/vinylApi";
import { readQueuedVinyls } from "@/lib/vinylQueue";
import { groupRecordsByArtist, isAlbumInCollection } from "@/lib/vinylRecordUtils";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ResearchRow =
  | { key: string; kind: "artist"; artist: string; count: number }
  | { key: string; kind: "favorite"; artist: string; title: string }
  | { key: string; kind: "genre"; genre: string; count: number }
  | { key: string; kind: "trending" };

const MAX_ROWS_PER_KIND = 3;

function rowRequest(row: ResearchRow) {
  if (row.kind === "trending") return "/api/discogs/trending-albums";
  return row.kind === "genre"
    ? `/api/discogs/genre-albums?genre=${encodeURIComponent(row.genre)}`
    : `/api/discogs/artist-albums?artist=${encodeURIComponent(row.artist)}`;
}

function RowHeading({ row }: { row: ResearchRow }) {
  if (row.kind === "artist") {
    return (
      <>
        <h3 className="text-base font-semibold text-gray-950 sm:text-lg">{row.artist}</h3>
        <p className="mt-1 text-sm text-gray-600">
          I see you have {row.count} {row.artist} {row.count === 1 ? "album" : "albums"}. You might want some of these.
        </p>
      </>
    );
  }
  if (row.kind === "favorite") {
    return (
      <>
        <h3 className="text-base font-semibold text-gray-950 sm:text-lg">More by {row.artist}</h3>
        <p className="mt-1 text-sm text-gray-600">You favorited {row.title}. Here are more from {row.artist}.</p>
      </>
    );
  }
  if (row.kind === "trending") {
    return (
      <>
        <h3 className="text-base font-semibold text-gray-950 sm:text-lg">Popular right now</h3>
        <p className="mt-1 text-sm text-gray-600">
          The albums from the last two years that Discogs collectors want most, so the new and buzzy ones like the latest film scores and big releases.
        </p>
      </>
    );
  }
  return (
    <>
      <h3 className="text-base font-semibold text-gray-950 sm:text-lg">Popular {row.genre}</h3>
      <p className="mt-1 text-sm text-gray-600">
        {row.genre} is one of your biggest genres, with {row.count} records. These are some of the most collected {row.genre} albums you don&apos;t have yet.
      </p>
    </>
  );
}

export default function ResearchBoard({ records }: { records: VinylRecord[] }) {
  const [everyRecord, setEveryRecord] = useState(records);
  const [results, setResults] = useState<Record<string, SuggestedAlbum[]>>({});

  useEffect(() => {
    const queuedRecords = readQueuedVinyls();
    fetchVinylRecords()
      .then((response) => setEveryRecord(response.source === "supabase" ? response.records : [...response.records, ...queuedRecords]))
      .catch(() => setEveryRecord([...records, ...queuedRecords]));
  }, [records]);

  // Research is about what you own. The wishlist is only used to avoid suggesting things twice.
  const owned = useMemo(() => everyRecord.filter((record) => record.status !== "wishlist"), [everyRecord]);

  const rows = useMemo<ResearchRow[]>(() => {
    const groups = [...groupRecordsByArtist(owned)]
      .map(([artist, group]) => ({ artist, count: group.length }))
      .filter((entry) => !/^various/i.test(entry.artist))
      .sort((a, b) => b.count - a.count || a.artist.localeCompare(b.artist));

    const artistRows: ResearchRow[] = groups
      .filter((entry) => entry.count >= 2)
      .slice(0, MAX_ROWS_PER_KIND)
      .map((entry) => ({ key: `artist:${entry.artist}`, kind: "artist", artist: entry.artist, count: entry.count }));
    const covered = new Set(artistRows.map((row) => (row.kind === "artist" ? row.artist : "")));

    const favoriteRows: ResearchRow[] = [];
    for (const record of owned.filter((item) => item.favorite)) {
      const artist = [...groupRecordsByArtist([record]).keys()][0] ?? record.artist;
      if (/^various/i.test(artist) || covered.has(artist)) continue;
      covered.add(artist);
      favoriteRows.push({ key: `favorite:${artist}`, kind: "favorite", artist, title: record.title });
      if (favoriteRows.length >= MAX_ROWS_PER_KIND) break;
    }

    const genreCounts = new Map<string, number>();
    for (const record of owned) for (const genre of new Set(record.genres)) genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    const genreRows: ResearchRow[] = [...genreCounts]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, MAX_ROWS_PER_KIND)
      .map(([genre, count]) => ({ key: `genre:${genre}`, kind: "genre", genre, count }));

    return [{ key: "trending:now", kind: "trending" }, ...artistRows, ...favoriteRows, ...genreRows];
  }, [owned]);

  // Discogs is paced to about one request a second, so load one row at a time. Results are
  // cached by the server, so most visits after the first are instant.
  useEffect(() => {
    let active = true;
    (async () => {
      for (const row of rows) {
        if (!active) return;
        if (results[row.key]) continue;
        try {
          const response = await fetch(rowRequest(row));
          const data = response.ok ? ((await response.json()) as { albums?: SuggestedAlbum[] }) : null;
          if (active) setResults((current) => ({ ...current, [row.key]: data?.albums ?? [] }));
        } catch {
          if (active) setResults((current) => ({ ...current, [row.key]: [] }));
        }
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const sections: { title: string; kind: ResearchRow["kind"] }[] = [
    { title: "Trending now", kind: "trending" },
    { title: "Because of the artists you own", kind: "artist" },
    { title: "Because of your favorites", kind: "favorite" },
    { title: "Because of your genres", kind: "genre" },
  ];
  const stillLoading = rows.some((row) => !results[row.key]);
  const hasAnything = rows.some((row) => (results[row.key] ?? []).some((album) => !isAlbumInCollection(album, everyRecord)));

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-gray-500">Records to look for</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">Vinyl research</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-gray-600 sm:text-lg">
            Ideas for what to hunt for next, based on the artists, favorites and genres already in your collection. Anything you add goes straight to the wishlist.
          </p>
        </div>
        <Link
          href="/vinyl"
          className="inline-flex w-fit shrink-0 rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
        >
          Back to catalog
        </Link>
      </div>

      {sections.map((section) => {
        const sectionRows = rows.filter((row) => row.kind === section.kind);
        if (!sectionRows.length) return null;
        return (
          <section key={section.kind} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-950">{section.title}</h2>
            {sectionRows.map((row) => {
              const albums = results[row.key];
              if (albums && !albums.some((album) => !isAlbumInCollection(album, everyRecord))) return null;
              return (
                <div key={row.key} className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <RowHeading row={row} />
                  <div className="mt-4">
                    {albums ? (
                      <AlbumSuggestionGrid albums={albums} records={everyRecord} />
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[0, 1, 2, 3].map((index) => (
                          <div key={index} className="aspect-[3/4] animate-pulse rounded-lg bg-gray-200" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}

      {!stillLoading && !hasAnything ? (
        <p className="text-sm text-gray-600">Nothing new to suggest right now. Add a few more favorites and check back.</p>
      ) : null}
    </div>
  );
}
