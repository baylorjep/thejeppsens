"use client";

import type { TravelFavorite, TravelPhoto, TravelTrip, TravelVideo } from "@/lib/travel";
import { AlertCircle, ArrowRight } from "lucide-react";

interface TravelDataNudgesProps {
  photos: TravelPhoto[];
  favorites: TravelFavorite[];
  trips: TravelTrip[];
  videos: TravelVideo[];
}

type EditorMode = "trip" | "photo" | "favorite" | "video";

function editItem(type: EditorMode, item: TravelTrip | TravelPhoto | TravelFavorite | TravelVideo) {
  window.dispatchEvent(new CustomEvent("travel:edit-item", { detail: { type, item } }));
}

export default function TravelDataNudges({ photos, favorites, trips, videos }: TravelDataNudgesProps) {
  const photosNeedingLocation = photos.filter((photo) => photo.location_name && (photo.latitude === null || photo.longitude === null));
  const favoritesNeedingCoordinates = favorites.filter((favorite) => favorite.latitude === null || favorite.longitude === null);
  const videosUnattached = videos.filter((video) => !video.trip_id);
  const tripIdsWithItems = new Set([
    ...photos.map((photo) => photo.trip_id).filter(Boolean),
    ...favorites.map((favorite) => favorite.trip_id).filter(Boolean),
    ...videos.map((video) => video.trip_id).filter(Boolean),
  ]);
  const tripsEmpty = trips.filter((trip) => !tripIdsWithItems.has(trip.id));

  const nudges = [
    photosNeedingLocation.length
      ? {
          key: "photos",
          label: `${photosNeedingLocation.length} photo${photosNeedingLocation.length === 1 ? "" : "s"} can be placed on the map.`,
          onClick: () => editItem("photo", photosNeedingLocation[0]),
        }
      : null,
    favoritesNeedingCoordinates.length
      ? {
          key: "favorites",
          label: `${favoritesNeedingCoordinates.length} favorite${favoritesNeedingCoordinates.length === 1 ? "" : "s"} need coordinates.`,
          onClick: () => editItem("favorite", favoritesNeedingCoordinates[0]),
        }
      : null,
    videosUnattached.length
      ? {
          key: "videos",
          label: `${videosUnattached.length} video${videosUnattached.length === 1 ? "" : "s"} can be attached to a trip.`,
          onClick: () => editItem("video", videosUnattached[0]),
        }
      : null,
    tripsEmpty.length
      ? {
          key: "trips",
          label: `${tripsEmpty.length} trip${tripsEmpty.length === 1 ? "" : "s"} could use photos, videos, or favorites.`,
          onClick: () => editItem("trip", tripsEmpty[0]),
        }
      : null,
  ].filter((nudge): nudge is { key: string; label: string; onClick: () => void } => Boolean(nudge));

  if (!nudges.length) return null;

  return (
    <section className="border-b border-slate-100 bg-amber-50/70">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 text-sm text-amber-900 sm:flex-row sm:items-center">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {nudges.map((nudge) => (
              <button
                key={nudge.key}
                type="button"
                onClick={nudge.onClick}
                className="inline-flex items-center gap-1 underline decoration-amber-500/50 decoration-dashed underline-offset-2 transition-colors hover:text-amber-950"
              >
                {nudge.label}
                <ArrowRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
