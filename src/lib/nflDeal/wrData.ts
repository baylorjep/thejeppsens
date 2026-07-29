import { buildBoard } from './playerData';

// Best WR per team, current Madden OVR + ESPN athlete ID. IDs verified
// against ESPN's search API; a few OVRs are informed estimates where the
// player wasn't in the source's Top-100 (see wrData research notes).
const RAW_BOARD: Array<[name: string, ovr: number, espnId: string]> = [
  ["Ja'Marr Chase", 99, '4362628'],
  ['Justin Jefferson', 99, '4262921'],
  ['Puka Nacua', 97, '4426515'],
  ['Amon-Ra St. Brown', 96, '4374302'],
  ['Tyreek Hill', 95, '3116406'],
  ['Jaxon Smith-Njigba', 95, '4430878'],
  ['Terry McLaurin', 94, '3121422'],
  ['CeeDee Lamb', 93, '4241389'],
  ['A.J. Brown', 93, '4047646'],
  ['Mike Evans', 93, '16737'],
  ['Drake London', 91, '4426502'],
  ['Nico Collins', 89, '4258173'],
  ['Zay Flowers', 88, '4429615'],
  ['Stefon Diggs', 87, '2976212'],
  ['Chris Olave', 87, '4361370'],
  ['Courtland Sutton', 87, '3128429'],
  ['Garrett Wilson', 87, '4569618'],
  ['Malik Nabers', 86, '4595348'],
  ['Rashee Rice', 85, '4428331'],
  ['DK Metcalf', 85, '4047650'],
  ['Brandon Aiyuk', 84, '4360438'],
  ['Michael Pittman Jr', 84, '4035687'],
  ['Ladd McConkey', 83, '4612826'],
  ['Tetairoa McMillan', 83, '4685472'],
  ['Rome Odunze', 82, '4431299'],
  ['Travis Hunter', 82, '4685415'],
  ['Marvin Harrison Jr', 82, '4432708'],
  ['Jerry Jeudy', 81, '4241463'],
  ['Jayden Reed', 80, '4362249'],
  ['Khalil Shakir', 79, '4373678'],
  ['Calvin Ridley', 78, '3925357'],
  ['Tre Tucker', 78, '4428718'],
];

export const WR_BOARD = buildBoard(RAW_BOARD);
