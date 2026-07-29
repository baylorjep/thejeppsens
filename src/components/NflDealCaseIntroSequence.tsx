'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { espnHeadshotUrl } from '@/lib/nflDeal/playerData';
import type { CaseState } from '@/lib/nflDeal/types';

type Stage = 'reveal' | 'seal' | 'shuffle' | 'settle';

const REVEAL_MS = 2600;
const SEAL_MS = 900;
const SHUFFLE_MS = 4800;
const SETTLE_MS = 1600;
const SHUFFLE_TICK_MS = 450;

// Total wall-clock time this sequence takes -- the caller should keep the
// board locked (and this component mounted) for at least this long.
export const CASE_INTRO_TOTAL_MS = REVEAL_MS + SEAL_MS + SHUFFLE_MS + SETTLE_MS;

const STAGE_LABEL: Record<Stage, string> = {
  reveal: "Here's the board...",
  seal: 'Sealing the cases...',
  shuffle: 'Mixing them up...',
  settle: 'Taking their places...',
};

function shuffledOrder(count: number): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

function IntroTile({ caseState, stage }: { caseState: CaseState; stage: Stage }) {
  const [imgFailed, setImgFailed] = useState(false);
  const headshotUrl = espnHeadshotUrl(caseState.quarterback);
  const showPlayer = stage === 'reveal';
  const showNumber = stage === 'settle';

  return (
    <div
      className={[
        'relative flex aspect-[5/4] w-full items-center justify-center overflow-hidden rounded-lg border transition-colors duration-300',
        showPlayer ? 'border-slate-600 bg-slate-800/80' : 'border-slate-700 bg-gradient-to-b from-slate-600 to-slate-900',
        stage === 'seal' ? 'animate-case-reveal' : stage === 'settle' ? 'animate-case-tumble-in' : '',
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
              <span className="animate-case-reveal relative text-lg font-bold text-slate-100 sm:text-xl">{caseState.number}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function NflDealCaseIntroSequence({ cases, onSkip }: { cases: CaseState[]; onSkip: () => void }) {
  const [stage, setStage] = useState<Stage>('reveal');
  // `order[i]` is the CSS order assigned to the tile at array index i (which
  // is always case number i+1 -- see shuffledCases in gameLogic.ts). CSS
  // `order` snaps instantly rather than tweening, which is exactly the
  // point during the shuffle stage: no smooth slide to track, just a case
  // that's suddenly somewhere else.
  const [order, setOrder] = useState<number[]>(() => cases.map((_, i) => i));
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const t1 = setTimeout(() => setStage('seal'), REVEAL_MS);
    const t2 = setTimeout(() => setStage('shuffle'), REVEAL_MS + SEAL_MS);
    const t3 = setTimeout(
      () => {
        setStage('settle');
        setOrder(cases.map((_, i) => i)); // snap back to true numbered order
      },
      REVEAL_MS + SEAL_MS + SHUFFLE_MS,
    );
    timeoutsRef.current = [t1, t2, t3];
    return () => timeoutsRef.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stage !== 'shuffle') return;
    const interval = setInterval(() => setOrder(shuffledOrder(cases.length)), SHUFFLE_TICK_MS);
    return () => clearInterval(interval);
  }, [stage, cases.length]);

  function handleSkip() {
    if (stage === 'settle') return;
    timeoutsRef.current.forEach(clearTimeout);
    setStage('settle');
    setOrder(cases.map((_, i) => i));
    onSkip();
  }

  return (
    <div className="mx-auto max-w-5xl cursor-pointer" onClick={handleSkip}>
      <p className="animate-case-reveal mb-4 text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-500" key={stage}>
        {STAGE_LABEL[stage]}
      </p>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {cases.map((c, i) => (
          <div key={c.number} style={{ order: order[i] }} className="w-[calc(25%-6px)] sm:w-[calc(16.6667%-10px)]">
            <IntroTile caseState={c} stage={stage} />
          </div>
        ))}
      </div>
    </div>
  );
}
