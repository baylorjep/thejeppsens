'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { espnHeadshotUrl } from '@/lib/nflDeal/qbData';
import type { Quarterback } from '@/lib/nflDeal/types';

interface Props {
  board: Quarterback[];
  eliminatedIds: Set<string>;
  offerQbId?: string | null;
}

function BoardCell({ qb, eliminated, isOffer }: { qb: Quarterback; eliminated: boolean; isOffer: boolean }) {
  const headshotUrl = espnHeadshotUrl(qb);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div
      className={[
        'flex items-center gap-1.5 rounded-md border px-1.5 py-1 transition-colors',
        isOffer
          ? 'border-teal-400/70 bg-teal-500/10'
          : eliminated
            ? 'border-transparent opacity-40'
            : 'border-transparent bg-white/[0.03]',
      ].join(' ')}
    >
      <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full bg-slate-700">
        {headshotUrl && !imgFailed ? (
          <Image src={headshotUrl} alt="" fill sizes="24px" className="object-cover" onError={() => setImgFailed(true)} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[8px] font-semibold text-slate-300">
            {qb.name.split(' ').map((p) => p[0]).join('')}
          </div>
        )}
      </div>
      <span className={`min-w-0 flex-1 truncate text-xs ${eliminated ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
        {qb.name}
      </span>
      {isOffer && (
        <span className="shrink-0 rounded bg-teal-500 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wide text-teal-950">
          Offer
        </span>
      )}
      <span className={`w-6 shrink-0 text-right text-xs font-bold tabular-nums ${eliminated ? 'text-slate-600' : 'text-teal-300'}`}>
        {qb.ovr}
      </span>
    </div>
  );
}

export default function NflDealQbBoard({ board, eliminatedIds, offerQbId }: Props) {
  const [expanded, setExpanded] = useState(true);

  // Classic Deal or No Deal board layout: worst value at top-left, reading
  // down the left column then down the right column to the best value at
  // bottom-right. `board` is already ordered best (rank 1) -> worst (rank 32).
  const orderedForBoard = useMemo(() => {
    const worstFirst = [...board].reverse(); // rank 32 (worst) ... rank 1 (best)
    const leftColumn = worstFirst.slice(0, 16); // worst overall -> mid, top to bottom
    const rightColumn = worstFirst.slice(16); // already ascending: mid -> best overall (rank 1) at the bottom
    return leftColumn.flatMap((left, i) => [left, rightColumn[i]]);
  }, [board]);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold uppercase tracking-wide text-slate-300">QB Board</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" aria-hidden />
        )}
      </button>
      {expanded && (
        <div className="px-2.5 pb-3">
          <div className="mb-1 flex justify-between px-1 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
            <span>Low</span>
            <span>High</span>
          </div>
          <div role="list" aria-label="Quarterback board" className="grid grid-cols-2 gap-1.5">
            {orderedForBoard.map((qb) => (
              <div role="listitem" key={qb.id}>
                <BoardCell qb={qb} eliminated={eliminatedIds.has(qb.id)} isOffer={qb.id === offerQbId} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
