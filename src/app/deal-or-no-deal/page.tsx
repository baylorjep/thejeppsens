import type { Metadata } from 'next';
import Header from '@/components/Header';
import NflDealGameLoader from '@/components/NflDealGameLoader';

export const metadata: Metadata = {
  title: 'Deal or No Deal - NFL',
  description: 'QB, RB, WR, TE, D/ST, or build a Dynasty. 32 sealed cases. Deal, or no deal?',
};

export default function DealOrNoDealPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <NflDealGameLoader />
    </main>
  );
}
