'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Country {
  id: string;
  name: string;
  visited: boolean;
  coordinates: [number, number];
}

interface WorldMapProps {
  visitedCountries: Country[];
}

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function WorldMap({ visitedCountries }: WorldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize the map
    const map = L.map(mapRef.current, {
      center: [30, 0],
      zoom: 2,
      zoomControl: true,
      scrollWheelZoom: false,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: false,
      keyboard: false,
    });

    // Add a beautiful tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    // Add markers for visited countries
    visitedCountries.forEach((country) => {
      const marker = L.marker(country.coordinates, {
        icon: L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              width: 20px;
              height: 20px;
              background-color: #10b981;
              border: 3px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              cursor: pointer;
              transition: all 0.2s ease;
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      }).addTo(map);

      // Add popup with country information
      marker.bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600;">${country.name}</h3>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Visited together ✈️</p>
        </div>
      `);

      // Add hover effects
      marker.on('mouseover', function() {
        this.setIcon(L.divIcon({
          className: 'custom-marker-hover',
          html: `
            <div style="
              width: 24px;
              height: 24px;
              background-color: #3b82f6;
              border: 3px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 4px 8px rgba(0,0,0,0.4);
              cursor: pointer;
              transition: all 0.2s ease;
            "></div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }));
      });

      marker.on('mouseout', function() {
        this.setIcon(L.divIcon({
          className: 'custom-marker',
          html: `
            <div style="
              width: 20px;
              height: 20px;
              background-color: #10b981;
              border: 3px solid #ffffff;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              cursor: pointer;
              transition: all 0.2s ease;
            "></div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }));
      });
    });

    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [visitedCountries]);

  return (
    <div 
      ref={mapRef} 
      className="w-full h-full rounded-lg"
      style={{ 
        background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
        minHeight: '600px'
      }}
    />
  );
}
