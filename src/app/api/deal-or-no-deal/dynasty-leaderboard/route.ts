import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { DYNASTY_POSITIONS } from '@/lib/nflDeal/positions';
import type { DynastyLeaderboardEntry, PositionId } from '@/lib/nflDeal/types';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface LeaderboardRow {
  id: string;
  team_name: string;
  rating: number | string;
  wins: number;
  losses: number;
  finish: string;
  players: DynastyLeaderboardEntry['players'];
  created_at: string;
}

function isValidLeaderboardEntry(value: unknown): value is DynastyLeaderboardEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as DynastyLeaderboardEntry;
  if (typeof entry.id !== 'string' || entry.id.length === 0 || entry.id.length > 300) return false;
  if (typeof entry.teamName !== 'string' || entry.teamName.trim().length === 0 || entry.teamName.length > 40) return false;
  if (typeof entry.rating !== 'number' || entry.rating < 0 || entry.rating > 100) return false;
  if (!Number.isInteger(entry.wins) || entry.wins < 0 || entry.wins > 17) return false;
  if (!Number.isInteger(entry.losses) || entry.losses < 0 || entry.losses > 17 || entry.wins + entry.losses !== 17) return false;
  if (typeof entry.finish !== 'string' || entry.finish.trim().length === 0 || entry.finish.length > 80) return false;
  if (!entry.players || typeof entry.players !== 'object') return false;

  for (const position of DYNASTY_POSITIONS) {
    const player = entry.players[position];
    if (!player || typeof player !== 'object') return false;
    if (typeof player.id !== 'string' || player.id.length === 0) return false;
    if (typeof player.name !== 'string' || player.name.trim().length === 0 || player.name.length > 80) return false;
    if (typeof player.ovr !== 'number' || player.ovr < 0 || player.ovr > 100) return false;
  }

  return true;
}

function rowToEntry(row: LeaderboardRow): DynastyLeaderboardEntry {
  return {
    id: row.id,
    teamName: row.team_name,
    rating: Number(row.rating),
    wins: row.wins,
    losses: row.losses,
    finish: row.finish,
    players: row.players,
    createdAt: row.created_at,
  };
}

async function loadTopEntries() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return { entries: null, error: 'No DB' };

  const { data, error } = await supabase
    .from('dynasty_leaderboard_entries')
    .select('id, team_name, rating, wins, losses, finish, players, created_at')
    .order('rating', { ascending: false })
    .order('wins', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(5);

  if (error) return { entries: null, error: error.message };
  return { entries: (data as LeaderboardRow[]).map(rowToEntry), error: null };
}

export async function GET() {
  const { entries, error } = await loadTopEntries();
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
      };
      return picked;
    },
    {} as Record<PositionId, { id: string; name: string; ovr: number }>,
  );

  const { error } = await supabase.from('dynasty_leaderboard_entries').upsert(
    {
      id: body.id,
      team_name: body.teamName.trim(),
      rating: Math.round(body.rating * 10) / 10,
      wins: body.wins,
      losses: body.losses,
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
