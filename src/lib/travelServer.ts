import { getSupabaseServerClient } from "@/lib/supabaseServer";

const TRAVEL_PHOTOS_BUCKET = "travel-photos";

export function getTravelSupabaseClient() {
  return getSupabaseServerClient();
}

export async function uploadTravelPhoto(countryId: string, file: File) {
  const supabase = getTravelSupabaseClient();
  if (!supabase) return null;

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${countryId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from(TRAVEL_PHOTOS_BUCKET).upload(path, buffer, {
    contentType: file.type || "image/jpeg",
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(TRAVEL_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
