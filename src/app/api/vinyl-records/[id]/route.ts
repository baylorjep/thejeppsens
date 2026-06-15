import { deleteSupabaseVinylRecord } from "@/lib/supabaseVinylServer";
import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const deleted = await deleteSupabaseVinylRecord(id);

    return NextResponse.json({ ok: true, source: deleted ? "supabase" : "local" });
  } catch (error) {
    console.error("Could not delete vinyl record", error);
    return NextResponse.json({ error: "Could not delete record" }, { status: 500 });
  }
}
