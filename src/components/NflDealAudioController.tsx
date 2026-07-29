'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { GamePhase } from '@/lib/nflDeal/types';
import type { OfferTier } from '@/lib/nflDeal/gameLogic';

export interface NflDealAudioHandle {
  /** Unmutes (if needed) and starts whatever cue fits the current phase. Call
   * this directly inside a click handler (e.g. a "Start Game" button) so the
   * very first playback is a direct result of a user gesture and isn't
   * blocked by the browser's autoplay policy. */
  unlockAndPlay: () => void;
  /** Jumps the currently-playing oneshot cue ahead to its payoff beat and
   * wraps it up shortly after -- lets a player who taps through a case
   * reveal skip the suspense without losing the sting's punchline. */
  skipCurrentCue: () => void;
  /** Skips the banker phone-ring lead-in and jumps straight to the
   * "deal or no deal" prompt. Used when the player taps the waiting offer
   * panel instead of sitting through the full banker call. */
  skipBankOfferIntro: () => void;
  /** Plays the deal-accepted crowd-reaction clip sized to how big the offer
   * was. Call the instant the Deal button is clicked, before dispatching the
   * state change -- the caller is responsible for delaying that dispatch at
   * least as long as this clip runs, since a phase change silences whatever's
   * playing. */
  playDealAccepted: (tier: OfferTier) => void;
  /** Same idea as playDealAccepted, for the No Deal button. */
  playNoDealAccepted: () => void;
}

// YouTube's official embed API -- streams straight from YouTube, nothing
// downloaded or rehosted. https://developers.google.com/youtube/iframe_api_reference
declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
interface YTPlayer {
  loadVideoById: (video: string | { videoId: string; startSeconds?: number }) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  unMute: () => void;
  setVolume: (v: number) => void;
}
interface YTStateChangeEvent {
  data: number;
  target: YTPlayer;
}

interface CueDef {
  videoId: string;
  start?: number;
  end?: number;
  kind: 'oneshot' | 'loop';
}

// Clips are played by seeking the same embedded player to a timestamp and
// stopping it a few seconds later -- same mechanic as the segment player in
// the Movie Master project's Cliplash mode. Nothing is downloaded; YouTube
// serves the video, we just tell their player where to start/stop.
const CUES: Record<
  | 'introReady'
  | 'introMonologue'
  | 'pickCasePrompt'
  | 'caseSelection'
  | 'openingCasesA'
  | 'openingCasesB'
  | 'dealOrNoDealChant'
  | 'bankOffer'
  | 'bankOfferLarge'
  | 'dealAcceptedBig'
  | 'dealAcceptedMedium'
  | 'dealAcceptedSmall'
  | 'noDealAccepted'
  | 'credits'
  | 'goodElimination'
  | 'badElimination',
  CueDef
> = {
  introReady: { videoId: '7onGy0GiMtE', start: 38, end: 43, kind: 'oneshot' },
  introMonologue: { videoId: '7onGy0GiMtE', start: 46, end: 82, kind: 'oneshot' },
  pickCasePrompt: { videoId: '7onGy0GiMtE', start: 105, end: 110, kind: 'oneshot' },
  caseSelection: { videoId: '_V6eu74Cm6s', kind: 'loop' },
  // Ambient background for the actual round-by-round case-opening grind --
  // ~1 minute each, so one is picked per round (see roundIndex prop) and
  // looped for however long that round actually takes.
  openingCasesA: { videoId: '_V6eu74Cm6s', kind: 'loop' },
  openingCasesB: { videoId: 'bb-joLo9rBU', kind: 'loop' },
  // Howie asking "deal, or no deal?" with the crowd shouting back -- plays
  // once right as an offer comes in, then an ambient loop (sized to the
  // offer, see offerTier prop) underneath the modal takes over.
  dealOrNoDealChant: { videoId: 'jmCyu3P4bwk', start: 545, end: 551, kind: 'oneshot' },
  bankOffer: { videoId: '2wo6bN035RI', kind: 'loop' },
  bankOfferLarge: { videoId: 'b1b6SnLAok8', kind: 'loop' },
  // Crowd reaction to a Deal being made, sized to how big the offer was.
  dealAcceptedBig: { videoId: 'iMkkUQOgOjE', end: 19, kind: 'oneshot' },
  dealAcceptedMedium: { videoId: 'SRp82c7m4jc', end: 13, kind: 'oneshot' },
  dealAcceptedSmall: { videoId: 'GsN1dPo7Vrg', end: 9, kind: 'oneshot' },
  // Crowd reaction to a No Deal.
  noDealAccepted: { videoId: 'wEw4c5sHqFM', start: 6040.5, end: 6046, kind: 'oneshot' },
  credits: { videoId: 'A8430xpRh8o', kind: 'loop' },
  goodElimination: { videoId: 'jrEriKj1C44', start: 185, end: 191, kind: 'oneshot' },
  badElimination: { videoId: 'jrEriKj1C44', start: 209, end: 215.5, kind: 'oneshot' },
};
type CueKey = keyof typeof CUES;

