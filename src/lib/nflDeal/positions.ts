import { QB_BOARD } from './qbData';
import { RB_BOARD } from './rbData';
import { WR_BOARD } from './wrData';
import { TE_BOARD } from './teData';
import { DST_BOARD } from './dstData';
import type { Player, PositionId } from './types';

export interface PositionConfig {
  id: PositionId;
  label: string;
  shortLabel: string;
  pluralLabel: string;
  board: Player[];
}

export const POSITIONS: Record<PositionId, PositionConfig> = {
  QB: { id: 'QB', label: 'Quarterback', shortLabel: 'QB', pluralLabel: 'QBs', board: QB_BOARD },
  RB: { id: 'RB', label: 'Running Back', shortLabel: 'RB', pluralLabel: 'RBs', board: RB_BOARD },
  WR: { id: 'WR', label: 'Wide Receiver', shortLabel: 'WR', pluralLabel: 'WRs', board: WR_BOARD },
  TE: { id: 'TE', label: 'Tight End', shortLabel: 'TE', pluralLabel: 'TEs', board: TE_BOARD },
  DST: { id: 'DST', label: 'Defense', shortLabel: 'D/ST', pluralLabel: 'Defenses', board: DST_BOARD },
};

export const DYNASTY_POSITIONS: PositionId[] = ['QB', 'RB', 'WR', 'TE', 'DST'];
