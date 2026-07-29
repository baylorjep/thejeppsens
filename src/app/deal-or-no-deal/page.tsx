import type { Metadata } from 'next';
import Header from '@/components/Header';
import NflDealGameLoader from '@/components/NflDealGameLoader';

export const metadata: Metadata = {
  title: 'Baylor & Isabel - NFL Deal or No Deal',
  description: '32 cases, 32 quarterbacks. Deal, or no deal?',
};

export default function DealOrNoDealPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <NflDealGameLoader />
    </main>
  );
}
