import { RATING_SOURCE_OFFICIAL, buildBoard } from './playerData';

// Best TE per team, current Madden NFL 27 OVR + ESPN athlete ID. Uses
// official Madden NFL 27 reveals where available, then MaddenRatings-listed
// OVRs for unrevealed players. Reflects a real 2026 free-agent move: David
// Njoku signed with the Chargers, so Cleveland's TE1 is now rookie Harold
// Fannin Jr.
const RAW_BOARD: Array<[name: string, ovr: number, espnId: string, ratingSource?: string]> = [
  ['Kyle Pitts Sr.', 99, '4360248'],
  ['Trey McBride', 99, '4361307', RATING_SOURCE_OFFICIAL],
  ['George Kittle', 98, '3040151'],
  ['Brock Bowers', 93, '4432665'],
  ['Mark Andrews', 91, '3116365'],
  ['Travis Kelce', 90, '15847'],
  ['Dallas Goedert', 88, '3121023'],
  ['Sam LaPorta', 87, '4430027'],
  ['Hunter Henry', 86, '3046439'],
  ['Tucker Kraft', 85, '4572680'],
  ['Colston Loveland', 84, '4723086'],
  ['Dalton Schultz', 84, '3117256'],
  ['T.J. Hockenson', 83, '4036133'],
  ['Tyler Warren', 83, '4431459'],
  ['Jake Ferguson', 82, '4242355'],
  ['Dalton Kincaid', 81, '4385690'],
  ['David Njoku', 81, '3123076'],
  ['Harold Fannin Jr.', 80, '5083076'],
  ['Juwan Johnson', 79, '3929645'],
  ['Pat Freiermuth', 79, '4361411'],
  ['Evan Engram', 78, '3051876'],
  ['Brenton Strange', 77, '4430539'],
  ['Mike Gesicki', 77, '3116164'],
  ['Theo Johnson', 77, '4429148'],
  ['Chigoziem Okonkwo', 76, '4360635'],
  ['A.J. Barner', 75, '4576297'],
  ['Cade Otton', 75, '4243331'],
  ['Mason Taylor', 74, '4808766'],
  ['Colby Parkinson', 73, '4242557'],
  ['Tommy Tremble', 72, '4372780'],
  ['Daniel Bellinger', 71, '4361516'],
  ['Greg Dulcich', 70, '4367209'],
];

export const TE_BOARD = buildBoard(RAW_BOARD);
