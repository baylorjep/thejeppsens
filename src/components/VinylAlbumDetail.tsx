"use client";

import { VinylRecord } from "@/data/vinyls";
import { fetchVinylRecords, saveVinylRecord } from "@/lib/vinylApi";
import { getStatusTone } from "@/lib/vinylAnalytics";
import { readQueuedVinyls } from "@/lib/vinylQueue";
import { getDecade, statusLabel } from "@/lib/vinylRecordUtils";
import { Disc3, Pencil, Star } from "lucide-react";
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
      <div className="grid gap-4 sm:grid-cols-2">
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
  const [notesDraft, setNotesDraft] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

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

  useEffect(() => {
    setNotesDraft(record?.notes ?? "");
    setIsEditingNotes(false);
  }, [record?.id, record?.notes]);

  const saveNotes = async () => {
    if (!record) return;
    setIsSavingNotes(true);
    const nextRecord = { ...record, notes: notesDraft.trim() || undefined };

    try {
      const response = await saveVinylRecord(nextRecord);
      setRecords((current) =>
        current.map((item) => (item.id === response.record.id ? response.record : item)),
      );
      setIsEditingNotes(false);
    } catch {
      setRecords((current) =>
        current.map((item) => (item.id === nextRecord.id ? nextRecord : item)),
      );
      setIsEditingNotes(false);
    } finally {
      setIsSavingNotes(false);
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
    <article className="grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <CoverGallery record={record} />

      <div>
        <Link href="/vinyl" className="mb-6 inline-flex text-sm font-medium text-gray-950 underline-offset-4 hover:underline sm:mb-8">
          Back to vinyl
        </Link>

        <div className="flex items-start justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-gray-500">
              Album
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
              {record.title}
            </h1>
            <p className="mt-3 text-lg text-gray-600 sm:text-xl">{record.artist}</p>
          </div>
          <button
            type="button"
            onClick={() => toggleFavorite(record)}
            disabled={favoriteRecordId === record.id}
            className={`shrink-0 rounded-full border p-3 transition-colors ${
              record.favorite
                ? "border-gray-950 bg-gray-950 text-white"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-500 hover:text-gray-950"
            }`}
            aria-label={record.favorite ? `Remove ${record.title} from favorites` : `Add ${record.title} to favorites`}
          >
            <Star className={`h-5 w-5 ${record.favorite ? "fill-current" : ""}`} />
          </button>
        </div>

        {record.status !== "owned" ? (
          <div className={`mt-5 rounded-lg border p-4 ${getStatusTone(record.status).card}`}>
            <p className="text-sm font-medium text-gray-950">{statusLabel(record.status)}</p>
            <p className="mt-1 text-sm text-gray-700">
              {record.status === "wishlist"
                ? "This one is on Isabel's wishlist."
                : "This copy is in the collection, but a better version is still on the radar."}
            </p>
          </div>
        ) : null}

        <dl className="mt-6 grid gap-3 text-sm sm:mt-8 sm:grid-cols-2">
          {[
            ["Released", record.releaseYear?.toString()],
            ["Decade", getDecade(record)],
            ["Status", statusLabel(record.status)],
            ["Format", record.format],
            ["Disc count", record.discCount?.toString()],
            ["Label", record.label],
            ["Catalog number", record.catalogNumber],
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
              <ol className="space-y-2 text-gray-700">
                {record.favoriteTracks.map((track, index) => (
                  <li key={track} className="flex gap-3">
                    <span className="w-5 shrink-0 text-sm text-gray-400">{index + 1}</span>
                    <span>{track}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Notes</h2>
              <button
                type="button"
                onClick={() => setIsEditingNotes((current) => !current)}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-950 underline-offset-4 hover:underline"
              >
                <Pencil className="h-4 w-4" />
                {isEditingNotes ? "Cancel" : record.notes ? "Edit notes" : "Add notes"}
              </button>
            </div>

            {isEditingNotes ? (
              <div className="space-y-3">
                <textarea
                  value={notesDraft}
                  onChange={(event) => setNotesDraft(event.target.value)}
                  className="min-h-28 w-full rounded-md border border-gray-300 px-3 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-950"
                  placeholder="Add something personal about this record..."
                />
                <button
                  type="button"
                  onClick={saveNotes}
                  disabled={isSavingNotes}
                  className="rounded-md bg-gray-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingNotes ? "Saving..." : "Save notes"}
                </button>
              </div>
            ) : record.notes ? (
              <p className="leading-7 text-gray-700">{record.notes}</p>
            ) : (
              <p className="text-sm text-gray-500">No notes yet.</p>
            )}
          </div>

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
