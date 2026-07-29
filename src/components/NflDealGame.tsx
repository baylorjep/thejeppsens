'use client';

import { useEffect, useReducer } from 'react';
import { RotateCcw } from 'lucide-react';
import {
  createInitialGameState,
  gameReducer,
  getEliminatedQbIds,
  getPlayerCase,
} from '@/lib/nflDeal/gameLogic';
import { QB_BOARD } from '@/lib/nflDeal/qbData';
import { clearSavedGame, loadGame, saveGame } from '@/lib/nflDeal/storage';
import NflDealCaseGrid from './NflDealCaseGrid';
import NflDealQbBoard from './NflDealQbBoard';
import NflDealOfferModal from './NflDealOfferModal';
import NflDealRoundPanel from './NflDealRoundPanel';
import NflDealEndScreen from './NflDealEndScreen';

export default function NflDealGame() {
  const [state, dispatch] = useReducer(gameReducer, undefined, () => loadGame() ?? createInitialGameState());

  useEffect(() => {
    saveGame(state);
  }, [state]);

  const playerCase = getPlayerCase(state);
  const eliminatedIds = getEliminatedQbIds(state);
  const unopenedAtFinish = state.phase === 'finished' ? state.cases.filter((c) => c.status === 'available') : [];

  function newGame() {
    clearSavedGame();
    dispatch({ type: 'NEW_GAME' });
  }

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.08),transparent_60%)] pb-20 text-slate-100">
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
              <NflDealCaseGrid
                cases={state.cases}
                phase={state.phase}
                playerCaseNumber={state.playerCaseNumber}
                onOpen={(caseNumber) => {
                  if (state.phase === 'selecting-case') dispatch({ type: 'SELECT_CASE', caseNumber });
                  else if (state.phase === 'opening-cases') dispatch({ type: 'OPEN_CASE', caseNumber });
                }}
              />
            </div>
            <div>
              <NflDealQbBoard board={QB_BOARD} eliminatedIds={eliminatedIds} offerQbId={state.currentOffer?.quarterback.id} />
            </div>
          </div>
        )}
      </div>

      {(state.phase === 'bank-offer' || state.phase === 'final-choice') && state.currentOffer && (
        <NflDealOfferModal
          offer={state.currentOffer}
          isFinal={state.phase === 'final-choice'}
          onDeal={() => dispatch({ type: 'ACCEPT_OFFER' })}
          onNoDeal={() => dispatch({ type: 'REJECT_OFFER' })}
        />
      )}
    </div>
  );
}
