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
  // Measured against how long we have been together, so the size of the unit grows every day.
  { singular: "relationship", plural: "relationships", minutes: 0, since: new Date(2022, 1, 21), note: "counting from our first date on February 21, 2022" },
];

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
