import { buildBoard } from './playerData';

export { espnHeadshotUrl } from './playerData';

// Starter board: current QB1 for each of the 32 NFL teams. Uses official
// Madden NFL 27 reveals where available, then MaddenRatings-listed OVRs for
// unrevealed players. Kansas City kept as Mahomes (Madden's rated QB1 and the
// long-term starter) even though Justin Fields is projected to open the
// 2026 season while Mahomes rehabs a torn ACL/LCL.
// espnId powers the case-reveal headshot (see espnHeadshotUrl in playerData).
const RAW_BOARD: Array<[name: string, ovr: number, espnId: string]> = [
  ['Josh Allen', 99, '3918298'],
  ['Matthew Stafford', 99, '12483'],
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
  ['Jacoby Brissett', 75, '2578570'],
  ['Kyler Murray', 75, '3917315'],
  ['Tua Tagovailoa', 74, '4241479'],
  ['Cameron Ward', 73, '4688380'],
  ['Kirk Cousins', 73, '14880'],
  ['Malik Willis', 71, '4242512'],
  ['Geno Smith', 70, '15864'],
  ['Deshaun Watson', 69, '3122840'],
];

export const QB_BOARD = buildBoard(RAW_BOARD);
