import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import ffmpegPath from "ffmpeg-static";

export const runtime = "nodejs";
export const maxDuration = 60;

const execFileAsync = promisify(execFile);
const YT_DLP_BIN = path.join(process.cwd(), "bin", "yt-dlp");
const MAX_DURATION_SECONDS = 20 * 60;

const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

function isAllowedYoutubeUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return null;
    if (!ALLOWED_HOSTS.has(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const { url: rawUrl } = await request.json().catch(() => ({ url: "" }));
  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  const url = isAllowedYoutubeUrl(rawUrl.trim());
  if (!url) {
    return NextResponse.json({ error: "Only youtube.com / youtu.be links are supported" }, { status: 400 });
  }

  if (!ffmpegPath) {
    return NextResponse.json({ error: "ffmpeg binary not found" }, { status: 500 });
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "mp3-tool-"));

  try {
    const { stdout } = await execFileAsync(
      YT_DLP_BIN,
      [
        "--no-playlist",
        "--no-warnings",
        "--restrict-filenames",
        "--max-filesize",
        "100M",
        "--match-filter",
        `duration < ${MAX_DURATION_SECONDS}`,
        "-f",
        "bestaudio/best",
        "-x",
        "--audio-format",
        "mp3",
        "--audio-quality",
        "0",
        "--ffmpeg-location",
        path.dirname(ffmpegPath),
        "--print",
        "after_move:filepath",
        "-o",
        path.join(workDir, "%(title).200B.%(ext)s"),
        url.toString(),
      ],
      { timeout: 50_000, maxBuffer: 10 * 1024 * 1024 },
    );

    const filePath = stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .pop();

    if (!filePath) {
      return NextResponse.json({ error: "Conversion did not produce a file" }, { status: 500 });
    }

    const fileBuffer = await readFile(filePath);
    const filename = path.basename(filePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(fileBuffer.byteLength),
      },
    });
  } catch (error) {
    console.error("[mp3-tool] conversion failed", error);
    const message =
      error && typeof error === "object" && "killed" in error && (error as { killed?: boolean }).killed
        ? "Conversion timed out — try a shorter video."
        : "Conversion failed. The video may be unavailable, age-restricted, or too long.";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}
