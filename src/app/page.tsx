import Header from '@/components/Header';
import Homepage from '@/components/Homepage';

export default function Home() {
  return (
    <main className="min-h-screen">
      <Header />
      <Homepage />
      
      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <h3 className="text-2xl font-bold mb-2">The Jeppsens</h3>
          </div>
          <div className="text-sm text-gray-400">
            <p>Built for us to make decisions together</p>
            <p className="mt-2">© 2024 Baylor & Isabel Jeppsen. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
