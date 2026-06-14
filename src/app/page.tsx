import Header from '@/components/Header';
import Homepage from '@/components/Homepage';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Homepage />
      
      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-sm text-gray-500">
            <p>Built for Baylor & Isabel.</p>
            <p className="mt-2">Food, movies, trips, games, and records.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
