import { ROUND_SCHEDULE } from '@/lib/nflDeal/gameLogic';
import type { GameState } from '@/lib/nflDeal/types';

function statusFor(state: GameState): { eyebrow: string; headline: string } {
  switch (state.phase) {
    case 'selecting-case':
      return { eyebrow: 'Get ready', headline: 'Choose your case' };
    case 'opening-cases': {
      const target = ROUND_SCHEDULE[state.roundIndex];
      const opened = state.casesOpenedThisRound.length;
      const remaining = target - opened;
      return {
        eyebrow: `Round ${state.roundIndex + 1}`,
        headline: `Open ${remaining} more case${remaining === 1 ? '' : 's'}`,
      };
    }
    case 'bank-offer':
      return { eyebrow: 'The Bank is calling', headline: 'Deal, or No Deal?' };
    case 'final-choice':
      return { eyebrow: 'Final decision', headline: 'One case left besides yours' };
    case 'finished':
      return { eyebrow: '', headline: 'Game over' };
    default:
      return { eyebrow: '', headline: '' };
  }
}

export default function NflDealRoundPanel({ state }: { state: GameState }) {
  const { eyebrow, headline } = statusFor(state);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-4">
      {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-400/90">{eyebrow}</p>}
      <p className="mt-1 text-2xl font-black text-white sm:text-3xl">{headline}</p>
    </div>
  );
}
