import { searchDiscogsReleases } from "@/lib/discogsServer";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ error: "Missing search query" }, { status: 400 });
  }

  try {
    const results = await searchDiscogsReleases(query);
    if (results === null) {
      return NextResponse.json({ error: "Discogs is not configured" }, { status: 501 });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Discogs search failed", error);
    return NextResponse.json({ error: "Could not search Discogs" }, { status: 502 });
  }
}
