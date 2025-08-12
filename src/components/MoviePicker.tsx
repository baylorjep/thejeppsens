'use client';

import { useState } from 'react';
import { Film, Sparkles, X, Play } from 'lucide-react';

interface Movie {
  id: string;
  title: string;
  genre: string;
  length: string;
  type: 'animated' | 'live-action';
  poster?: string;
  trailer?: string;
}

export default function MoviePicker() {
  const [movies, setMovies] = useState<Movie[]>([
    {
      id: "1",
      title: "The Shawshank Redemption",
      genre: "drama",
      length: "long (>120 min)",
      type: "live-action"
    },
    {
      id: "2",
      title: "The Godfather",
      genre: "drama",
      length: "long (>120 min)",
      type: "live-action"
    },
    {
      id: "3",
      title: "Pulp Fiction",
      genre: "crime",
      length: "long (>120 min)",
      type: "live-action"
    },
    {
      id: "4",
      title: "The Dark Knight",
      genre: "action",
      length: "long (>120 min)",
      type: "live-action"
    },
    {
      id: "5",
      title: "Fight Club",
      genre: "drama",
      length: "medium (90-120 min)",
      type: "live-action"
    },
    {
      id: "6",
      title: "Inception",
      genre: "sci-fi",
      length: "long (>120 min)",
      type: "live-action"
    },
    {
      id: "7",
      title: "The Matrix",
      genre: "sci-fi",
      length: "medium (90-120 min)",
      type: "live-action"
    },
    {
      id: "8",
      title: "Goodfellas",
      genre: "crime",
      length: "long (>120 min)",
      type: "live-action"
    },
    {
      id: "9",
      title: "The Silence of the Lambs",
      genre: "thriller",
      length: "medium (90-120 min)",
      type: "live-action"
    },
    {
      id: "10",
      title: "Interstellar",
      genre: "sci-fi",
      length: "long (>120 min)",
      type: "live-action"
    },
    {
      id: "11",
      title: "The Lion King",
      genre: "drama",
      length: "medium (90-120 min)",
      type: "animated"
    },
    {
      id: "12",
      title: "Toy Story",
      genre: "comedy",
      length: "short (<90 min)",
      type: "animated"
    },
    {
      id: "13",
      title: "Finding Nemo",
      genre: "comedy",
      length: "medium (90-120 min)",
      type: "animated"
    },
    {
      id: "14",
      title: "Up",
      genre: "comedy",
      length: "short (<90 min)",
      type: "animated"
    },
    {
      id: "15",
      title: "The Incredibles",
      genre: "action",
      length: "medium (90-120 min)",
      type: "animated"
    }
  ]);
  const [newMovie, setNewMovie] = useState<Movie>({ 
    id: '', 
    title: '', 
    genre: 'action', 
    length: '90-120 min', 
    type: 'live-action', 
    poster: '', 
    trailer: '' 
  });
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedLength, setSelectedLength] = useState('');
  const [selectedType, setSelectedType] = useState<'animated' | 'live-action' | ''>('');
  const [result, setResult] = useState<Movie | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const genres = ['action', 'comedy', 'drama', 'horror', 'romance', 'sci-fi', 'thriller', 'documentary', 'crime'];
  const lengths = ['short (<90 min)', 'medium (90-120 min)', 'long (>120 min)'];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newMovie.title.trim()) {
      const movie: Movie = {
        id: Date.now().toString(),
        title: newMovie.title.trim(),
        genre: newMovie.genre,
        length: newMovie.length,
        type: newMovie.type,
        poster: newMovie.poster || undefined,
        trailer: newMovie.trailer || undefined,
      };
      setMovies([...movies, movie]);
      setNewMovie({ id: '', title: '', genre: 'action', length: '90-120 min', type: 'live-action', poster: '', trailer: '' });
    }
  };

  const removeMovie = (id: string) => {
    setMovies(movies.filter(m => m.id !== id));
  };

  const pickRandom = () => {
    if (movies.length === 0) return;

    let filteredMovies = movies;
    
    // Filter by selected criteria
    if (selectedGenre) {
      filteredMovies = filteredMovies.filter(movie => movie.genre === selectedGenre);
    }
    if (selectedLength) {
      filteredMovies = filteredMovies.filter(movie => movie.length === selectedLength);
    }
    if (selectedType) {
      filteredMovies = filteredMovies.filter(movie => movie.type === selectedType);
    }

    if (filteredMovies.length === 0) {
      alert('No movies match our selected criteria!');
      return;
    }

    const randomIndex = Math.floor(Math.random() * filteredMovies.length);
    const picked = filteredMovies[randomIndex];
    setResult(picked);
    setShowResult(true);
  };

  const resetResult = () => {
    setShowResult(false);
    setResult(null);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            <Film className="inline-block h-8 w-8 text-gray-700 mr-3" />
            Movie Picker
          </h2>
          <p className="text-gray-600 mb-6">
            Can&apos;t decide what to watch? Let us pick for you!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-6">
            {/* Add Movie */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Add Movies</h3>
              <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newMovie.title}
                  onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
                  placeholder="Movie name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Add
                </button>
              </form>

              {/* Filters */}
              <div className="space-y-4">
                {/* Genre */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Genre (optional)</h4>
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="">Any Genre</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre.charAt(0).toUpperCase() + genre.slice(1)}</option>
                    ))}
                  </select>
                </div>

                {/* Length */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Length (optional)</h4>
                  <select
                    value={selectedLength}
                    onChange={(e) => setSelectedLength(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="">Any Length</option>
                    {lengths.map(length => (
                      <option key={length} value={length}>{length}</option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Type (optional)</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedType(selectedType === 'animated' ? '' : 'animated')}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedType === 'animated'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Animated
                    </button>
                    <button
                      onClick={() => setSelectedType(selectedType === 'live-action' ? '' : 'live-action')}
                      className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                        selectedType === 'live-action'
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Live Action
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Movie List */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Our Movies ({movies.length})</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {movies.map((movie) => (
                  <div key={movie.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{movie.title}</div>
                      <div className="text-sm text-gray-600">
                        {movie.genre && <span className="mr-2">{movie.genre}</span>}
                        {movie.length && <span className="mr-2">{movie.length}</span>}
                        {movie.type && <span>{movie.type}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => removeMovie(movie.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pick Button */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <button
                onClick={pickRandom}
                disabled={movies.length === 0}
                className={`w-full py-4 rounded-lg text-xl font-bold text-white transition-all ${
                  movies.length > 0
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                <Sparkles className="inline-block h-6 w-6 mr-2" />
                Pick a Movie!
              </button>
            </div>
          </div>

          {/* Result Panel */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            {!showResult ? (
              <div className="text-center py-12 text-gray-500">
                <Film className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Add some movies and click the button to get started!</p>
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="h-16 w-16 text-gray-700 mx-auto mb-6" />
                <h3 className="text-3xl font-bold text-gray-800 mb-4">We&apos;re watching...</h3>
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200">
                  <h4 className="text-2xl font-bold text-gray-800 mb-2">{result?.title}</h4>
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {result?.genre && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {result.genre}
                      </span>
                    )}
                    {result?.length && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {result.length}
                      </span>
                    )}
                    {result?.type && (
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                        {result.type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-center space-x-4 mt-6">
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Watch Trailer
                  </button>
                  <button
                    onClick={resetResult}
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Pick Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trailer Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">Movie Trailer</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Trailer placeholder for {result?.title}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
} 