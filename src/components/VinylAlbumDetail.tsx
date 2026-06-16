"use client";

import { VinylRecord } from "@/data/vinyls";
import { getAppleMusicSearchUrl } from "@/lib/appleMusic";
import { fetchVinylRecords, saveVinylRecord } from "@/lib/vinylApi";
import { getStatusTone } from "@/lib/vinylAnalytics";
import { readQueuedVinyls } from "@/lib/vinylQueue";
import { getDecade, statusLabel } from "@/lib/vinylRecordUtils";
import { Disc3, ExternalLink, Pencil, Settings2, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import Confetti from "react-confetti";

type VinylAlbumDetailProps = {
  id: string;
  staticRecords: VinylRecord[];
};

type AlbumEditForm = {
  title: string;
  artist: string;
  releaseYear: string;
  originalReleaseYear: string;
  recordingYears: string;
  pressingYear: string;
  pressingNotes: string;
  label: string;
  catalogNumber: string;
  format: string;
  discCount: string;
  storageLocation: string;
  genres: string;
  moods: string;
  favoriteTracks: string;
  pressing: string;
  vinylColor: string;
  condition: string;
  source: string;
  giftFrom: string;
  whereWeGotIt: string;
  bestFor: string;
  status: VinylRecord["status"];
  notes: string;
  favoriteStories: string;
  favorite: boolean;
  coverImage: string;
  backCoverImage: string;
};

function recordToEditForm(record: VinylRecord): AlbumEditForm {
  return {
    title: record.title,
    artist: record.artist,
    releaseYear: record.releaseYear?.toString() ?? "",
    originalReleaseYear: record.originalReleaseYear?.toString() ?? "",
    recordingYears: record.recordingYears ?? "",
    pressingYear: record.pressingYear?.toString() ?? "",
    pressingNotes: record.pressingNotes ?? "",
    label: record.label ?? "",
    catalogNumber: record.catalogNumber ?? "",
    format: record.format ?? "LP",
    discCount: record.discCount?.toString() ?? "1",
    storageLocation: record.storageLocation ?? "",
    genres: record.genres.join(", "),
    moods: record.moods.join(", "),
    favoriteTracks: record.favoriteTracks?.join(", ") ?? "",
    pressing: record.pressing ?? "",
    vinylColor: record.vinylColor ?? "",
    condition: record.condition ?? "",
    source: record.source ?? "",
    giftFrom: record.giftFrom ?? "",
    whereWeGotIt: record.whereWeGotIt ?? "",
    bestFor: record.bestFor ?? "",
    status: record.status,
    notes: record.notes ?? "",
    favoriteStories: record.favoriteStories ?? "",
    favorite: Boolean(record.favorite),
    coverImage: record.coverImage ?? "",
    backCoverImage: record.backCoverImage ?? "",
  };
}

function CoverImage({
  record,
  src,
  side,
  sizes = "(max-width: 639px) 100vw, 50vw",
}: {
  record: VinylRecord;
  src?: string;
  side: "front" | "back";
  sizes?: string;
}) {
  if (src) {
    return (
      <Image
        src={src}
        alt={`${record.title} by ${record.artist} ${side} cover`}
        fill
        priority={side === "front"}
        sizes={sizes}
        quality={68}
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
              <CoverImage
                record={record}
                src={src}
                side={side as "front" | "back"}
                sizes="(max-width: 639px) 100vw, 50vw"
              />
            </div>
            <figcaption className="mt-2 text-sm font-medium text-gray-500">{label}</figcaption>
          </figure>
        ))}
      </div>
    );
  }

  return (
    <div className="relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
      <CoverImage
        record={record}
        src={record.coverImage}
        side="front"
        sizes="(max-width: 639px) 100vw, 50vw"
      />
    </div>
  );
}

