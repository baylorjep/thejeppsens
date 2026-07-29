import { QB_BOARD } from './qbData';
import type { BankOffer, CaseState, GamePhase, GameState } from './types';

// Cases opened per round, in order. Once only 1 non-player case remains
// unopened (i.e. player's case + 1 other), the next offer is the final one.
export const ROUND_SCHEDULE = [7, 6, 5, 4, 3, 2, 1, 1, 1] as const;

const ALL_OVRS = QB_BOARD.map((qb) => qb.ovr);
const INITIAL_AVG_OVR = ALL_OVRS.reduce((sum, n) => sum + n, 0) / ALL_OVRS.length;
const INITIAL_SPREAD = Math.max(...ALL_OVRS) - Math.min(...ALL_OVRS);

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// --- deterministic RNG -----------------------------------------------------
// A given seed + draw count always reproduces the same sequence, so a game
// can be replayed/debugged from `seed` + the action log alone.
function nextFrom(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawRandom(state: Pick<GameState, 'seed' | 'rngCursor'>, count: number) {
  const rng = nextFrom(state.seed);
  for (let i = 0; i < state.rngCursor; i++) rng();
  const values: number[] = [];
  for (let i = 0; i < count; i++) values.push(rng());
  return { values, cursor: state.rngCursor + count };
}

function pickFrom<T>(pool: readonly T[], roll: number): T {
  return pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))];
}

