'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Confetti from 'react-confetti';
import { RotateCcw, Trophy, TrendingDown, TrendingUp } from 'lucide-react';
import { espnHeadshotUrl } from '@/lib/nflDeal/qbData';
import type { CaseState, GameState, Quarterback } from '@/lib/nflDeal/types';

interface Props {
  state: GameState;
  playerCase: CaseState;
  unopenedCases: CaseState[];
  onPlayAgain: () => void;
}

function QbChip({ qb, size = 40 }: { qb: Quarterback; size?: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const headshotUrl = espnHeadshotUrl(qb);

  return (
    <div className="flex items-center gap-2">
      <div
        className="relative shrink-0 overflow-hidden rounded-full bg-slate-700"
        style={{ width: size, height: size }}
      >
        {headshotUrl && !imgFailed ? (
          <Image src={headshotUrl} alt="" fill sizes={`${size}px`} className="object-cover" onError={() => setImgFailed(true)} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-300">
            {qb.name.split(' ').map((p) => p[0]).join('')}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-100">{qb.name}</p>
        <p className="text-xs font-bold text-teal-300">{qb.ovr} OVR</p>
      </div>
    </div>
  );
}

export default function NflDealEndScreen({ state, playerCase, unopenedCases, onPlayAgain }: Props) {
  const [windowSize, setWindowSize] = useState<{ w: number; h: number } | null>(null);
  const dealAccepted = state.dealAccepted;
  const finalQb = dealAccepted ? dealAccepted.quarterback : playerCase.quarterback;
  const beatCase = dealAccepted ? dealAccepted.offerOvr > playerCase.quarterback.ovr : null;
  const celebrate = beatCase === true || finalQb.ovr >= 90;

  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
  }, []);

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 text-center sm:p-10">
      {celebrate && windowSize && (
        <Confetti
          width={windowSize.w}
          height={windowSize.h}
          recycle={false}
          numberOfPieces={220}
          colors={['#f59e0b', '#14b8a6', '#3b82f6', '#a855f7', '#f8fafc']}
        />
      )}

      <Trophy className="mx-auto mb-3 h-9 w-9 text-amber-300" aria-hidden />
      <h2 className="text-2xl font-black text-white sm:text-3xl">
        {dealAccepted ? 'Deal!' : 'You kept your case'}
      </h2>

      {dealAccepted ? (
        <p className="mt-2 text-sm text-slate-300">
          You accepted <span className="font-semibold text-white">{dealAccepted.quarterback.name}</span>,{' '}
          {dealAccepted.offerOvr} OVR.
        </p>
      ) : (
        <p className="mt-2 text-sm text-slate-300">No deal made — you're taking whatever was in case #{playerCase.number}.</p>
      )}

      <div className="mx-auto mt-6 grid max-w-md gap-4 sm:grid-cols-2">
        {dealAccepted && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-amber-300/80">Bank offer</p>
            <QbChip qb={dealAccepted.quarterback} />
          </div>
        )}
        <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Case #{playerCase.number} contained
          </p>
          <QbChip qb={playerCase.quarterback} />
        </div>
      </div>

      {dealAccepted && (
        <p className="mx-auto mt-4 flex max-w-md items-center justify-center gap-1.5 text-sm font-medium">
          {beatCase ? (
            <>
              <TrendingUp className="h-4 w-4 text-teal-400" aria-hidden />
              <span className="text-teal-300">You beat your case!</span>
            </>
          ) : dealAccepted.offerOvr < playerCase.quarterback.ovr ? (
            <>
              <TrendingDown className="h-4 w-4 text-rose-400" aria-hidden />
              <span className="text-rose-300">Your case had more value — but the deal is done.</span>
            </>
          ) : (
            <span className="text-slate-300">Dead even with your case.</span>
          )}
        </p>
      )}

      {unopenedCases.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Remaining case{unopenedCases.length === 1 ? '' : 's'}
          </p>
          <div className="mx-auto flex max-w-md flex-wrap justify-center gap-4">
            {unopenedCases.map((c) => (
              <div key={c.number} className="rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2">
                <p className="mb-1 text-[10px] text-slate-500">Case #{c.number}</p>
                <QbChip qb={c.quarterback} size={32} />
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onPlayAgain}
        className="mx-auto mt-8 flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-3 text-sm font-bold uppercase tracking-wide text-slate-950 transition-colors hover:bg-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200"
      >
        <RotateCcw className="h-4 w-4" aria-hidden />
        Play Again
      </button>
    </div>
  );
}