export default function VinylAlbumDetail({ id, staticRecords }: VinylAlbumDetailProps) {
  const [records, setRecords] = useState<VinylRecord[]>(staticRecords);
  const [favoriteRecordId, setFavoriteRecordId] = useState<string | null>(null);
  const [isEditingRecord, setIsEditingRecord] = useState(false);
  const [editForm, setEditForm] = useState<AlbumEditForm | null>(null);
  const [editCoverFile, setEditCoverFile] = useState<File | undefined>();
  const [editBackCoverFile, setEditBackCoverFile] = useState<File | undefined>();
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [notesDraft, setNotesDraft] = useState("");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const inputClassName =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-950";

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

  const markAsOwned = async (target: VinylRecord) => {
    if (target.status === "owned") return;

    const nextRecord = { ...target, status: "owned" as const };

    try {
      const response = await saveVinylRecord(nextRecord);
      setRecords((current) =>
        current.map((item) => (item.id === response.record.id ? response.record : item)),
      );
    } catch {
      setRecords((current) =>
        current.map((item) => (item.id === nextRecord.id ? nextRecord : item)),
      );
    }

    setStatusMessage(`Nice. ${target.title} is now on the owned shelf.`);
    setShowConfetti(true);
    window.setTimeout(() => {
      setShowConfetti(false);
      setStatusMessage("");
    }, 3000);
  };

  useEffect(() => {
    setNotesDraft(record?.notes ?? "");
    setIsEditingNotes(false);
  }, [record?.id, record?.notes]);

  useEffect(() => {
    if (!record) return;
    setEditForm(recordToEditForm(record));
    setIsEditingRecord(false);
    setEditCoverFile(undefined);
    setEditBackCoverFile(undefined);
  }, [record?.id]);

  const updateEditForm = <Key extends keyof AlbumEditForm>(key: Key, value: AlbumEditForm[Key]) => {
    setEditForm((current) => (current ? { ...current, [key]: value } : current));
  };

  const cancelRecordEdit = () => {
    if (!record) return;
    setEditForm(recordToEditForm(record));
    setEditCoverFile(undefined);
    setEditBackCoverFile(undefined);
    setIsEditingRecord(false);
  };

  const saveRecordChanges = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!record || !editForm) return;

    const title = editForm.title.trim();
    const artist = editForm.artist.trim();
    if (!title || !artist) return;

    setIsSavingRecord(true);

    const nextRecord: VinylRecord = {
      ...record,
      title,
      artist,
      releaseYear: editForm.releaseYear ? Number(editForm.releaseYear) : undefined,
      originalReleaseYear: editForm.originalReleaseYear ? Number(editForm.originalReleaseYear) : undefined,
      recordingYears: editForm.recordingYears.trim() || undefined,
      pressingYear: editForm.pressingYear ? Number(editForm.pressingYear) : undefined,
      pressingNotes: editForm.pressingNotes.trim() || undefined,
      label: editForm.label.trim() || undefined,
      catalogNumber: editForm.catalogNumber.trim() || undefined,
      format: editForm.format.trim() || undefined,
      discCount: editForm.discCount ? Number(editForm.discCount) : undefined,
      storageLocation: editForm.storageLocation.trim() || undefined,
      genres: editForm.genres
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      moods: editForm.moods
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      favoriteTracks: editForm.favoriteTracks
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      pressing: editForm.pressing.trim() || undefined,
      vinylColor: editForm.vinylColor.trim() || undefined,
      condition: editForm.condition.trim() || undefined,
      source: editForm.source.trim() || undefined,
      giftFrom: editForm.giftFrom.trim() || undefined,
      whereWeGotIt: editForm.whereWeGotIt.trim() || undefined,
      bestFor: editForm.bestFor.trim() || undefined,
      status: editForm.status,
      notes: editForm.notes.trim() || undefined,
      favoriteStories: editForm.favoriteStories.trim() || undefined,
      favorite: editForm.favorite,
      coverImage: editForm.coverImage || undefined,
      backCoverImage: editForm.backCoverImage || undefined,
      dateAdded: record.dateAdded,
    };

    try {
      const response = await saveVinylRecord(nextRecord, editCoverFile, editBackCoverFile);
      setRecords((current) =>
        current.map((item) => (item.id === response.record.id ? response.record : item)),
      );
    } catch {
      setRecords((current) =>
        current.map((item) => (item.id === nextRecord.id ? nextRecord : item)),
      );
    } finally {
      setIsSavingRecord(false);
      setIsEditingRecord(false);
    }
  };

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
      {showConfetti ? <Confetti recycle={false} numberOfPieces={180} /> : null}
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
            {isEditingRecord && editForm ? (
              <div className="space-y-3">
                <input
                  value={editForm.title}
                  onChange={(event) => updateEditForm("title", event.target.value)}
                  className={`${inputClassName} text-3xl font-semibold tracking-tight sm:text-5xl lg:text-6xl`}
                  aria-label="Album title"
                />
                <input
                  value={editForm.artist}
                  onChange={(event) => updateEditForm("artist", event.target.value)}
                  className={`${inputClassName} text-lg text-gray-600 sm:text-xl`}
                  aria-label="Artist"
                />
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-semibold tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
                  {record.title}
                </h1>
                <p className="mt-3 text-lg text-gray-600 sm:text-xl">{record.artist}</p>
              </>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !isEditingRecord;
                setIsEditingRecord(next);
                if (next) setIsEditingNotes(false);
              }}
              className="rounded-full border border-gray-200 p-3 text-gray-600 transition-colors hover:border-gray-500 hover:text-gray-950"
              aria-label={isEditingRecord ? "Exit edit mode" : "Edit album details"}
            >
              <Settings2 className="h-5 w-5" />
            </button>
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
        </div>

        <a
          href={getAppleMusicSearchUrl(record)}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
        >
          <ExternalLink className="h-4 w-4" />
          Open in Apple Music
        </a>

        {record.status !== "owned" && !isEditingRecord ? (
          <div className={`mt-5 rounded-lg border p-4 ${getStatusTone(record.status).card}`}>
            <p className="text-sm font-medium text-gray-950">{statusLabel(record.status)}</p>
            <p className="mt-1 text-sm text-gray-700">
              {record.status === "wishlist"
                ? "This one is on Isabel's wishlist."
                : "This copy is in the collection, but a better version is still on the radar."}
            </p>
            <button
              type="button"
              onClick={() => markAsOwned(record)}
              className="mt-4 inline-flex rounded-md bg-gray-950 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Mark as owned
            </button>
          </div>
        ) : null}
        {statusMessage ? (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {statusMessage}
          </div>
        ) : null}

        {!isEditingRecord ? (
          <>
            <dl className="mt-6 grid gap-3 text-sm sm:mt-8 sm:grid-cols-2">
              {[
                ["Released", record.releaseYear?.toString()],
                ["Original release", record.originalReleaseYear?.toString()],
                ["Recording years", record.recordingYears],
                ["Pressing year", record.pressingYear?.toString()],
                ["Decade", getDecade(record)],
                ["Status", statusLabel(record.status)],
                ["Format", record.format],
                ["Disc count", record.discCount?.toString()],
                ["Label", record.label],
                ["Catalog number", record.catalogNumber],
                ["Pressing", record.pressing],
                ["Pressing notes", record.pressingNotes],
                ["Storage location", record.storageLocation],
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

              {record.giftFrom || record.whereWeGotIt || record.bestFor ? (
                <div>
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">Personal details</h2>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ["Gift from", record.giftFrom],
                      ["Where we got it", record.whereWeGotIt],
                      ["Best for", record.bestFor],
                    ].map(([label, value]) =>
                      value ? (
                        <div key={label} className="rounded-md bg-gray-50 p-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-gray-400">{label}</p>
                          <p className="mt-1 font-medium text-gray-950">{value}</p>
                        </div>
                      ) : null,
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <Link
              href="/vinyl"
              className="mt-8 inline-flex rounded-md bg-gray-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Back to catalog
            </Link>
          </>
        ) : (
          <form onSubmit={saveRecordChanges} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-gray-700">Front cover image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setEditCoverFile(event.target.files?.[0])}
                  className="block w-full rounded-md border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-gray-700">Back cover image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setEditBackCoverFile(event.target.files?.[0])}
                  className="block w-full rounded-md border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600"
                />
              </label>

              {[
                ["Release year", "releaseYear", "1977"],
                ["Original release year", "originalReleaseYear", "1960"],
                ["Recording years", "recordingYears", "1944-1945, late 1940s-1950s"],
                ["Pressing year", "pressingYear", "1974"],
                ["Format", "format", "LP, soundtrack, picture disc..."],
                ["Status", "status", ""],
                ["Label", "label", "Capitol, Reprise, Verve..."],
                ["Catalog number", "catalogNumber", "SW-1538, RS-1234..."],
                ["Disc count", "discCount", "1"],
                ["Storage location", "storageLocation", "Crate 1, crate 3.1..."],
                ["Genres", "genres", "Rock, Pop"],
                ["Moods", "moods", "Cozy, Dinner, Rainy"],
                ["Favorite tracks", "favoriteTracks", "Track one, Track two"],
                ["Pressing", "pressing", "Deluxe, standard, limited..."],
                ["Vinyl color", "vinylColor", "Black, clear, pink..."],
                ["Condition", "condition", "New, good, used..."],
                ["Source", "source", "Gift, record store, thrifted, wishlist..."],
                ["Pressing notes", "pressingNotes", "Italian reissue, expanded 2-LP edition, archival pressing..."],
                ["Gift from", "giftFrom", "If it was a gift, who from?"],
                ["Where we got it", "whereWeGotIt", "Record store, thrift shop, inheritance..."],
                ["Best for", "bestFor", "Dinner, road trip, rainy night, background music..."],
              ].map(([label, field, placeholder]) => {
                const key = field as keyof AlbumEditForm;
                if (field === "status") {
                  return (
                    <label key={field} className="block">
                      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
                      <select
                        value={editForm?.status ?? "owned"}
                        onChange={(event) => updateEditForm("status", event.target.value as VinylRecord["status"])}
                        className={inputClassName}
                      >
                        <option value="owned">Owned</option>
                        <option value="wishlist">Wishlist</option>
                        <option value="upgrade">Upgrade wanted</option>
                      </select>
                    </label>
                  );
                }

                return (
                    <label key={field} className="block">
                    <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
                    <input
                      value={String(editForm?.[key] ?? "")}
                      onChange={(event) => updateEditForm(key, event.target.value as string)}
                      className={inputClassName}
                      placeholder={placeholder}
                    />
                  </label>
                );
              })}

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-gray-700">Notes</span>
                <textarea
                  value={editForm?.notes ?? ""}
                  onChange={(event) => updateEditForm("notes", event.target.value)}
                  className={`${inputClassName} min-h-28`}
                  placeholder="Anything personal, condition notes, why she loves it..."
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm font-medium text-gray-700">Favorite stories / memories</span>
                <textarea
                  value={editForm?.favoriteStories ?? ""}
                  onChange={(event) => updateEditForm("favoriteStories", event.target.value)}
                  className={`${inputClassName} min-h-32`}
                  placeholder="Where she found it, who gave it to her, when you played it together, why it is special..."
                />
              </label>

              <label className="flex items-center gap-3 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={Boolean(editForm?.favorite)}
                  onChange={(event) => updateEditForm("favorite", event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Mark as a favorite</span>
              </label>
            </div>

            <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={isSavingRecord}
                className="inline-flex rounded-md bg-gray-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingRecord ? "Saving..." : "Save changes"}
              </button>
              <button
                type="button"
                onClick={cancelRecordEdit}
                className="inline-flex rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </article>
  );
}
