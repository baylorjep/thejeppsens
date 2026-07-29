'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Confetti from 'react-confetti';
import { RotateCcw, Trophy } from 'lucide-react';
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
          <Image
            src={headshotUrl}
            alt=""
            fill
            sizes="64px"
            className={player.isTeam ? 'object-contain p-1.5' : 'object-cover'}
            onError={() => setImgFailed(true)}
          />
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

type SeasonTier = 'dynasty' | 'elite' | 'good' | 'decent' | 'bad';

interface SeasonResult {
  rating: number;
  wins: number;
  losses: number;
  finish: string;
  title: string;
  tier: SeasonTier;
  summary: string;
}

const POSITION_WEIGHTS: Record<PositionId, number> = {
  QB: 0.3,
  RB: 0.13,
  WR: 0.18,
  TE: 0.12,
  DST: 0.27,
};

function rosterJitter(results: Partial<Record<PositionId, Player>>): number {
  const seed = DYNASTY_POSITIONS.map((pos) => results[pos]?.id ?? pos).join('|');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  return (hash % 9) - 4;
}

function seasonFor(results: Partial<Record<PositionId, Player>>): SeasonResult {
  const available = DYNASTY_POSITIONS.filter((pos) => results[pos]);
  const totalWeight = available.reduce((sum, pos) => sum + POSITION_WEIGHTS[pos], 0);
  const rating =
    totalWeight > 0
      ? Math.round(
          (available.reduce((sum, pos) => sum + results[pos]!.ovr * POSITION_WEIGHTS[pos], 0) / totalWeight) * 10,
        ) / 10
      : 0;
  const jitter = rosterJitter(results);
  const projectedWins = Math.round((rating - 74) * 0.48 + 5.5 + jitter * 0.28);
  const wins = Math.min(17, Math.max(1, projectedWins));
  const losses = 17 - wins;

  if (wins === 17 && rating >= 96.5) {
    return { rating, wins, losses, finish: 'Super Bowl Champions', title: 'Perfect Dynasty', tier: 'dynasty', summary: 'No one found an answer for this roster.' };
  }
  if (wins >= 14 && rating >= 93 && jitter >= 0) {
    return { rating, wins, losses, finish: 'Super Bowl Champions', title: 'Dynasty', tier: 'dynasty', summary: 'The season ends with confetti and a ring.' };
  }
  if (wins >= 13 && rating >= 91) {
    return { rating, wins, losses, finish: 'Super Bowl Runner-Up', title: 'Elite Contender', tier: 'elite', summary: 'A monster season, one win short of immortality.' };
  }
  if (wins >= 11 && rating >= 88) {
    return { rating, wins, losses, finish: 'Conference Championship', title: 'Title Threat', tier: 'elite', summary: 'This team had January teeth.' };
  }
  if (wins >= 10 && rating >= 85) {
    return { rating, wins, losses, finish: 'Divisional Round', title: 'Playoff Team', tier: 'good', summary: 'Good enough to scare somebody, not quite built to finish it.' };
  }
  if (wins >= 9 && rating >= 83) {
    return { rating, wins, losses, finish: 'Wild Card Round', title: 'Scrappy Wild Card', tier: 'decent', summary: 'A tense season that got them into the dance.' };
  }
  if (wins >= 7) {
    return { rating, wins, losses, finish: 'Missed Playoffs', title: 'Middle of the Pack', tier: 'decent', summary: 'Competitive Sundays, but not enough answers.' };
  }
  return { rating, wins, losses, finish: 'Missed Playoffs', title: 'Rebuild Year', tier: 'bad', summary: 'The Bank kept the better roster.' };
}

function tierTone(tier: SeasonTier): { border: string; text: string; glow: string; confetti: string[] } {
  switch (tier) {
    case 'dynasty':
      return {
        border: 'border-amber-400/50 bg-gradient-to-b from-amber-400/15 via-slate-900 to-slate-900',
        text: 'text-amber-300',
        glow: 'bg-amber-400/10',
        confetti: ['#f59e0b', '#facc15', '#22c55e', '#14b8a6', '#f8fafc'],
      };
    case 'elite':
      return {
        border: 'border-green-500/40 bg-gradient-to-b from-green-500/12 via-slate-900 to-slate-900',
        text: 'text-green-300',
        glow: 'bg-green-500/10',
        confetti: ['#22c55e', '#4ade80', '#86efac', '#14b8a6', '#f8fafc'],
      };
    case 'good':
      return {
        border: 'border-teal-500/40 bg-gradient-to-b from-teal-500/12 via-slate-900 to-slate-900',
        text: 'text-teal-300',
        glow: 'bg-teal-500/10',
        confetti: ['#14b8a6', '#2dd4bf', '#38bdf8', '#f8fafc'],
      };
    case 'decent':
      return {
        border: 'border-sky-500/35 bg-gradient-to-b from-sky-500/10 via-slate-900 to-slate-900',
        text: 'text-sky-300',
        glow: 'bg-sky-500/10',
        confetti: ['#38bdf8', '#60a5fa', '#94a3b8', '#f8fafc'],
      };
    case 'bad':
      return {
        border: 'border-rose-500/35 bg-gradient-to-b from-rose-500/10 via-slate-900 to-slate-900',
        text: 'text-rose-300',
        glow: 'bg-rose-500/10',
        confetti: ['#fb7185', '#f43f5e', '#94a3b8', '#f8fafc'],
      };
  }
}

