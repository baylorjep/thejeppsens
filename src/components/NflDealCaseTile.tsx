'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Lock, Star } from 'lucide-react';
import { espnHeadshotUrl } from '@/lib/nflDeal/qbData';
import type { CaseState } from '@/lib/nflDeal/types';

interface Props {
  caseState: CaseState;
  clickable: boolean;
  isPlayerCase: boolean;
  onOpen: (caseNumber: number) => void;
}

export default function NflDealCaseTile({ caseState, clickable, isPlayerCase, onOpen }: Props) {
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
  const isDisabled = !clickable || isPlayerCase || isOpened;

  const ariaLabel = isOpened
    ? `Case ${caseState.number}, opened: ${caseState.quarterback.name}, ${caseState.quarterback.ovr} overall`
    : isPlayerCase
      ? `Case ${caseState.number}, your sealed case`
      : clickable
        ? `Case ${caseState.number}, unopened, select this case`
        : `Case ${caseState.number}, unopened`;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={() => onOpen(caseState.number)}
      aria-label={ariaLabel}
      aria-pressed={isPlayerCase}
      className={[
        'group relative flex aspect-[3/4] w-full flex-col items-center justify-center overflow-hidden rounded-lg border text-center transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400',
        isOpened
          ? 'border-slate-700 bg-slate-800/80'
          : isPlayerCase
            ? 'border-amber-400/80 bg-gradient-to-br from-amber-500/20 to-slate-900 shadow-[0_0_18px_rgba(251,191,36,0.25)]'
            : clickable
              ? 'cursor-pointer border-slate-600 bg-gradient-to-br from-slate-700 to-slate-900 hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-[0_6px_18px_rgba(20,184,166,0.25)]'
              : 'cursor-not-allowed border-slate-800 bg-gradient-to-br from-slate-800 to-slate-950 opacity-50',
        justRevealed ? 'animate-case-reveal' : '',
      ].join(' ')}
    >
      {isOpened ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 py-2">
          <div className="relative h-12 w-12 overflow-hidden rounded-full bg-slate-700 sm:h-14 sm:w-14">
            {headshotUrl && !imgFailed ? (
              <Image
                src={headshotUrl}
                alt=""
                fill
                sizes="56px"
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
          </div>
          <p className="line-clamp-2 text-[10px] font-medium leading-tight text-slate-200 sm:text-xs">
            {caseState.quarterback.name}
          </p>
          <span className="rounded bg-slate-700 px-1.5 py-0.5 text-[10px] font-bold text-teal-300">
            {caseState.quarterback.ovr}
          </span>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
          {isPlayerCase ? (
            <Star className="h-4 w-4 text-amber-300" aria-hidden />
          ) : (
            <Lock className="h-3.5 w-3.5 text-slate-400 group-hover:text-teal-300" aria-hidden />
          )}
          <span
            className={`text-lg font-bold sm:text-xl ${isPlayerCase ? 'text-amber-200' : 'text-slate-200'}`}
          >
            {caseState.number}
          </span>
          {isPlayerCase && (
            <span className="text-[9px] font-semibold uppercase tracking-wide text-amber-300/80">Your case</span>
          )}
        </div>
      )}
    </button>
  );
}
