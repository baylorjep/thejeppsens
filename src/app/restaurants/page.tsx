import Header from '@/components/Header';
import RestaurantPicker from '@/components/RestaurantPicker';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Baylor & Isabel - Restaurants',
  description: 'Pick where to eat for date night.',
};

export default function RestaurantsPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <RestaurantPicker />
    </main>
  );
} 