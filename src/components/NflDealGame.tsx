'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  createInitialGameState,
  gameReducer,
  getEliminatedQbIds,
  getPlayerCase,
} from '@/lib/nflDeal/gameLogic';
import { POSITIONS, DYNASTY_POSITIONS } from '@/lib/nflDeal/positions';
import { claimSessionAndCheckIfResuming, clearSavedGame, loadGame, releaseSession, saveGame } from '@/lib/nflDeal/storage';
import NflDealCaseGrid from './NflDealCaseGrid';
import NflDealQbBoard from './NflDealQbBoard';
import NflDealOfferModal from './NflDealOfferModal';
import NflDealRoundPanel from './NflDealRoundPanel';
import NflDealEndScreen from './NflDealEndScreen';
import NflDealDynastySummary from './NflDealDynastySummary';
import NflDealYourCase from './NflDealYourCase';
import NflDealAudioController, { type NflDealAudioHandle } from './NflDealAudioController';
import NflDealCaseRevealPopup from './NflDealCaseRevealPopup';
import NflDealRulesIntro from './NflDealRulesIntro';
import type { Player, PositionId } from '@/lib/nflDeal/types';

// How long the sound plays before the result actually shows -- timed to
// land near the end of each ~6s elimination clip. Best-effort estimate;
// nudge per-outcome if it drifts out of sync with the clips.
const REVEAL_DELAY_MS_BY_OUTCOME: Record<'good' | 'bad', number> = { good: 4500, bad: 5000 };
const REVEAL_HOLD_MS = 1500;
// Extra room after the reveal for the banker's-call ring before the offer
// modal actually appears, so a round-ending case doesn't cut straight from
// "here's who you lost" to the offer with no beat in between.
const OFFER_MODAL_DELAY_MS = 1800;

type Mode = PositionId | 'DYNASTY';

const MODE_OPTIONS: { id: Mode; label: string }[] = [
  { id: 'QB', label: 'Quarterback' },
  { id: 'RB', label: 'Running Back' },
  { id: 'WR', label: 'Wide Receiver' },
  { id: 'DYNASTY', label: 'Dynasty' },
];

function modeSubtitle(mode: Mode): string {
  if (mode === 'DYNASTY') return 'QB, then RB, then WR. Build a dynasty, one case at a time.';
  return `32 ${POSITIONS[mode].pluralLabel}. One sealed case. The Bank is watching.`;
}

