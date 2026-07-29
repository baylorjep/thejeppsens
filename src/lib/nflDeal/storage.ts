import { POSITIONS } from './positions';
import { ROUND_SCHEDULE } from './gameLogic';
import type { CaseStatus, DynastyLeaderboardEntry, DynastyRunState, GamePhase, GameState, Player, PositionId } from './types';

const LEGACY_STORAGE_KEY = 'deal-or-no-deal:v1';
const STORAGE_KEY = 'deal-or-no-deal:v2';
const DYNASTY_LEADERBOARD_KEY = 'deal-or-no-deal:dynasty-leaderboard:v1';

const VALID_PHASES: GamePhase[] = ['selecting-case', 'opening-cases', 'bank-offer', 'final-choice', 'finished'];
const VALID_STATUSES: CaseStatus[] = ['available', 'selected', 'opened'];
const VALID_POSITIONS: PositionId[] = ['QB', 'RB', 'WR', 'TE', 'DST'];

export interface SavedDealRun {
  version: 2;
  game: GameState;
  dynasty: DynastyRunState | null;
  dynastyDone: boolean;
}

// Defensive: only trust a saved state if it could actually have come from a
// real game (right shape, no duplicate/missing players, phase-consistent).
function isValidGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false;
  const s = value as GameState;

  if (!VALID_POSITIONS.includes(s.position)) return false;
  if (typeof s.seed !== 'number' || typeof s.rngCursor !== 'number') return false;
  if (!VALID_PHASES.includes(s.phase)) return false;
  if (!Array.isArray(s.cases) || s.cases.length !== 32) return false;

  const validIds = new Set(POSITIONS[s.position].board.map((p) => p.id));
  const seenNumbers = new Set<number>();
  const seenIds = new Set<string>();
  for (const c of s.cases) {
    if (typeof c?.number !== 'number' || c.number < 1 || c.number > 32) return false;
    if (seenNumbers.has(c.number)) return false;
    seenNumbers.add(c.number);

    if (!VALID_STATUSES.includes(c.status)) return false;
    if (!c.quarterback || !validIds.has(c.quarterback.id)) return false;
    if (seenIds.has(c.quarterback.id)) return false;
    seenIds.add(c.quarterback.id);
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

function isValidDynastyPlayer(position: PositionId, value: unknown): value is Player {
  if (!value || typeof value !== 'object') return false;
  const player = value as Player;
  return POSITIONS[position].board.some((p) => p.id === player.id);
}

function isValidDynastyRun(value: unknown): value is DynastyRunState {
  if (!value || typeof value !== 'object') return false;
  const dynasty = value as DynastyRunState;
  if (!Number.isInteger(dynasty.index) || dynasty.index < 0 || dynasty.index >= VALID_POSITIONS.length) return false;
  if (typeof dynasty.teamName !== 'string' || dynasty.teamName.length > 40) return false;
  if (!dynasty.results || typeof dynasty.results !== 'object') return false;

  for (const position of VALID_POSITIONS) {
    const player = dynasty.results[position];
    if (player && !isValidDynastyPlayer(position, player)) return false;
  }
  return true;
}

function isValidDynastyLeaderboardEntry(value: unknown): value is DynastyLeaderboardEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as DynastyLeaderboardEntry;
  if (typeof entry.id !== 'string' || entry.id.length === 0) return false;
  if (typeof entry.teamName !== 'string' || entry.teamName.length === 0 || entry.teamName.length > 40) return false;
  if (typeof entry.rating !== 'number' || entry.rating < 0 || entry.rating > 100) return false;
  if (!Number.isInteger(entry.wins) || entry.wins < 0 || entry.wins > 17) return false;
  if (!Number.isInteger(entry.losses) || entry.losses < 0 || entry.losses > 17 || entry.wins + entry.losses !== 17) return false;
  if (typeof entry.finish !== 'string' || entry.finish.length === 0) return false;
  if (typeof entry.createdAt !== 'string' || Number.isNaN(Date.parse(entry.createdAt))) return false;
  if (!entry.players || typeof entry.players !== 'object') return false;

  for (const position of VALID_POSITIONS) {
    const player = entry.players[position];
    if (!player || typeof player !== 'object') return false;
    if (typeof player.id !== 'string' || typeof player.name !== 'string') return false;
    if (typeof player.ovr !== 'number' || player.ovr < 0 || player.ovr > 100) return false;
  }

  return true;
}

function isValidSavedDealRun(value: unknown): value is SavedDealRun {
  if (!value || typeof value !== 'object') return false;
  const saved = value as SavedDealRun;
  if (saved.version !== 2 || !isValidGameState(saved.game)) return false;
  if (typeof saved.dynastyDone !== 'boolean') return false;
  if (saved.dynasty !== null && !isValidDynastyRun(saved.dynasty)) return false;
  if (saved.dynastyDone && saved.dynasty) {
    for (const position of VALID_POSITIONS) {
      if (!saved.dynasty.results[position]) return false;
    }
  }
  return true;
}

export function saveDealRun(run: Omit<SavedDealRun, 'version'>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, ...run }));
  } catch {
    // Storage can fail (private browsing, quota) — losing persistence isn't fatal.
  }
}

export function loadDealRun(): SavedDealRun | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isValidSavedDealRun(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function clearSavedGame() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // no-op
  }
}

export function loadDynastyLeaderboard(): DynastyLeaderboardEntry[] {
  try {
    const raw = window.localStorage.getItem(DYNASTY_LEADERBOARD_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidDynastyLeaderboardEntry).slice(0, 5);
  } catch {
    return [];
  }
}

export function saveDynastyLeaderboardEntry(entry: DynastyLeaderboardEntry): DynastyLeaderboardEntry[] {
  try {
    const existing = loadDynastyLeaderboard();
    const next = [entry, ...existing.filter((item) => item.id !== entry.id)]
      .sort((a, b) => b.rating - a.rating || b.wins - a.wins || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 5);
    window.localStorage.setItem(DYNASTY_LEADERBOARD_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
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
const SESSION_ACTIVE_KEY = 'deal-or-no-deal:session-active';

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
