'use client';

import { useState } from 'react';
import { Utensils, Shuffle, Plus } from 'lucide-react';
import Confetti from 'react-confetti';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  price: string;
  distance: string;
  tags: string[];
}

export default function RestaurantPicker() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([
    {
      id: "1",
      name: "Chipotle",
      cuisine: "Mexican",
      price: "$$",
      distance: "within 5 miles",
      tags: ["cheap", "mexican", "within 5 miles"]
    },
    {
      id: "2",
      name: "Chick-fil-A",
      cuisine: "American",
      price: "$$",
      distance: "within 5 miles",
      tags: ["cheap", "american", "within 5 miles"]
    },
    {
      id: "3",
      name: "Panda Express",
      cuisine: "Asian",
      price: "$$",
      distance: "within 5 miles",
      tags: ["cheap", "asian", "within 5 miles"]
    },
    {
      id: "4",
      name: "Subway",
      cuisine: "American",
      price: "$$",
      distance: "within 5 miles",
      tags: ["cheap", "american", "within 5 miles"]
    },
    {
      id: "5",
      name: "McDonald's",
      cuisine: "American",
      price: "$$",
      distance: "within 5 miles",
      tags: ["cheap", "american", "within 5 miles"]
    },
    {
      id: "6",
      name: "Taco Bell",
      cuisine: "Mexican",
      price: "$$",
      distance: "within 5 miles",
      tags: ["cheap", "mexican", "within 5 miles"]
    },
    {
      id: "7",
      name: "Wendy's",
      cuisine: "American",
      price: "$$",
      distance: "within 5 miles",
      tags: ["cheap", "american", "within 5 miles"]
    },
    {
      id: "8",
      name: "Burger King",
      cuisine: "American",
      price: "$$",
      distance: "within 5 miles",
      tags: ["cheap", "american", "within 5 miles"]
    },
    {
      id: "9",
      name: "Pizza Hut",
      cuisine: "Pizza",
      price: "$$",
      distance: "within 5 miles",
      tags: ["cheap", "pizza", "within 5 miles"]
    },
    {
      id: "10",
      name: "Domino's",
      cuisine: "Pizza",
      price: "$$",
      distance: "within 5 miles",
      tags: ["cheap", "pizza", "within 5 miles"]
    }
  ]);
  const [newRestaurant, setNewRestaurant] = useState<Restaurant>({ name: '', cuisine: 'american', price: '$$', distance: 'within 5 miles', tags: [] });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [result, setResult] = useState<Restaurant | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const availableTags = ['cheap', 'fancy', 'within 5 miles', 'pizza', 'sushi', 'burgers', 'italian', 'mexican', 'asian', 'american'];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newRestaurant.name.trim()) {
      const restaurant: Restaurant = {
        id: Date.now().toString(),
        name: newRestaurant.name.trim(),
        cuisine: newRestaurant.cuisine,
        price: newRestaurant.price,
        distance: newRestaurant.distance,
        tags: newRestaurant.tags,
      };
      setRestaurants([...restaurants, restaurant]);
      setNewRestaurant({ name: '', cuisine: 'american', price: '$$', distance: 'within 5 miles', tags: [] });
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const pickRandom = () => {
    let filteredRestaurants = restaurants;
    
    if (selectedTags.length > 0) {
      filteredRestaurants = restaurants.filter(restaurant =>
        selectedTags.some(tag => restaurant.tags.includes(tag))
      );
    }
    
    if (filteredRestaurants.length === 0) {
      alert('No restaurants match your selected tags. Try removing some filters!');
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * filteredRestaurants.length);
    const picked = filteredRestaurants[randomIndex];
    setResult(picked);
    setShowConfetti(true);
    
    setTimeout(() => setShowConfetti(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      {showConfetti && <Confetti />}
      
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-700 rounded-full mb-4">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Restaurant Picker
          </h1>
          <p className="text-gray-600 mb-6">
            Can&apos;t decide where to eat? Let us pick for you!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add Restaurants Section */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Add Restaurants</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="restaurantName" className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name</label>
                <input
                  type="text"
                  id="restaurantName"
                  value={newRestaurant.name}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })}
                  placeholder="Restaurant name..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="cuisine" className="block text-sm font-medium text-gray-700 mb-1">Cuisine</label>
                <input
                  type="text"
                  id="cuisine"
                  value={newRestaurant.cuisine}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, cuisine: e.target.value })}
                  placeholder="Cuisine (e.g., Mexican, Italian, Asian)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Price Range</label>
                <input
                  type="text"
                  id="price"
                  value={newRestaurant.price}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, price: e.target.value })}
                  placeholder="Price range (e.g., $, $$, $$$)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-1">Distance</label>
                <input
                  type="text"
                  id="distance"
                  value={newRestaurant.distance}
                  onChange={(e) => setNewRestaurant({ ...newRestaurant, distance: e.target.value })}
                  placeholder="Distance (e.g., within 5 miles, 10 miles)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (optional)</label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        selectedTags.includes(tag)
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-4 rounded-lg text-xl font-bold text-white transition-all bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900"
              >
                Add Restaurant
              </button>
            </form>
          </div>

          {/* Picker Section */}
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Filters</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <button
                onClick={pickRandom}
                className="w-full py-4 rounded-lg text-xl font-bold text-white transition-all bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 flex items-center justify-center gap-2"
              >
                <Shuffle className="w-6 h-6" />
                Pick Random Restaurant
              </button>
            </div>

            {/* Restaurant List */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Our Restaurants ({restaurants.length})</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {restaurants.map((restaurant) => (
                  <div key={restaurant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{restaurant.name}</div>
                      <div className="text-sm text-gray-600">
                        {restaurant.cuisine} • {restaurant.price} • {restaurant.distance}
                      </div>
                      {restaurant.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {restaurant.tags.map(tag => (
                            <span key={tag} className="px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-8 text-center">
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 max-w-2xl mx-auto">
              <h3 className="text-3xl font-bold text-gray-800 mb-4">We&apos;re eating at...</h3>
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                <h4 className="text-2xl font-bold text-gray-800 mb-2">{result.name}</h4>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                    {result.cuisine}
                  </span>
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                    {result.price}
                  </span>
                  <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">
                    {result.distance}
                  </span>
                </div>
                {result.tags.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    {result.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 text-xs bg-gray-300 text-gray-600 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 