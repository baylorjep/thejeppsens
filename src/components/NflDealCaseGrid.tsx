import NflDealCaseTile from './NflDealCaseTile';
import type { CaseState, GamePhase } from '@/lib/nflDeal/types';

interface Props {
  cases: CaseState[];
  phase: GamePhase;
  playerCaseNumber: number | null;
  currentRoundOpenedNumbers: number[];
  locked: boolean;
  onOpen: (caseNumber: number) => void;
}

export default function NflDealCaseGrid({ cases, phase, playerCaseNumber, currentRoundOpenedNumbers, locked, onOpen }: Props) {
  const casesAreClickable = !locked && (phase === 'selecting-case' || phase === 'opening-cases');
  // Cases opened earlier in an already-finished round drop off the board;
  // everything opened so far *this* round stays up until the round actually
  // ends (the Bank calls), so you can see your progress through the round.
  const currentRoundOpenedSet = new Set(currentRoundOpenedNumbers);
  const boardCases = cases.filter(
    (c) => c.number !== playerCaseNumber && (c.status !== 'opened' || currentRoundOpenedSet.has(c.number)),
  );

  return (
    // Flexbox + wrap instead of CSS grid: a grid always left-pads a partial
    // last row (e.g. 13 cases at 6/row leaves 1 case stranded on the far
    // left of an otherwise-empty row). Flex-wrap justifies each wrapped row
    // independently, so a partial row centers itself instead.
    <div
      role="group"
      aria-label="Briefcases"
      className="flex flex-wrap justify-center gap-2 sm:gap-3"
    >
      {boardCases.map((caseState) => (
        <div key={caseState.number} className="w-[calc(25%-6px)] sm:w-[calc(16.6667%-10px)]">
          <NflDealCaseTile
            caseState={caseState}
            clickable={casesAreClickable && caseState.status === 'available'}
            onOpen={onOpen}
          />
        </div>
      ))}
    </div>
  );
}