export default function NflDealDynastySummary({ results, onPlayAgain }: Props) {
  const [windowSize, setWindowSize] = useState<{ w: number; h: number } | null>(null);
  const [stage, setStage] = useState<'roster' | 'simulating' | 'revealed'>('roster');

  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
  }, []);

  useEffect(() => {
    if (stage === 'revealed') return;
    const t = setTimeout(() => setStage(stage === 'roster' ? 'simulating' : 'revealed'), stage === 'roster' ? 3200 : 3600);
    return () => clearTimeout(t);
  }, [stage]);

  const season = seasonFor(results);
  const tone = tierTone(season.tier);
  const celebrate = season.tier === 'dynasty' || season.tier === 'elite';

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 text-center sm:p-10 ${tone.border}`}>
      {stage === 'revealed' && celebrate && windowSize && (
        <Confetti
          width={windowSize.w}
          height={windowSize.h}
          recycle={false}
          numberOfPieces={season.tier === 'dynasty' ? 320 : 220}
          colors={tone.confetti}
        />
      )}

      <p className={`text-[10px] font-bold uppercase tracking-[0.3em] ${tone.text}`}>Your Dynasty</p>
      <h2 className="animate-case-reveal mt-1 text-3xl font-black text-white sm:text-4xl">
        {stage === 'revealed' ? season.title : stage === 'simulating' ? 'Season Simulation' : 'Team Complete'}
      </h2>

      <div className="animate-case-reveal mx-auto mt-6 flex flex-col items-center gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overall Team Rating</p>
        <p className={`text-5xl font-black sm:text-6xl ${tone.text}`}>{season.rating}</p>
      </div>

      <div className="mx-auto mt-8 grid max-w-4xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {DYNASTY_POSITIONS.map((pos) => (
          results[pos] ? <RosterCard key={pos} position={pos} player={results[pos]} /> : null
        ))}
      </div>

      {stage === 'simulating' && (
        <div className="animate-case-reveal mx-auto mt-8 max-w-xl rounded-xl border border-slate-700 bg-slate-950/60 p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">The season plays out</p>
          <div className="mt-5 flex justify-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-3 w-3 animate-pulse rounded-full bg-teal-300" style={{ animationDelay: `${i * 180}ms` }} />
            ))}
          </div>
          <p className="mt-5 text-sm text-slate-400">The Bank is calculating wins, losses, and heartbreak.</p>
        </div>
      )}

      {stage === 'revealed' && (
        <div className={`animate-case-reveal mx-auto mt-8 max-w-2xl rounded-2xl border border-slate-700 p-6 ${tone.glow}`}>
          <div className="flex flex-col items-center gap-2">
            <Trophy className={`h-8 w-8 ${tone.text}`} aria-hidden />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Predicted Season</p>
            <p className="text-5xl font-black text-white sm:text-6xl">
              {season.wins}-{season.losses}
            </p>
            <p className={`text-xl font-black uppercase tracking-wide ${tone.text}`}>{season.finish}</p>
            <p className="max-w-md text-sm text-slate-300">{season.summary}</p>
          </div>
        </div>
      )}

      <div className="mt-8 flex justify-center gap-3">
        {stage !== 'revealed' && (
          <button
            type="button"
            onClick={() => setStage('revealed')}
            className="rounded-lg border border-slate-600 px-5 py-3 text-sm font-bold uppercase tracking-wide text-slate-200 transition-colors hover:border-slate-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200"
          >
            Skip Reveal
          </button>
        )}
        <button
          type="button"
          onClick={onPlayAgain}
          className="flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-3 text-sm font-bold uppercase tracking-wide text-slate-950 transition-colors hover:bg-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Play Again
        </button>
      </div>
    </div>
  );
}
