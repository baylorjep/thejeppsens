// Pools for the "Just for fun" cards on the insights page. Each card picks one at random per
// page load. Sizes are everyday-approximate ("about"), chosen to be fun rather than exact.

export type CountedUnit = { singular: string; plural: string; note: string };
export type RuntimeUnit = CountedUnit & { minutes: number; since?: Date };

export const WEIGHT_UNITS: (CountedUnit & { pounds: number })[] = [
  { singular: "bowling ball", plural: "bowling balls", pounds: 12, note: "12 lb each" },
  { singular: "can of Dr Pepper", plural: "cans of Dr Pepper", pounds: 0.82, note: "12 fl oz cans" },
  { singular: "McDonald's buffalo sauce packet", plural: "McDonald's buffalo sauce packets", pounds: 0.03, note: "about half an ounce each" },
  { singular: "koala", plural: "koalas", pounds: 20, note: "about 20 lb each" },
  { singular: "gallon of milk", plural: "gallons of milk", pounds: 8.6, note: "8.6 lb each" },
  { singular: "Thanksgiving turkey", plural: "Thanksgiving turkeys", pounds: 15, note: "about 15 lb each" },
  { singular: "NFL football", plural: "NFL footballs", pounds: 0.9, note: "about 14 oz each" },
  { singular: "school bus", plural: "school buses", pounds: 25000, note: "about 25,000 lb each" },
  { singular: "African elephant", plural: "African elephants", pounds: 13000, note: "about 13,000 lb each" },
  { singular: "blue whale", plural: "blue whales", pounds: 300000, note: "about 300,000 lb each" },
];

export const VALUE_UNITS: (CountedUnit & { dollars: number })[] = [
  { singular: "bowling ball", plural: "bowling balls", dollars: 50, note: "$50 each" },
  { singular: "Costco hot dog combo", plural: "Costco hot dog combos", dollars: 1.5, note: "$1.50 each" },
  { singular: "Big Mac", plural: "Big Macs", dollars: 6, note: "about $6 each" },
  { singular: "movie ticket", plural: "movie tickets", dollars: 12, note: "about $12 each" },
  { singular: "month of Netflix", plural: "months of Netflix", dollars: 15, note: "about $15 a month" },
  { singular: "Disneyland day ticket", plural: "Disneyland day tickets", dollars: 150, note: "about $150 each" },
  { singular: "PlayStation 5", plural: "PlayStation 5s", dollars: 500, note: "about $500 each" },
  { singular: "iPhone", plural: "iPhones", dollars: 800, note: "about $800 each" },
  { singular: "Toyota Camry", plural: "Toyota Camrys", dollars: 28000, note: "about $28,000 each" },
  // Trips for two, flights and a week on the ground, rough and rounded.
  { singular: "trip for two to Mexico", plural: "trips for two to Mexico", dollars: 3000, note: "about $3,000" },
  { singular: "trip for two to Costa Rica", plural: "trips for two to Costa Rica", dollars: 5500, note: "about $5,500" },
  { singular: "trip for two to Iceland", plural: "trips for two to Iceland", dollars: 6500, note: "about $6,500" },
  { singular: "trip for two to Thailand", plural: "trips for two to Thailand", dollars: 6500, note: "about $6,500" },
  { singular: "trip for two to Portugal", plural: "trips for two to Portugal", dollars: 6000, note: "about $6,000" },
  { singular: "trip for two to Ireland", plural: "trips for two to Ireland", dollars: 7000, note: "about $7,000" },
  { singular: "trip for two to Japan", plural: "trips for two to Japan", dollars: 7500, note: "about $7,500" },
  { singular: "trip for two to Italy", plural: "trips for two to Italy", dollars: 8000, note: "about $8,000" },
  { singular: "trip for two to Greece", plural: "trips for two to Greece", dollars: 7500, note: "about $7,500" },
  { singular: "trip for two to Spain", plural: "trips for two to Spain", dollars: 7000, note: "about $7,000" },
  { singular: "trip for two to Peru", plural: "trips for two to Peru", dollars: 6500, note: "about $6,500" },
  { singular: "trip for two to Morocco", plural: "trips for two to Morocco", dollars: 5500, note: "about $5,500" },
  { singular: "trip for two to New Zealand", plural: "trips for two to New Zealand", dollars: 10000, note: "about $10,000" },
  { singular: "trip for two to Australia", plural: "trips for two to Australia", dollars: 11000, note: "about $11,000" },
];

