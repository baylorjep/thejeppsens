import type { TravelFavorite, TravelPhoto, TravelTrip, TravelVideo } from "@/lib/travel";
import { AlertCircle } from "lucide-react";

interface TravelDataNudgesProps {
  photos: TravelPhoto[];
  favorites: TravelFavorite[];
  trips: TravelTrip[];
  videos: TravelVideo[];
}

export default function TravelDataNudges({ photos, favorites, trips, videos }: TravelDataNudgesProps) {
  const photoNeedsLocation = photos.filter((photo) => photo.location_name && (photo.latitude === null || photo.longitude === null)).length;
  const favoriteNeedsCoordinates = favorites.filter((favorite) => favorite.latitude === null || favorite.longitude === null).length;
  const unattachedVideos = videos.filter((video) => !video.trip_id).length;
  const tripIdsWithItems = new Set([
    ...photos.map((photo) => photo.trip_id).filter(Boolean),
    ...favorites.map((favorite) => favorite.trip_id).filter(Boolean),
    ...videos.map((video) => video.trip_id).filter(Boolean),
  ]);
  const emptyTrips = trips.filter((trip) => !tripIdsWithItems.has(trip.id)).length;

  const nudges = [
    photoNeedsLocation ? `${photoNeedsLocation} photo${photoNeedsLocation === 1 ? "" : "s"} can be placed on the map.` : "",
    favoriteNeedsCoordinates ? `${favoriteNeedsCoordinates} favorite${favoriteNeedsCoordinates === 1 ? "" : "s"} need coordinates.` : "",
    unattachedVideos ? `${unattachedVideos} video${unattachedVideos === 1 ? "" : "s"} can be attached to a trip.` : "",
    emptyTrips ? `${emptyTrips} trip${emptyTrips === 1 ? "" : "s"} could use photos, videos, or favorites.` : "",
  ].filter(Boolean);

  if (!nudges.length) return null;

  return (
    <section className="border-b border-slate-100 bg-amber-50/70">
      <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-2 text-sm text-amber-900 sm:flex-row sm:items-center">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {nudges.map((nudge) => (
              <span key={nudge}>{nudge}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
