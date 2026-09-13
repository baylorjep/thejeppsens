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

  try {
    const [priceSuggestions, marketplaceStats, release] = await Promise.all([
      fetchDiscogsPriceSuggestions(releaseId),
      fetchDiscogsMarketplaceStats(releaseId),
      fetchDiscogsRelease(releaseId),
    ]);

    if (priceSuggestions === null || marketplaceStats === null) {
      return NextResponse.json({ error: "Discogs is not configured" }, { status: 501 });
    }

    const { grade, isGuess } = normalizeConditionToDiscogsGrade(condition);

    return NextResponse.json({
      grade,
      isGuess,
      estimate: priceSuggestions[grade] ?? null,
      lowestListing: marketplaceStats.lowest_price ?? null,
      numForSale: marketplaceStats.num_for_sale ?? 0,
      have: release?.community?.have ?? null,
      want: release?.community?.want ?? null,
      ratingAverage: release?.community?.rating?.average ?? null,
      ratingCount: release?.community?.rating?.count ?? null,
      formatDescriptions: release?.formats?.[0]?.descriptions ?? [],
      country: release?.country ?? null,
    });
  } catch (error) {
    console.error("Discogs value lookup failed", error);
    return NextResponse.json({ error: "Could not load value from Discogs" }, { status: 502 });
  }
}
