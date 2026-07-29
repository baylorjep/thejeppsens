import type { Metadata } from 'next';
import Header from '@/components/Header';
import Mp3Tool from '@/components/Mp3Tool';

export const metadata: Metadata = {
  title: 'Baylor & Isabel',
  robots: { index: false, follow: false },
};

export default function Mp3Page() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Mp3Tool />
      </div>
    </main>
  );
}
