'use client';

import { useEffect, useState } from 'react';
import { Utensils, Shuffle, X } from 'lucide-react';
import Confetti from 'react-confetti';

interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  price: string;
  distance: string;
  tags: string[];
}

const AVAILABLE_TAGS = ['cheap', 'fancy', 'within 5 miles', 'pizza', 'sushi', 'burgers', 'italian', 'mexican', 'asian', 'american'];

const BLANK: Omit<Restaurant, 'id'> = { name: '', cuisine: '', price: '$$', distance: '', tags: [] };

export default function RestaurantPicker() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);
  const [formTags, setFormTags] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [result, setResult] = useState<Restaurant | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/restaurants')
      .then((r) => r.json())
      .then((d) => setRestaurants(d.restaurants ?? []))
      .finally(() => setLoading(false));
  }, []);

  const toggleFormTag = (tag: string) =>
    setFormTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const toggleFilterTag = (tag: string) =>
    setFilterTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await fetch('/api/restaurants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, tags: formTags }),
    });
    const data = await res.json();
    if (data.restaurant) {
      setRestaurants((prev) => [...prev, data.restaurant]);
      setForm(BLANK);
      setFormTags([]);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/restaurants/${id}`, { method: 'DELETE' });
  };

  const pickRandom = () => {
    const pool = filterTags.length
      ? restaurants.filter((r) => filterTags.some((t) => r.tags.includes(t)))
      : restaurants;
    if (!pool.length) {
      alert('No restaurants match your filters!');
      return;
    }
    setResult(pool[Math.floor(Math.random() * pool.length)]);
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
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Restaurant Picker</h1>
          <p className="text-gray-600">Can&apos;t decide where to eat? Let us pick for you!</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Add form */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">Add Restaurant</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Restaurant name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  value={form.cuisine}
                  onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                  placeholder="Cuisine"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                <input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="Price ($$)"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </div>
              <input
                value={form.distance}
                onChange={(e) => setForm({ ...form, distance: e.target.value })}
                placeholder="Distance (e.g. within 5 miles)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              />
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleFormTag(tag)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      formTags.includes(tag) ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-lg font-bold text-white bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 disabled:opacity-50"
              >
                {saving ? 'Adding…' : 'Add Restaurant'}
              </button>
            </form>
          </div>

          {/* Picker */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Filter &amp; Pick</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleFilterTag(tag)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      filterTags.includes(tag) ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <button
                onClick={pickRandom}
                disabled={restaurants.length === 0}
                className="w-full py-4 rounded-lg text-xl font-bold text-white bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Shuffle className="w-6 h-6" />
                Pick Random Restaurant
              </button>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Our Restaurants ({restaurants.length})
              </h3>
              {loading ? (
                <p className="text-sm text-gray-400">Loading…</p>
              ) : restaurants.length === 0 ? (
                <p className="text-sm text-gray-400">No restaurants yet — add one!</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {restaurants.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{r.name}</div>
                        <div className="text-sm text-gray-500">
                          {[r.cuisine, r.price, r.distance].filter(Boolean).join(' · ')}
                        </div>
                        {r.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {r.tags.map((t) => (
                              <span key={t} className="px-2 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleDelete(r.id)} className="ml-3 text-gray-300 hover:text-red-400 transition-colors shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {result && (
          <div className="mt-8 text-center">
            <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 max-w-2xl mx-auto">
              <h3 className="text-3xl font-bold text-gray-800 mb-4">We&apos;re eating at…</h3>
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                <h4 className="text-2xl font-bold text-gray-800 mb-2">{result.name}</h4>
                <div className="flex flex-wrap justify-center gap-2 mt-3">
                  {[result.cuisine, result.price, result.distance].filter(Boolean).map((v) => (
                    <span key={v} className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm">{v}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
