import type { VinylRecord } from "@/data/vinyls";

type PersonaGuess = { label: string; value: string; reason: string };

const CITY_SOUNDS = [
  { city: "New York, New York", signature: /musicals?|broadway|show ?tunes?|traditional pop|big band|swing|vocal jazz|punk|disco|new wave/i, broad: /\bjazz\b/i },
  { city: "Nashville, Tennessee", signature: /country|bluegrass|americana/i, broad: /\bfolk\b/i },
  { city: "New Orleans, Louisiana", signature: /\bfunk|brass|zydeco\b/i, broad: /\bjazz\b/i },
  { city: "Los Angeles, California", signature: /soundtrack|film score|disney|r&b|rnb/i, broad: /\bpop\b/i },
  { city: "Atlanta, Georgia", signature: /hip[ -]?hop|\brap\b|\btrap\b/i, broad: /\br&b|rnb\b/i },
  { city: "Detroit, Michigan", signature: /techno|electronic|\bhouse\b/i, broad: /\bsoul\b/i },
  { city: "Memphis, Tennessee", signature: /\bsoul|gospel|blues\b/i, broad: /\brock\b/i },
  { city: "Seattle, Washington", signature: /grunge|alternative rock/i, broad: /\brock\b/i },
  { city: "Portland, Oregon", signature: /\bindie|singer[ -]?songwriter\b/i, broad: /\bfolk\b/i },
  { city: "Austin, Texas", signature: /psychedelic|garage rock/i, broad: /\brock\b/i },
] as const;

function ageGuess(records: VinylRecord[], currentYear: number): PersonaGuess | null {
  // Original release dates describe the music; pressing dates describe the physical copies.
  const years = records
    .map((record) => record.originalReleaseYear ?? record.releaseYear)
    .filter((year): year is number => typeof year === "number" && year >= 1950 && year <= currentYear)
    .sort((a, b) => a - b);
  if (years.length < 2) return null;

  // The newer half says more about a listener's likely formative years than a
  // handful of classic albums. Keep the result playful, but make one clear guess.
  const anchor = years[Math.floor(years.length * 0.7)];
  const guessedAge = Math.max(22, Math.min(70, currentYear - anchor + 18));
  const decade = `${Math.floor(anchor / 10) * 10}s`;
  return {
    label: "Our age guess",
    value: String(guessedAge),
    reason: `The newer side of your collection centers around ${decade} releases. We guessed you met that music around 18.`,
  };
}

function hometownGuess(records: VinylRecord[]): PersonaGuess | null {
  const scored = CITY_SOUNDS.map(({ city, signature, broad }) => {
    const matching = records.flatMap((record) => record.genres.filter((genre) => signature.test(genre) || broad.test(genre)));
    const score = matching.reduce((sum, genre) => sum + (signature.test(genre) ? 2 : 0.25), 0);
    const genres = [...new Set(matching)].sort((a, b) => Number(signature.test(b)) - Number(signature.test(a)));
    return { city, score, genres: genres.slice(0, 2) };
  }).sort((a, b) => b.score - a.score);
  const winner = scored[0];
  if (!winner?.score) return null;

  return {
    label: "Our hometown guess",
    value: winner.city,
    reason: `${winner.genres.join(" and ")} give your shelves a ${winner.city.split(",")[0]} sound. This is a music-vibe guess, not a location taken from your records.`,
  };
}

function nightOutGuess(records: VinylRecord[]): PersonaGuess | null {
  const scenes = [
    { value: "A show and its cast album", sound: /musicals?|broadway|show ?tunes?|soundtrack|film score/i },
    { value: "A table at a jazz club", sound: /\bjazz|big band|swing\b/i },
    { value: "A live show under the stars", sound: /country|folk|americana|rock/i },
    { value: "A night on the dance floor", sound: /disco|dance|electronic|house|hip[ -]?hop/i },
  ];
  const ranked = scenes.map((scene) => ({
    ...scene,
    matching: records.flatMap((record) => record.genres.filter((genre) => scene.sound.test(genre))),
  })).sort((a, b) => b.matching.length - a.matching.length);
  const top = ranked[0];
  if (!top?.matching.length) return null;
  const leadingGenre = [...new Set(top.matching)][0];
  return {
    label: "Your ideal night out",
    value: top.value,
    reason: `${top.matching.length} genre tags point to this scene, led by ${leadingGenre}.`,
  };
}

function collectorGuess(records: VinylRecord[]): PersonaGuess | null {
  if (records.length < 2) return null;
  const artists = new Set(records.map((record) => record.artist.trim().toLowerCase()).filter(Boolean));
  const share = artists.size / records.length;
  return share >= 0.6
    ? {
        label: "Your collector type",
        value: "The explorer",
        reason: `${artists.size} artists across ${records.length} records: you keep making room for someone new.`,
      }
    : {
        label: "Your collector type",
        value: "The deep diver",
        reason: `${records.length} records from ${artists.size} artists: when an artist clicks, you keep digging.`,
      };
}

export function getVinylPersona(allRecords: VinylRecord[], currentYear = new Date().getFullYear()) {
  const records = allRecords.filter((record) => record.status !== "wishlist");
  if (!records.length) return [];
  return [ageGuess(records, currentYear), hometownGuess(records), nightOutGuess(records), collectorGuess(records)]
    .filter((guess): guess is PersonaGuess => guess !== null);
}
