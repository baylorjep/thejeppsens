'use client';

import { useState } from 'react';

interface Country {
  id: string;
  name: string;
  coordinates: [number, number]; // [latitude, longitude]
}

interface WorldMapProps {
  visitedCountries: Country[];
}

export default function WorldMap({ visitedCountries }: WorldMapProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Create a simple world map with SVG
  const worldMapData = [
    { id: 'usa', name: 'USA', path: 'M 100 150 L 120 140 L 140 150 L 120 160 Z', visited: true },
    { id: 'mexico', name: 'Mexico', path: 'M 80 170 L 100 160 L 120 170 L 100 180 Z', visited: true },
    { id: 'dominican-republic', name: 'Dominican Republic', path: 'M 130 180 L 140 175 L 145 180 L 140 185 Z', visited: true },
    { id: 'cuba', name: 'Cuba', path: 'M 125 175 L 135 170 L 140 175 L 135 180 Z', visited: true },
    { id: 'germany', name: 'Germany', path: 'M 250 120 L 260 115 L 270 120 L 260 125 Z', visited: true },
    { id: 'austria', name: 'Austria', path: 'M 255 125 L 265 120 L 270 125 L 265 130 Z', visited: true },
    { id: 'switzerland', name: 'Switzerland', path: 'M 245 125 L 255 120 L 260 125 L 255 130 Z', visited: true },
    { id: 'france', name: 'France', path: 'M 240 130 L 250 125 L 260 130 L 250 135 Z', visited: true },
    { id: 'belgium', name: 'Belgium', path: 'M 245 120 L 255 115 L 260 120 L 255 125 Z', visited: true },
    { id: 'netherlands', name: 'Netherlands', path: 'M 245 115 L 255 110 L 260 115 L 255 120 Z', visited: true },
    { id: 'luxembourg', name: 'Luxembourg', path: 'M 250 125 L 255 120 L 260 125 L 255 130 Z', visited: true },
    { id: 'czech-republic', name: 'Czech Republic', path: 'M 260 125 L 270 120 L 275 125 L 270 130 Z', visited: true },
    { id: 'england', name: 'England', path: 'M 235 120 L 245 115 L 250 120 L 245 125 Z', visited: true },
    { id: 'italy', name: 'Italy', path: 'M 250 140 L 260 135 L 270 140 L 260 145 Z', visited: true },
    { id: 'greece', name: 'Greece', path: 'M 270 140 L 280 135 L 285 140 L 280 145 Z', visited: true },
    { id: 'turkey', name: 'Turkey', path: 'M 280 135 L 290 130 L 295 135 L 290 140 Z', visited: true },
  ];

  return (
    <>
      <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">🌍 Our Travel Map</h2>
          <p className="text-gray-600 mb-6">
            Countries we&apos;ve visited together: {visitedCountries.length}
          </p>
        </div>

        {/* Interactive SVG World Map */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex justify-center">
            <svg 
              width="600" 
              height="400" 
              viewBox="0 0 600 400" 
              className="w-full max-w-2xl"
            >
              {/* Background */}
              <rect width="600" height="400" fill="#f0f9ff" />
              
              {/* World Map Outline */}
              <path 
                d="M 50 100 L 550 100 L 550 300 L 50 300 Z" 
                fill="#e0f2fe" 
                stroke="#0284c7" 
                strokeWidth="2"
              />
              
              {/* Country markers */}
              {worldMapData.map((country) => (
                <g key={country.id}>
                  <path
                    d={country.path}
                    fill={country.visited ? "#10b981" : "#e5e7eb"}
                    stroke="#ffffff"
                    strokeWidth="1"
                    className="cursor-pointer transition-all duration-200 hover:fill-opacity-80"
                    onMouseEnter={() => setHoveredCountry(country.id)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    onClick={() => {
                      const countryData = visitedCountries.find(c => c.name.toLowerCase().includes(country.name.toLowerCase()));
                      if (countryData) {
                        setSelectedCountry(countryData);
                        setShowPlanningModal(true);
                      }
                    }}
                  />
                  {hoveredCountry === country.id && (
                    <text
                      x="300"
                      y="50"
                      textAnchor="middle"
                      fill="#1f2937"
                      fontSize="14"
                      fontWeight="600"
                    >
                      {country.name}
                    </text>
                  )}
                </g>
              ))}
              
              {/* Legend */}
              <g transform="translate(20, 350)">
                <rect width="15" height="15" fill="#10b981" />
                <text x="25" y="12" fontSize="12" fill="#374151">Visited</text>
                <rect x="80" width="15" height="15" fill="#e5e7eb" />
                <text x="105" y="12" fontSize="12" fill="#374151">Not visited</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Travel Statistics */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{visitedCountries.length}</div>
            <div className="text-gray-600">Countries Visited</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">16</div>
            <div className="text-gray-600">Total Countries</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">4</div>
            <div className="text-gray-600">Continents</div>
          </div>
        </div>

        {/* Country List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">✨ Countries We&apos;ve Visited</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {visitedCountries.map((country) => (
              <div
                key={country.id}
                onClick={() => {
                  setSelectedCountry(country);
                  setShowPlanningModal(true);
                }}
                className="bg-green-100 border border-green-300 rounded-lg p-3 text-center cursor-pointer hover:bg-green-200 transition-colors"
              >
                <div className="text-lg mb-1">📍</div>
                <div className="font-semibold text-green-800 text-sm">{country.name}</div>
              </div>
            ))}
          </div>
        </div>
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
