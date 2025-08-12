'use client';

import { useState } from 'react';

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
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [showPlanningModal, setShowPlanningModal] = useState(false);

  return (
    <>
      <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">🌍 Our Travel Map</h2>
          <p className="text-gray-600 mb-6">
            Countries we&apos;ve visited together: {visitedCountries.length}
          </p>
        </div>

        {/* Simple Map Display */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {visitedCountries.map((country) => (
              <div
                key={country.id}
                onClick={() => {
                  setSelectedCountry(country);
                  setShowPlanningModal(true);
                }}
                className="bg-green-100 border-2 border-green-300 rounded-lg p-4 text-center cursor-pointer hover:bg-green-200 transition-colors"
              >
                <div className="text-2xl mb-2">📍</div>
                <div className="font-semibold text-green-800 text-sm">{country.name}</div>
                <div className="text-xs text-green-600 mt-1">Visited</div>
              </div>
            ))}
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

        {/* Memory Cards */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">✨ Travel Memories</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visitedCountries.slice(0, 6).map((country) => (
              <div key={country.id} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                <div className="font-semibold text-gray-800 mb-2">{country.name}</div>
                <div className="text-sm text-gray-600">
                  Amazing memories from our time in {country.name} ✈️
                </div>
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
