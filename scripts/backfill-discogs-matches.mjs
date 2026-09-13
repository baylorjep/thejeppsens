import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(rootDir, ".env.local");
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
const DISCOGS_TOKEN = env.DISCOGS_TOKEN;
const DISCOGS_USER_AGENT = "TheJeppsensVinylApp/1.0 +https://thejeppsens.com";

const APPLY = process.argv.includes("--apply");
const OVERWRITE = process.argv.includes("--overwrite");
const QUIET = process.argv.includes("--quiet");
const DELAY_MS = Number(process.argv.find((arg) => arg.startsWith("--delay-ms="))?.split("=")[1] ?? 1100);
const MIN_SCORE = Number(process.argv.find((arg) => arg.startsWith("--min-score="))?.split("=")[1] ?? 0.72);
const REVIEW_PATH = join(rootDir, "vinyl-import/discogs-match-review.json");

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Missing Supabase env vars in .env.local");
if (!DISCOGS_TOKEN) throw new Error("Missing DISCOGS_TOKEN in .env.local");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\([^)]*\)|\[[^\]]*\]/g, " ")
    .replace(/\b(deluxe|expanded|remaster(ed)?|anniversary|edition|mono|stereo|original|soundtrack|recording|copy|reissue|the)\b/g, " ")
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

function splitDiscogsTitle(value) {
  const separatorIndex = value.indexOf(" - ");
  if (separatorIndex === -1) return { artist: "", title: value };
  return { artist: value.slice(0, separatorIndex), title: value.slice(separatorIndex + 3) };
}

function scoreCandidate(record, candidate) {
  const { artist: candidateArtist, title: candidateTitle } = splitDiscogsTitle(candidate.title ?? "");
  const titleScore = jaccard(tokenSet(record.title), tokenSet(candidateTitle));
  const artistScore = jaccard(tokenSet(record.artist), tokenSet(candidateArtist));
  const yearScore = record.releaseYear && String(candidate.year) === String(record.releaseYear) ? 0.08 : 0;
  const catalogScore = record.catalogNumber && candidate.catno === record.catalogNumber ? 0.15 : 0;

  return titleScore * 0.55 + artistScore * 0.3 + yearScore + catalogScore;
}

async function discogsFetch(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": DISCOGS_USER_AGENT,
      Authorization: `Discogs token=${DISCOGS_TOKEN}`,
    },
  });
  await wait(DELAY_MS);
  return response;
}

async function searchDiscogs(record) {
  const query = [record.artist, record.title, record.catalogNumber].filter(Boolean).join(" ");
  const url = new URL("https://api.discogs.com/database/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "release");
  url.searchParams.set("per_page", "10");

  const response = await discogsFetch(url);
  if (!response.ok) return [];

  const data = await response.json();
  return (data.results ?? []).filter((result) =>
    (result.format ?? []).some((format) => String(format).toLowerCase() === "vinyl"),
  );
}

async function fetchRelease(releaseId) {
  const response = await discogsFetch(`https://api.discogs.com/releases/${releaseId}`);
  if (!response.ok) return null;
  return response.json();
}

function applyMatchToRecord(record, release) {
  const primaryLabel = release.labels?.[0];
  const primaryFormat = release.formats?.[0];
  const format = primaryFormat?.descriptions?.[0] ?? primaryFormat?.name;
  const discCount = primaryFormat?.qty ? Number(primaryFormat.qty) : undefined;
  const genres = [...new Set([...(release.genres ?? []), ...(release.styles ?? [])])];
  const trackList = (release.tracklist ?? [])
    .filter((track) => !track.type_ || track.type_ === "track")
    .map((track) => track.title)
    .filter(Boolean);
  const coverImage = release.images?.find((image) => image.type === "primary")?.uri ?? release.images?.[0]?.uri;

  return {
    ...record,
    discogsReleaseId: release.id,
    discogsVerified: false,
    label: primaryLabel?.name ?? record.label,
    catalogNumber: primaryLabel?.catno ?? record.catalogNumber,
    format: record.format || format || record.format,
    discCount: record.discCount || discCount || record.discCount,
    genres: record.genres?.length ? record.genres : genres.length ? genres : record.genres,
    trackList: record.trackList?.length ? record.trackList : trackList.length ? trackList : record.trackList,
    coverImage: record.coverImage || coverImage || record.coverImage,
  };
}

async function fetchAllRecords() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/vinyl_records?select=id,record&limit=1000`, {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  });

  if (!response.ok) throw new Error(`Could not fetch records: ${response.status} ${await response.text()}`);
  return response.json();
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

  if (!response.ok) throw new Error(`Could not patch ${id}: ${response.status} ${await response.text()}`);
}

async function processRecord(row) {
  const record = row.record;
  if (!OVERWRITE && record.discogsReleaseId) {
    return { status: "skip-existing", row };
  }

  const candidates = await searchDiscogs(record);
  const ranked = candidates
    .map((candidate) => ({ candidate, score: scoreCandidate(record, candidate) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < MIN_SCORE) {
    return { status: "needs-review", row, ranked: ranked.slice(0, 3) };
  }

  if (!APPLY) {
    return { status: "would-link", row, best };
  }

  const release = await fetchRelease(best.candidate.id);
  if (!release) return { status: "needs-review", row, ranked: ranked.slice(0, 3) };

  const nextRecord = applyMatchToRecord(record, release);
  await patchRecord(row.id, nextRecord);

  return { status: "linked", row, best };
}

async function main() {
  const limit = Number(process.argv.find((arg) => arg.startsWith("--limit="))?.split("=")[1] ?? Infinity);
  const rows = (await fetchAllRecords()).slice(0, limit);
  const results = [];
  const needsReview = [];

  console.log(`${APPLY ? "Applying" : "Dry run"} Discogs matching for ${rows.length} records`);
  console.log(`min score: ${MIN_SCORE}; overwrite existing links: ${OVERWRITE ? "yes" : "no"}\n`);

  for (const row of rows) {
    const result = await processRecord(row);
    results.push(result);

    const record = row.record;
    if (result.status === "skip-existing") {
      if (!QUIET) console.log(`- skip ${record.artist} - ${record.title} (already linked)`);
    } else if (result.status === "linked" || result.status === "would-link") {
      console.log(
        `${result.status === "linked" ? "✓" : "•"} ${record.artist} - ${record.title} -> release ${result.best.candidate.id} (score ${result.best.score.toFixed(2)})`,
      );
    } else {
      const top = result.ranked?.[0];
      console.log(
        `! review ${record.artist} - ${record.title}: ${top ? `${top.candidate.title} (score ${top.score.toFixed(2)})` : "no candidates"}`,
      );
      needsReview.push({
        id: row.id,
        title: record.title,
        artist: record.artist,
        candidates: (result.ranked ?? []).map(({ candidate, score }) => ({
          id: candidate.id,
          title: candidate.title,
          year: candidate.year,
          catno: candidate.catno,
          label: candidate.label?.[0],
          score: Number(score.toFixed(2)),
        })),
      });
    }
  }

  const counts = results.reduce((summary, result) => {
    summary[result.status] = (summary[result.status] ?? 0) + 1;
    return summary;
  }, {});

  console.log("\nSummary");
  for (const [status, count] of Object.entries(counts).sort()) {
    console.log(`${status}: ${count}`);
  }

  writeFileSync(REVIEW_PATH, `${JSON.stringify(needsReview, null, 2)}\n`);
  console.log(`\nWrote ${needsReview.length} records needing manual review to ${REVIEW_PATH}`);

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to save confident matches.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
