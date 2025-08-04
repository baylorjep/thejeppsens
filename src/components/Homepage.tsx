'use client';

import { useState, useEffect } from 'react';
import { Heart, Users, Star, Camera, ChevronLeft, ChevronRight } from 'lucide-react';

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
      src: "/photos/party.JPG",
      alt: "Baylor and Isabel at a party",
      caption: "Party time together"
    },
    {
      id: 2,
      src: "/photos/temple.JPG", 
      alt: "Baylor and Isabel at the temple",
      caption: "Temple adventures"
    },
    {
      id: 3,
      src: "/photos/dipvertical.JPG",
      alt: "Baylor and Isabel doing a dip",
      caption: "Dance moves"
    },
    {
      id: 4,
      src: "/photos/templevertical.heic",
      alt: "Baylor and Isabel at the temple",
      caption: "Temple memories"
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
          <div className={`relative bg-gray-200 rounded-2xl overflow-hidden ${
            isCurrentPhotoVertical() ? 'h-96' : 'h-80'
          }`}>
            <img
              src={photos[currentPhotoIndex].src}
              alt={photos[currentPhotoIndex].alt}
              className={`w-full h-full object-cover ${
                isCurrentPhotoVertical() ? 'object-contain' : 'object-cover'
              }`}
              onError={(e) => {
                // Fallback to a placeholder if photo doesn't load
                const target = e.target as HTMLImageElement;
                target.src = `https://via.placeholder.com/800x600/e5e7eb/9ca3af?text=Add+Your+Photo+${currentPhotoIndex + 1}`;
              }}
            />
            
            {/* Navigation Arrows */}
            <button
              onClick={prevPhoto}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={nextPhoto}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg transition-all"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
            
            {/* Caption */}
            {photos[currentPhotoIndex].caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white text-center font-medium">
                  {photos[currentPhotoIndex].caption}
                </p>
              </div>
            )}
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