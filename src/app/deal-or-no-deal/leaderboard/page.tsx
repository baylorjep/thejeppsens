'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Trophy } from 'lucide-react';
import type { DynastyLeaderboardEntry, PositionId } from '@/lib/nflDeal/types';
import { DYNASTY_POSITIONS, POSITIONS } from '@/lib/nflDeal/positions';
function LeaderboardPlayerChip({ position, player }: { position: PositionId; player: { id: string; name: string; ovr: number } }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-800 bg-slate-950/70 p-2">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
          <span className="text-[10px] font-bold text-slate-300">
            {player.name.split(' ').map((p) => p[0]).join('')}
          </span>
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

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<DynastyLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const response = await fetch('/api/deal-or-no-deal/dynasty-leaderboard', { cache: 'no-store' });
      if (response.ok) {
        const data = (await response.json()) as { entries?: DynastyLeaderboardEntry[] };
        if (Array.isArray(data.entries)) {
          setEntries(data.entries.sort((a, b) => b.rating - a.rating || b.wins - a.wins));
        }
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link href="/deal-or-no-deal" className="flex items-center gap-2 text-sm font-semibold text-teal-300 hover:text-teal-200 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Game
        </Link>

        <div className="rounded-2xl border border-amber-500/25 bg-slate-900/85 p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <Trophy className="h-8 w-8 text-amber-300" />
            <div>
              <h1 className="text-3xl font-black text-white sm:text-4xl">Dynasty Leaderboard</h1>
              <p className="mt-1 text-sm font-semibold text-slate-400">All-Time Top Rosters</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-400">Loading leaderboard...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400">No dynasty rosters yet. Build one to get on the leaderboard!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, index) => (
                <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-900/75 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="rounded-md border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-xs font-black text-amber-300 shrink-0">
                          #{index + 1}
                        </span>
                        <p className="truncate text-lg font-black text-white">{entry.teamName}</p>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-500">{entry.finish}</p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-right sm:text-right">
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
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-5">
                    {DYNASTY_POSITIONS.map((pos) => (
                      <LeaderboardPlayerChip key={pos} position={pos} player={entry.players[pos]} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
