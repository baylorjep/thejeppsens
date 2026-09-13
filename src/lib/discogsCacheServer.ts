import { createClient } from "@supabase/supabase-js";

const CACHE_TABLE = "discogs_release_cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export type CachedDiscogsData = {
  priceSuggestions: Record<string, { currency: string; value: number }>;
  lowestListing: { currency: string; value: number } | null;
  numForSale: number;
  have: number | null;
  want: number | null;
  ratingAverage: number | null;
  ratingCount: number | null;
  formatDescriptions: string[];
  country: string | null;
  artists: string[];
};

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isCacheFresh(updatedAt: string) {
  return Date.now() - new Date(updatedAt).getTime() < CACHE_TTL_MS;
}

export async function getCachedDiscogsRelease(releaseId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(CACHE_TABLE)
    .select("data, updated_at")
    .eq("release_id", releaseId)
    .maybeSingle();

  if (error || !data) return null;
  return { data: data.data as CachedDiscogsData, updatedAt: data.updated_at as string };
}

export async function setCachedDiscogsRelease(releaseId: string, data: CachedDiscogsData) {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  await supabase.from(CACHE_TABLE).upsert({
    release_id: releaseId,
    data,
    updated_at: new Date().toISOString(),
  });
}
