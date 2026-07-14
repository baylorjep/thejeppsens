"use client";

import TravelEditButton from "@/components/TravelEditButton";
import TravelQuickAddButton from "@/components/TravelQuickAddButton";
import type { TravelFavorite } from "@/lib/travel";
import { MapPin, Sparkles, Utensils } from "lucide-react";
import { useState } from "react";

const TILE_SIZE = 256;
const MAP_WIDTH = 768;
const MAP_HEIGHT = 320;

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

interface TravelFavoriteMapProps {
  favorites: TravelFavorite[];
}

export default function TravelFavoriteMap({ favorites }: TravelFavoriteMapProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const pinned = favorites
    .filter((favorite) => favorite.latitude !== null && favorite.longitude !== null)
    .map((favorite) => ({
      ...favorite,
      latitude: favorite.latitude as number,
      longitude: favorite.longitude as number,
    }));

  if (!pinned.length) {
    return (
      <div className="relative mb-4 flex h-64 flex-col items-center justify-center gap-3 overflow-hidden rounded-lg border border-dashed border-slate-200 bg-sky-50 text-center">
        <MapPin className="h-7 w-7 text-slate-300" />
        <p className="text-sm text-slate-400">No pinned favorites yet.</p>
        <TravelQuickAddButton kind="favorite" label="Add first favorite" />
      </div>
    );
  }

  const centerLatitude = pinned.reduce((sum, favorite) => sum + favorite.latitude, 0) / pinned.length;
  const centerLongitude = pinned.reduce((sum, favorite) => sum + favorite.longitude, 0) / pinned.length;
  const zoom = pickZoom(pinned);
  const centerX = lonToX(centerLongitude, zoom);
  const centerY = latToY(centerLatitude, zoom);
  const topLeftX = centerX - MAP_WIDTH / 2;
  const topLeftY = centerY - MAP_HEIGHT / 2;
  const tileStartX = Math.floor(topLeftX / TILE_SIZE);
  const tileStartY = Math.floor(topLeftY / TILE_SIZE);
  const tileEndX = Math.floor((topLeftX + MAP_WIDTH) / TILE_SIZE);
  const tileEndY = Math.floor((topLeftY + MAP_HEIGHT) / TILE_SIZE);
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

  const markerStyle = (type: TravelFavorite["type"], isActive: boolean) => {
    const color = type === "restaurant" ? "bg-rose-600" : type === "activity" ? "bg-amber-500" : "bg-teal-600";
    return `${color} ${isActive ? "scale-125 ring-4 ring-white" : "ring-2 ring-white"}`;
  };
  const IconForFavorite = (type: TravelFavorite["type"]) => (type === "restaurant" ? Utensils : type === "activity" ? Sparkles : MapPin);

  return (
    <div className="space-y-4">
    <div className="relative h-80 overflow-hidden rounded-lg border border-slate-100 bg-sky-50">
      <div className="absolute left-1/2 top-1/2 h-80 w-[768px] -translate-x-1/2 -translate-y-1/2 overflow-hidden">
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
          return (
            <div
              key={favorite.id}
              className={`absolute flex h-8 w-8 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full text-white shadow-lg transition-transform ${markerStyle(favorite.type, activeId === favorite.id)}`}
              style={{ left, top }}
              title={favorite.name}
              onMouseEnter={() => setActiveId(favorite.id)}
              onMouseLeave={() => setActiveId(null)}
            >
              <Icon className="h-4 w-4" />
              <span className="sr-only">{index + 1}</span>
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-[10px] text-slate-500 shadow-sm">
        © OpenStreetMap contributors
      </div>
    </div>
      <div className="space-y-2">
        {favorites.slice(0, 8).map((favorite) => {
          const Icon = IconForFavorite(favorite.type);
          const isActive = activeId === favorite.id;
          return (
            <div
              key={favorite.id}
              onMouseEnter={() => setActiveId(favorite.id)}
              onMouseLeave={() => setActiveId(null)}
              className={`flex items-start justify-between gap-3 rounded-lg p-3 transition-colors ${isActive ? "bg-slate-100" : "bg-slate-50"}`}
            >
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
          );
        })}
      </div>
    </div>
  );
}
