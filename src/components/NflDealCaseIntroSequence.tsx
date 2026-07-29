'use client';

import { type CSSProperties, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { espnHeadshotUrl } from '@/lib/nflDeal/playerData';
import type { CaseState } from '@/lib/nflDeal/types';

type Stage = 'reveal' | 'seal' | 'gather' | 'deal';

const REVEAL_MS = 2600;
const SEAL_MS = 900;
const GATHER_MS = 1800;
const DEAL_MS = 2200;

// Total wall-clock time this sequence takes -- the caller should keep the
// board locked (and this component mounted) for at least this long.
export const CASE_INTRO_TOTAL_MS = REVEAL_MS + SEAL_MS + GATHER_MS + DEAL_MS;

const STAGE_LABEL: Record<Stage, string> = {
  reveal: "Here's the board...",
  seal: 'Sealing the cases...',
  gather: 'Bringing out the cases...',
  deal: 'Numbering the board...',
};

function caseMotionStyle(index: number): CSSProperties {
  const col = index % 6;
  const row = Math.floor(index / 6);
  const centerCol = 2.5;
  const centerRow = 2.5;
  const x = (centerCol - col) * 72;
  const y = (centerRow - row) * 56;
  const rotation = ((index * 47) % 38) - 19;
  const dealDelay = (index % 8) * 35;
  return {
    '--case-x': `${x}px`,
    '--case-y': `${y}px`,
    '--case-rot': `${rotation}deg`,
    transitionDelay: `${dealDelay}ms`,
  } as CSSProperties;
}

function IntroTile({ caseState, stage, index }: { caseState: CaseState; stage: Stage; index: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const headshotUrl = espnHeadshotUrl(caseState.quarterback);
  const showPlayer = stage === 'reveal';
  const showNumber = stage === 'deal';

  return (
    <div
      className={[
        'relative flex aspect-[5/4] w-full items-center justify-center overflow-hidden rounded-lg border transition-colors duration-300',
        showPlayer ? 'border-slate-600 bg-slate-800/80' : 'border-slate-700 bg-gradient-to-b from-slate-600 to-slate-900',
        stage === 'seal' ? 'animate-case-reveal' : '',
      ].join(' ')}
    >
      {showPlayer ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1.5 py-1.5">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-700 ring-2 ring-slate-600 sm:h-12 sm:w-12">
            {headshotUrl && !imgFailed ? (
              <Image src={headshotUrl} alt="" fill sizes="48px" className="object-cover" onError={() => setImgFailed(true)} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-300">
                {caseState.quarterback.name.split(' ').map((p) => p[0]).join('')}
              </div>
            )}
          </div>
          <span className="line-clamp-2 w-full text-center text-[9px] font-medium leading-[1.15] text-slate-200 sm:text-[10.5px]">
            {caseState.quarterback.name}
          </span>
        </div>
      ) : (
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="absolute -top-[7%] left-1/2 h-[16%] w-[30%] -translate-x-1/2 rounded-t-md border-2 border-b-0 border-slate-500" />
          <div className="relative flex h-[78%] w-[86%] items-center justify-center rounded-md border border-black/20 bg-black/10 shadow-inner">
            <div className="absolute inset-x-[12%] top-1/2 h-px -translate-y-1/2 bg-black/25" />
            <div className="absolute left-1/2 top-1/2 h-[26%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-sm bg-black/25" />
            {showNumber && (
              <span
                className="animate-case-reveal relative text-lg font-bold text-slate-100 sm:text-xl"
                style={{ animationDelay: `${index * 18}ms` }}
              >
                {caseState.number}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NflDealCaseIntroSequence({ cases, onSkip }: { cases: CaseState[]; onSkip: () => void }) {
  const [stage, setStage] = useState<Stage>('reveal');
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t1 = setTimeout(() => setStage('seal'), REVEAL_MS);
    const t2 = setTimeout(() => setStage('gather'), REVEAL_MS + SEAL_MS);
    const t3 = setTimeout(() => setStage('deal'), REVEAL_MS + SEAL_MS + GATHER_MS);
    timeoutsRef.current = [t1, t2, t3];
    return () => timeoutsRef.current.forEach(clearTimeout);
  }, []);

  function handleSkip() {
    if (stage === 'deal') return;
    timeoutsRef.current.forEach(clearTimeout);
    setStage('deal');
    onSkip();
  }

  return (
    <div className="mx-auto max-w-5xl cursor-pointer" onClick={handleSkip}>
      <p className="animate-case-reveal mb-4 text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" key={stage}>
        {STAGE_LABEL[stage]}
      </p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3">
        {cases.map((c, i) => (
          <div
            key={c.number}
            style={caseMotionStyle(i)}
            className={[
              'transition-transform duration-700 ease-in-out',
              stage === 'gather'
                ? 'z-10 translate-x-[var(--case-x)] translate-y-[var(--case-y)] scale-75 rotate-[var(--case-rot)]'
                : '',
              stage === 'deal' ? 'translate-x-0 translate-y-0 scale-100 rotate-0' : '',
            ].join(' ')}
          >
            <IntroTile caseState={c} stage={stage} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
