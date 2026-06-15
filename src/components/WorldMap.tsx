'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

// 50m instead of 110m: the 110m dataset merges French Guiana into France as a multipolygon,
// causing France to appear highlighted above Brazil. 50m keeps them as separate features.
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';

const VISITED: Set<string> = new Set([
  'United States of America',
  'Mexico',
  'Dominican Rep.',
  'Cuba',
  'Germany',
  'Austria',
  'Switzerland',
  'France',
  'Belgium',
  'Netherlands',
  'Luxembourg',
  'Czechia',
  'United Kingdom',
  'Italy',
  'Greece',
  'Turkey',
  'Australia',
]);

type Tooltip = { name: string; x: number; y: number } | null;
type GeographyItem = {
  rsmKey: string;
  properties: {
    name: string;
  };
};

export default function WorldMap() {
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
              const visited = VISITED.has(geo.properties.name);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseMove={(e: React.MouseEvent) =>
                    setTooltip({ name: geo.properties.name, x: e.clientX, y: e.clientY })
                  }
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: {
                      fill: visited ? '#0d9488' : '#cbd5e1',
                      stroke: '#ffffff',
                      strokeWidth: 0.5,
                      outline: 'none',
                    },
                    hover: {
                      fill: visited ? '#0f766e' : '#94a3b8',
                      stroke: '#ffffff',
                      strokeWidth: 0.5,
                      outline: 'none',
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
