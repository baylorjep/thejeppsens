import type { DynastyLeaderboardEntry } from './types';

const PLAYOFF_FINISH_RANK: Record<string, number> = {
  'Super Bowl Champions': 4,
  'Super Bowl Runner-Up': 3,
  'Conference Championship': 2,
  'Divisional Round': 1,
  'Wild Card Round': 0,
  'Missed Playoffs': 0,
};

export function playoffFinishRank(finish: string): number {
  return PLAYOFF_FINISH_RANK[finish] ?? 0;
}

// Ranking is based on postseason outcome, then regular-season record, then roster rating.
export function sortDynastyLeaderboardEntries(entries: DynastyLeaderboardEntry[]): DynastyLeaderboardEntry[] {
  return [...entries].sort(
    (a, b) =>
      playoffFinishRank(b.finish) - playoffFinishRank(a.finish) ||
      b.wins - a.wins ||
      b.rating - a.rating ||
      a.createdAt.localeCompare(b.createdAt),
  );
}
