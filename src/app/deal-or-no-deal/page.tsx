import type { Metadata } from 'next';
import Header from '@/components/Header';
import NflDealGameLoader from '@/components/NflDealGameLoader';

export const metadata: Metadata = {
  title: 'Baylor & Isabel - Deal or No Deal',
  description: 'QB, RB, WR, or build a Dynasty. 32 sealed cases. Deal, or no deal?',
};

export default function DealOrNoDealPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <NflDealGameLoader />
    </main>
  );
}
