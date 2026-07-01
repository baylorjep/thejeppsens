import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const envPath = join(dirname(fileURLToPath(import.meta.url)), "../.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#") && line.trim())
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const APPLY = process.argv.includes("--apply");
const OVERWRITE = process.argv.includes("--overwrite");
const QUIET = process.argv.includes("--quiet");
const DELAY_MS = Number(process.argv.find((arg) => arg.startsWith("--delay-ms="))?.split("=")[1] ?? 550);
const MIN_SCORE = Number(process.argv.find((arg) => arg.startsWith("--min-score="))?.split("=")[1] ?? 0.68);

if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("Missing Supabase env vars in .env.local");
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/\b(deluxe|expanded|remaster(ed)?|anniversary|edition|mono|stereo|original|soundtrack|recording|copy)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function tokenSet(value) {
  return new Set(normalize(value).split(" ").filter(Boolean));
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  return intersection / new Set([...a, ...b]).size;
}

function scoreAlbum(record, candidate) {
  const titleScore = jaccard(tokenSet(record.title), tokenSet(candidate.collectionName));
  const artistScore = jaccard(tokenSet(record.artist), tokenSet(candidate.artistName));
  const yearScore =
    record.releaseYear && candidate.releaseDate?.slice(0, 4) === String(record.releaseYear)
      ? 0.08
      : 0;

  return titleScore * 0.62 + artistScore * 0.3 + yearScore;
}

async function fetchAllRecords() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/vinyl_records?select=id,record&limit=1000`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Could not fetch records: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function searchAppleAlbums(record) {
  const term = encodeURIComponent(`${record.artist} ${record.title}`);
  const fallbackTerm = encodeURIComponent(record.title);
  const urls = [
    `https://itunes.apple.com/search?term=${term}&entity=album&limit=25&country=US`,
    `https://itunes.apple.com/search?term=${fallbackTerm}&entity=album&limit=25&country=US`,
  ];

  for (const url of urls) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const response = await fetch(url);
      if (!response.ok) {
        await wait(DELAY_MS * (attempt + 1));
        continue;
      }

      const data = await response.json();
      const results = (data.results ?? []).filter((item) => item.collectionType === "Album" && item.collectionId);
      if (results.length) return results;

      await wait(DELAY_MS * (attempt + 1));
    }
  }

  return [];
}

async function lookupTrackList(collectionId) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`https://itunes.apple.com/lookup?id=${collectionId}&entity=song&country=US`);
    if (!response.ok) {
      await wait(DELAY_MS * (attempt + 1));
      continue;
    }

    const data = await response.json();
    const tracks = (data.results ?? [])
      .filter((item) => item.wrapperType === "track" && item.kind === "song" && item.trackName)
      .sort((a, b) => (a.discNumber ?? 1) - (b.discNumber ?? 1) || (a.trackNumber ?? 999) - (b.trackNumber ?? 999))
      .map((item) => item.trackName)
      .filter((track, index, tracks) => tracks.indexOf(track) === index);

    if (tracks.length) return tracks;
    await wait(DELAY_MS * (attempt + 1));
  }

  return [];
}

async function patchRecord(id, record) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/vinyl_records?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ record, updated_at: new Date().toISOString() }),
  });

  if (!response.ok) {
    throw new Error(`Could not patch ${id}: ${response.status} ${await response.text()}`);
  }
}

async function processRecord(row) {
  const record = row.record;
  if (!OVERWRITE && record.trackList?.length) {
    return { status: "skip-existing", row, trackCount: record.trackList.length };
  }

  const candidates = await searchAppleAlbums(record);
  const ranked = candidates
    .map((candidate) => ({ candidate, score: scoreAlbum(record, candidate) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < MIN_SCORE) {
    return { status: "needs-review", row, best };
  }

  const trackList = await lookupTrackList(best.candidate.collectionId);
  if (!trackList.length) {
    return { status: "no-tracks", row, best };
  }

  const nextRecord = { ...record, trackList };
  if (APPLY) await patchRecord(row.id, nextRecord);

  return { status: APPLY ? "updated" : "would-update", row, best, trackCount: trackList.length };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const rows = await fetchAllRecords();
  const results = [];

  console.log(`${APPLY ? "Applying" : "Dry run"} track-list backfill for ${rows.length} records`);
  console.log(`min score: ${MIN_SCORE}; overwrite existing: ${OVERWRITE ? "yes" : "no"}\n`);

  for (const row of rows) {
    const result = await processRecord(row);
    results.push(result);

    const record = row.record;
    if (QUIET && (result.status === "updated" || result.status === "would-update" || result.status === "skip-existing")) {
      // Keep quiet mode focused on misses and final counts.
    } else if (result.status === "updated" || result.status === "would-update") {
      console.log(
        `${result.status === "updated" ? "✓" : "•"} ${record.artist} - ${record.title} (${result.trackCount} tracks, score ${result.best.score.toFixed(2)})`,
      );
    } else if (result.status === "skip-existing") {
      console.log(`- skip ${record.artist} - ${record.title} (${result.trackCount} existing tracks)`);
    } else {
      const match = result.best?.candidate
        ? `${result.best.candidate.artistName} - ${result.best.candidate.collectionName} (${result.best.score.toFixed(2)})`
        : "no candidate";
      console.log(`! review ${record.artist} - ${record.title}: ${match}`);
    }

    await wait(DELAY_MS);
  }

  const counts = results.reduce((summary, result) => {
    summary[result.status] = (summary[result.status] ?? 0) + 1;
    return summary;
  }, {});

  console.log("\nSummary");
  for (const [status, count] of Object.entries(counts).sort()) {
    console.log(`${status}: ${count}`);
  }

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to save confident matches.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
