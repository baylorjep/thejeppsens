'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

// 50m instead of 110m: the 110m dataset merges French Guiana into France as a multipolygon,
// causing France to appear highlighted above Brazil. 50m keeps them as separate features.
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

type Tooltip = { name: string; x: number; y: number } | null;
type GeographyItem = {
  rsmKey: string;
  properties: { name: string };
};

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

  return (
    <div className="relative w-full select-none bg-sky-50 rounded-xl overflow-hidden">
      {tooltip && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-md pointer-events-none shadow-lg"
          style={{ left: tooltip.x + 14, top: tooltip.y - 12 }}
        >
          {tooltip.name}
        </div>
      )}
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 148, center: [10, 30] }}
        height={440}
        style={{ width: '100%', height: 'auto' }}
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
                      strokeWidth: 0.5,
                      outline: 'none',
                      cursor: visit ? 'pointer' : 'default',
                    },
                    hover: {
                      fill: colors.hover,
                      stroke: '#ffffff',
                      strokeWidth: 0.5,
                      outline: 'none',
                      cursor: visit ? 'pointer' : 'default',
                    },
                    pressed: { outline: 'none' },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
