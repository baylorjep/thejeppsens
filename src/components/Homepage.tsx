'use client';

import { useState, useEffect, useCallback } from 'react';
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
    <section className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold text-white mb-6 tracking-tight">
            The Jeppsens
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Our digital space for making decisions together
          </p>
        </div>

        {/* Photo Section */}
        <div className="relative max-w-4xl mx-auto mb-20">
          {photos.length > 0 ? (
            <>
              <div className={`relative bg-gray-800 rounded-3xl overflow-hidden shadow-2xl ${
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
                    target.src = `https://via.placeholder.com/800x600/374151/9ca3af?text=Add+Your+Photo`;
                  }}
                />
                
                {/* Navigation Arrows */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full shadow-lg transition-all backdrop-blur-sm"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full shadow-lg transition-all backdrop-blur-sm"
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
                        index === currentPhotoIndex ? 'bg-white' : 'bg-gray-600'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="relative h-80 bg-gray-800 rounded-3xl overflow-hidden flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-400 mb-2">Add a photo of you and Isabel</p>
                <p className="text-sm text-gray-500">
                  Copy a photo to <code className="bg-gray-700 px-2 py-1 rounded">public/photos/</code> and update the code
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all group">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-500 transition-colors">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Decision Tools</h3>
            <p className="text-gray-300 leading-relaxed">
              Restaurant pickers, movie selectors, and bracket builders to help us make choices together
            </p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all group">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-500 transition-colors">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Built For Us</h3>
            <p className="text-gray-300 leading-relaxed">
              Designed specifically for our needs and preferences, making decision-making effortless
            </p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700 hover:border-gray-600 transition-all group">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-green-500 transition-colors">
              <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Fast & Simple</h3>
            <p className="text-gray-300 leading-relaxed">
              Clean interface with smooth animations that makes every interaction feel natural
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to make some decisions?
          </h2>
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
            Explore our tools and start making choices together with a modern, intuitive experience
          </p>
          <div className="flex justify-center space-x-6">
            <a
              href="/restaurants"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              Pick a Restaurant
            </a>
            <a
              href="/movies"
              className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
            >
              Choose a Movie
            </a>
          </div>
        </div>
      </div>
    </section>
  );
} 