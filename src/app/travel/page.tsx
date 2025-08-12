'use client';

import Header from '@/components/Header';
import { MapPin, Plane, Heart } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import the map component to avoid SSR issues
const WorldMap = dynamic(() => import('@/components/WorldMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-blue-50 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading world map...</p>
      </div>
    </div>
  )
});

interface Country {
  id: string;
  name: string;
  visited: boolean;
  coordinates: [number, number]; // [latitude, longitude]
}

export default function TravelPage() {
  // Countries you've visited together with their coordinates
  const visitedCountries: Country[] = [
    { id: 'usa', name: 'United States', visited: true, coordinates: [39.8283, -98.5795] },
    { id: 'mexico', name: 'Mexico', visited: true, coordinates: [23.6345, -102.5528] },
    { id: 'dominican-republic', name: 'Dominican Republic', visited: true, coordinates: [18.7357, -70.1627] },
    { id: 'cuba', name: 'Cuba', visited: true, coordinates: [21.5218, -77.7812] },
    { id: 'germany', name: 'Germany', visited: true, coordinates: [51.1657, 10.4515] },
    { id: 'austria', name: 'Austria', visited: true, coordinates: [47.5162, 14.5501] },
    { id: 'switzerland', name: 'Switzerland', visited: true, coordinates: [46.8182, 8.2275] },
    { id: 'france', name: 'France', visited: true, coordinates: [46.2276, 2.2137] },
    { id: 'belgium', name: 'Belgium', visited: true, coordinates: [50.8503, 4.3517] },
    { id: 'netherlands', name: 'Netherlands', visited: true, coordinates: [52.1326, 5.2913] },
    { id: 'luxembourg', name: 'Luxembourg', visited: true, coordinates: [49.8153, 6.1296] },
    { id: 'czech-republic', name: 'Czech Republic', visited: true, coordinates: [49.8175, 15.4730] },
    { id: 'england', name: 'England', visited: true, coordinates: [52.3555, -1.1743] },
    { id: 'italy', name: 'Italy', visited: true, coordinates: [41.8719, 12.5674] },
    { id: 'greece', name: 'Greece', visited: true, coordinates: [39.0742, 21.8243] },
    { id: 'turkey', name: 'Turkey', visited: true, coordinates: [38.9637, 35.2433] }
  ];

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
              <p className="text-gray-600">Click on markers to see countries. Green = visited together</p>
            </div>
            
            <div className="relative w-full h-[600px] rounded-lg overflow-hidden">
              <WorldMap visitedCountries={visitedCountries} />
            </div>

            {/* Legend */}
            <div className="flex justify-center space-x-8 mt-6">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Visited Together</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
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
              {visitedCountries.slice(0, 6).map((country) => (
                <div key={country.id} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow">
                  <div className="flex items-center space-x-3 mb-4">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800">{country.name}</h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Amazing memories made in {country.name} together. 
                    Can&apos;t wait to explore more of this beautiful country!
                  </p>
                </div>
              ))}
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