const INTRO_SEQUENCE: CueKey[] = ['introReady', 'introMonologue', 'pickCasePrompt'];
const DEFAULT_ONESHOT_MS = 5000; // fallback for any cue without an explicit start/end
const SKIP_PAYOFF_LEAD_SECONDS: Partial<Record<CueKey, number>> = {
  goodElimination: 1.5,
  badElimination: 1,
};
const BANK_RING_COUNT = 2; // total rings before the "deal or no deal" prompt
const DEAL_ACCEPTED_CUE_BY_TIER: Record<OfferTier, CueKey> = {
  big: 'dealAcceptedBig',
  medium: 'dealAcceptedMedium',
  small: 'dealAcceptedSmall',
};

function cueDurationMs(key: CueKey): number {
  const cue = CUES[key];
  return cue.end != null ? (cue.end - (cue.start ?? 0)) * 1000 : DEFAULT_ONESHOT_MS;
}

function resolvePhaseCue(
  phase: GamePhase,
  introDone: boolean,
  revealDone: boolean,
  openingCasesCue: 'openingCasesA' | 'openingCasesB',
  offerTier: OfferTier | null,
): CueKey | null {
  if (phase === 'selecting-case') return introDone ? 'caseSelection' : null; // intro sequence handles this until done
  if (phase === 'opening-cases') return openingCasesCue;
  if (phase === 'bank-offer' || phase === 'final-choice') return offerTier === 'big' ? 'bankOfferLarge' : 'bankOffer';
  // The good/bad elimination sting (fired via `eliminationEvent`, not this
  // phase-driven resolver) doubles as the final-outcome reveal sound -- stay
  // silent until it finishes and flips revealDone, then roll into credits.
  if (phase === 'finished') return revealDone ? 'credits' : null;
  return null;
}

// Not from the show -- a generic free phone-ring effect. Drop a file here to
// enable it (e.g. from https://mixkit.co/free-sound-effects/phone-ring/,
// free to use with no attribution required).
const BANK_RING_SRC = '/sounds/nfl-deal/bank-call-ring.mp3';

const MUTE_STORAGE_KEY = 'nfl-deal-or-no-deal:muted';
let apiLoadStarted = false;

interface EliminationEvent {
  key: number;
  outcome: 'good' | 'bad';
}

const NflDealAudioController = forwardRef<
  NflDealAudioHandle,
  {
    phase: GamePhase;
    eliminationEvent: EliminationEvent | null;
    enabled: boolean;
    roundIndex: number;
    offerTier: OfferTier | null;
    onBankOfferPromptReady?: () => void;
  }
