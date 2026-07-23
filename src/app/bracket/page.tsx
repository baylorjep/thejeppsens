import Header from '@/components/Header';
import BracketBuilder from '@/components/BracketBuilder';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Baylor & Isabel - Bracket',
  description: 'Build a bracket to settle it once and for all.',
};

export default function BracketPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <BracketBuilder />
    </main>
  );
} 