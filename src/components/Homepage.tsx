'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, Disc3, Utensils, Film, ExternalLink } from 'lucide-react';
import type { VisitType } from '@/components/WorldMap';

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false });

interface Photo { id: number; src: string; alt: string; }
interface Country {
  id: string; geo_name: string; display_name: string; flag: string;
  continent: string; baylor_visited: boolean; isabel_visited: boolean;
}
interface VinylRecord {
  id: string; title: string; artist: string;
  releaseYear?: number; vinylColor?: string; coverImage?: string;
  status: 'owned' | 'wishlist' | 'upgrade';
}

const photos: Photo[] = [
  { id: 1, src: '/photos/temple.JPG', alt: 'Baylor and Isabel at the temple' },
];

function visitType(c: Country): VisitType {
  if (c.baylor_visited && c.isabel_visited) return 'both';
  if (c.baylor_visited) return 'baylor';
  return 'isabel';
}

export default function Homepage() {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [vinyls, setVinyls] = useState<VinylRecord[]>([]);

  useEffect(() => {
    const t = setInterval(() => setCurrentPhotoIndex((p) => (p + 1) % photos.length), 5000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('/api/travel/countries')
      .then((r) => r.json())
      .then((d) => setCountries(d.countries ?? []))
      .catch(() => setCountries([]));
    fetch('/api/vinyl-records')
      .then((r) => r.json())
      .then((d) => setVinyls((d.records ?? []).filter((r: VinylRecord) => r.status === 'owned')))
      .catch(() => {});
  }, []);

  const visitedMap = useMemo<Map<string, VisitType>>(() => {
    const m = new Map<string, VisitType>();
    for (const c of countries ?? []) m.set(c.geo_name, visitType(c));
    return m;
  }, [countries]);

  const continentCount = useMemo(() => {
    const s = new Set((countries ?? []).map((c) => c.continent));
    return s.size;
  }, [countries]);

  const photo = photos[currentPhotoIndex];
  const isVertical = photo.src.toLowerCase().includes('vertical');

  return (
    <div className="bg-white">

      {/* ── Hero photo ── */}
      <section className="py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`relative bg-gray-100 rounded-3xl overflow-hidden shadow-2xl ${isVertical ? 'h-96' : 'h-80'}`}>
            <Image
              src={photo.src} alt={photo.alt} fill
              className={`object-cover ${isVertical ? 'object-contain' : 'object-cover object-bottom'}`}
              onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
            />
            {photos.length > 1 && (
              <>
                <button onClick={() => setCurrentPhotoIndex((p) => (p - 1 + photos.length) % photos.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all">
                  <ChevronLeft className="h-5 w-5 text-gray-800" />
                </button>
                <button onClick={() => setCurrentPhotoIndex((p) => (p + 1) % photos.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-3 rounded-full shadow-lg transition-all">
                  <ChevronRight className="h-5 w-5 text-gray-800" />
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Travel map preview ── */}
      <section className="py-14 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Our travels</h2>
              {countries && (
                <p className="text-sm text-gray-400 mt-1">
                  {countries.length} countries · {continentCount} continents
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />Both</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Baylor</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />Isabel</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-5">
            {countries === null ? (
              <div className="h-[300px] flex items-center justify-center bg-sky-50 rounded-xl">
                <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-teal-500 animate-spin" />
              </div>
            ) : (
              <WorldMap visitedMap={visitedMap} />
            )}
          </div>

          <div className="mt-4 text-right">
            <Link href="/travel" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
              Explore our travels →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Vinyl carousel ── */}
      <section className="py-14 border-t border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Vinyl collection</h2>
              {vinyls.length > 0 && (
                <p className="text-sm text-gray-400 mt-1">{vinyls.length} records</p>
              )}
            </div>
            <Link href="/vinyl" className="text-sm text-gray-400 hover:text-gray-900 transition-colors">
              View all →
            </Link>
          </div>

          {vinyls.length === 0 ? (
            <div className="flex gap-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="shrink-0 w-36 bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-100" />
                  <div className="p-3 space-y-1.5">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              {vinyls.map((r) => (
                <Link key={r.id} href="/vinyl"
                  className="snap-start shrink-0 w-36 bg-white rounded-xl border border-gray-100 hover:border-gray-300 overflow-hidden transition-colors group">
                  {r.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.coverImage} alt={r.title} className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center"
                      style={{ backgroundColor: r.vinylColor ? `${r.vinylColor}22` : '#f3f4f6' }}>
                      <Disc3 className="h-10 w-10 text-gray-300 group-hover:text-gray-400 transition-colors"
                        style={{ color: r.vinylColor ?? undefined }} />
                    </div>
                  )}
                  <div className="p-3">
                    <div className="text-xs font-semibold text-gray-900 truncate">{r.title}</div>
                    <div className="text-xs text-gray-400 truncate mt-0.5">{r.artist}</div>
                    {r.releaseYear && (
                      <div className="text-[10px] text-gray-300 mt-1">{r.releaseYear}</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Mini games ── */}
      <section className="py-14 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mini games</h2>
          <p className="text-sm text-gray-400 mb-8">Quick tools for brackets, rankings, and narrowing down choices.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <a href="https://scene-it-baylor.vercel.app/host" target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors">
              Play Cliplash <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
            </a>
            <a href="https://scene-it-baylor.vercel.app/host" target="_blank" rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors">
              Movie Trivia <ExternalLink className="h-3.5 w-3.5 text-gray-400" />
            </a>
            <Link href="/bracket"
              className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors">
              Tournament Bracket
            </Link>
            <Link href="/keep4"
              className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors">
              Keep 4 Game
            </Link>
          </div>
        </div>
      </section>

      {/* ── Food & Movies ── */}
      <section className="py-14 border-t border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 gap-4">
            <Link href="/restaurants"
              className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-300 p-6 transition-colors group">
              <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 group-hover:bg-gray-200 transition-colors">
                <Utensils className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Food</h3>
                <p className="text-sm text-gray-400">Pick a restaurant without the back and forth.</p>
              </div>
            </Link>

            <Link href="/movies"
              className="flex items-start gap-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-300 p-6 transition-colors group">
              <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 group-hover:bg-gray-200 transition-colors">
                <Film className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Movies</h3>
                <p className="text-sm text-gray-400">Keep movie night moving.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
