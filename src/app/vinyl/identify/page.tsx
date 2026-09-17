import Header from "@/components/Header";
import Link from "next/link";
import VinylPressingQueue from "@/components/VinylPressingQueue";
import { getVinylSupabaseClient, listSupabaseVinylRecords } from "@/lib/supabaseVinylServer";
import type { PressingSubmission } from "@/lib/pressingEvidence";
export const dynamic = "force-dynamic";
export const metadata = { title: "Identify pressings · Isabel’s vinyl" };
export default async function PressingQueuePage() {
  let records: Awaited<ReturnType<typeof listSupabaseVinylRecords>> = null;
  let submissions: Pick<PressingSubmission, "record_id" | "status">[] = [];
  let failed = false;
  try {
    const db = getVinylSupabaseClient();
    if (!db) throw new Error("Unavailable");
    const [collection, queue] = await Promise.all([listSupabaseVinylRecords(), db.from("vinyl_pressing_submissions").select("record_id,status")]);
    if (queue.error) throw queue.error;
    records = collection; submissions = queue.data;
  } catch { failed = true; }
  return <main className="min-h-screen bg-white"><Header /><section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
    <Link href="/vinyl" className="text-sm text-gray-500 hover:underline">← Vinyl catalog</Link>
    <h1 className="mt-7 text-4xl font-semibold tracking-tight">Identify your pressings</h1>
    <p className="mt-4 leading-7 text-gray-600">Find the exact edition of a record you own. Choose an album below, then follow the photo guide one side at a time. Typed codes are checked automatically. Baylor reviews photos and uncertain matches.</p>
    <ol className="mt-6 grid gap-3 text-sm sm:grid-cols-3"><li className="rounded-xl bg-stone-100 p-4"><strong>1. Choose your album</strong><p className="mt-2 text-gray-600">Have your physical copy and phone handy.</p></li><li className="rounded-xl bg-stone-100 p-4"><strong>2. Follow the photo guide</strong><p className="mt-2 text-gray-600">We’ll show you exactly where to look. Save a draft at any time.</p></li><li className="rounded-xl bg-stone-100 p-4"><strong>3. Save & identify</strong><p className="mt-2 text-gray-600">Get a match or see what still needs checking.</p></li></ol>
    <Link href="/vinyl/manage" className="mt-4 inline-block text-sm underline">New album? Add it to the collection first →</Link>
    {failed ? <p role="alert" className="mt-8 rounded-xl bg-amber-50 p-5">The saved queue is unavailable right now. Please refresh and try again.</p> : <VinylPressingQueue records={records ?? []} submissions={submissions} />}
  </section></main>;
}
