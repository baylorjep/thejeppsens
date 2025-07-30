'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Utensils, MapPin, DollarSign, Sparkles, RotateCcw } from 'lucide-react';


interface Restaurant {
  id: number;
  name: string;
  tags: string[];
  price: 'cheap' | 'moderate' | 'fancy';
  distance: 'close' | 'medium' | 'far';
}

const sampleRestaurants: Restaurant[] = [
  { id: 1, name: "Pizza Palace", tags: ["pizza", "casual"], price: "cheap", distance: "close" },
  { id: 2, name: "Sushi Garden", tags: ["sushi", "asian"], price: "moderate", distance: "medium" },
  { id: 3, name: "Steakhouse Prime", tags: ["steak", "fancy"], price: "fancy", distance: "far" },
  { id: 4, name: "Taco Tuesday", tags: ["mexican", "casual"], price: "cheap", distance: "close" },
  { id: 5, name: "Italian Villa", tags: ["italian", "romantic"], price: "moderate", distance: "medium" },
  { id: 6, name: "Burger Joint", tags: ["burgers", "casual"], price: "cheap", distance: "close" },
  { id: 7, name: "French Bistro", tags: ["french", "romantic"], price: "fancy", distance: "far" },
  { id: 8, name: "Thai Spice", tags: ["thai", "spicy"], price: "moderate", distance: "medium" },
];

export default function RestaurantPicker() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(sampleRestaurants);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceFilter, setPriceFilter] = useState<string>('all');
  const [distanceFilter, setDistanceFilter] = useState<string>('all');

  const allTags = Array.from(new Set(restaurants.flatMap(r => r.tags)));

  const addRestaurant = () => {
    if (newRestaurant.trim()) {
      const restaurant: Restaurant = {
        id: Date.now(),
        name: newRestaurant.trim(),
        tags: [],
        price: 'moderate',
        distance: 'medium'
      };
      setRestaurants([...restaurants, restaurant]);
      setNewRestaurant('');
    }
  };

  const spinForRestaurant = () => {
    if (restaurants.length === 0) return;

    setIsSpinning(true);
    setSelectedRestaurant(null);

    // Filter restaurants based on selected criteria
    let filtered = restaurants;
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(r => selectedTags.some(tag => r.tags.includes(tag)));
    }
    
    if (priceFilter !== 'all') {
      filtered = filtered.filter(r => r.price === priceFilter);
    }
    
    if (distanceFilter !== 'all') {
      filtered = filtered.filter(r => r.distance === distanceFilter);
    }

    if (filtered.length === 0) {
      setIsSpinning(false);
      return;
    }

    // Simulate spinning animation
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * filtered.length);
      setSelectedRestaurant(filtered[randomIndex]);
      setIsSpinning(false);
    }, 2000);
  };

  const getPriceIcon = (price: string) => {
    switch (price) {
      case 'cheap': return <DollarSign className="h-4 w-4" />;
      case 'moderate': return <><DollarSign className="h-4 w-4" /><DollarSign className="h-4 w-4" /></>;
      case 'fancy': return <><DollarSign className="h-4 w-4" /><DollarSign className="h-4 w-4" /><DollarSign className="h-4 w-4" /></>;
      default: return null;
    }
  };

  const getDistanceIcon = (distance: string) => {
    switch (distance) {
      case 'close': return <MapPin className="h-4 w-4 text-green-500" />;
      case 'medium': return <MapPin className="h-4 w-4 text-yellow-500" />;
      case 'far': return <MapPin className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            <Utensils className="inline-block h-8 w-8 text-gray-700 mr-3" />
            Restaurant Roulette
          </h2>
          <p className="text-xl text-gray-600">Can&apos;t decide where to eat? Let fate choose for you!</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Restaurant List & Controls */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Add New Restaurant */}
                          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Add Your Favorites</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newRestaurant}
                  onChange={(e) => setNewRestaurant(e.target.value)}
                  placeholder="Restaurant name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addRestaurant()}
                />
                <button
                  onClick={addRestaurant}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Filters</h3>
              
              {/* Tags */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      )}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
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

              {/* Price & Distance */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="all">All Prices</option>
                    <option value="cheap">Cheap</option>
                    <option value="moderate">Moderate</option>
                    <option value="fancy">Fancy</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Distance</label>
                  <select
                    value={distanceFilter}
                    onChange={(e) => setDistanceFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="all">Any Distance</option>
                    <option value="close">Close</option>
                    <option value="medium">Medium</option>
                    <option value="far">Far</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Restaurant List */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Your Restaurants ({restaurants.length})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {restaurants.map(restaurant => (
                  <div key={restaurant.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <span className="font-medium">{restaurant.name}</span>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      {getPriceIcon(restaurant.price)}
                      {getDistanceIcon(restaurant.distance)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Spinner & Result */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col items-center justify-center space-y-6"
          >
            {/* Spin Button */}
            <motion.button
              onClick={spinForRestaurant}
              disabled={isSpinning || restaurants.length === 0}
              className={`relative px-8 py-4 rounded-full text-xl font-bold text-white shadow-lg transition-all ${
                isSpinning 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 hover:scale-105'
              }`}
              whileHover={!isSpinning ? { scale: 1.05 } : {}}
              whileTap={!isSpinning ? { scale: 0.95 } : {}}
            >
              <motion.div
                animate={isSpinning ? { rotate: 360 } : {}}
                transition={isSpinning ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-6 w-6" />
                {isSpinning ? 'Spinning...' : 'Spin for Restaurant!'}
              </motion.div>
            </motion.button>

            {/* Result */}
            <AnimatePresence>
              {selectedRestaurant && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 text-center max-w-sm w-full"
                >
                  <Sparkles className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedRestaurant.name}
                  </h3>
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      {getPriceIcon(selectedRestaurant.price)}
                    </div>
                    <div className="flex items-center gap-1">
                      {getDistanceIcon(selectedRestaurant.distance)}
                    </div>
                  </div>
                  {selectedRestaurant.tags.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {selectedRestaurant.tags.map(tag => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {!selectedRestaurant && !isSpinning && (
              <div className="text-center text-gray-500">
                <p>Click the button above to find your next dining adventure!</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
} 