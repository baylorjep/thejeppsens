import { VinylRecord } from "@/data/vinyls";
import { isVinylRecord } from "@/lib/vinylRecordUtils";
import { createClient } from "@supabase/supabase-js";

const VINYL_BUCKET = "vinyl-covers";

type VinylRow = {
  id: string;
  record: VinylRecord;
};

export function getVinylSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) return null;

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function listSupabaseVinylRecords() {
  const supabase = getVinylSupabaseClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("vinyl_records")
    .select("id, record")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return ((data ?? []) as VinylRow[]).map((row) => row.record).filter(isVinylRecord);
}

export async function saveSupabaseVinylRecord(record: VinylRecord, covers: { front?: File; back?: File } = {}) {
  const supabase = getVinylSupabaseClient();
  if (!supabase) return null;
  const client = supabase;

  let nextRecord = record;

  async function uploadCover(file: File, side: "front" | "back") {
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${record.id}-${side}-${Date.now()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await client.storage
      .from(VINYL_BUCKET)
      .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: true });

    if (uploadError) throw uploadError;

    const { data } = client.storage.from(VINYL_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  if (covers.front) {
    nextRecord = { ...nextRecord, coverImage: await uploadCover(covers.front, "front") };
  }

  if (covers.back) {
    nextRecord = { ...nextRecord, backCoverImage: await uploadCover(covers.back, "back") };
  }

  const { error } = await client
    .from("vinyl_records")
    .upsert({
      id: nextRecord.id,
      record: nextRecord,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;

  return nextRecord;
}

export async function deleteSupabaseVinylRecord(id: string) {
  const supabase = getVinylSupabaseClient();
  if (!supabase) return null;

  const { error } = await supabase.from("vinyl_records").delete().eq("id", id);
  if (error) throw error;

  return true;
}
