"use client";

import { VinylRecord } from "@/data/vinyls";
import { fetchVinylRecords, saveVinylRecord, VinylApiStatus } from "@/lib/vinylApi";
import { readQueuedVinyls } from "@/lib/vinylQueue";
import { getDecade, statusLabel } from "@/lib/vinylRecordUtils";
import {
  X,
  Disc3,
  Grid3X3,
  List,
  Search,
  Shuffle,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type VinylCatalogProps = {
  records: VinylRecord[];
};

type ViewMode = "grid" | "list";
type FilterKey = "genres" | "moods" | "status" | "decades";

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function CoverArt({ record, priority = false }: { record: VinylRecord; priority?: boolean }) {
  if (record.coverImage) {
    return (
      <Image
        src={record.coverImage}
        alt={`${record.title} by ${record.artist} cover`}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover"
        unoptimized={record.coverImage.startsWith("data:")}
      />
    );
  }

  return (
    <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_center,_#f9fafb,_#e5e7eb)]">
      <div className="flex h-28 w-28 items-center justify-center rounded-full border border-gray-300 bg-white shadow-sm">
        <Disc3 className="h-14 w-14 text-gray-300" />
      </div>
    </div>
  );
}

function RecordMeta({ record }: { record: VinylRecord }) {
  const chips = [
    record.releaseYear?.toString(),
    getDecade(record),
    record.vinylColor,
    statusLabel(record.status),
  ].filter(Boolean);

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {chips.map((chip) => (
        <span
          key={chip}
          className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600"
        >
          {chip}
        </span>
      ))}
    </div>
  );
}

