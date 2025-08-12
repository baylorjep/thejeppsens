'use client';

import { useState } from 'react';
import { Utensils, Sparkles, X } from 'lucide-react';

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
  const [showResult, setShowResult] = useState(false);

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

  const removeRestaurant = (id: string) => {
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
          <p className="text-gray-600 mb-6">
            Can&apos;t decide where to eat? Let us pick for you!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-6">
            {/* Add Restaurant */}
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