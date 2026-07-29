import type { Player } from './types';

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildBoard(raw: Array<[name: string, ovr: number, espnId: string]>): Player[] {
  return raw.map(([name, ovr, espnId], index) => ({
    id: slugify(name),
    name,
    ovr,
    rank: index + 1,
    espnId,
  }));
}

export function espnHeadshotUrl(player: Pick<Player, 'espnId'>): string | null {
  return player.espnId ? `https://a.espncdn.com/i/headshots/nfl/players/full/${player.espnId}.png` : null;
}
