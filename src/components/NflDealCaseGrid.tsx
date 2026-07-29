import NflDealCaseTile from './NflDealCaseTile';
import type { CaseState, GamePhase } from '@/lib/nflDeal/types';

interface Props {
  cases: CaseState[];
  phase: GamePhase;
  playerCaseNumber: number | null;
  activeRevealNumber: number | null;
  locked: boolean;
  onOpen: (caseNumber: number) => void;
}

export default function NflDealCaseGrid({ cases, phase, playerCaseNumber, activeRevealNumber, locked, onOpen }: Props) {
  const casesAreClickable = !locked && (phase === 'selecting-case' || phase === 'opening-cases');
  // Opened cases drop off the board once their reveal popup has been shown,
  // so the grid only keeps showing what's still worth deciding on.
  const boardCases = cases.filter(
    (c) => c.number !== playerCaseNumber && (c.status !== 'opened' || c.number === activeRevealNumber),
  );

  return (
    <div
      role="group"
      aria-label="Briefcases"
      className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3"
    >
      {boardCases.map((caseState) => (
        <NflDealCaseTile
          key={caseState.number}
          caseState={caseState}
          clickable={casesAreClickable && caseState.status === 'available'}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