>(function NflDealAudioController({ phase, eliminationEvent, enabled, roundIndex, offerTier, onBankOfferPromptReady }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const activeCueRef = useRef<CueKey | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef<CueKey[]>([]);
  const lastEliminationKeyRef = useRef(0);
  const bankOfferSequenceRef = useRef(0);

  const [playerReady, setPlayerReady] = useState(false);
  const [muted, setMuted] = useState(false);
  const [introDone, setIntroDone] = useState(false);
  const [revealDone, setRevealDone] = useState(false);
  // Which of the two ~1-minute ambient tracks underlies the current round's
  // case-opening grind -- re-rolled once per round (not per click), so it
  // doesn't restart mid-round just because something else re-renders.
  const [openingCasesCue, setOpeningCasesCue] = useState<'openingCasesA' | 'openingCasesB'>(() =>
    Math.random() < 0.5 ? 'openingCasesA' : 'openingCasesB',
  );
  const prevRoundIndexRef = useRef(roundIndex);

  useEffect(() => {
    setMuted(window.localStorage.getItem(MUTE_STORAGE_KEY) === 'true');
  }, []);

  useEffect(() => {
    if (roundIndex === prevRoundIndexRef.current) return;
    prevRoundIndexRef.current = roundIndex;
    setOpeningCasesCue(Math.random() < 0.5 ? 'openingCasesA' : 'openingCasesB');
  }, [roundIndex]);

  useEffect(() => {
    if (phase === 'selecting-case') {
      setIntroDone(false);
      setRevealDone(false);
    }
  }, [phase]);

  useEffect(() => {
    function initPlayer() {
      if (!containerRef.current || playerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '2',
        width: '2',
        playerVars: { controls: 0, disablekb: 1, modestbranding: 1, rel: 0, fs: 0, iv_load_policy: 3, playsinline: 1 },
        events: {
          onReady: () => setPlayerReady(true),
          onStateChange: (event: YTStateChangeEvent) => {
            if (event.data !== window.YT.PlayerState.ENDED) return;
            const cue = activeCueRef.current;
            if (cue && CUES[cue].kind === 'loop') {
              event.target.seekTo(0);
              event.target.playVideo();
            }
          },
          onError: () => console.warn('[nfl-deal audio] YouTube embed failed for the current cue'),
        },
      });
    }

    if (window.YT?.Player) {
      initPlayer();
      return;
    }
    const prevReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prevReady?.();
      initPlayer();
    };
    if (!apiLoadStarted) {
      apiLoadStarted = true;
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(script);
    }
  }, []);

  function playCue(cueKey: CueKey) {
    const player = playerRef.current;
    if (!player) return;
    activeCueRef.current = cueKey;
    const cue = CUES[cueKey];
    // Passing startSeconds as part of the load call (rather than a separate
    // seekTo right after) avoids racing the video load -- calling seekTo
    // immediately after loadVideoById often loses to YouTube's own
    // "start playing from 0" default before the seek can take effect.
    if (cue.start != null) player.loadVideoById({ videoId: cue.videoId, startSeconds: cue.start });
    else player.loadVideoById(cue.videoId);
    player.unMute();
    player.setVolume(70);
    player.playVideo();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (cue.kind === 'oneshot') {
      timeoutRef.current = setTimeout(() => finishOneshot(cueKey), cueDurationMs(cueKey));
    }
  }

  function stopRing() {
    const ring = ringRef.current;
    if (!ring) return;
    ring.pause();
    ring.currentTime = 0;
    ring.onended = null;
  }

  function cancelBankOfferIntro() {
    bankOfferSequenceRef.current += 1;
    stopRing();
  }

  function finishOneshot(cueKey: CueKey) {
    playerRef.current?.pauseVideo();
    if (INTRO_SEQUENCE.includes(cueKey)) {
      if (queueRef.current.length > 0) {
        playCue(queueRef.current.shift()!);
      } else {
        setIntroDone(true);
      }
      return;
    }
    activeCueRef.current = null;
    // The good/bad elimination sting doubles as the final-outcome reveal
    // sound (see onReveal in NflDealEndScreen) -- once it finishes during
    // the finished phase, flip revealDone so the phase resolver above rolls
    // straight into the end-credits loop.
    if ((cueKey === 'goodElimination' || cueKey === 'badElimination') && phase === 'finished') {
      setRevealDone(true);
      return;
    }
    // The "deal, or no deal?" chant is a one-off sting -- once it's done,
    // an ambient loop (sized to how big this offer is) takes over
    // underneath the offer modal.
    if (cueKey === 'dealOrNoDealChant') {
      playCue(offerTier === 'big' ? 'bankOfferLarge' : 'bankOffer');
    }
  }

  // Lets a player who taps through a case reveal skip the suspense: jumps
  // the active oneshot to just before its payoff beat instead of replaying
  // it from the start, and still runs the normal completion logic (credits
  // hookup included) on the shortened timer.
  function skipCurrentCue() {
    const player = playerRef.current;
    const cueKey = activeCueRef.current;
    if (!player || !cueKey) return;
    const cue = CUES[cueKey];
    if (cue.kind !== 'oneshot' || cue.end == null) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const payoffLeadSeconds = SKIP_PAYOFF_LEAD_SECONDS[cueKey] ?? 1;
    const seekTarget = Math.max(cue.start ?? 0, cue.end - payoffLeadSeconds);
    player.seekTo(seekTarget, true);
    timeoutRef.current = setTimeout(() => finishOneshot(cueKey), payoffLeadSeconds * 1000);
  }

  // Triggered directly by the Deal/No Deal buttons, not by phase -- by the
  // time the caller's delayed state change lands (see NflDealOfferModal),
  // these cues' own timeouts have already wrapped them up, so the phase-
  // driven "silence on a non-audio phase" effect below doesn't cut them off
  // mid-clip (both a Deal and a No Deal change `phase` to something
  // resolvePhaseCue treats as silent).
  function playDealAccepted(tier: OfferTier) {
    if (!playerReady || muted) return;
    cancelBankOfferIntro();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    playCue(DEAL_ACCEPTED_CUE_BY_TIER[tier]);
  }

  function playNoDealAccepted() {
    if (!playerReady || muted) return;
    cancelBankOfferIntro();
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    playCue('noDealAccepted');
  }

  function startIntroSequence() {
    queueRef.current = INTRO_SEQUENCE.slice(1);
    playCue(INTRO_SEQUENCE[0]);
  }

  function startBankOfferSequence() {
    const sequenceId = bankOfferSequenceRef.current + 1;
    bankOfferSequenceRef.current = sequenceId;
    activeCueRef.current = offerTier === 'big' ? 'bankOfferLarge' : 'bankOffer'; // claim it now so this doesn't re-trigger on every render
    // A still-pending cleanup timeout from whatever cue played right before
    // this (e.g. an elimination sting) would otherwise fire later and stomp
    // activeCueRef back to null, breaking the loop-restart logic below.
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const ring = ringRef.current;
    if (!ring) {
      onBankOfferPromptReady?.();
      playCue('dealOrNoDealChant');
      return;
    }
    ring.volume = 0.8;
    let ringsPlayed = 0;
    const playNextRing = () => {
      if (bankOfferSequenceRef.current !== sequenceId) return;
      ringsPlayed += 1;
      if (ringsPlayed > BANK_RING_COUNT) {
        onBankOfferPromptReady?.();
        playCue('dealOrNoDealChant');
        return;
      }
      ring.currentTime = 0;
      ring.play().catch(() => {
        onBankOfferPromptReady?.();
        playCue('dealOrNoDealChant');
      }); // no ring file present -- just start the chant
    };
    ring.onended = playNextRing;
    playNextRing();
  }

  function skipBankOfferIntro() {
    const cueKey = activeCueRef.current;
    if (cueKey !== 'bankOffer' && cueKey !== 'bankOfferLarge') return;
    cancelBankOfferIntro();
    onBankOfferPromptReady?.();
    playCue('dealOrNoDealChant');
  }

  // Call any time -- safe to call repeatedly, never restarts a cue that's
  // already the right one. `enabled` (only true once the Start Game click
  // has fired) is what actually gates whether this does anything passively;
  // it can still be called directly from a click handler (unlockAndPlay,
  // the mute toggle) regardless of `enabled`, since a real click is its own
  // permission.
  function startForCurrentPhase() {
    if (phase === 'selecting-case' && !introDone) {
      if (activeCueRef.current == null || !INTRO_SEQUENCE.includes(activeCueRef.current)) startIntroSequence();
      return;
    }
    const desired = resolvePhaseCue(phase, introDone, revealDone, openingCasesCue, offerTier);
    if (!desired) {
      playerRef.current?.pauseVideo();
      cancelBankOfferIntro();
      activeCueRef.current = null;
      return;
    }
    if (activeCueRef.current === desired) return;
    if (desired === 'bankOffer' || desired === 'bankOfferLarge') {
      // Claim it immediately so a repeat call during the delay window
      // (re-renders, unmute, etc.) doesn't restart the wait.
      activeCueRef.current = desired;
      startBankOfferSequence();
    } else {
      playCue(desired);
    }
  }

  useEffect(() => {
    if (!enabled || !playerReady || muted) return;
    startForCurrentPhase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, phase, introDone, revealDone, playerReady, muted, openingCasesCue, offerTier]);

  useEffect(() => {
    if (!eliminationEvent || eliminationEvent.key === lastEliminationKeyRef.current) return;
    lastEliminationKeyRef.current = eliminationEvent.key;
    if (!enabled || !playerReady || muted) return;
    queueRef.current = [];
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    playCue(eliminationEvent.outcome === 'good' ? 'goodElimination' : 'badElimination');
  }, [eliminationEvent, enabled, playerReady, muted]);

  useImperativeHandle(ref, () => ({
    unlockAndPlay: () => {
      if (muted) {
        setMuted(false);
        window.localStorage.setItem(MUTE_STORAGE_KEY, 'false');
      }
      startForCurrentPhase();
    },
    skipCurrentCue,
    skipBankOfferIntro,
    playDealAccepted,
    playNoDealAccepted,
  }));

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    window.localStorage.setItem(MUTE_STORAGE_KEY, String(next));
    if (next) {
      playerRef.current?.pauseVideo();
      cancelBankOfferIntro();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }
    // Unmuting happens inside this click handler, so starting playback here
    // is a direct result of a user gesture and won't be autoplay-blocked.
    startForCurrentPhase();
  }

  return (
    <>
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? 'Unmute game sound' : 'Mute game sound'}
        aria-pressed={!muted}
        className="fixed right-4 top-20 z-40 flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-300 shadow-lg transition-colors hover:border-teal-400 hover:text-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
      >
        {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
      </button>
      <audio ref={ringRef} src={BANK_RING_SRC} preload="none" />
      {/* Audio only -- rendered fully off-screen so no video is ever visible. */}
      <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px' }} aria-hidden>
        <div ref={containerRef} />
      </div>
    </>
  );
});

NflDealAudioController.displayName = 'NflDealAudioController';

export default NflDealAudioController;
