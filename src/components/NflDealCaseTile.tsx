'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { espnHeadshotUrl } from '@/lib/nflDeal/qbData';
import type { CaseState } from '@/lib/nflDeal/types';

interface Props {
  caseState: CaseState;
  clickable: boolean;
  /** When set, the tile pops in with this delay on mount -- used to stagger
   * the whole board revealing at once instead of just appearing static. */
  enterDelayMs?: number;
  onOpen: (caseNumber: number) => void;
}

export default function NflDealCaseTile({ caseState, clickable, enterDelayMs, onOpen }: Props) {
  const prevStatus = useRef(caseState.status);
  const [justRevealed, setJustRevealed] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const headshotUrl = espnHeadshotUrl(caseState.quarterback);

  useEffect(() => {
    const wasOpened = prevStatus.current === 'opened';
    if (!wasOpened && caseState.status === 'opened') {
      setJustRevealed(true);
      const t = setTimeout(() => setJustRevealed(false), 650);
      prevStatus.current = caseState.status;
      return () => clearTimeout(t);
    }
    prevStatus.current = caseState.status;
  }, [caseState.status]);

  const isOpened = caseState.status === 'opened';
  const isDisabled = !clickable || isOpened;

  const ariaLabel = isOpened
    ? `Case ${caseState.number}, opened: ${caseState.quarterback.name}, ${caseState.quarterback.ovr} overall`
    : clickable
      ? `Case ${caseState.number}, unopened, select this case`
      : `Case ${caseState.number}, unopened`;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onOpen(caseState.number)}
      aria-label={ariaLabel}
      style={enterDelayMs != null ? { animationDelay: `${enterDelayMs}ms`, animationFillMode: 'backwards' } : undefined}
      className={[
        'group relative flex aspect-[5/4] w-full items-center justify-center overflow-hidden rounded-lg border text-center transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
        isOpened
          ? 'border-slate-700 bg-slate-800/80'
          : clickable
            ? 'cursor-pointer border-slate-600 bg-gradient-to-b from-slate-600 to-slate-900 hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-[0_6px_18px_rgba(20,184,166,0.25)]'
            : 'cursor-not-allowed border-slate-800 bg-gradient-to-b from-slate-800 to-slate-950 opacity-50',
        justRevealed || enterDelayMs != null ? 'animate-case-reveal' : '',
      ].join(' ')}
    >
      {isOpened ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1.5 py-1.5">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-700 ring-2 ring-slate-600 sm:h-12 sm:w-12">
            {headshotUrl && !imgFailed ? (
              <Image
                src={headshotUrl}
                alt=""
                fill
                sizes="48px"
                className="object-cover"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-300">
                {caseState.quarterback.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 rounded-full border border-slate-800 bg-teal-500 px-1 py-px text-[8px] font-bold leading-tight text-teal-950 sm:text-[9px]">
              {caseState.quarterback.ovr}
            </span>
          </div>
          <p className="line-clamp-2 w-full text-center text-[9px] font-medium leading-[1.15] text-slate-200 sm:text-[10.5px]">
            {caseState.quarterback.name}
          </p>
        </div>
      ) : (
        <div className="relative flex h-full w-full items-center justify-center">
          {/* handle */}
          <div
            className={[
              'absolute -top-[7%] left-1/2 h-[16%] w-[30%] -translate-x-1/2 rounded-t-md border-2 border-b-0 transition-colors',
              clickable ? 'border-slate-400 group-hover:border-teal-300' : 'border-slate-600',
            ].join(' ')}
          />
          {/* body */}
          <div className="relative flex h-[78%] w-[86%] items-center justify-center rounded-md border border-black/20 bg-black/10 shadow-inner">
            <div className="absolute inset-x-[12%] top-1/2 h-px -translate-y-1/2 bg-black/25" />
            <div className="absolute left-1/2 top-1/2 h-[26%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-black/25" />
            <span className="relative text-lg font-bold text-slate-100 sm:text-xl">{caseState.number}</span>
          </div>
        </div>
      )}
    </button>
  );
}
