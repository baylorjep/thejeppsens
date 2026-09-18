import { fetchDiscogsMasterYear, fetchDiscogsRelease } from "@/lib/discogsServer";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const release = await fetchDiscogsRelease(id);
    if (release === null) {
      return NextResponse.json({ error: "Discogs is not configured" }, { status: 501 });
    }

    // Fetched server-side so the client's applyDiscogsMatchToRecord can treat it
    // as authoritative without an extra round trip of its own.
    const masterYear = release.master_id ? await fetchDiscogsMasterYear(release.master_id).catch(() => null) : null;

    return NextResponse.json({ release: { ...release, masterYear } });
  } catch (error) {
    console.error("Discogs release lookup failed", error);
    return NextResponse.json({ error: "Could not load release from Discogs" }, { status: 502 });
  }
}
