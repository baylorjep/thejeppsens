import { searchDiscogsTrendingAlbums } from "@/lib/discogsServer";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const albums = await searchDiscogsTrendingAlbums();
    if (albums === null) {
      return NextResponse.json({ error: "Discogs is not configured" }, { status: 501 });
    }

    // Buzz moves faster than discographies, so hold it for a day.
    return NextResponse.json(
      { albums },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=86400" } },
    );
  } catch (error) {
    console.error("Discogs trending albums lookup failed", error);
    return NextResponse.json({ error: "Could not load albums from Discogs" }, { status: 502 });
  }
}
