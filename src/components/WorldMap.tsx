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

    // Load the newer Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=console.debug&libraries=maps,marker&v=beta`;
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
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [visitedCountries, initGoogleMap]);

  const initGoogleMap = () => {
    if (!mapRef.current || !window.google) return;

    // Create the map using the newer API
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: 30, lng: 0 },
      zoom: 2,
      mapId: 'DEMO_MAP_ID',
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
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        position: { lat: country.coordinates[0], lng: country.coordinates[1] },
        map: map,
        title: country.name,
        content: createMarkerContent(country.name)
      });

      // Add click listener for trip planning
      marker.addListener('click', () => {
        setSelectedCountry(country);
        setShowPlanningModal(true);
      });
    });
  };

  const createMarkerContent = (countryName: string) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="
        width: 16px;
        height: 16px;
        background-color: #10b981;
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.2s ease;
      " title="${countryName}"></div>
    `;
    return div;
  };

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
                  <li>3. Enable &quot;Maps JavaScript API&quot;</li>
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
                I&apos;ll set it up later
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
