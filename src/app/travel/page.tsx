'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { MapPin, Plane, Heart } from 'lucide-react';

interface Country {
  id: string;
  name: string;
  visited: boolean;
  path: string;
}

export default function TravelPage() {
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Countries you've visited together
  const visitedCountries = [
    'usa', 'mexico', 'dominican-republic', 'cuba', 'germany', 'austria', 
    'switzerland', 'france', 'belgium', 'netherlands', 'luxembourg', 
    'czech-republic', 'england', 'italy', 'greece', 'turkey'
  ];

  // Simplified world map data - you can replace with more detailed SVG paths
  const countries: Country[] = [
    { id: 'usa', name: 'United States', visited: true, path: 'M 100 150 L 200 150 L 200 200 L 100 200 Z' },
    { id: 'mexico', name: 'Mexico', visited: true, path: 'M 80 180 L 120 180 L 120 220 L 80 220 Z' },
    { id: 'dominican-republic', name: 'Dominican Republic', visited: true, path: 'M 150 200 L 160 200 L 160 210 L 150 210 Z' },
    { id: 'cuba', name: 'Cuba', visited: true, path: 'M 140 190 L 150 190 L 150 200 L 140 200 Z' },
    { id: 'germany', name: 'Germany', visited: true, path: 'M 450 120 L 470 120 L 470 140 L 450 140 Z' },
    { id: 'austria', name: 'Austria', visited: true, path: 'M 460 130 L 480 130 L 480 150 L 460 150 Z' },
    { id: 'switzerland', name: 'Switzerland', visited: true, path: 'M 450 130 L 460 130 L 460 140 L 450 140 Z' },
    { id: 'france', name: 'France', visited: true, path: 'M 430 120 L 450 120 L 450 150 L 430 150 Z' },
    { id: 'belgium', name: 'Belgium', visited: true, path: 'M 440 110 L 450 110 L 450 120 L 440 120 Z' },
    { id: 'netherlands', name: 'Netherlands', visited: true, path: 'M 440 100 L 450 100 L 450 110 L 440 110 Z' },
    { id: 'luxembourg', name: 'Luxembourg', visited: true, path: 'M 445 115 L 450 115 L 450 120 L 445 120 Z' },
    { id: 'czech-republic', name: 'Czech Republic', visited: true, path: 'M 470 125 L 485 125 L 485 140 L 470 140 Z' },
    { id: 'england', name: 'England', visited: true, path: 'M 420 110 L 430 110 L 430 125 L 420 125 Z' },
    { id: 'italy', name: 'Italy', visited: true, path: 'M 450 140 L 470 140 L 470 170 L 450 170 Z' },
    { id: 'greece', name: 'Greece', visited: true, path: 'M 480 150 L 490 150 L 490 160 L 480 160 Z' },
    { id: 'turkey', name: 'Turkey', visited: true, path: 'M 490 140 L 520 140 L 520 160 L 490 160 Z' },
    // Add more countries as needed
  ];

  const getCountryStyle = (country: Country) => {
    if (country.visited) {
      return {
        fill: hoveredCountry === country.id ? '#3b82f6' : '#10b981',
        stroke: '#059669',
        strokeWidth: 1,
        cursor: 'pointer',
        transition: 'fill 0.2s ease-in-out'
      };
    }
    return {
      fill: hoveredCountry === country.id ? '#e5e7eb' : '#f3f4f6',
      stroke: '#d1d5db',
      strokeWidth: 1,
      cursor: 'pointer',
      transition: 'fill 0.2s ease-in-out'
    };
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              <Plane className="inline-block h-8 w-8 text-blue-600 mr-3" />
              Our Travel Map
            </h1>
            <p className="text-xl text-gray-600">Explore the world we&apos;ve discovered together</p>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{visitedCountries.length}</div>
              <div className="text-gray-600">Countries Visited</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">4</div>
              <div className="text-gray-600">Continents Explored</div>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">∞</div>
              <div className="text-gray-600">Memories Made</div>
            </div>
          </div>

          {/* Interactive Map */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">World Map</h2>
              <p className="text-gray-600">Hover over countries to see names. Green = visited together</p>
            </div>
            
            <div className="relative w-full h-[600px] bg-blue-50 rounded-lg overflow-hidden">
              {/* Simplified world map - you can replace with a more detailed SVG */}
              <svg 
                viewBox="0 0 600 400" 
                className="w-full h-full"
                style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' }}
              >
                {/* Background continents */}
                <path 
                  d="M 50 100 L 550 100 L 550 350 L 50 350 Z" 
                  fill="#e0f2fe" 
                  stroke="#0284c7" 
                  strokeWidth="2"
                />
                
                {/* Country paths */}
                {countries.map((country) => (
                  <path
                    key={country.id}
                    d={country.path}
                    style={getCountryStyle(country)}
                    onMouseEnter={() => setHoveredCountry(country.id)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  />
                ))}
                
                {/* Hover tooltip */}
                {hoveredCountry && (
                  <text
                    x="300"
                    y="50"
                    textAnchor="middle"
                    className="text-sm font-semibold"
                    fill="#1f2937"
                  >
                    {countries.find(c => c.id === hoveredCountry)?.name}
                  </text>
                )}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex justify-center space-x-8 mt-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-600">Visited Together</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <span className="text-sm text-gray-600">Not Yet Visited</span>
              </div>
            </div>
          </div>

          {/* Travel Memories */}
          <div className="mt-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
              <Heart className="inline-block h-8 w-8 text-red-500 mr-3" />
              Travel Memories
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visitedCountries.slice(0, 6).map((countryId) => {
                const country = countries.find(c => c.id === countryId);
                return (
                  <div key={countryId} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                    <div className="flex items-center space-x-3 mb-4">
                      <MapPin className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-800">{country?.name}</h3>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Amazing memories made in {country?.name} together. 
                      Can&apos;t wait to explore more of this beautiful country!
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Future Travel Plans */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-8 border border-blue-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">
              Where to Next?
            </h2>
            <p className="text-gray-600 text-center mb-6">
              Planning our next adventure together. Any suggestions?
            </p>
            <div className="flex justify-center space-x-4">
              <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Add Destination
              </button>
              <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                View Wishlist
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
