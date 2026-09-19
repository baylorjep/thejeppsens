import labelCatalogs from "@/data/labelCatalogs.json";
import { NextResponse } from "next/server";

type LabelCatalog = { artist: string; label: string; albumsConsidered: number; albums: { title: string; year: number }[] };

// Must match the keys scripts/build-label-catalogs.mjs writes.
const norm = (value: string) => value.toLowerCase().replace(/\(.*?\)|\[.*?\]/g, "").replace(/&/g, "and").replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, "");
const labelQuery = (label: string) => label.replace(/\s*\(.*$/, "").split(" / ")[0].trim();

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const artist = params.get("artist")?.trim();
  const label = params.get("label")?.trim();
  if (!artist || !label) return NextResponse.json({ error: "Missing artist or label" }, { status: 400 });

  const catalog = (labelCatalogs as Record<string, LabelCatalog>)[`${norm(artist)}|${norm(labelQuery(label))}`];
  return NextResponse.json(
    { catalog: catalog ?? null },
    { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}
