'use client';

import { useEffect, useRef, useState } from 'react';
import type { CaseState } from '@/lib/nflDeal/types';

interface Props {
  playerCase: CaseState;
  tradeCase: CaseState;
  decisionReady: boolean;
  onKeep: () => void;
  onKeptChosen: () => void;
  onTrade: () => void;
  onTradeChosen: () => void;
}

const DECISION_REACTION_OVERLAY_MS = 1200;

export default function NflDealFinalCaseModal({
  playerCase,
  tradeCase,
  decisionReady,
  onKeep,
  onKeptChosen,
  onTrade,
  onTradeChosen,
}: Props) {
  const keepButtonRef = useRef<HTMLButtonElement>(null);
  const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reaction, setReaction] = useState<'keep' | 'trade' | null>(null);
  const [resolving, setResolving] = useState(false);
  const [casesAnimated, setCasesAnimated] = useState(false);

  useEffect(() => {
    if (decisionReady) keepButtonRef.current?.focus();
  }, [decisionReady]);

  useEffect(() => {
    // Animate cases into view after a brief delay
    const timer = setTimeout(() => setCasesAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
    };
  }, []);

  function handleKeep() {
    if (!decisionReady || resolving) return;
    setResolving(true);
    setReaction('keep');
    onKeptChosen();
    reactionTimeoutRef.current = setTimeout(() => {
      setReaction(null);
      onKeep();
    }, DECISION_REACTION_OVERLAY_MS);
  }

  function handleTrade() {
    if (!decisionReady || resolving) return;
    setResolving(true);
    setReaction('trade');
    onTradeChosen();
    reactionTimeoutRef.current = setTimeout(() => {
      setReaction(null);
      onTrade();
    }, DECISION_REACTION_OVERLAY_MS);
  }

  if (reaction) {
    const isKeep = reaction === 'keep';
    return (
      <div
        role="status"
        aria-live="assertive"
        className={[
          'fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 backdrop-blur-sm',
          isKeep ? 'bg-teal-600/90' : 'bg-amber-600/90',
        ].join(' ')}
      >
        <p className="animate-big-reaction text-6xl font-black italic text-white drop-shadow-lg sm:text-7xl">
          {isKeep ? 'KEEP!' : 'TRADE!'}
        </p>
        <p className="text-lg font-semibold text-white/90">
          {isKeep ? `Case #${playerCase.number}` : `Case #${tradeCase.number}`}
        </p>
      </div>
    );
  }

  if (resolving) return null;

  return (
    <div className="animate-case-reveal">
      <div
        role="region"
        aria-label="Final case choice"
        className="w-full rounded-2xl border border-amber-500/40 bg-slate-900/95 p-3.5 shadow-[0_14px_34px_rgba(0,0,0,0.4)] backdrop-blur sm:p-5"
      >
        {!decisionReady ? (
          <button
            type="button"
            onClick={() => {
              // In intro state, just prepare to show the decision
            }}
            className="flex w-full items-center justify-between gap-4 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-left transition-colors hover:border-amber-300/50 hover:bg-amber-400/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            <span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300/90">
                Final choice
              </span>
              <span className="mt-1 block text-lg font-black text-white">One last case remains...</span>
              <span className="mt-1 block text-xs text-slate-400">Tap anywhere here to continue.</span>
            </span>
          </button>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Cases display with animation */}
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:justify-around">
              {/* Player case */}
              <div
                className={[
                  'transition-all duration-700 ease-out',
                  casesAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75 -translate-x-4',
                ].join(' ')}
              >
                <div className="relative">
                  <div className="relative h-24 w-32 sm:h-32 sm:w-40">
                    <div className="absolute -top-3 left-1/2 h-3 w-10 -translate-x-1/2 rounded-t-md border-2 border-b-0 border-slate-500" />
                    <div className="relative flex h-full w-full items-center justify-center rounded-lg border-3 border-teal-500/60 bg-gradient-to-b from-teal-600/40 to-teal-900/40 shadow-[0_0_20px_rgba(20,184,166,0.2)]">
                      <div className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-black/25" />
                      <span className="relative text-3xl font-black text-teal-100 sm:text-4xl">{playerCase.number}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-teal-300">
                    Your original
                  </p>
                </div>
              </div>

              {/* VS */}
              <div className="text-xl font-black text-slate-600 sm:text-2xl">VS</div>

              {/* Trade case */}
              <div
                className={[
                  'transition-all duration-700 ease-out',
                  casesAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-75 translate-x-4',
                ].join(' ')}
              >
                <div className="relative">
                  <div className="relative h-24 w-32 sm:h-32 sm:w-40">
                    <div className="absolute -top-3 left-1/2 h-3 w-10 -translate-x-1/2 rounded-t-md border-2 border-b-0 border-slate-500" />
                    <div className="relative flex h-full w-full items-center justify-center rounded-lg border-3 border-amber-500/60 bg-gradient-to-b from-amber-600/40 to-amber-900/40 shadow-[0_0_20px_rgba(251,146,60,0.2)]">
                      <div className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-black/25" />
                      <span className="relative text-3xl font-black text-amber-100 sm:text-4xl">{tradeCase.number}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-300">
                    Last remaining
                  </p>
                </div>
              </div>
            </div>

            {/* Decision prompt */}
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300">Final choice</p>
              <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">Keep your case, or trade?</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-slate-400">
                One case is left besides yours. Pick which sealed case you want to ride with.
              </p>
            </div>

            {/* Buttons */}
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                ref={keepButtonRef}
                type="button"
                onClick={handleKeep}
                className="rounded-lg border-2 border-teal-500/70 px-4 py-3 text-sm font-bold uppercase tracking-wide text-teal-300 transition-colors hover:bg-teal-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 sm:px-6"
              >
                Keep Case #{playerCase.number}
              </button>
              <button
                type="button"
                onClick={handleTrade}
                className="rounded-lg border-2 border-amber-500/70 px-4 py-3 text-sm font-bold uppercase tracking-wide text-amber-300 transition-colors hover:bg-amber-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300 sm:px-6"
              >
                Trade for Case #{tradeCase.number}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
