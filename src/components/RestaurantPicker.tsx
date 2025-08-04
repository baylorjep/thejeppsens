'use client';

import { useState } from 'react';
import { Utensils, Sparkles, X } from 'lucide-react';

interface Restaurant {
  id: number;
  name: string;
  tags: string[];
}

export default function RestaurantPicker() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([
    {
      id: 1,
      name: "Chipotle",
      tags: ["cheap", "mexican", "within 5 miles"]
    },
    {
      id: 2,
      name: "Chick-fil-A",
      tags: ["cheap", "american", "within 5 miles"]
    },
    {
      id: 3,
      name: "Panda Express",
      tags: ["cheap", "asian", "within 5 miles"]
    },
    {
      id: 4,
      name: "Subway",
      tags: ["cheap", "american", "within 5 miles"]
    },
    {
      id: 5,
      name: "McDonald's",
      tags: ["cheap", "american", "within 5 miles"]
    },
    {
      id: 6,
      name: "Taco Bell",
      tags: ["cheap", "mexican", "within 5 miles"]
    },
    {
      id: 7,
      name: "Wendy's",
      tags: ["cheap", "american", "within 5 miles"]
    },
    {
      id: 8,
      name: "Burger King",
      tags: ["cheap", "american", "within 5 miles"]
    },
    {
      id: 9,
      name: "Pizza Hut",
      tags: ["cheap", "pizza", "within 5 miles"]
    },
    {
      id: 10,
      name: "Domino's",
      tags: ["cheap", "pizza", "within 5 miles"]
    }
  ]);
  const [newRestaurant, setNewRestaurant] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [result, setResult] = useState<Restaurant | null>(null);
  const [showResult, setShowResult] = useState(false);

  const availableTags = ['cheap', 'fancy', 'within 5 miles', 'pizza', 'sushi', 'burgers', 'italian', 'mexican', 'asian', 'american'];

  const addRestaurant = () => {
    if (newRestaurant.trim()) {
      const restaurant: Restaurant = {
        id: Date.now(),
        name: newRestaurant.trim(),
        tags: selectedTags
      };
      setRestaurants([...restaurants, restaurant]);
      setNewRestaurant('');
      setSelectedTags([]);
    }
  };

  const removeRestaurant = (id: number) => {
    setRestaurants(restaurants.filter(r => r.id !== id));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const pickRandom = () => {
    if (restaurants.length === 0) return;

    let filteredRestaurants = restaurants;
    
    // Filter by selected tags if any
    if (selectedTags.length > 0) {
      filteredRestaurants = restaurants.filter(restaurant =>
        selectedTags.some(tag => restaurant.tags.includes(tag))
      );
    }

    if (filteredRestaurants.length === 0) {
      alert('No restaurants match our selected tags!');
      return;
    }

    const randomIndex = Math.floor(Math.random() * filteredRestaurants.length);
    const picked = filteredRestaurants[randomIndex];
    setResult(picked);
    setShowResult(true);
  };

  const resetResult = () => {
    setShowResult(false);
    setResult(null);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            <Utensils className="inline-block h-8 w-8 text-gray-700 mr-3" />
            Restaurant Picker
          </h2>
          <p className="text-xl text-gray-600">Can&apos;t decide where to eat? Let us help!</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-6">
            {/* Add Restaurant */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Add Restaurants</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newRestaurant}
                  onChange={(e) => setNewRestaurant(e.target.value)}
                  placeholder="Restaurant name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addRestaurant()}
                />
                <button
                  onClick={addRestaurant}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Tags */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Tags (optional)</h4>
                <div className="flex flex-wrap gap-2">
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
              </div>

              {/* Restaurant List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {restaurants.map((restaurant) => (
                  <div key={restaurant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{restaurant.name}</div>
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
                    <button
                      onClick={() => removeRestaurant(restaurant.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pick Button */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <button
                onClick={pickRandom}
                disabled={restaurants.length === 0}
                className={`w-full py-4 rounded-lg text-xl font-bold text-white transition-all ${
                  restaurants.length > 0
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <Sparkles className="inline-block h-6 w-6 mr-2" />
                Pick a Restaurant!
              </button>
            </div>
          </div>

          {/* Result Panel */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            {!showResult ? (
              <div className="text-center py-12 text-gray-500">
                <Utensils className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Add some restaurants and click the button to get started!</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="h-16 w-16 text-gray-700 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-gray-800 mb-4">We&apos;re going to...</h3>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                  <h4 className="text-2xl font-bold text-gray-800 mb-2">{result?.name}</h4>
                  {result?.tags && result.tags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 mt-3">
                      {result.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={resetResult}
                  className="mt-6 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Pick Again
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 