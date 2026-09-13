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
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: Promise<{ releaseId: string }> }) {
  const { releaseId } = await params;
  const { searchParams } = new URL(request.url);
  const condition = searchParams.get("condition") ?? undefined;
  const forceRefresh = searchParams.get("refresh") === "true";

  try {
    let data: CachedDiscogsData | null = null;

    if (!forceRefresh) {
      const cached = await getCachedDiscogsRelease(releaseId);
      if (cached && isCacheFresh(cached.updatedAt)) data = cached.data;
    }

    const cacheHit = data !== null;

    if (!data) {
      const [priceSuggestions, marketplaceStats, release] = await Promise.all([
        fetchDiscogsPriceSuggestions(releaseId),
        fetchDiscogsMarketplaceStats(releaseId),
        fetchDiscogsRelease(releaseId),
      ]);

      if (priceSuggestions === null || marketplaceStats === null) {
        return NextResponse.json({ error: "Discogs is not configured" }, { status: 501 });
      }

      data = {
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

      // Fire-and-forget: don't make the response wait on the cache write.
      void setCachedDiscogsRelease(releaseId, data);
    }

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
      cached: cacheHit,
    });
  } catch (error) {
    console.error("Discogs value lookup failed", error);
    return NextResponse.json({ error: "Could not load value from Discogs" }, { status: 502 });
  }
}
