'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Film, Play, Clock, Star, Sparkles, RotateCcw, X } from 'lucide-react';

interface Movie {
  id: number;
  title: string;
  genre: string[];
  year: number;
  duration: number;
  rating: number;
  poster: string;
  trailer?: string;
  type: 'live' | 'animated';
}

const sampleMovies: Movie[] = [
  { 
    id: 1, 
    title: "The Princess Bride", 
    genre: ["fantasy", "romance", "adventure"], 
    year: 1987, 
    duration: 98, 
    rating: 8.1, 
    poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
    type: 'live'
  },
  { 
    id: 2, 
    title: "Up", 
    genre: ["animation", "adventure", "comedy"], 
    year: 2009, 
    duration: 96, 
    rating: 8.3, 
    poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
    type: 'animated'
  },
  { 
    id: 3, 
    title: "La La Land", 
    genre: ["musical", "romance", "drama"], 
    year: 2016, 
    duration: 128, 
    rating: 8.0, 
    poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
    type: 'live'
  },
  { 
    id: 4, 
    title: "The Grand Budapest Hotel", 
    genre: ["comedy", "drama", "adventure"], 
    year: 2014, 
    duration: 99, 
    rating: 8.1, 
    poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
    type: 'live'
  },
  { 
    id: 5, 
    title: "Spirited Away", 
    genre: ["animation", "fantasy", "adventure"], 
    year: 2001, 
    duration: 125, 
    rating: 8.6, 
    poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
    type: 'animated'
  },
  { 
    id: 6, 
    title: "Eternal Sunshine of the Spotless Mind", 
    genre: ["romance", "sci-fi", "drama"], 
    year: 2004, 
    duration: 108, 
    rating: 8.3, 
    poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
    type: 'live'
  },
];

export default function MoviePicker() {
  const [movies, setMovies] = useState<Movie[]>(sampleMovies);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newMovie, setNewMovie] = useState('');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [maxDuration, setMaxDuration] = useState<number>(180);

  const allGenres = Array.from(new Set(movies.flatMap(m => m.genre)));

  const addMovie = () => {
    if (newMovie.trim()) {
      const movie: Movie = {
        id: Date.now(),
        title: newMovie.trim(),
        genre: [],
        year: new Date().getFullYear(),
        duration: 120,
        rating: 7.0,
        poster: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=450&fit=crop",
        type: 'live'
      };
      setMovies([...movies, movie]);
      setNewMovie('');
    }
  };

  const spinForMovie = () => {
    if (movies.length === 0) return;

    setIsSpinning(true);
    setSelectedMovie(null);

    // Filter movies based on selected criteria
    let filtered = movies;
    
    if (selectedGenres.length > 0) {
      filtered = filtered.filter(m => selectedGenres.some(genre => m.genre.includes(genre)));
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(m => m.type === typeFilter);
    }
    
    filtered = filtered.filter(m => m.duration <= maxDuration);

    if (filtered.length === 0) {
      setIsSpinning(false);
      return;
    }

    // Simulate spinning animation
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * filtered.length);
      setSelectedMovie(filtered[randomIndex]);
      setIsSpinning(false);
    }, 2000);
  };

  const openMovieModal = (movie: Movie) => {
    setSelectedMovie(movie);
    setShowModal(true);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            <Film className="inline-block h-8 w-8 text-purple-500 mr-3" />
            Movie Magic
          </h2>
          <p className="text-xl text-gray-600">Let&apos;s find the perfect movie for tonight!</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Movie List & Controls */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Add New Movie */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-purple-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Add Your Favorites</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMovie}
                  onChange={(e) => setNewMovie(e.target.value)}
                  placeholder="Movie title..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addMovie()}
                />
                <button
                  onClick={addMovie}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-pink-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Filters</h3>
              
              {/* Genres */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Genres</label>
                <div className="flex flex-wrap gap-2">
                  {allGenres.map(genre => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenres(prev => 
                        prev.includes(genre) 
                          ? prev.filter(g => g !== genre)
                          : [...prev, genre]
                      )}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedGenres.includes(genre)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type & Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="live">Live Action</option>
                    <option value="animated">Animated</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Duration: {maxDuration}min
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="240"
                    step="15"
                    value={maxDuration}
                    onChange={(e) => setMaxDuration(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Movie List */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-orange-100">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Your Movies ({movies.length})</h3>
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                {movies.map(movie => (
                  <div 
                    key={movie.id} 
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => openMovieModal(movie)}
                  >
                    <div className="flex items-center space-x-3">
                      <img 
                        src={movie.poster} 
                        alt={movie.title}
                        className="w-12 h-16 object-cover rounded"
                      />
                      <div>
                        <div className="font-medium text-gray-800">{movie.title}</div>
                        <div className="text-sm text-gray-500">{movie.year}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span>{formatDuration(movie.duration)}</span>
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{movie.rating}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Spinner & Result */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center justify-center space-y-6"
          >
            {/* Spin Button */}
            <motion.button
              onClick={spinForMovie}
              disabled={isSpinning || movies.length === 0}
              className={`relative px-8 py-4 rounded-full text-xl font-bold text-white shadow-lg transition-all ${
                isSpinning 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 hover:scale-105'
              }`}
              whileHover={!isSpinning ? { scale: 1.05 } : {}}
              whileTap={!isSpinning ? { scale: 0.95 } : {}}
            >
              <motion.div
                animate={isSpinning ? { rotate: 360 } : {}}
                transition={isSpinning ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-6 w-6" />
                {isSpinning ? 'Spinning...' : 'Spin for Movie!'}
              </motion.div>
            </motion.button>

            {/* Result */}
            <AnimatePresence>
              {selectedMovie && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  className="bg-white rounded-2xl p-6 shadow-xl border border-purple-200 text-center max-w-sm w-full cursor-pointer"
                  onClick={() => openMovieModal(selectedMovie)}
                >
                  <img 
                    src={selectedMovie.poster} 
                    alt={selectedMovie.title}
                    className="w-full h-64 object-cover rounded-lg mb-4"
                  />
                  <Sparkles className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {selectedMovie.title}
                  </h3>
                  <div className="flex items-center justify-center gap-4 mb-3">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {formatDuration(selectedMovie.duration)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Star className="h-4 w-4 text-yellow-500" />
                      {selectedMovie.rating}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {selectedMovie.genre.slice(0, 3).map(genre => (
                      <span key={genre} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                        {genre}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!selectedMovie && !isSpinning && (
              <div className="text-center text-gray-500">
                <p>Click the button above to find your next movie night!</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Movie Modal */}
        <AnimatePresence>
          {showModal && selectedMovie && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-bold text-gray-800">{selectedMovie.title}</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <img 
                  src={selectedMovie.poster} 
                  alt={selectedMovie.title}
                  className="w-full h-80 object-cover rounded-lg mb-4"
                />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Year</span>
                    <span className="font-medium">{selectedMovie.year}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{formatDuration(selectedMovie.duration)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Rating</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium">{selectedMovie.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Type</span>
                    <span className="font-medium capitalize">{selectedMovie.type}</span>
                  </div>
                  
                  <div>
                    <span className="text-gray-600 block mb-2">Genres</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedMovie.genre.map(genre => (
                        <span key={genre} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {selectedMovie.trailer && (
                    <button className="w-full flex items-center justify-center gap-2 bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 transition-colors">
                      <Play className="h-5 w-5" />
                      Watch Trailer
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
} 