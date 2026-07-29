'use client';

import { useState } from 'react';
import Image from 'next/image';
import { espnHeadshotUrl } from '@/lib/nflDeal/playerData';
import type { Player } from '@/lib/nflDeal/types';

interface Props {
  caseNumber: number;
  /** null while the sound plays and the result is still being held back. */
  quarterback: Player | null;
  onDismiss: () => void;
}

function SpinningCase({ number }: { number: number }) {
  return (
    <div className="relative h-28 w-32">
      {/* Shell spins; the number is a separate layer on top so it stays
       * upright and readable the whole time instead of tumbling. */}
      <div className="animate-spin-slow absolute inset-0">
        <div className="absolute -top-2.5 left-1/2 h-3 w-10 -translate-x-1/2 rounded-t-md border-2 border-b-0 border-slate-400" />
        <div className="absolute inset-0 rounded-lg border-2 border-slate-500 bg-gradient-to-b from-slate-600 to-slate-900 shadow-[0_0_24px_rgba(45,212,191,0.2)]">
          <div className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-black/25" />
          <div className="absolute left-1/2 top-1/2 h-6 w-4 -translate-x-1/2 -translate-y-1/2 rounded-sm bg-black/25" />
        </div>
      </div>
      <div className="relative flex h-full w-full items-center justify-center">
        <span className="text-5xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">{number}</span>
      </div>
    </div>
  );
}

export default function NflDealCaseRevealPopup({ caseNumber, quarterback, onDismiss }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const headshotUrl = quarterback ? espnHeadshotUrl(quarterback) : null;

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-3 bg-black/70 px-4 backdrop-blur-sm"
    >
      <div className="flex max-w-full flex-col items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-6 py-7 shadow-2xl sm:px-8">
        {quarterback ? (
          <>
            <p className="text-2xl font-black text-slate-400">{caseNumber}</p>
            <div className="animate-case-reveal relative h-24 w-24 overflow-hidden rounded-full border-2 border-slate-600 bg-slate-800">
              {headshotUrl && !imgFailed ? (
                <Image src={headshotUrl} alt="" fill sizes="96px" className="object-cover" onError={() => setImgFailed(true)} />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-semibold text-slate-300">
                  {quarterback.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')}
                </div>
              )}
            </div>
            <p className="text-xl font-bold text-white">{quarterback.name}</p>
            <p className="text-2xl font-black text-teal-300">{quarterback.ovr} OVR</p>
          </>
        ) : (
          <SpinningCase number={caseNumber} />
        )}
      </div>
      {!quarterback && <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Tap to reveal</p>}
    </div>
  );
}
