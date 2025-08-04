'use client';

import { useState, useEffect } from 'react';
import { Heart, Users, Star, Camera } from 'lucide-react';

export default function Homepage() {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Sample photos - replace with your actual photos
  const photos = [
    '/api/placeholder/400/300',
    '/api/placeholder/400/300',
    '/api/placeholder/400/300',
    '/api/placeholder/400/300'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [photos.length]);

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Welcome to thejeppsens.com
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Our little corner of the internet ✨
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            A clean, simple space for us to make decisions together. From restaurant picks to movie nights, 
            we&apos;ve got everything we need to make choosing fun and easy.
          </p>
        </div>

        {/* Photo Carousel */}
        <div className="relative max-w-2xl mx-auto mb-16">
          <div className="relative h-80 bg-gray-200 rounded-2xl overflow-hidden">
            <img
              src={photos[currentPhotoIndex]}
              alt="Couple photo"
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Photo Indicators */}
          <div className="flex justify-center space-x-2 mt-4">
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
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <Heart className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Our Tools</h3>
            <p className="text-gray-600">Restaurant pickers, movie selectors, and more</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <Users className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Just For Us</h3>
            <p className="text-gray-600">Built specifically for us to make choices together</p>
          </div>
          
          <div className="text-center p-6 bg-white rounded-xl shadow-lg border border-gray-200">
            <Star className="h-12 w-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Simple & Fun</h3>
            <p className="text-gray-600">Clean interface that makes decision-making enjoyable</p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Ready to make some decisions?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Explore our tools and start making choices together!
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="/restaurants"
              className="px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Pick a Restaurant
            </a>
            <a
              href="/movies"
              className="px-8 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Choose a Movie
            </a>
          </div>
        </div>
      </div>
    </section>
  );
} 