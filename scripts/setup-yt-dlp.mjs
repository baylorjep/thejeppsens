// Downloads the standalone yt-dlp binary (Python bundled in, no system
// interpreter required) for whichever platform `npm install` runs on.
// Runs locally on macOS and again on Vercel's Linux build image, so the
// binary that ends up in bin/ always matches the machine that will run it.
import { createWriteStream, existsSync, chmodSync, mkdirSync } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const binDir = path.join(__dirname, "..", "bin");
const destPath = path.join(binDir, "yt-dlp");

const ASSET_BY_PLATFORM = {
  darwin: "yt-dlp_macos",
  linux: "yt-dlp_linux",
};

const asset = ASSET_BY_PLATFORM[process.platform];
if (!asset) {
  console.warn(`[setup-yt-dlp] Unsupported platform "${process.platform}", skipping download.`);
  process.exit(0);
}

if (existsSync(destPath)) {
  console.log("[setup-yt-dlp] bin/yt-dlp already present, skipping download.");
  process.exit(0);
}

mkdirSync(binDir, { recursive: true });

const url = `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${asset}`;
console.log(`[setup-yt-dlp] Downloading ${url}`);

const response = await fetch(url, { redirect: "follow" });
if (!response.ok || !response.body) {
  throw new Error(`[setup-yt-dlp] Failed to download yt-dlp binary: ${response.status} ${response.statusText}`);
}

await pipeline(Readable.fromWeb(response.body), createWriteStream(destPath));
chmodSync(destPath, 0o755);

console.log(`[setup-yt-dlp] Saved to ${destPath}`);
