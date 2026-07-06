#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const BUCKET = "vinyl-covers";
const MAX_COVER_DIMENSION = 1400;
const JPEG_QUALITY = 78;
const VALID_STATUSES = new Set(["owned", "wishlist", "upgrade"]);

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

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function asList(value) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

function validateRecord(input) {
  const title = String(input.title ?? "").trim();
  const artist = String(input.artist ?? "").trim();
  const status = input.status ?? "owned";

  if (!title || !artist) throw new Error("Each record needs title and artist.");
  if (!VALID_STATUSES.has(status)) throw new Error(`${title} has invalid status "${status}".`);

  const record = {
    id: String(input.id ?? slugify(`${title}-${artist}`)),
    title,
    artist,
    genres: asList(input.genres),
    moods: asList(input.moods),
    status,
  };

  const optionalFields = [
    "label",
    "catalogNumber",
    "format",
    "pressing",
    "storageLocation",
    "originalReleaseYear",
    "recordingYears",
    "pressingYear",
    "pressingNotes",
    "vinylColor",
    "condition",
    "source",
    "giftFrom",
    "whereWeGotIt",
    "bestFor",
    "dateAdded",
    "notes",
    "favoriteStories",
    "coverImage",
    "backCoverImage",
  ];

  for (const field of optionalFields) {
    if (input[field] !== undefined && input[field] !== "") record[field] = input[field];
  }

  if (input.releaseYear !== undefined && input.releaseYear !== "") record.releaseYear = Number(input.releaseYear);
  if (input.discCount !== undefined && input.discCount !== "") record.discCount = Number(input.discCount);
  if (input.favorite !== undefined) record.favorite = Boolean(input.favorite);

  const favoriteTracks = asList(input.favoriteTracks);
  if (favoriteTracks.length) record.favoriteTracks = favoriteTracks;

  return record;
}

async function optimizeCoverFile(absolutePath) {
  const workDir = await mkdtemp(path.join(os.tmpdir(), "jeppsen-vinyl-import-"));
  const inputPath = path.join(workDir, `source${path.extname(absolutePath).toLowerCase() || ".jpg"}`);
  const outputPath = path.join(workDir, "optimized.jpg");

  try {
    await writeFile(inputPath, await readFile(absolutePath));
    await execFileAsync("sips", [
      "-s",
      "format",
      "jpeg",
      "-s",
      "formatOptions",
      String(JPEG_QUALITY),
      "-Z",
      String(MAX_COVER_DIMENSION),
      inputPath,
      "--out",
      outputPath,
    ]);
    return await readFile(outputPath);
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function uploadCover(supabase, record, coverPath, manifestDir, side) {
  const absolutePath = path.resolve(manifestDir, coverPath);
  const file = await optimizeCoverFile(absolutePath);
  const storagePath = `optimized/${record.id}/${side}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
    contentType: "image/jpeg",
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function main() {
  const manifestPath = process.argv[2];
  if (!manifestPath) {
    console.error("Usage: npm run import:vinyl -- path/to/vinyl-records.json");
    process.exit(1);
  }

  await loadEnvFile(path.resolve(process.cwd(), ".env.local"));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const absoluteManifestPath = path.resolve(process.cwd(), manifestPath);
  const manifestDir = path.dirname(absoluteManifestPath);
  const rawRecords = JSON.parse(await readFile(absoluteManifestPath, "utf8"));
  if (!Array.isArray(rawRecords)) throw new Error("Manifest must be a JSON array.");

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const input of rawRecords) {
    const record = validateRecord(input);
    const frontCoverPath = input.frontCoverPath || input.coverPath || input.imagePath;
    const backCoverPath = input.backCoverPath;
    const preserveFavorite = input.favorite === undefined;

    if (preserveFavorite) {
      const { data: existingRow, error: existingError } = await supabase
        .from("vinyl_records")
        .select("record")
        .eq("id", record.id)
        .maybeSingle();

      if (existingError) throw existingError;
      if (existingRow?.record?.favorite) record.favorite = true;
    }

    if (frontCoverPath) {
      record.coverImage = await uploadCover(supabase, record, frontCoverPath, manifestDir, "front");
    }

    if (backCoverPath) {
      record.backCoverImage = await uploadCover(supabase, record, backCoverPath, manifestDir, "back");
    }

    const { error } = await supabase.from("vinyl_records").upsert({
      id: record.id,
      record,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;
    console.log(`Imported ${record.title} by ${record.artist}`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
