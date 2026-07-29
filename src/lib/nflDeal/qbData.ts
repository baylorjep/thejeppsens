import { buildBoard } from './playerData';

export { espnHeadshotUrl } from './playerData';

// Starter board: 32 QBs ranked by (roughly) Madden overall.
// espnId powers the case-reveal headshot (see espnHeadshotUrl in playerData).
const RAW_BOARD: Array<[name: string, ovr: number, espnId: string]> = [
  ['Josh Allen', 99, '3918298'],
  ['Matthew Stafford', 98, '12483'],
  ['Joe Burrow', 96, '3915511'],
  ['Lamar Jackson', 94, '3916387'],
  ['Drake Maye', 93, '4431452'],
  ['Patrick Mahomes', 92, '3139477'],
  ['Dak Prescott', 91, '2577417'],
  ['Justin Herbert', 89, '4038941'],
  ['Jared Goff', 88, '3046779'],
  ['Jordan Love', 87, '4036378'],
  ['Brock Purdy', 86, '4361741'],
  ['Caleb Williams', 85, '4431611'],
  ['Sam Darnold', 85, '3912547'],
  ['Baker Mayfield', 84, '3052587'],
  ['Jalen Hurts', 83, '4040715'],
  ['Trevor Lawrence', 82, '4360310'],
  ['Bo Nix', 81, '4426338'],
  ['Aaron Rodgers', 80, '8439'],
  ['Jayden Daniels', 79, '4426348'],
  ['Bryce Young', 78, '4685720'],
  ['Daniel Jones', 78, '3917792'],
  ['C.J. Stroud', 77, '4432577'],
  ['Tyler Shough', 77, '4360689'],
  ['Jaxson Dart', 76, '4689114'],
  ['Philip Rivers', 76, '5529'],
  ['Jacoby Brissett', 75, '2578570'],
  ['Kyler Murray', 75, '3917315'],
  ['Mac Jones', 74, '4241464'],
  ['Tua Tagovailoa', 74, '4241479'],
  ['Cam Ward', 73, '4688380'],
  ['Joe Flacco', 73, '11252'],
  ['Kirk Cousins', 73, '14880'],
];

export const QB_BOARD = buildBoard(RAW_BOARD);
