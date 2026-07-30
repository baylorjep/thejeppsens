'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Confetti from 'react-confetti';
import { RotateCcw, Trophy } from 'lucide-react';
import { espnHeadshotUrl } from '@/lib/nflDeal/playerData';
import { DYNASTY_POSITIONS, POSITIONS } from '@/lib/nflDeal/positions';
import type { DynastyLeaderboardEntry, Player, PositionId } from '@/lib/nflDeal/types';

interface Props {
  results: Partial<Record<PositionId, Player>>;
  teamName: string;
  onPlayAgain: () => void;
  onSimulationStart?: () => void;
  onSeasonReveal?: () => void;
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
  playoffWins: number;
  playoffWeeks: WeekResult[];
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

function ResultCard({
  teamName,
  season,
  toneText,
  results,
}: {
  teamName: string;
  season: SeasonResult;
  toneText: string;
  results: Partial<Record<PositionId, Player>>;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-950/90 p-5 text-left shadow-2xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">Result Card</p>
          <h3 className="mt-1 text-2xl font-black text-white">{teamName}</h3>
          <p className={`text-sm font-black uppercase tracking-wide ${toneText}`}>{season.title}</p>
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
      <p className="mt-4 text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">Deal or No Deal Dynasty</p>
    </div>
  );
}

function hydrateLeaderboardPlayer(position: PositionId, player: DynastyLeaderboardEntry['players'][PositionId]): Player {
  const boardPlayer = POSITIONS[position].board.find((candidate) => candidate.id === player.id);
  return {
    ...(boardPlayer ?? {
      id: player.id,
      name: player.name,
      rank: 999,
      espnId: null,
    }),
    name: player.name,
    ovr: player.ovr,
  };
}

function LeaderboardPlayerChip({ position, player }: { position: PositionId; player: Player }) {
  const [imgFailed, setImgFailed] = useState(false);
  const headshotUrl = espnHeadshotUrl(player);

  return (
    <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/70 p-2">
      <div className="flex items-center gap-2">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-slate-700 bg-slate-800">
          {headshotUrl && !imgFailed ? (
            <Image
              src={headshotUrl}
              alt=""
              fill
              sizes="36px"
              className={player.isTeam ? 'object-contain p-1' : 'object-cover'}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-slate-300">
              {player.name.split(' ').map((p) => p[0]).join('')}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{POSITIONS[position].shortLabel}</p>
          <p className="truncate text-[11px] font-semibold text-white">{player.name}</p>
        </div>
      </div>
      <p className="mt-1 text-right text-xs font-black text-teal-300">{player.ovr}</p>
    </div>
  );
}

function DynastyLeaderboard({ entries }: { entries: DynastyLeaderboardEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="animate-case-reveal mx-auto mt-5 max-w-4xl rounded-xl border border-amber-500/25 bg-slate-950/85 p-5 text-left shadow-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">All-Time Dynasty Leaderboard</p>
          <h3 className="mt-1 text-xl font-black text-white">Top 5 Teams</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Best saved teams across everyone who plays.</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/10">
          <Trophy className="h-6 w-6 text-amber-300" aria-hidden />
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {entries.map((entry, index) => {
          const hydratedPlayers = DYNASTY_POSITIONS.map((pos) => ({
            position: pos,
            player: hydrateLeaderboardPlayer(pos, entry.players[pos]),
          }));

          return (
            <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-900/75 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md border border-amber-400/25 bg-amber-400/10 px-2 py-1 text-xs font-black text-amber-300">
                      #{index + 1}
                    </span>
                    <p className="truncate text-base font-black text-white">{entry.teamName}</p>
                  </div>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{entry.finish}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-left sm:grid-cols-[auto_auto] sm:text-right">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Rating</p>
                    <p className="text-2xl font-black text-teal-300">{entry.rating}</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Record</p>
                    <p className="text-2xl font-black text-white">
                      {entry.wins}-{entry.losses}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-5">
                {hydratedPlayers.map(({ position, player }) => (
                  <LeaderboardPlayerChip key={position} position={position} player={player} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Recalculates rating and wins for legacy leaderboard entries using current synergy rules
function recalculateEntryStats(entry: DynastyLeaderboardEntry): DynastyLeaderboardEntry {
  const players = entry.players;
  const qb = players.QB?.ovr ?? 0;
  const rb = players.RB?.ovr ?? 0;
  const wr = players.WR?.ovr ?? 0;
  const te = players.TE?.ovr ?? 0;
  const dst = players.DST?.ovr ?? 0;

  // Recalculate rating with current weights
  const ovrSum = qb * 0.35 + rb * 0.13 + wr * 0.16 + te * 0.11 + dst * 0.25;
  const newRating = Math.round(ovrSum * 10) / 10;

  // Recalculate synergy bonuses
  let synergy = 0;
  if (qb >= 85 && wr >= 85) synergy += 2;
  if (wr >= 80 && te >= 80) synergy += 1;
  if (qb >= 85 && rb >= 85) synergy += 1;
  if (dst >= 90) synergy += 1.5;
  if (qb < 75) synergy -= 0.5;

  // Recalculate wins (using 0 jitter for consistency across recalculations)
  const projectedWins = Math.round((newRating - 74) * 0.48 + 5.5 + synergy);
  const newWins = Math.min(17, Math.max(1, projectedWins));
  const newLosses = 17 - newWins;

  return { ...entry, rating: newRating, wins: newWins, losses: newLosses };
}

async function updateTeamName(entryId: string, newName: string): Promise<boolean> {
  try {
    const response = await fetch('/api/deal-or-no-deal/update-team-name', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: entryId, teamName: newName }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function fetchDynastyLeaderboard(): Promise<DynastyLeaderboardEntry[]> {
  const response = await fetch('/api/deal-or-no-deal/dynasty-leaderboard', { cache: 'no-store' });
  if (!response.ok) return [];
  const data = (await response.json()) as { entries?: DynastyLeaderboardEntry[] };
  const entries = Array.isArray(data.entries) ? data.entries : [];
  // Recalculate all entries with current synergy rules
  return entries.map(recalculateEntryStats).sort((a, b) => b.rating - a.rating || b.wins - a.wins);
}

async function saveDynastyLeaderboardEntry(entry: DynastyLeaderboardEntry): Promise<DynastyLeaderboardEntry[]> {
  const response = await fetch('/api/deal-or-no-deal/dynasty-leaderboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  });
  if (!response.ok) return [];
  const data = (await response.json()) as { entries?: DynastyLeaderboardEntry[] };
  return Array.isArray(data.entries) ? data.entries : [];
}

const POSITION_WEIGHTS: Record<PositionId, number> = {
  QB: 0.35,
  RB: 0.13,
  WR: 0.16,
  TE: 0.11,
  DST: 0.25,
};

function rosterJitter(results: Partial<Record<PositionId, Player>>): number {
  const seed = DYNASTY_POSITIONS.map((pos) => results[pos]?.id ?? pos).join('|');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  return (hash % 9) - 4;
}

function simulatePlayoffGame(teamRating: number, teamJitter: number, opponentRating: number, seed: number): { won: boolean; teamScore: number; oppScore: number } {
  const seedBonus = (8 - seed) * 0.3;
  const teamStrength = teamRating + teamJitter + seedBonus;
  const oppStrength = opponentRating + (Math.random() * 4 - 2);
  const won = teamStrength > oppStrength;
  const teamScore = Math.round(20 + Math.random() * 10 + (won ? 3 : -2));
  const oppScore = Math.round(20 + Math.random() * 10 + (won ? -3 : 2));
  return { won, teamScore, oppScore };
}

function simulatePlayoffs(rating: number, wins: number, jitter: number, seed: number, startWeek: number): { weeks: WeekResult[]; finish: string; title: string; tier: SeasonTier; summary: string; playoffWins: number } {
  const weeks: WeekResult[] = [];
  if (wins < 7) {
    return { weeks, finish: 'Missed Playoffs', title: 'Rebuild Year', tier: 'bad', summary: 'The Bank kept the better roster.', playoffWins: 0 };
  }

  let currentSeed = seed;
  let playoffWins = 0;
  let weekIndex = startWeek;

  // Determine starting round based on seed
  if (seed <= 2) {
    // #1-2 seeds get bye, start at Divisional (week 19)
    weekIndex = startWeek + 1;
  } else if (seed <= 6) {
    // Wild Card game (week 18)
    const opponentRating = 75 + Math.random() * 12;
    const game = simulatePlayoffGame(rating, jitter, opponentRating, currentSeed);
    weeks.push({
      week: weekIndex + 1,
      opponent: 'Wild Card Opponent',
      won: game.won,
      score: `${game.teamScore}-${game.oppScore}`,
      note: '',
    });
    if (!game.won) {
      return { weeks, finish: 'Wild Card Round', title: 'Wild Card Exit', tier: 'decent', summary: 'So close, yet the playoffs had other plans.', playoffWins };
    }
    playoffWins = 1;
    weekIndex += 1;
  }

  // Divisional Round (week 19)
  const divisionalOpp = 85 + Math.random() * 8;
  const divisionalGame = simulatePlayoffGame(rating, jitter, divisionalOpp, currentSeed + 1);
  weeks.push({
    week: weekIndex + 1,
    opponent: 'Divisional Opponent',
    won: divisionalGame.won,
    score: `${divisionalGame.teamScore}-${divisionalGame.oppScore}`,
    note: '',
  });
  if (!divisionalGame.won) {
    return { weeks, finish: 'Divisional Round', title: 'Divisional Exit', tier: 'good', summary: 'A valiant effort ended by a stronger foe.', playoffWins };
  }
  playoffWins += 1;

  // Conference Championship (week 20)
  const confChampOpp = 87 + Math.random() * 8;
  const confGame = simulatePlayoffGame(rating, jitter, confChampOpp, currentSeed + 2);
  weeks.push({
    week: weekIndex + 2,
    opponent: 'Conference Championship',
    won: confGame.won,
    score: `${confGame.teamScore}-${confGame.oppScore}`,
    note: '',
  });
  if (!confGame.won) {
    return { weeks, finish: 'Conference Championship', title: 'Conference Champion', tier: 'elite', summary: 'One game away from immortality, but it wasn\'t meant to be.', playoffWins };
  }
  playoffWins += 1;

  // Super Bowl (week 21)
  const superbowlOpp = 88 + Math.random() * 7;
  const sbGame = simulatePlayoffGame(rating, jitter, superbowlOpp, currentSeed + 3);
  weeks.push({
    week: weekIndex + 3,
    opponent: 'Super Bowl',
    won: sbGame.won,
    score: `${sbGame.teamScore}-${sbGame.oppScore}`,
    note: '',
  });
  if (sbGame.won) {
    playoffWins += 1;
    return { weeks, finish: 'Super Bowl Champions', title: 'Dynasty', tier: 'dynasty', summary: 'The season ends with confetti and a ring.', playoffWins };
  }
  return { weeks, finish: 'Super Bowl Runner-Up', title: 'Elite Contender', tier: 'elite', summary: 'A monster season, one win short of immortality.', playoffWins };
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

  // Position synergies
  let synergy = 0;
  const qb = results.QB?.ovr ?? 0;
  const rb = results.RB?.ovr ?? 0;
  const wr = results.WR?.ovr ?? 0;
  const te = results.TE?.ovr ?? 0;
  const dst = results.DST?.ovr ?? 0;

  // QB-WR synergy: great passing attack
  if (qb >= 85 && wr >= 85) synergy += 2;
  // Pass catchers synergy: strong receiving corps
  if (wr >= 80 && te >= 80) synergy += 1;
  // QB-RB synergy: balanced attack is hard to stop
  if (qb >= 85 && rb >= 85) synergy += 1;
  // Elite defense can carry a game
  if (dst >= 90) synergy += 1.5;
  // Weak QB limits effectiveness
  if (qb < 75) synergy -= 0.5;

  const jitter = rosterJitter(results);
  const projectedWins = Math.round((rating - 74) * 0.48 + 5.5 + jitter * 0.28 + synergy);
  const wins = Math.min(17, Math.max(1, projectedWins));
  const losses = 17 - wins;

  // Determine playoff seed (1-7 based on wins, 1 seed = 14+ wins)
  let seed = 7;
  if (wins >= 14) seed = 1;
  else if (wins >= 13) seed = 2;
  else if (wins >= 12) seed = 3;
  else if (wins >= 11) seed = 4;
  else if (wins >= 10) seed = 5;
  else if (wins >= 9) seed = 6;
  else if (wins >= 7) seed = 7;

  const playoff = simulatePlayoffs(rating, wins, jitter, seed, 17);

  return { rating, wins, losses, playoffWins: playoff.playoffWins, playoffWeeks: playoff.weeks, finish: playoff.finish, title: playoff.title, tier: playoff.tier, summary: playoff.summary };
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

  const regularSeasonWeeks = Array.from({ length: 17 }, (_, index) => {
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

  return [...regularSeasonWeeks, ...season.playoffWeeks];
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

export default function NflDealDynastySummary({ results, teamName, onPlayAgain, onSimulationStart, onSeasonReveal }: Props) {
  const [windowSize, setWindowSize] = useState<{ w: number; h: number } | null>(null);
  const [stage, setStage] = useState<'roster' | 'simulating' | 'season-summary' | 'revealed'>('roster');
  const [visibleWeeks, setVisibleWeeks] = useState(0);
  const [showResultCardModal, setShowResultCardModal] = useState(false);
  const [leaderboard, setLeaderboard] = useState<DynastyLeaderboardEntry[]>([]);
  const [playoffSeed, setPlayoffSeed] = useState(7);
  const [editingTeamName, setEditingTeamName] = useState(false);
  const [newTeamName, setNewTeamName] = useState(teamName);
  const [savingTeamName, setSavingTeamName] = useState(false);
  const weeksDisplayRef = useRef<HTMLDivElement>(null);
  const savedLeaderboardIdRef = useRef<string | null>(null);

  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    let active = true;
    fetchDynastyLeaderboard()
      .then((entries) => {
        if (active) setLeaderboard(entries);
      })
      .catch(() => {
        if (active) setLeaderboard([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const missingPositions = DYNASTY_POSITIONS.filter((pos) => !results[pos]);

  useEffect(() => {
    if (stage !== 'roster' || missingPositions.length > 0) return;
    const t = setTimeout(() => setStage('simulating'), 3200);
    return () => clearTimeout(t);
  }, [missingPositions.length, stage]);

  const season = useMemo(() => seasonFor(results), [results]);
  const tone = tierTone(season.tier);
  const celebrate = season.tier === 'dynasty' || season.tier === 'elite';
  const weeks = useMemo(() => buildWeekResults(season, teamName, results), [results, season, teamName]);
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
      // Calculate seed after simulation
      let seed = 7;
      if (season.wins >= 14) seed = 1;
      else if (season.wins >= 13) seed = 2;
      else if (season.wins >= 12) seed = 3;
      else if (season.wins >= 11) seed = 4;
      else if (season.wins >= 10) seed = 5;
      else if (season.wins >= 9) seed = 6;
      setPlayoffSeed(seed);
      const t = setTimeout(() => setStage('season-summary'), 650);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisibleWeeks((count) => count + 1), visibleWeeks < 4 ? 420 : 260);
    return () => clearTimeout(t);
  }, [stage, visibleWeeks, weeks.length]);

  useEffect(() => {
    if (stage === 'simulating') onSimulationStart?.();
    if (stage === 'revealed') {
      onSeasonReveal?.();
      setShowResultCardModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    // Auto-scroll to weeks display on mobile during simulation
    if (stage === 'simulating' && visibleWeeks > 0 && window.innerWidth < 768) {
      setTimeout(() => {
        weeksDisplayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [visibleWeeks, stage]);

  useEffect(() => {
    if (stage !== 'revealed' || missingPositions.length > 0) return;

    const players = DYNASTY_POSITIONS.reduce(
      (picked, pos) => {
        const player = results[pos]!;
        picked[pos] = { id: player.id, name: player.name, ovr: player.ovr, espnId: player.espnId, isTeam: player.isTeam };
        return picked;
      },
      {} as DynastyLeaderboardEntry['players'],
    );
    const id = `${teamName}|${DYNASTY_POSITIONS.map((pos) => players[pos].id).join('|')}`;
    if (savedLeaderboardIdRef.current === id) return;
    savedLeaderboardIdRef.current = id;

    saveDynastyLeaderboardEntry({
      id,
      teamName,
      rating: season.rating,
      wins: season.wins,
      losses: season.losses,
      playoffWins: season.playoffWins,
      finish: season.finish,
      players,
      createdAt: new Date().toISOString(),
    })
      .then(setLeaderboard)
      .catch(() => setLeaderboard([]));
  }, [missingPositions.length, results, season.finish, season.losses, season.playoffWins, season.rating, season.wins, stage, teamName]);

  if (stage === 'season-summary') {
    return (
      <div className="rounded-2xl border border-amber-500/25 bg-slate-900/85 p-8 shadow-2xl">
        <div className="space-y-8">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-300">Regular Season Complete</p>
            <h2 className="mt-3 text-4xl font-black text-white sm:text-5xl">{season.wins}-{season.losses}</h2>
            <p className="mt-2 text-lg font-semibold text-slate-300">{season.title}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Team Rating</p>
              <p className="mt-2 text-3xl font-black text-teal-300">{season.rating}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Playoff Seed</p>
              <p className="mt-2 text-3xl font-black text-amber-300">{playoffSeed}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">Status</p>
              <p className="mt-2 text-lg font-black text-sky-300">{playoffSeed <= 7 ? 'Playoffs' : 'Missed'}</p>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStage('revealed')}
              className="flex-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 text-center font-bold uppercase text-slate-950 transition-all hover:from-amber-400 hover:to-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              Start Playoffs
            </button>
            <button
              onClick={onPlayAgain}
              className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-4 font-bold uppercase text-slate-300 transition-colors hover:bg-slate-700 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            >
              New Season
            </button>
          </div>
        </div>
      </div>
    );
  }

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
      <div className="flex items-center justify-center gap-3">
        <h2 className="animate-case-reveal mt-1 text-3xl font-black text-white sm:text-4xl">
          {stage === 'revealed' ? newTeamName : stage === 'simulating' ? 'Season Simulation' : newTeamName}
        </h2>
        {stage === 'revealed' && (
          <button
            onClick={() => setEditingTeamName(true)}
            className="mt-1 rounded-lg border border-slate-700 p-2 text-slate-400 transition-colors hover:border-slate-500 hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
            title="Edit team name"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
      </div>

      {editingTeamName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl sm:max-w-sm w-full">
            <h3 className="text-lg font-black text-white">Edit Team Name</h3>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value.slice(0, 40))}
              className="mt-4 w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-white outline-none transition-colors focus:border-teal-400"
              placeholder="Team name"
              maxLength={40}
              autoFocus
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setEditingTeamName(false)}
                className="flex-1 rounded-lg border border-slate-700 px-4 py-2 font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (newTeamName.trim().length === 0) return;
                  setSavingTeamName(true);
                  const entryId = `${newTeamName}|${DYNASTY_POSITIONS.map((pos) => results[pos]?.id ?? pos).join('|')}`;
                  const success = await updateTeamName(entryId, newTeamName);
                  setSavingTeamName(false);
                  if (success) {
                    setEditingTeamName(false);
                    setLeaderboard([]);
                  }
                }}
                disabled={savingTeamName || newTeamName.trim().length === 0}
                className="flex-1 rounded-lg bg-teal-500 px-4 py-2 font-semibold text-slate-950 transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
              >
                {savingTeamName ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
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
        <div ref={weeksDisplayRef} className="animate-case-reveal mx-auto mt-8 max-w-2xl rounded-xl border border-slate-700 bg-slate-950/60 p-4 sm:p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Week by week</p>
          <div className="mt-4 max-h-72 space-y-2 overflow-hidden text-left">
            {weeks.slice(0, visibleWeeks).reverse().map((week) => (
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
        <div className="animate-case-reveal mx-auto mt-5 max-w-3xl">
          <ResultCard teamName={teamName} season={season} toneText={tone.text} results={results} />
        </div>
      )}

      {stage === 'revealed' && <DynastyLeaderboard entries={leaderboard} />}

      {showResultCardModal && stage === 'revealed' && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Dynasty result card"
          onClick={() => setShowResultCardModal(false)}
          className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/80 px-4 py-6 backdrop-blur-sm"
        >
          <div className="w-full max-w-3xl" onClick={(event) => event.stopPropagation()}>
            <ResultCard teamName={teamName} season={season} toneText={tone.text} results={results} />
            <button
              type="button"
              onClick={() => setShowResultCardModal(false)}
              className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-900/90 px-5 py-3 text-sm font-bold uppercase tracking-wide text-slate-200 transition-colors hover:border-slate-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200"
            >
              View Full Summary
            </button>
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
