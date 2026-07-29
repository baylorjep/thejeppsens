'use client';

import { useState } from 'react';
import Image from 'next/image';
import { espnHeadshotUrl } from '@/lib/nflDeal/qbData';
import type { Quarterback } from '@/lib/nflDeal/types';

interface Props {
  caseNumber: number;
  /** null while the sound plays and the result is still being held back. */
  quarterback: Quarterback | null;
  onDismiss: () => void;
}

export default function NflDealCaseRevealPopup({ caseNumber, quarterback, onDismiss }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const headshotUrl = quarterback ? espnHeadshotUrl(quarterback) : null;

  return (
    <div
      onClick={quarterback ? onDismiss : undefined}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm ${quarterback ? 'cursor-pointer' : ''}`}
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900 px-8 py-7 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{caseNumber}</p>
        {quarterback ? (
          <>
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
          <div className="relative flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 animate-pulse rounded-full border-2 border-slate-600 bg-slate-800" />
            <span className="relative text-3xl font-black text-slate-500">?</span>
          </div>
        )}
      </div>
    </div>
  );
}
