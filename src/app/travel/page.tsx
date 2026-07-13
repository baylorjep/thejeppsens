'use client';

import Header from '@/components/Header';
import AddCountryControl from '@/components/AddCountryControl';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { VisitType } from '@/components/WorldMap';
import { countrySlug, type Country } from '@/lib/travel';

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false });

const CONTINENT_ORDER = ['North America', 'South America', 'Oceania', 'Europe', 'Asia', 'Africa'];

const CONTINENT_TOTALS: Record<string, number> = {
  'North America': 23,
  'South America': 12,
  Europe: 44,
  Asia: 48,
  Africa: 54,
  Oceania: 14,
};

function visitType(c: Country): VisitType {
  if (c.baylor_visited && c.isabel_visited) return 'both';
  if (c.baylor_visited) return 'baylor';
  return 'isabel';
}

const CARD_STYLE: Record<VisitType, string> = {
  both:   'bg-teal-50  border-teal-100  hover:border-teal-300',
  baylor: 'bg-blue-50  border-blue-100  hover:border-blue-300',
  isabel: 'bg-purple-50 border-purple-100 hover:border-purple-300',
};

const PILL_STYLE: Record<VisitType, string> = {
  both:   'bg-teal-100   text-teal-700',
  baylor: 'bg-blue-100   text-blue-700',
  isabel: 'bg-purple-100 text-purple-700',
};

const PILL_LABEL: Record<VisitType, string> = {
  both:   'Both',
  baylor: 'Baylor',
  isabel: 'Isabel',
};

const MAP_LOADING = (
  <div className="w-full h-[440px] bg-sky-50 rounded-xl flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-teal-500 animate-spin" />
      <p className="text-sm text-slate-400">Loading map...</p>
    </div>
  </div>
);

export default function TravelPage() {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[] | null>(null);

  const loadCountries = () => {
    fetch('/api/travel/countries')
      .then((r) => r.json())
      .then((d) => setCountries(d.countries ?? []))
      .catch(() => setCountries([]));
  };

  useEffect(() => {
    loadCountries();
  }, []);

  const visitedMap = useMemo<Map<string, VisitType>>(() => {
    const m = new Map<string, VisitType>();
    for (const c of countries ?? []) m.set(c.geo_name, visitType(c));
    return m;
  }, [countries]);

  const countrySlugByGeoName = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of countries ?? []) m.set(c.geo_name, countrySlug(c));
    return m;
  }, [countries]);

  const continents = useMemo(() => {
    if (!countries) return [];
    const grouped: Record<string, Country[]> = {};
    for (const c of countries) (grouped[c.continent] ??= []).push(c);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-24">
          <div className="text-center mb-10 sm:mb-16">
            <p className="text-teal-400 text-xs font-semibold tracking-widest uppercase mb-5">
              Baylor &amp; Isabel
            </p>
            <h1 className="text-5xl sm:text-6xl font-bold mb-5 tracking-tight">
              Our World Adventures
            </h1>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-xl mx-auto">
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className="text-xl font-bold text-slate-900">Where we&apos;ve been</h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-teal-500" />Both
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500" />Baylor
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-purple-500" />Isabel
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300" />Not yet
              </span>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-3 sm:p-5">
            {countries === null ? (
              MAP_LOADING
            ) : (
              <WorldMap
                visitedMap={visitedMap}
                onCountryClick={(geoName) => {
                  const slug = countrySlugByGeoName.get(geoName);
                  if (slug) router.push(`/travel/${slug}`);
                }}
              />
            )}
          </div>
        </div>
      </section>

      {/* Country grid */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <h2 className="text-xl font-bold text-slate-900">Countries we&apos;ve explored</h2>
            <AddCountryControl onSaved={loadCountries} />
          </div>
          {countries === null ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-teal-500 animate-spin" />
            </div>
          ) : (
            <div className="space-y-12">
              {continents.map((continent) => {
                return (
                  <div key={continent.name}>
                    <div className="flex items-center gap-3 mb-6">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                        {continent.name}
                      </h3>
                      <div className="flex-1 h-px bg-slate-100" />
                      <span className="text-xs text-slate-400 font-medium tabular-nums">
                        {continent.countries.length}
                        <span className="text-slate-300">/{CONTINENT_TOTALS[continent.name] ?? '?'}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {continent.countries.map((country) => {
                        const type = visitType(country);
                        return (
                          <Link
                            key={country.id}
                            href={`/travel/${countrySlug(country)}`}
                            className={`flex flex-col items-center gap-2.5 border rounded-xl p-4 transition-colors ${CARD_STYLE[type]}`}
                          >
                            <span className="text-3xl leading-none">{country.flag}</span>
                            <span className="text-xs font-medium text-slate-600 text-center leading-tight">
                              {country.display_name}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${PILL_STYLE[type]}`}>
                              {PILL_LABEL[type]}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
