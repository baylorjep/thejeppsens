'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Landmark } from 'lucide-react';
import { espnHeadshotUrl } from '@/lib/nflDeal/qbData';
import type { BankOffer } from '@/lib/nflDeal/types';

interface Props {
  offer: BankOffer;
  isFinal: boolean;
  onDeal: () => void;
  onNoDeal: () => void;
}

const REACTION_DELAY_MS = 1100;

export default function NflDealOfferModal({ offer, isFinal, onDeal, onNoDeal }: Props) {
  const dealButtonRef = useRef<HTMLButtonElement>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [reaction, setReaction] = useState<'deal' | 'no-deal' | null>(null);
  const headshotUrl = espnHeadshotUrl(offer.quarterback);

  useEffect(() => {
    dealButtonRef.current?.focus();
  }, [offer]);

  function handleDeal() {
    setReaction('deal');
    setTimeout(onDeal, REACTION_DELAY_MS);
  }

  function handleNoDeal() {
    setReaction('no-deal');
    setTimeout(onNoDeal, REACTION_DELAY_MS);
  }

  if (reaction) {
    const isDeal = reaction === 'deal';
    return (
      <div
        role="status"
        aria-live="assertive"
        className={[
          'fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 backdrop-blur-sm',
          isDeal ? 'bg-green-600/90' : 'bg-red-600/90',
        ].join(' ')}
      >
        <p className="animate-big-reaction text-6xl font-black italic text-white drop-shadow-lg sm:text-7xl">
          {isDeal ? 'DEAL!' : 'NO DEAL!'}
        </p>
        <p className="text-lg font-semibold text-white/90">
          {isDeal ? `${offer.quarterback.name}, ${offer.offerOvr} OVR` : 'Back to the cases.'}
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bank-offer-heading"
        className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-900 p-6 text-center shadow-2xl"
      >
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15">
          <Landmark className="h-5 w-5 text-amber-300" aria-hidden />
        </div>
        <h2 id="bank-offer-heading" className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/90">
          {isFinal ? 'Final offer' : `Round ${offer.round} offer`}
        </h2>

        <div className="mx-auto mt-4 h-24 w-24 overflow-hidden rounded-full border-2 border-amber-400/60 bg-slate-800">
          {headshotUrl && !imgFailed ? (
            <div className="relative h-full w-full">
              <Image src={headshotUrl} alt="" fill sizes="96px" className="object-cover" onError={() => setImgFailed(true)} />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-slate-300">
              {offer.quarterback.name.split(' ').map((p) => p[0]).join('')}
            </div>
          )}
        </div>

        <p className="mt-4 text-2xl font-bold text-white">{offer.quarterback.name}</p>
        <p className="mt-1 text-3xl font-black text-amber-300">{offer.offerOvr} OVR</p>

        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={handleNoDeal}
            className="flex-1 rounded-lg border-2 border-red-500/70 px-4 py-3 text-sm font-bold uppercase tracking-wide text-red-300 transition-colors hover:bg-red-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
          >
            No Deal
          </button>
          <button
            ref={dealButtonRef}
            type="button"
            onClick={handleDeal}
            className="flex-1 rounded-lg bg-green-500 px-4 py-3 text-sm font-bold uppercase tracking-wide text-slate-950 transition-colors hover:bg-green-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-200"
          >
            Deal
          </button>
        </div>
      </div>
    </div>
  );
}
