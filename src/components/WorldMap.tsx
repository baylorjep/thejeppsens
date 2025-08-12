/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useRef, useState } from 'react';

interface Country {
  id: string;
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
}

interface WorldMapProps {
  visitedCountries: Country[];
}

interface GoogleMapsAPI {
  maps: {
    Map: new (element: HTMLElement, options: object) => any;
    MapTypeId: { ROADMAP: string };
    Marker: new (options: object) => any;
    InfoWindow: new (options: object) => any;
    SymbolPath: { CIRCLE: number };
  };
}

declare global {
  interface Window {
    google: GoogleMapsAPI;
  }
}

export default function WorldMap({ visitedCountries }: WorldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        // Check if already loaded
        if (window.google && window.google.maps) {
          initializeMap();
          return;
        }

        // Load Google Maps API
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          setError('Google Maps API key not configured');
          setIsLoading(false);
          return;
        }

        // Create script element
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          console.log('Google Maps loaded successfully');
          initializeMap();
        };

        script.onerror = () => {
          console.error('Failed to load Google Maps');
          setError('Failed to load Google Maps API');
          setIsLoading(false);
        };

        document.head.appendChild(script);
      } catch (err) {
        console.error('Error loading Google Maps:', err);
        setError('Failed to initialize map');
        setIsLoading(false);
      }
    };

    const initializeMap = () => {
      try {
        if (!mapRef.current || !window.google || !window.google.maps) {
          setError('Map initialization failed');
          setIsLoading(false);
          return;
        }

        // Create map
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 30, lng: 0 },
          zoom: 2,
          mapTypeId: window.google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: 'administrative.country',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#10b981' }, { weight: 2 }]
            },
            {
              featureType: 'administrative.country',
              elementType: 'geometry.fill',
              stylers: [{ color: '#10b981' }, { opacity: 0.3 }]
            }
          ]
        });

        // Add markers for visited countries
        visitedCountries.forEach((country) => {
          const marker = new window.google.maps.Marker({
            position: { lat: country.coordinates[0], lng: country.coordinates[1] },
            map: map,
            title: country.name,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: '#10b981',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2
            }
          });

          // Add click listener for trip planning
          marker.addListener('click', () => {
            setSelectedCountry(country);
            setShowPlanningModal(true);
          });

          // Add hover tooltip
          const infoWindow = new window.google.maps.InfoWindow({
            content: `
              <div style="padding: 8px; text-align: center; min-width: 150px;">
                <h3 style="margin: 0 0 4px 0; color: #1f2937; font-weight: 600;">${country.name}</h3>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Visited together ✈️</p>
              </div>
            `
          });

          marker.addListener('mouseover', () => {
            infoWindow.open(map, marker);
          });

          marker.addListener('mouseout', () => {
            infoWindow.close();
          });
        });

        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to create map');
        setIsLoading(false);
      }
    };

    loadGoogleMaps();
  }, [visitedCountries]);

  if (error) {
    return (
      <div className="w-full h-full rounded-lg flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 text-lg font-semibold mb-2">Map Error</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg relative"
        style={{ 
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          minHeight: '600px'
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading map...</p>
            </div>
          </div>
        )}
      </div>

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
