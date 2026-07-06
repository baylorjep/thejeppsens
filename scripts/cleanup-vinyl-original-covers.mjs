#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";

const BUCKET = "vinyl-covers";
const CONFIRM_FLAG = "--confirm";

function loadEnvFile(filePath) {
  return readFile(filePath, "utf8")
    .then((contents) => {
      for (const line of contents.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex === -1) continue;

        const key = trimmed.slice(0, separatorIndex).trim();
        const rawValue = trimmed.slice(separatorIndex + 1).trim();
        const value = rawValue.replace(/^['"]|['"]$/g, "");
        if (key && !process.env[key]) process.env[key] = value;
      }
    })
    .catch((error) => {
      if (error.code !== "ENOENT") throw error;
    });
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function storagePathFromPublicUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const markerIndex = pathname.indexOf(marker);
    if (markerIndex === -1) return null;
    return decodeURIComponent(pathname.slice(markerIndex + marker.length));
  } catch {
    return null;
  }
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const power = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** power;
  return `${value.toFixed(value >= 10 || power === 0 ? 0 : 1)} ${units[power]}`;
}

async function listFiles(supabase, prefix = "") {
  const files = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) throw error;
    if (!data?.length) break;

    for (const item of data) {
      const objectPath = prefix ? `${prefix}/${item.name}` : item.name;
      const size = item.metadata?.size;

      if (typeof size === "number") {
        files.push({ path: objectPath, size });
      } else {
        files.push(...await listFiles(supabase, objectPath));
      }
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return files;
}

async function getReferencedCoverPaths(supabase) {
  const { data, error } = await supabase.from("vinyl_records").select("record");
  if (error) throw error;

  const referenced = new Set();
  for (const row of data ?? []) {
    for (const url of [row.record?.coverImage, row.record?.backCoverImage]) {
      if (typeof url !== "string" || url.startsWith("data:")) continue;

      const objectPath = storagePathFromPublicUrl(url);
      if (objectPath) referenced.add(objectPath);
    }
  }

  return referenced;
}

async function removeInBatches(supabase, paths) {
  let removed = 0;
  const batchSize = 100;

  for (let index = 0; index < paths.length; index += batchSize) {
    const batch = paths.slice(index, index + batchSize);
    const { error } = await supabase.storage.from(BUCKET).remove(batch);
    if (error) throw error;
    removed += batch.length;
  }

  return removed;
}

async function main() {
  const shouldDelete = process.argv.includes(CONFIRM_FLAG);

  await loadEnvFile(path.resolve(process.cwd(), ".env.local"));
  const supabase = getSupabaseClient();

  const [files, referencedPaths] = await Promise.all([
    listFiles(supabase),
    getReferencedCoverPaths(supabase),
  ]);

  const candidates = files.filter((file) => !file.path.startsWith("optimized/") && !referencedPaths.has(file.path));
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const candidateBytes = candidates.reduce((sum, file) => sum + file.size, 0);

  console.log(`Bucket: ${BUCKET}`);
  console.log(`Objects found: ${files.length}`);
  console.log(`Current listed storage: ${formatBytes(totalBytes)}`);
  console.log(`Unreferenced original candidates: ${candidates.length}`);
  console.log(`Recoverable storage: ${formatBytes(candidateBytes)}`);

  if (!candidates.length) {
    console.log("No unreferenced original covers to delete.");
    return;
  }

  for (const file of candidates.slice(0, 20)) {
    console.log(`- ${file.path} (${formatBytes(file.size)})`);
  }

  if (candidates.length > 20) {
    console.log(`...and ${candidates.length - 20} more`);
  }

  if (!shouldDelete) {
    console.log(`Dry run only. Run with ${CONFIRM_FLAG} after reprocessing to delete these originals.`);
    return;
  }

  const removed = await removeInBatches(supabase, candidates.map((file) => file.path));
  console.log(`Deleted ${removed} unreferenced original covers.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
