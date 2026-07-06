#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const BUCKET = "vinyl-covers";
const MAX_DIMENSION = 1400;
const JPEG_QUALITY = 78;

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

function fileExtensionFromUrl(url) {
  const cleanPath = new URL(url).pathname;
  const extension = path.extname(cleanPath).toLowerCase();
  if (extension === ".png") return ".png";
  if (extension === ".webp") return ".webp";
  if (extension === ".gif") return ".gif";
  return ".jpg";
}

function isOptimizedCoverUrl(url) {
  try {
    return new URL(url).pathname.includes(`/storage/v1/object/public/${BUCKET}/optimized/`);
  } catch {
    return false;
  }
}

async function optimizeImageFromUrl(imageUrl) {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Could not download image: ${response.status} ${response.statusText}`);
  }

  const inputBuffer = Buffer.from(await response.arrayBuffer());
  const workDir = await mkdtemp(path.join(os.tmpdir(), "jeppsen-vinyl-"));
  const inputPath = path.join(workDir, `source${fileExtensionFromUrl(imageUrl)}`);
  const outputPath = path.join(workDir, "optimized.jpg");

  try {
    await writeFile(inputPath, inputBuffer);
    await execFileAsync("sips", [
      "-s",
      "format",
      "jpeg",
      "-s",
      "formatOptions",
      String(JPEG_QUALITY),
      "-Z",
      String(MAX_DIMENSION),
      inputPath,
      "--out",
      outputPath,
    ]);
    return await readFile(outputPath);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function uploadOptimizedCover(supabase, recordId, side, imageUrl) {
  const optimizedBuffer = await optimizeImageFromUrl(imageUrl);
  const storagePath = `optimized/${recordId}/${side}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, optimizedBuffer, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function main() {
  await loadEnvFile(path.resolve(process.cwd(), ".env.local"));
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("vinyl_records")
    .select("id, record")
    .order("created_at", { ascending: true });

  if (error) throw error;

  const rows = data ?? [];
  let updated = 0;

  for (const row of rows) {
    const record = row.record;
    let nextRecord = { ...record };
    let changed = false;

    if (record.coverImage && !record.coverImage.startsWith("data:") && !isOptimizedCoverUrl(record.coverImage)) {
      const nextUrl = await uploadOptimizedCover(supabase, record.id, "front", record.coverImage);
      nextRecord.coverImage = nextUrl;
      changed = true;
    }

    if (record.backCoverImage && !record.backCoverImage.startsWith("data:") && !isOptimizedCoverUrl(record.backCoverImage)) {
      const nextUrl = await uploadOptimizedCover(supabase, record.id, "back", record.backCoverImage);
      nextRecord.backCoverImage = nextUrl;
      changed = true;
    }

    if (!changed) continue;

    const { error: updateError } = await supabase.from("vinyl_records").upsert({
      id: record.id,
      record: nextRecord,
      updated_at: new Date().toISOString(),
    });

    if (updateError) throw updateError;
    updated += 1;
    console.log(`Reprocessed ${record.title} by ${record.artist}`);
  }

  console.log(`Done. Reprocessed ${updated} records.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
