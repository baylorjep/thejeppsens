#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

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

function inferFormat(record) {
  const key = `${String(record.title ?? "").toLowerCase()} — ${String(record.artist ?? "").toLowerCase()}`;
  const title = `${record.title ?? ""} ${record.artist ?? ""}`.toLowerCase();
  const pressing = String(record.pressing ?? "").toLowerCase();

  const known = {
    "baby you got it — brenton wood": "7-inch single",
    "ratatouille — michael giacchino": "Picture disc",
    "guardians of the galaxy vol. 2: deluxe edition — tyler bates": "2xLP",
    "live in concert: the complete performance — ray charles": "2xLP",
    "the best of sade — sade": "2xLP",
    "the greatest hits of the century, vol. iii and iv (50's and 60's) — various artists": "2xLP",
  };

  if (known[key]) return known[key];
  if (pressing.includes("picture disc") || title.includes("picture disc")) return "Picture disc";
  if (title.includes("single") || title.includes("7-inch")) return "7-inch single";
  if (title.includes("deluxe edition") || title.includes("complete performance") || title.includes("greatest hits")) {
    return "2xLP";
  }
  return record.format ?? "LP";
}

function inferDiscCount(record) {
  const key = `${String(record.title ?? "").toLowerCase()} — ${String(record.artist ?? "").toLowerCase()}`;
  const title = `${record.title ?? ""} ${record.artist ?? ""}`.toLowerCase();
  const pressing = String(record.pressing ?? "").toLowerCase();

  const known = {
    "baby you got it — brenton wood": 1,
    "ratatouille — michael giacchino": 1,
    "guardians of the galaxy vol. 2: deluxe edition — tyler bates": 2,
    "live in concert: the complete performance — ray charles": 2,
    "the best of sade — sade": 2,
    "the greatest hits of the century, vol. iii and iv (50's and 60's) — various artists": 2,
  };

  if (known[key]) return known[key];
  if (pressing.includes("picture disc") || title.includes("single") || title.includes("7-inch")) return 1;
  if (
    title.includes("vol. iii and iv") ||
    title.includes("deluxe edition") ||
    title.includes("complete performance") ||
    title.includes("best of sade") ||
    title.includes("greatest hits of the century")
  ) {
    return 2;
  }
  return typeof record.discCount === "number" ? record.discCount : 1;
}

function inferLabel(record) {
  const key = `${String(record.title ?? "").toLowerCase()} — ${String(record.artist ?? "").toLowerCase()}`;
  const title = String(record.title ?? "").toLowerCase();
  const artist = String(record.artist ?? "").toLowerCase();
  const pressing = String(record.pressing ?? "").toLowerCase();

  const known = {
    "tommy dorsey and his orchestra featuring frank sinatra — tommy dorsey and his orchestra": "Coronet Records",
    "big band 75 — various artists": "RCA Special Products",
    "guardians of the galaxy vol. 2: deluxe edition — tyler bates": "Hollywood Records",
    "what you see ain't always what you get — luke combs": "Columbia Nashville",
    "live in concert: the complete performance — ray charles": "Atlantic Records",
    "in japan 1987 fukui vol. 2 — chet baker": "King Records",
    "she shot me down — frank sinatra": "Reprise Records",
    "cornerstone — styx": "A&M Records",
    "satchmo's golden favorites — louis armstrong": "Coronet Records",
    "wicked: for good - the soundtrack — stephen schwartz": "Decca Records",
    "live in concert: all of me and a little bit more — engelbert humperdinck": "Parrot Records",
    "1943-46 live — harry james and his orchestra": "Columbia Records",
    "walt disney's alice in wonderland — walt disney": "Disneyland Records",
    "revolver — the beatles": "Capitol Records",
    "hello, dolly! this is louis armstrong — louis armstrong and the all stars": "Kapp Records",
    "that's life — frank sinatra": "Reprise Records",
    "all the way — frank sinatra": "Capitol Records",
    "swingin' stereo! with ten big bands — various artists": "Capitol Records",
    "the greatest hits of the century, vol. iii and iv (50's and 60's) — various artists": "The Hitwave",
    "the jazz singer — neil diamond": "Columbia Records",
    "the voice of frank sinatra — frank sinatra": "Columbia Records",
    "swing along with me — frank sinatra": "Reprise Records",
    "the jeppsens wedding mix — the jeppsens": "The Jeppsens",
    "the beach boys today! — the beach boys": "Capitol Records",
    "como's golden records — perry como": "RCA Victor",
    "wild about harry! — harry james": "Capitol Records",
    "strictly instrumental — harry james and his orchestra": "Capitol Records",
    "the sound of music — rodgers and hammerstein": "RCA Victor",
    "tony bennett's all-time greatest hits — tony bennett": "Columbia Records",
    "greatest hits — the ink spots": "Decca Records",
    "jazz — queen": "Elektra Records",
    "hear the beatles tell all — the beatles": "Vee-Jay Records",
    "historia del jazz: louis armstrong y su orquesta — louis armstrong y su orquesta": "Coronet Records",
    "glass houses — billy joel": "Columbia Records",
    "an innocent man — billy joel": "Columbia Records",
    "baby you got it — brenton wood": "Double Shot Records",
    "ratatouille — michael giacchino": "Walt Disney Records",
    "the empire strikes back — john williams": "20th Century Records",
    "lady bird — jon brion": "Lakeshore Records",
    "spider-man: original motion picture score — danny elfman": "La-La Land Records",
    "signs of light — the head and the heart": "Dualtone Records",
    "swing easy! — frank sinatra": "Capitol Records",
    "tom jones live! at the talk of the town — tom jones": "Decca Records",
    "the best of sade — sade": "Epic Records",
    "brothers in arms — dire straits": "Vertigo",
    "bob dylan's greatest hits — bob dylan": "Columbia Records",
    "breakfast at tiffany's — henry mancini": "RCA Victor",
    "ella and louis — ella fitzgerald and louis armstrong": "Verve Records",
  };

  if (known[key]) return known[key];

  if (pressing.includes("reprise")) return "Reprise Records";
  if (pressing.includes("capitol")) return "Capitol Records";
  if (pressing.includes("columbia")) return "Columbia Records";
  if (pressing.includes("verve")) return "Verve Records";
  if (pressing.includes("kapp")) return "Kapp Records";
  if (pressing.includes("a&m")) return "A&M Records";
  if (pressing.includes("coronet")) return "Coronet Records";
  if (pressing.includes("disneyland")) return "Disneyland Records";
  if (title.includes("walt disney")) return "Disneyland Records";
  if (artist.includes("billy joel")) return "Columbia Records";
  if (artist.includes("frank sinatra")) return title.includes("all the way") || title.includes("the voice") ? "Capitol Records" : "Reprise Records";

  return record.label ?? undefined;
}

