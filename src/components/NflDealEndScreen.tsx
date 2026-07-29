'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Confetti from 'react-confetti';
import { RotateCcw, TrendingDown, TrendingUp } from 'lucide-react';
import { espnHeadshotUrl } from '@/lib/nflDeal/qbData';
import type { CaseState, GameState, Quarterback } from '@/lib/nflDeal/types';

interface Props {
  state: GameState;
  playerCase: CaseState;
  unopenedCases: CaseState[];
  onPlayAgain: () => void;
}

const SUSPENSE_STEP_MS = 850;

function QbChip({ qb, size = 40 }: { qb: Quarterback; size?: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const headshotUrl = espnHeadshotUrl(qb);

  return (
    <div className="flex items-center gap-2">
      <div className="relative shrink-0 overflow-hidden rounded-full bg-slate-700" style={{ width: size, height: size }}>
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
  const [countdown, setCountdown] = useState(3);
  const [revealed, setRevealed] = useState(false);

  const dealAccepted = state.dealAccepted;
  const finalQb = dealAccepted ? dealAccepted.quarterback : playerCase.quarterback;
  const beatCase = dealAccepted ? dealAccepted.offerOvr > playerCase.quarterback.ovr : null;
  const celebrate = beatCase === true || finalQb.ovr >= 90;

  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
  }, []);

  useEffect(() => {
    if (revealed) return;
    if (countdown <= 0) {
      setRevealed(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), SUSPENSE_STEP_MS);
    return () => clearTimeout(t);
  }, [countdown, revealed]);

  if (!revealed) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-6 rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          {dealAccepted ? 'Was it a good deal?' : 'What was in your case?'}
        </p>
        <div className="relative flex h-24 w-24 items-center justify-center">
          <div key={countdown} className="absolute inset-0 animate-ping rounded-full bg-teal-500/20" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-teal-500/50 bg-slate-900 text-4xl font-black text-teal-300">
            {countdown > 0 ? countdown : '!'}
          </div>
        </div>
        <p className="text-xs text-slate-500">The Bank is watching too.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/80 p-6 text-center sm:p-10">
      {celebrate && windowSize && (
        <Confetti
          width={windowSize.w}
          height={windowSize.h}
          recycle={false}
          numberOfPieces={220}
          colors={['#f59e0b', '#14b8a6', '#3b82f6', '#a855f7', '#f8fafc']}
        />
      )}

      <p className="animate-case-reveal text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
        {dealAccepted ? "The Bank's offer" : 'Your case'}
      </p>
      <h2 className="animate-case-reveal mt-1 text-3xl font-black text-white sm:text-4xl">
        {dealAccepted ? 'DEAL!' : 'NO DEAL'}
      </h2>

      <div className="animate-case-reveal mx-auto mt-6 flex flex-col items-center gap-2">
        <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-teal-400/60 bg-slate-800 sm:h-28 sm:w-28">
          {espnHeadshotUrl(finalQb) ? (
            <Image src={espnHeadshotUrl(finalQb)!} alt="" fill sizes="112px" className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-slate-300">
              {finalQb.name.split(' ').map((p) => p[0]).join('')}
            </div>
          )}
        </div>
        <p className="text-xl font-bold text-white sm:text-2xl">{finalQb.name}</p>
        <p className="text-3xl font-black text-teal-300 sm:text-4xl">{finalQb.ovr} OVR</p>
      </div>

      {dealAccepted && (
        <div
          className={[
            'mx-auto mt-5 flex max-w-md items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold',
            beatCase ? 'bg-teal-500/10 text-teal-300' : dealAccepted.offerOvr < playerCase.quarterback.ovr ? 'bg-rose-500/10 text-rose-300' : 'bg-slate-800 text-slate-300',
          ].join(' ')}
        >
          {beatCase ? (
            <>
              <TrendingUp className="h-4 w-4" aria-hidden />
              You beat your case!
            </>
          ) : dealAccepted.offerOvr < playerCase.quarterback.ovr ? (
            <>
              <TrendingDown className="h-4 w-4" aria-hidden />
              Your case had more value — but the deal is done.
            </>
          ) : (
            'Dead even with your case.'
          )}
        </div>
      )}

      {dealAccepted && (
        <div className="mx-auto mt-5 max-w-xs rounded-xl border border-slate-700 bg-slate-800/60 p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Case #{playerCase.number} actually contained
          </p>
          <div className="flex justify-center">
            <QbChip qb={playerCase.quarterback} />
          </div>
        </div>
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
