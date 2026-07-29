'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Confetti from 'react-confetti';
import { ArrowRight, RotateCcw, TrendingDown, TrendingUp } from 'lucide-react';
import { espnHeadshotUrl } from '@/lib/nflDeal/playerData';
import type { CaseState, GameState, Player } from '@/lib/nflDeal/types';

interface Props {
  state: GameState;
  playerCase: CaseState;
  /** For final-choice rounds, the case that was passed on */
  declinedFinalCase?: CaseState | null;
  onPlayAgain: () => void;
  ctaLabel?: string;
  /** Fires once, timed so the sound lands right as the reveal happens, with
   * whether the decision (deal taken or case kept) turned out to be right. */
  onReveal: (outcome: 'good' | 'bad') => void;
}

// Same idea as the case-opening reveals: start the sound partway through the
// stakes page (so you've had a moment to read it), then land the actual
// reveal right at the sound's payoff -- these reuse the same elimination
// clips, so the same calibrated delays apply.
const STAKES_SOUND_LEAD_MS = 2500;
const REVEAL_SOUND_DELAY_MS: Record<'good' | 'bad', number> = { good: 4500, bad: 5000 };

function QbChip({ qb, size = 40, tone }: { qb: Player; size?: number; tone?: string }) {
  const [imgFailed, setImgFailed] = useState(false);
  const headshotUrl = espnHeadshotUrl(qb);

  return (
    <div className="flex items-center gap-2">
      <div className="relative shrink-0 overflow-hidden rounded-full bg-slate-700" style={{ width: size, height: size }}>
        {headshotUrl && !imgFailed ? (
          <Image src={headshotUrl} alt="" fill sizes={`${size}px`} className="object-cover" onError={() => setImgFailed(true)} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-300">
            {qb.name.split(' ').map((p) => p[0]).join('')}
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-100">{qb.name}</p>
        <p className={`text-xs font-bold ${tone ?? 'text-teal-300'}`}>{qb.ovr} OVR</p>
      </div>
    </div>
  );
}

function SealedCase({ number }: { number: number }) {
  return (
    <div className="relative h-16 w-20">
      <div className="absolute -top-2 left-1/2 h-2.5 w-8 -translate-x-1/2 rounded-t-md border-2 border-b-0 border-slate-500" />
      <div className="relative flex h-full w-full items-center justify-center rounded-md border-2 border-slate-600 bg-gradient-to-b from-slate-700 to-slate-900">
        <div className="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-black/25" />
        <span className="relative text-xl font-black text-slate-200">{number}</span>
      </div>
    </div>
  );
}

export default function NflDealEndScreen({ state, playerCase, declinedFinalCase, onPlayAgain, ctaLabel = 'Play Again', onReveal }: Props) {
  const dealAccepted = state.dealAccepted;
  const tradedFinalCase = !dealAccepted && state.finalCaseNumber != null && state.finalCaseNumber !== state.playerCaseNumber;
  const isFinalChoice = state.phase === 'finished' && state.finalCaseNumber != null;
  // If no deal was accepted, state.currentOffer still holds the final offer
  // they turned down (see rejectOffer in gameLogic.ts).
  const declinedOffer = !dealAccepted ? state.currentOffer : null;
  const knownOffer = dealAccepted ?? declinedOffer;
  const [windowSize, setWindowSize] = useState<{ w: number; h: number } | null>(null);
  const [stage, setStage] = useState<'stakes' | 'flipping' | 'revealed'>(() => (knownOffer && isFinalChoice ? 'stakes' : knownOffer ? 'stakes' : 'revealed'));
  const onRevealFiredRef = useRef(false);
  const flipDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flipTransitionRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const beatCase = dealAccepted ? dealAccepted.offerOvr > playerCase.quarterback.ovr : null;
  const beatDeclinedOffer = declinedOffer ? playerCase.quarterback.ovr > declinedOffer.offerOvr : null;
  const outcome: 'good' | 'bad' | null =
    beatCase === true || beatDeclinedOffer === true ? 'good' : beatCase === false || beatDeclinedOffer === false ? 'bad' : null;
  const isGood = outcome === 'good';
  const isBad = outcome === 'bad';
  const celebrate = isGood || playerCase.quarterback.ovr >= 90;
  const isRestartCta = ctaLabel === 'Play Again';

  function revealOutcomeNow() {
    if (outcome && !onRevealFiredRef.current) {
      onRevealFiredRef.current = true;
      onReveal(outcome);
    }
    setStage('revealed');
  }

  function skipForward() {
    if (stage === 'stakes') revealOutcomeNow();
  }

  useEffect(() => {
    setWindowSize({ w: window.innerWidth, h: window.innerHeight });
  }, []);

  // Auto-transition for final-choice: stakes → flipping → revealed
  useEffect(() => {
    if (stage !== 'stakes' || !isFinalChoice) return;
    // Delay before flipping animation starts
    flipDelayRef.current = setTimeout(() => setStage('flipping'), 1200);
    return () => {
      if (flipDelayRef.current) clearTimeout(flipDelayRef.current);
    };
  }, [stage, isFinalChoice]);

  useEffect(() => {
    if (stage !== 'flipping') return;
    // Flip animation duration: 1.2s
    flipTransitionRef.current = setTimeout(() => {
      revealOutcomeNow();
    }, 1200);
    return () => {
      if (flipTransitionRef.current) clearTimeout(flipTransitionRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => {
    if (stage !== 'stakes') return;
    const soundTimer = setTimeout(() => {
      if (outcome && !onRevealFiredRef.current) {
        onRevealFiredRef.current = true;
        onReveal(outcome);
      }
    }, STAKES_SOUND_LEAD_MS);
    const revealTimer = setTimeout(
      () => setStage('revealed'),
      STAKES_SOUND_LEAD_MS + (outcome ? REVEAL_SOUND_DELAY_MS[outcome] : 0),
    );
    return () => {
      clearTimeout(soundTimer);
      clearTimeout(revealTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Fallback for the rare case where stakes gets skipped entirely (no offer
  // ever existed) -- the sound still needs to fire from somewhere.
  useEffect(() => {
    if (stage !== 'revealed' || onRevealFiredRef.current) return;
    onRevealFiredRef.current = true;
    if (outcome) onReveal(outcome);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  if (stage === 'flipping' && isFinalChoice && declinedFinalCase && playerCase) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-8 rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-8 text-center sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Revealing cases...</p>
        <div className="flex items-center gap-8 sm:gap-12">
          {/* Left case flip - traded away */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative h-32 w-40 sm:h-40 sm:w-48 rounded-lg border-2 border-teal-500/60"
              style={{
                transformStyle: 'preserve-3d',
                animation: 'flip3d 1.2s ease-in-out forwards',
              }}
            >
              {/* Sealed side */}
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gradient-to-b from-slate-600 to-slate-900 border-2 border-teal-500/60" style={{ backfaceVisibility: 'hidden' }}>
                <div className="text-center">
                  <div className="h-3 w-10 rounded-t-md border-2 border-b-0 border-slate-400 mx-auto mb-2" />
                  <div className="text-xl font-bold text-slate-200">?</div>
                </div>
              </div>
              {/* Revealed side */}
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-800" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="text-center">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border border-slate-600 bg-slate-700 mx-auto mb-2 sm:h-14 sm:w-14">
                    {espnHeadshotUrl(declinedFinalCase.quarterback) ? (
                      <Image src={espnHeadshotUrl(declinedFinalCase.quarterback)!} alt="" fill sizes="56px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-300">
                        {declinedFinalCase.quarterback.name.split(' ').map((p) => p[0]).join('')}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-bold text-white">{declinedFinalCase.quarterback.name.split(' ').slice(-1)[0]}</p>
                  <p className="text-lg font-black text-rose-300">{declinedFinalCase.quarterback.ovr}</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mt-2">Traded away</p>
          </div>

          {/* Right case flip - received */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative h-32 w-40 sm:h-40 sm:w-48 rounded-lg border-2 border-teal-500/60"
              style={{
                transformStyle: 'preserve-3d',
                animation: 'flip3d 1.2s ease-in-out forwards',
              }}
            >
              {/* Sealed side */}
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-gradient-to-b from-slate-600 to-slate-900 border-2 border-teal-500/60" style={{ backfaceVisibility: 'hidden' }}>
                <div className="text-center">
                  <div className="h-3 w-10 rounded-t-md border-2 border-b-0 border-slate-400 mx-auto mb-2" />
                  <div className="text-xl font-bold text-slate-200">?</div>
                </div>
              </div>
              {/* Revealed side */}
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-800" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                <div className="text-center">
                  <div className="relative h-12 w-12 overflow-hidden rounded-full border border-slate-600 bg-slate-700 mx-auto mb-2 sm:h-14 sm:w-14">
                    {espnHeadshotUrl(playerCase.quarterback) ? (
                      <Image src={espnHeadshotUrl(playerCase.quarterback)!} alt="" fill sizes="56px" className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs font-bold text-slate-300">
                        {playerCase.quarterback.name.split(' ').map((p) => p[0]).join('')}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-bold text-white">{playerCase.quarterback.name.split(' ').slice(-1)[0]}</p>
                  <p className="text-lg font-black text-teal-300">{playerCase.quarterback.ovr}</p>
                </div>
              </div>
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mt-2">Received</p>
          </div>
        </div>

        <style>{`
          @keyframes flip3d {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(90deg); }
            100% { transform: rotateY(180deg); }
          }
        `}</style>
      </div>
    );
  }

  if (stage === 'stakes' && knownOffer) {
    // For final-choice rounds, show both the chosen case and the passed case
    if (isFinalChoice && declinedFinalCase && dealAccepted === null) {
      return (
        <div
          onClick={skipForward}
          className="flex min-h-[420px] cursor-pointer flex-col items-center justify-center gap-6 rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-8 text-center sm:p-10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Your final choice</p>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {tradedFinalCase ? 'You chose' : 'You kept'}
              </p>
              <SealedCase number={playerCase.number} />
            </div>
            <span className="text-xl font-black text-slate-600">vs</span>
            <div className="flex flex-col items-center gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {tradedFinalCase ? 'You passed on' : 'You could trade for'}
              </p>
              <SealedCase number={declinedFinalCase.number} />
            </div>
          </div>

          <div className="text-center">
            <p className="text-[11px] font-semibold text-slate-400">Click anywhere to see what's inside</p>
          </div>
        </div>
      );
    }

    return (
      <div
        onClick={skipForward}
        className="flex min-h-[420px] cursor-pointer flex-col items-center justify-center gap-6 rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-8 text-center sm:p-10"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Here's what was on the line</p>
        <div className="flex items-center gap-6 sm:gap-10">
          <div className="flex flex-col items-center gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {dealAccepted ? 'You took' : 'You passed on'}
            </p>
            <QbChip qb={knownOffer.quarterback} size={56} />
          </div>
          <span className="text-xl font-black text-slate-600">vs</span>
          <div className="flex flex-col items-center gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {tradedFinalCase ? 'Chosen case' : 'Your case'}
            </p>
            <SealedCase number={playerCase.number} />
          </div>
        </div>

        <div className="w-full max-w-md">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Your case could have been any of these
          </p>
          <div className="flex max-h-40 flex-wrap justify-center gap-2 overflow-y-auto">
            {knownOffer.remainingPool.map((qb) => (
              <div key={qb.id} className="rounded-md border border-slate-700 bg-slate-800/50 px-2 py-1.5">
                <QbChip qb={qb} size={28} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const ringTone = isGood ? 'border-green-400/70' : isBad ? 'border-rose-400/70' : 'border-teal-400/60';
  const ovrTone = isGood ? 'text-green-300' : isBad ? 'text-rose-300' : 'text-teal-300';
  const containerTone = isGood
    ? 'border-green-500/40 bg-gradient-to-b from-green-500/10 via-slate-900 to-slate-900'
    : isBad
      ? 'border-rose-500/40 bg-gradient-to-b from-rose-500/10 via-slate-900 to-slate-900'
      : 'border-slate-700 bg-slate-900/80';
  const boxTone = isGood ? 'border-green-700/40 bg-green-950/20' : isBad ? 'border-rose-700/40 bg-rose-950/20' : 'border-slate-700 bg-slate-800/60';

  return (
    <div className={`relative overflow-hidden rounded-2xl border p-6 text-center transition-colors sm:p-10 ${containerTone}`}>
      {celebrate && windowSize && (
        <Confetti
          width={windowSize.w}
          height={windowSize.h}
          recycle={false}
          numberOfPieces={220}
          colors={isGood ? ['#22c55e', '#4ade80', '#86efac', '#14b8a6', '#f8fafc'] : ['#f59e0b', '#14b8a6', '#3b82f6', '#a855f7', '#f8fafc']}
        />
      )}

      {outcome && !tradedFinalCase && (
        <p
          className={`animate-case-reveal mb-1 text-[10px] font-bold uppercase tracking-[0.3em] ${isGood ? 'text-green-400' : 'text-rose-400'}`}
        >
          {isGood ? 'Great outcome' : 'Tough break'}
        </p>
      )}
      {tradedFinalCase && declinedFinalCase && (
        <p
          className={`animate-case-reveal mb-1 text-[10px] font-bold uppercase tracking-[0.3em] ${playerCase.quarterback.ovr > declinedFinalCase.quarterback.ovr ? 'text-green-400' : playerCase.quarterback.ovr < declinedFinalCase.quarterback.ovr ? 'text-rose-400' : 'text-slate-400'}`}
        >
          {playerCase.quarterback.ovr > declinedFinalCase.quarterback.ovr ? 'Smart trade' : playerCase.quarterback.ovr < declinedFinalCase.quarterback.ovr ? 'Tough trade' : 'Even trade'}
        </p>
      )}
      <h2 className="animate-case-reveal text-3xl font-black text-white sm:text-4xl">
        {dealAccepted ? 'DEAL!' : tradedFinalCase ? 'TRADE!' : isFinalChoice ? 'KEPT!' : 'NO DEAL'}
      </h2>
      <p className="animate-case-reveal mt-1 text-sm text-slate-400">
        {dealAccepted ? 'You took the offer.' : tradedFinalCase ? 'You traded for the last case.' : 'You kept your case.'}
      </p>

      {tradedFinalCase && declinedFinalCase ? (
        <div className="animate-case-reveal mx-auto mt-6 flex flex-col items-center gap-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your trade</p>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Traded away</p>
              <div className={`relative h-20 w-20 overflow-hidden rounded-full border-2 bg-slate-800 sm:h-24 sm:w-24 border-slate-600`}>
                {espnHeadshotUrl(declinedFinalCase.quarterback) ? (
                  <Image src={espnHeadshotUrl(declinedFinalCase.quarterback)!} alt="" fill sizes="96px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-300">
                    {declinedFinalCase.quarterback.name.split(' ').map((p) => p[0]).join('')}
                  </div>
                )}
              </div>
              <p className="text-center text-sm font-bold text-white">{declinedFinalCase.quarterback.name}</p>
              <p className="text-2xl font-black text-rose-300">{declinedFinalCase.quarterback.ovr} OVR</p>
            </div>
            <span className="text-xl font-black text-slate-600">→</span>
            <div className="flex flex-col items-center gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Received</p>
              <div className={`relative h-20 w-20 overflow-hidden rounded-full border-2 bg-slate-800 sm:h-24 sm:w-24 border-slate-600`}>
                {espnHeadshotUrl(playerCase.quarterback) ? (
                  <Image src={espnHeadshotUrl(playerCase.quarterback)!} alt="" fill sizes="96px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-slate-300">
                    {playerCase.quarterback.name.split(' ').map((p) => p[0]).join('')}
                  </div>
                )}
              </div>
              <p className="text-center text-sm font-bold text-white">{playerCase.quarterback.name}</p>
              <p className={`text-2xl font-black ${ovrTone}`}>{playerCase.quarterback.ovr} OVR</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="animate-case-reveal mx-auto mt-6 flex flex-col items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Case #{playerCase.number} contained
          </p>
          <div className={`relative h-24 w-24 overflow-hidden rounded-full border-2 bg-slate-800 sm:h-28 sm:w-28 ${ringTone}`}>
            {espnHeadshotUrl(playerCase.quarterback) ? (
              <Image src={espnHeadshotUrl(playerCase.quarterback)!} alt="" fill sizes="112px" className="object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-slate-300">
                {playerCase.quarterback.name.split(' ').map((p) => p[0]).join('')}
              </div>
            )}
          </div>
          <p className="text-xl font-bold text-white sm:text-2xl">{playerCase.quarterback.name}</p>
          <p className={`text-3xl font-black sm:text-4xl ${ovrTone}`}>{playerCase.quarterback.ovr} OVR</p>
        </div>
      )}

      {dealAccepted && (
        <div
          className={[
            'mx-auto mt-5 flex max-w-md items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold',
            beatCase ? 'bg-green-500/10 text-green-300' : dealAccepted.offerOvr < playerCase.quarterback.ovr ? 'bg-rose-500/10 text-rose-300' : 'bg-slate-800 text-slate-300',
          ].join(' ')}
        >
          {beatCase ? (
            <>
              <TrendingUp className="h-4 w-4" aria-hidden />
              Smart deal — your case would've been worse!
            </>
          ) : dealAccepted.offerOvr < playerCase.quarterback.ovr ? (
            <>
              <TrendingDown className="h-4 w-4" aria-hidden />
              Your case had more value — but the deal is done.
            </>
          ) : (
            'Dead even with your case.'
          )}
        </div>
      )}

      {dealAccepted && (
        <div className={`mx-auto mt-5 max-w-xs rounded-xl border p-4 ${boxTone}`}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">You took the deal</p>
          <div className="flex justify-center">
            <QbChip qb={dealAccepted.quarterback} tone={ovrTone} />
          </div>
        </div>
      )}

      {isFinalChoice && declinedFinalCase ? (
        <div className="mx-auto mt-5 max-w-md space-y-3">
          <div
            className={[
              'flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold',
              playerCase.quarterback.ovr > declinedFinalCase.quarterback.ovr ? 'bg-green-500/10 text-green-300' : playerCase.quarterback.ovr < declinedFinalCase.quarterback.ovr ? 'bg-rose-500/10 text-rose-300' : 'bg-slate-800 text-slate-300',
            ].join(' ')}
          >
            {tradedFinalCase ? (
              playerCase.quarterback.ovr > declinedFinalCase.quarterback.ovr ? (
                <>
                  <TrendingUp className="h-4 w-4" aria-hidden />
                  Great trade — you got the better player!
                </>
              ) : playerCase.quarterback.ovr < declinedFinalCase.quarterback.ovr ? (
                <>
                  <TrendingDown className="h-4 w-4" aria-hidden />
                  That trade didn't go your way — you gave up more value.
                </>
              ) : (
                'Even trade between the two cases.'
              )
            ) : playerCase.quarterback.ovr > declinedFinalCase.quarterback.ovr ? (
              <>
                <TrendingUp className="h-4 w-4" aria-hidden />
                Great call — your case was worth more!
              </>
            ) : playerCase.quarterback.ovr < declinedFinalCase.quarterback.ovr ? (
              <>
                <TrendingDown className="h-4 w-4" aria-hidden />
                You could've traded up — that case was better.
              </>
            ) : (
              'Both cases had the same value.'
            )}
          </div>
          <div className="flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/40 px-4 py-2.5">
            <p className="text-sm font-bold text-slate-300">
              {tradedFinalCase ? 'Net value: ' : 'Case value: '}
              <span className={playerCase.quarterback.ovr > declinedFinalCase.quarterback.ovr ? 'text-green-300' : playerCase.quarterback.ovr < declinedFinalCase.quarterback.ovr ? 'text-rose-300' : 'text-slate-300'}>
                {playerCase.quarterback.ovr > declinedFinalCase.quarterback.ovr ? '+' : ''}{playerCase.quarterback.ovr - declinedFinalCase.quarterback.ovr} OVR
              </span>
            </p>
          </div>
        </div>
      ) : declinedOffer ? (
        <>
          <div
            className={[
              'mx-auto mt-5 flex max-w-md items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold',
              beatDeclinedOffer ? 'bg-green-500/10 text-green-300' : beatDeclinedOffer === false ? 'bg-rose-500/10 text-rose-300' : 'bg-slate-800 text-slate-300',
            ].join(' ')}
          >
            {beatDeclinedOffer ? (
              <>
                <TrendingUp className="h-4 w-4" aria-hidden />
                Great call — you beat the Bank's offer!
              </>
            ) : beatDeclinedOffer === false ? (
              <>
                <TrendingDown className="h-4 w-4" aria-hidden />
                The Bank's offer would have been better.
              </>
            ) : (
              "Dead even with the Bank's offer."
            )}
          </div>

          <div className={`mx-auto mt-5 max-w-xs rounded-xl border p-4 ${boxTone}`}>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">You passed on</p>
            <div className="flex justify-center">
              <QbChip qb={declinedOffer.quarterback} tone={ovrTone} />
            </div>
          </div>
        </>
      ) : null}

      <button
        type="button"
        onClick={onPlayAgain}
        className="mx-auto mt-8 flex items-center gap-2 rounded-lg bg-teal-500 px-5 py-3 text-sm font-bold uppercase tracking-wide text-slate-950 transition-colors hover:bg-teal-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-200"
      >
        {isRestartCta ? <RotateCcw className="h-4 w-4" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />}
        {ctaLabel}
      </button>
    </div>
  );
}
