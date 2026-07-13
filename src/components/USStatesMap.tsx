'use client';

import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import type { VisitType } from '@/components/WorldMap';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

type Tooltip = { name: string; x: number; y: number } | null;
type GeographyItem = {
  rsmKey: string;
  properties: { name: string };
};

const FILL: Record<VisitType, { default: string; hover: string }> = {
  both: { default: '#0d9488', hover: '#0f766e' },
  baylor: { default: '#3b82f6', hover: '#2563eb' },
  isabel: { default: '#a855f7', hover: '#9333ea' },
};

interface USStatesMapProps {
  visitedByState: Record<string, VisitType>;
  hrefByState?: Record<string, string>;
}

export default function USStatesMap({ visitedByState, hrefByState = {} }: USStatesMapProps) {
  const [tooltip, setTooltip] = useState<Tooltip>(null);

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
      </ComposableMap>
    </div>
  );
}
