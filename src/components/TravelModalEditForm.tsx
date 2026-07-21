"use client";

import type { Country, TravelFavorite, TravelFavoriteType, TravelPhoto, TravelState } from "@/lib/travel";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

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

function stickyFooterClassName(variant: "light" | "dark") {
  return variant === "dark"
    ? "sticky bottom-0 -mx-3 -mb-3 flex flex-wrap gap-2 border-t border-white/10 bg-slate-950/95 px-3 py-3"
    : "sticky bottom-0 -mx-3 -mb-3 flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50/95 px-3 py-3";
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
    country_id: photo.country_id,
    state_id: photo.state_id ?? "",
    trip_id: photo.trip_id ?? "",
    favorite_id: photo.favorite_id ?? "",
    image_url: photo.image_url,
    image_hash: photo.image_hash ?? "",
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
  const [destinationCountries, setDestinationCountries] = useState<Country[]>([]);
  const [destinationStates, setDestinationStates] = useState<TravelState[]>([]);
  const selectedCountry = destinationCountries.find((country) => country.id === form.country_id);
  const selectedCountryIsUnitedStates = selectedCountry?.display_name === "United States" || selectedCountry?.geo_name === "United States";
  const destinationChanged = form.country_id !== photo.country_id || form.state_id !== (photo.state_id ?? "");

  useEffect(() => {
    const loadDestinations = async () => {
      try {
        const [countriesResponse, statesResponse] = await Promise.all([
          fetch("/api/travel/countries"),
          fetch("/api/travel/states"),
        ]);
        const countriesPayload = countriesResponse.ok ? await countriesResponse.json() : null;
        const statesPayload = statesResponse.ok ? await statesResponse.json() : null;
        if (Array.isArray(countriesPayload?.countries)) setDestinationCountries(countriesPayload.countries);
        if (Array.isArray(statesPayload?.states)) setDestinationStates(statesPayload.states);
      } catch {
        setDestinationCountries([]);
        setDestinationStates([]);
      }
    };

    void loadDestinations();
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("type", "photo");
      formData.set("id", photo.id);
      formData.set("country_id", form.country_id);
      if (form.state_id) formData.set("state_id", form.state_id);
      formData.set("trip_id", destinationChanged ? "" : form.trip_id);
      formData.set("favorite_id", destinationChanged ? "" : form.favorite_id);
      formData.set("image_url", form.image_url);
      formData.set("image_hash", form.image_hash);
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
    <form onSubmit={save} className={`grid max-h-[min(70vh,34rem)] gap-3 overflow-y-auto rounded-lg p-3 ${variant === "dark" ? "bg-white/10" : "border border-slate-200 bg-slate-50"}`}>
      <label className="space-y-1">
        <span className={`block text-xs font-semibold ${variant === "dark" ? "text-white/50" : "text-slate-500"}`}>Move to country</span>
        <select
          className={inputClassName(variant)}
          value={form.country_id}
          onChange={(event) => setForm({
            ...form,
            country_id: event.target.value,
            state_id: "",
            trip_id: "",
            favorite_id: "",
            is_featured: false,
          })}
        >
          {(destinationCountries.length ? destinationCountries : [{ id: photo.country_id, display_name: "Current country" } as Country]).map((country) => (
            <option key={country.id} value={country.id}>{country.display_name}</option>
          ))}
        </select>
      </label>
      {selectedCountryIsUnitedStates && (
        <label className="space-y-1">
          <span className={`block text-xs font-semibold ${variant === "dark" ? "text-white/50" : "text-slate-500"}`}>Move to state</span>
          <select
            className={inputClassName(variant)}
            value={form.state_id}
            onChange={(event) => setForm({
              ...form,
              state_id: event.target.value,
              trip_id: "",
              favorite_id: "",
              is_featured: false,
            })}
          >
            <option value="">United States country page</option>
            {destinationStates.map((state) => (
              <option key={state.id} value={state.id}>{state.state_name}</option>
            ))}
          </select>
        </label>
      )}
      {destinationChanged && (
        <p className={`rounded-md px-3 py-2 text-xs font-medium ${variant === "dark" ? "bg-amber-300/15 text-amber-100" : "border border-amber-200 bg-amber-50 text-amber-800"}`}>
          Saving will move this photo and clear its current trip/favorite link.
        </p>
      )}
      <select className={inputClassName(variant)} value={form.favorite_id} onChange={(event) => setForm({ ...form, favorite_id: event.target.value })} disabled={destinationChanged}>
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
      <div className={stickyFooterClassName(variant)}>
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
    address: favorite.address ?? "",
    cuisine: favorite.cuisine ?? "",
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
      formData.set("address", form.address);
      formData.set("cuisine", form.cuisine);
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
        <option value="restaurant">Food</option>
        <option value="activity">Activity</option>
        <option value="place">Place</option>
      </select>
      <input className={inputClassName(variant)} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Name" required />
      {form.type === "restaurant" && (
        <input className={inputClassName(variant)} value={form.cuisine} onChange={(event) => setForm({ ...form, cuisine: event.target.value })} placeholder="Cuisine (Mexican, burgers, pizza)" />
      )}
      <input className={inputClassName(variant)} value={form.location_name} onChange={(event) => setForm({ ...form, location_name: event.target.value })} placeholder="City or area" />
      <input className={inputClassName(variant)} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Street address or Maps-friendly address" />
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
