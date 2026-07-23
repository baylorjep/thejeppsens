import Header from '@/components/Header';
import Keep4Cut4 from '@/components/Keep4Cut4';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Baylor & Isabel - Keep 4 / Cut 4',
  description: 'Narrow it down to our final 4.',
};

export default function Keep4Page() {
  return (
    <main className="min-h-screen">
      <Header />
      <Keep4Cut4 />
    </main>
  );
} 