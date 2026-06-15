'use client';

import Header from '@/components/Header';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false });

const CONTINENT_ORDER = ['Americas', 'Oceania', 'Europe', 'Asia', 'Africa'];

interface Country {
  id: string;
  geo_name: string;
  display_name: string;
  flag: string;
  continent: string;
}

const MAP_LOADING = (
  <div className="w-full h-[440px] bg-sky-50 rounded-xl flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-teal-500 animate-spin" />
      <p className="text-sm text-slate-400">Loading map...</p>
    </div>
  </div>
);

export default function TravelPage() {
  const [countries, setCountries] = useState<Country[] | null>(null);

  useEffect(() => {
    fetch('/api/travel/countries')
      .then((r) => r.json())
      .then((d) => setCountries(d.countries ?? []))
      .catch(() => setCountries([]));
  }, []);

  const visitedGeoNames = useMemo(
    () => new Set((countries ?? []).map((c) => c.geo_name)),
    [countries]
  );

  const continents = useMemo(() => {
    if (!countries) return [];
    const grouped: Record<string, Country[]> = {};
    for (const c of countries) {
      (grouped[c.continent] ??= []).push(c);
    }
    return CONTINENT_ORDER.filter((name) => grouped[name]).map((name) => ({
      name,
      countries: grouped[name],
    }));
  }, [countries]);

  return (
    <main className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-16">
            <p className="text-teal-400 text-xs font-semibold tracking-widest uppercase mb-5">
              Baylor &amp; Isabel
            </p>
            <h1 className="text-5xl sm:text-6xl font-bold mb-5 tracking-tight">
              Our World Adventures
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-8 max-w-xl mx-auto">
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-teal-400 mb-1">
                {countries ? countries.length : '—'}
              </div>
              <div className="text-slate-400 text-sm">Countries</div>
            </div>
            <div className="text-center border-x border-slate-700">
              <div className="text-4xl sm:text-5xl font-bold text-teal-400 mb-1">
                {continents.length || '—'}
              </div>
              <div className="text-slate-400 text-sm">Continents</div>
            </div>
            <div className="text-center">
              <div className="text-4xl sm:text-5xl font-bold text-teal-400 mb-1">∞</div>
              <div className="text-slate-400 text-sm">Memories</div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Where we&apos;ve been</h2>
            <div className="flex items-center gap-5 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-teal-500" />
                Visited
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-slate-300" />
                Not yet
              </span>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-5">
            {countries === null ? MAP_LOADING : <WorldMap visitedGeoNames={visitedGeoNames} />}
          </div>
        </div>
      </section>

      {/* Country grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-slate-900 mb-12">Countries we&apos;ve explored</h2>
          {countries === null ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-teal-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-12">
              {continents.map((continent) => (
                <div key={continent.name}>
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      {continent.name}
                    </h3>
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-xs text-slate-300">{continent.countries.length} countries</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {continent.countries.map((country) => (
                      <div
                        key={country.id}
                        className="flex flex-col items-center gap-2.5 bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-teal-200 rounded-xl p-4 transition-colors cursor-default group"
                      >
                        <span className="text-3xl leading-none">{country.flag}</span>
                        <span className="text-xs font-medium text-slate-600 group-hover:text-teal-700 text-center leading-tight transition-colors">
                          {country.display_name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
