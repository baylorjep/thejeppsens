"use client";

import { VinylRecord } from "@/data/vinyls";
import { fetchVinylRecords, saveVinylRecord } from "@/lib/vinylApi";
import { readQueuedVinyls } from "@/lib/vinylQueue";
import { getDecade, statusLabel } from "@/lib/vinylRecordUtils";
import { Disc3, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type VinylAlbumDetailProps = {
  id: string;
  staticRecords: VinylRecord[];
};

function CoverImage({ record, src, side }: { record: VinylRecord; src?: string; side: "front" | "back" }) {
  if (src) {
    return (
      <Image
        src={src}
        alt={`${record.title} by ${record.artist} ${side} cover`}
        fill
        priority={side === "front"}
        className="object-cover"
        unoptimized={src.startsWith("data:")}
      />
    );
  }

  return (
    <div className="flex h-full items-center justify-center bg-gray-100">
      <Disc3 className="h-20 w-20 text-gray-300" />
    </div>
  );
}

function CoverGallery({ record }: { record: VinylRecord }) {
  if (record.backCoverImage) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
        {[
          ["Front", record.coverImage, "front"],
          ["Back", record.backCoverImage, "back"],
        ].map(([label, src, side]) => (
          <figure key={label}>
            <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              <CoverImage record={record} src={src} side={side as "front" | "back"} />
            </div>
            <figcaption className="mt-2 text-sm font-medium text-gray-500">{label}</figcaption>
          </figure>
        ))}
      </div>
    );
  }

  return (
    <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
      <CoverImage record={record} src={record.coverImage} side="front" />
    </div>
  );
}

export default function VinylAlbumDetail({ id, staticRecords }: VinylAlbumDetailProps) {
  const [records, setRecords] = useState<VinylRecord[]>(staticRecords);
  const [favoriteRecordId, setFavoriteRecordId] = useState<string | null>(null);

  useEffect(() => {
    const queuedRecords = readQueuedVinyls();
    fetchVinylRecords()
      .then((response) => {
        setRecords(response.source === "supabase" ? response.records : [...response.records, ...queuedRecords]);
      })
      .catch(() => setRecords([...staticRecords, ...queuedRecords]));
  }, [staticRecords]);

  const record = records.find((item) => item.id === id);

  const toggleFavorite = async (target: VinylRecord) => {
    const nextRecord = { ...target, favorite: !target.favorite };
    setFavoriteRecordId(target.id);

    try {
      const response = await saveVinylRecord(nextRecord);
      setRecords((current) =>
        current.map((item) => (item.id === response.record.id ? response.record : item)),
      );
    } catch {
      setRecords((current) =>
        current.map((item) => (item.id === nextRecord.id ? nextRecord : item)),
      );
    } finally {
      setFavoriteRecordId(null);
    }
  };

  if (!record) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
        <Disc3 className="mx-auto h-12 w-12 text-gray-300" />
        <h1 className="mt-4 text-2xl font-semibold text-gray-950">Album not found</h1>
        <Link href="/vinyl" className="mt-4 inline-flex text-sm font-medium text-gray-950 underline-offset-4 hover:underline">
          Back to vinyl
        </Link>
      </div>
    );
  }

  return (
    <article className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <CoverGallery record={record} />

      <div>
        <Link href="/vinyl" className="mb-8 inline-flex text-sm font-medium text-gray-950 underline-offset-4 hover:underline">
          Back to vinyl
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
              Album
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-gray-950 sm:text-6xl">
              {record.title}
            </h1>
            <p className="mt-3 text-xl text-gray-600">{record.artist}</p>
          </div>
          <button
            type="button"
            onClick={() => toggleFavorite(record)}
            disabled={favoriteRecordId === record.id}
            className={`rounded-full border p-3 transition-colors ${
              record.favorite
                ? "border-gray-950 bg-gray-950 text-white"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-500 hover:text-gray-950"
            }`}
            aria-label={record.favorite ? `Remove ${record.title} from favorites` : `Add ${record.title} to favorites`}
          >
            <Star className={`h-5 w-5 ${record.favorite ? "fill-current" : ""}`} />
          </button>
        </div>

        <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
          {[
            ["Released", record.releaseYear?.toString()],
            ["Decade", getDecade(record)],
            ["Status", statusLabel(record.status)],
            ["Pressing", record.pressing],
            ["Vinyl color", record.vinylColor],
            ["Condition", record.condition],
            ["Source", record.source],
            ["Date added", record.dateAdded],
          ].map(([label, value]) =>
            value ? (
              <div key={label} className="rounded-md bg-gray-50 p-4">
                <dt className="text-gray-500">{label}</dt>
                <dd className="mt-1 font-medium text-gray-950">{value}</dd>
              </div>
            ) : null,
          )}
        </dl>

        <div className="mt-8 space-y-6">
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Genres</h2>
            <div className="flex flex-wrap gap-2">
              {record.genres.map((genre) => (
                <span key={genre} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{genre}</span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Moods</h2>
            <div className="flex flex-wrap gap-2">
              {record.moods.map((mood) => (
                <span key={mood} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">{mood}</span>
              ))}
            </div>
          </div>

          {record.favoriteTracks?.length ? (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Favorite tracks</h2>
              <p className="leading-7 text-gray-700">{record.favoriteTracks.join(", ")}</p>
            </div>
          ) : null}

          {record.notes ? (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Notes</h2>
              <p className="leading-7 text-gray-700">{record.notes}</p>
            </div>
          ) : null}

          {record.favoriteStories ? (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Favorite stories</h2>
              <p className="leading-7 text-gray-700">{record.favoriteStories}</p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
