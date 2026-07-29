'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { espnHeadshotUrl } from '@/lib/nflDeal/qbData';
import type { Quarterback } from '@/lib/nflDeal/types';

interface Props {
  board: Quarterback[];
  eliminatedIds: Set<string>;
  offerQbId?: string | null;
}

function BoardRow({ qb, eliminated, isOffer }: { qb: Quarterback; eliminated: boolean; isOffer: boolean }) {
  const headshotUrl = espnHeadshotUrl(qb);
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <li
      className={[
        'flex items-center gap-2.5 rounded-md border px-2.5 py-1.5 transition-colors',
        isOffer
          ? 'border-teal-400/70 bg-teal-500/10'
          : eliminated
            ? 'border-transparent opacity-40'
            : 'border-transparent bg-white/[0.03]',
      ].join(' ')}
    >
      <span className="w-5 shrink-0 text-right text-[11px] tabular-nums text-slate-500">{qb.rank}</span>
      <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full bg-slate-700">
        {headshotUrl && !imgFailed ? (
          <Image src={headshotUrl} alt="" fill sizes="28px" className="object-cover" onError={() => setImgFailed(true)} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[9px] font-semibold text-slate-300">
            {qb.name.split(' ').map((p) => p[0]).join('')}
          </div>
        )}
      </div>
      <span className={`min-w-0 flex-1 truncate text-sm ${eliminated ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
        {qb.name}
      </span>
      {eliminated && (
        <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">
          Out
        </span>
      )}
      {isOffer && (
        <span className="shrink-0 rounded bg-teal-500 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-teal-950">
          Offer
        </span>
      )}
      <span className={`w-7 shrink-0 text-right text-sm font-bold tabular-nums ${eliminated ? 'text-slate-600' : 'text-teal-300'}`}>
        {qb.ovr}
      </span>
    </li>
  );
}

export default function NflDealQbBoard({ board, eliminatedIds, offerQbId }: Props) {
  const [expanded, setExpanded] = useState(true);

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
        <ul className="max-h-[70vh] space-y-1 overflow-y-auto px-2.5 pb-3">
          {board.map((qb) => (
            <BoardRow key={qb.id} qb={qb} eliminated={eliminatedIds.has(qb.id)} isOffer={qb.id === offerQbId} />
          ))}
        </ul>
      )}
    </div>
  );
}
