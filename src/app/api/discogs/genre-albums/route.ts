import { searchDiscogsGenreAlbums } from "@/lib/discogsServer";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const genre = new URL(request.url).searchParams.get("genre")?.trim();
  if (!genre || genre.length > 80) {
    return NextResponse.json({ error: "Missing genre" }, { status: 400 });
  }

  try {
    const albums = await searchDiscogsGenreAlbums(genre);
    if (albums === null) {
      return NextResponse.json({ error: "Discogs is not configured" }, { status: 501 });
    }

    return NextResponse.json(
      { albums },
      { headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error("Discogs genre albums lookup failed", error);
    return NextResponse.json({ error: "Could not load albums from Discogs" }, { status: 502 });
  }
}
