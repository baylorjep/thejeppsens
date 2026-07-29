'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  createInitialGameState,
  gameReducer,
  getEliminatedQbIds,
  getPlayerCase,
} from '@/lib/nflDeal/gameLogic';
import { QB_BOARD } from '@/lib/nflDeal/qbData';
import { claimSessionAndCheckIfResuming, clearSavedGame, loadGame, releaseSession, saveGame } from '@/lib/nflDeal/storage';
import NflDealCaseGrid from './NflDealCaseGrid';
import NflDealQbBoard from './NflDealQbBoard';
import NflDealOfferModal from './NflDealOfferModal';
import NflDealRoundPanel from './NflDealRoundPanel';
import NflDealEndScreen from './NflDealEndScreen';
import NflDealYourCase from './NflDealYourCase';
import NflDealAudioController, { type NflDealAudioHandle } from './NflDealAudioController';
import NflDealCaseRevealPopup from './NflDealCaseRevealPopup';
import type { CaseState } from '@/lib/nflDeal/types';

export default function NflDealGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => {
    if (claimSessionAndCheckIfResuming()) {
      const saved = loadGame();
      if (saved) return saved;
    } else {
      clearSavedGame();
    }
    return createInitialGameState();
  });
  const [ceremonyCaseNumber, setCeremonyCaseNumber] = useState<number | null>(null);
  const [revealedCase, setRevealedCase] = useState<CaseState | null>(null);
  const [eliminationEvent, setEliminationEvent] = useState<{ key: number; outcome: 'good' | 'bad' } | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const eliminationCounterRef = useRef(0);
  const prevPhaseRef = useRef(state.phase);
  const audioRef = useRef<NflDealAudioHandle>(null);

  function handleStartGame() {
    setHasStarted(true);
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
  const unopenedAtFinish = state.phase === 'finished' ? state.cases.filter((c) => c.status === 'available') : [];
  const showYourCase = playerCase && state.phase !== 'selecting-case' && state.phase !== 'finished';

  function newGame() {
    clearSavedGame();
    setCeremonyCaseNumber(null);
    setRevealedCase(null);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    dispatch({ type: 'NEW_GAME' });
  }

  function openCase(caseNumber: number) {
    const opening = state.cases.find((c) => c.number === caseNumber);
    if (opening) {
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      setRevealedCase(opening);
      revealTimeoutRef.current = setTimeout(() => setRevealedCase(null), 1500);

      const stillHidden = [
        ...(playerCase ? [playerCase.quarterback] : []),
        ...state.cases.filter((c) => c.status === 'available').map((c) => c.quarterback),
      ];
      if (stillHidden.length > 0) {
        const avgHiddenOvr = stillHidden.reduce((sum, q) => sum + q.ovr, 0) / stillHidden.length;
        eliminationCounterRef.current += 1;
        setEliminationEvent({
          key: eliminationCounterRef.current,
          outcome: opening.quarterback.ovr < avgHiddenOvr ? 'good' : 'bad',
        });
      }
    }
    dispatch({ type: 'OPEN_CASE', caseNumber });
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.08),transparent_60%)] pb-20 text-slate-100">
      <NflDealAudioController ref={audioRef} phase={state.phase} eliminationEvent={eliminationEvent} />

      {!hasStarted ? (
        <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">NFL Deal or No Deal</h1>
            <p className="mt-2 text-sm text-slate-400">32 QBs. One sealed case. The Bank is watching.</p>
          </div>
          <button
            type="button"
            onClick={handleStartGame}
            className="rounded-xl bg-teal-500 px-10 py-4 text-lg font-black uppercase tracking-wide text-slate-950 transition-colors hover:bg-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200"
          >
            Start Game
          </button>
        </div>
      ) : (
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">NFL Deal or No Deal</h1>
            <p className="text-xs text-slate-400">32 QBs. One sealed case. The Bank is watching.</p>
          </div>
          <button
            type="button"
            onClick={newGame}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300 transition-colors hover:border-slate-500 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            New Game
          </button>
        </div>

        {state.phase === 'finished' && playerCase ? (
          <div className="mt-6">
            <NflDealEndScreen state={state} playerCase={playerCase} unopenedCases={unopenedAtFinish} onPlayAgain={newGame} />
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              <NflDealRoundPanel state={state} />
              {showYourCase && playerCase && <NflDealYourCase number={playerCase.number} />}
              <NflDealCaseGrid
                cases={state.cases}
                phase={state.phase}
                playerCaseNumber={state.playerCaseNumber}
                activeRevealNumber={revealedCase?.number ?? null}
                onOpen={(caseNumber) => {
                  if (state.phase === 'selecting-case') dispatch({ type: 'SELECT_CASE', caseNumber });
                  else if (state.phase === 'opening-cases') openCase(caseNumber);
                }}
              />
            </div>
            <div>
              <NflDealQbBoard board={QB_BOARD} eliminatedIds={eliminatedIds} offerQbId={state.currentOffer?.quarterback.id} />
            </div>
          </div>
        )}
      </div>
      )}

      {hasStarted && (state.phase === 'bank-offer' || state.phase === 'final-choice') && state.currentOffer && (
        <NflDealOfferModal
          offer={state.currentOffer}
          isFinal={state.phase === 'final-choice'}
          onDeal={() => dispatch({ type: 'ACCEPT_OFFER' })}
          onNoDeal={() => dispatch({ type: 'REJECT_OFFER' })}
        />
      )}

      {revealedCase && (
        <NflDealCaseRevealPopup
          caseNumber={revealedCase.number}
          quarterback={revealedCase.quarterback}
          onDismiss={() => {
            if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
            setRevealedCase(null);
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
