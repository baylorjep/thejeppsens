"use client";

import type { TravelFavorite, TravelFavoriteType, TravelPhoto } from "@/lib/travel";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

interface CreateFavoriteFromPhotoProps {
  photo: TravelPhoto;
  favorites?: TravelFavorite[];
  photos?: TravelPhoto[];
  onDone: () => void;
  onCancel: () => void;
  variant?: "light" | "dark";
}

function distanceInMeters(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const earthRadiusMeters = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const latDelta = toRadians(b.latitude - a.latitude);
  const lonDelta = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(lonDelta / 2) ** 2;
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export default function CreateFavoriteFromPhoto({ photo, favorites = [], photos = [], onDone, onCancel, variant = "light" }: CreateFavoriteFromPhotoProps) {
  const router = useRouter();
  const sortedFavorites = useMemo(() => {
    if (photo.latitude === null || photo.longitude === null) return favorites;
    const photoPoint = { latitude: photo.latitude, longitude: photo.longitude };

    return favorites
      .map((favorite) => {
        const candidatePoints = [
          favorite.latitude !== null && favorite.longitude !== null
            ? { latitude: favorite.latitude, longitude: favorite.longitude }
            : null,
          ...photos
            .filter((linkedPhoto) => linkedPhoto.id !== photo.id && linkedPhoto.favorite_id === favorite.id && linkedPhoto.latitude !== null && linkedPhoto.longitude !== null)
            .map((linkedPhoto) => ({ latitude: linkedPhoto.latitude as number, longitude: linkedPhoto.longitude as number })),
        ].filter((point): point is { latitude: number; longitude: number } => Boolean(point));

        const nearestDistance = candidatePoints.length
          ? Math.min(...candidatePoints.map((point) => distanceInMeters(photoPoint, point)))
          : Number.POSITIVE_INFINITY;

        return { favorite, nearestDistance };
      })
      .sort((a, b) => a.nearestDistance - b.nearestDistance || a.favorite.name.localeCompare(b.favorite.name))
      .map(({ favorite }) => favorite);
  }, [favorites, photo.id, photo.latitude, photo.longitude, photos]);
  const [mode, setMode] = useState<"existing" | "new">(sortedFavorites.length ? "existing" : "new");
  const [favoriteId, setFavoriteId] = useState(sortedFavorites[0]?.id ?? "");
  const [name, setName] = useState("");
  const [type, setType] = useState<TravelFavoriteType>("place");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const isDark = variant === "dark";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (mode === "new" && !name.trim()) return;
    if (mode === "existing" && !favoriteId) return;

    setIsSaving(true);
    setError("");
    try {
      if (mode === "existing") {
        const linkResponse = await fetch("/api/travel/items", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "photo", id: photo.id, favorite_id: favoriteId }),
        });
        if (!linkResponse.ok) throw new Error("Could not link photo");

        router.refresh();
        onDone();
        return;
      }

      const favoriteData = new FormData();
      favoriteData.set("type", "favorite");
      favoriteData.set("country_id", photo.country_id);
      if (photo.state_id) favoriteData.set("state_id", photo.state_id);
      if (photo.trip_id) favoriteData.set("trip_id", photo.trip_id);
      favoriteData.set("favorite_type", type);
      favoriteData.set("name", name.trim());
      favoriteData.set("location_name", photo.location_name ?? "");
      favoriteData.set("address", "");
      favoriteData.set("cuisine", "");
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
      {favorites.length > 0 && (
        <div className={`flex rounded-md p-0.5 text-xs font-semibold ${isDark ? "bg-white/10" : "bg-white ring-1 ring-slate-200"}`}>
          {[
            ["existing", "Existing"],
            ["new", "New"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value as "existing" | "new")}
              className={`rounded px-2 py-1 transition-colors ${
                mode === value
                  ? isDark
                    ? "bg-white text-slate-950"
                    : "bg-slate-950 text-white"
                  : isDark
                    ? "text-white/70 hover:text-white"
                    : "text-slate-500 hover:text-slate-950"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      {mode === "existing" && sortedFavorites.length > 0 ? (
        <select
          autoFocus
          value={favoriteId}
          onChange={(event) => setFavoriteId(event.target.value)}
          className={`min-w-0 flex-1 rounded-md px-2 py-1.5 text-xs font-semibold outline-none ${isDark ? "bg-white/10 text-white" : "border border-slate-200 bg-white text-slate-700"}`}
        >
          {sortedFavorites.map((favorite) => (
            <option key={favorite.id} value={favorite.id}>
              {favorite.type}: {favorite.name}
            </option>
          ))}
        </select>
      ) : (
        <>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as TravelFavoriteType)}
            className={`rounded-md px-2 py-1.5 text-xs font-semibold outline-none ${isDark ? "bg-white/10 text-white" : "border border-slate-200 bg-white text-slate-700"}`}
          >
            <option value="restaurant">Food</option>
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
        </>
      )}
      <button
        type="submit"
        disabled={isSaving || (mode === "new" ? !name.trim() : !favoriteId)}
        className="rounded-md bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSaving ? "Saving..." : mode === "existing" ? "Link" : "Save"}
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
        <p className={`w-full text-xs ${isDark ? "text-white/50" : "text-slate-400"}`}>
          {mode === "existing" ? "This photo will be attached to the selected experience." : "You can add more photos to it right after saving."}
        </p>
      )}
    </form>
  );
}
