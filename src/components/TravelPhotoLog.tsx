"use client";

import type { TravelFavorite, TravelPhoto } from "@/lib/travel";
import { Camera, ChevronLeft, ChevronRight, Plus, Star, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import CreateFavoriteFromPhoto from "@/components/CreateFavoriteFromPhoto";
import TravelEditButton from "@/components/TravelEditButton";
import { TravelPhotoModalEditForm } from "@/components/TravelModalEditForm";
import TravelQuickAddButton from "@/components/TravelQuickAddButton";

const AUTO_ADVANCE_MS = 5000;
const RESUME_AFTER_MS = 10000;
const SWIPE_THRESHOLD = 45;

interface TravelPhotoLogProps {
  photos: TravelPhoto[];
  favorites: TravelFavorite[];
  fallbackName: string;
}

function useSwipe(onSwipe: (direction: -1 | 1) => void) {
  const startX = useRef<number | null>(null);
  return {
    onTouchStart: (event: TouchEvent) => {
      startX.current = event.changedTouches[0]?.clientX ?? null;
    },
    onTouchEnd: (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      if (!touch || startX.current === null) return;
      const distance = touch.clientX - startX.current;
      startX.current = null;
      if (Math.abs(distance) < SWIPE_THRESHOLD) return;
      onSwipe(distance > 0 ? -1 : 1);
    },
  };
}

export default function TravelPhotoLog({ photos, favorites, fallbackName }: TravelPhotoLogProps) {
  const router = useRouter();
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set());
  const [reviewDeletingId, setReviewDeletingId] = useState("");
  const [featuringId, setFeaturingId] = useState("");
  const resumeTimer = useRef<number | null>(null);

  const visiblePhotos = useMemo(() => photos.filter((photo) => !deletedIds.has(photo.id)), [deletedIds, photos]);
  const currentPhoto = visiblePhotos[carouselIndex] ?? null;
  const activePhoto = activeIndex === null ? null : visiblePhotos[activeIndex] ?? null;
  const reviewPhoto = isReviewing ? visiblePhotos[reviewIndex] ?? null : null;
  const activeFavorite = activePhoto?.favorite_id ? favorites.find((favorite) => favorite.id === activePhoto.favorite_id) ?? null : null;
  const reviewFavorite = reviewPhoto?.favorite_id ? favorites.find((favorite) => favorite.id === reviewPhoto.favorite_id) ?? null : null;
  const modalSubtitle = activePhoto
    ? [activePhoto.caption ? activePhoto.location_name : null, activePhoto.taken_on].filter(Boolean).join(" · ")
    : "";
  const reviewSubtitle = reviewPhoto
    ? [reviewPhoto.caption ? reviewPhoto.location_name : null, reviewPhoto.taken_on].filter(Boolean).join(" · ")
    : "";

  useEffect(() => {
    if (carouselIndex >= visiblePhotos.length) setCarouselIndex(0);
  }, [visiblePhotos.length, carouselIndex]);

  useEffect(() => {
    if (reviewIndex >= visiblePhotos.length) setReviewIndex(Math.max(visiblePhotos.length - 1, 0));
  }, [visiblePhotos.length, reviewIndex]);

  useEffect(() => {
    setIsAddingFavorite(false);
    setIsEditingPhoto(false);
  }, [activeIndex]);

  useEffect(() => {
    if (visiblePhotos.length <= 1 || isPaused || activeIndex !== null || isReviewing) return;
    const timer = window.setInterval(() => {
      setCarouselIndex((current) => (current + 1) % visiblePhotos.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [visiblePhotos.length, isPaused, activeIndex, isReviewing]);

  useEffect(() => {
    return () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    };
  }, []);

  const pauseThenResume = () => {
    setIsPaused(true);
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setIsPaused(false), RESUME_AFTER_MS);
  };

  const moveCarousel = (direction: -1 | 1) => {
    if (!visiblePhotos.length) return;
    setCarouselIndex((current) => (current + direction + visiblePhotos.length) % visiblePhotos.length);
    pauseThenResume();
  };

  const move = (direction: -1 | 1) => {
    if (activeIndex === null || !visiblePhotos.length) return;
    setActiveIndex((current) => ((current as number) + direction + visiblePhotos.length) % visiblePhotos.length);
  };

  const moveReview = (direction: -1 | 1) => {
    if (!visiblePhotos.length) return;
    setReviewIndex((current) => (current + direction + visiblePhotos.length) % visiblePhotos.length);
  };

  const closeReview = () => {
    setIsReviewing(false);
    setReviewIndex(0);
    if (deletedIds.size) router.refresh();
  };

  const deletePhoto = async (photo: TravelPhoto) => {
    if (!window.confirm("Delete this photo?")) return;

      setDeletingId(photo.id);
      try {
        const response = await fetch(`/api/travel/items?type=photo&id=${encodeURIComponent(photo.id)}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Delete failed");
        setDeletedIds((current) => new Set(current).add(photo.id));
        setActiveIndex(null);
        router.refresh();
    } catch {
      window.alert("Could not delete that photo.");
    } finally {
      setDeletingId("");
    }
  };

  const deleteReviewPhoto = async (photo: TravelPhoto) => {
    setReviewDeletingId(photo.id);
    try {
      const response = await fetch(`/api/travel/items?type=photo&id=${encodeURIComponent(photo.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      setDeletedIds((current) => new Set(current).add(photo.id));

      const nextLength = visiblePhotos.length - 1;
      if (nextLength <= 0) {
        setIsReviewing(false);
        setReviewIndex(0);
        router.refresh();
      } else {
        setReviewIndex((current) => Math.min(current, nextLength - 1));
      }
    } catch {
      window.alert("Could not delete that photo.");
    } finally {
      setReviewDeletingId("");
    }
  };

  const featurePhoto = async (photo: TravelPhoto) => {
    setFeaturingId(photo.id);
    try {
      const response = await fetch("/api/travel/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "photo", id: photo.id, is_featured: true }),
      });
      if (!response.ok) throw new Error("Feature failed");
      router.refresh();
    } catch {
      window.alert("Could not feature that photo.");
    } finally {
      setFeaturingId("");
    }
  };

  const carouselSwipe = useSwipe(moveCarousel);
  const modalSwipe = useSwipe(move);

  return (
    <>
      {visiblePhotos.length > 0 && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold text-slate-400">
            {visiblePhotos.length} {visiblePhotos.length === 1 ? "photo" : "photos"}
            {deletedIds.size > 0 ? ` · ${deletedIds.size} deleted this session` : ""}
          </p>
          <button
            type="button"
            onClick={() => {
              setReviewIndex(carouselIndex);
              setIsReviewing(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Review/delete
          </button>
        </div>
      )}
      {currentPhoto ? (
        <div
          className="group relative overflow-hidden rounded-lg border border-slate-100 bg-slate-50"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          {...carouselSwipe}
        >
          <button type="button" onClick={() => setActiveIndex(carouselIndex)} className="block w-full text-left">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPhoto.image_url}
              alt={currentPhoto.caption ?? fallbackName}
              className="aspect-[4/3] w-full object-cover sm:aspect-video"
            />
          </button>
          {visiblePhotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => moveCarousel(-1)}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-slate-950/50 p-2 text-white transition-colors hover:bg-slate-950/70"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => moveCarousel(1)}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-slate-950/50 p-2 text-white transition-colors hover:bg-slate-950/70"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <span className="absolute right-2 top-2 rounded-full bg-slate-950/60 px-2 py-1 text-xs font-semibold text-white">
                {carouselIndex + 1} / {visiblePhotos.length}
              </span>
            </>
          )}
          <div className="flex items-start justify-between gap-3 px-3 py-2 text-sm text-slate-600">
            <span className="min-w-0 truncate">
              {currentPhoto.is_featured && <Star className="mr-1 inline h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
              {currentPhoto.caption ?? currentPhoto.location_name ?? fallbackName}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <TravelEditButton type="photo" item={currentPhoto} label="Edit photo" />
              <button
                type="button"
                aria-label="Delete photo"
                title="Delete photo"
                disabled={deletingId === currentPhoto.id}
                onClick={() => void deletePhoto(currentPhoto)}
                className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-wait disabled:text-slate-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </span>
          </div>
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
          <Camera className="h-7 w-7 text-slate-300" />
          <p className="text-sm text-slate-400">No photos yet.</p>
          <TravelQuickAddButton kind="photo" label="Add first photo" />
        </div>
      )}

      {activePhoto && activeIndex !== null && (
        <div
          className="fixed inset-0 z-[80] bg-slate-950/90 p-4 text-white"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveIndex(null)}
          {...modalSwipe}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close photo"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              move(-1);
            }}
            className="absolute left-4 top-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              move(1);
            }}
            className="absolute right-4 top-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="flex h-full items-center justify-center">
            <div className="max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activePhoto.image_url} alt={activePhoto.caption ?? fallbackName} className="max-h-[78vh] max-w-full rounded-lg object-contain shadow-2xl" />
              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{activePhoto.caption ?? activePhoto.location_name ?? fallbackName}</p>
                  {modalSubtitle && <p className="mt-1 text-xs text-slate-300">{modalSubtitle}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingPhoto((current) => !current)}
                    className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    {isEditingPhoto ? "Close edit" : "Edit photo"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void deletePhoto(activePhoto)}
                    disabled={deletingId === activePhoto.id}
                    aria-label="Delete photo"
                    title="Delete photo"
                    className="inline-flex items-center justify-center rounded-md p-2 text-white/70 transition-colors hover:bg-red-500/20 hover:text-red-300 disabled:cursor-wait disabled:text-white/30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void featurePhoto(activePhoto)}
                    disabled={featuringId === activePhoto.id || activePhoto.is_featured}
                    className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white disabled:text-amber-300"
                  >
                    {activePhoto.is_featured ? "Featured" : "Set featured"}
                  </button>
                  <span className="ml-2 whitespace-nowrap text-xs text-slate-400">
                    {activeIndex + 1} / {visiblePhotos.length}
                  </span>
                </div>
              </div>
              {isEditingPhoto && (
                <div className="mt-3">
                  <TravelPhotoModalEditForm
                    photo={activePhoto}
                    favorites={favorites}
                    variant="dark"
                    onDone={() => setIsEditingPhoto(false)}
                    onCancel={() => setIsEditingPhoto(false)}
                  />
                </div>
              )}
              {!activePhoto.favorite_id && (
                <div className="mt-3">
                  {isAddingFavorite ? (
                    <CreateFavoriteFromPhoto
                      photo={activePhoto}
                      favorites={favorites}
                      photos={photos}
                      variant="dark"
                      onDone={() => {
                        setIsAddingFavorite(false);
                        setActiveIndex(null);
                      }}
                      onCancel={() => setIsAddingFavorite(false)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsAddingFavorite(true)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add or link experience
                    </button>
                  )}
                </div>
              )}
              {activeFavorite && (
                <div className="mt-3 rounded-md bg-white/10 px-3 py-2 text-sm text-white/80">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Linked experience</p>
                  <p className="mt-1 font-semibold text-white">{activeFavorite.name}</p>
                  <p className="text-xs text-white/60">
                    {activeFavorite.type}
                    {activeFavorite.location_name ? ` · ${activeFavorite.location_name}` : ""}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isReviewing && reviewPhoto && (
        <div className="fixed inset-0 z-[95] bg-slate-950/95 p-4 text-white" role="dialog" aria-modal="true" onClick={closeReview}>
          <button
            type="button"
            onClick={closeReview}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Close review"
          >
            <X className="h-5 w-5" />
          </button>
          {visiblePhotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  moveReview(-1);
                }}
                className="absolute left-4 top-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Previous review photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  moveReview(1);
                }}
                className="absolute right-4 top-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                aria-label="Next review photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div className="flex h-full items-center justify-center">
            <div className="w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between gap-3 pb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Photo review</p>
                  <p className="mt-1 truncate text-xs text-slate-400">
                    {reviewIndex + 1} / {visiblePhotos.length}
                    {deletedIds.size > 0 ? ` · ${deletedIds.size} deleted` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveReview(1)}
                    className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                  >
                    Keep / Next
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteReviewPhoto(reviewPhoto)}
                    disabled={reviewDeletingId === reviewPhoto.id}
                    className="inline-flex items-center gap-1.5 rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-400 disabled:cursor-wait disabled:bg-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    {reviewDeletingId === reviewPhoto.id ? "Deleting..." : "Delete + next"}
                  </button>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-start">
                <div className="flex max-h-[78vh] items-center justify-center rounded-lg bg-black/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={reviewPhoto.image_url} alt={reviewPhoto.caption ?? fallbackName} className="max-h-[78vh] max-w-full rounded-lg object-contain shadow-2xl" />
                </div>
                <div className="rounded-lg bg-white/10 p-4 text-sm text-white/80">
                  <p className="font-semibold text-white">{reviewPhoto.caption ?? reviewPhoto.location_name ?? fallbackName}</p>
                  {reviewSubtitle && <p className="mt-1 text-xs text-slate-300">{reviewSubtitle}</p>}
                  <div className="mt-4 space-y-2 text-xs text-white/60">
                    <p>{reviewPhoto.favorite_id ? `Linked: ${reviewFavorite?.name ?? "Favorite"}` : "Not linked to a favorite"}</p>
                    <p>{reviewPhoto.latitude !== null && reviewPhoto.longitude !== null ? "Has map location" : "No map location"}</p>
                    {reviewPhoto.is_featured && <p>Page featured photo</p>}
                    {reviewPhoto.is_favorite_featured && <p>Favorite pin photo</p>}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveIndex(reviewIndex);
                        setIsReviewing(false);
                        if (deletedIds.size) router.refresh();
                      }}
                      className="rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                    >
                      Open normal modal
                    </button>
                    <button
                      type="button"
                      onClick={closeReview}
                      className="rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
