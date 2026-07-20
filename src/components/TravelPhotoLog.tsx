"use client";

import type { TravelFavorite, TravelPhoto } from "@/lib/travel";
import { Camera, ChevronLeft, ChevronRight, Plus, Star, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type TouchEvent } from "react";
import CreateFavoriteFromPhoto from "@/components/CreateFavoriteFromPhoto";
import TravelEditButton from "@/components/TravelEditButton";
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
  const resumeTimer = useRef<number | null>(null);

  const currentPhoto = photos[carouselIndex] ?? null;
  const activePhoto = activeIndex === null ? null : photos[activeIndex] ?? null;
  const activeFavorite = activePhoto?.favorite_id ? favorites.find((favorite) => favorite.id === activePhoto.favorite_id) ?? null : null;
  const modalSubtitle = activePhoto
    ? [activePhoto.caption ? activePhoto.location_name : null, activePhoto.taken_on].filter(Boolean).join(" · ")
    : "";

  useEffect(() => {
    if (carouselIndex >= photos.length) setCarouselIndex(0);
  }, [photos.length, carouselIndex]);

  useEffect(() => {
    setIsAddingFavorite(false);
  }, [activeIndex]);

  useEffect(() => {
    if (photos.length <= 1 || isPaused || activeIndex !== null) return;
    const timer = window.setInterval(() => {
      setCarouselIndex((current) => (current + 1) % photos.length);
    }, AUTO_ADVANCE_MS);
    return () => window.clearInterval(timer);
  }, [photos.length, isPaused, activeIndex]);

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
    if (!photos.length) return;
    setCarouselIndex((current) => (current + direction + photos.length) % photos.length);
    pauseThenResume();
  };

  const move = (direction: -1 | 1) => {
    if (activeIndex === null || !photos.length) return;
    setActiveIndex((current) => ((current as number) + direction + photos.length) % photos.length);
  };

  const deletePhoto = async (photo: TravelPhoto) => {
    if (!window.confirm("Delete this photo?")) return;

    setDeletingId(photo.id);
    try {
      const response = await fetch(`/api/travel/items?type=photo&id=${encodeURIComponent(photo.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      setActiveIndex(null);
      router.refresh();
    } catch {
      window.alert("Could not delete that photo.");
    } finally {
      setDeletingId("");
    }
  };

  const carouselSwipe = useSwipe(moveCarousel);
  const modalSwipe = useSwipe(move);

  return (
    <>
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
          {photos.length > 1 && (
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
                {carouselIndex + 1} / {photos.length}
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
            onClick={() => move(-1)}
            className="absolute left-4 top-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            className="absolute right-4 top-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Next photo"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <div className="flex h-full items-center justify-center">
            <div className="max-h-full max-w-5xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activePhoto.image_url} alt={activePhoto.caption ?? fallbackName} className="max-h-[78vh] max-w-full rounded-lg object-contain shadow-2xl" />
              <div className="mt-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{activePhoto.caption ?? activePhoto.location_name ?? fallbackName}</p>
                  {modalSubtitle && <p className="mt-1 text-xs text-slate-300">{modalSubtitle}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <TravelEditButton
                    type="photo"
                    item={activePhoto}
                    label="Edit photo"
                    className="inline-flex items-center justify-center rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                  />
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
                  <span className="ml-2 whitespace-nowrap text-xs text-slate-400">
                    {activeIndex + 1} / {photos.length}
                  </span>
                </div>
              </div>
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
    </>
  );
}
