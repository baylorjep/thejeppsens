import { QB_BOARD } from './qbData';
import { ROUND_SCHEDULE } from './gameLogic';
import type { CaseStatus, GamePhase, GameState } from './types';

const STORAGE_KEY = 'nfl-deal-or-no-deal:v1';

const VALID_PHASES: GamePhase[] = ['selecting-case', 'opening-cases', 'bank-offer', 'final-choice', 'finished'];
const VALID_STATUSES: CaseStatus[] = ['available', 'selected', 'opened'];
const QB_IDS = new Set(QB_BOARD.map((qb) => qb.id));

// Defensive: only trust a saved state if it could actually have come from a
// real game (right shape, no duplicate/missing QBs, phase-consistent).
function isValidGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const s = value as GameState;

  if (typeof s.seed !== 'number' || typeof s.rngCursor !== 'number') return false;
  if (!VALID_PHASES.includes(s.phase)) return false;
  if (!Array.isArray(s.cases) || s.cases.length !== 32) return false;

  const seenNumbers = new Set<number>();
  const seenQbIds = new Set<string>();
  for (const c of s.cases) {
    if (typeof c?.number !== 'number' || c.number < 1 || c.number > 32) return false;
    if (seenNumbers.has(c.number)) return false;
    seenNumbers.add(c.number);

    if (!VALID_STATUSES.includes(c.status)) return false;
    if (!c.quarterback || !QB_IDS.has(c.quarterback.id)) return false;
    if (seenQbIds.has(c.quarterback.id)) return false;
    seenQbIds.add(c.quarterback.id);
  }

  const selectedCount = s.cases.filter((c) => c.status === 'selected').length;
  const openedCount = s.cases.filter((c) => c.status === 'opened').length;

  if (s.phase === 'selecting-case') {
    if (s.playerCaseNumber !== null || selectedCount !== 0 || openedCount !== 0) return false;
  } else {
    if (typeof s.playerCaseNumber !== 'number') return false;
    const playerCase = s.cases.find((c) => c.number === s.playerCaseNumber);
    if (!playerCase || playerCase.status === 'available') return false;
    if (selectedCount + openedCount === 0) return false;
  }

  if (s.roundIndex < 0 || s.roundIndex >= ROUND_SCHEDULE.length) return false;
  if (s.casesToOpenThisRound < 0) return false;
  if (!Array.isArray(s.casesOpenedThisRound) || !Array.isArray(s.offerHistory)) return false;

  return true;
}

export function saveGame(state: GameState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can fail (private browsing, quota) — losing persistence isn't fatal.
  }
}

export function loadGame(): GameState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidGameState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearSavedGame() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}

// Only an actual browser refresh should resume an in-progress game -- a
// fresh visit (new tab, clicking away and back, returning later) should
// feel like launching the game again, not walking back into a stale
// session.
//
// This can't be answered with the Performance Navigation Timing API: Next's
// client-side routing means leaving this route and coming back via a <Link>
// never fires a new "navigation" entry, so that API only ever reflects the
// tab's last *hard* reload -- once that's ever happened, every later SPA
// visit would misread as "reload" too.
//
// Instead: a clean React unmount (SPA navigation away) only runs on an
// actual client-side unmount, never on a hard reload (the JS context is
// destroyed before cleanup can run). So a sessionStorage flag that's
// cleared on unmount but survives a reload tells the two apart correctly.
const SESSION_ACTIVE_KEY = 'nfl-deal-or-no-deal:session-active';

export function claimSessionAndCheckIfResuming(): boolean {
  try {
    const wasAlreadyActive = window.sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true';
    window.sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true');
    return wasAlreadyActive;
  } catch {
    return false;
  }
}

export function releaseSession() {
  try {
    window.sessionStorage.removeItem(SESSION_ACTIVE_KEY);
  } catch {
    // no-op
  }
}
