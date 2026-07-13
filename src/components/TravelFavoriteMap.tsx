import type { TravelFavorite } from "@/lib/travel";

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
  const pinned = favorites
    .filter((favorite) => favorite.latitude !== null && favorite.longitude !== null)
    .map((favorite) => ({
      ...favorite,
      latitude: favorite.latitude as number,
      longitude: favorite.longitude as number,
    }));

  if (!pinned.length) {
    return (
      <div className="relative mb-4 flex h-64 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-sky-50 text-sm text-slate-400">
        No pinned favorites yet.
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

  return (
    <div className="relative mb-4 h-80 overflow-hidden rounded-lg border border-slate-100 bg-sky-50">
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
          return (
            <div
              key={favorite.id}
              className="absolute flex h-8 w-8 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white shadow-lg ring-2 ring-white"
              style={{ left, top }}
              title={favorite.name}
            >
              {index + 1}
            </div>
          );
        })}
      </div>
      <div className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-1 text-[10px] text-slate-500 shadow-sm">
        © OpenStreetMap contributors
      </div>
    </div>
  );
}
