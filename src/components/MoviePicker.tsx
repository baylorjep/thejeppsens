'use client';

import { useEffect, useState, useMemo } from 'react';
import { Shuffle, X, Plus, ChevronDown, ChevronUp, Check, Search } from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  genre: string;
  length: string;
  type: 'animated' | 'live-action';
  watched: boolean;
}

const GENRES = [
  'action', 'adventure', 'comedy', 'drama', 'fantasy', 'family',
  'history', 'horror', 'musical', 'mystery', 'romance',
  'sci-fi', 'superhero', 'thriller', 'war', 'documentary', 'crime',
];
const LENGTHS = ['short (<90 min)', 'medium (90-120 min)', 'long (>120 min)'];
const BLANK: Omit<Movie, 'id' | 'watched'> = { title: '', genre: 'action', length: 'medium (90-120 min)', type: 'live-action' };

export default function MoviePicker() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(BLANK);
  const [search, setSearch] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterLength, setFilterLength] = useState('');
  const [filterType, setFilterType] = useState<'animated' | 'live-action' | ''>('');
  const [showWatched, setShowWatched] = useState(false);
  const [result, setResult] = useState<Movie | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetch('/api/movies')
      .then((r) => r.json())
      .then((d) => setMovies(d.movies ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return movies.filter((m) => {
      if (!showWatched && m.watched) return false;
      if (filterGenre && m.genre !== filterGenre) return false;
      if (filterLength && m.length !== filterLength) return false;
      if (filterType && m.type !== filterType) return false;
      if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [movies, filterGenre, filterLength, filterType, search, showWatched]);

  const watchedCount = useMemo(() => movies.filter((m) => m.watched).length, [movies]);
  const hasFilters = filterGenre || filterLength || filterType || search;

  const toggleWatched = async (id: string, watched: boolean) => {
    setMovies((prev) => prev.map((m) => (m.id === id ? { ...m, watched } : m)));
    await fetch(`/api/movies/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ watched }),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const res = await fetch('/api/movies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, watched: false }),
    });
    const data = await res.json();
    if (data.movie) {
      setMovies((prev) => [...prev, data.movie]);
      setForm(BLANK);
      setShowAddForm(false);
    }
    setSaving(false);
  };

  const removeMovie = async (id: string) => {
    setMovies((prev) => prev.filter((m) => m.id !== id));
    await fetch(`/api/movies/${id}`, { method: 'DELETE' });
  };

  const pickRandom = () => {
    const unwatched = filtered.filter((m) => !m.watched);
    const pool = unwatched.length ? unwatched : filtered;
    if (!pool.length) return;
    setResult(pool[Math.floor(Math.random() * pool.length)]);
  };

  const lengthLabel = (l: string) =>
    l === 'short (<90 min)' ? 'Short' : l === 'medium (90-120 min)' ? 'Medium' : 'Long';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">What should we watch?</h1>
          <p className="text-gray-500">Filter, search, then let us decide.</p>
        </div>

        {/* Filters + Pick */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-5">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search movies…"
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {/* Genre */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Genre</p>
              <select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              >
                <option value="">Any genre</option>
                {GENRES.map((g) => (
                  <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                ))}
              </select>
            </div>

            {/* Length */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Length</p>
              <div className="flex gap-1.5">
                {(['', ...LENGTHS] as const).map((l) => (
                  <button
                    key={l || 'any'}
                    onClick={() => setFilterLength(l)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                      filterLength === l ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {l ? lengthLabel(l) : 'Any'}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Format</p>
              <div className="flex gap-1.5">
                {([['', 'Any'], ['live-action', 'Live Action'], ['animated', 'Animated']] as const).map(([val, label]) => (
                  <button
                    key={val || 'any'}
                    onClick={() => setFilterType(val as typeof filterType)}
                    className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${
                      filterType === val ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={pickRandom}
              disabled={filtered.length === 0}
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-900 text-white text-base font-semibold rounded-xl hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              <Shuffle className="w-5 h-5" />
              Pick for us
              {filtered.length > 0 && (
                <span className="ml-1 text-gray-400 font-normal text-sm">({filtered.length} options)</span>
              )}
            </button>
            {hasFilters && (
              <button
                onClick={() => { setFilterGenre(''); setFilterLength(''); setFilterType(''); setSearch(''); }}
                className="px-4 py-4 text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Movie grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">
              {loading ? 'Loading…' : hasFilters || !showWatched
                ? `${filtered.length} of ${movies.length} movies`
                : `${movies.length} movies`}
            </p>
            {watchedCount > 0 && (
              <button
                onClick={() => setShowWatched((v) => !v)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                  showWatched ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {showWatched ? 'Hiding watched' : `Show watched (${watchedCount})`}
              </button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-gray-600 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No movies match those filters.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((m) => (
                <div
                  key={m.id}
                  className={`bg-white rounded-xl p-4 border shadow-sm flex items-start justify-between gap-2 group transition-colors ${
                    m.watched ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className={`font-semibold truncate ${m.watched ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {m.title}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.genre && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full capitalize">{m.genre}</span>
                      )}
                      {m.length && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">{lengthLabel(m.length)}</span>
                      )}
                      {m.type && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full capitalize">{m.type.replace('-', ' ')}</span>
                      )}
                      {m.watched && (
                        <span className="px-2 py-0.5 text-xs bg-green-50 text-green-600 rounded-full">watched</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleWatched(m.id, !m.watched)}
                      title={m.watched ? 'Mark unwatched' : 'Mark watched'}
                      className={`p-1.5 rounded-lg transition-colors ${
                        m.watched
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'text-gray-200 hover:text-green-500 hover:bg-green-50 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => removeMovie(m.id)}
                      className="p-1.5 text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 rounded-lg"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add movie */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowAddForm((v) => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Plus className="h-4 w-4" />
              Add a movie
            </span>
            {showAddForm ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>

          {showAddForm && (
            <form onSubmit={handleSubmit} className="px-6 pb-6 border-t border-gray-100 space-y-4">
              <div className="pt-4 space-y-3">
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Movie title"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={form.genre}
                    onChange={(e) => setForm({ ...form, genre: e.target.value })}
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                    ))}
                  </select>
                  <select
                    value={form.length}
                    onChange={(e) => setForm({ ...form, length: e.target.value })}
                    className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                  >
                    {LENGTHS.map((l) => (
                      <option key={l} value={l}>{lengthLabel(l)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  {(['live-action', 'animated'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, type: t })}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        form.type === t ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {t === 'live-action' ? 'Live Action' : 'Animated'}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Adding…' : 'Add Movie'}
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
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Tonight we&apos;re watching</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-5">{result.title}</h2>
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {[result.genre, result.length ? lengthLabel(result.length) : '', result.type?.replace('-', ' ')].filter(Boolean).map((v) => (
                <span key={v} className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm capitalize">{v}</span>
              ))}
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { toggleWatched(result.id, true); setResult(null); }}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                We watched it ✓
              </button>
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
