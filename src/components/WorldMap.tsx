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

    // Create a layer group for country boundaries
    const countryBoundaries = L.layerGroup().addTo(map);

    // Function to load country GeoJSON data
    const loadCountryBoundary = async (country: Country) => {
      try {
        // Use a free country boundary API
        const response = await fetch(`https://restcountries.com/v3.1/name/${country.name}?fields=name,cca3`);
        const data = await response.json();
        
        if (data && data[0]) {
          const countryCode = data[0].cca3;
          
          // Load GeoJSON boundary data from Natural Earth Data
          const geoJsonResponse = await fetch(`https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson`);
          const geoJsonData = await geoJsonResponse.json();
          
          // Find the country in the GeoJSON data
          const countryFeature = geoJsonData.features.find((feature: { properties: { ISO_A3?: string; ADMIN?: string } }) => 
            feature.properties.ISO_A3 === countryCode || 
            feature.properties.ADMIN === country.name
          );
          
          if (countryFeature) {
            // Create GeoJSON layer for the country
            const countryLayer = L.geoJSON(countryFeature, {
              style: {
                color: '#10b981',
                weight: 2,
                opacity: 0.8,
                fillColor: '#10b981',
                fillOpacity: 0.3
              }
            }).addTo(countryBoundaries);
            
            // Add hover effects
            countryLayer.on('mouseover', () => {
              countryLayer.setStyle({
                color: '#3b82f6',
                weight: 3,
                opacity: 1,
                fillColor: '#3b82f6',
                fillOpacity: 0.4
              });
            });
            
            countryLayer.on('mouseout', () => {
              countryLayer.setStyle({
                color: '#10b981',
                weight: 2,
                opacity: 0.8,
                fillColor: '#10b981',
                fillOpacity: 0.3
              });
            });
            
            // Add click handler
            countryLayer.on('click', () => {
              setSelectedCountry(country);
              setShowPlanningModal(true);
            });
          }
        }
      } catch (error) {
        console.log(`Could not load boundary for ${country.name}:`, error);
      }
    };

    // Load boundaries for visited countries
    visitedCountries.forEach(country => {
      loadCountryBoundary(country);
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
