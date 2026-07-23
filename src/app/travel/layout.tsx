import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Baylor & Isabel - Travel',
  description: 'Everywhere we\'ve been together.',
};

export default function TravelLayout({ children }: { children: React.ReactNode }) {
  return children;
}
