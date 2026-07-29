import { RATING_SOURCE_OFFICIAL, buildBoard } from './playerData';

// Best WR per team, current Madden NFL 27 OVR + ESPN athlete ID. Uses
// official Madden NFL 27 reveals where available, then MaddenRatings-listed
// OVRs for unrevealed players. Reflects real 2026 offseason moves/depth-chart
// shifts vs last cycle -- e.g. Mike Evans (TB->SF), A.J. Brown (PHI->NE). Two
// judgment calls where the roster's top-two were within 1 OVR point:
// Jacksonville's Travis Hunter kept over Jakobi Meyers (both 82) for relevance
// as the team's headline rookie; Arizona's Michael Wilson (81) edges Marvin
// Harrison Jr (80) on rating alone despite MHJ's higher profile.
const RAW_BOARD: Array<[name: string, ovr: number, espnId: string, ratingSource?: string]> = [
  ["Ja'Marr Chase", 99, '4362628'],
  ['Jaxon Smith-Njigba', 99, '4430878', RATING_SOURCE_OFFICIAL],
  ['Puka Nacua', 97, '4426515'],
  ['Amon-Ra St. Brown', 96, '4374302'],
  ['Justin Jefferson', 94, '4262921'],
  ['CeeDee Lamb', 93, '4241389'],
  ['Drake London', 92, '4426502'],
  ['DeVonta Smith', 91, '4241478'],
  ['Mike Evans', 91, '16737'],
  ['Terry McLaurin', 90, '3121422'],
  ['A.J. Brown', 89, '4047646'],
  ['Nico Collins', 89, '4258173'],
  ['Zay Flowers', 88, '4429615'],
  ['Chris Olave', 87, '4361370'],
  ['Courtland Sutton', 87, '3128429'],
  ['Garrett Wilson', 86, '4569618'],
  ['Malik Nabers', 86, '4595348'],
  ['DK Metcalf', 85, '4047650'],
  ['D.J. Moore', 85, '3915416'],
  ['Rashee Rice', 85, '4428331'],
  ['Alec Pierce', 84, '4360078'],
  ['Ladd McConkey', 83, '4612826'],
  ['Tetairoa McMillan', 83, '4685472'],
  ["Wan'Dale Robinson", 83, '4569587'],
  ['Chris Godwin Jr', 82, '3116165'],
  ['Travis Hunter', 82, '4685415'],
  ['Rome Odunze', 82, '4431299'],
  ['Jerry Jeudy', 81, '4241463'],
  ['Michael Wilson', 81, '4360761'],
  ['Jayden Reed', 80, '4362249'],
  ['Tre Tucker', 78, '4428718'],
  ['Tutu Atwell', 75, '4360797'],
];

export const WR_BOARD = buildBoard(RAW_BOARD);
