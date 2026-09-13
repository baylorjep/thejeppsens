import {
  CachedDiscogsData,
  getCachedDiscogsRelease,
  isCacheFresh,
  setCachedDiscogsRelease,
} from "@/lib/discogsCacheServer";
import {
  fetchDiscogsMarketplaceStats,
  fetchDiscogsPriceSuggestions,
  fetchDiscogsRelease,
  normalizeConditionToDiscogsGrade,
} from "@/lib/discogsServer";
import { NextResponse, after } from "next/server";

async function refreshDiscogsRelease(releaseId: string): Promise<CachedDiscogsData | null> {
  const [priceSuggestions, marketplaceStats, release] = await Promise.all([
    fetchDiscogsPriceSuggestions(releaseId),
    fetchDiscogsMarketplaceStats(releaseId),
    fetchDiscogsRelease(releaseId),
  ]);

  if (priceSuggestions === null || marketplaceStats === null) return null;

  const data: CachedDiscogsData = {
    priceSuggestions,
    lowestListing: marketplaceStats.lowest_price ?? null,
    numForSale: marketplaceStats.num_for_sale ?? 0,
    have: release?.community?.have ?? null,
    want: release?.community?.want ?? null,
    ratingAverage: release?.community?.rating?.average ?? null,
    ratingCount: release?.community?.rating?.count ?? null,
    formatDescriptions: release?.formats?.[0]?.descriptions ?? [],
    country: release?.country ?? null,
    artists: (release?.artists ?? []).map((artist) => artist.name.replace(/\s\(\d+\)$/, "")),
  };

  await setCachedDiscogsRelease(releaseId, data);
  return data;
}

function buildResponse(data: CachedDiscogsData, condition: string | undefined, cached: boolean) {
  const { grade, isGuess } = normalizeConditionToDiscogsGrade(condition);

  return NextResponse.json({
    grade,
    isGuess,
    estimate: data.priceSuggestions[grade] ?? null,
    lowestListing: data.lowestListing,
    numForSale: data.numForSale,
    have: data.have,
    want: data.want,
    ratingAverage: data.ratingAverage,
    ratingCount: data.ratingCount,
    formatDescriptions: data.formatDescriptions,
    country: data.country,
    artists: data.artists,
    cached,
  });
}

export async function GET(request: Request, { params }: { params: Promise<{ releaseId: string }> }) {
  const { releaseId } = await params;
  const { searchParams } = new URL(request.url);
  const condition = searchParams.get("condition") ?? undefined;
  const forceRefresh = searchParams.get("refresh") === "true";

  try {
    const cached = forceRefresh ? null : await getCachedDiscogsRelease(releaseId);

    if (cached) {
      // Serve what we have immediately, no matter how old it is. If it's
      // stale, refresh it in the background after responding - the next
      // request (not this one) gets the update, so nobody ever waits.
      if (!isCacheFresh(cached.updatedAt)) {
        after(() => refreshDiscogsRelease(releaseId).catch((error) => console.error("Background Discogs refresh failed", error)));
      }
      return buildResponse(cached.data, condition, true);
    }

    // Nothing cached yet (or an explicit refresh was requested) - this one
    // has to wait on a live fetch since there's nothing else to show.
    const data = await refreshDiscogsRelease(releaseId);
    if (!data) return NextResponse.json({ error: "Discogs is not configured" }, { status: 501 });

    return buildResponse(data, condition, false);
  } catch (error) {
    console.error("Discogs value lookup failed", error);
    return NextResponse.json({ error: "Could not load value from Discogs" }, { status: 502 });
  }
}
