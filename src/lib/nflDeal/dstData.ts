import { buildTeamBoard } from './playerData';

// Madden NFL 27 doesn't publish a single explicit "team defense overall,"
// so this is a proxy on the same 0-99 scale: each team's average OVR across
// its top 4 rated defenders (DL/Edge/LB/DB combined). Reflects the 2026
// Myles Garrett trade (Cleveland -> Rams for Jared Verse + picks).
const RAW_BOARD: Array<[name: string, ovr: number, espnAbbrev: string]> = [
  ['Pittsburgh Steelers', 93, 'pit'],
  ['Baltimore Ravens', 92, 'bal'],
  ['Houston Texans', 91, 'hou'],
  ['Los Angeles Rams', 91, 'lar'],
  ['Denver Broncos', 91, 'den'],
  ['Detroit Lions', 91, 'det'],
  ['San Francisco 49ers', 89, 'sf'],
  ['Green Bay Packers', 89, 'gb'],
  ['Indianapolis Colts', 89, 'ind'],
  ['New England Patriots', 89, 'ne'],
  ['Kansas City Chiefs', 88, 'kc'],
  ['Philadelphia Eagles', 88, 'phi'],
  ['Carolina Panthers', 88, 'car'],
  ['Seattle Seahawks', 88, 'sea'],
  ['Cleveland Browns', 86, 'cle'],
  ['New York Jets', 86, 'nyj'],
  ['Los Angeles Chargers', 86, 'lac'],
  ['Cincinnati Bengals', 86, 'cin'],
  ['Tampa Bay Buccaneers', 85, 'tb'],
  ['Atlanta Falcons', 85, 'atl'],
  ['Chicago Bears', 85, 'chi'],
  ['Las Vegas Raiders', 85, 'lv'],
  ['Dallas Cowboys', 85, 'dal'],
  ['Jacksonville Jaguars', 84, 'jax'],
  ['New York Giants', 84, 'nyg'],
  ['Buffalo Bills', 84, 'buf'],
  ['Arizona Cardinals', 84, 'ari'],
  ['Minnesota Vikings', 83, 'min'],
  ['Tennessee Titans', 83, 'ten'],
  ['Miami Dolphins', 83, 'mia'],
  ['New Orleans Saints', 83, 'no'],
  ['Washington Commanders', 82, 'wsh'],
];

export const DST_BOARD = buildTeamBoard(RAW_BOARD);
