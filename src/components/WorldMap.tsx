'use client';

import { useEffect, useRef, useState } from 'react';
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

// Extend the marker type to include our custom property
interface ExtendedMarker extends L.Marker {
  highlightLayer?: L.GeoJSON;
}

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as { _getIconUrl?: string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function WorldMap({ visitedCountries }: WorldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showPlanningModal, setShowPlanningModal] = useState(false);

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

    // Add a map tile layer with English labels (CartoDB Positron)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors, © CartoDB',
      subdomains: 'abcd',
      maxZoom: 19,
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
      }).addTo(map) as ExtendedMarker;

      // Add hover tooltip
      marker.bindTooltip(country.name, {
        permanent: false,
        direction: 'top',
        className: 'custom-tooltip',
        offset: [0, -10]
      });

      // Add popup with country information and planning option
      marker.bindPopup(`
        <div style="text-align: center; padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600;">${country.name}</h3>
          <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">Visited together ✈️</p>
          <button 
            onclick="window.planTripToCountry('${country.id}')"
            style="
              background-color: #3b82f6;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
              transition: background-color 0.2s;
            "
            onmouseover="this.style.backgroundColor='#2563eb'"
            onmouseout="this.style.backgroundColor='#3b82f6'"
          >
            Plan Next Trip
          </button>
        </div>
      `);

      // Add hover effects with country highlighting
      marker.on('mouseover', () => {
        // Update marker appearance
        marker.setIcon(L.divIcon({
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
        
        // Highlight the country by adding a semi-transparent overlay
        // This is a simplified approach - for full country boundaries you'd need GeoJSON data
        const highlightLayer = L.circle(country.coordinates, {
          radius: 800000, // Larger radius to cover more of the country
          color: '#3b82f6',
          weight: 3,
          opacity: 0.8,
          fillColor: '#3b82f6',
          fillOpacity: 0.15
        }).addTo(map);
        
        // Store reference to remove later
        marker.highlightLayer = highlightLayer as any;
      });

      marker.on('mouseout', () => {
        // Reset marker appearance
        marker.setIcon(L.divIcon({
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
        
        // Remove highlight layer
        if (marker.highlightLayer) {
          map.removeLayer(marker.highlightLayer);
          marker.highlightLayer = undefined;
        }
      });

      // Add click handler for planning trips
      marker.on('click', () => {
        setSelectedCountry(country);
        setShowPlanningModal(true);
      });
    });

    // Add global function for popup buttons
    (window as Window & { planTripToCountry?: (countryId: string) => void }).planTripToCountry = (countryId: string) => {
      const country = visitedCountries.find(c => c.id === countryId);
      if (country) {
        setSelectedCountry(country);
        setShowPlanningModal(true);
      }
    };

    mapInstanceRef.current = map;

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      delete (window as Window & { planTripToCountry?: (countryId: string) => void }).planTripToCountry;
    };
  }, [visitedCountries]);

  return (
    <>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg"
        style={{ 
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          minHeight: '600px'
        }}
      />

      {/* Planning Modal */}
      {showPlanningModal && selectedCountry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                Plan Trip to {selectedCountry.name}
              </h3>
              <p className="text-gray-600">When would you like to visit next?</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Season
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Spring</option>
                  <option>Summer</option>
                  <option>Fall</option>
                  <option>Winter</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trip Duration
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Weekend getaway</option>
                  <option>1 week</option>
                  <option>2 weeks</option>
                  <option>Month+</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea 
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="What would you like to do there?"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPlanningModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Here you could save the trip plan
                  alert(`Trip to ${selectedCountry.name} planned! ✈️`);
                  setShowPlanningModal(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Plan Trip
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