function average(nums: number[]): number {
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

// --- setup ------------------------------------------------------------------
function shuffledCases(seed: number): { cases: CaseState[]; cursor: number } {
  const board = [...QB_BOARD];
  const { values, cursor } = drawRandom({ seed, rngCursor: 0 }, board.length - 1);

  for (let i = board.length - 1; i > 0; i--) {
    const j = Math.floor(values[board.length - 1 - i] * (i + 1));
    [board[i], board[j]] = [board[j], board[i]];
  }

  const cases: CaseState[] = board.map((quarterback, index) => ({
    number: index + 1,
    quarterback,
    status: 'available',
  }));

  return { cases, cursor };
}

export function createInitialGameState(seed: number = Date.now()): GameState {
  const { cases, cursor } = shuffledCases(seed);
  return {
    seed,
    rngCursor: cursor,
    cases,
    playerCaseNumber: null,
    phase: 'selecting-case',
    roundIndex: 0,
    casesToOpenThisRound: 0,
    casesOpenedThisRound: [],
    currentOffer: null,
    offerHistory: [],
    dealAccepted: null,
  };
}

// --- bank offer ---------------------------------------------------------
// The offer is a fraction of the remaining hidden pool's expected value.
// That fraction moves on three signals:
//  - round progress: later offers approach EV, early ones stay well below it
//  - spread: more remaining variance = bigger discount (protects against a
//    lucky huge case still being out there)
//  - trend: if what's left is stronger than a truly average board, the bank
//    lowballs harder (real risk of paying out big); if it's weaker than
//    average, the bank can afford to be more generous
function computeBankOffer(state: GameState): { offer: BankOffer; cursor: number } {
  const playerCase = state.cases.find((c) => c.number === state.playerCaseNumber);
  const unopened = state.cases.filter((c) => c.status === 'available');
  const remainingHidden = playerCase ? [playerCase.quarterback, ...unopened.map((c) => c.quarterback)] : unopened.map((c) => c.quarterback);

  const expectedValueOvr = average(remainingHidden.map((q) => q.ovr));
  const spread = Math.max(...remainingHidden.map((q) => q.ovr)) - Math.min(...remainingHidden.map((q) => q.ovr));
  const normalizedSpread = INITIAL_SPREAD > 0 ? spread / INITIAL_SPREAD : 0;
  const trend = clamp((expectedValueOvr - INITIAL_AVG_OVR) / INITIAL_AVG_OVR, -0.15, 0.15);

  const hiddenOvrs = remainingHidden.map((q) => q.ovr);
  const hiddenMin = Math.min(...hiddenOvrs);
  const hiddenMax = Math.max(...hiddenOvrs);

  const roundProgress = state.roundIndex / (ROUND_SCHEDULE.length - 1);
  const baseGenerosity = 0.72 + 0.25 * roundProgress;
  const offerFraction = clamp(baseGenerosity - normalizedSpread * 0.12 - trend * 0.4, 0.45, 0.99);
  // Interpolate between the worst remaining outcome and the true expected
  // value, rather than taking a flat fraction of expected value directly --
  // a flat fraction routinely lands far below the achievable range (e.g.
  // ~50 OVR when the pool is 73-99), which made the "closest valid
  // candidate" fallback do all the work and drowned out the round/spread/
  // trend signals above. Interpolating keeps every signal meaningfully in
  // play across the whole game.
  const targetOvr = hiddenMin + offerFraction * (expectedValueOvr - hiddenMin);

  const { values, cursor } = drawRandom(state, 1);
  const [tieBreakRoll] = values;

  const recentOfferIds = new Set(state.offerHistory.slice(-2).map((o) => o.quarterback.id));
  const sorted = [...QB_BOARD].sort((a, b) => Math.abs(a.ovr - targetOvr) - Math.abs(b.ovr - targetOvr));

  // An offer at or below the worst remaining outcome is a guaranteed No
  // Deal (you can never do worse by playing on); an offer at or above the
  // best remaining outcome is a guaranteed Deal (you can never do better).
  // Neither is a real decision, so keep the offer strictly between them --
  // unless every remaining case holds the exact same value, in which case
  // that value is the only honest number to offer.
  const withinRange =
    hiddenMin === hiddenMax
      ? sorted.filter((qb) => qb.ovr === hiddenMin)
      : sorted.filter((qb) => qb.ovr > hiddenMin && qb.ovr < hiddenMax);
  const candidates = withinRange.length > 0 ? withinRange : sorted;

  const freshCandidates = candidates.filter((qb) => !recentOfferIds.has(qb.id));
  // If every close option has already been offered recently, the board
  // "warrants" a repeat rather than picking something oddly far from target.
  const pool = freshCandidates.length > 0 ? freshCandidates : candidates;
  const bestDistance = Math.abs(pool[0].ovr - targetOvr);
  const tiedCandidates = pool.filter((qb) => Math.abs(qb.ovr - targetOvr) - bestDistance <= 1);
  const chosen = pickFrom(tiedCandidates, tieBreakRoll);

  return {
    offer: {
      quarterback: chosen,
      round: state.roundIndex + 1,
      expectedValueOvr: Math.round(expectedValueOvr * 10) / 10,
      offerOvr: chosen.ovr,
      remainingPool: remainingHidden,
    },
    cursor,
  };
}

// --- state transitions -------------------------------------------------
export function selectPlayerCase(state: GameState, caseNumber: number): GameState {
  if (state.phase !== 'selecting-case') return state;
  const target = state.cases.find((c) => c.number === caseNumber);
  if (!target) return state;

  return {
    ...state,
    cases: state.cases.map((c) => (c.number === caseNumber ? { ...c, status: 'selected' as const } : c)),
    playerCaseNumber: caseNumber,
    phase: 'opening-cases',
    roundIndex: 0,
    casesToOpenThisRound: ROUND_SCHEDULE[0],
    casesOpenedThisRound: [],
  };
}

export function openCase(state: GameState, caseNumber: number): GameState {
  if (state.phase !== 'opening-cases') return state;
  const target = state.cases.find((c) => c.number === caseNumber);
  if (!target || target.status !== 'available') return state;

  const cases = state.cases.map((c) => (c.number === caseNumber ? { ...c, status: 'opened' as const } : c));
  const casesOpenedThisRound = [...state.casesOpenedThisRound, caseNumber];
  const remainingToOpen = state.casesToOpenThisRound - 1;

  if (remainingToOpen > 0) {
    return { ...state, cases, casesOpenedThisRound, casesToOpenThisRound: remainingToOpen };
  }

  const roundCompleteState: GameState = { ...state, cases, casesOpenedThisRound, casesToOpenThisRound: 0 };
  const unopenedNonPlayer = cases.filter((c) => c.status === 'available').length;
  const isFinal = unopenedNonPlayer === 1;
  const { offer, cursor } = computeBankOffer(roundCompleteState);

  const phase: GamePhase = isFinal ? 'final-choice' : 'bank-offer';

  return {
    ...roundCompleteState,
    rngCursor: cursor,
    currentOffer: offer,
    offerHistory: [...state.offerHistory, offer],
    phase,
  };
}

export function acceptOffer(state: GameState): GameState {
  if (!state.currentOffer) return state;
  if (state.phase !== 'bank-offer' && state.phase !== 'final-choice') return state;
  return { ...state, phase: 'finished', dealAccepted: state.currentOffer };
}

export function rejectOffer(state: GameState): GameState {
  if (state.phase === 'final-choice') {
    // Keep currentOffer (don't null it) -- the end screen needs it to show
    // what was turned down, even though the offer modal itself is done.
    return { ...state, phase: 'finished' };
  }
  if (state.phase !== 'bank-offer') return state;

  const nextRoundIndex = state.roundIndex + 1;
  return {
    ...state,
    phase: 'opening-cases',
    roundIndex: nextRoundIndex,
    casesToOpenThisRound: ROUND_SCHEDULE[nextRoundIndex] ?? 1,
    casesOpenedThisRound: [],
    currentOffer: null,
  };
}

// --- selectors -----------------------------------------------------------
export function getPlayerCase(state: GameState): CaseState | null {
  return state.cases.find((c) => c.number === state.playerCaseNumber) ?? null;
}

export function getEliminatedQbIds(state: GameState): Set<string> {
  return new Set(state.cases.filter((c) => c.status === 'opened').map((c) => c.quarterback.id));
}

export function getUnopenedNonPlayerCases(state: GameState): CaseState[] {
  return state.cases.filter((c) => c.status === 'available');
}

// --- reducer ---------------------------------------------------------------
export type GameAction =
  | { type: 'NEW_GAME'; seed?: number }
  | { type: 'SELECT_CASE'; caseNumber: number }
  | { type: 'OPEN_CASE'; caseNumber: number }
  | { type: 'ACCEPT_OFFER' }
  | { type: 'REJECT_OFFER' }
  | { type: 'LOAD_STATE'; state: GameState };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialGameState(action.seed);
    case 'SELECT_CASE':
      return selectPlayerCase(state, action.caseNumber);
    case 'OPEN_CASE':
      return openCase(state, action.caseNumber);
    case 'ACCEPT_OFFER':
      return acceptOffer(state);
    case 'REJECT_OFFER':
      return rejectOffer(state);
    case 'LOAD_STATE':
      return action.state;
    default:
      return state;
  }
}
