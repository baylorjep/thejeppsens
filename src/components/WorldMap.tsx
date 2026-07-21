'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';

// 50m instead of 110m: the 110m dataset merges French Guiana into France as a multipolygon,
// causing France to appear highlighted above Brazil. 50m keeps them as separate features.
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

type Tooltip = { name: string; x: number; y: number } | null;
type GeographyItem = {
  rsmKey: string;
  properties: { name: string };
};
type MapPosition = { coordinates: [number, number]; zoom: number };

export type VisitType = 'both' | 'baylor' | 'isabel';

const FILL: Record<VisitType, { default: string; hover: string }> = {
  both:   { default: '#0d9488', hover: '#0f766e' }, // teal
  baylor: { default: '#3b82f6', hover: '#2563eb' }, // blue
  isabel: { default: '#a855f7', hover: '#9333ea' }, // purple
};

interface WorldMapProps {
  visitedMap: Map<string, VisitType>;
  onCountryClick?: (geoName: string) => void;
}

export default function WorldMap({ visitedMap, onCountryClick }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  const [position, setPosition] = useState<MapPosition>({ coordinates: [10, 30], zoom: 1 });
  const isMoved = position.zoom !== 1 || position.coordinates[0] !== 10 || position.coordinates[1] !== 30;

  return (
    <div className="relative w-full touch-none select-none overflow-hidden rounded-xl bg-sky-50">
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md pointer-events-none shadow-lg"
          style={{ left: tooltip.x + 14, top: tooltip.y - 12 }}
        >
          {tooltip.name}
        </div>
      )}
      {isMoved && (
        <button
          type="button"
          onClick={() => setPosition({ coordinates: [10, 30], zoom: 1 })}
          className="absolute left-3 top-3 z-10 rounded-md bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-white"
        >
          Reset view
        </button>
      )}
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 148, center: [10, 30] }}
        height={440}
        style={{ width: '100%', height: 'auto' }}
      >
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          minZoom={1}
          maxZoom={8}
          filterZoomEvent={(event: MouseEvent) => !event.button}
          onMoveEnd={({ coordinates, zoom }: { coordinates: [number, number]; zoom: number }) => {
            setPosition({ coordinates, zoom });
          }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }: { geographies: GeographyItem[] }) =>
              geographies.map((geo) => {
                const visit = visitedMap.get(geo.properties.name);
                const colors = visit ? FILL[visit] : { default: '#cbd5e1', hover: '#94a3b8' };
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onClick={() => {
                      if (visit) onCountryClick?.(geo.properties.name);
                    }}
                    onMouseMove={(e: React.MouseEvent) =>
                      setTooltip({ name: geo.properties.name, x: e.clientX, y: e.clientY })
                    }
                    onMouseLeave={() => setTooltip(null)}
                    style={{
                      default: {
                        fill: colors.default,
                        stroke: '#ffffff',
                        strokeWidth: 0.5 / position.zoom,
                        outline: 'none',
                        cursor: visit ? 'pointer' : 'grab',
                      },
                      hover: {
                        fill: colors.hover,
                        stroke: '#ffffff',
                        strokeWidth: 0.5 / position.zoom,
                        outline: 'none',
                        cursor: visit ? 'pointer' : 'grab',
                      },
                      pressed: { outline: 'none', cursor: 'grabbing' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
