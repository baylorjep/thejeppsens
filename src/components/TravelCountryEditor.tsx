"use client";

import { optimizeImageFile } from "@/lib/vinylImage";
import type { Country, TravelFavorite, TravelFavoriteType, TravelPhoto, TravelState, TravelTrip } from "@/lib/travel";
import { Edit3, ImagePlus, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type EditorMode = "trip" | "photo" | "favorite";

interface TravelCountryEditorProps {
  country: Country;
  state?: TravelState;
  trips: TravelTrip[];
  photos: TravelPhoto[];
  favorites: TravelFavorite[];
}

const emptyTrip = {
  id: "",
  title: "",
  location_name: "",
  started_on: "",
  ended_on: "",
  notes: "",
  baylor_went: true,
  isabel_went: true,
};

const emptyPhoto = {
  id: "",
  trip_id: "",
  image_url: "",
  caption: "",
  location_name: "",
  taken_on: "",
  sort_order: "0",
};

const emptyFavorite = {
  id: "",
  trip_id: "",
  type: "restaurant" as TravelFavoriteType,
  name: "",
  location_name: "",
  latitude: "",
  longitude: "",
  notes: "",
  sort_order: "0",
};

function imageToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

function inputClassName() {
  return "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900";
}

export default function TravelCountryEditor({ country, state, trips, photos, favorites }: TravelCountryEditorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<EditorMode>("trip");
  const [tripForm, setTripForm] = useState(emptyTrip);
  const [photoForm, setPhotoForm] = useState(emptyPhoto);
  const [favoriteForm, setFavoriteForm] = useState(emptyFavorite);
  const [photoFile, setPhotoFile] = useState<File | undefined>();
  const [photoPreview, setPhotoPreview] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const restaurants = useMemo(() => favorites.filter((favorite) => favorite.type === "restaurant"), [favorites]);
  const activities = useMemo(() => favorites.filter((favorite) => favorite.type === "activity"), [favorites]);
  const places = useMemo(() => favorites.filter((favorite) => favorite.type === "place"), [favorites]);

  const resetForms = () => {
    setTripForm(emptyTrip);
    setPhotoForm(emptyPhoto);
    setFavoriteForm(emptyFavorite);
    setPhotoFile(undefined);
    setPhotoPreview("");
  };

  const handlePhotoChange = async (file?: File) => {
    if (!file) return;

    try {
      const optimizedFile = await optimizeImageFile(file, 1600, 0.76);
      setPhotoFile(optimizedFile);
      setPhotoPreview(await imageToDataUrl(optimizedFile));
      setMessage("Photo optimized.");
    } catch {
      setMessage("Could not load that photo.");
    }
  };

  const submitFormData = async (formData: FormData) => {
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/travel/items", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Save failed");

      resetForms();
      setMessage("Saved.");
      router.refresh();
    } catch {
      setMessage("Could not save.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveTrip = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set("type", "trip");
    formData.set("country_id", country.id);
    if (state) formData.set("state_id", state.id);
    if (tripForm.id) formData.set("id", tripForm.id);
    formData.set("title", tripForm.title);
    formData.set("location_name", tripForm.location_name);
    formData.set("started_on", tripForm.started_on);
    formData.set("ended_on", tripForm.ended_on);
    formData.set("notes", tripForm.notes);
    formData.set("baylor_went", String(tripForm.baylor_went));
    formData.set("isabel_went", String(tripForm.isabel_went));
    await submitFormData(formData);
  };

  const savePhoto = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set("type", "photo");
    formData.set("country_id", country.id);
    if (state) formData.set("state_id", state.id);
    if (photoForm.id) formData.set("id", photoForm.id);
    formData.set("trip_id", photoForm.trip_id);
    formData.set("image_url", photoForm.image_url);
    formData.set("caption", photoForm.caption);
    formData.set("location_name", photoForm.location_name);
    formData.set("taken_on", photoForm.taken_on);
    formData.set("sort_order", photoForm.sort_order);
    if (photoFile) formData.set("image", photoFile);
    await submitFormData(formData);
  };

  const saveFavorite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData();
    formData.set("type", "favorite");
    formData.set("country_id", country.id);
    if (state) formData.set("state_id", state.id);
    if (favoriteForm.id) formData.set("id", favoriteForm.id);
    formData.set("trip_id", favoriteForm.trip_id);
    formData.set("favorite_type", favoriteForm.type);
    formData.set("name", favoriteForm.name);
    formData.set("location_name", favoriteForm.location_name);
    formData.set("latitude", favoriteForm.latitude);
    formData.set("longitude", favoriteForm.longitude);
    formData.set("notes", favoriteForm.notes);
    formData.set("sort_order", favoriteForm.sort_order);
    await submitFormData(formData);
  };

  const deleteItem = async (type: EditorMode, id: string) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      const response = await fetch(`/api/travel/items?type=${type}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      setMessage("Deleted.");
      router.refresh();
    } catch {
      setMessage("Could not delete.");
    }
  };

  const editTrip = (trip: TravelTrip) => {
    setMode("trip");
    setIsOpen(true);
    setTripForm({
      id: trip.id,
      title: trip.title,
      location_name: trip.location_name ?? "",
      started_on: trip.started_on ?? "",
      ended_on: trip.ended_on ?? "",
      notes: trip.notes ?? "",
      baylor_went: trip.baylor_went,
      isabel_went: trip.isabel_went,
    });
  };

  const editPhoto = (photo: TravelPhoto) => {
    setMode("photo");
    setIsOpen(true);
    setPhotoForm({
      id: photo.id,
      trip_id: photo.trip_id ?? "",
      image_url: photo.image_url,
      caption: photo.caption ?? "",
      location_name: photo.location_name ?? "",
      taken_on: photo.taken_on ?? "",
      sort_order: String(photo.sort_order),
    });
    setPhotoPreview(photo.image_url);
    setPhotoFile(undefined);
  };

  const editFavorite = (favorite: TravelFavorite) => {
    setMode("favorite");
    setIsOpen(true);
    setFavoriteForm({
      id: favorite.id,
      trip_id: favorite.trip_id ?? "",
      type: favorite.type,
      name: favorite.name,
      location_name: favorite.location_name ?? "",
      latitude: favorite.latitude?.toString() ?? "",
      longitude: favorite.longitude?.toString() ?? "",
      notes: favorite.notes ?? "",
      sort_order: String(favorite.sort_order),
    });
  };

  return (
    <section className="border-t border-slate-100 bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
              <h2 className="text-lg font-bold text-slate-950">Edit Travel Log</h2>
              <p className="text-sm text-slate-500">Add trips, photos, restaurants, activities, and locations.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForms();
              setIsOpen((current) => !current);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {isOpen ? "Close" : "Add item"}
          </button>
        </div>

        {message && <p className="mb-4 text-sm text-slate-500">{message}</p>}

        {isOpen && (
          <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                ["trip", "Trip"],
                ["photo", "Photo"],
                ["favorite", "Favorite"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value as EditorMode)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                    mode === value ? "bg-slate-950 text-white" : "bg-white text-slate-600 hover:text-slate-950"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === "trip" && (
              <form onSubmit={saveTrip} className="grid gap-3 md:grid-cols-2">
                <input className={inputClassName()} value={tripForm.title} onChange={(e) => setTripForm({ ...tripForm, title: e.target.value })} placeholder="Trip title" required />
                <input className={inputClassName()} value={tripForm.location_name} onChange={(e) => setTripForm({ ...tripForm, location_name: e.target.value })} placeholder="City or area" />
                <input className={inputClassName()} type="date" value={tripForm.started_on} onChange={(e) => setTripForm({ ...tripForm, started_on: e.target.value })} />
                <input className={inputClassName()} type="date" value={tripForm.ended_on} onChange={(e) => setTripForm({ ...tripForm, ended_on: e.target.value })} />
                <textarea className={`${inputClassName()} md:col-span-2`} value={tripForm.notes} onChange={(e) => setTripForm({ ...tripForm, notes: e.target.value })} placeholder="Notes" rows={3} />
                <div className="flex gap-4 text-sm text-slate-600">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={tripForm.baylor_went} onChange={(e) => setTripForm({ ...tripForm, baylor_went: e.target.checked })} />Baylor</label>
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={tripForm.isabel_went} onChange={(e) => setTripForm({ ...tripForm, isabel_went: e.target.checked })} />Isabel</label>
                </div>
                <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300" disabled={isSaving}>{isSaving ? "Saving..." : "Save trip"}</button>
              </form>
            )}

            {mode === "photo" && (
              <form onSubmit={savePhoto} className="grid gap-3 md:grid-cols-2">
                <select className={inputClassName()} value={photoForm.trip_id} onChange={(e) => setPhotoForm({ ...photoForm, trip_id: e.target.value })}>
                  <option value="">No trip</option>
                  {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
                </select>
                <input className={inputClassName()} type="date" value={photoForm.taken_on} onChange={(e) => setPhotoForm({ ...photoForm, taken_on: e.target.value })} />
                <input className={inputClassName()} value={photoForm.caption} onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })} placeholder="Caption" />
                <input className={inputClassName()} value={photoForm.location_name} onChange={(e) => setPhotoForm({ ...photoForm, location_name: e.target.value })} placeholder="Location" />
                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500 md:col-span-2">
                  <ImagePlus className="mb-2 h-5 w-5" />
                  Upload optimized photo
                  <input type="file" accept="image/*" onChange={(event) => handlePhotoChange(event.target.files?.[0])} className="sr-only" />
                </label>
                {photoPreview && (
                  <div className="md:col-span-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreview} alt="" className="h-48 w-full rounded-lg object-cover" />
                  </div>
                )}
                <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300" disabled={isSaving}>{isSaving ? "Saving..." : "Save photo"}</button>
              </form>
            )}

            {mode === "favorite" && (
              <form onSubmit={saveFavorite} className="grid gap-3 md:grid-cols-2">
                <select className={inputClassName()} value={favoriteForm.type} onChange={(e) => setFavoriteForm({ ...favoriteForm, type: e.target.value as TravelFavoriteType })}>
                  <option value="restaurant">Restaurant</option>
                  <option value="activity">Activity</option>
                  <option value="place">Location</option>
                </select>
                <select className={inputClassName()} value={favoriteForm.trip_id} onChange={(e) => setFavoriteForm({ ...favoriteForm, trip_id: e.target.value })}>
                  <option value="">No trip</option>
                  {trips.map((trip) => <option key={trip.id} value={trip.id}>{trip.title}</option>)}
                </select>
                <input className={inputClassName()} value={favoriteForm.name} onChange={(e) => setFavoriteForm({ ...favoriteForm, name: e.target.value })} placeholder="Name" required />
                <input className={inputClassName()} value={favoriteForm.location_name} onChange={(e) => setFavoriteForm({ ...favoriteForm, location_name: e.target.value })} placeholder="City or area" />
                <input className={inputClassName()} value={favoriteForm.latitude} onChange={(e) => setFavoriteForm({ ...favoriteForm, latitude: e.target.value })} placeholder="Latitude" />
                <input className={inputClassName()} value={favoriteForm.longitude} onChange={(e) => setFavoriteForm({ ...favoriteForm, longitude: e.target.value })} placeholder="Longitude" />
                <textarea className={`${inputClassName()} md:col-span-2`} value={favoriteForm.notes} onChange={(e) => setFavoriteForm({ ...favoriteForm, notes: e.target.value })} placeholder="Notes" rows={3} />
                <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-300" disabled={isSaving}>{isSaving ? "Saving..." : "Save favorite"}</button>
              </form>
            )}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-3">
          <ItemList title="Trips" items={trips.map((trip) => ({ id: trip.id, title: trip.title, detail: trip.location_name ?? state?.state_name ?? country.display_name, onEdit: () => editTrip(trip), onDelete: () => deleteItem("trip", trip.id) }))} />
          <ItemList title="Photos" items={photos.map((photo) => ({ id: photo.id, title: photo.caption ?? photo.location_name ?? "Photo", detail: photo.taken_on ?? state?.state_name ?? country.display_name, onEdit: () => editPhoto(photo), onDelete: () => deleteItem("photo", photo.id) }))} />
          <ItemList
            title="Favorites"
            items={[...restaurants, ...activities, ...places].map((favorite) => ({
              id: favorite.id,
              title: favorite.name,
              detail: `${favorite.type}${favorite.location_name ? ` · ${favorite.location_name}` : ""}`,
              onEdit: () => editFavorite(favorite),
              onDelete: () => deleteItem("favorite", favorite.id),
            }))}
          />
        </div>
      </div>
    </section>
  );
}

function ItemList({
  title,
  items,
}: {
  title: string;
  items: { id: string; title: string; detail: string; onEdit: () => void; onDelete: () => void }[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-bold text-slate-950">{title}</h3>
      {items.length ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500">{item.detail}</p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={item.onEdit}
                  aria-label={`Edit ${item.title}`}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-slate-950"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={item.onDelete}
                  aria-label={`Delete ${item.title}`}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-white hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">Nothing yet.</p>
      )}
    </div>
  );
}
