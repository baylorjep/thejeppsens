import type { Player } from './types';

export const RATING_SOURCE_OFFICIAL = 'Official Madden 27 reveal';
export const RATING_SOURCE_FALLBACK = 'MaddenRatings fallback';
export const RATING_SOURCE_PROXY = 'Defensive proxy rating';

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildBoard(raw: Array<[name: string, ovr: number, espnId: string, ratingSource?: string]>): Player[] {
  return raw.map(([name, ovr, espnId, ratingSource], index) => ({
    id: slugify(name),
    name,
    ovr,
    rank: index + 1,
    espnId,
    ratingSource: ratingSource ?? RATING_SOURCE_FALLBACK,
  }));
}

// Defense/Special Teams entries represent a whole team, not a player --
// espnAbbrev is the team's ESPN short code (e.g. 'sf'), used for a logo
// instead of a headshot (see espnHeadshotUrl below).
export function buildTeamBoard(raw: Array<[name: string, ovr: number, espnAbbrev: string, ratingSource?: string]>): Player[] {
  return raw.map(([name, ovr, espnAbbrev, ratingSource], index) => ({
    id: slugify(name),
    name,
    ovr,
    rank: index + 1,
    espnId: espnAbbrev,
    ratingSource: ratingSource ?? RATING_SOURCE_PROXY,
    isTeam: true,
  }));
}

export function espnHeadshotUrl(player: Pick<Player, 'espnId' | 'isTeam'>): string | null {
  if (!player.espnId) return null;
  return player.isTeam
    ? `https://a.espncdn.com/i/teamlogos/nfl/500/${player.espnId}.png`
    : `https://a.espncdn.com/i/headshots/nfl/players/full/${player.espnId}.png`;
}
