'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import type { VisitType } from '@/components/WorldMap';
import type { TravelStatePhotoPreview } from '@/lib/travel';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

type Tooltip = { name: string; x: number; y: number } | null;
type GeographyItem = {
  rsmKey: string;
  properties: { name: string };
};
type StatePhotoMarker = {
  stateName: string;
  photo: TravelStatePhotoPreview;
  coordinates: [number, number];
  href: string | undefined;
};

const FILL: Record<VisitType, { default: string; hover: string }> = {
  both: { default: '#0d9488', hover: '#0f766e' },
  baylor: { default: '#3b82f6', hover: '#2563eb' },
  isabel: { default: '#a855f7', hover: '#9333ea' },
};

interface USStatesMapProps {
  visitedByState: Record<string, VisitType>;
  hrefByState?: Record<string, string>;
  photoPreviewByState?: Record<string, TravelStatePhotoPreview>;
}

const STATE_CENTERS: Record<string, [number, number]> = {
  Alabama: [-86.8, 32.8],
  Alaska: [-152.4, 64.2],
  Arizona: [-111.6, 34.2],
  Arkansas: [-92.4, 34.8],
  California: [-119.7, 36.8],
  Colorado: [-105.5, 39],
  Connecticut: [-72.7, 41.6],
  Delaware: [-75.5, 39],
  Florida: [-81.7, 27.8],
  Georgia: [-83.5, 32.6],
  Hawaii: [-157.5, 20.8],
  Idaho: [-114.6, 44.1],
  Illinois: [-89.2, 40],
  Indiana: [-86.1, 40],
  Iowa: [-93.5, 42.1],
  Kansas: [-98.4, 38.5],
  Kentucky: [-85.3, 37.8],
  Louisiana: [-91.9, 31.1],
  Maine: [-69, 45.3],
  Maryland: [-76.7, 39],
  Massachusetts: [-71.8, 42.3],
  Michigan: [-85.6, 44.3],
  Minnesota: [-94.3, 46.3],
  Mississippi: [-89.7, 32.7],
  Missouri: [-92.6, 38.5],
  Montana: [-110.4, 47],
  Nebraska: [-99.8, 41.5],
  Nevada: [-116.6, 39.3],
  'New Hampshire': [-71.6, 43.7],
  'New Jersey': [-74.5, 40.1],
  'New Mexico': [-106.1, 34.4],
  'New York': [-75.5, 42.9],
  'North Carolina': [-79, 35.5],
  'North Dakota': [-100.5, 47.5],
  Ohio: [-82.8, 40.3],
  Oklahoma: [-97.5, 35.6],
  Oregon: [-120.6, 44],
  Pennsylvania: [-77.7, 41],
  'Rhode Island': [-71.5, 41.7],
  'South Carolina': [-80.9, 33.8],
  'South Dakota': [-100.2, 44.4],
  Tennessee: [-86.4, 35.8],
  Texas: [-99.3, 31],
  Utah: [-111.7, 39.3],
  Vermont: [-72.7, 44],
  Virginia: [-78.6, 37.5],
  Washington: [-120.7, 47.4],
  'West Virginia': [-80.6, 38.6],
  Wisconsin: [-89.8, 44.6],
  Wyoming: [-107.5, 43],
};

export default function USStatesMap({ visitedByState, hrefByState = {}, photoPreviewByState = {} }: USStatesMapProps) {
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  const statePhotoMarkers = Object.entries(photoPreviewByState)
    .map(([stateName, photo]) => ({
      stateName,
      photo,
      coordinates: STATE_CENTERS[stateName],
      href: hrefByState[stateName] as string | undefined,
    }))
    .filter((marker): marker is StatePhotoMarker => Boolean(marker.coordinates));

  return (
    <div className="relative w-full select-none overflow-hidden rounded-xl bg-sky-50">
      {tooltip && (
        <div
          className="fixed z-50 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg pointer-events-none"
          style={{ left: tooltip.x + 14, top: tooltip.y - 12 }}
        >
          {tooltip.name}
        </div>
      )}
      <ComposableMap projection="geoAlbersUsa" height={440} style={{ width: '100%', height: 'auto' }}>
        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: GeographyItem[] }) =>
            geographies.map((geo) => {
              const visit = visitedByState[geo.properties.name];
              const href = hrefByState[geo.properties.name];
              const colors = visit ? FILL[visit] : { default: '#cbd5e1', hover: '#94a3b8' };
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    if (href) window.location.href = href;
                  }}
                  onMouseMove={(e: React.MouseEvent) =>
                    setTooltip({ name: geo.properties.name, x: e.clientX, y: e.clientY })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: { fill: colors.default, stroke: '#ffffff', strokeWidth: 0.75, outline: 'none', cursor: href ? 'pointer' : 'default' },
                    hover: { fill: colors.hover, stroke: '#ffffff', strokeWidth: 0.75, outline: 'none', cursor: href ? 'pointer' : 'default' },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>
        {statePhotoMarkers.map(({ stateName, photo, coordinates, href }) => (
          <Marker key={photo.state_id} coordinates={coordinates}>
            <foreignObject x={-31} y={-58} width={62} height={70}>
              <button
                type="button"
                aria-label={`Open ${stateName} photos`}
                className="group block h-[62px] w-[62px] overflow-hidden rounded-xl border-2 border-white bg-white p-0.5 shadow-lg ring-1 ring-slate-950/10 transition-transform hover:-translate-y-0.5 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-500"
                onClick={() => {
                  if (href) window.location.href = href;
                }}
                onMouseMove={(e) => setTooltip({ name: photo.caption ?? photo.location_name ?? stateName, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.image_url} alt={photo.caption ?? photo.location_name ?? stateName} className="h-full w-full rounded-[9px] object-cover" />
              </button>
            </foreignObject>
          </Marker>
        ))}
      </ComposableMap>
    </div>
  );
}
