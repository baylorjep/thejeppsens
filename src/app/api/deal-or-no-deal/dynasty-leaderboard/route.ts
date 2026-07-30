import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { sortDynastyLeaderboardEntries } from '@/lib/nflDeal/leaderboardRanking';
import { DYNASTY_POSITIONS, POSITIONS } from '@/lib/nflDeal/positions';
import type { DynastyLeaderboardEntry, PositionId } from '@/lib/nflDeal/types';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface LeaderboardRow {
  id: string;
  team_name: string;
  rating: number | string;
  wins: number;
  losses: number;
  playoff_wins: number;
  finish: string;
  players: DynastyLeaderboardEntry['players'];
  created_at: string;
}

type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time';

function parsePeriod(value: string | null): LeaderboardPeriod {
  return value === 'daily' || value === 'weekly' || value === 'monthly' ? value : 'all-time';
}

function periodStart(period: LeaderboardPeriod): string | null {
  if (period === 'all-time') return null;
  const start = new Date();
  const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
  start.setDate(start.getDate() - days);
  return start.toISOString();
}

function isValidLeaderboardEntry(value: unknown): value is DynastyLeaderboardEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as DynastyLeaderboardEntry;
  if (typeof entry.id !== 'string' || entry.id.length === 0 || entry.id.length > 300) return false;
  if (typeof entry.teamName !== 'string' || entry.teamName.trim().length === 0 || entry.teamName.length > 40) return false;
  if (typeof entry.rating !== 'number' || entry.rating < 0 || entry.rating > 100) return false;
  if (!Number.isInteger(entry.wins) || entry.wins < 0 || entry.wins > 17) return false;
  if (!Number.isInteger(entry.losses) || entry.losses < 0 || entry.losses > 17 || entry.wins + entry.losses !== 17) return false;
  if (!Number.isInteger(entry.playoffWins) || entry.playoffWins < 0 || entry.playoffWins > 4) return false;
  if (typeof entry.finish !== 'string' || entry.finish.trim().length === 0 || entry.finish.length > 80) return false;
  if (!entry.players || typeof entry.players !== 'object') return false;

  for (const position of DYNASTY_POSITIONS) {
    const player = entry.players[position];
    if (!player || typeof player !== 'object') return false;
    if (typeof player.id !== 'string' || player.id.length === 0) return false;
    if (typeof player.name !== 'string' || player.name.trim().length === 0 || player.name.length > 80) return false;
    if (typeof player.ovr !== 'number' || player.ovr < 0 || player.ovr > 100) return false;
    if (player.espnId !== null && typeof player.espnId !== 'string') return false;
    if (player.isTeam !== undefined && typeof player.isTeam !== 'boolean') return false;
  }

  return true;
}

function inferPlayoffWins(finish: string): number {
  switch (finish) {
    case 'Super Bowl Champions':
      return 4;
    case 'Super Bowl Runner-Up':
      return 3;
    case 'Conference Championship':
      return 2;
    case 'Divisional Round':
      return 1;
    default:
      return 0;
  }
}

function rowToEntry(row: LeaderboardRow): DynastyLeaderboardEntry {
  // Ensure all player records have espnId and isTeam fields (for backward compat with legacy entries)
  const players = DYNASTY_POSITIONS.reduce(
    (acc, pos) => {
      const p = row.players[pos];
      let espnId = p?.espnId;

      // If espnId is missing, try to look it up from the player boards
      if (!espnId && p?.id) {
        const boardPlayer = POSITIONS[pos].board.find((candidate) => candidate.id === p.id);
        espnId = boardPlayer?.espnId ?? null;
      }

      acc[pos] = {
        id: p?.id ?? '',
        name: p?.name ?? '',
        ovr: p?.ovr ?? 0,
        espnId: espnId ?? null,
        isTeam: p?.isTeam ?? undefined,
      };
      return acc;
    },
    {} as DynastyLeaderboardEntry['players'],
  );

  // For legacy entries with playoff_wins = 0, infer from finish string
  const playoffWins = row.playoff_wins === 0 && row.finish !== 'Missed Playoffs' && row.finish !== 'Wild Card Round' ? inferPlayoffWins(row.finish) : row.playoff_wins;

  return {
    id: row.id,
    teamName: row.team_name,
    rating: Number(row.rating),
    wins: row.wins,
    losses: row.losses,
    playoffWins,
    finish: row.finish,
    players,
    createdAt: row.created_at,
  };
}

async function loadTopEntries(period: LeaderboardPeriod = 'all-time') {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { entries: null, error: 'No DB' };

  let query = supabase
    .from('dynasty_leaderboard_entries')
    .select('id, team_name, rating, wins, losses, playoff_wins, finish, players, created_at')
    .limit(100);
  const start = periodStart(period);
  if (start) query = query.gte('created_at', start);

  const { data, error } = await query;

  if (error) return { entries: null, error: error.message };
  const entries = (data as LeaderboardRow[]).map(rowToEntry);
  return { entries: sortDynastyLeaderboardEntries(entries).slice(0, 5), error: null };
}

export async function GET(request: Request) {
  const period = parsePeriod(new URL(request.url).searchParams.get('period'));
  const { entries, error } = await loadTopEntries(period);
  if (error) return NextResponse.json({ error }, { status: error === 'No DB' ? 503 : 500 });
  return NextResponse.json({ entries });
}

export async function POST(request: Request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: 'No DB' }, { status: 503 });

  const body = await request.json().catch(() => null);
  if (!isValidLeaderboardEntry(body)) {
    return NextResponse.json({ error: 'Invalid leaderboard entry' }, { status: 400 });
  }

  const players = DYNASTY_POSITIONS.reduce(
    (picked, position) => {
      const player = body.players[position];
      picked[position] = {
        id: player.id,
        name: player.name.trim(),
        ovr: Math.round(player.ovr),
        espnId: player.espnId ?? null,
        isTeam: player.isTeam ?? false,
      };
      return picked;
    },
    {} as Record<PositionId, { id: string; name: string; ovr: number; espnId: string | null; isTeam?: boolean }>,
  );

  const { error } = await supabase.from('dynasty_leaderboard_entries').upsert(
    {
      id: body.id,
      team_name: body.teamName.trim(),
      rating: Math.round(body.rating * 10) / 10,
      wins: body.wins,
      losses: body.losses,
      playoff_wins: body.playoffWins,
      finish: body.finish.trim(),
      players,
    },
    { onConflict: 'id' },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const loaded = await loadTopEntries();
  if (loaded.error) return NextResponse.json({ entries: [] });
  return NextResponse.json({ entries: loaded.entries });
}
