import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

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
const DELAY_MS = Number(process.argv.find((arg) => arg.startsWith("--delay-ms="))?.split("=")[1] ?? 1100);

if (!SUPABASE_URL || !SERVICE_KEY) throw new Error("Missing Supabase env vars in .env.local");
if (!DISCOGS_TOKEN) throw new Error("Missing DISCOGS_TOKEN in .env.local");

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickPressingPlant(companies) {
  const pressed = companies?.find((c) => c.entity_type_name === "Pressed By");
  const manufactured = companies?.find((c) => c.entity_type_name === "Manufactured By");
  return (pressed ?? manufactured)?.name || null;
}

function pickBarcode(identifiers) {
  const barcodes = identifiers?.filter((i) => i.type === "Barcode") ?? [];
  return (barcodes.find((b) => b.description === "Text") ?? barcodes[0])?.value || null;
}

function parseDurationSeconds(duration) {
  const parts = String(duration ?? "").trim().split(":").map(Number);
  if (!parts.length || parts.some(Number.isNaN)) return 0;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function pickRuntimeSeconds(tracklist) {
  const seconds = (tracklist ?? [])
    .filter((t) => !t.type_ || t.type_ === "track")
    .reduce((total, t) => total + parseDurationSeconds(t.duration), 0);
  return seconds > 0 ? seconds : null;
}

// Only the exact facts confirmed via physical evidence review, mirroring
// scripts/lib/pressing-review.mjs's releaseMetadata(). Never touches personal
// fields (vinylColor, notes, storage, etc).
function pickFacts(release) {
  return {
    pressingPlant: pickPressingPlant(release.companies),
    country: release.country || null,
    barcode: pickBarcode(release.identifiers),
    releasedDate: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(release.released ?? "") ? release.released : null,
    weightGrams: Number.isFinite(release.estimated_weight) ? release.estimated_weight : null,
    runtimeSeconds: pickRuntimeSeconds(release.tracklist),
  };
}

async function fetchDiscogs(path) {
  const response = await fetch(`https://api.discogs.com${path}`, {
    headers: { Authorization: `Discogs token=${DISCOGS_TOKEN}`, "User-Agent": DISCOGS_USER_AGENT },
    signal: AbortSignal.timeout(30000),
  });
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after") || 5) * 1000;
    await wait(retryAfter);
    return fetchDiscogs(path);
  }
  if (!response.ok) throw new Error(`Discogs ${response.status} for ${path}`);
  return response.json();
}
const fetchRelease = (id) => fetchDiscogs(`/releases/${id}`);
const fetchMaster = (id) => fetchDiscogs(`/masters/${id}`);

async function allRows() {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db.from("vinyl_records").select("id, record").order("id").range(offset, offset + 499);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}

async function main() {
  const rows = await allRows();
  const targets = rows.filter(
    (row) =>
      row.record?.discogsVerified === true &&
      row.record?.discogsReleaseId &&
      (!row.record.pressingPlant ||
        !row.record.country ||
        !row.record.barcode ||
        !row.record.releasedDate ||
        !row.record.weightGrams ||
        !row.record.runtimeSeconds ||
        !row.record.releaseYear ||
        !row.record.originalReleaseYear),
  );

  console.log(`${rows.length} total records, ${targets.length} verified records missing at least one pressing detail.`);
  if (!targets.length) return;

  let updated = 0;
  let failed = 0;
  for (const [index, row] of targets.entries()) {
    const releaseId = row.record.discogsReleaseId;
    try {
      const release = await fetchRelease(releaseId);
      const facts = pickFacts(release);
      const patch = {};
      for (const [key, value] of Object.entries(facts)) {
        if (!row.record[key] && value) patch[key] = value;
      }
      if ((!row.record.releaseYear || !row.record.originalReleaseYear) && release.master_id) {
        await wait(DELAY_MS);
        const master = await fetchMaster(release.master_id);
        if (master.year > 0) {
          if (!row.record.releaseYear) patch.releaseYear = master.year;
          if (!row.record.originalReleaseYear) patch.originalReleaseYear = master.year;
        }
      }

      if (Object.keys(patch).length) {
        console.log(
          `[${index + 1}/${targets.length}] ${row.record.artist} — ${row.record.title} (release ${releaseId}): ${JSON.stringify(patch)}`,
        );
        if (APPLY) {
          const nextRecord = { ...row.record, ...patch };
          const { error } = await db.from("vinyl_records").update({ record: nextRecord }).eq("id", row.id);
          if (error) throw error;
        }
        updated += 1;
      } else {
        console.log(`[${index + 1}/${targets.length}] ${row.record.artist} — ${row.record.title}: nothing new on Discogs for this release.`);
      }
    } catch (error) {
      failed += 1;
      console.error(`[${index + 1}/${targets.length}] ${row.record.artist} — ${row.record.title} (release ${releaseId}): ${error.message}`);
    }
    await wait(DELAY_MS);
  }

  console.log(`\n${APPLY ? "Updated" : "Would update"} ${updated} record(s). ${failed} failed.`);
  if (!APPLY) console.log("Dry run only. Re-run with --apply to save.");
}

main();
