"use client";

import { TravelFavoriteModalEditForm } from "@/components/TravelModalEditForm";
import TravelFavoriteLocations from "@/components/TravelFavoriteLocations";
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
  const [isShowingAll, setIsShowingAll] = useState(false);
  const [assigningLocationPhotoId, setAssigningLocationPhotoId] = useState("");
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const visibleLimit = 10;
  const hasHiddenFavorites = favorites.length > visibleLimit;
  const visibleFavorites = isShowingAll ? favorites : favorites.slice(0, visibleLimit);
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

  const assignPhotoToFavoriteLocation = async (photo: TravelPhoto, favoriteLocationId: string) => {
    if (!selectedFavorite) return;
    setAssigningLocationPhotoId(photo.id);
    try {
      const response = await fetch("/api/travel/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "photo",
          id: photo.id,
          favorite_id: selectedFavorite.id,
          favorite_location_id: favoriteLocationId || null,
        }),
      });
      if (!response.ok) throw new Error("Location assignment failed");
      router.refresh();
    } catch {
      window.alert("Could not assign that photo to the chain location.");
    } finally {
      setAssigningLocationPhotoId("");
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {visibleFavorites.map((favorite) => (
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
        {hasHiddenFavorites && (
          <button
            type="button"
            onClick={() => setIsShowingAll((current) => !current)}
            className="rounded-full border border-dashed border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-950"
          >
            {isShowingAll ? "Show less" : `View all ${favorites.length}`}
          </button>
        )}
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
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={heroPhoto.image_url} alt="" className="aspect-video w-full object-cover" />
                {heroPhoto.taken_on && (
                  <div className="absolute left-3 top-3 rounded-full bg-slate-950/70 px-3 py-1.5 text-sm font-semibold text-white shadow-sm">
                    {heroPhoto.taken_on}
                  </div>
                )}
              </div>
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
                    {selectedFavorite.type === "restaurant" && selectedFavorite.cuisine && (
                      <p className="mt-1 text-sm font-semibold text-rose-600">{selectedFavorite.cuisine}</p>
                    )}
                    {selectedFavorite.location_name && <p className="mt-1 text-sm text-slate-500">{selectedFavorite.location_name}</p>}
                    {selectedFavorite.address && <p className="mt-2 text-sm text-slate-600">{selectedFavorite.address}</p>}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{selectedFavorite.notes?.trim() || "No notes saved yet."}</p>
                  {selectedFavorite.type === "restaurant" && <TravelFavoriteLocations favorite={selectedFavorite} />}
                  {selectedFavorite.type === "restaurant" && (selectedFavorite.locations ?? []).length > 0 && selectedPhotos.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Assign Photos To Locations</p>
                      <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                        {selectedPhotos.map((photo) => (
                          <div key={photo.id} className="grid grid-cols-[3rem_1fr] items-center gap-3 rounded-md bg-white p-2 ring-1 ring-slate-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={photo.image_url} alt="" className="h-12 w-12 rounded-md object-cover" />
                            <select
                              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 outline-none focus:border-slate-900"
                              value={photo.favorite_location_id ?? ""}
                              onChange={(event) => void assignPhotoToFavoriteLocation(photo, event.target.value)}
                              disabled={assigningLocationPhotoId === photo.id}
                            >
                              <option value="">Parent favorite only</option>
                              {(selectedFavorite.locations ?? []).map((location) => (
                                <option key={location.id} value={location.id}>
                                  {location.name || location.location_name || location.address || "Saved location"}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedPhotos.length > 0 && (
                    <div className="max-h-32 overflow-y-auto pr-1">
                      <div className="grid grid-cols-4 gap-2">
                        {selectedPhotos.map((photo, index) => (
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
