'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ChevronLeft, ChevronRight, Disc3, Utensils, Film, ExternalLink, Globe, Music2 } from 'lucide-react';
import type { VisitType } from '@/components/WorldMap';

const WorldMap = dynamic(() => import('@/components/WorldMap'), { ssr: false });

interface Photo { id: number; src: string; alt: string; }
interface Country {
  id: string; geo_name: string; display_name: string; flag: string;
  continent: string; baylor_visited: boolean; isabel_visited: boolean;
}
interface VinylRecord {
  id: string; title: string; artist: string;
  releaseYear?: number; vinylColor?: string; coverImage?: string; backCoverImage?: string;
  status: 'owned' | 'wishlist' | 'upgrade';
}

function VinylCard({ record }: { record: VinylRecord }) {
  const [isFlipped, setIsFlipped] = useState(false);
  const hasBack = Boolean(record.backCoverImage);

  return (
    <Link
      href={`/vinyl/${record.id}`}
      className="relative shrink-0 h-40 w-40 sm:h-48 sm:w-48 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 shadow-sm block"
      style={{ perspective: '1200px' }}
      onMouseEnter={() => hasBack && setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
    >
      <div
        className="relative h-full w-full transition-transform duration-500 ease-out"
        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        <div className="absolute inset-0 [backface-visibility:hidden]">
          {record.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={record.coverImage} alt={record.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center" style={{ backgroundColor: record.vinylColor ? `${record.vinylColor}22` : '#f3f4f6' }}>
              <Disc3 className="h-10 w-10 text-gray-300" style={{ color: record.vinylColor ?? undefined }} />
            </div>
          )}
        </div>
        {hasBack && (
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={record.backCoverImage!} alt={`${record.title} back`} className="h-full w-full object-cover" />
          </div>
        )}
      </div>
    </Link>
  );
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

      {/* ── Quick nav ── */}
      <section className="border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Travel', href: '/travel', icon: <Globe className="h-5 w-5" /> },
              { label: 'Vinyl', href: '/vinyl', icon: <Music2 className="h-5 w-5" /> },
              { label: 'Food', href: '/restaurants', icon: <Utensils className="h-5 w-5" /> },
              { label: 'Movies', href: '/movies', icon: <Film className="h-5 w-5" /> },
            ].map(({ label, href, icon }) => (
              <Link
                key={label}
                href={href}
                className="flex flex-col items-center gap-2 rounded-2xl border border-gray-100 bg-white py-4 px-2 text-center hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-500">{icon}</span>
                <span className="text-xs font-medium text-gray-700">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Travel map preview ── */}
      <section className="py-14 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Where we&apos;ve been</h2>
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
      <section className="py-14 border-t border-gray-100 bg-gray-50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <div className="flex items-center justify-between">
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
        </div>

        {vinyls.length === 0 ? (
          <div className="flex gap-4 px-4 sm:px-6 lg:px-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="shrink-0 h-40 w-40 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="py-2">
            <div className="vinyl-marquee flex w-max gap-4" style={{ animationDuration: '240s' }}>
              {[...vinyls, ...vinyls, ...vinyls].map((r, i) => (
                <VinylCard key={`${r.id}-${i}`} record={r} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ── Mini games ── */}
      <section className="py-14 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mini games</h2>
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
