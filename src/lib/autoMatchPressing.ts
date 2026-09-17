import { fetchPressingCandidates } from "./discogsServer";
import { canMatchText, matchPressing, matchedMetadata } from "./pressingMatcher";
import type { PressingSubmission } from "./pressingEvidence";
import type { getVinylSupabaseClient } from "./supabaseVinylServer";

export async function autoMatchPressing(db: NonNullable<ReturnType<typeof getVinylSupabaseClient>>, album: { title: string; artist: string }, submission: PressingSubmission, lookup = fetchPressingCandidates): Promise<PressingSubmission> {
  let decision;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const candidates = canMatchText(submission.evidence) ? await Promise.race([
      lookup(album.artist, album.title),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Lookup timed out")), 25_000); }),
    ]) : { releases: [], complete: false };
    decision = matchPressing(submission.evidence, album, candidates.releases, candidates.complete);
  } catch {
    decision = { kind: "review" as const, notes: "Your details are saved. Discogs is unavailable or the lookup took too long; Baylor can review this submission. No automatic match was confirmed." };
  }
  clearTimeout(timer);
  if (decision.kind === "confirmed" && decision.release) {
    const { data, error } = await db.rpc("review_vinyl_pressing", {
      p_record_id: submission.record_id, p_revision: submission.revision, p_status: "confirmed",
      p_notes: decision.notes, p_release_id: decision.release.id, p_metadata: matchedMetadata(decision.release),
    });
    if (!error && data) return data;
    // Never fall back to overwriting a submission that changed while Discogs ran.
  } else {
    const { data, error } = await db.from("vinyl_pressing_submissions")
      .update({ review_notes: decision.notes })
      .eq("record_id", submission.record_id).eq("revision", submission.revision).eq("status", "pending")
      .select().maybeSingle();
    if (!error && data) return data;
  }
  const latest = await db.from("vinyl_pressing_submissions").select("*").eq("record_id", submission.record_id).maybeSingle();
  if (!latest.error && latest.data) return latest.data;
  return submission; // Evidence was already saved; do not report a failed save.
}
