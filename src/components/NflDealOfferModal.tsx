'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { espnHeadshotUrl } from '@/lib/nflDeal/qbData';
import { ROUND_SCHEDULE } from '@/lib/nflDeal/gameLogic';
import type { BankOffer } from '@/lib/nflDeal/types';

interface Props {
  offer: BankOffer;
  isFinal: boolean;
  roundIndex: number;
  onDeal: () => void;
  /** Fires the instant Deal is clicked, before the reaction delay -- used to
   * kick off the deal-accepted YouTube cue right away (see
   * NflDealAudioController's `playDealAccepted`). */
  onDealChosen: () => void;
  onNoDeal: () => void;
}

const NO_DEAL_REACTION_DELAY_MS = 1100;
// Matches the length of the deal-accepted YouTube clip (18:31.5-18:36) so
// the game doesn't advance to the finished phase -- which silences
// whatever's playing -- before the clip has actually finished.
const DEAL_REACTION_DELAY_MS = 4500;
const NO_DEAL_STING_SRC = '/sounds/nfl-deal/no-deal-sting.mp3';

export default function NflDealOfferModal({ offer, isFinal, roundIndex, onDeal, onDealChosen, onNoDeal }: Props) {
  const dealButtonRef = useRef<HTMLButtonElement>(null);
  const [imgFailed, setImgFailed] = useState(false);
  const [reaction, setReaction] = useState<'deal' | 'no-deal' | null>(null);
  const headshotUrl = espnHeadshotUrl(offer.quarterback);

  useEffect(() => {
    dealButtonRef.current?.focus();
  }, [offer]);

  function handleDeal() {
    setReaction('deal');
    onDealChosen();
    setTimeout(onDeal, DEAL_REACTION_DELAY_MS);
  }

  function handleNoDeal() {
    setReaction('no-deal');
    new Audio(NO_DEAL_STING_SRC).play().catch(() => {});
    setTimeout(onNoDeal, NO_DEAL_REACTION_DELAY_MS);
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

  const nextRoundCases = isFinal ? null : (ROUND_SCHEDULE[roundIndex + 1] ?? 1);

  return (
    // Deliberately not a blocking overlay -- you need to see the board and
    // the QB board to actually evaluate the offer, so this sits at the
    // bottom instead of covering the screen. Cases are already non-
    // clickable during this phase, so nothing behind it needs to be inert.
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 sm:px-4 sm:pb-4">
      <div
        role="region"
        aria-label={isFinal ? 'Final offer' : `Round ${offer.round} offer`}
        className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-amber-500/40 bg-slate-900/98 p-3.5 shadow-[0_-8px_30px_rgba(0,0,0,0.5)] backdrop-blur sm:p-5"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-amber-400/60 bg-slate-800 sm:h-16 sm:w-16">
              {headshotUrl && !imgFailed ? (
                <Image src={headshotUrl} alt="" fill sizes="64px" className="object-cover" onError={() => setImgFailed(true)} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-300">
                  {offer.quarterback.name.split(' ').map((p) => p[0]).join('')}
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
                {isFinal ? 'Final offer' : `Round ${offer.round} offer`}
              </p>
              <p className="text-base font-bold leading-tight text-white sm:text-lg">{offer.quarterback.name}</p>
              <p className="text-sm font-black leading-tight text-amber-300">{offer.offerOvr} OVR</p>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <p className="text-center text-[11px] text-slate-400 sm:text-right">
              {isFinal
                ? 'No Deal means keeping your case — final answer.'
                : `No Deal → open ${nextRoundCases} more case${nextRoundCases === 1 ? '' : 's'} before the next offer.`}
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleNoDeal}
                className="flex-1 rounded-lg border-2 border-red-500/70 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-red-300 transition-colors hover:bg-red-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300 sm:flex-none sm:px-6"
              >
                No Deal
              </button>
              <button
                ref={dealButtonRef}
                type="button"
                onClick={handleDeal}
                className="flex-1 rounded-lg bg-green-500 px-4 py-2.5 text-sm font-bold uppercase tracking-wide text-slate-950 transition-colors hover:bg-green-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-200 sm:flex-none sm:px-6"
              >
                Deal
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
