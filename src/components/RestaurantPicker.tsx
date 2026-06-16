'use client';

import { useEffect, useState, useMemo } from 'react';
import { Shuffle, X, Plus, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetch('/api/restaurants')
      .then((r) => r.json())
      .then((d) => setRestaurants(d.restaurants ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!filterTags.length) return restaurants;
    return restaurants.filter((r) => filterTags.every((t) => r.tags.includes(t)));
  }, [restaurants, filterTags]);

  const toggleFilterTag = (tag: string) =>
    setFilterTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  const toggleFormTag = (tag: string) =>
    setFormTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

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
      setShowAddForm(false);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
    await fetch(`/api/restaurants/${id}`, { method: 'DELETE' });
  };

  const pickRandom = () => {
    if (!filtered.length) return;
    setResult(filtered[Math.floor(Math.random() * filtered.length)]);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      {showConfetti && <Confetti recycle={false} numberOfPieces={300} />}

      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Where should we eat?</h1>
          <p className="text-gray-500">Filter by vibe, then let us decide.</p>
        </div>

        {/* Filters + Pick */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Filter by</p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleFilterTag(tag)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    filterTags.includes(tag)
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {filterTags.length > 0 && (
                <button
                  onClick={() => setFilterTags([])}
                  className="px-4 py-1.5 rounded-full text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <button
            onClick={pickRandom}
            disabled={filtered.length === 0}
            className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 text-white text-base font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            <Shuffle className="w-5 h-5" />
            Pick for us
            {filtered.length > 0 && (
              <span className="ml-1 text-gray-400 font-normal text-sm">({filtered.length} options)</span>
            )}
          </button>
        </div>

        {/* Restaurant grid */}
        <div>
          <p className="text-sm text-gray-400 mb-4">
            {loading
              ? 'Loading…'
              : filterTags.length
              ? `${filtered.length} of ${restaurants.length} restaurants match`
              : `${restaurants.length} restaurants`}
          </p>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-gray-600 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No restaurants match those filters.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-start justify-between gap-2 group hover:border-gray-200 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-900 truncate">{r.name}</div>
                    <div className="text-sm text-gray-400 mt-0.5">
                      {[r.cuisine, r.price, r.distance].filter(Boolean).join(' · ')}
                    </div>
                    {r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {r.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="shrink-0 text-gray-200 hover:text-red-400 transition-colors mt-0.5 opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add restaurant (collapsed by default) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Plus className="h-4 w-4" />
              Add a restaurant
            </span>
            {showAddForm ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {showAddForm && (
            <form onSubmit={handleSubmit} className="px-6 pb-6 border-t border-gray-100 space-y-4">
              <div className="pt-4 grid sm:grid-cols-2 gap-3">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Restaurant name"
                  className="sm:col-span-2 w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  required
                />
                <input
                  value={form.cuisine}
                  onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                  placeholder="Cuisine"
                  className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                />
                <input
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="Price ($$)"
                  className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                />
                <input
                  value={form.distance}
                  onChange={(e) => setForm({ ...form, distance: e.target.value })}
                  placeholder="Distance (e.g. ~1.2 mi)"
                  className="sm:col-span-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleFormTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      formTags.includes(tag)
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Adding…' : 'Add Restaurant'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Result modal */}
      {result && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setResult(null)}
        >
          <div
            className="bg-white rounded-2xl p-10 shadow-2xl max-w-md w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Tonight we&apos;re eating at
            </p>
            <h2 className="text-4xl font-bold text-gray-900 mb-5">{result.name}</h2>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {[result.cuisine, result.price, result.distance].filter(Boolean).map((v) => (
                <span key={v} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  {v}
                </span>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={pickRandom}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Pick Again
              </button>
              <button
                onClick={() => setResult(null)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