export default function NflDealGame() {
  // Set once, synchronously, by the useReducer lazy initializer below (which
  // only ever runs on mount) -- lets handleStartGame tell a genuine resume
  // apart from a fresh game without re-deriving it from storage a second time.
  const resumedRef = useRef(false);
  const [state, dispatch] = useReducer(gameReducer, undefined, () => {
    if (claimSessionAndCheckIfResuming()) {
      const saved = loadGame();
      if (saved) {
        resumedRef.current = true;
        return saved;
      }
    } else {
      clearSavedGame();
    }
    return createInitialGameState('QB');
  });
  const [selectedMode, setSelectedMode] = useState<Mode>(state.position);
  // Only set while playing a Dynasty run: tracks which of the three
  // positions we're on and the winning player banked from each finished
  // stage so far.
  const [dynasty, setDynasty] = useState<{ index: number; results: Partial<Record<PositionId, Player>> } | null>(null);
  const [dynastyDone, setDynastyDone] = useState(false);
  const [ceremonyCaseNumber, setCeremonyCaseNumber] = useState<number | null>(null);
  const [pendingReveal, setPendingReveal] = useState<{ number: number; quarterback: Player | null } | null>(null);
  const [eliminationEvent, setEliminationEvent] = useState<{ key: number; outcome: 'good' | 'bad' } | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [introVisualStage, setIntroVisualStage] = useState<'rules' | 'board'>('rules');
  const [offerModalReady, setOfferModalReady] = useState(false);
  const pendingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offerModalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eliminationCounterRef = useRef(0);
  const prevPhaseRef = useRef(state.phase);
  const audioRef = useRef<NflDealAudioHandle>(null);

  // Don't show the offer modal the instant phase flips to bank-offer/final-
  // choice -- let the case reveal finish holding, then give the banker's
  // ring a moment, so a round-ending case doesn't jump straight to the
  // offer with the reveal barely visible.
  useEffect(() => {
    const isOfferPhase = state.phase === 'bank-offer' || state.phase === 'final-choice';
    if (offerModalTimeoutRef.current) clearTimeout(offerModalTimeoutRef.current);
    if (!isOfferPhase) {
      setOfferModalReady(false);
      return;
    }
    if (pendingReveal) return; // still showing/holding the case reveal
    offerModalTimeoutRef.current = setTimeout(() => setOfferModalReady(true), OFFER_MODAL_DELAY_MS);
    return () => {
      if (offerModalTimeoutRef.current) clearTimeout(offerModalTimeoutRef.current);
    };
  }, [state.phase, pendingReveal]);

  function handleStartGame() {
    // The mode selector defaults to whatever position a resumed game was
    // already on -- if the player leaves that selection alone, Start Game
    // should continue that game rather than silently discarding it. Picking
    // a different mode (or Dynasty, which never resumes) starts fresh.
    const resuming = resumedRef.current && selectedMode === state.position;

    if (!resuming) {
      if (selectedMode === 'DYNASTY') {
        setDynasty({ index: 0, results: {} });
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
    // No need to keep a finished game around -- next load should start fresh.
    if (state.phase === 'finished') clearSavedGame();
    else saveGame(state);
  }, [state]);

  // A clean unmount means the player actually navigated away (not a
  // reload) -- release the session flag so coming back starts fresh.
  useEffect(() => releaseSession, []);

  useEffect(() => {
    const justPickedCase = prevPhaseRef.current === 'selecting-case' && state.phase === 'opening-cases';
    prevPhaseRef.current = state.phase;
    if (!justPickedCase || state.playerCaseNumber === null) return;

    setCeremonyCaseNumber(state.playerCaseNumber);
    const t = setTimeout(() => setCeremonyCaseNumber(null), 1800);
    return () => clearTimeout(t);
  }, [state.phase, state.playerCaseNumber]);

  const playerCase = getPlayerCase(state);
  const eliminatedIds = getEliminatedQbIds(state);
  const showYourCase = playerCase && state.phase !== 'selecting-case' && state.phase !== 'finished';
  const positionConfig = POSITIONS[state.position];

  function backToModePicker() {
    clearSavedGame();
    resumedRef.current = false;
    setHasStarted(false);
    setDynasty(null);
    setDynastyDone(false);
    setCeremonyCaseNumber(null);
    setPendingReveal(null);
    if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
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
      setDynasty({ index: dynasty.index, results });
      setDynastyDone(true);
      return;
    }

    setDynasty({ index: nextIndex, results });
    setCeremonyCaseNumber(null);
    setPendingReveal(null);
    // Skip the full ~25s rules explainer for stages 2 and 3 -- the player
    // already knows how the game works, they just need to see the new board.
    setIntroVisualStage('board');
    dispatch({ type: 'NEW_GAME', position: DYNASTY_POSITIONS[nextIndex] });
  }

  function openCase(caseNumber: number) {
    if (pendingReveal) return; // one reveal plays out fully before the next case can open
    const opening = state.cases.find((c) => c.number === caseNumber);
    if (!opening) return;

    // Good = a bottom-half (worst-ranked) player got knocked off the board;
    // bad = a top-half (best-ranked) player did. Ranks are fixed 1 (best) ->
    // 32 (worst) regardless of who's still hidden.
    const outcome: 'good' | 'bad' = opening.quarterback.rank > 16 ? 'good' : 'bad';

    // Start the sound and show the case sealed first -- the actual reveal
    // (and the game-state update) lands later, timed to the sound's payoff.
    eliminationCounterRef.current += 1;
    setEliminationEvent({ key: eliminationCounterRef.current, outcome });
    setPendingReveal({ number: caseNumber, quarterback: null });

    if (pendingTimeoutRef.current) clearTimeout(pendingTimeoutRef.current);
    pendingTimeoutRef.current = setTimeout(() => {
      dispatch({ type: 'OPEN_CASE', caseNumber });
      setPendingReveal({ number: caseNumber, quarterback: opening.quarterback });
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = setTimeout(() => setPendingReveal(null), REVEAL_HOLD_MS);
    }, REVEAL_DELAY_MS_BY_OUTCOME[outcome]);
  }

  const dynastyStageLabel = dynasty ? `Dynasty — Stage ${dynasty.index + 1} of ${DYNASTY_POSITIONS.length}: ${positionConfig.pluralLabel}` : null;

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.08),transparent_60%)] pb-20 text-slate-100">
      <NflDealAudioController ref={audioRef} phase={state.phase} eliminationEvent={eliminationEvent} enabled={hasStarted} />

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
                onClick={() => setSelectedMode(opt.id)}
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
        />
      ) : (
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {dynastyStageLabel && (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-400">{dynastyStageLabel}</p>
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
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
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
              {showYourCase && playerCase && <NflDealYourCase number={playerCase.number} />}
            </div>
            <div>
              <NflDealQbBoard
                board={positionConfig.board}
                eliminatedIds={eliminatedIds}
                offerQbId={state.currentOffer?.quarterback.id}
                positionLabel={positionConfig.shortLabel}
              />
            </div>
          </div>
        )}
      </div>
      )}

      {hasStarted && offerModalReady && state.currentOffer && !dynastyDone && (
        <NflDealOfferModal
          offer={state.currentOffer}
          isFinal={state.phase === 'final-choice'}
          roundIndex={state.roundIndex}
          onDeal={() => dispatch({ type: 'ACCEPT_OFFER' })}
          onNoDeal={() => dispatch({ type: 'REJECT_OFFER' })}
        />
      )}

      {pendingReveal && (
        <NflDealCaseRevealPopup
          caseNumber={pendingReveal.number}
          quarterback={pendingReveal.quarterback}
          onDismiss={() => {
            if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
            setPendingReveal(null);
          }}
        />
      )}

      {ceremonyCaseNumber !== null && (
        <div
          onClick={() => setCeremonyCaseNumber(null)}
          className="fixed inset-0 z-50 flex cursor-pointer flex-col items-center justify-center gap-5 bg-black/85 backdrop-blur-sm"
        >
          <div className="scale-[1.8]">
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
