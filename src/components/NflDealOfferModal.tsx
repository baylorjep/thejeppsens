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
  decisionReady: boolean;
  onSkipIntro: () => void;
  onDeal: () => void;
  /** Fires the instant Deal is clicked, before the reaction delay -- used to
   * kick off the deal-accepted YouTube cue right away (see
   * NflDealAudioController's `playDealAccepted`). */
  onDealChosen: () => void;
  onNoDeal: () => void;
  /** Fires the instant No Deal is clicked, before the reaction delay -- see
   * onDealChosen. */
  onNoDealChosen: () => void;
  /** Fires after the short red No Deal flash leaves, while the audio is
   * still finishing. */
  onNoDealTransitionStart?: () => void;
}

const DEAL_REACTION_OVERLAY_MS = 1200;
const NO_DEAL_REACTION_OVERLAY_MS = 1200;
const NO_DEAL_REACTION_DELAY_MS = 5500; // no-deal-accepted clip: 1:40:40.5-1:40:46

export default function NflDealOfferModal({
  offer,
  isFinal,
  roundIndex,
  decisionReady,
  onSkipIntro,
  onDeal,
  onDealChosen,
  onNoDeal,
  onNoDealChosen,
  onNoDealTransitionStart,
}: Props) {
  const dealButtonRef = useRef<HTMLButtonElement>(null);
  const dealOverlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noDealOverlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noDealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noDealTransitionStartedRef = useRef(false);
  const noDealResolvedRef = useRef(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [reaction, setReaction] = useState<'deal' | 'no-deal' | null>(null);
  const [resolving, setResolving] = useState(false);
  const headshotUrl = espnHeadshotUrl(offer.quarterback);

  useEffect(() => {
    if (decisionReady) dealButtonRef.current?.focus();
  }, [decisionReady, offer]);

  useEffect(() => {
    return () => {
      if (dealOverlayTimeoutRef.current) clearTimeout(dealOverlayTimeoutRef.current);
      if (noDealOverlayTimeoutRef.current) clearTimeout(noDealOverlayTimeoutRef.current);
      if (noDealTimeoutRef.current) clearTimeout(noDealTimeoutRef.current);
    };
  }, [offer]);

  function handleDeal() {
    if (!decisionReady || resolving) return;
    setResolving(true);
    setReaction('deal');
    onDealChosen();
    dealOverlayTimeoutRef.current = setTimeout(() => {
      setReaction(null);
      onDeal();
    }, DEAL_REACTION_OVERLAY_MS);
  }

  function handleNoDeal() {
    if (!decisionReady || resolving) return;
    setResolving(true);
    setReaction('no-deal');
    noDealTransitionStartedRef.current = false;
    noDealResolvedRef.current = false;
    onNoDealChosen();
    noDealOverlayTimeoutRef.current = setTimeout(finishNoDealOverlay, NO_DEAL_REACTION_OVERLAY_MS);
    noDealTimeoutRef.current = setTimeout(resolveNoDeal, NO_DEAL_REACTION_DELAY_MS);
  }

  function resolveNoDeal() {
    if (noDealResolvedRef.current) return;
    noDealResolvedRef.current = true;
    if (noDealTimeoutRef.current) {
      clearTimeout(noDealTimeoutRef.current);
      noDealTimeoutRef.current = null;
    }
    onNoDeal();
  }

  function finishNoDealOverlay() {
    if (noDealTransitionStartedRef.current) return;
    noDealTransitionStartedRef.current = true;
    if (noDealOverlayTimeoutRef.current) {
      clearTimeout(noDealOverlayTimeoutRef.current);
      noDealOverlayTimeoutRef.current = null;
    }
    setReaction(null);
    onNoDealTransitionStart?.();
    if (isFinal) resolveNoDeal();
  }

  if (reaction) {
    const isDeal = reaction === 'deal';
    return (
      <div
        role="status"
        aria-live="assertive"
        onClick={isDeal ? undefined : finishNoDealOverlay}
        className={[
          'fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 backdrop-blur-sm',
          isDeal ? '' : 'cursor-pointer',
          isDeal ? 'bg-green-600/90' : 'bg-red-600/90',
        ].join(' ')}
      >
        <p className="animate-big-reaction text-6xl font-black italic text-white drop-shadow-lg sm:text-7xl">
          {isDeal ? 'DEAL!' : 'NO DEAL!'}
        </p>
        <p className="text-lg font-semibold text-white/90">
          {isDeal ? `${offer.quarterback.name}, ${offer.offerOvr} OVR` : isFinal ? 'One last choice.' : 'Back to the cases.'}
        </p>
      </div>
    );
  }

  if (resolving) return null;

  const nextRoundCases = isFinal ? null : (ROUND_SCHEDULE[roundIndex + 1] ?? 1);

  return (
    <div className="animate-case-reveal">
      <div
        role="region"
        aria-label={isFinal ? 'Final offer' : `Round ${offer.round} offer`}
        className="w-full rounded-2xl border border-amber-500/40 bg-slate-900/95 p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.4)] backdrop-blur sm:p-5"
      >
        {!decisionReady ? (
          <button
            type="button"
            onClick={onSkipIntro}
            className="flex w-full items-center justify-between gap-4 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-left transition-colors hover:border-amber-300/50 hover:bg-amber-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
                {isFinal ? 'Final offer' : `Round ${offer.round} offer`}
              </span>
              <span className="mt-1 block text-lg font-black text-white">The Banker is making an offer...</span>
              <span className="mt-1 block text-xs text-slate-400">Tap anywhere here to skip the wait.</span>
            </span>
          </button>
        ) : (
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
                  ? 'No Deal means choosing to keep your case or trade.'
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
        )}
      </div>
    </div>
  );
}
