'use client';

import { useEffect, useRef, useState } from 'react';

interface Country {
  id: string;
  name: string;
  visited: boolean;
  coordinates: [number, number];
}

interface WorldMapProps {
  visitedCountries: Country[];
}

export default function WorldMap({ visitedCountries }: WorldMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  useEffect(() => {
    if (!mapRef.current) return;

    // Check if Google Maps API key is available
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      setShowApiKeyModal(true);
      return;
    }

    // Load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      initGoogleMap();
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      setShowApiKeyModal(true);
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [visitedCountries]);

  const initGoogleMap = () => {
    if (!mapRef.current || !window.google) return;

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
  };

  return (
    <>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg relative"
        style={{ 
          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
          minHeight: '600px'
        }}
      />

      {/* API Key Setup Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                🌍 Interactive Travel Map Setup
              </h3>
              <p className="text-gray-600">To enable the interactive map with country highlighting, you need a Google Maps API key.</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">🚀 Perfect for YC Demo!</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Real country boundaries with hover effects</li>
                  <li>• Professional Google Maps integration</li>
                  <li>• Interactive trip planning features</li>
                  <li>• $200/month free credit (plenty for personal use)</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">📋 Setup Steps:</h4>
                <ol className="text-sm text-gray-700 space-y-1">
                  <li>1. Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                  <li>2. Create a new project or select existing</li>
                  <li>3. Enable "Maps JavaScript API"</li>
                  <li>4. Create credentials (API key)</li>
                  <li>5. Add to your .env.local: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here</li>
                </ol>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowApiKeyModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                I'll set it up later
              </button>
              <button
                onClick={() => window.open('https://console.cloud.google.com/', '_blank')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Get API Key Now
              </button>
            </div>
          </div>
        </div>
      )}

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
