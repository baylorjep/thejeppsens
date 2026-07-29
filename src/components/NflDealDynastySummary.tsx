'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Confetti from 'react-confetti';
import { RotateCcw, Trophy } from 'lucide-react';
import { espnHeadshotUrl } from '@/lib/nflDeal/playerData';
import { DYNASTY_POSITIONS, POSITIONS } from '@/lib/nflDeal/positions';
import type { Player, PositionId } from '@/lib/nflDeal/types';

interface Props {
  results: Partial<Record<PositionId, Player>>;
  teamName: string;
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
      <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {player.ratingSource ?? 'Rating source pending'}
      </p>
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

interface WeekResult {
  week: number;
  opponent: string;
  won: boolean;
  score: string;
  note: string;
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

const NFL_OPPONENTS = [
  'Kansas City',
  'Buffalo',
  'Baltimore',
  'Cincinnati',
  'Houston',
  'Denver',
  'Detroit',
  'Green Bay',
  'Philadelphia',
  'Dallas',
  'San Francisco',
  'Los Angeles',
  'Seattle',
  'Miami',
  'Tampa Bay',
  'Atlanta',
  'Chicago',
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = (hash * 33 + value.charCodeAt(i)) % 104729;
  return hash;
}

function buildWeekResults(season: SeasonResult, teamName: string, results: Partial<Record<PositionId, Player>>): WeekResult[] {
  const seed = hashString(`${teamName}|${DYNASTY_POSITIONS.map((pos) => results[pos]?.id ?? pos).join('|')}`);
  const weeks = Array.from({ length: 17 }, (_, index) => {
    const wobble = ((seed + index * 37) % 13) - 6;
    const opponent = NFL_OPPONENTS[(seed + index * 5) % NFL_OPPONENTS.length];
    return { index, wobble, opponent };
  }).sort((a, b) => b.wobble - a.wobble);
  const winIndexes = new Set(weeks.slice(0, season.wins).map((week) => week.index));

  return Array.from({ length: 17 }, (_, index) => {
    const won = winIndexes.has(index);
    const margin = Math.abs(((seed + index * 11) % 18) - 6) + 1;
    const base = 18 + ((seed + index * 7) % 17);
    const high = base + margin;
    const low = Math.max(6, base - Math.max(1, Math.floor(margin / 2)));
    const note = won
      ? index >= 14 && season.wins >= 10
        ? 'Playoff push'
        : margin >= 14
          ? 'Statement win'
          : 'Found a way'
      : margin >= 14
        ? 'Rough Sunday'
        : index >= 14 && season.wins < 9
          ? 'Season slipping'
          : 'Close loss';
    return {
      week: index + 1,
      opponent: weeks.find((week) => week.index === index)?.opponent ?? NFL_OPPONENTS[index],
      won,
      score: won ? `${high}-${low}` : `${low}-${high}`,
      note,
    };
  });
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

export default function NflDealDynastySummary({ results, teamName, onPlayAgain }: Props) {
  const [windowSize, setWindowSize] = useState<{ w: number; h: number } | null>(null);
  const [stage, setStage] = useState<'roster' | 'simulating' | 'revealed'>('roster');
  const [visibleWeeks, setVisibleWeeks] = useState(0);

  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
  }, []);

  const missingPositions = DYNASTY_POSITIONS.filter((pos) => !results[pos]);

  useEffect(() => {
    if (stage !== 'roster' || missingPositions.length > 0) return;
    const t = setTimeout(() => setStage('simulating'), 3200);
    return () => clearTimeout(t);
  }, [missingPositions.length, stage]);

  const season = seasonFor(results);
  const tone = tierTone(season.tier);
  const celebrate = season.tier === 'dynasty' || season.tier === 'elite';
  const weeks = buildWeekResults(season, teamName, results);
  const currentRecord = weeks.slice(0, visibleWeeks).reduce(
    (record, week) => {
      if (week.won) record.wins += 1;
      else record.losses += 1;
      return record;
    },
    { wins: 0, losses: 0 },
  );

  useEffect(() => {
    if (stage !== 'simulating') return;
    if (visibleWeeks >= weeks.length) {
      const t = setTimeout(() => setStage('revealed'), 650);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleWeeks((count) => count + 1), visibleWeeks < 4 ? 420 : 260);
    return () => clearTimeout(t);
  }, [stage, visibleWeeks, weeks.length]);

  if (missingPositions.length > 0) {
    return (
      <div className="rounded-2xl border border-amber-500/35 bg-slate-900 p-6 text-center sm:p-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-300">Dynasty needs a fresh run</p>
        <h2 className="mt-1 text-3xl font-black text-white sm:text-4xl">{teamName}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
          This saved Dynasty is missing {missingPositions.map((pos) => POSITIONS[pos].shortLabel).join(', ')} from the new format.
        </p>
        <button
          type="button"
          onClick={onPlayAgain}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-3 text-sm font-bold uppercase tracking-wide text-slate-950 transition-colors hover:bg-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Start Fresh
        </button>
      </div>
    );
  }

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
        {stage === 'revealed' ? teamName : stage === 'simulating' ? 'Season Simulation' : teamName}
      </h2>
      <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
        {stage === 'revealed' ? season.title : stage === 'simulating' ? `${currentRecord.wins}-${currentRecord.losses}` : 'Team Complete'}
      </p>

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
        <div className="animate-case-reveal mx-auto mt-8 max-w-2xl rounded-xl border border-slate-700 bg-slate-950/60 p-4 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Week by week</p>
          <div className="mt-4 max-h-72 space-y-2 overflow-hidden text-left">
            {weeks.slice(0, visibleWeeks).map((week) => (
              <div key={week.week} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Wk {week.week}</span>
                <span className="min-w-0 truncate text-sm font-semibold text-slate-200">vs {week.opponent}</span>
                <span className={`text-right text-xs font-black ${week.won ? 'text-green-300' : 'text-rose-300'}`}>
                  {week.won ? 'W' : 'L'} {week.score}
                </span>
                <span className="col-start-2 text-[11px] text-slate-500">{week.note}</span>
                <span className="text-right text-[11px] font-semibold text-slate-500">
                  {weeks.slice(0, week.week).filter((w) => w.won).length}-{week.week - weeks.slice(0, week.week).filter((w) => w.won).length}
                </span>
              </div>
            ))}
          </div>
          {visibleWeeks === 0 && <p className="mt-5 text-sm text-slate-400">The schedule is loading.</p>}
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

      {stage === 'revealed' && (
        <div className="animate-case-reveal mx-auto mt-5 max-w-3xl rounded-xl border border-slate-700 bg-slate-950/70 p-5 text-left">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Result Card</p>
              <h3 className="mt-1 text-2xl font-black text-white">{teamName}</h3>
              <p className={`text-sm font-black uppercase tracking-wide ${tone.text}`}>{season.title}</p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-4xl font-black text-white">
                {season.wins}-{season.losses}
              </p>
              <p className="text-sm font-semibold text-slate-400">{season.finish}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {DYNASTY_POSITIONS.map((pos) => (
              <div key={pos} className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{POSITIONS[pos].shortLabel}</p>
                <p className="truncate text-xs font-semibold text-white">{results[pos]!.name}</p>
                <p className="text-sm font-black text-teal-300">{results[pos]!.ovr}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">Baylor & Isabel Deal or No Deal Dynasty</p>
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
