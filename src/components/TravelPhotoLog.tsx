"use client";

import type { TravelPhoto } from "@/lib/travel";
import { Camera, ChevronLeft, ChevronRight, Star, X } from "lucide-react";
import { useState } from "react";
import TravelEditButton from "@/components/TravelEditButton";
import TravelQuickAddButton from "@/components/TravelQuickAddButton";

interface TravelPhotoLogProps {
  photos: TravelPhoto[];
  fallbackName: string;
}

export default function TravelPhotoLog({ photos, fallbackName }: TravelPhotoLogProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activePhoto = activeIndex === null ? null : photos[activeIndex] ?? null;

  const move = (direction: -1 | 1) => {
    if (activeIndex === null || !photos.length) return;
    setActiveIndex((activeIndex + direction + photos.length) % photos.length);
  };

  return (
    <>
      {photos.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {photos.map((photo, index) => (
            <figure key={photo.id} className="group overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
              <button type="button" onClick={() => setActiveIndex(index)} className="block w-full text-left">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.image_url} alt={photo.caption ?? fallbackName} className="h-52 w-full object-cover transition-transform group-hover:scale-[1.02]" />
              </button>
              <figcaption className="flex items-start justify-between gap-3 px-3 py-2 text-sm text-slate-600">
                <span>
                  {photo.is_featured && <Star className="mr-1 inline h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                  {photo.caption ?? photo.location_name ?? fallbackName}
                </span>
                <TravelEditButton type="photo" item={photo} label="Edit photo" />
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 text-center">
          <Camera className="h-7 w-7 text-slate-300" />
          <p className="text-sm text-slate-400">No photos yet.</p>
          <TravelQuickAddButton kind="photo" label="Add first photo" />
        </div>
      )}

      {activePhoto && activeIndex !== null && (
        <div className="fixed inset-0 z-[80] bg-slate-950/90 p-4 text-white" role="dialog" aria-modal="true">
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
                <span className="text-xs text-slate-400">
                  {activeIndex + 1} / {photos.length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
