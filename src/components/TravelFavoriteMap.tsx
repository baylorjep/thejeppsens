"use client";

import CreateFavoriteFromPhoto from "@/components/CreateFavoriteFromPhoto";
import { TravelFavoriteModalEditForm, TravelPhotoModalEditForm } from "@/components/TravelModalEditForm";
import TravelQuickAddButton from "@/components/TravelQuickAddButton";
import { travelFavoriteMapsUrl, type TravelFavorite, type TravelPhoto } from "@/lib/travel";
import type { TravelMapCenter } from "@/lib/travelMapCenters";
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, Maximize2, MapPin, Sparkles, Trash2, Utensils, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const TILE_SIZE = 256;
const MAP_WIDTH = 768;
const MAP_HEIGHT = 320;
const EXPANDED_MAP_WIDTH = 1600;
const EXPANDED_MAP_HEIGHT = 900;
const MAP_FIT_PADDING = 72;

type MapDetailItem =
  | { kind: "favorite"; id: string }
  | { kind: "photo"; id: string };

interface MapView {
  latitude: number;
  longitude: number;
  zoom: number;
}

function lonToX(longitude: number, zoom: number) {
  return ((longitude + 180) / 360) * TILE_SIZE * 2 ** zoom;
}

function latToY(latitude: number, zoom: number) {
  const latRad = (latitude * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * TILE_SIZE * 2 ** zoom;
}

function fitMapView(points: { latitude: number; longitude: number }[], fallbackCenter: TravelMapCenter, width: number, height: number): MapView {
  if (!points.length) {
    return {
      latitude: fallbackCenter.latitude,
      longitude: fallbackCenter.longitude,
      zoom: fallbackCenter.zoom,
    };
  }

  if (points.length === 1) {
    return {
      latitude: points[0].latitude,
      longitude: points[0].longitude,
      zoom: 11,
    };
  }

  let bestZoom = 3;
  const fitWidth = Math.max(width - MAP_FIT_PADDING * 2, width * 0.55);
  const fitHeight = Math.max(height - MAP_FIT_PADDING * 2, height * 0.55);

  for (let candidateZoom = 16; candidateZoom >= 3; candidateZoom -= 1) {
    const xs = points.map((point) => lonToX(point.longitude, candidateZoom));
    const ys = points.map((point) => latToY(point.latitude, candidateZoom));
    const xSpan = Math.max(...xs) - Math.min(...xs);
    const ySpan = Math.max(...ys) - Math.min(...ys);
    if (xSpan <= fitWidth && ySpan <= fitHeight) {
      bestZoom = candidateZoom;
      break;
    }
  }

  const xs = points.map((point) => lonToX(point.longitude, bestZoom));
  const ys = points.map((point) => latToY(point.latitude, bestZoom));
  const centerX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centerY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const worldSize = TILE_SIZE * 2 ** bestZoom;
  const longitude = (centerX / worldSize) * 360 - 180;
  const latitudeRadians = Math.atan(Math.sinh(Math.PI * (1 - (2 * centerY) / worldSize)));

  return {
    latitude: (latitudeRadians * 180) / Math.PI,
    longitude,
    zoom: bestZoom,
  };
}

function clusterPrecisionForZoom(zoom: number) {
  if (zoom >= 15) return 5;
  if (zoom >= 13) return 4;
  if (zoom >= 10) return 3;
  return 2;
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
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFavoriteId, setSelectedFavoriteId] = useState<string | null>(null);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [selectedFavoritePhotoIndex, setSelectedFavoritePhotoIndex] = useState(0);
  const [editingDetail, setEditingDetail] = useState<"favorite" | "photo" | null>(null);
  const [featuringId, setFeaturingId] = useState("");
  const [deletingPhotoId, setDeletingPhotoId] = useState("");
  const [mapView, setMapView] = useState<MapView | null>(null);
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

  const baseMapView = fitMapView(mapPoints, fallbackCenter, MAP_WIDTH, MAP_HEIGHT);
  const effectiveMapView = mapView ?? baseMapView;
  const centerLatitude = effectiveMapView.latitude;
  const centerLongitude = effectiveMapView.longitude;
  const zoom = effectiveMapView.zoom;
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
  const favoriteFeaturedPhotoIndexFor = (favoriteId: string) => {
    const favoritePhotos = favoritePhotosFor(favoriteId);
    const featuredIndex = favoritePhotos.findIndex((photo) => photo.is_favorite_featured);
    return featuredIndex === -1 ? 0 : featuredIndex;
  };
  const selectedFavoritePhotos = selectedFavorite ? favoritePhotosFor(selectedFavorite.id) : [];
  const selectedFavoriteHeroPhoto = selectedFavoritePhotos[selectedFavoritePhotoIndex] ?? selectedFavoritePhotos[0] ?? null;
  const SelectedFavoriteIcon = selectedFavorite ? IconForFavorite(selectedFavorite.type) : null;
  const selectedFavoriteMapsUrl = selectedFavorite ? travelFavoriteMapsUrl(selectedFavorite) : null;
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
    setSelectedFavoritePhotoIndex(favoriteFeaturedPhotoIndexFor(favoriteId));
    setEditingDetail(null);
  };

  const openPhoto = (photo: TravelPhoto) => {
    setSelectedFavoriteId(null);
    setSelectedPhotoId(photo.id);
    setEditingDetail(null);
  };

  const closeDetails = () => {
    setSelectedFavoriteId(null);
    setSelectedPhotoId(null);
    setSelectedFavoritePhotoIndex(0);
    setEditingDetail(null);
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

  const setPageFeaturedPhoto = async (photo: TravelPhoto) => {
    setFeaturingId(photo.id);
    try {
      const response = await fetch("/api/travel/items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "photo", id: photo.id, is_featured: true }),
      });
      if (!response.ok) throw new Error("Feature update failed");
      router.refresh();
    } catch {
      window.alert("Could not feature that photo.");
    } finally {
      setFeaturingId("");
    }
  };

  const deletePhoto = async (photo: TravelPhoto) => {
    if (!window.confirm("Delete this photo?")) return;

    setDeletingPhotoId(photo.id);
    try {
      const response = await fetch(`/api/travel/items?type=photo&id=${encodeURIComponent(photo.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Delete failed");
      closeDetails();
      router.refresh();
    } catch {
      window.alert("Could not delete that photo.");
    } finally {
      setDeletingPhotoId("");
    }
  };

  const resetMapView = () => {
    setMapView(null);
  };

  const renderCanvas = (width: number, height: number, markerScale: 1 | 1.4) => {
    const topLeftX = centerX - width / 2;
    const topLeftY = centerY - height / 2;
    const tiles = buildTiles(zoom, topLeftX, topLeftY, width, height);
    const pinSize = markerScale === 1.4 ? "h-11 w-11" : "h-8 w-8";
    const iconSize = markerScale === 1.4 ? "h-5 w-5" : "h-4 w-4";
    const photoSize = markerScale === 1.4 ? "h-12 w-10" : "h-9 w-7";
    const visibleMapItems = [
      ...pinned.map((favorite) => ({ kind: "favorite" as const, id: favorite.id, latitude: favorite.latitude, longitude: favorite.longitude, favorite })),
      ...mappedPhotos.map((photo) => ({ kind: "photo" as const, id: photo.id, latitude: photo.latitude, longitude: photo.longitude, photo })),
    ];
    const renderSingleMapItem = (item: (typeof visibleMapItems)[number], left: number, top: number, index: number) => {
      if (item.kind === "favorite") {
        const favorite = item.favorite;
        const Icon = IconForFavorite(favorite.type);
        const pinPhoto = favoritePinPhotoFor(favorite.id);
        return (
          <button
            key={`favorite-${favorite.id}-${index}`}
            type="button"
            className={
              pinPhoto
                ? `absolute ${photoSize} -translate-x-1/2 -translate-y-full overflow-hidden rounded-[12px_12px_12px_4px] border border-white/80 bg-white p-px shadow-md ring-1 ring-slate-950/15 transition-transform hover:scale-110 ${
                    activeId === favorite.id ? "scale-125 ring-4 ring-white" : ""
                  }`
                : `absolute flex ${pinSize} -translate-x-1/2 -translate-y-full items-center justify-center rounded-full text-white shadow-lg transition-transform ${markerStyle(favorite.type, activeId === favorite.id)}`
            }
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
              <img src={pinPhoto.image_url} alt="" className="h-full w-full rounded-[10px_10px_10px_3px] object-cover" />
            ) : (
              <Icon className={iconSize} />
            )}
            <span className="sr-only">{index + 1}</span>
          </button>
        );
      }

      const photo = item.photo;
      return (
        <button
          key={`photo-${photo.id}-${index}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openPhoto(photo);
          }}
          aria-label="Open photo"
          className={`absolute ${photoSize} -translate-x-1/2 -translate-y-full overflow-hidden rounded-[12px_12px_12px_4px] border border-white/80 bg-white p-px shadow-md ring-1 ring-slate-950/15 transition-transform hover:scale-110`}
          style={{ left, top }}
          title={photo.caption ?? photo.location_name ?? "Photo"}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.image_url} alt="" className="h-full w-full rounded-[10px_10px_10px_3px] object-cover" />
        </button>
      );
    };
    const clusters = Array.from(
      visibleMapItems
        .reduce((clusterMap, item) => {
          const precision = clusterPrecisionForZoom(zoom);
          const key = `${item.latitude.toFixed(precision)}:${item.longitude.toFixed(precision)}`;
          const current = clusterMap.get(key) ?? [];
          current.push(item);
          clusterMap.set(key, current);
          return clusterMap;
        }, new Map<string, typeof visibleMapItems>())
        .values(),
    );

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
        {clusters.map((cluster, index) => {
          const firstItem = cluster[0];
          const clusterLatitude = cluster.reduce((sum, item) => sum + item.latitude, 0) / cluster.length;
          const clusterLongitude = cluster.reduce((sum, item) => sum + item.longitude, 0) / cluster.length;
          const left = lonToX(clusterLongitude, zoom) - topLeftX;
          const top = latToY(clusterLatitude, zoom) - topLeftY;
          const shouldFanCluster = cluster.length > 1 && zoom >= 15;

          if (shouldFanCluster) {
            const spread = markerScale === 1.4 ? 54 : 38;
            return cluster.map((item, clusterItemIndex) => {
              const angle = (clusterItemIndex / cluster.length) * Math.PI * 2 - Math.PI / 2;
              return renderSingleMapItem(
                item,
                lonToX(item.longitude, zoom) - topLeftX + Math.cos(angle) * spread,
                latToY(item.latitude, zoom) - topLeftY + Math.sin(angle) * spread,
                clusterItemIndex,
              );
            });
          }

          if (cluster.length > 1) {
            return (
              <button
                key={cluster.map((item) => `${item.kind}-${item.id}`).join("-")}
                type="button"
                className={`absolute flex ${pinSize} -translate-x-1/2 -translate-y-full items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white shadow-lg ring-4 ring-white transition-transform hover:scale-110`}
                style={{ left, top }}
                title={`${cluster.length} items here`}
                onClick={(event) => {
                  event.stopPropagation();
                  setMapView({
                    latitude: clusterLatitude,
                    longitude: clusterLongitude,
                    zoom: Math.min(16, Math.max(zoom + 2, 12)),
                  });
                }}
              >
                {cluster.length}
              </button>
            );
          }

          return renderSingleMapItem(firstItem, left, top, index);
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
        {mapView && mapPoints.length > 1 && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              resetMapView();
            }}
            className="absolute left-2 top-2 rounded-md bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-950/10 transition-colors hover:bg-white"
          >
            Reset view
          </button>
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
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 p-4" role="dialog" aria-modal="true" onClick={() => setIsExpanded(false)}>
          <div className="relative h-[80vh] w-full max-w-5xl overflow-hidden rounded-xl bg-sky-50 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              aria-label="Close expanded map"
              className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-700 shadow-sm transition-colors hover:bg-white"
            >
              <X className="h-5 w-5" />
            </button>
            {mapView && mapPoints.length > 1 && (
              <button
                type="button"
                onClick={resetMapView}
                className="absolute left-3 top-3 z-10 rounded-md bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white"
              >
                Reset view
              </button>
            )}
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

      {(selectedFavorite || selectedPhoto) && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" onClick={closeDetails}>
          {mapDetailItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  moveMapItem(-1);
                }}
                aria-label="Previous map item"
                className="fixed left-3 top-1/2 z-10 rounded-full bg-white/90 p-3 text-slate-700 shadow-lg transition-colors hover:bg-white sm:left-6"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  moveMapItem(1);
                }}
                aria-label="Next map item"
                className="fixed right-3 top-1/2 z-10 rounded-full bg-white/90 p-3 text-slate-700 shadow-lg transition-colors hover:bg-white sm:right-6"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </>
          )}
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
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
                  {editingDetail === "favorite" ? (
                    <TravelFavoriteModalEditForm
                      favorite={selectedFavorite}
                      onDone={() => setEditingDetail(null)}
                      onCancel={() => setEditingDetail(null)}
                    />
                  ) : (
                    <>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-teal-600">{selectedFavorite.type}</p>
                        <h3 className="mt-1 text-xl font-bold text-slate-950">{selectedFavorite.name}</h3>
                        {selectedFavorite.location_name && <p className="mt-1 text-sm text-slate-500">{selectedFavorite.location_name}</p>}
                        {selectedFavorite.address && <p className="mt-2 text-sm text-slate-600">{selectedFavorite.address}</p>}
                      </div>
                      <p className="text-sm leading-6 text-slate-600">
                        {selectedFavorite.notes?.trim() || "No notes saved yet."}
                      </p>
                      {selectedFavoritePhotos.length > 1 && (
                        <div className="max-h-32 overflow-y-auto pr-1">
                          <div className="grid grid-cols-4 gap-2">
                            {selectedFavoritePhotos.map((photo, index) => (
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
                        </div>
                      )}
                      {selectedFavoriteMapsUrl && (
                        <a
                          href={selectedFavoriteMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open in Maps
                        </a>
                      )}
                      {selectedFavoriteHeroPhoto && (
                        <button
                          type="button"
                          onClick={() => void setFavoritePinPhoto(selectedFavoriteHeroPhoto)}
                          disabled={Boolean(selectedFavoriteHeroPhoto.is_favorite_featured)}
                          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 disabled:text-amber-600"
                        >
                          {selectedFavoriteHeroPhoto.is_favorite_featured ? "Pin photo selected" : "Use current photo as pin"}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditingDetail("favorite")}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                      >
                        Edit favorite
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : selectedPhoto ? (
              <>
                <div className="relative bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedPhoto.image_url} alt="" className="max-h-[52vh] w-full object-contain" />
                </div>
                <div className="space-y-4 p-5">
                  {editingDetail === "photo" ? (
                    <div className="space-y-3">
                      <TravelPhotoModalEditForm
                        photo={selectedPhoto}
                        favorites={favorites}
                        onDone={() => setEditingDetail(null)}
                        onCancel={() => setEditingDetail(null)}
                      />
                      <button
                        type="button"
                        onClick={() => void deletePhoto(selectedPhoto)}
                        disabled={deletingPhotoId === selectedPhoto.id}
                        className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 disabled:cursor-wait disabled:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingPhotoId === selectedPhoto.id ? "Deleting..." : "Delete photo"}
                      </button>
                    </div>
                  ) : (
                    <>
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
                            photos={photos}
                            onDone={closeDetails}
                            onCancel={closeDetails}
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setEditingDetail("photo")}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950"
                      >
                        Edit photo
                      </button>
                      <button
                        type="button"
                        onClick={() => void setPageFeaturedPhoto(selectedPhoto)}
                        disabled={featuringId === selectedPhoto.id || Boolean(selectedPhoto.is_featured)}
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-950 disabled:text-amber-600"
                      >
                        {selectedPhoto.is_featured ? "Page featured" : "Set page featured"}
                      </button>
                    </>
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
