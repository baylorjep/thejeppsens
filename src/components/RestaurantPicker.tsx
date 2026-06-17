'use client';

import { useEffect, useState, useMemo } from 'react';
import { Shuffle, X, Plus, ChevronDown, ChevronUp, Search } from 'lucide-react';
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
const LAST_PICKED_KEY = 'lastPickedRestaurantId';

export default function RestaurantPicker() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);
  const [formTags, setFormTags] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [lastPickedId, setLastPickedId] = useState<string | null>(null);
  const [result, setResult] = useState<Restaurant | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetch('/api/restaurants')
      .then((r) => r.json())
      .then((d) => setRestaurants(d.restaurants ?? []))
      .finally(() => setLoading(false));
    setLastPickedId(localStorage.getItem(LAST_PICKED_KEY));
  }, []);

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      if (filterTags.length && !filterTags.every((t) => r.tags.includes(t))) return false;
      if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [restaurants, filterTags, search]);

  const hasFilters = filterTags.length > 0 || search;

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
    const pick = filtered[Math.floor(Math.random() * filtered.length)];
    setResult(pick);
    setLastPickedId(pick.id);
    localStorage.setItem(LAST_PICKED_KEY, pick.id);
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
          <p className="text-gray-500">Filter by vibe, search by name, then let us decide.</p>
        </div>

        {/* Filters + Pick */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search restaurants…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
          </div>

          {/* Tag filters */}
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
              {hasFilters && (
                <button
                  onClick={() => { setFilterTags([]); setSearch(''); }}
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
              : hasFilters
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
                  className={`bg-white rounded-xl p-4 border shadow-sm flex items-start justify-between gap-2 group transition-colors ${
                    r.id === lastPickedId ? 'border-amber-200 bg-amber-50/40' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 truncate">{r.name}</span>
                      {r.id === lastPickedId && (
                        <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                          Last picked
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 mt-0.5">
                      {[r.cuisine, r.price, r.distance].filter(Boolean).join(' · ')}
                    </div>
                    {r.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {r.tags.map((t) => (
                          <span key={t} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="shrink-0 text-gray-300 hover:text-red-400 transition-colors mt-0.5 sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add restaurant */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Plus className="h-4 w-4" />
              Add a restaurant
            </span>
            {showAddForm ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
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
                      formTags.includes(tag) ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            className="bg-white rounded-2xl p-6 sm:p-10 shadow-2xl max-w-md w-full text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Tonight we&apos;re eating at
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4">{result.name}</h2>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {[result.cuisine, result.price, result.distance].filter(Boolean).map((v) => (
                <span key={v} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">{v}</span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 justify-center">
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
