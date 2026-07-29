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

const CUES = {
  intro: { videoId: 'A8430xpRh8o', label: 'Intro', kind: 'oneshot' as const, maxMs: 6000 },
  caseSelection: { videoId: '_V6eu74Cm6s', label: 'Choosing a case', kind: 'loop' as const },
  bankOffer: { videoId: '2wo6bN035RI', label: "Banker's offer", kind: 'loop' as const },
  reveal: { videoId: 'ogJj9pX8Pvs', label: 'Reveal', kind: 'oneshot' as const, maxMs: 5000 },
  credits: { videoId: 'A8430xpRh8o', label: 'Credits', kind: 'loop' as const },
};
type CueKey = keyof typeof CUES;

function resolveCue(phase: GamePhase, introDone: boolean, revealDone: boolean): CueKey | null {
  if (phase === 'selecting-case') return introDone ? 'caseSelection' : 'intro';
  if (phase === 'bank-offer' || phase === 'final-choice') return 'bankOffer';
  if (phase === 'finished') return revealDone ? 'credits' : 'reveal';
  return null; // silent while opening cases each round
}

const MUTE_STORAGE_KEY = 'nfl-deal-or-no-deal:muted';
let apiLoadStarted = false;

export default function NflDealAudioController({ phase }: { phase: GamePhase }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const activeCueRef = useRef<CueKey | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPhaseRef = useRef(phase);

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
    prevPhaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    function initPlayer() {
      if (!containerRef.current || playerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '90',
        width: '160',
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

  const desiredCue = resolveCue(phase, introDone, revealDone);

  function playCue(cueKey: CueKey) {
    const player = playerRef.current;
    if (!player) return;
    activeCueRef.current = cueKey;
    const cue = CUES[cueKey];
    player.loadVideoById(cue.videoId);
    player.unMute();
    player.setVolume(70);
    player.playVideo();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (cue.kind === 'oneshot') {
      timeoutRef.current = setTimeout(() => {
        if (cueKey === 'intro') setIntroDone(true);
        if (cueKey === 'reveal') setRevealDone(true);
      }, cue.maxMs);
    }
  }

  useEffect(() => {
    if (!playerReady || muted) return;
    if (!desiredCue) {
      playerRef.current?.pauseVideo();
      activeCueRef.current = null;
      return;
    }
    if (activeCueRef.current === desiredCue) return;
    playCue(desiredCue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desiredCue, playerReady, muted]);

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    window.localStorage.setItem(MUTE_STORAGE_KEY, String(next));
    if (next) {
      playerRef.current?.pauseVideo();
    } else if (desiredCue) {
      // Unmuting happens inside this click handler, so starting playback
      // here is a direct result of a user gesture and won't be blocked.
      playCue(desiredCue);
    }
  }

  return (
    <>
      <div className="fixed right-4 top-20 z-40 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute game sound' : 'Mute game sound'}
          aria-pressed={!muted}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-slate-900/90 text-slate-300 shadow-lg transition-colors hover:border-teal-400 hover:text-teal-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
        >
          {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
        </button>
        <div className={muted ? 'hidden' : 'overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-xl'}>
          {!muted && desiredCue && (
            <p className="bg-slate-800 px-2 py-1 text-center text-[10px] font-medium text-slate-400">
              {CUES[desiredCue].label}
            </p>
          )}
          <div ref={containerRef} />
        </div>
      </div>
    </>
  );
}
