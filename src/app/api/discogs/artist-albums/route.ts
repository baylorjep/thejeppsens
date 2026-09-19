import { searchDiscogsArtistAlbums } from "@/lib/discogsServer";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const artist = new URL(request.url).searchParams.get("artist")?.trim();
  if (!artist || artist.length > 120) {
    return NextResponse.json({ error: "Missing artist" }, { status: 400 });
  }

  try {
    const albums = await searchDiscogsArtistAlbums(artist);
    if (albums === null) {
      return NextResponse.json({ error: "Discogs is not configured" }, { status: 501 });
    }

    // Discography lists change slowly; let the CDN hold them for a week.
    return NextResponse.json(
      { albums },
      { headers: { "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error("Discogs artist albums lookup failed", error);
    return NextResponse.json({ error: "Could not load albums from Discogs" }, { status: 502 });
  }
}
