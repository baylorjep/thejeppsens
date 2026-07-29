'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import type { GamePhase } from '@/lib/nflDeal/types';

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
  loadVideoById: (id: string) => void;
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
  'introReady' | 'introMonologue' | 'pickCasePrompt' | 'caseSelection' | 'bankOffer' | 'reveal' | 'credits' | 'goodElimination' | 'badElimination',
  CueDef
> = {
  introReady: { videoId: '7onGy0GiMtE', start: 38, end: 43, kind: 'oneshot' },
  introMonologue: { videoId: '7onGy0GiMtE', start: 46, end: 82, kind: 'oneshot' },
  pickCasePrompt: { videoId: '7onGy0GiMtE', start: 105, end: 109, kind: 'oneshot' },
  caseSelection: { videoId: '_V6eu74Cm6s', kind: 'loop' },
  bankOffer: { videoId: '2wo6bN035RI', kind: 'loop' },
  reveal: { videoId: 'ogJj9pX8Pvs', kind: 'oneshot' },
  credits: { videoId: 'A8430xpRh8o', kind: 'loop' },
  goodElimination: { videoId: 'jrEriKj1C44', start: 185, end: 189, kind: 'oneshot' },
  badElimination: { videoId: 'jrEriKj1C44', start: 209, end: 215, kind: 'oneshot' },
};
type CueKey = keyof typeof CUES;

const INTRO_SEQUENCE: CueKey[] = ['introReady', 'introMonologue', 'pickCasePrompt'];
const DEFAULT_ONESHOT_MS = 5000; // fallback for cues without an explicit start/end (e.g. `reveal`)

function cueDurationMs(key: CueKey): number {
  const cue = CUES[key];
  return cue.start != null && cue.end != null ? (cue.end - cue.start) * 1000 : DEFAULT_ONESHOT_MS;
}

function resolvePhaseCue(phase: GamePhase, introDone: boolean, revealDone: boolean): CueKey | null {
  if (phase === 'selecting-case') return introDone ? 'caseSelection' : null; // intro sequence handles this until done
  if (phase === 'bank-offer' || phase === 'final-choice') return 'bankOffer';
  if (phase === 'finished') return revealDone ? 'credits' : 'reveal';
  return null; // silent while opening cases each round
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

export default function NflDealAudioController({
  phase,
  eliminationEvent,
}: {
  phase: GamePhase;
  eliminationEvent: EliminationEvent | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLAudioElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const activeCueRef = useRef<CueKey | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queueRef = useRef<CueKey[]>([]);
  const lastEliminationKeyRef = useRef(0);

  const [playerReady, setPlayerReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const [introDone, setIntroDone] = useState(false);
  const [revealDone, setRevealDone] = useState(false);

  useEffect(() => {
    setMuted(window.localStorage.getItem(MUTE_STORAGE_KEY) !== 'false');
  }, []);

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
    player.loadVideoById(cue.videoId);
    if (cue.start != null) player.seekTo(cue.start, true);
    player.unMute();
    player.setVolume(70);
    player.playVideo();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (cue.kind === 'oneshot') {
      timeoutRef.current = setTimeout(() => {
        player.pauseVideo();
        if (INTRO_SEQUENCE.includes(cueKey)) {
          if (queueRef.current.length > 0) {
            playCue(queueRef.current.shift()!);
          } else {
            setIntroDone(true);
          }
        } else if (cueKey === 'reveal') {
          setRevealDone(true);
        } else {
          activeCueRef.current = null;
        }
      }, cueDurationMs(cueKey));
    }
  }

  function startIntroSequence() {
    queueRef.current = INTRO_SEQUENCE.slice(1);
    playCue(INTRO_SEQUENCE[0]);
  }

  function startBankOfferSequence() {
    activeCueRef.current = 'bankOffer'; // claim it now so this doesn't re-trigger on every render
    const ring = ringRef.current;
    if (!ring) {
      playCue('bankOffer');
      return;
    }
    ring.currentTime = 0;
    ring.volume = 0.8;
    ring.onended = () => playCue('bankOffer');
    ring.play().catch(() => playCue('bankOffer')); // no ring file present -- just start the loop
  }

  useEffect(() => {
    if (!playerReady || muted) return;
    if (phase === 'selecting-case' && !introDone) {
      if (activeCueRef.current == null || !INTRO_SEQUENCE.includes(activeCueRef.current)) startIntroSequence();
      return;
    }
    const desired = resolvePhaseCue(phase, introDone, revealDone);
    if (!desired) {
      playerRef.current?.pauseVideo();
      ringRef.current?.pause();
      activeCueRef.current = null;
      return;
    }
    if (activeCueRef.current === desired) return;
    if (desired === 'bankOffer') startBankOfferSequence();
    else playCue(desired);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, introDone, revealDone, playerReady, muted]);

  useEffect(() => {
    if (!eliminationEvent || eliminationEvent.key === lastEliminationKeyRef.current) return;
    lastEliminationKeyRef.current = eliminationEvent.key;
    if (!playerReady || muted) return;
    queueRef.current = [];
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    playCue(eliminationEvent.outcome === 'good' ? 'goodElimination' : 'badElimination');
  }, [eliminationEvent, playerReady, muted]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    window.localStorage.setItem(MUTE_STORAGE_KEY, String(next));
    if (next) {
      playerRef.current?.pauseVideo();
      ringRef.current?.pause();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }
    // Unmuting happens inside this click handler, so starting playback here
    // is a direct result of a user gesture and won't be autoplay-blocked.
    if (phase === 'selecting-case' && !introDone) {
      startIntroSequence();
      return;
    }
    const desired = resolvePhaseCue(phase, introDone, revealDone);
    if (desired === 'bankOffer') startBankOfferSequence();
    else if (desired) playCue(desired);
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
}