export default function VinylCatalog({ records }: VinylCatalogProps) {
  const [allRecords, setAllRecords] = useState<VinylRecord[]>(records);
  const [, setApiSource] = useState<VinylApiStatus>("local");
  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const [activeMood, setActiveMood] = useState("All");
  const [activeStatus, setActiveStatus] = useState("All");
  const [activeDecade, setActiveDecade] = useState("All");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [pickedRecordId, setPickedRecordId] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<VinylRecord | null>(null);
  const [favoriteRecordId, setFavoriteRecordId] = useState<string | null>(null);

  useEffect(() => {
    const queuedRecords = readQueuedVinyls();
    fetchVinylRecords()
      .then((response) => {
        setApiSource(response.source);
        setAllRecords(response.source === "supabase" ? response.records : [...response.records, ...queuedRecords]);
      })
      .catch(() => setAllRecords([...records, ...queuedRecords]));
  }, [records]);

  const filterOptions = useMemo(
    () => ({
      genres: uniqueSorted(allRecords.flatMap((record) => record.genres)),
      moods: uniqueSorted(allRecords.flatMap((record) => record.moods)),
      status: ["Owned", "Wishlist", "Upgrade wanted"],
      decades: uniqueSorted(allRecords.map(getDecade)),
    }),
    [allRecords],
  );

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return allRecords.filter((record) => {
      const searchable = [
        record.title,
        record.artist,
        record.releaseYear?.toString(),
        record.pressing,
        record.vinylColor,
        record.condition,
        record.source,
        record.notes,
        record.favoriteStories,
        ...record.genres,
        ...record.moods,
        ...(record.favoriteTracks ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);
      const matchesGenre = activeGenre === "All" || record.genres.includes(activeGenre);
      const matchesMood = activeMood === "All" || record.moods.includes(activeMood);
      const matchesStatus = activeStatus === "All" || statusLabel(record.status) === activeStatus;
      const matchesDecade = activeDecade === "All" || getDecade(record) === activeDecade;
      return matchesQuery && matchesGenre && matchesMood && matchesStatus && matchesDecade;
    });
  }, [activeDecade, activeGenre, activeMood, activeStatus, allRecords, query]);

  const carouselRecords = allRecords;
  const rollingRecords = [...carouselRecords, ...carouselRecords, ...carouselRecords];
  const rollingRecordsReverse = [...carouselRecords].reverse().concat([...carouselRecords].reverse(), [...carouselRecords].reverse());
  const pickedRecord = allRecords.find((record) => record.id === pickedRecordId);

  const favoriteCount = allRecords.filter((record) => record.favorite).length;
  const ownedCount = allRecords.filter((record) => record.status === "owned").length;
  const topDecade = uniqueSorted(allRecords.map(getDecade).filter((decade) => decade !== "Unknown"))[0] ?? "None";

  const pickRandomRecord = () => {
    const pool = filteredRecords.length ? filteredRecords : allRecords;
    const next = pool[Math.floor(Math.random() * pool.length)];
    setPickedRecordId(next.id);
  };

  const clearFilters = () => {
    setQuery("");
    setActiveGenre("All");
    setActiveMood("All");
    setActiveStatus("All");
    setActiveDecade("All");
  };

  const toggleFavorite = async (record: VinylRecord) => {
    const nextRecord = { ...record, favorite: !record.favorite };
    setFavoriteRecordId(record.id);

    try {
      const response = await saveVinylRecord(nextRecord);
      const savedRecord = response.record;
      setApiSource(response.source);
      setAllRecords((current) =>
        current.map((item) => (item.id === savedRecord.id ? savedRecord : item)),
      );
      setSelectedRecord((current) => (current?.id === savedRecord.id ? savedRecord : current));
    } catch {
      setAllRecords((current) =>
        current.map((item) => (item.id === nextRecord.id ? nextRecord : item)),
      );
      setSelectedRecord((current) => (current?.id === nextRecord.id ? nextRecord : current));
    } finally {
      setFavoriteRecordId(null);
    }
  };

  const filterGroups: Array<{
    label: string;
    value: string;
    setValue: (value: string) => void;
    options: string[];
    keyName: FilterKey;
  }> = [
    {
      label: "Genre",
      value: activeGenre,
      setValue: setActiveGenre,
      options: filterOptions.genres,
      keyName: "genres",
    },
    {
      label: "Mood",
      value: activeMood,
      setValue: setActiveMood,
      options: filterOptions.moods,
      keyName: "moods",
    },
    {
      label: "Status",
      value: activeStatus,
      setValue: setActiveStatus,
      options: filterOptions.status,
      keyName: "status",
    },
    {
      label: "Decade",
      value: activeDecade,
      setValue: setActiveDecade,
      options: filterOptions.decades,
      keyName: "decades",
    },
  ];

  return (
    <div>
      <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <p className="text-sm text-gray-500">Records</p>
          <p className="mt-2 text-3xl font-semibold text-gray-950">{allRecords.length}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <p className="text-sm text-gray-500">Favorites</p>
          <p className="mt-2 text-3xl font-semibold text-gray-950">{favoriteCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <p className="text-sm text-gray-500">Owned</p>
          <p className="mt-2 text-3xl font-semibold text-gray-950">{ownedCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
          <p className="text-sm text-gray-500">Top decade</p>
          <p className="mt-2 text-lg font-semibold text-gray-950">{topDecade}</p>
        </div>
      </div>

      {rollingRecords.length > 0 ? (
        <section className="mb-10 overflow-hidden py-2">
          <div className="vinyl-marquee flex w-max gap-4">
            {rollingRecords.map((record, index) => (
              <button
                key={`${record.id}-${index}`}
                type="button"
                onClick={() => setSelectedRecord(record)}
                className="relative h-40 w-40 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md sm:h-48 sm:w-48 lg:h-56 lg:w-56"
                aria-label={`View ${record.title} by ${record.artist}`}
              >
                <CoverArt record={record} priority={index < 6} />
              </button>
            ))}
          </div>
          <div className="vinyl-marquee-reverse mt-4 flex w-max gap-4">
            {rollingRecordsReverse.map((record, index) => (
              <button
                key={`${record.id}-reverse-${index}`}
                type="button"
                onClick={() => setSelectedRecord(record)}
                className="relative h-32 w-32 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md sm:h-40 sm:w-40 lg:h-48 lg:w-48"
                aria-label={`View ${record.title} by ${record.artist}`}
              >
                <CoverArt record={record} priority={index < 6} />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mb-8 rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative block flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, artist, song, genre, notes, stories..."
              className="w-full rounded-md border border-gray-300 py-3 pl-10 pr-4 text-sm outline-none transition-colors focus:border-gray-950"
            />
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={pickRandomRecord}
              className="inline-flex items-center gap-2 rounded-md bg-gray-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              <Shuffle className="h-4 w-4" />
              Pick one
            </button>
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
            >
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              {viewMode === "grid" ? "List" : "Grid"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filterGroups.map((group) => (
            <label key={group.keyName} className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-gray-500">
                {group.label}
              </span>
              <select
                value={group.value}
                onChange={(event) => group.setValue(event.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-950"
              >
                {["All", ...group.options].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredRecords.length} of {allRecords.length} records
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="text-left text-sm font-medium text-gray-950 underline-offset-4 hover:underline"
          >
            Clear filters
          </button>
        </div>
      </section>

      {pickedRecord ? (
        <div className="mb-8 rounded-lg border border-gray-950 bg-gray-950 p-5 text-white">
          <p className="text-sm text-gray-400">Tonight&apos;s pick</p>
          <p className="mt-1 text-2xl font-semibold">
            {pickedRecord.title} <span className="text-gray-400">by {pickedRecord.artist}</span>
          </p>
        </div>
      ) : null}

      {filteredRecords.length > 0 ? (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
              : "space-y-4"
          }
        >
          {filteredRecords.map((record) => (
            <article
              key={record.id}
              className={
                viewMode === "grid"
                  ? "overflow-hidden rounded-lg border border-gray-200 bg-white"
                  : "grid overflow-hidden rounded-lg border border-gray-200 bg-white sm:grid-cols-[180px_minmax(0,1fr)]"
              }
            >
              <div className={viewMode === "grid" ? "relative aspect-square" : "relative aspect-square sm:aspect-auto"}>
                <CoverArt record={record} />
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-950">{record.title}</h2>
                    <p className="mt-1 text-sm text-gray-600">{record.artist}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(record)}
                    disabled={favoriteRecordId === record.id}
                    className={`rounded-full border p-2 transition-colors ${
                      record.favorite
                        ? "border-gray-950 bg-gray-950 text-white"
                        : "border-gray-200 bg-white text-gray-500 hover:border-gray-500 hover:text-gray-950"
                    }`}
                    title={record.favorite ? "Remove favorite" : "Add favorite"}
                    aria-label={record.favorite ? `Remove ${record.title} from favorites` : `Add ${record.title} to favorites`}
                  >
                    <Star className={`h-4 w-4 ${record.favorite ? "fill-current" : ""}`} />
                  </button>
                </div>

                <RecordMeta record={record} />

                <div className="mt-4 flex flex-wrap gap-2">
                  {[...record.genres, ...record.moods].slice(0, 6).map((tag) => (
                    <span key={tag} className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
                      {tag}
                    </span>
                  ))}
                </div>

                {record.favoriteTracks?.length ? (
                  <p className="mt-4 text-sm text-gray-600">
                    Favorite tracks: {record.favoriteTracks.join(", ")}
                  </p>
                ) : null}

                {record.notes ? (
                  <p className="mt-4 border-t border-gray-100 pt-4 text-sm leading-6 text-gray-600">
                    {record.notes}
                  </p>
                ) : null}

                <Link
                  href={`/vinyl/${record.id}`}
                  className="mt-4 inline-flex text-sm font-medium text-gray-950 underline-offset-4 hover:underline"
                >
                  Open album page
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <Disc3 className="mx-auto h-12 w-12 text-gray-300" />
          <h2 className="mt-4 text-xl font-semibold text-gray-950">No matching records</h2>
          <p className="mt-2 text-gray-600">Try clearing filters or changing the search.</p>
        </div>
      )}

      {selectedRecord ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="vinyl-modal-title"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="relative aspect-square bg-gray-100">
                <CoverArt record={selectedRecord} priority />
              </div>

              <div className="p-6 sm:p-8">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
                      Album details
                    </p>
                    <h2 id="vinyl-modal-title" className="text-3xl font-semibold text-gray-950">
                      {selectedRecord.title}
                    </h2>
                    <p className="mt-2 text-lg text-gray-600">{selectedRecord.artist}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(selectedRecord)}
                      disabled={favoriteRecordId === selectedRecord.id}
                      className={`rounded-full border p-2 transition-colors ${
                        selectedRecord.favorite
                          ? "border-gray-950 bg-gray-950 text-white"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-500 hover:text-gray-950"
                      }`}
                      aria-label={selectedRecord.favorite ? `Remove ${selectedRecord.title} from favorites` : `Add ${selectedRecord.title} to favorites`}
                    >
                      <Star className={`h-5 w-5 ${selectedRecord.favorite ? "fill-current" : ""}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(null)}
                      className="rounded-full border border-gray-200 p-2 text-gray-600 transition-colors hover:border-gray-500 hover:text-gray-950"
                      aria-label="Close album details"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <RecordMeta record={selectedRecord} />

                <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                  {[
                    ["Released", selectedRecord.releaseYear?.toString()],
                    ["Status", statusLabel(selectedRecord.status)],
                    ["Pressing", selectedRecord.pressing],
                    ["Vinyl color", selectedRecord.vinylColor],
                    ["Condition", selectedRecord.condition],
                    ["Source", selectedRecord.source],
                  ].map(([label, value]) =>
                    value ? (
                      <div key={label} className="rounded-md bg-gray-50 p-3">
                        <dt className="text-gray-500">{label}</dt>
                        <dd className="mt-1 font-medium text-gray-950">{value}</dd>
                      </div>
                    ) : null,
                  )}
                </dl>

                <div className="mt-6 space-y-4">
                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-950">Genres</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.genres.map((genre) => (
                        <span key={genre} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-gray-950">Moods</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecord.moods.map((mood) => (
                        <span key={mood} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                          {mood}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedRecord.favoriteTracks?.length ? (
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-950">Favorite tracks</p>
                      <p className="text-sm leading-6 text-gray-600">
                        {selectedRecord.favoriteTracks.join(", ")}
                      </p>
                    </div>
                  ) : null}

                  {selectedRecord.notes ? (
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-950">Notes</p>
                      <p className="text-sm leading-6 text-gray-600">{selectedRecord.notes}</p>
                    </div>
                  ) : null}

                  {selectedRecord.favoriteStories ? (
                    <div>
                      <p className="mb-2 text-sm font-medium text-gray-950">Favorite stories</p>
                      <p className="text-sm leading-6 text-gray-600">{selectedRecord.favoriteStories}</p>
                    </div>
                  ) : null}
                </div>

                <Link
                  href={`/vinyl/${selectedRecord.id}`}
                  className="mt-8 inline-flex rounded-md bg-gray-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
                >
                  Open album page
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
