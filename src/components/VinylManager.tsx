"use client";

import { VinylRecord, vinyls } from "@/data/vinyls";
import { optimizeImageFile } from "@/lib/vinylImage";
import { deleteVinylRecord, fetchVinylRecords, saveVinylRecord, VinylApiStatus } from "@/lib/vinylApi";
import { readQueuedVinyls, writeQueuedVinyls } from "@/lib/vinylQueue";
import { slugifyVinylId, splitList, statusLabel } from "@/lib/vinylRecordUtils";
import { Copy, Download, Edit3, ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

type FormState = {
  title: string;
  artist: string;
  releaseYear: string;
  label: string;
  catalogNumber: string;
  format: string;
  discCount: string;
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

const emptyForm: FormState = {
  title: "",
  artist: "",
  releaseYear: "",
  label: "",
  catalogNumber: "",
  format: "LP",
  discCount: "1",
  genres: "",
  moods: "",
  favoriteTracks: "",
  pressing: "",
  vinylColor: "",
  condition: "",
  source: "",
  giftFrom: "",
  whereWeGotIt: "",
  bestFor: "",
  status: "owned",
  notes: "",
  favoriteStories: "",
  favorite: false,
  coverImage: "",
  backCoverImage: "",
};

function recordToForm(record: VinylRecord): FormState {
  return {
    title: record.title,
    artist: record.artist,
    releaseYear: record.releaseYear?.toString() ?? "",
    label: record.label ?? "",
    catalogNumber: record.catalogNumber ?? "",
    format: record.format ?? "LP",
    discCount: record.discCount?.toString() ?? "1",
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

function imageToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

function inputClassName() {
  return "w-full rounded-md border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none transition-colors focus:border-gray-950";
}

export default function VinylManager() {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [records, setRecords] = useState<VinylRecord[]>([]);
  const [apiSource, setApiSource] = useState<VinylApiStatus>("local");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [backImageFile, setBackImageFile] = useState<File | undefined>();
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadRecords = async () => {
      const queuedRecords = readQueuedVinyls();

      try {
        const response = await fetchVinylRecords();
        setApiSource(response.source);
        setRecords(response.source === "supabase" ? response.records : [...response.records, ...queuedRecords]);
      } catch {
        setApiSource("local");
        setRecords([...vinyls, ...queuedRecords]);
      }
    };

    loadRecords();
  }, []);

  const queuedOnlyRecords = useMemo(() => {
    const staticIds = new Set(vinyls.map((record) => record.id));
    return records.filter((record) => !staticIds.has(record.id));
  }, [records]);

  const exportText = useMemo(() => JSON.stringify(queuedOnlyRecords, null, 2), [queuedOnlyRecords]);

  const updateForm = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const syncLocalQueue = (nextRecords: VinylRecord[]) => {
    if (apiSource === "supabase") return;

    const staticIds = new Set(vinyls.map((record) => record.id));
    writeQueuedVinyls(nextRecords.filter((record) => !staticIds.has(record.id)));
  };

  const handleImageChange = async (side: "front" | "back", file?: File) => {
    if (!file) return;

    try {
      const optimizedFile = await optimizeImageFile(file);
      const imageUrl = await imageToDataUrl(optimizedFile);
      if (side === "front") {
        setImageFile(optimizedFile);
        updateForm("coverImage", imageUrl);
      } else {
        setBackImageFile(optimizedFile);
        updateForm("backCoverImage", imageUrl);
      }
      setMessage("Image loaded and optimized.");
    } catch {
      setMessage("Could not load that image.");
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setImageFile(undefined);
    setBackImageFile(undefined);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    const artist = form.artist.trim();

    if (!title || !artist) {
      setMessage("Title and artist are required.");
      return;
    }

    setIsSaving(true);

    const record: VinylRecord = {
      id: editingId ?? slugifyVinylId(title, artist),
      title,
      artist,
      releaseYear: form.releaseYear ? Number(form.releaseYear) : undefined,
      label: form.label.trim() || undefined,
      catalogNumber: form.catalogNumber.trim() || undefined,
      format: form.format.trim() || undefined,
      discCount: form.discCount ? Number(form.discCount) : undefined,
      genres: splitList(form.genres),
      moods: splitList(form.moods),
      favoriteTracks: splitList(form.favoriteTracks),
      pressing: form.pressing.trim() || undefined,
      vinylColor: form.vinylColor.trim() || undefined,
      condition: form.condition.trim() || undefined,
      source: form.source.trim() || undefined,
      giftFrom: form.giftFrom.trim() || undefined,
      whereWeGotIt: form.whereWeGotIt.trim() || undefined,
      bestFor: form.bestFor.trim() || undefined,
      dateAdded: new Date().toISOString().slice(0, 10),
      status: form.status,
      notes: form.notes.trim() || undefined,
      favoriteStories: form.favoriteStories.trim() || undefined,
      coverImage: form.coverImage || undefined,
      backCoverImage: form.backCoverImage || undefined,
      favorite: form.favorite,
    };

    try {
      const response = await saveVinylRecord(record, imageFile, backImageFile);
      const savedRecord = response.record;
      const nextRecords = [...records.filter((item) => item.id !== savedRecord.id), savedRecord];

      setApiSource(response.source);
      setRecords(nextRecords);
      syncLocalQueue(nextRecords);
      resetForm();
      setMessage(response.source === "supabase" ? `${title} saved permanently.` : `${title} queued locally.`);
    } catch {
      const nextRecords = [...records.filter((item) => item.id !== record.id), record];
      setRecords(nextRecords);
      writeQueuedVinyls(nextRecords.filter((item) => !vinyls.some((staticRecord) => staticRecord.id === item.id)));
      resetForm();
      setMessage(`${title} saved locally because Supabase is not available.`);
    } finally {
      setIsSaving(false);
    }
  };

  const editRecord = (record: VinylRecord) => {
    setEditingId(record.id);
    setForm(recordToForm(record));
    setImageFile(undefined);
    setBackImageFile(undefined);
    setMessage(`Editing ${record.title}.`);
  };

  const removeRecord = async (id: string) => {
    const nextRecords = records.filter((record) => record.id !== id);
    setRecords(nextRecords);
    syncLocalQueue(nextRecords);

    try {
      await deleteVinylRecord(id);
    } catch {
      writeQueuedVinyls(nextRecords.filter((record) => !vinyls.some((staticRecord) => staticRecord.id === record.id)));
    }
  };

  const copyExport = async () => {
    await navigator.clipboard.writeText(exportText);
    setMessage("Current non-static records copied as JSON.");
  };

  const downloadExport = () => {
    const blob = new Blob([exportText], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "vinyl-records.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
      <form onSubmit={handleSubmit} className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-950">
              {editingId ? "Edit record" : "Add a record"}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Saving to {apiSource === "supabase" ? "Supabase" : "local queue"}.
            </p>
          </div>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-medium text-gray-950 underline-offset-4 hover:underline"
            >
              Cancel edit
            </button>
          ) : null}
        </div>

        <div className="mb-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-gray-500">
            Start With Photos
          </h3>
          <p className="mt-2 text-sm text-gray-600">
            Drop in the front and back cover first. Images are automatically resized before upload
            so the vinyl pages stay faster on mobile.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Front cover image</span>
            <div className="grid gap-4">
              <div className="relative aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                {form.coverImage ? (
                  <Image src={form.coverImage} alt="Cover preview" fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImagePlus className="h-10 w-10 text-gray-300" />
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={(event) => handleImageChange("front", event.target.files?.[0])} className="block w-full rounded-md border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-600" />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Back cover image</span>
            <div className="grid gap-4">
              <div className="relative aspect-square overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                {form.backCoverImage ? (
                  <Image src={form.backCoverImage} alt="Back cover preview" fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImagePlus className="h-10 w-10 text-gray-300" />
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" onChange={(event) => handleImageChange("back", event.target.files?.[0])} className="block w-full rounded-md border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-600" />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Album title</span>
            <input value={form.title} onChange={(event) => updateForm("title", event.target.value)} className={inputClassName()} required />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Artist</span>
            <input value={form.artist} onChange={(event) => updateForm("artist", event.target.value)} className={inputClassName()} required />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Release year</span>
            <input value={form.releaseYear} onChange={(event) => updateForm("releaseYear", event.target.value)} className={inputClassName()} inputMode="numeric" placeholder="1977" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Format</span>
            <input value={form.format} onChange={(event) => updateForm("format", event.target.value)} className={inputClassName()} placeholder="LP, soundtrack, picture disc..." />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Status</span>
            <select value={form.status} onChange={(event) => updateForm("status", event.target.value as VinylRecord["status"])} className={inputClassName()}>
              <option value="owned">Owned</option>
              <option value="wishlist">Wishlist</option>
              <option value="upgrade">Upgrade wanted</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Label</span>
            <input value={form.label} onChange={(event) => updateForm("label", event.target.value)} className={inputClassName()} placeholder="Capitol, Reprise, Verve..." />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Catalog number</span>
            <input value={form.catalogNumber} onChange={(event) => updateForm("catalogNumber", event.target.value)} className={inputClassName()} placeholder="SW-1538, RS-1234..." />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Disc count</span>
            <input value={form.discCount} onChange={(event) => updateForm("discCount", event.target.value)} className={inputClassName()} inputMode="numeric" placeholder="1" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Genres</span>
            <input value={form.genres} onChange={(event) => updateForm("genres", event.target.value)} className={inputClassName()} placeholder="Rock, Pop" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Moods</span>
            <input value={form.moods} onChange={(event) => updateForm("moods", event.target.value)} className={inputClassName()} placeholder="Cozy, Dinner, Rainy" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Favorite tracks</span>
            <input value={form.favoriteTracks} onChange={(event) => updateForm("favoriteTracks", event.target.value)} className={inputClassName()} placeholder="Track one, Track two" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Pressing</span>
            <input value={form.pressing} onChange={(event) => updateForm("pressing", event.target.value)} className={inputClassName()} placeholder="Deluxe, standard, limited..." />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Vinyl color</span>
            <input value={form.vinylColor} onChange={(event) => updateForm("vinylColor", event.target.value)} className={inputClassName()} placeholder="Black, clear, pink..." />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Condition</span>
            <input value={form.condition} onChange={(event) => updateForm("condition", event.target.value)} className={inputClassName()} placeholder="New, good, used..." />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-gray-700">Source</span>
            <input value={form.source} onChange={(event) => updateForm("source", event.target.value)} className={inputClassName()} placeholder="Gift, record store, thrifted, wishlist..." />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Gift from</span>
            <input value={form.giftFrom} onChange={(event) => updateForm("giftFrom", event.target.value)} className={inputClassName()} placeholder="If it was a gift, who from?" />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-gray-700">Where we got it</span>
            <input value={form.whereWeGotIt} onChange={(event) => updateForm("whereWeGotIt", event.target.value)} className={inputClassName()} placeholder="Record store, thrift shop, inheritance..." />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-gray-700">Best for</span>
            <input value={form.bestFor} onChange={(event) => updateForm("bestFor", event.target.value)} className={inputClassName()} placeholder="Dinner, road trip, rainy night, background music..." />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-gray-700">Notes</span>
            <textarea value={form.notes} onChange={(event) => updateForm("notes", event.target.value)} className={`${inputClassName()} min-h-28`} placeholder="Anything personal, condition notes, why she loves it..." />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-2 block text-sm font-medium text-gray-700">Favorite stories / memories</span>
            <textarea
              value={form.favoriteStories}
              onChange={(event) => updateForm("favoriteStories", event.target.value)}
              className={`${inputClassName()} min-h-32`}
              placeholder="Where she found it, who gave it to her, when you played it together, why it is special..."
            />
          </label>

          <label className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" checked={form.favorite} onChange={(event) => updateForm("favorite", event.target.checked)} className="h-4 w-4 rounded border-gray-300" />
            <span className="text-sm font-medium text-gray-700">Mark as a favorite</span>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button type="submit" disabled={isSaving} className="rounded-md bg-gray-950 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60">
            {isSaving ? "Saving..." : editingId ? "Save changes" : "Add record"}
          </button>
          {message ? <p className="text-sm text-gray-600">{message}</p> : null}
        </div>
      </form>

      <aside className="rounded-lg border border-gray-200 bg-gray-50 p-5">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-gray-950">Records</h2>
          <p className="mt-1 text-sm text-gray-600">
            {records.length} loaded. {apiSource === "supabase" ? "Backed by Supabase." : "Local queue until Supabase env is added."}
          </p>
        </div>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row">
          <button type="button" onClick={copyExport} disabled={!queuedOnlyRecords.length} className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50">
            <Copy className="h-4 w-4" />
            Copy JSON
          </button>
          <button type="button" onClick={downloadExport} disabled={!queuedOnlyRecords.length} className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500 disabled:cursor-not-allowed disabled:opacity-50">
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>

        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="grid grid-cols-[64px_minmax(0,1fr)_auto] gap-3 rounded-md border border-gray-200 bg-white p-3">
              <div className="relative aspect-square overflow-hidden rounded bg-gray-100">
                {record.coverImage ? (
                  <Image src={record.coverImage} alt={`${record.title} cover`} fill className="object-cover" unoptimized={record.coverImage.startsWith("data:")} />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-950">{record.title}</p>
                <p className="truncate text-sm text-gray-600">{record.artist}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.12em] text-gray-400">{statusLabel(record.status)}</p>
              </div>
              <div className="flex items-start gap-1">
                <button type="button" onClick={() => editRecord(record)} className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-950" aria-label={`Edit ${record.title}`}>
                  <Edit3 className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => removeRecord(record.id)} className="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-950" aria-label={`Remove ${record.title}`}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
