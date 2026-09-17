import { getVinylSupabaseClient } from "@/lib/supabaseVinylServer";
import { missingEvidence, validateEvidence } from "@/lib/pressingEvidence";
import { NextResponse } from "next/server";

type Context = { params: Promise<{ id: string }> };
const BUCKET = "vinyl-covers";

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const db = getVinylSupabaseClient();
  if (!db) return NextResponse.json({ error: "Cloud storage is unavailable. Please try again later." }, { status: 503 });
  const [record, submission] = await Promise.all([
    db.from("vinyl_records").select("record").eq("id", id).maybeSingle(),
    db.from("vinyl_pressing_submissions").select("*").eq("record_id", id).maybeSingle(),
  ]);
  if (record.error || submission.error) return NextResponse.json({ error: "Could not load the saved submission. Please retry." }, { status: 503 });
  if (!record.data) return NextResponse.json({ error: "Save this album to the collection before identifying its pressing." }, { status: 404 });
  return NextResponse.json({ record: record.data.record, submission: submission.data });
}

export async function PUT(request: Request, { params }: Context) {
  const { id } = await params;
  const db = getVinylSupabaseClient();
  if (!db) return NextResponse.json({ error: "Cloud storage is unavailable. Nothing has been submitted." }, { status: 503 });
  try {
    const { evidence, revision, submit } = await request.json();
    validateEvidence(evidence);
    if (typeof submit !== "boolean" || (revision !== null && (typeof revision !== "string" || !/^[0-9a-f-]{36}$/.test(revision)))) throw new Error("Invalid submission revision.");
    for (const photo of evidence.photos) {
      if (!photo.path.startsWith(`pressing/${encodeURIComponent(id)}/`) || photo.path.includes("..") || db.storage.from(BUCKET).getPublicUrl(photo.path).data.publicUrl !== photo.url) throw new Error("Invalid photo attachment.");
    }
    const missing = missingEvidence(evidence);
    if (submit && missing.length) return NextResponse.json({ error: `Still needed: ${missing.join("; ")}` }, { status: 400 });
    const row = { record_id: id, evidence, status: submit ? "pending" : "draft", revision: crypto.randomUUID(), updated_at: new Date().toISOString(), processed_at: null, release_id: null, review_notes: null };
    const result = revision
      ? await db.from("vinyl_pressing_submissions").update(row).eq("record_id", id).eq("revision", revision).select().maybeSingle()
      : await db.from("vinyl_pressing_submissions").insert(row).select().single();
    if (result.error?.code === "23505" || (!result.error && !result.data)) return NextResponse.json({ error: "This submission changed in another session. Reload before saving so you don’t overwrite it." }, { status: 409 });
    if (result.error) { console.error("Pressing save failed", result.error); return NextResponse.json({ error: "Could not save to the cloud. Your changes are still on this page; please retry." }, { status: 503 }); }
    return NextResponse.json({ submission: result.data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid submission." }, { status: 400 });
  }
}

export async function POST(request: Request, { params }: Context) {
  const { id } = await params;
  const db = getVinylSupabaseClient();
  if (!db) return NextResponse.json({ error: "Cloud storage is unavailable." }, { status: 503 });
  const record = await db.from("vinyl_records").select("id").eq("id", id).maybeSingle();
  if (record.error || !record.data) return NextResponse.json({ error: "Save the album first." }, { status: 404 });
  try {
    const form = await request.formData();
    const file = form.get("photo");
    if (!(file instanceof File) || file.size > 4_000_000 || file.size === 0 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, or WebP photo smaller than 4 MB." }, { status: 400 });
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
    const path = `pressing/${encodeURIComponent(id)}/${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from(BUCKET).upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
    if (error) throw error;
    return NextResponse.json({ path, url: db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl });
  } catch { return NextResponse.json({ error: "Photo upload failed. Please retry." }, { status: 503 }); }
}
