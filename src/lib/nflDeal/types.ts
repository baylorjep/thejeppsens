export interface Quarterback {
  id: string;
  name: string;
  team?: string;
  ovr: number;
  rank: number;
  espnId: string | null;
}

export type CaseStatus = 'available' | 'selected' | 'opened';

export interface CaseState {
  number: number;
  quarterback: Quarterback;
  status: CaseStatus;
}

export type GamePhase =
  | 'selecting-case'
  | 'opening-cases'
  | 'bank-offer'
  | 'final-choice'
  | 'finished';

export interface BankOffer {
  quarterback: Quarterback;
  round: number;
  expectedValueOvr: number;
  offerOvr: number;
  /** Every QB that was still hidden (your case + all unopened cases) at the
   * moment this offer was made -- your case was one of these. */
  remainingPool: Quarterback[];
}

export interface GameState {
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
}
