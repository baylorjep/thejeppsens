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

// The board's tumble-in entrance spreads across this whole window instead
// of a quick stagger, so it has real presence during the intro's dead air.
export const ENTRANCE_SPREAD_MS = 10000;
// Each tile's own animate-case-tumble-in animation (see globals.css) on top
// of its staggered start -- the last tile to begin is still animating for
// this long after the stagger window ends.
const TILE_ANIMATION_MS = 800;
export const BOARD_ENTRANCE_TOTAL_MS = ENTRANCE_SPREAD_MS + TILE_ANIMATION_MS;

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
      {boardCases.map((caseState, index) => (
        <div key={caseState.number} className="w-[calc(25%-6px)] sm:w-[calc(16.6667%-10px)]">
          <NflDealCaseTile
            caseState={caseState}
            clickable={casesAreClickable && caseState.status === 'available'}
            enterDelayMs={
              caseState.status === 'available' ? Math.round((index / Math.max(boardCases.length - 1, 1)) * ENTRANCE_SPREAD_MS) : undefined
            }
            onOpen={onOpen}
          />
        </div>
      ))}
    </div>
  );
}
