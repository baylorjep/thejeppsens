"use client";

import { TravelFavoriteModalEditForm } from "@/components/TravelModalEditForm";
import type { TravelFavorite, TravelPhoto } from "@/lib/travel";
import { MapPin, X } from "lucide-react";
import { useState } from "react";

interface TravelFavoriteChipsProps {
  favorites: TravelFavorite[];
  photos: TravelPhoto[];
}

export default function TravelFavoriteChips({ favorites, photos }: TravelFavoriteChipsProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const selectedFavorite = selectedId ? favorites.find((favorite) => favorite.id === selectedId) ?? null : null;
  const selectedPhotos = selectedFavorite ? photos.filter((photo) => photo.favorite_id === selectedFavorite.id) : [];
  const heroPhoto = selectedPhotos.find((photo) => photo.is_favorite_featured) ?? selectedPhotos[0] ?? null;

  const close = () => {
    setSelectedId(null);
    setIsEditing(false);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {favorites.map((favorite) => (
          <button
            key={favorite.id}
            type="button"
            onClick={() => {
              setSelectedId(favorite.id);
              setIsEditing(false);
            }}
            className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 transition-colors hover:bg-white hover:text-slate-950"
          >
            {favorite.name}
          </button>
        ))}
      </div>

      {selectedFavorite && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" onClick={close}>
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={close}
              aria-label="Close details"
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            {heroPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={heroPhoto.image_url} alt="" className="aspect-video w-full object-cover" />
            ) : (
              <div className="flex aspect-video items-center justify-center bg-slate-100 text-slate-300">
                <MapPin className="h-10 w-10" />
              </div>
            )}

            <div className="space-y-4 p-5">
              {isEditing ? (
                <TravelFavoriteModalEditForm
                  favorite={selectedFavorite}
                  onDone={() => setIsEditing(false)}
                  onCancel={() => setIsEditing(false)}
                />
              ) : (
                <>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">{selectedFavorite.type}</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-950">{selectedFavorite.name}</h3>
                    {selectedFavorite.location_name && <p className="mt-1 text-sm text-slate-500">{selectedFavorite.location_name}</p>}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{selectedFavorite.notes?.trim() || "No notes saved yet."}</p>
                  {selectedPhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedPhotos.slice(0, 8).map((photo) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={photo.id} src={photo.image_url} alt="" className="aspect-square rounded-md object-cover" />
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                  >
                    Edit favorite
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
