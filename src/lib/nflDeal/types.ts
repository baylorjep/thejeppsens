export type PositionId = 'QB' | 'RB' | 'WR' | 'TE' | 'DST';

export interface Player {
  id: string;
  name: string;
  team?: string;
  ovr: number;
  rank: number;
  espnId: string | null;
  ratingSource?: string;
  /** True for Defense/Special Teams "players" -- these represent a whole
   * team, not an individual, so espnId holds an ESPN team abbreviation
   * (e.g. 'sf') instead of an athlete ID, and espnHeadshotUrl resolves it to
   * a team logo instead of a headshot. */
  isTeam?: boolean;
}

export type CaseStatus = 'available' | 'selected' | 'opened';

export interface CaseState {
  number: number;
  quarterback: Player;
  status: CaseStatus;
}

export type GamePhase =
  | 'selecting-case'
  | 'opening-cases'
  | 'bank-offer'
  | 'final-choice'
  | 'finished';

export interface BankOffer {
  quarterback: Player;
  round: number;
  expectedValueOvr: number;
  offerOvr: number;
  /** Every player that was still hidden (your case + all unopened cases) at
   * the moment this offer was made -- your case was one of these. */
  remainingPool: Player[];
}

export interface GameState {
  position: PositionId;
  seed: number;
  rngCursor: number;
  cases: CaseState[];
  playerCaseNumber: number | null;
  phase: GamePhase;
  roundIndex: number;
  casesToOpenThisRound: number;
  casesOpenedThisRound: number[];
  currentOffer: BankOffer | null;
  offerHistory: BankOffer[];
  dealAccepted: BankOffer | null;
  finalCaseNumber?: number | null;
}

export interface DynastyRunState {
  index: number;
  teamName: string;
  results: Partial<Record<PositionId, Player>>;
}

export interface DynastyLeaderboardEntry {
  id: string;
  teamName: string;
  rating: number;
  wins: number;
  losses: number;
  finish: string;
  players: Record<PositionId, Pick<Player, 'id' | 'name' | 'ovr' | 'espnId' | 'isTeam'>>;
  createdAt: string;
}
