import { RATING_SOURCE_OFFICIAL, buildBoard } from './playerData';

// Best RB per team, current Madden NFL 27 OVR + ESPN athlete ID (all IDs
// verified against real headshots, not just name matches). Reflects several
// real 2026 offseason moves: Kenneth Walker III (SEA->KC), Rico Dowdle
// (CAR->PIT), Travis Etienne Jr (JAX->NO). Minnesota and Washington were
// near-ties resolved in favor of the confirmed 2026 depth-chart starter.
const RAW_BOARD: Array<[name: string, ovr: number, espnId: string, ratingSource?: string]> = [
  ['Jahmyr Gibbs', 98, '4429795', RATING_SOURCE_OFFICIAL],
  ['Christian McCaffrey', 97, '3117251', RATING_SOURCE_OFFICIAL],
  ['Jonathan Taylor', 96, '4242335', RATING_SOURCE_OFFICIAL],
  ['Bijan Robinson', 95, '4430807', RATING_SOURCE_OFFICIAL],
  ['James Cook III', 94, '4379399', RATING_SOURCE_OFFICIAL],
  ['Derrick Henry', 93, '3043078', RATING_SOURCE_OFFICIAL],
  ['Saquon Barkley', 92, '3929630', RATING_SOURCE_OFFICIAL],
  ['Josh Jacobs', 91, '4047365', RATING_SOURCE_OFFICIAL],
  ['Kenneth Walker III', 90, '4567048', RATING_SOURCE_OFFICIAL],
  ['Kyren Williams', 89, '4430737', RATING_SOURCE_OFFICIAL],
  ["De'Von Achane", 87, '4429160'],
  ['Travis Etienne Jr', 87, '4239996'],
  ['Breece Hall', 86, '4427366'],
  ['Bucky Irving', 86, '4596448'],
  ["D'Andre Swift", 85, '4259545'],
  ['Javonte Williams', 85, '4361579'],
  ['David Montgomery', 84, '4035538'],
  ['Rico Dowdle', 84, '4038815'],
  ['Ashton Jeanty', 83, '4890973'],
  ['J.K. Dobbins', 83, '4241985'],
  ['James Conner', 83, '3045147'],
  ['Tony Pollard', 83, '3916148'],
  ['Chase Brown', 82, '4362238'],
  ['TreVeyon Henderson', 82, '4432710'],
  ['Zach Charbonnet', 82, '4426385'],
  ['Cam Skattebo', 81, '4696981'],
  ['Chuba Hubbard', 81, '4241416'],
  ['Omarion Hampton', 81, '4685382'],
  ['Quinshon Judkins', 81, '4685702'],
  ['Aaron Jones Sr', 80, '3042519'],
  ['Jacory Croskey-Merritt', 78, '4575131'],
  ['Bhayshul Tuten', 76, '4882093'],
];

export const RB_BOARD = buildBoard(RAW_BOARD);
