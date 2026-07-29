'use client';

import { useEffect, useState } from 'react';
import type { CaseState, GameState } from '@/lib/nflDeal/types';

interface Props {
  state: GameState;
  onSkip: () => void;
}

function MiniCase({ caseState, exiting, index }: { caseState: CaseState; exiting: boolean; index: number }) {
  return (
    <div
      className={[
        'relative aspect-[5/4] w-full rounded-lg border transition-all duration-1000 ease-in-out',
        exiting
          ? 'translate-y-24 rotate-6 scale-75 border-rose-500/30 bg-rose-950/30 opacity-0'
          : 'translate-y-0 rotate-0 scale-100 border-slate-700 bg-gradient-to-b from-slate-600 to-slate-900 opacity-100',
      ].join(' ')}
      style={{ transitionDelay: `${index * 35}ms` }}
    >
      <div className="absolute -top-[7%] left-1/2 h-[16%] w-[30%] -translate-x-1/2 rounded-t-md border-2 border-b-0 border-slate-500" />
      <div className="absolute inset-[10%] flex items-center justify-center rounded-md border border-black/20 bg-black/10 shadow-inner">
        <div className="absolute inset-x-[12%] top-1/2 h-px -translate-y-1/2 bg-black/25" />
        <div className="absolute left-1/2 top-1/2 h-[26%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-black/25" />
        <span className="relative text-lg font-black text-slate-100 sm:text-xl">{caseState.number}</span>
      </div>
    </div>
  );
}

export default function NflDealNoDealTransition({ state, onSkip }: Props) {
  const [animating, setAnimating] = useState(false);
  const [compact, setCompact] = useState(false);
  const openedThisRound = new Set(state.casesOpenedThisRound);
  const visibleCases = state.cases.filter(
    (caseState) =>
      caseState.number !== state.playerCaseNumber &&
      (caseState.status === 'available' || (!compact && openedThisRound.has(caseState.number))),
  );
  const remainingCount = state.cases.filter((caseState) => caseState.status === 'available').length;

  useEffect(() => {
    const start = setTimeout(() => setAnimating(true), 40);
    const tighten = setTimeout(() => setCompact(true), 1150);
    return () => {
      clearTimeout(start);
      clearTimeout(tighten);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={onSkip}
      className="block w-full cursor-pointer overflow-hidden rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-5 text-left transition-colors hover:border-slate-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300 sm:px-5"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300">No Deal</p>
      <p className="mt-1 text-2xl font-black text-white sm:text-3xl">Resetting the board</p>
      <p className="mt-1 text-sm text-slate-400">
        {state.casesOpenedThisRound.length} case{state.casesOpenedThisRound.length === 1 ? '' : 's'} leave the stage.
        {' '}
        {remainingCount} remain in play.
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-2 sm:gap-3">
        {visibleCases.map((caseState, index) => (
          <div key={caseState.number} className="w-[calc(25%-6px)] sm:w-[calc(16.6667%-10px)]">
            <MiniCase caseState={caseState} exiting={animating && openedThisRound.has(caseState.number)} index={index} />
          </div>
        ))}
      </div>
    </button>
  );
}
