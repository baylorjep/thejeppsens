'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Star, DollarSign, Shuffle } from 'lucide-react';

interface Place {
  place_id: string;
  name: string;
  rating?: number;
  price_level?: number;
  vicinity: string;
  types: string[];
  photos?: any[];
}

export default function RestaurantPicker() {
  const [restaurants, setRestaurants] = useState<Place[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Place | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Salt Lake City, UT'); // Default location

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

  const searchRestaurants = async () => {
    if (!window.google || !window.google.maps) {
      alert('Google Places API not loaded yet. Please try again in a moment.');
      return;
    }

    setIsLoading(true);
    try {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      
      const request = {
        query: searchQuery || 'restaurants',
        location: new window.google.maps.LatLng(40.7608, -111.8910), // Salt Lake City coordinates
        radius: 5000, // 5km radius
        type: 'restaurant'
      };

      service.textSearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setRestaurants(results.slice(0, 20)); // Limit to 20 results
        } else {
          console.error('Places API error:', status);
          // Fallback to default restaurants
          setRestaurants([
            {
              place_id: '1',
              name: 'Red Iguana',
              rating: 4.5,
              price_level: 2,
              vicinity: '736 W North Temple, Salt Lake City',
              types: ['restaurant', 'food']
            },
            {
              place_id: '2',
              name: 'Crown Burger',
              rating: 4.2,
              price_level: 1,
              vicinity: '377 E 200 S, Salt Lake City',
              types: ['restaurant', 'food']
            }
          ]);
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('Error searching restaurants:', error);
      setIsLoading(false);
    }
  };

  const pickRandomRestaurant = () => {
    if (restaurants.length === 0) {
      searchRestaurants();
      return;
    }

    const randomIndex = Math.floor(Math.random() * restaurants.length);
    setSelectedRestaurant(restaurants[randomIndex]);
  };

  const getPriceLevel = (level?: number) => {
    if (!level) return 'N/A';
    return '$'.repeat(level);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          🍕 Where Should We Eat?
        </h1>
        <p className="text-gray-600 text-lg">
          Can't decide? Let us pick for you!
        </p>
      </div>

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What are you craving?
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pizza, sushi, burgers, etc."
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
          onClick={searchRestaurants}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Searching...' : 'Search Restaurants'}
        </button>
      </div>

      {/* Random Picker */}
      <div className="text-center mb-8">
        <button
          onClick={pickRandomRestaurant}
          disabled={isLoading}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 px-8 rounded-xl text-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 disabled:opacity-50"
        >
          <Shuffle className="inline-block mr-2 h-6 w-6" />
          Pick Random Restaurant
        </button>
      </div>

      {/* Results */}
      {restaurants.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Found {restaurants.length} Restaurants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.place_id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedRestaurant(restaurant)}
              >
                <h3 className="font-semibold text-gray-800 mb-2">{restaurant.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{restaurant.vicinity}</p>
                <div className="flex items-center justify-between text-sm">
                  {restaurant.rating && (
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                      <span className="text-gray-700">{restaurant.rating}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-gray-700">{getPriceLevel(restaurant.price_level)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Restaurant */}
      {selectedRestaurant && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            You're going to {selectedRestaurant.name}!
          </h2>
          <div className="bg-white rounded-lg p-6 max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              {selectedRestaurant.name}
            </h3>
            <p className="text-gray-600 mb-4">{selectedRestaurant.vicinity}</p>
            <div className="flex items-center justify-center space-x-4 text-sm">
              {selectedRestaurant.rating && (
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span className="text-gray-700">{selectedRestaurant.rating}</span>
                </div>
              )}
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-green-600 mr-1" />
                <span className="text-gray-700">{getPriceLevel(selectedRestaurant.price_level)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedRestaurant(null)}
            className="mt-6 bg-gray-600 text-white py-2 px-6 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Pick Another
          </button>
        </div>
      )}
    </div>
  );
} 