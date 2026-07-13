import { NextResponse } from "next/server";

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query) return NextResponse.json({ results: [] });

    const params = new URLSearchParams({
      q: query,
      format: "jsonv2",
      limit: "5",
      addressdetails: "1",
    });

    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        "User-Agent": "thejeppsens-travel-log/1.0",
        "Accept-Language": "en",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Could not search locations" }, { status: 502 });
    }

    const results = (await response.json()) as NominatimResult[];

    return NextResponse.json({
      results: results.map((result) => ({
        latitude: Number(result.lat),
        longitude: Number(result.lon),
        label: result.display_name,
      })),
    });
  } catch (error) {
    console.error("Could not geocode travel location", error);
    return NextResponse.json({ error: "Could not search locations" }, { status: 500 });
  }
}