// Index 0 is the original movie-marathon itinerary, which is built separately in VinylInsights.
export const RUNTIME_UNITS: RuntimeUnit[] = [
  { singular: "full run of The Office", plural: "full runs of The Office", minutes: 4400, note: "all 9 seasons" },
  { singular: "full run of Friends", plural: "full runs of Friends", minutes: 5200, note: "all 10 seasons" },
  { singular: "nonstop flight from New York to Tokyo", plural: "nonstop flights from New York to Tokyo", minutes: 840, note: "about 14 hours each" },
  { singular: "drive from Provo to Disneyland", plural: "drives from Provo to Disneyland", minutes: 600, note: "about 10 hours each" },
  { singular: "Super Bowl", plural: "Super Bowls", minutes: 240, note: "kickoff to final whistle, about 4 hours" },
  { singular: "NBA game", plural: "NBA games", minutes: 144, note: "about 2.4 hours each" },
  { singular: "viewing of Titanic", plural: "viewings of Titanic", minutes: 194, note: "3 hours 14 minutes" },
  { singular: "game of pickleball", plural: "games of pickleball", minutes: 20, note: "about 20 minutes each" },
  // Measured against how long we have been together, so the size of the unit grows every day.
  { singular: "relationship", plural: "relationships", minutes: 0, since: new Date(2022, 1, 21), note: "counting from our first date on February 21, 2022" },
];

// Stack height: inches. A single LP in its jacket is roughly a fifth of an inch thick.
export const HEIGHT_UNITS: (CountedUnit & { inches: number })[] = [
  { singular: "Baylor", plural: "Baylors", inches: 76, note: "Baylor is 6'4\"" },
  { singular: "Dodger", plural: "Dodgers", inches: 24, note: "about 2 ft at the shoulder" },
  { singular: "Shaq", plural: "Shaqs", inches: 85, note: "Shaquille O'Neal is 7'1\"" },
  { singular: "basketball hoop", plural: "basketball hoops", inches: 120, note: "10 ft" },
  { singular: "school bus", plural: "school buses", inches: 126, note: "about 10.5 ft tall" },
  { singular: "giraffe", plural: "giraffes", inches: 192, note: "about 16 ft" },
  { singular: "Statue of Liberty", plural: "Statues of Liberty", inches: 3660, note: "305 ft with the pedestal" },
  { singular: "Eiffel Tower", plural: "Eiffel Towers", inches: 12996, note: "1,083 ft" },
  { singular: "Empire State Building", plural: "Empire State Buildings", inches: 17448, note: "1,454 ft with the antenna" },
  { singular: "Burj Khalifa", plural: "Burj Khalifas", inches: 32604, note: "2,717 ft" },
];

// Groove distance: miles. Each disc has about 900 meters of groove across both sides.
export const DISTANCE_UNITS: (CountedUnit & { miles: number })[] = [
  { singular: "round trip to Rob's house in Daybreak", plural: "round trips to Rob's house in Daybreak", miles: 70, note: "Provo to Daybreak and back, about 70 miles" },
  { singular: "round trip to Jen's house in Draper", plural: "round trips to Jen's house in Draper", miles: 54, note: "Provo to Draper and back, about 54 miles" },
  { singular: "marathon", plural: "marathons", miles: 26.2, note: "26.2 miles each" },
  { singular: "crossing of the Golden Gate Bridge", plural: "crossings of the Golden Gate Bridge", miles: 1.7, note: "1.7 miles each" },
  { singular: "trip across Utah from top to bottom", plural: "trips across Utah from top to bottom", miles: 350, note: "about 350 miles" },
  { singular: "one-way drive from Provo to Las Vegas", plural: "one-way drives from Provo to Las Vegas", miles: 375, note: "about 375 miles" },
  { singular: "one-way drive from Provo to Disneyland", plural: "one-way drives from Provo to Disneyland", miles: 650, note: "about 650 miles" },
  { singular: "drive from Provo to New York City", plural: "drives from Provo to New York City", miles: 2200, note: "about 2,200 miles" },
  { singular: "lap around the Earth", plural: "laps around the Earth", miles: 24901, note: "24,901 miles at the equator" },
  { singular: "trip to the Moon", plural: "trips to the Moon", miles: 238900, note: "about 238,900 miles" },
];

