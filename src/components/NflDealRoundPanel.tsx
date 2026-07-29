import { ROUND_SCHEDULE } from '@/lib/nflDeal/gameLogic';
import type { GameState } from '@/lib/nflDeal/types';

function statusFor(state: GameState): { title: string; detail: string | null } {
  switch (state.phase) {
    case 'selecting-case':
      return { title: 'Choose your case', detail: 'Pick one case to keep sealed for the rest of the game.' };
    case 'opening-cases': {
      const target = ROUND_SCHEDULE[state.roundIndex];
      const opened = state.casesOpenedThisRound.length;
      return {
        title: `Round ${state.roundIndex + 1} — open ${target} case${target === 1 ? '' : 's'}`,
        detail: `${opened} of ${target} opened`,
      };
    }
    case 'bank-offer':
      return { title: 'The Bank is calling', detail: 'Deal, or No Deal?' };
    case 'final-choice':
      return { title: 'Final decision', detail: 'One case left besides yours.' };
    case 'finished':
      return { title: 'Game over', detail: null };
    default:
      return { title: '', detail: null };
  }
}

export default function NflDealRoundPanel({ state }: { state: GameState }) {
  const { title, detail } = statusFor(state);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3">
      <p className="text-sm font-semibold text-slate-100">{title}</p>
      {detail && <p className="text-xs text-slate-400">{detail}</p>}
    </div>
  );
}
