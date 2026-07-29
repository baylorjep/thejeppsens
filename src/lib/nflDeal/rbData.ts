import { buildBoard } from './playerData';

// Best RB per team, current Madden OVR + ESPN athlete ID. IDs verified
// against ESPN's search API; a few OVRs are informed estimates where the
// player wasn't in the source's Top-100 (see rbData research notes).
const RAW_BOARD: Array<[name: string, ovr: number, espnId: string]> = [
  ['Jahmyr Gibbs', 98, '4429795'],
  ['Christian McCaffrey', 96, '3117251'],
  ['Jonathan Taylor', 96, '4242335'],
  ['Bijan Robinson', 95, '4430807'],
  ['Derrick Henry', 94, '3043078'],
  ['James Cook III', 93, '4379399'],
  ['Saquon Barkley', 92, '3929630'],
  ['Josh Jacobs', 91, '4047365'],
  ['Kenneth Walker III', 90, '4567048'],
  ['Kyren Williams', 89, '4430737'],
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
  ['Cam Skattebo', 81, '4696981'],
  ['Chuba Hubbard', 81, '4241416'],
  ['Jordan Mason', 81, '4360569'],
  ['Omarion Hampton', 81, '4685382'],
  ['Quinshon Judkins', 81, '4685702'],
  ['Jacory Croskey-Merritt', 78, '4575131'],
  ['Bhayshul Tuten', 76, '4882093'],
  ['Kareem Hunt', 75, '3059915'],
];

export const RB_BOARD = buildBoard(RAW_BOARD);