// Total age: years. Each record's age is this year minus its release year, added up.
export const AGE_UNITS: (CountedUnit & { years: number; since?: Date })[] = [
  { singular: "human lifetime", plural: "human lifetimes", years: 79, note: "about 79 years" },
  { singular: "Utah", plural: "Utahs", years: 130, note: "statehood in 1896" },
  { singular: "Statue of Liberty", plural: "Statues of Liberty", years: 140, note: "dedicated in 1886" },
  { singular: "BYU", plural: "BYUs", years: 151, note: "founded in 1875" },
  { singular: "United States", plural: "United States", years: 250, note: "founded in 1776" },
  { singular: "Great Pyramid", plural: "Great Pyramids", years: 4600, note: "about 4,600 years old" },
  { singular: "Stonehenge", plural: "Stonehenges", years: 5000, note: "about 5,000 years old" },
  { singular: "Baylor and Isabel relationship", plural: "Baylor and Isabel relationships", years: 0, since: new Date(2022, 1, 21), note: "since our first date on February 21, 2022" },
];

export function unitYears(unit: { years: number; since?: Date }) {
  return unit.since ? (Date.now() - unit.since.getTime()) / (365.25 * 86_400_000) : unit.years;
}

export function formatHeight(inches: number) {
  if (inches < 12) return `${Math.round(inches * 10) / 10} in`;
  const feet = Math.floor(inches / 12);
  if (inches >= 1200) return `${feet.toLocaleString("en-US")} ft`;
  return `${feet} ft ${Math.round(inches - feet * 12)} in`;
}

export function formatCount(n: number) {
  if (n >= 100) return Math.round(n).toLocaleString("en-US");
  if (n >= 10) return String(Math.round(n));
  if (n >= 1) return (Math.round(n * 10) / 10).toLocaleString("en-US");
  if (n <= 0) return "0";
  return n.toFixed(Math.min(8, Math.max(2, -Math.floor(Math.log10(n)) + 1)));
}

export function nounFor(n: number, unit: CountedUnit) {
  return formatCount(n) === "1" ? unit.singular : unit.plural;
}

export function describeCount(n: number, unit: CountedUnit) {
  return `${formatCount(n)} ${nounFor(n, unit)}`;
}

export function describeRuntime(totalMinutes: number, unit: RuntimeUnit) {
  if (unit.since) {
    const ratio = totalMinutes / ((Date.now() - unit.since.getTime()) / 60000);
    const amount = ratio < 1 ? `${formatCount(ratio * 100)}% of` : `${formatCount(ratio)} times`;
    return `about ${amount} our whole relationship so far (${unit.note})`;
  }
  return `about ${describeCount(totalMinutes / unit.minutes, unit)} (${unit.note})`;
}

export function randomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

/** A random index that differs from the one used on the previous page load, so a refresh always changes it. */
export function randomIndexAvoiding(length: number, storageKey: string, offset = 0) {
  let last: number | null = null;
  try {
    const stored = window.localStorage.getItem(storageKey);
    last = stored === null ? null : Number(stored);
  } catch {
    // Private windows and blocked storage just fall back to plain random.
  }

  let pick = randomIndex(length) - offset;
  if (length > 1 && pick === last) pick = ((pick + offset + 1 + randomIndex(length - 1)) % length) - offset;

  try {
    window.localStorage.setItem(storageKey, String(pick));
  } catch {
    // Ignore: remembering the last pick is a nicety.
  }
  return pick;
}
