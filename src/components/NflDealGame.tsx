'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  classifyOfferTier,
  createInitialGameState,
  gameReducer,
  getEliminatedQbIds,
  getPlayerCase,
} from '@/lib/nflDeal/gameLogic';
import { POSITIONS, DYNASTY_POSITIONS } from '@/lib/nflDeal/positions';
import { claimSessionAndCheckIfResuming, clearSavedGame, loadDealRun, releaseSession, saveDealRun, type SavedDealRun } from '@/lib/nflDeal/storage';
import NflDealCaseGrid from './NflDealCaseGrid';
import NflDealCaseIntroSequence, { CASE_INTRO_TOTAL_MS } from './NflDealCaseIntroSequence';
import NflDealQbBoard from './NflDealQbBoard';
import NflDealOfferModal from './NflDealOfferModal';
import NflDealRoundPanel from './NflDealRoundPanel';
import NflDealEndScreen from './NflDealEndScreen';
import NflDealDynastySummary from './NflDealDynastySummary';
import NflDealYourCase from './NflDealYourCase';
import NflDealAudioController, { type NflDealAudioHandle } from './NflDealAudioController';
import NflDealCaseRevealPopup from './NflDealCaseRevealPopup';
import NflDealRulesIntro from './NflDealRulesIntro';
import NflDealNoDealTransition from './NflDealNoDealTransition';
import type { DynastyRunState, Player, PositionId } from '@/lib/nflDeal/types';

// How long the sound plays before the result actually shows -- timed to
// land near the end of each ~6s elimination clip. Best-effort estimate;
// nudge per-outcome if it drifts out of sync with the clips.
const REVEAL_DELAY_MS_BY_OUTCOME: Record<'good' | 'bad', number> = { good: 4500, bad: 5000 };
const REVEAL_HOLD_MS = 1500;
const CASE_SELECTED_SRC = '/sounds/nfl-deal/case-selected.mp3';
const DEFAULT_DYNASTY_TEAM_NAME = "The Baconator's";

type Mode = PositionId | 'DYNASTY';

const MODE_OPTIONS: { id: Mode; label: string }[] = [
  { id: 'QB', label: 'Quarterback' },
  { id: 'RB', label: 'Running Back' },
  { id: 'WR', label: 'Wide Receiver' },
  { id: 'TE', label: 'Tight End' },
  { id: 'DST', label: 'Defense' },
  { id: 'DYNASTY', label: 'Dynasty' },
];

function modeSubtitle(mode: Mode): string {
  if (mode === 'DYNASTY') return 'QB, RB, WR, TE, then D/ST. Build a dynasty, one case at a time.';
  return `32 ${POSITIONS[mode].pluralLabel}. One sealed case. The Bank is watching.`;
}

