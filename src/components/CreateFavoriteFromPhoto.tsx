"use client";

import type { TravelFavorite, TravelFavoriteType, TravelPhoto } from "@/lib/travel";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

interface CreateFavoriteFromPhotoProps {
  photo: TravelPhoto;
  onDone: () => void;
  onCancel: () => void;
  variant?: "light" | "dark";
}

export default function CreateFavoriteFromPhoto({ photo, onDone, onCancel, variant = "light" }: CreateFavoriteFromPhotoProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<TravelFavoriteType>("place");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isDark = variant === "dark";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    setError("");
    try {
      const favoriteData = new FormData();
      favoriteData.set("type", "favorite");
      favoriteData.set("country_id", photo.country_id);
      if (photo.state_id) favoriteData.set("state_id", photo.state_id);
      if (photo.trip_id) favoriteData.set("trip_id", photo.trip_id);
      favoriteData.set("favorite_type", type);
      favoriteData.set("name", name.trim());
      favoriteData.set("location_name", photo.location_name ?? "");
      if (photo.latitude !== null) favoriteData.set("latitude", String(photo.latitude));
      if (photo.longitude !== null) favoriteData.set("longitude", String(photo.longitude));
      favoriteData.set("sort_order", "0");

      const favoriteResponse = await fetch("/api/travel/items", { method: "POST", body: favoriteData });
      if (!favoriteResponse.ok) throw new Error("Could not create favorite");
      const { item: favorite } = (await favoriteResponse.json()) as { item: TravelFavorite };

      const linkResponse = await fetch("/api/travel/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "photo", id: photo.id, favorite_id: favorite.id }),
      });
      if (!linkResponse.ok) throw new Error("Could not link photo");

      router.refresh();
      onDone();
      window.dispatchEvent(new CustomEvent("travel:edit-item", { detail: { type: "favorite", item: favorite } }));
    } catch {
      setError("Could not save that. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className={`flex flex-wrap items-center gap-2 rounded-md p-2 ${isDark ? "bg-white/10" : "border border-slate-200 bg-slate-50"}`}>
      <select
        value={type}
        onChange={(event) => setType(event.target.value as TravelFavoriteType)}
        className={`rounded-md px-2 py-1.5 text-xs font-semibold outline-none ${isDark ? "bg-white/10 text-white" : "border border-slate-200 bg-white text-slate-700"}`}
      >
        <option value="restaurant">Restaurant</option>
        <option value="activity">Activity</option>
        <option value="place">Place</option>
      </select>
      <input
        autoFocus
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name this experience"
        className={`min-w-0 flex-1 rounded-md px-2 py-1.5 text-xs outline-none ${isDark ? "bg-white/10 text-white placeholder:text-white/50" : "border border-slate-200 bg-white text-slate-900"}`}
      />
      <button
        type="submit"
        disabled={isSaving || !name.trim()}
        className="rounded-md bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSaving ? "Saving..." : "Save"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className={`rounded-md px-2 py-1.5 text-xs font-semibold transition-colors ${isDark ? "text-white/70 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}
      >
        Cancel
      </button>
      {error ? (
        <p className="w-full text-xs text-red-400">{error}</p>
      ) : (
        <p className={`w-full text-xs ${isDark ? "text-white/50" : "text-slate-400"}`}>You can add more photos to it right after saving.</p>
      )}
    </form>
  );
}
