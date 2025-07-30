'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Heart, Camera, Sparkles } from 'lucide-react';

// Sample photos - you can replace these with actual photos
const samplePhotos = [
  {
    id: 1,
    src: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=600&fit=crop',
    alt: 'Couple enjoying sunset',
    caption: 'Sunset adventures'
  },
  {
    id: 2,
    src: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&h=600&fit=crop',
    alt: 'Coffee date',
    caption: 'Coffee & conversations'
  },
  {
    id: 3,
    src: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=600&fit=crop',
    alt: 'Travel memories',
    caption: 'Travel memories'
  },
  {
    id: 4,
    src: 'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=800&h=600&fit=crop',
    alt: 'Home moments',
    caption: 'Cozy home moments'
  }
];

export default function Homepage() {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Auto-rotate photos
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhotoIndex((prev) => (prev + 1) % samplePhotos.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="min-h-screen flex items-center justify-center py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Welcome Text */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="space-y-4">
              <motion.h1 
                className="text-5xl lg:text-6xl font-bold leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Welcome to{' '}
                <span className="text-gray-800">
                  thejeppsens.com
                </span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-gray-600 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Modern decision tools for couples ✨
              </motion.p>
              
              <motion.p 
                className="text-lg text-gray-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                A clean, simple space for us to plan date nights, make decisions together, and create memories. 
                From restaurant roulette to movie magic, we&apos;ve got everything we need for our adventures.
              </motion.p>
            </div>

            {/* Quick Stats */}
            <motion.div 
              className="grid grid-cols-3 gap-4 pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                <Heart className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">∞</div>
                <div className="text-sm text-gray-600">Adventures</div>
              </div>
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                <Camera className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">100+</div>
                <div className="text-sm text-gray-600">Memories</div>
              </div>
              <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200">
                <Sparkles className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-800">5</div>
                <div className="text-sm text-gray-600">Tools</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Photo Carousel */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative"
          >
            <div className="relative h-96 lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              {samplePhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: index === currentPhotoIndex ? 1 : 0,
                    scale: index === currentPhotoIndex ? 1 : 1.1
                  }}
                  transition={{ duration: 0.8 }}
                >
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-lg font-medium">{photo.caption}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Photo Indicators */}
            <div className="flex justify-center space-x-2 mt-4">
              {samplePhotos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPhotoIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentPhotoIndex 
                      ? 'bg-gray-700 scale-125' 
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 