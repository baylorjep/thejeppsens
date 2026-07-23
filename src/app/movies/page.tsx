import Header from '@/components/Header';
import MoviePicker from '@/components/MoviePicker';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Baylor & Isabel - Movies',
  description: 'Pick a movie for date night.',
};

export default function MoviesPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <MoviePicker />
    </main>
  );
} 