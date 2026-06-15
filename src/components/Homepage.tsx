'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Disc3 } from 'lucide-react';

interface Photo {
  id: number;
  src: string;
  alt: string;
  caption?: string;
}

export default function Homepage() {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Your photos - add your actual photos to the public/photos folder
  const photos: Photo[] = [
    {
      id: 1,
      src: "/photos/temple.JPG",
      alt: "Baylor and Isabel at the temple"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [photos.length]);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  // Check if current photo is vertical based on filename
  const isCurrentPhotoVertical = () => {
    return photos[currentPhotoIndex].src.toLowerCase().includes('vertical');
  };

  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Photo Section */}
        <div className="relative max-w-4xl mx-auto mb-16">
          {photos.length > 0 ? (
            <>
              <div className={`relative bg-gray-100 rounded-3xl overflow-hidden shadow-2xl ${
                isCurrentPhotoVertical() ? 'h-96' : 'h-80'
              }`}>
                <Image
                  src={photos[currentPhotoIndex].src}
                  alt={photos[currentPhotoIndex].alt}
                  fill
                  className={`object-cover ${
                    isCurrentPhotoVertical() ? 'object-contain' : 'object-cover object-bottom'
                  }`}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://via.placeholder.com/800x600/e5e7eb/9ca3af?text=Add+Your+Photo`;
                  }}
                />

                {/* Navigation Arrows */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all backdrop-blur-sm"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all backdrop-blur-sm"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>

              {/* Photo Indicators */}
              {photos.length > 1 && (
                <div className="flex justify-center space-x-2 mt-6">
                  {photos.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        index === currentPhotoIndex ? 'bg-gray-700' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="relative h-80 bg-gray-100 rounded-3xl overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 mb-2">Add a photo of you and Isabel</p>
                <p className="text-sm text-gray-500">
                  Copy a photo to <code className="bg-gray-200 px-2 py-1 rounded">public/photos/</code> and update the code
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-16">
          <Link href="/travel" className="rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-gray-400">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
              <svg className="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-950">Travel</h3>
            <p className="text-sm leading-6 text-gray-600">
              Remember where we&apos;ve been.
            </p>
          </Link>

          <Link href="/vinyl" className="rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-gray-400">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
              <Disc3 className="h-5 w-5 text-gray-800" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-950">Vinyl</h3>
            <p className="text-sm leading-6 text-gray-600">
              A growing catalog of Isabel&apos;s records.
            </p>
          </Link>

          <Link href="/restaurants" className="rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-gray-400">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
              <svg className="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-950">Food</h3>
            <p className="text-sm leading-6 text-gray-600">
              Pick a restaurant without the back and forth.
            </p>
          </Link>

          <Link href="/movies" className="rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-gray-400">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
              <svg className="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M6 4h12M4 16h16M4 12h16" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-950">Movies</h3>
            <p className="text-sm leading-6 text-gray-600">
              Keep movie night moving.
            </p>
          </Link>

          <Link href="/budget" className="rounded-lg border border-gray-200 bg-white p-6 transition-colors hover:border-gray-400">
            <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
              <svg className="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-950">Budget</h3>
            <p className="text-sm leading-6 text-gray-600">
              Keep money plans in one place.
            </p>
          </Link>
        </div>

        {/* Call to Action */}
        <div className="mx-auto max-w-3xl border-t border-gray-200 pt-10 text-center">
          <h2 className="mb-4 text-2xl font-semibold text-gray-950">
            Small decision games
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-gray-600">
            Quick tools for brackets, rankings, and narrowing choices down.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="https://scene-it-baylor.vercel.app/host"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
            >
              Play Cliplash
            </a>
            <a
              href="https://scene-it-baylor.vercel.app/host"
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
            >
              Movie Trivia
            </a>
            <Link
              href="/bracket"
              className="rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
            >
              Tournament Bracket
            </Link>
            <Link
              href="/keep4"
              className="rounded-md border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
            >
              Keep 4 Game
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
} 
