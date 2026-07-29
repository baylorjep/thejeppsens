import { QB_BOARD } from './qbData';
import type { BankOffer, CaseState, GamePhase, GameState, Quarterback } from './types';

// Cases opened per round, in order. Once only 1 non-player case remains
// unopened (i.e. player's case + 1 other), the next offer is the final one.
export const ROUND_SCHEDULE = [7, 6, 5, 4, 3, 2, 1, 1, 1] as const;
const ROUND_GENEROSITY = [0.76, 0.8, 0.84, 0.88, 0.91, 0.94, 0.97, 0.97, 0.97] as const;

const ELITE_THRESHOLD = 90;
const LOW_THRESHOLD = 80;

const MESSAGE_POOLS = {
  final: [
    'This is it. One case, one decision.',
    "No more cases after this. Just you and the number.",
  ],
  justLostElite: [
    "You lost a monster. I'm not paying superstar prices now.",
    "That one hurt your board. My offer reflects it.",
  ],
  clearedBottom: [
    "You cleaned up the bottom. Annoying for me, good for you.",
    "Nice work clearing the scrubs. The board's looking dangerous now.",
  ],
  eliteRemaining: [
    "The top of your board is still dangerous, so I can't go cheap.",
    "There's still a superstar in play. I have to respect that.",
  ],
  generic: [
    "Here's my number. Think it over.",
    'The board is what it is. This is my offer.',
    "I've run the numbers. This is where I land.",
  ],
};

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
function pickBankMessage(
  remainingHidden: Quarterback[],
  justOpened: Quarterback[],
  isFinal: boolean,
  roll: number,
): string {
  if (isFinal) return pickFrom(MESSAGE_POOLS.final, roll);
  if (justOpened.some((q) => q.ovr >= ELITE_THRESHOLD)) return pickFrom(MESSAGE_POOLS.justLostElite, roll);
  if (justOpened.length > 0 && justOpened.every((q) => q.ovr < LOW_THRESHOLD)) {
    return pickFrom(MESSAGE_POOLS.clearedBottom, roll);
  }
  if (remainingHidden.some((q) => q.ovr >= ELITE_THRESHOLD)) return pickFrom(MESSAGE_POOLS.eliteRemaining, roll);
  return pickFrom(MESSAGE_POOLS.generic, roll);
}

function computeBankOffer(state: GameState, isFinal: boolean): { offer: BankOffer; cursor: number } {
  const playerCase = state.cases.find((c) => c.number === state.playerCaseNumber);
  const unopened = state.cases.filter((c) => c.status === 'available');
  const remainingHidden = playerCase ? [playerCase.quarterback, ...unopened.map((c) => c.quarterback)] : unopened.map((c) => c.quarterback);

  const expectedValueOvr = average(remainingHidden.map((q) => q.ovr));
  const spread = Math.max(...remainingHidden.map((q) => q.ovr)) - Math.min(...remainingHidden.map((q) => q.ovr));
  const generosity = ROUND_GENEROSITY[Math.min(state.roundIndex, ROUND_GENEROSITY.length - 1)];
  const targetOvr = expectedValueOvr * generosity - spread * 0.05;

  const { values, cursor } = drawRandom(state, 2);
  const [tieBreakRoll, messageRoll] = values;

  const recentOfferIds = new Set(state.offerHistory.slice(-2).map((o) => o.quarterback.id));
  const sorted = [...QB_BOARD].sort((a, b) => Math.abs(a.ovr - targetOvr) - Math.abs(b.ovr - targetOvr));
  const freshCandidates = sorted.filter((qb) => !recentOfferIds.has(qb.id));
  // If every close option has already been offered recently, the board
  // "warrants" a repeat rather than picking something oddly far from target.
  const pool = freshCandidates.length > 0 ? freshCandidates : sorted;
  const bestDistance = Math.abs(pool[0].ovr - targetOvr);
  const tiedCandidates = pool.filter((qb) => Math.abs(qb.ovr - targetOvr) - bestDistance <= 1);
  const chosen = pickFrom(tiedCandidates, tieBreakRoll);

  const justOpened = state.casesOpenedThisRound
    .map((num) => state.cases.find((c) => c.number === num)?.quarterback)
    .filter((q): q is Quarterback => Boolean(q));

  const message = pickBankMessage(remainingHidden, justOpened, isFinal, messageRoll);

  return {
    offer: {
      quarterback: chosen,
      message,
      round: state.roundIndex + 1,
      expectedValueOvr: Math.round(expectedValueOvr * 10) / 10,
      offerOvr: chosen.ovr,
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
  const { offer, cursor } = computeBankOffer(roundCompleteState, isFinal);

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
    return { ...state, phase: 'finished', currentOffer: null };
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