export default function NflDealGame() {
  // Set once, synchronously, by the useReducer lazy initializer below (which
  // only ever runs on mount) -- lets handleStartGame tell a genuine resume
  // apart from a fresh game without re-deriving it from storage a second time.
  const resumedRef = useRef(false);
  const resumedRunRef = useRef<SavedDealRun | null>(null);
  const [state, dispatch] = useReducer(gameReducer, undefined, () => {
    if (claimSessionAndCheckIfResuming()) {
      const saved = loadDealRun();
      if (saved) {
        resumedRef.current = true;
        resumedRunRef.current = saved;
        return saved.game;
      }
    } else {
      clearSavedGame();
    }
    return createInitialGameState('QB');
  });
  const [selectedMode, setSelectedMode] = useState<Mode>(resumedRunRef.current?.dynasty ? 'DYNASTY' : state.position);
  // Only set while playing a Dynasty run: tracks which stage we're on and
  // the winning player banked from each finished stage so far.
  const [dynasty, setDynasty] = useState<DynastyRunState | null>(resumedRunRef.current?.dynasty ?? null);
  const [dynastyDone, setDynastyDone] = useState(resumedRunRef.current?.dynastyDone ?? false);
  const [dynastyTeamName, setDynastyTeamName] = useState(resumedRunRef.current?.dynasty?.teamName ?? DEFAULT_DYNASTY_TEAM_NAME);
  const [ceremonyCaseNumber, setCeremonyCaseNumber] = useState<number | null>(null);
  const [pendingReveal, setPendingReveal] = useState<{ number: number; quarterback: Player | null } | null>(null);
  const [eliminationEvent, setEliminationEvent] = useState<{ key: number; outcome: 'good' | 'bad' } | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [introVisualStage, setIntroVisualStage] = useState<'rules' | 'board'>('rules');
  const [offerModalReady, setOfferModalReady] = useState(false);
  const [offerDecisionReady, setOfferDecisionReady] = useState(false);
  const [noDealTransitioning, setNoDealTransitioning] = useState(false);
  // The case intro sequence (reveal/seal/shuffle/settle) is still playing
  // for a fresh board -- don't let a click register on the real grid until
  // it's done (or skipped).
  const [boardSettled, setBoardSettled] = useState(false);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offerDecisionFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardSettledTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offerPanelRef = useRef<HTMLDivElement>(null);
  const eliminationCounterRef = useRef(0);
  const prevPhaseRef = useRef(state.phase);
  const audioRef = useRef<NflDealAudioHandle>(null);

  // Re-arms every time a fresh case-selection board is actually shown. The
  // first stage can spend a while in the rules intro, so don't let the board
  // intro's timer burn down while that separate screen is mounted.
  useEffect(() => {
    if (state.phase !== 'selecting-case') return;
    if (introVisualStage !== 'board') {
      setBoardSettled(false);
      return;
    }
    setBoardSettled(false);
    if (boardSettledTimeoutRef.current) clearTimeout(boardSettledTimeoutRef.current);
    boardSettledTimeoutRef.current = setTimeout(() => setBoardSettled(true), CASE_INTRO_TOTAL_MS);
    return () => {
      if (boardSettledTimeoutRef.current) clearTimeout(boardSettledTimeoutRef.current);
    };
  }, [state.seed, state.phase, introVisualStage]);

  // Lets the case intro sequence's own click-to-skip end the wait early too.
  function skipBoardIntro() {
    if (boardSettledTimeoutRef.current) clearTimeout(boardSettledTimeoutRef.current);
    setBoardSettled(true);
  }

  // As soon as the last case reveal closes, show the banker-call panel and
  // let the audio controller unlock the real decision when the "deal or no
  // deal" prompt starts. A fallback keeps muted/audio-failed games playable.
  useEffect(() => {
    const isOfferPhase = state.phase === 'bank-offer' || state.phase === 'final-choice';
    if (offerDecisionFallbackTimeoutRef.current) clearTimeout(offerDecisionFallbackTimeoutRef.current);
    if (!isOfferPhase) {
      setOfferModalReady(false);
      setOfferDecisionReady(false);
      setNoDealTransitioning(false);
      return;
    }
    if (pendingReveal) return; // still showing/holding the case reveal
    setOfferModalReady(true);
    setOfferDecisionReady(false);
    offerDecisionFallbackTimeoutRef.current = setTimeout(() => setOfferDecisionReady(true), 8000);
    return () => {
      if (offerDecisionFallbackTimeoutRef.current) clearTimeout(offerDecisionFallbackTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.phase,
    state.currentOffer?.round,
    state.currentOffer?.quarterback.id,
    state.currentOffer?.offerOvr,
    pendingReveal,
  ]);

  function handleStartGame() {
    // The mode selector defaults to whatever position a resumed game was
    // already on -- if the player leaves that selection alone, Start Game
    // should continue that game rather than silently discarding it. Picking
    // a different mode (or Dynasty, which never resumes) starts fresh.
    const resuming =
      resumedRef.current &&
      ((selectedMode === 'DYNASTY' && dynasty !== null) || (selectedMode !== 'DYNASTY' && dynasty === null && selectedMode === state.position));

    if (!resuming) {
      if (selectedMode === 'DYNASTY') {
        const teamName = dynastyTeamName.trim() || DEFAULT_DYNASTY_TEAM_NAME;
        setDynasty({ index: 0, teamName, results: {} });
        setDynastyTeamName(teamName);
        setDynastyDone(false);
        dispatch({ type: 'NEW_GAME', position: DYNASTY_POSITIONS[0] });
      } else {
        setDynasty(null);
        setDynastyDone(false);
        dispatch({ type: 'NEW_GAME', position: selectedMode });
      }
    }
    setHasStarted(true);
    setIntroVisualStage(resuming && state.phase !== 'selecting-case' ? 'board' : 'rules');
    // Runs inside this click handler, so it's a direct user gesture and
    // won't be blocked by the browser's autoplay policy.
    audioRef.current?.unlockAndPlay();
  }

  useEffect(() => {
    // No need to keep a finished single-position game around -- next load
    // should start fresh. Dynasty needs the finished stage state until the
    // player banks it and advances.
    if (!dynasty && state.phase === 'finished') clearSavedGame();
    else saveDealRun({ game: state, dynasty, dynastyDone });
  }, [state, dynasty, dynastyDone]);

  // A clean unmount means the player actually navigated away (not a
  // reload) -- release the session flag so coming back starts fresh.
  useEffect(() => releaseSession, []);

  useEffect(() => {
    const justPickedCase = prevPhaseRef.current === 'selecting-case' && state.phase === 'opening-cases';
    prevPhaseRef.current = state.phase;
    if (!justPickedCase || state.playerCaseNumber === null) return;

    setCeremonyCaseNumber(state.playerCaseNumber);
    // A dedicated upbeat chime for the ceremony itself -- distinct from the
    // good/bad elimination stings used later for opened cases.
    new Audio(CASE_SELECTED_SRC).play().catch(() => {});
    const t = setTimeout(() => setCeremonyCaseNumber(null), 1800);
    return () => clearTimeout(t);
  }, [state.phase, state.playerCaseNumber]);

  const playerCase = getPlayerCase(state);
  const eliminatedIds = getEliminatedQbIds(state);
  const showYourCase = playerCase && state.phase !== 'selecting-case' && state.phase !== 'finished';
  const positionConfig = POSITIONS[state.position];
  const offerTier = state.currentOffer ? classifyOfferTier(state.currentOffer) : null;

  function handleSelectMode(mode: Mode) {
    setSelectedMode(mode);
    if (mode === 'DYNASTY') audioRef.current?.playDynastyNamingMusic();
    else audioRef.current?.stopPregameMusic();
  }

  function backToModePicker() {
    clearSavedGame();
    resumedRef.current = false;
    setHasStarted(false);
    setDynasty(null);
    setDynastyDone(false);
    setDynastyTeamName(DEFAULT_DYNASTY_TEAM_NAME);
    setNoDealTransitioning(false);
    setCeremonyCaseNumber(null);
    setPendingReveal(null);
    if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    if (offerDecisionFallbackTimeoutRef.current) clearTimeout(offerDecisionFallbackTimeoutRef.current);
    audioRef.current?.stopPregameMusic();
  }

  // Called when a single-position game finishes and the player wants to
  // play again -- for a Dynasty run this advances to the next position
  // instead of resetting to the mode picker.
  function handleEndScreenContinue() {
    if (!dynasty || !playerCase) {
      backToModePicker();
      return;
    }

    const won = state.dealAccepted?.quarterback ?? playerCase.quarterback;
    const results = { ...dynasty.results, [state.position]: won };
    const nextIndex = dynasty.index + 1;

    if (nextIndex >= DYNASTY_POSITIONS.length) {
      setDynasty({ ...dynasty, results });
      setDynastyDone(true);
      return;
    }

    setDynasty({ ...dynasty, index: nextIndex, results });
    setCeremonyCaseNumber(null);
    setPendingReveal(null);
    // Skip the full ~25s rules explainer for stages 2 and 3 -- the player
    // already knows how the game works, they just need to see the new board.
    setIntroVisualStage('board');
    dispatch({ type: 'NEW_GAME', position: DYNASTY_POSITIONS[nextIndex] });
  }

  // Shared by the natural (timed) reveal and the tap-to-skip path -- flips
  // the case open in game state and shows the real result immediately.
  function revealNow(caseNumber: number, quarterback: Player) {
    dispatch({ type: 'OPEN_CASE', caseNumber });
    setPendingReveal({ number: caseNumber, quarterback });
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    revealTimeoutRef.current = setTimeout(() => setPendingReveal(null), REVEAL_HOLD_MS);
  }

  function openCase(caseNumber: number) {
    if (pendingReveal) return; // one reveal plays out fully before the next case can open
    const opening = state.cases.find((c) => c.number === caseNumber);
    if (!opening) return;

    // Good/bad is judged against the pool of values still actually in play
    // right now (every case not yet opened, including the player's own),
    // not the fixed original 1-32 ranking -- late in the game, losing the
    // single best surviving option is bad news even if that player would've
    // ranked below-average against the full original board.
    const stillInPlay = state.cases.filter((c) => c.status !== 'opened').map((c) => c.quarterback.ovr);
    const strongerRemaining = stillInPlay.filter((ovr) => ovr > opening.quarterback.ovr).length;
    const outcome: 'good' | 'bad' = strongerRemaining >= Math.ceil(stillInPlay.length / 2) ? 'good' : 'bad';

    // Start the sound and show the case sealed first -- the actual reveal
    // (and the game-state update) lands later, timed to the sound's payoff.
    eliminationCounterRef.current += 1;
    setEliminationEvent({ key: eliminationCounterRef.current, outcome });
    setPendingReveal({ number: caseNumber, quarterback: null });

    if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    pendingTimeoutRef.current = setTimeout(() => {
      revealNow(caseNumber, opening.quarterback);
    }, REVEAL_DELAY_MS_BY_OUTCOME[outcome]);
  }

  // Tapping/clicking the reveal popup while it's still spinning (suspense
  // phase, before the result is shown) jumps straight to the result instead
  // of waiting out the full delay -- and tells the audio controller to jump
  // its sting to the payoff beat instead of restarting or cutting off cold.
  function skipSuspense() {
    if (!pendingReveal || pendingReveal.quarterback !== null) return;
    if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    const opening = state.cases.find((c) => c.number === pendingReveal.number);
    if (!opening) return;
    audioRef.current?.skipCurrentCue();
    revealNow(pendingReveal.number, opening.quarterback);
  }

  const dynastyStageLabel = dynasty ? `Dynasty — Stage ${dynasty.index + 1} of ${DYNASTY_POSITIONS.length}: ${positionConfig.pluralLabel}` : null;
  const visibleOffer = hasStarted && offerModalReady && !dynastyDone ? state.currentOffer : null;

  useEffect(() => {
    if (!visibleOffer || noDealTransitioning) return;
    const t = setTimeout(() => {
      offerPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 80);
    return () => clearTimeout(t);
  }, [visibleOffer?.round, visibleOffer?.quarterback.id, noDealTransitioning]);

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.08),transparent_60%)] pb-20 text-slate-100">
      <NflDealAudioController
        ref={audioRef}
        phase={state.phase}
        eliminationEvent={eliminationEvent}
        enabled={hasStarted}
        roundIndex={state.roundIndex}
        offerTier={offerTier}
        onBankOfferPromptReady={() => {
          if (offerDecisionFallbackTimeoutRef.current) clearTimeout(offerDecisionFallbackTimeoutRef.current);
          setOfferDecisionReady(true);
        }}
      />

      {!hasStarted ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Deal or No Deal</h1>
            <p className="mt-2 text-sm text-slate-400">{modeSubtitle(selectedMode)}</p>
          </div>
          <div role="radiogroup" aria-label="Game mode" className="flex flex-wrap justify-center gap-2">
            {MODE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={selectedMode === opt.id}
                onClick={() => handleSelectMode(opt.id)}
                className={[
                  'rounded-lg border px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300',
                  selectedMode === opt.id
                    ? 'border-teal-400 bg-teal-500/15 text-teal-200'
                    : 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200',
                ].join(' ')}
              >
                {opt.id === 'DYNASTY' ? opt.label : POSITIONS[opt.id as PositionId].shortLabel}
              </button>
            ))}
          </div>
          {selectedMode === 'DYNASTY' && (
            <label className="w-full max-w-sm text-left">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Team name</span>
              <input
                type="text"
                value={dynastyTeamName}
                onChange={(event) => setDynastyTeamName(event.target.value.slice(0, 40))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-center text-lg font-black text-white outline-none transition-colors placeholder:text-slate-600 focus:border-teal-400"
                placeholder="Name your team"
                maxLength={40}
              />
            </label>
          )}
          <button
            type="button"
            onClick={handleStartGame}
            className="rounded-xl bg-teal-500 px-10 py-4 text-lg font-black uppercase tracking-wide text-slate-950 transition-colors hover:bg-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200"
          >
            Start Game
          </button>
        </div>
      ) : introVisualStage === 'rules' ? (
        <NflDealRulesIntro
          onComplete={() => setIntroVisualStage('board')}
          label={positionConfig.label}
          pluralLabel={positionConfig.pluralLabel}
          heading={dynasty ? `Round ${dynasty.index + 1}: ${positionConfig.pluralLabel}` : undefined}
        />
      ) : (
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {dynastyStageLabel && (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-400">
                {dynastyStageLabel}
                <span className="ml-2 text-slate-500">{dynasty?.teamName}</span>
              </p>
            )}
            <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">Deal or No Deal</h1>
            <p className="text-xs text-slate-400">
              32 {positionConfig.pluralLabel}. One sealed case. The Bank is watching.
            </p>
          </div>
          <button
            type="button"
            onClick={backToModePicker}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition-colors hover:border-slate-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            New Game
          </button>
        </div>

        {dynastyDone && dynasty ? (
          <div className="mt-6">
            <NflDealDynastySummary
              results={dynasty.results as Record<PositionId, Player>}
              teamName={dynasty.teamName}
              onPlayAgain={backToModePicker}
            />
          </div>
        ) : state.phase === 'finished' && playerCase ? (
          <div className="mt-6">
            <NflDealEndScreen
              state={state}
              playerCase={playerCase}
              onPlayAgain={handleEndScreenContinue}
              ctaLabel={
                dynasty
                  ? dynasty.index + 1 >= DYNASTY_POSITIONS.length
                    ? 'See Your Dynasty Team'
                    : `Continue to ${POSITIONS[DYNASTY_POSITIONS[dynasty.index + 1]].pluralLabel}`
                  : 'Play Again'
              }
              onReveal={(outcome) => {
                eliminationCounterRef.current += 1;
                setEliminationEvent({ key: eliminationCounterRef.current, outcome });
              }}
            />
          </div>
        ) : state.phase === 'selecting-case' && !boardSettled ? (
          <div className="mt-10">
            <NflDealCaseIntroSequence cases={state.cases} onSkip={skipBoardIntro} />
          </div>
        ) : (
          // Explicit grid placement (rather than DOM order) so mobile can
          // stack these in document order -- case grid, board, your case --
          // while desktop keeps the board as a full-height sidebar next to
          // the case grid + your case in the main column.
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px] lg:grid-rows-[auto_auto]">
            <div className="space-y-4 lg:col-start-1 lg:row-start-1">
              {noDealTransitioning ? (
                <NflDealNoDealTransition state={state} />
              ) : (
                <>
                  <NflDealRoundPanel state={state} />
                  <NflDealCaseGrid
                    cases={state.cases}
                    phase={state.phase}
                    playerCaseNumber={state.playerCaseNumber}
                    currentRoundOpenedNumbers={state.casesOpenedThisRound}
                    locked={pendingReveal !== null}
                    onOpen={(caseNumber) => {
                      if (state.phase === 'selecting-case') dispatch({ type: 'SELECT_CASE', caseNumber });
                      else if (state.phase === 'opening-cases') openCase(caseNumber);
                    }}
                  />
                </>
              )}
              <div ref={offerPanelRef}>
                {visibleOffer && (
                  <NflDealOfferModal
                    offer={visibleOffer}
                    isFinal={state.phase === 'final-choice'}
                    roundIndex={state.roundIndex}
                    decisionReady={offerDecisionReady}
                    onSkipIntro={() => {
                      if (offerDecisionFallbackTimeoutRef.current) clearTimeout(offerDecisionFallbackTimeoutRef.current);
                      setOfferDecisionReady(true);
                      audioRef.current?.skipBankOfferIntro();
                    }}
                    onDeal={() => dispatch({ type: 'ACCEPT_OFFER' })}
                    onDealChosen={() => {
                      setNoDealTransitioning(false);
                      audioRef.current?.playDealAccepted(offerTier ?? 'medium');
                    }}
                    onNoDeal={() => {
                      setNoDealTransitioning(false);
                      dispatch({ type: 'REJECT_OFFER' });
                    }}
                    onNoDealChosen={() => audioRef.current?.playNoDealAccepted()}
                    onNoDealTransitionStart={() => {
                      if (state.phase === 'bank-offer') setNoDealTransitioning(true);
                    }}
                  />
                )}
              </div>
            </div>
            <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2">
              <NflDealQbBoard
                board={positionConfig.board}
                eliminatedIds={eliminatedIds}
                offerQbId={offerDecisionReady ? state.currentOffer?.quarterback.id : null}
                positionLabel={positionConfig.shortLabel}
              />
            </div>
            {showYourCase && playerCase && (
              <div className="lg:col-start-1 lg:row-start-2">
                <NflDealYourCase number={playerCase.number} />
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {pendingReveal && (
        <NflDealCaseRevealPopup
          caseNumber={pendingReveal.number}
          quarterback={pendingReveal.quarterback}
          onDismiss={() => {
            if (pendingReveal.quarterback === null) {
              skipSuspense();
              return;
            }
            if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
            setPendingReveal(null);
          }}
        />
      )}

      {ceremonyCaseNumber !== null && (
        <div
          onClick={() => setCeremonyCaseNumber(null)}
          className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-5 bg-black/85 px-4 backdrop-blur-sm"
        >
          {/* Unscaled on narrow phones -- at 1.8x the case+text box overflows
           * a small viewport width, so only scale up once there's room. */}
          <div className="scale-100 sm:scale-125 md:scale-[1.8]">
            <NflDealYourCase number={ceremonyCaseNumber} />
          </div>
          <div className="mt-6 text-center">
            <p className="text-2xl font-black text-white sm:text-3xl">{ceremonyCaseNumber} is yours!</p>
            <p className="mt-1 text-sm text-slate-400">Sealed until the end. Let&apos;s open some cases.</p>
          </div>
        </div>
      )}
    </div>
  );
}
