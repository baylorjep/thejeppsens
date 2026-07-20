"use client";

import CreateFavoriteFromPhoto from "@/components/CreateFavoriteFromPhoto";
import TravelEditButton from "@/components/TravelEditButton";
import TravelQuickAddButton from "@/components/TravelQuickAddButton";
import type { TravelFavorite, TravelPhoto } from "@/lib/travel";
import type { TravelMapCenter } from "@/lib/travelMapCenters";
import { CalendarDays, ChevronLeft, ChevronRight, Maximize2, MapPin, Sparkles, Utensils, X } from "lucide-react";
import { useState } from "react";

const TILE_SIZE = 256;
const MAP_WIDTH = 768;
const MAP_HEIGHT = 320;
const EXPANDED_MAP_WIDTH = 1600;
const EXPANDED_MAP_HEIGHT = 900;

type MapDetailItem =
  | { kind: "favorite"; id: string }
  | { kind: "photo"; id: string };

function lonToX(longitude: number, zoom: number) {
  return ((longitude + 180) / 360) * TILE_SIZE * 2 ** zoom;
}

function latToY(latitude: number, zoom: number) {
  const latRad = (latitude * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * TILE_SIZE * 2 ** zoom;
}

function pickZoom(points: { latitude: number; longitude: number }[]) {
  if (points.length <= 1) return 11;

  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const latSpan = Math.max(...latitudes) - Math.min(...latitudes);
  const lonSpan = Math.max(...longitudes) - Math.min(...longitudes);
  const span = Math.max(latSpan, lonSpan);

  if (span < 0.08) return 12;
  if (span < 0.2) return 11;
  if (span < 0.6) return 10;
  if (span < 1.5) return 9;
  if (span < 3) return 8;
  if (span < 7) return 7;
  return 5;
}

function buildTiles(zoom: number, topLeftX: number, topLeftY: number, width: number, height: number) {
  const tileStartX = Math.floor(topLeftX / TILE_SIZE);
  const tileStartY = Math.floor(topLeftY / TILE_SIZE);
  const tileEndX = Math.floor((topLeftX + width) / TILE_SIZE);
  const tileEndY = Math.floor((topLeftY + height) / TILE_SIZE);
  const tileCount = 2 ** zoom;
  const tiles = [];

  for (let x = tileStartX; x <= tileEndX; x += 1) {
    for (let y = tileStartY; y <= tileEndY; y += 1) {
      if (y < 0 || y >= tileCount) continue;
      const wrappedX = ((x % tileCount) + tileCount) % tileCount;
      tiles.push({
        key: `${x}-${y}`,
        src: `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`,
        left: x * TILE_SIZE - topLeftX,
        top: y * TILE_SIZE - topLeftY,
      });
    }
  }

  return tiles;
}

interface TravelFavoriteMapProps {
  favorites: TravelFavorite[];
  photos?: TravelPhoto[];
  fallbackCenter: TravelMapCenter;
}

export default function TravelFavoriteMap({ favorites, photos = [], fallbackCenter }: TravelFavoriteMapProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedFavoritePhotoIndex, setSelectedFavoritePhotoIndex] = useState(0);
  const pinned = favorites
    .filter((favorite) => favorite.latitude !== null && favorite.longitude !== null)
    .map((favorite) => ({
      ...favorite,
      latitude: favorite.latitude as number,
      longitude: favorite.longitude as number,
    }));
  const mappedPhotos = photos
    .filter((photo) => photo.favorite_id === null && photo.latitude !== null && photo.longitude !== null)
    .map((photo) => ({
      ...photo,
      latitude: photo.latitude as number,
      longitude: photo.longitude as number,
    }));
  const mapPoints = [
    ...pinned.map((item) => ({ latitude: item.latitude, longitude: item.longitude })),
    ...mappedPhotos.map((item) => ({ latitude: item.latitude, longitude: item.longitude })),
  ];

  const centerLatitude = mapPoints.length
    ? mapPoints.reduce((sum, point) => sum + point.latitude, 0) / mapPoints.length
    : fallbackCenter.latitude;
  const centerLongitude = mapPoints.length
    ? mapPoints.reduce((sum, point) => sum + point.longitude, 0) / mapPoints.length
    : fallbackCenter.longitude;
  const zoom = mapPoints.length ? pickZoom(mapPoints) : fallbackCenter.zoom;
  const centerX = lonToX(centerLongitude, zoom);
  const centerY = latToY(centerLatitude, zoom);

  const markerStyle = (type: TravelFavorite["type"], isActive: boolean) => {
    const color = type === "restaurant" ? "bg-rose-600" : type === "activity" ? "bg-amber-500" : "bg-teal-600";
    return `${color} ${isActive ? "scale-125 ring-4 ring-white" : "ring-2 ring-white"}`;
  };
  const IconForFavorite = (type: TravelFavorite["type"]) => (type === "restaurant" ? Utensils : type === "activity" ? Sparkles : MapPin);
  const selectedFavorite = selectedFavoriteId ? favorites.find((favorite) => favorite.id === selectedFavoriteId) ?? null : null;
  const favoritePhotosFor = (favoriteId: string) => photos.filter((photo) => photo.favorite_id === favoriteId);
  const favoritePinPhotoFor = (favoriteId: string) => {
    const favoritePhotos = favoritePhotosFor(favoriteId);
    return favoritePhotos.find((photo) => photo.is_favorite_featured) ?? favoritePhotos[0] ?? null;
  };
  const selectedFavoritePhotos = selectedFavorite ? favoritePhotosFor(selectedFavorite.id) : [];
  const selectedFavoriteHeroPhoto = selectedFavoritePhotos[selectedFavoritePhotoIndex] ?? selectedFavoritePhotos[0] ?? null;
  const SelectedFavoriteIcon = selectedFavorite ? IconForFavorite(selectedFavorite.type) : null;
  const selectedPhoto = selectedPhotoId ? photos.find((photo) => photo.id === selectedPhotoId) ?? null : null;
  const selectedPhotoFavorite = selectedPhoto?.favorite_id ? favorites.find((favorite) => favorite.id === selectedPhoto.favorite_id) ?? null : null;
  const mapDetailItems: MapDetailItem[] = [
    ...pinned.map((favorite) => ({ kind: "favorite" as const, id: favorite.id })),
    ...mappedPhotos.map((photo) => ({ kind: "photo" as const, id: photo.id })),
  ];

  const openMapItem = (item: MapDetailItem) => {
    if (item.kind === "favorite") {
      openFavorite(item.id);
    } else {
      const photo = mappedPhotos.find((mappedPhoto) => mappedPhoto.id === item.id) ?? photos.find((photo) => photo.id === item.id);
      if (photo) openPhoto(photo);
    }
  };

  const openFavorite = (favoriteId: string) => {
    setActiveId(favoriteId);
    setSelectedPhotoId(null);
    setSelectedFavoriteId(favoriteId);
    setSelectedFavoritePhotoIndex(0);
  };

  const openPhoto = (photo: TravelPhoto) => {
    setSelectedFavoriteId(null);
    setSelectedPhotoId(photo.id);
  };

  const closeDetails = () => {
    setSelectedFavoriteId(null);
    setSelectedPhotoId(null);
    setSelectedFavoritePhotoIndex(0);
  };

  const moveMapItem = (direction: -1 | 1) => {
    if (!mapDetailItems.length) return;
    const currentIndex = mapDetailItems.findIndex((item) => {
      if (selectedFavorite) return item.kind === "favorite" && item.id === selectedFavorite.id;
      if (selectedPhoto) return item.kind === "photo" && item.id === selectedPhoto.id;
      return false;
    });
    const nextIndex = ((currentIndex === -1 ? 0 : currentIndex) + direction + mapDetailItems.length) % mapDetailItems.length;
    openMapItem(mapDetailItems[nextIndex]);
  };

  const moveFavoritePhoto = (direction: -1 | 1) => {
    if (selectedFavoritePhotos.length <= 1) return;
    setSelectedFavoritePhotoIndex((current) => (current + direction + selectedFavoritePhotos.length) % selectedFavoritePhotos.length);
  };

  const renderCanvas = (width: number, height: number, markerScale: 1 | 1.4) => {
    const topLeftX = centerX - width / 2;
    const topLeftY = centerY - height / 2;
    const tiles = buildTiles(zoom, topLeftX, topLeftY, width, height);
    const pinSize = markerScale === 1.4 ? "h-11 w-11" : "h-8 w-8";
    const iconSize = markerScale === 1.4 ? "h-5 w-5" : "h-4 w-4";
    const photoSize = markerScale === 1.4 ? "h-12 w-10" : "h-9 w-7";

    return (
      <>
        {tiles.map((tile) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={tile.key}
            src={tile.src}
            alt=""
            className="absolute h-64 w-64 select-none"
            style={{ left: tile.left, top: tile.top }}
            draggable={false}
          />
        ))}
        {pinned.map((favorite, index) => {
          const left = lonToX(favorite.longitude, zoom) - topLeftX;
          const top = latToY(favorite.latitude, zoom) - topLeftY;
          const Icon = IconForFavorite(favorite.type);
          const pinPhoto = favoritePinPhotoFor(favorite.id);
          return (
            <button
              key={favorite.id}
              type="button"
              className={`absolute flex ${pinSize} -translate-x-1/2 -translate-y-full items-center justify-center overflow-hidden rounded-full text-white shadow-lg transition-transform ${
                pinPhoto ? (activeId === favorite.id ? "scale-125 ring-4 ring-white" : "ring-2 ring-white") : markerStyle(favorite.type, activeId === favorite.id)
              }`}
              style={{ left, top }}
              title={favorite.name}
              onClick={(event) => {
                event.stopPropagation();
                openFavorite(favorite.id);
              }}
              onMouseEnter={() => setActiveId(favorite.id)}
              onMouseLeave={() => setActiveId(null)}
            >
              {pinPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={pinPhoto.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <Icon className={iconSize} />
              )}
              <span className="sr-only">{index + 1}</span>
            </button>
          );
        })}
        {mappedPhotos.map((photo) => {
          const left = lonToX(photo.longitude, zoom) - topLeftX;
          const top = latToY(photo.latitude, zoom) - topLeftY;
          return (
            <button
              key={photo.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                if (photo.favorite_id) {
                  openFavorite(photo.favorite_id);
                } else {
                  openPhoto(photo);
                }
              }}
              aria-label={photo.favorite_id ? "Open linked experience" : "Open photo"}
              className={`absolute ${photoSize} -translate-x-1/2 -translate-y-full overflow-hidden rounded-[12px_12px_12px_4px] border border-white/80 bg-white p-px shadow-md ring-1 ring-slate-950/15 transition-transform hover:scale-110`}
              style={{ left, top }}
              title={photo.caption ?? photo.location_name ?? "Photo"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.image_url} alt="" className="h-full w-full rounded-[10px_10px_10px_3px] object-cover" />
            </button>
          );
        })}
      </>
    );
  };

  return (
    <div className="space-y-4">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsExpanded(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsExpanded(true);
          }
        }}
        aria-label="Expand map"
        className="group relative block h-80 w-full cursor-pointer overflow-hidden rounded-lg border border-slate-100 bg-sky-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
      >
        <div className="absolute left-1/2 top-1/2 h-80 w-[768px] -translate-x-1/2 -translate-y-1/2 overflow-hidden">
          {renderCanvas(MAP_WIDTH, MAP_HEIGHT, 1)}
        </div>
        {!mapPoints.length && (
          <div className="absolute inset-0 flex items-center justify-center bg-sky-50/15 p-4" onClick={(event) => event.stopPropagation()}>
            <div className="rounded-lg bg-white/95 px-4 py-3 text-center shadow-sm ring-1 ring-slate-950/10">
              <MapPin className="mx-auto mb-2 h-6 w-6 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">{fallbackCenter.label}</p>
              <p className="mb-3 text-xs text-slate-400">No mapped photos or pinned favorites yet.</p>
              <TravelQuickAddButton kind="favorite" label="Add first favorite" />
            </div>
          </div>
        )}
        <span className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-md bg-slate-950/70 px-2 py-1 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
          <Maximize2 className="h-3 w-3" />
          Expand
        </span>
        <div className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-[10px] text-slate-500 shadow-sm">
          © OpenStreetMap contributors
        </div>
      </div>

      {isExpanded && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true">
          <div className="relative h-[80vh] w-full max-w-5xl overflow-hidden rounded-xl bg-sky-50 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              aria-label="Close expanded map"
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow-sm transition-colors hover:bg-white"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="absolute left-1/2 top-1/2 h-[900px] w-[1600px] -translate-x-1/2 -translate-y-1/2">
              {renderCanvas(EXPANDED_MAP_WIDTH, EXPANDED_MAP_HEIGHT, 1.4)}
            </div>
            {!mapPoints.length && (
              <div className="absolute inset-0 flex items-center justify-center bg-sky-50/15 p-4">
                <div className="rounded-lg bg-white/95 px-5 py-4 text-center shadow-sm ring-1 ring-slate-950/10">
                  <MapPin className="mx-auto mb-2 h-7 w-7 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-700">{fallbackCenter.label}</p>
                  <p className="mb-3 text-xs text-slate-400">No mapped photos or pinned favorites yet.</p>
                  <TravelQuickAddButton kind="favorite" label="Add first favorite" />
                </div>
              </div>
            )}
            <div className="absolute bottom-3 right-3 rounded bg-white/90 px-2 py-1 text-[10px] text-slate-500 shadow-sm">
              © OpenStreetMap contributors
            </div>
          </div>
        </div>
      )}

      {!!favorites.length && <div className="space-y-2">
        {favorites.slice(0, 8).map((favorite) => {
          const Icon = IconForFavorite(favorite.type);
          const isActive = activeId === favorite.id;
          const favoritePhotos = favoritePhotosFor(favorite.id).slice(0, 4);
          return (
            <div
              key={favorite.id}
              onMouseEnter={() => setActiveId(favorite.id)}
              onMouseLeave={() => setActiveId(null)}
              className={`rounded-lg p-3 transition-colors ${isActive ? "bg-slate-100" : "bg-slate-50"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{favorite.name}</p>
                    <p className="text-xs text-slate-500">
                      {favorite.type}
                      {favorite.location_name ? ` · ${favorite.location_name}` : ""}
                    </p>
                  </div>
                </div>
                <TravelEditButton type="favorite" item={favorite} label={`Edit ${favorite.name}`} />
              </div>
              {favoritePhotos.length > 0 && (
                <div className="mt-2 flex gap-1.5 pl-10">
                  {favoritePhotos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => openPhoto(photo)}
                      className="h-9 w-9 overflow-hidden rounded-md border border-white shadow-sm"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.image_url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>}

      {(selectedFavorite || selectedPhoto) && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true">
          {mapDetailItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => moveMapItem(-1)}
                aria-label="Previous map item"
                className="fixed left-3 top-1/2 z-10 rounded-full bg-white/90 p-3 text-slate-700 shadow-lg transition-colors hover:bg-white sm:left-6"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={() => moveMapItem(1)}
                aria-label="Next map item"
                className="fixed right-3 top-1/2 z-10 rounded-full bg-white/90 p-3 text-slate-700 shadow-lg transition-colors hover:bg-white sm:right-6"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={closeDetails}
              aria-label="Close details"
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>

            {selectedFavorite ? (
              <>
                <div className="relative">
                  {selectedFavoriteHeroPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selectedFavoriteHeroPhoto.image_url} alt="" className="aspect-video w-full object-cover" />
                  ) : (
                    <div className="flex aspect-video items-center justify-center bg-slate-100 text-slate-300">
                      {SelectedFavoriteIcon && <SelectedFavoriteIcon className="h-10 w-10" />}
                    </div>
                  )}
                  {selectedFavoritePhotos.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-950/70 px-2 py-1 text-xs font-semibold text-white">
                      <button type="button" onClick={() => moveFavoritePhoto(-1)} aria-label="Previous photo" className="rounded-full p-1 hover:bg-white/15">
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span>{selectedFavoritePhotoIndex + 1} / {selectedFavoritePhotos.length}</span>
                      <button type="button" onClick={() => moveFavoritePhoto(1)} aria-label="Next photo" className="rounded-full p-1 hover:bg-white/15">
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">{selectedFavorite.type}</p>
                    <h3 className="mt-1 text-xl font-bold text-slate-950">{selectedFavorite.name}</h3>
                    {selectedFavorite.location_name && <p className="mt-1 text-sm text-slate-500">{selectedFavorite.location_name}</p>}
                  </div>
                  <p className="text-sm leading-6 text-slate-600">
                    {selectedFavorite.notes?.trim() || "No notes saved yet."}
                  </p>
                  {selectedFavoritePhotos.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedFavoritePhotos.slice(0, 8).map((photo, index) => (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => setSelectedFavoritePhotoIndex(index)}
                          className={`overflow-hidden rounded-md ring-offset-2 ${index === selectedFavoritePhotoIndex ? "ring-2 ring-teal-500" : ""}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.image_url} alt="" className="aspect-square w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                  <TravelEditButton type="favorite" item={selectedFavorite} label={`Edit ${selectedFavorite.name}`} />
                </div>
              </>
            ) : selectedPhoto ? (
              <>
                <div className="relative bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedPhoto.image_url} alt="" className="max-h-[52vh] w-full object-contain" />
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">{selectedPhoto.caption ?? selectedPhoto.location_name ?? "Travel photo"}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {selectedPhoto.location_name && <span>{selectedPhoto.location_name}</span>}
                      {selectedPhoto.taken_on && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {selectedPhoto.taken_on}
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedPhotoFavorite ? (
                    <button
                      type="button"
                      onClick={() => openFavorite(selectedPhotoFavorite.id)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition-colors hover:bg-slate-100"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Linked experience</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{selectedPhotoFavorite.name}</p>
                      <p className="text-xs text-slate-500">
                        {selectedPhotoFavorite.type}
                        {selectedPhotoFavorite.location_name ? ` · ${selectedPhotoFavorite.location_name}` : ""}
                      </p>
                    </button>
                  ) : (
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Experience</p>
                      <CreateFavoriteFromPhoto
                        photo={selectedPhoto}
                        favorites={favorites}
                        onDone={closeDetails}
                        onCancel={closeDetails}
                      />
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
