import NflDealCaseTile from './NflDealCaseTile';
import type { CaseState, GamePhase } from '@/lib/nflDeal/types';

interface Props {
  cases: CaseState[];
  phase: GamePhase;
  playerCaseNumber: number | null;
  onOpen: (caseNumber: number) => void;
}

export default function NflDealCaseGrid({ cases, phase, playerCaseNumber, onOpen }: Props) {
  const casesAreClickable = phase === 'selecting-case' || phase === 'opening-cases';
  const boardCases = cases.filter((c) => c.number !== playerCaseNumber);

  return (
    <div
      role="group"
      aria-label="Briefcases"
      className="grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-3 md:grid-cols-8"
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
