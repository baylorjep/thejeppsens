'use client';

import { useEffect, useState } from 'react';
import { Film, Sparkles, X } from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  genre: string;
  length: string;
  type: 'animated' | 'live-action';
  poster?: string;
  trailer?: string;
}

const GENRES = ['action', 'comedy', 'drama', 'horror', 'romance', 'sci-fi', 'thriller', 'documentary', 'crime'];
const LENGTHS = ['short (<90 min)', 'medium (90-120 min)', 'long (>120 min)'];
const BLANK: Omit<Movie, 'id'> = { title: '', genre: 'action', length: 'medium (90-120 min)', type: 'live-action' };

export default function MoviePicker() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);
  const [filterGenre, setFilterGenre] = useState('');
  const [filterLength, setFilterLength] = useState('');
  const [filterType, setFilterType] = useState<'animated' | 'live-action' | ''>('');
  const [result, setResult] = useState<Movie | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/movies')
      .then((r) => r.json())
      .then((d) => setMovies(d.movies ?? []))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await fetch('/api/movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.movie) {
      setMovies((prev) => [...prev, data.movie]);
      setForm(BLANK);
    }
    setSaving(false);
  };

  const removeMovie = async (id: string) => {
    setMovies((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/movies/${id}`, { method: 'DELETE' });
  };

  const pickRandom = () => {
    let pool = movies;
    if (filterGenre) pool = pool.filter((m) => m.genre === filterGenre);
    if (filterLength) pool = pool.filter((m) => m.length === filterLength);
    if (filterType) pool = pool.filter((m) => m.type === filterType);
    if (!pool.length) { alert('No movies match your filters!'); return; }
    setResult(pool[Math.floor(Math.random() * pool.length)]);
    setShowResult(true);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            <Film className="inline-block h-8 w-8 text-gray-700 mr-3" />
            Movie Picker
          </h2>
          <p className="text-gray-600">Can&apos;t decide what to watch? Let us pick for you!</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input panel */}
          <div className="space-y-6">
            {/* Add */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Add Movie</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Movie title…"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {saving ? '…' : 'Add'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={form.genre}
                    onChange={(e) => setForm({ ...form, genre: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
                  >
                    {GENRES.map((g) => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                  </select>
                  <select
                    value={form.length}
                    onChange={(e) => setForm({ ...form, length: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-sm"
                  >
                    {LENGTHS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  {(['live-action', 'animated'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                        form.type === t ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </form>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Filters</h3>
              <div className="space-y-3">
                <select
                  value={filterGenre}
                  onChange={(e) => setFilterGenre(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="">Any Genre</option>
                  {GENRES.map((g) => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
                </select>
                <select
                  value={filterLength}
                  onChange={(e) => setFilterLength(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                >
                  <option value="">Any Length</option>
                  {LENGTHS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <div className="flex gap-2">
                  {(['', 'live-action', 'animated'] as const).map((t) => (
                    <button
                      key={t || 'any'}
                      onClick={() => setFilterType(t)}
                      className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                        filterType === t ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t ? (t.charAt(0).toUpperCase() + t.slice(1).replace('-', ' ')) : 'Any'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Movie list */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Our Movies ({movies.length})</h3>
              {loading ? (
                <p className="text-sm text-gray-400">Loading…</p>
              ) : movies.length === 0 ? (
                <p className="text-sm text-gray-400">No movies yet — add one!</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {movies.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{m.title}</div>
                        <div className="text-xs text-gray-500">
                          {[m.genre, m.length, m.type].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      <button onClick={() => removeMovie(m.id)} className="ml-2 text-gray-300 hover:text-red-400 transition-colors shrink-0">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={pickRandom}
              disabled={movies.length === 0}
              className="w-full py-4 rounded-lg text-xl font-bold text-white bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 disabled:opacity-40 transition-all"
            >
              <Sparkles className="inline-block h-6 w-6 mr-2" />
              Pick a Movie!
            </button>
          </div>

          {/* Result panel */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            {!showResult ? (
              <div className="text-center py-12 text-gray-400">
                <Film className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Add movies and click Pick!</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="h-16 w-16 text-gray-700 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-gray-800 mb-4">We&apos;re watching…</h3>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                  <h4 className="text-2xl font-bold text-gray-800 mb-3">{result?.title}</h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[result?.genre, result?.length, result?.type].filter(Boolean).map((v) => (
                      <span key={v} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{v}</span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => { setShowResult(false); setResult(null); }}
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
