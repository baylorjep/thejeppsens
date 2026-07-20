"use client";

import CreateFavoriteFromPhoto from "@/components/CreateFavoriteFromPhoto";
import type { TravelFavorite, TravelPhoto, TravelTrip, TravelVideo } from "@/lib/travel";
import { ArrowRight, ChevronLeft, ChevronRight, Info, X } from "lucide-react";
import { useMemo, useState } from "react";

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
  const [isReviewingUnlinked, setIsReviewingUnlinked] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewedPhotoIds, setReviewedPhotoIds] = useState<Set<string>>(() => new Set());
  const photosNeedingLocation = photos.filter((photo) => photo.location_name && (photo.latitude === null || photo.longitude === null));
  const photosWithoutExperience = useMemo(
    () => photos.filter((photo) => !photo.favorite_id && !reviewedPhotoIds.has(photo.id)),
    [photos, reviewedPhotoIds],
  );
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
    photosWithoutExperience.length
      ? {
          key: "photo-experiences",
          label: `${photosWithoutExperience.length} photo${photosWithoutExperience.length === 1 ? "" : "s"} not linked to an experience.`,
          onClick: () => {
            setReviewIndex(0);
            setIsReviewingUnlinked(true);
          },
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

  const activeReviewPhoto = photosWithoutExperience[reviewIndex] ?? photosWithoutExperience[0] ?? null;

  const closeReview = () => {
    setIsReviewingUnlinked(false);
    setReviewIndex(0);
  };

  const moveReview = (direction: -1 | 1) => {
    if (!photosWithoutExperience.length) return;
    setReviewIndex((current) => (current + direction + photosWithoutExperience.length) % photosWithoutExperience.length);
  };

  const markReviewedAndAdvance = (photoId: string) => {
    setReviewedPhotoIds((current) => new Set(current).add(photoId));
    if (photosWithoutExperience.length <= 1) {
      closeReview();
      return;
    }
    setReviewIndex((current) => Math.min(current, photosWithoutExperience.length - 2));
  };

  return (
    <>
      <section className="border-b border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center">
            <Info className="h-4 w-4 shrink-0 text-teal-600" />
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {nudges.map((nudge) => (
                <button
                  key={nudge.key}
                  type="button"
                  onClick={nudge.onClick}
                  className="inline-flex items-center gap-1 underline decoration-teal-500/40 decoration-dashed underline-offset-2 transition-colors hover:text-slate-950"
                >
                  {nudge.label}
                  <ArrowRight className="h-3 w-3" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {isReviewingUnlinked && activeReviewPhoto && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 p-4" role="dialog" aria-modal="true" onClick={closeReview}>
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={closeReview}
              aria-label="Close review"
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeReviewPhoto.image_url} alt="" className="max-h-[52vh] w-full bg-slate-950 object-contain" />
            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">Unlinked photo</p>
                  <h3 className="mt-1 text-lg font-bold text-slate-950">{activeReviewPhoto.caption ?? activeReviewPhoto.location_name ?? "Travel photo"}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {[activeReviewPhoto.location_name, activeReviewPhoto.taken_on].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                  {reviewIndex + 1} / {photosWithoutExperience.length}
                </span>
              </div>

              <CreateFavoriteFromPhoto
                photo={activeReviewPhoto}
                favorites={favorites}
                photos={photos}
                onDone={() => markReviewedAndAdvance(activeReviewPhoto.id)}
                onCancel={closeReview}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => moveReview(-1)}
                    disabled={photosWithoutExperience.length <= 1}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => moveReview(1)}
                    disabled={photosWithoutExperience.length <= 1}
                    className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-300"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => markReviewedAndAdvance(activeReviewPhoto.id)}
                  className="rounded-md px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
                >
                  Skip for now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
