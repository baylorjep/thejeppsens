// Precomputes "how many albums by ARTIST did LABEL first release" for every artist + label pair
// in the collection, from Discogs. Slow on purpose (one Discogs lookup per album, paced under the
// rate limit), so run it occasionally and commit src/data/labelCatalogs.json.
//
//   node --env-file=.env.local scripts/build-label-catalogs.mjs [--refresh] [--only "artist|label"]
//
// An album counts for a label when the earliest version on that label came out in the album's
// first-release year, so a later reissue by the label does not count as "made" by it.
import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";

const OUT = new URL("../src/data/labelCatalogs.json", import.meta.url);
const UA = "TheJeppsensVinylApp/1.0 +https://thejeppsens.com";
const NON_ALBUM = new Set(["compilation", "box set", "club edition", "promo", "ep", "single", "unofficial release", "bootleg", "mini-album"]);
const refresh = process.argv.includes("--refresh");
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;

const norm = (value) => value.toLowerCase().replace(/\(.*?\)|\[.*?\]/g, "").replace(/&/g, "and").replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, "");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function discogs(path, params = {}, attempt = 0) {
  const url = new URL(`https://api.discogs.com${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  await sleep(1150);
  const response = await fetch(url, { headers: { "User-Agent": UA, Authorization: `Discogs token=${process.env.DISCOGS_TOKEN}` } });
  if (response.status === 429 && attempt < 5) {
    await sleep((Number(response.headers.get("retry-after")) || 10) * 1000);
    return discogs(path, params, attempt + 1);
  }
  if (!response.ok) throw new Error(`${response.status} ${url.pathname}`);
  return response.json();
}

const masterCache = new Map();
async function albumsByArtist(name) {
  const key = norm(name);
  if (masterCache.has(key)) return masterCache.get(key);
  const wanted = name.toLowerCase();
  const seen = new Set();
  const albums = [];
  for (let page = 1; page <= 3; page++) {
    const data = await discogs("/database/search", { type: "master", artist: name, format: "Album", per_page: 100, page });
    for (const result of data.results ?? []) {
      const [credited, ...rest] = result.title.split(" - ");
      const title = rest.join(" - ").trim();
      const creditedLower = credited.toLowerCase();
      if (!title || !creditedLower.startsWith(wanted) || /^\s+(jr|sr)\b/.test(creditedLower.slice(wanted.length))) continue;
      const formats = (result.format ?? []).map((format) => format.toLowerCase());
      if (!formats.some((format) => format === "vinyl" || format === "lp")) continue;
      if (formats.some((format) => NON_ALBUM.has(format))) continue;
      const year = Number(result.year);
      if (!Number.isFinite(year) || year <= 0) continue;
      const titleKey = norm(title);
      if (seen.has(titleKey)) continue;
      seen.add(titleKey);
      albums.push({ masterId: result.id, title, year });
    }
    if (page >= (data.pagination?.pages ?? 1)) break;
  }
  masterCache.set(key, albums);
  return albums;
}

function artistCandidates(artist) {
  const first = artist.split(/,| \/ | with | feat\.? | featuring /i)[0].trim();
  const beforeAmp = first.split(" & ")[0].trim();
  return [...new Set([artist, first, beforeAmp].filter(Boolean))];
}

const labelQuery = (label) => label.replace(/\s*\(.*$/, "").split(" / ")[0].trim();

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data } = await db.from("vinyl_records").select("record").range(0, 999);
  const records = data.map((row) => row.record).filter((r) => r.status !== "wishlist" && r.label && r.artist && !/^various/i.test(r.artist));

  const pairs = new Map();
  for (const r of records) pairs.set(`${norm(r.artist)}|${norm(labelQuery(r.label))}`, { artist: r.artist, label: labelQuery(r.label) });

  let catalogs = {};
  try { catalogs = JSON.parse(await readFile(OUT, "utf8")); } catch {}

  let done = 0;
  for (const [key, { artist, label }] of pairs) {
    done++;
    if (only && key !== only) continue;
    if (catalogs[key] && !refresh) continue;
    try {
      let matchedArtist = null;
      let albums = [];
      for (const candidate of artistCandidates(artist)) {
        albums = await albumsByArtist(candidate);
        if (albums.length) { matchedArtist = candidate; break; }
      }
      const madeByLabel = [];
      for (const album of albums) {
        // The label filter also matches releases that merely list the label (club editions, distributors),
        // so keep only versions whose own label string names it.
        const versions = await discogs(`/masters/${album.masterId}/versions`, { label, sort: "released", sort_order: "asc", per_page: 8 });
        const own = (versions.versions ?? []).find((version) => norm(version.label ?? "").includes(norm(label)));
        const earliest = Number(String(own?.released ?? "").slice(0, 4));
        if (Number.isFinite(earliest) && earliest > 0 && earliest <= album.year) madeByLabel.push({ title: album.title, year: album.year });
      }
      catalogs[key] = { artist: matchedArtist ?? artist, label, generatedAt: new Date().toISOString(), albumsConsidered: albums.length, albums: madeByLabel };
      console.log(`[${done}/${pairs.size}] ${artist} on ${label}: ${madeByLabel.length} of ${albums.length} albums`);
    } catch (error) {
      console.error(`[${done}/${pairs.size}] ${artist} on ${label}: FAILED ${error.message}`);
    }
    await writeFile(OUT, JSON.stringify(catalogs));
  }
  await writeFile(OUT, JSON.stringify(catalogs, null, 0));
  console.log("Done.");
}

main().catch((error) => { console.error(error); process.exit(1); });
