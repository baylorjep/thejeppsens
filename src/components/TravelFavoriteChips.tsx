"use client";

import { TravelFavoriteModalEditForm } from "@/components/TravelModalEditForm";
import { travelFavoriteMapsUrl, type TravelFavorite, type TravelPhoto } from "@/lib/travel";
import { ExternalLink, MapPin, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TravelFavoriteChipsProps {
  favorites: TravelFavorite[];
  photos: TravelPhoto[];
}

export default function TravelFavoriteChips({ favorites, photos }: TravelFavoriteChipsProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const selectedFavorite = selectedId ? favorites.find((favorite) => favorite.id === selectedId) ?? null : null;
  const selectedPhotos = selectedFavorite ? photos.filter((photo) => photo.favorite_id === selectedFavorite.id) : [];
  const heroPhoto = selectedPhotos[selectedPhotoIndex] ?? selectedPhotos.find((photo) => photo.is_favorite_featured) ?? selectedPhotos[0] ?? null;
  const mapsUrl = selectedFavorite ? travelFavoriteMapsUrl(selectedFavorite) : null;

  const featuredPhotoIndexFor = (favoriteId: string) => {
    const favoritePhotos = photos.filter((photo) => photo.favorite_id === favoriteId);
    const featuredIndex = favoritePhotos.findIndex((photo) => photo.is_favorite_featured);
    return featuredIndex === -1 ? 0 : featuredIndex;
  };

  const close = () => {
    setSelectedId(null);
    setIsEditing(false);
    setSelectedPhotoIndex(0);
  };

  const setFavoritePinPhoto = async (photo: TravelPhoto) => {
    try {
      const response = await fetch("/api/travel/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "photo", id: photo.id, is_favorite_featured: true }),
      });
      if (!response.ok) throw new Error("Pin update failed");
      router.refresh();
    } catch {
      window.alert("Could not update the favorite pin photo.");
    }
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
              setSelectedPhotoIndex(featuredPhotoIndexFor(favorite.id));
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
                    {selectedFavorite.address && <p className="mt-2 text-sm text-slate-600">{selectedFavorite.address}</p>}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{selectedFavorite.notes?.trim() || "No notes saved yet."}</p>
                  {selectedPhotos.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedPhotos.slice(0, 8).map((photo, index) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setSelectedPhotoIndex(index)}
                          className={`overflow-hidden rounded-md ring-offset-2 ${index === selectedPhotoIndex ? "ring-2 ring-teal-500" : ""}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.image_url} alt="" className="aspect-square w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in Maps
                    </a>
                  )}
                  {heroPhoto && (
                    <button
                      type="button"
                      onClick={() => void setFavoritePinPhoto(heroPhoto)}
                      disabled={Boolean(heroPhoto.is_favorite_featured)}
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 disabled:text-amber-600"
                    >
                      {heroPhoto.is_favorite_featured ? "Pin photo selected" : "Use current photo as pin"}
                    </button>
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
