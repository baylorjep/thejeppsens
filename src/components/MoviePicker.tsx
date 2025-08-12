'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Star, Film, Shuffle } from 'lucide-react';

interface Place {
  place_id: string;
  name: string;
  rating?: number;
  vicinity: string;
  types: string[];
  photos?: any[];
}

export default function MoviePicker() {
  const [venues, setVenues] = useState<Place[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Salt Lake City, UT');

  // Load Google Places API
  useEffect(() => {
    const loadPlacesAPI = () => {
      if (!window.google || !window.google.maps) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
    };

    loadPlacesAPI();
  }, []);

  const searchVenues = async () => {
    if (!window.google || !window.google.maps) {
      alert('Google Places API not loaded yet. Please try again in a moment.');
      return;
    }

    setIsLoading(true);
    try {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      
      const request = {
        query: searchQuery || 'movie theater cinema entertainment',
        location: new window.google.maps.LatLng(40.7608, -111.8910), // Salt Lake City coordinates
        radius: 10000, // 10km radius
        type: 'movie_theater'
      };

      service.textSearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setVenues(results.slice(0, 15)); // Limit to 15 results
        } else {
          console.error('Places API error:', status);
          // Fallback to default venues
          setVenues([
            {
              place_id: '1',
              name: 'Megaplex Theatres at The Gateway',
              rating: 4.3,
              vicinity: '165 S Rio Grande St, Salt Lake City',
              types: ['movie_theater', 'entertainment']
            },
            {
              place_id: '2',
              name: 'Cinemark Sugarhouse',
              rating: 4.1,
              vicinity: '1100 E 2100 S, Salt Lake City',
              types: ['movie_theater', 'entertainment']
            },
            {
              place_id: '3',
              name: 'Broadway Centre Cinemas',
              rating: 4.5,
              vicinity: '111 E 300 S, Salt Lake City',
              types: ['movie_theater', 'entertainment']
            }
          ]);
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error searching venues:', error);
      setIsLoading(false);
    }
  };

  const pickRandomVenue = () => {
    if (venues.length === 0) {
      searchVenues();
      return;
    }

    const randomIndex = Math.floor(Math.random() * venues.length);
    setSelectedVenue(venues[randomIndex]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          🎬 What Should We Watch?
        </h1>
        <p className="text-gray-600 text-lg">
          Let's find a great place to catch a movie!
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What kind of entertainment?
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Movie theater, cinema, entertainment, etc."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        <button
          onClick={searchVenues}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Search Venues'}
        </button>
      </div>

      {/* Random Picker */}
      <div className="text-center mb-8">
        <button
          onClick={pickRandomVenue}
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-8 rounded-xl text-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50"
        >
          <Shuffle className="inline-block mr-2 h-6 w-6" />
          Pick Random Venue
        </button>
      </div>

      {/* Results */}
      {venues.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Found {venues.length} Venues
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {venues.map((venue) => (
              <div
                key={venue.place_id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedVenue(venue)}
              >
                <div className="flex items-start justify-between mb-2">
                  <Film className="h-5 w-5 text-purple-600 mt-1" />
                  {venue.rating && (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-sm text-gray-700">{venue.rating}</span>
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">{venue.name}</h3>
                <p className="text-sm text-gray-600">{venue.vicinity}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Venue */}
      {selectedVenue && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Let's go to {selectedVenue.name}!
          </h2>
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {selectedVenue.name}
            </h3>
            <p className="text-gray-600 mb-4">{selectedVenue.vicinity}</p>
            {selectedVenue.rating && (
              <div className="flex items-center justify-center">
                <Star className="h-5 w-5 text-yellow-400 fill-current mr-2" />
                <span className="text-gray-700 font-medium">{selectedVenue.rating} stars</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSelectedVenue(null)}
            className="mt-6 bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Pick Another
          </button>
        </div>
      )}
    </div>
  );
} 