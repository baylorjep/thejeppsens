'use client';

import dynamic from 'next/dynamic';

const NflDealGame = dynamic(() => import('./NflDealGame'), { ssr: false });

export default function NflDealGameLoader() {
  return <NflDealGame />;
}