function inferCollectorMetadata(record) {
  const next = { ...record };

  next.format = inferFormat(next);
  next.discCount = inferDiscCount(next);
  if (!next.label) next.label = inferLabel(next);

  if (!next.catalogNumber) {
    const pressing = String(next.pressing ?? "");
    const catalogMatch = pressing.match(/\b([A-Z0-9]{2,4}[- ]?\d{2,5}[A-Z0-9-]*)\b/);
    if (catalogMatch) next.catalogNumber = catalogMatch[1];
  }

  return next;
}

async function main() {
  await loadEnvFile(path.resolve(process.cwd(), ".env.local"));
  const supabase = getSupabaseClient();

  const manifestPath = path.resolve(process.cwd(), "vinyl-import/records.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  if (!Array.isArray(manifest)) throw new Error("Manifest must be a JSON array.");

  const { data, error } = await supabase.from("vinyl_records").select("id, record");
  if (error) throw error;

  const liveRecords = new Map((data ?? []).map((row) => [row.id, row.record]));
  const nextManifest = [];
  let updatedCount = 0;

  for (const input of manifest) {
    const liveRecord = liveRecords.get(input.id);
    if (!liveRecord) {
      nextManifest.push(inferCollectorMetadata(input));
      continue;
    }

    const merged = {
      ...liveRecord,
      ...input,
      coverImage: liveRecord.coverImage,
      backCoverImage: liveRecord.backCoverImage,
    };

    const nextRecord = inferCollectorMetadata(merged);
    nextManifest.push({
      ...input,
      originalReleaseYear: nextRecord.originalReleaseYear,
      recordingYears: nextRecord.recordingYears,
      pressingYear: nextRecord.pressingYear,
      pressingNotes: nextRecord.pressingNotes,
      label: nextRecord.label,
      catalogNumber: nextRecord.catalogNumber,
      format: nextRecord.format,
      discCount: nextRecord.discCount,
    });

    const { error: updateError } = await supabase.from("vinyl_records").upsert({
      id: nextRecord.id,
      record: nextRecord,
      updated_at: new Date().toISOString(),
    });

    if (updateError) throw updateError;
    updatedCount += 1;
  }

  await writeFile(manifestPath, `${JSON.stringify(nextManifest, null, 2)}\n`);
  console.log(`Updated ${updatedCount} live records and wrote collector fields into the manifest.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
