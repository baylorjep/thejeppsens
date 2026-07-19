"use client";

import type { TravelPhoto } from "@/lib/travel";
import { Camera, ChevronLeft, ChevronRight, Star, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import TravelEditButton from "@/components/TravelEditButton";
import TravelQuickAddButton from "@/components/TravelQuickAddButton";

interface TravelPhotoLogProps {
  photos: TravelPhoto[];
  fallbackName: string;
}

export default function TravelPhotoLog({ photos, fallbackName }: TravelPhotoLogProps) {
  const router = useRouter();
  const touchStartX = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState("");
  const activePhoto = activeIndex === null ? null : photos[activeIndex] ?? null;
  const previewPhotos = photos.slice(0, 6);
  const remainingCount = Math.max(0, photos.length - previewPhotos.length);

  const move = (direction: -1 | 1) => {
    if (activeIndex === null || !photos.length) return;
    setActiveIndex((activeIndex + direction + photos.length) % photos.length);
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

  const handleTouchEnd = (clientX: number) => {
    if (touchStartX.current === null) return;
    const distance = clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(distance) < 45) return;
    move(distance > 0 ? -1 : 1);
  };

  return (
    <>
      {photos.length > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
          {previewPhotos.map((photo, index) => (
            <figure key={photo.id} className="group overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
              <button type="button" onClick={() => setActiveIndex(index)} className="relative block w-full text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.image_url} alt={photo.caption ?? fallbackName} className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.02]" />
                {index === previewPhotos.length - 1 && remainingCount > 0 && (
                  <span className="absolute inset-0 flex items-center justify-center bg-slate-950/60 text-lg font-bold text-white">
                    +{remainingCount}
                  </span>
                )}
              </button>
              <figcaption className="flex items-start justify-between gap-3 px-3 py-2 text-sm text-slate-600">
                <span className="min-w-0 truncate">
                  {photo.is_featured && <Star className="mr-1 inline h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                  {photo.caption ?? photo.location_name ?? fallbackName}
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <TravelEditButton type="photo" item={photo} label="Edit photo" />
                  <button
                    type="button"
                    aria-label="Delete photo"
                    title="Delete photo"
                    disabled={deletingId === photo.id}
                    onClick={() => void deletePhoto(photo)}
                    className="inline-flex items-center justify-center rounded-md p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-wait disabled:text-slate-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </span>
              </figcaption>
            </figure>
          ))}
          </div>
          <button
            type="button"
            onClick={() => setActiveIndex(0)}
            className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
          >
            View all {photos.length} photos
          </button>
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
          onTouchStart={(event) => {
            touchStartX.current = event.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const touch = event.changedTouches[0];
            if (touch) handleTouchEnd(touch.clientX);
          }}
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
                <div>
                  <p className="text-sm font-semibold">{activePhoto.caption ?? activePhoto.location_name ?? fallbackName}</p>
                  {(activePhoto.location_name || activePhoto.taken_on) && (
                    <p className="mt-1 text-xs text-slate-300">
                      {[activePhoto.location_name, activePhoto.taken_on].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void deletePhoto(activePhoto)}
                    disabled={deletingId === activePhoto.id}
                    className="inline-flex items-center gap-2 rounded-md bg-white/10 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-500/80 disabled:cursor-wait disabled:text-slate-300"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </button>
                  <span className="text-xs text-slate-400">
                    {activeIndex + 1} / {photos.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
