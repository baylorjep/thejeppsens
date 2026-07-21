"use client";

import { travelFavoriteLocationMapsUrl, type TravelFavorite, type TravelFavoriteLocation } from "@/lib/travel";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

interface TravelFavoriteLocationsProps {
  favorite: TravelFavorite;
  variant?: "light" | "dark";
}

function inputClassName(variant: "light" | "dark") {
  return variant === "dark"
    ? "w-full rounded-md border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/50"
    : "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900";
}

function buttonClassName(variant: "light" | "dark", tone: "primary" | "secondary" | "danger" = "secondary") {
  if (tone === "primary") return "rounded-md bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300";
  if (tone === "danger") {
    return variant === "dark"
      ? "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/20"
      : "inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50";
  }
  return variant === "dark"
    ? "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
    : "inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-950";
}

export default function TravelFavoriteLocations({ favorite, variant = "light" }: TravelFavoriteLocationsProps) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    location_name: "",
    address: "",
    latitude: "",
    longitude: "",
    notes: "",
  });
  const locations = favorite.locations ?? [];
  const isDark = variant === "dark";

  const resetForm = () => {
    setForm({ name: "", location_name: "", address: "", latitude: "", longitude: "", notes: "" });
    setError("");
  };

  const saveLocation = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() && !form.location_name.trim() && !form.address.trim()) return;
    setIsSaving(true);
    setError("");

    try {
      const formData = new FormData();
      formData.set("type", "favorite_location");
      formData.set("favorite_id", favorite.id);
      formData.set("country_id", favorite.country_id);
      if (favorite.state_id) formData.set("state_id", favorite.state_id);
      formData.set("name", form.name);
      formData.set("location_name", form.location_name);
      formData.set("address", form.address);
      formData.set("latitude", form.latitude);
      formData.set("longitude", form.longitude);
      formData.set("notes", form.notes);
      formData.set("sort_order", String(locations.length));

      const response = await fetch("/api/travel/items", { method: "POST", body: formData });
      if (!response.ok) throw new Error("Save failed");
      resetForm();
      setIsAdding(false);
      router.refresh();
    } catch {
      setError("Could not save that location.");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLocation = async (location: TravelFavoriteLocation) => {
    if (!window.confirm("Delete this saved location?")) return;
    setDeletingId(location.id);
    try {
      const response = await fetch(`/api/travel/items?type=favorite_location&id=${encodeURIComponent(location.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      router.refresh();
    } catch {
      window.alert("Could not delete that location.");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className={`space-y-3 rounded-lg p-3 ${isDark ? "bg-white/10" : "border border-slate-200 bg-slate-50"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? "text-white/50" : "text-slate-500"}`}>Locations</p>
          <p className={`text-sm ${isDark ? "text-white/70" : "text-slate-600"}`}>
            {locations.length ? `${locations.length} saved ${locations.length === 1 ? "location" : "locations"}` : "No extra locations yet."}
          </p>
        </div>
        <button type="button" onClick={() => setIsAdding((current) => !current)} className={buttonClassName(variant)}>
          <Plus className="h-3.5 w-3.5" />
          {isAdding ? "Close" : "Add location"}
        </button>
      </div>

      {locations.length > 0 && (
        <div className="space-y-2">
          {locations.map((location) => {
            const mapsUrl = travelFavoriteLocationMapsUrl(location);
            return (
              <div key={location.id} className={`rounded-md p-3 ${isDark ? "bg-slate-950/30" : "bg-white ring-1 ring-slate-200"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{location.name || location.location_name || "Location"}</p>
                    {location.location_name && location.name && <p className={`text-xs ${isDark ? "text-white/50" : "text-slate-500"}`}>{location.location_name}</p>}
                    {location.address && <p className={`mt-1 text-xs ${isDark ? "text-white/60" : "text-slate-600"}`}>{location.address}</p>}
                    {location.notes && <p className={`mt-1 text-xs ${isDark ? "text-white/60" : "text-slate-600"}`}>{location.notes}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {mapsUrl && (
                      <a href={mapsUrl} target="_blank" rel="noreferrer" className={buttonClassName(variant)} title="Open in Maps">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <button type="button" onClick={() => void deleteLocation(location)} disabled={deletingId === location.id} className={buttonClassName(variant, "danger")}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isAdding && (
        <form onSubmit={saveLocation} className="grid gap-2">
          <input className={inputClassName(variant)} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Location name, like Downtown or Airport" />
          <input className={inputClassName(variant)} value={form.location_name} onChange={(event) => setForm({ ...form, location_name: event.target.value })} placeholder="City or area" />
          <input className={inputClassName(variant)} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="Street address or Maps-friendly address" />
          <div className="grid gap-2 sm:grid-cols-2">
            <input className={inputClassName(variant)} value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} placeholder="Latitude" />
            <input className={inputClassName(variant)} value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} placeholder="Longitude" />
          </div>
          <textarea className={inputClassName(variant)} value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Notes" rows={2} />
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={isSaving || (!form.name.trim() && !form.location_name.trim() && !form.address.trim())} className={buttonClassName(variant, "primary")}>
              {isSaving ? "Saving..." : "Save location"}
            </button>
            <button type="button" onClick={() => { resetForm(); setIsAdding(false); }} className={buttonClassName(variant)}>
              Cancel
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </form>
      )}
    </div>
  );
}
