"use client";

import type { TravelFavorite, TravelFavoriteType, TravelPhoto } from "@/lib/travel";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

function inputClassName(variant: "light" | "dark") {
  return variant === "dark"
    ? "w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/50"
    : "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900";
}

function buttonClassName(variant: "light" | "dark", tone: "primary" | "secondary" = "primary") {
  if (tone === "secondary") {
    return variant === "dark"
      ? "rounded-md px-3 py-2 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
      : "rounded-md px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950";
  }

  return "rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300";
}

interface TravelPhotoModalEditFormProps {
  photo: TravelPhoto;
  favorites: TravelFavorite[];
  variant?: "light" | "dark";
  onDone: () => void;
  onCancel: () => void;
}

export function TravelPhotoModalEditForm({ photo, favorites, variant = "light", onDone, onCancel }: TravelPhotoModalEditFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    trip_id: photo.trip_id ?? "",
    favorite_id: photo.favorite_id ?? "",
    image_url: photo.image_url,
    caption: photo.caption ?? "",
    location_name: photo.location_name ?? "",
    latitude: photo.latitude?.toString() ?? "",
    longitude: photo.longitude?.toString() ?? "",
    taken_on: photo.taken_on ?? "",
    sort_order: String(photo.sort_order),
    is_featured: Boolean(photo.is_featured),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("type", "photo");
      formData.set("id", photo.id);
      formData.set("country_id", photo.country_id);
      if (photo.state_id) formData.set("state_id", photo.state_id);
      formData.set("trip_id", form.trip_id);
      formData.set("favorite_id", form.favorite_id);
      formData.set("image_url", form.image_url);
      formData.set("caption", form.caption);
      formData.set("location_name", form.location_name);
      formData.set("latitude", form.latitude);
      formData.set("longitude", form.longitude);
      formData.set("taken_on", form.taken_on);
      formData.set("sort_order", form.sort_order);
      formData.set("is_featured", String(form.is_featured));

      const response = await fetch("/api/travel/items", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Save failed");
      router.refresh();
      onDone();
    } catch {
      setError("Could not save that photo.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={save} className={`grid gap-3 rounded-lg p-3 ${variant === "dark" ? "bg-white/10" : "border border-slate-200 bg-slate-50"}`}>
      <select className={inputClassName(variant)} value={form.favorite_id} onChange={(event) => setForm({ ...form, favorite_id: event.target.value })}>
        <option value="">Not linked to a favorite</option>
        {favorites.map((favorite) => (
          <option key={favorite.id} value={favorite.id}>
            {favorite.type}: {favorite.name}
          </option>
        ))}
      </select>
      <input className={inputClassName(variant)} value={form.caption} onChange={(event) => setForm({ ...form, caption: event.target.value })} placeholder="Caption" />
      <input className={inputClassName(variant)} value={form.location_name} onChange={(event) => setForm({ ...form, location_name: event.target.value })} placeholder="Location" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputClassName(variant)} value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} placeholder="Latitude" />
        <input className={inputClassName(variant)} value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} placeholder="Longitude" />
      </div>
      <input className={inputClassName(variant)} type="date" value={form.taken_on} onChange={(event) => setForm({ ...form, taken_on: event.target.value })} />
      <label className={`inline-flex items-center gap-2 text-sm ${variant === "dark" ? "text-white/70" : "text-slate-600"}`}>
        <input type="checkbox" checked={form.is_featured} onChange={(event) => setForm({ ...form, is_featured: event.target.checked })} />
        Featured photo for this page
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={isSaving} className={buttonClassName(variant)}>
          {isSaving ? "Saving..." : "Save photo"}
        </button>
        <button type="button" onClick={onCancel} className={buttonClassName(variant, "secondary")}>
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}

interface TravelFavoriteModalEditFormProps {
  favorite: TravelFavorite;
  variant?: "light" | "dark";
  onDone: () => void;
  onCancel: () => void;
}

export function TravelFavoriteModalEditForm({ favorite, variant = "light", onDone, onCancel }: TravelFavoriteModalEditFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    trip_id: favorite.trip_id ?? "",
    type: favorite.type,
    name: favorite.name,
    location_name: favorite.location_name ?? "",
    latitude: favorite.latitude?.toString() ?? "",
    longitude: favorite.longitude?.toString() ?? "",
    notes: favorite.notes ?? "",
    sort_order: String(favorite.sort_order),
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setIsSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("type", "favorite");
      formData.set("id", favorite.id);
      formData.set("country_id", favorite.country_id);
      if (favorite.state_id) formData.set("state_id", favorite.state_id);
      formData.set("trip_id", form.trip_id);
      formData.set("favorite_type", form.type);
      formData.set("name", form.name);
      formData.set("location_name", form.location_name);
      formData.set("latitude", form.latitude);
      formData.set("longitude", form.longitude);
      formData.set("notes", form.notes);
      formData.set("sort_order", form.sort_order);

      const response = await fetch("/api/travel/items", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Save failed");
      router.refresh();
      onDone();
    } catch {
      setError("Could not save that favorite.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={save} className={`grid gap-3 rounded-lg p-3 ${variant === "dark" ? "bg-white/10" : "border border-slate-200 bg-slate-50"}`}>
      <select className={inputClassName(variant)} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as TravelFavoriteType })}>
        <option value="restaurant">Restaurant</option>
        <option value="activity">Activity</option>
        <option value="place">Place</option>
      </select>
      <input className={inputClassName(variant)} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" required />
      <input className={inputClassName(variant)} value={form.location_name} onChange={(event) => setForm({ ...form, location_name: event.target.value })} placeholder="City or area" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className={inputClassName(variant)} value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} placeholder="Latitude" />
        <input className={inputClassName(variant)} value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} placeholder="Longitude" />
      </div>
      <textarea className={inputClassName(variant)} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Notes" rows={3} />
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={isSaving || !form.name.trim()} className={buttonClassName(variant)}>
          {isSaving ? "Saving..." : "Save favorite"}
        </button>
        <button type="button" onClick={onCancel} className={buttonClassName(variant, "secondary")}>
          Cancel
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
