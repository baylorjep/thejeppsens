import { vinyls } from "@/data/vinyls";
import { listSupabaseVinylRecords, saveSupabaseVinylRecord } from "@/lib/supabaseVinylServer";
import { isVinylRecord } from "@/lib/vinylRecordUtils";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const records = await listSupabaseVinylRecords();
    if (records) return NextResponse.json({ records, source: "supabase" });
  } catch (error) {
    console.error("Could not list Supabase vinyl records", error);
  }

  return NextResponse.json({ records: vinyls, source: "local" });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const rawRecord = formData.get("record");
    const cover = formData.get("cover");

    if (typeof rawRecord !== "string") {
      return NextResponse.json({ error: "Missing record" }, { status: 400 });
    }

    const record = JSON.parse(rawRecord);

    if (!isVinylRecord(record)) {
      return NextResponse.json({ error: "Invalid record" }, { status: 400 });
    }

    const savedRecord = await saveSupabaseVinylRecord(record, cover instanceof File ? cover : undefined);

    if (savedRecord) {
      return NextResponse.json({ record: savedRecord, source: "supabase" });
    }

    return NextResponse.json({ record, source: "local" });
  } catch (error) {
    console.error("Could not save vinyl record", error);
    return NextResponse.json({ error: "Could not save record" }, { status: 500 });
  }
}
