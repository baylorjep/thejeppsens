import { POSITIONS } from './positions';
import type { BankOffer, CaseState, GamePhase, GameState, Player, PositionId } from './types';

// Cases opened per round, in order. Once only 1 non-player case remains
// unopened (i.e. player's case + 1 other), the next offer is the final one.
export const ROUND_SCHEDULE = [7, 6, 5, 4, 3, 2, 1, 1, 1] as const;

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// Each position's board has its own OVR range/average -- cache per position
// instead of assuming QB's numbers apply everywhere.
const positionStatsCache = new Map<PositionId, { avgOvr: number; spread: number }>();
function getPositionStats(position: PositionId) {
  const cached = positionStatsCache.get(position);
  if (cached) return cached;
  const ovrs = POSITIONS[position].board.map((p) => p.ovr);
  const stats = { avgOvr: average(ovrs), spread: Math.max(...ovrs) - Math.min(...ovrs) };
  positionStatsCache.set(position, stats);
  return stats;
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
function shuffledCases(position: PositionId, seed: number): { cases: CaseState[]; cursor: number } {
  const board = [...POSITIONS[position].board];
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

function createGameSeed(): number {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return values[0];
  }
  return Math.floor((Date.now() + Math.random() * 0x100000000) % 0x100000000);
}

export function createInitialGameState(position: PositionId, seed: number = createGameSeed()): GameState {
  const { cases, cursor } = shuffledCases(position, seed);
  return {
    position,
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
    finalCaseNumber: null,
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
  const board = POSITIONS[state.position].board;
  const { avgOvr: initialAvgOvr, spread: initialSpread } = getPositionStats(state.position);

  const playerCase = state.cases.find((c) => c.number === state.playerCaseNumber);
  const unopened = state.cases.filter((c) => c.status === 'available');
  const remainingHidden = playerCase ? [playerCase.quarterback, ...unopened.map((c) => c.quarterback)] : unopened.map((c) => c.quarterback);

  const expectedValueOvr = average(remainingHidden.map((q) => q.ovr));
  const spread = Math.max(...remainingHidden.map((q) => q.ovr)) - Math.min(...remainingHidden.map((q) => q.ovr));
  const normalizedSpread = initialSpread > 0 ? spread / initialSpread : 0;
  const trend = clamp((expectedValueOvr - initialAvgOvr) / initialAvgOvr, -0.15, 0.15);

  const hiddenOvrs = remainingHidden.map((q) => q.ovr);
  const hiddenMin = Math.min(...hiddenOvrs);
  const hiddenMax = Math.max(...hiddenOvrs);

  const roundProgress = state.roundIndex / (ROUND_SCHEDULE.length - 1);
  // Banker's offer strategy: self-interested based on board state
  // - trend is PRIMARY (how well the banker is doing):
  //   * negative trend (player losing) → banker offers HIGH (confident they'll win anyway)
  //   * positive trend (player winning) → banker offers LOW (desperate to close the deal)
  // - round is SECONDARY (mild time pressure on banker)
  // - spread reduces confidence (uncertainty = lower offers)
  const baseGenerosity = 0.65 + trend * 1.5 + roundProgress * 0.08 - normalizedSpread * 0.08;
  const offerFraction = clamp(baseGenerosity, 0.45, 0.95);
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
  const sorted = [...board].sort((a, b) => Math.abs(a.ovr - targetOvr) - Math.abs(b.ovr - targetOvr));

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
  // If no player sits strictly between the remaining values (e.g. final two
  // are 74 and 75), do not fall below the worst remaining value -- that is a
  // guaranteed No Deal. Instead allow the floor itself but still stay below
  // the best remaining outcome, so the final offer remains a real choice.
  const floorFallback =
    hiddenMin === hiddenMax
      ? []
      : [...board]
          .filter((qb) => qb.ovr >= hiddenMin && qb.ovr < hiddenMax)
          .sort((a, b) => b.ovr - a.ovr || Math.abs(a.ovr - targetOvr) - Math.abs(b.ovr - targetOvr));
  const candidates = withinRange.length > 0 ? withinRange : floorFallback.length > 0 ? floorFallback : sorted;

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
  return { ...state, phase: 'finished', dealAccepted: state.currentOffer, finalCaseNumber: null };
}

export function rejectOffer(state: GameState): GameState {
  if (state.phase === 'final-choice') {
    // Keep currentOffer (don't null it) -- the end screen needs it to show
    // what was turned down, even though the offer modal itself is done.
    return { ...state, phase: 'finished', finalCaseNumber: state.playerCaseNumber };
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
    finalCaseNumber: null,
  };
}

export function chooseFinalCase(state: GameState, caseNumber: number): GameState {
  if (state.phase !== 'final-choice') return state;
  const validFinalCase = state.cases.some(
    (c) => c.number === caseNumber && (c.number === state.playerCaseNumber || c.status === 'available'),
  );
  if (!validFinalCase) return state;

  return {
    ...state,
    phase: 'finished',
    finalCaseNumber: caseNumber,
  };
}

// --- selectors -----------------------------------------------------------
export function getPlayerCase(state: GameState): CaseState | null {
  return state.cases.find((c) => c.number === state.playerCaseNumber) ?? null;
}

export function getFinalCase(state: GameState): CaseState | null {
  return state.cases.find((c) => c.number === (state.finalCaseNumber ?? state.playerCaseNumber)) ?? null;
}

export function getEliminatedQbIds(state: GameState): Set<string> {
  return new Set(state.cases.filter((c) => c.status === 'opened').map((c) => c.quarterback.id));
}

export function getUnopenedNonPlayerCases(state: GameState): CaseState[] {
  return state.cases.filter((c) => c.status === 'available');
}

export type OfferTier = 'big' | 'medium' | 'small';

// Where the offer sits within what's realistically still possible right now
// (the remaining pool's own range), not the position's full original board
// -- an 85 OVR offer feels huge once only 70s-80s are left on the table, and
// unremarkable if 90+ is still in play. Used to pick audio cues by "how big
// a deal is this."
export function classifyOfferTier(offer: BankOffer): OfferTier {
  const ovrs = offer.remainingPool.map((p) => p.ovr);
  const min = Math.min(...ovrs);
  const max = Math.max(...ovrs);
  if (max === min) return 'medium';
  const frac = (offer.offerOvr - min) / (max - min);
  if (frac >= 2 / 3) return 'big';
  if (frac >= 1 / 3) return 'medium';
  return 'small';
}

// --- reducer ---------------------------------------------------------------
export type GameAction =
  | { type: 'NEW_GAME'; position: PositionId; seed?: number }
  | { type: 'SELECT_CASE'; caseNumber: number }
  | { type: 'OPEN_CASE'; caseNumber: number }
  | { type: 'ACCEPT_OFFER' }
  | { type: 'REJECT_OFFER' }
  | { type: 'CHOOSE_FINAL_CASE'; caseNumber: number }
  | { type: 'LOAD_STATE'; state: GameState };

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialGameState(action.position, action.seed);
    case 'SELECT_CASE':
      return selectPlayerCase(state, action.caseNumber);
    case 'OPEN_CASE':
      return openCase(state, action.caseNumber);
    case 'ACCEPT_OFFER':
      return acceptOffer(state);
    case 'REJECT_OFFER':
      return rejectOffer(state);
    case 'CHOOSE_FINAL_CASE':
      return chooseFinalCase(state, action.caseNumber);
    case 'LOAD_STATE':
      return action.state;
    default:
      return state;
  }
}
