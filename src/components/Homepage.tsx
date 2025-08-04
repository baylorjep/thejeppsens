'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold text-gray-800 mb-6 tracking-tight">
            JEP
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Our digital space for making decisions together
          </p>
        </div>

        {/* Photo Section */}
        <div className="relative max-w-4xl mx-auto mb-20">
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
                    isCurrentPhotoVertical() ? 'object-contain' : 'object-cover'
                  }`}
                  onError={(e) => {
                    // Fallback to a placeholder if photo doesn't load
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
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <a href="/restaurants" className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 hover:border-gray-300 transition-all group shadow-lg hover:shadow-xl transform hover:scale-105">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Food</h3>
            <p className="text-gray-600 leading-relaxed">
              Can&apos;t decide where to eat? Let us help you pick a restaurant together
            </p>
          </a>
          
          <a href="/movies" className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 hover:border-gray-300 transition-all group shadow-lg hover:shadow-xl transform hover:scale-105">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
              <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M6 4h12M4 16h16M4 12h16" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Movies</h3>
            <p className="text-gray-600 leading-relaxed">
              Find the perfect movie to watch together with our smart picker
            </p>
          </a>
          
          <a href="/budget" className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 hover:border-gray-300 transition-all group shadow-lg hover:shadow-xl transform hover:scale-105">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-200 transition-colors">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">Budget</h3>
            <p className="text-gray-600 leading-relaxed">
              Track your finances and plan your future together with our budget tools
            </p>
          </a>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-800 mb-6">
            Want to play some games?
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Check out our mini games for some fun decision-making challenges
          </p>
          <div className="flex justify-center space-x-6">
            <a
              href="/bracket"
              className="px-8 py-4 bg-gray-700 hover:bg-gray-800 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              Tournament Bracket
            </a>
            <a
              href="/keep4"
              className="px-8 py-4 bg-gray-700 hover:bg-gray-800 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              Keep 4 Game
            </a>
          </div>
        </div>
      </div>
    </section>
  );
} 