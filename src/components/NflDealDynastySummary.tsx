'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Confetti from 'react-confetti';
import { RotateCcw } from 'lucide-react';
import { espnHeadshotUrl } from '@/lib/nflDeal/playerData';
import { DYNASTY_POSITIONS, POSITIONS } from '@/lib/nflDeal/positions';
import type { Player, PositionId } from '@/lib/nflDeal/types';

interface Props {
  results: Record<PositionId, Player>;
  onPlayAgain: () => void;
}

function RosterCard({ position, player }: { position: PositionId; player: Player }) {
  const [imgFailed, setImgFailed] = useState(false);
  const headshotUrl = espnHeadshotUrl(player);

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{POSITIONS[position].label}</p>
      <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-slate-600 bg-slate-800">
        {headshotUrl && !imgFailed ? (
          <Image src={headshotUrl} alt="" fill sizes="64px" className="object-cover" onError={() => setImgFailed(true)} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-300">
            {player.name.split(' ').map((p) => p[0]).join('')}
          </div>
        )}
      </div>
      <p className="text-center text-sm font-bold text-white">{player.name}</p>
      <p className="text-lg font-black text-teal-300">{player.ovr} OVR</p>
    </div>
  );
}

export default function NflDealDynastySummary({ results, onPlayAgain }: Props) {
  const [windowSize, setWindowSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
  }, []);

  const players = DYNASTY_POSITIONS.map((pos) => results[pos]);
  const overallRating = Math.round((players.reduce((sum, p) => sum + p.ovr, 0) / players.length) * 10) / 10;
  const celebrate = overallRating >= 88;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-b from-teal-500/10 via-slate-900 to-slate-900 p-6 text-center sm:p-10">
      {celebrate && windowSize && (
        <Confetti
          width={windowSize.w}
          height={windowSize.h}
          recycle={false}
          numberOfPieces={220}
          colors={['#22c55e', '#4ade80', '#86efac', '#14b8a6', '#f8fafc']}
        />
      )}

      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-teal-400">Your Dynasty</p>
      <h2 className="animate-case-reveal mt-1 text-3xl font-black text-white sm:text-4xl">Team Complete</h2>

      <div className="animate-case-reveal mx-auto mt-6 flex flex-col items-center gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall Team Rating</p>
        <p className="text-5xl font-black text-teal-300 sm:text-6xl">{overallRating}</p>
      </div>

      <div className="mx-auto mt-8 grid max-w-lg grid-cols-3 gap-3">
        {DYNASTY_POSITIONS.map((pos) => (
          <RosterCard key={pos} position={pos} player={results[pos]} />
        ))}
      </div>

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
