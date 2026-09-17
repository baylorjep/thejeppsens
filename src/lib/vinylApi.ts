import { missingEvidence, type PressingEvidence, type PressingSubmission } from "./pressingEvidence";
import { VinylRecord } from "@/data/vinyls";

export type VinylApiStatus = "supabase" | "local";

export type VinylApiListResponse = {
  records: VinylRecord[];
  source: VinylApiStatus;
};

export async function fetchVinylRecords(): Promise<VinylApiListResponse> {
  const response = await fetch("/api/vinyl-records", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load vinyl records");
  return response.json();
}

export async function saveVinylRecord(record: VinylRecord, imageFile?: File, backImageFile?: File, pressing?: { evidence: PressingEvidence; files: { side: string; file: File }[] }) {
  const formData = new FormData();
  formData.set("record", JSON.stringify(record));
  if (imageFile) formData.set("cover", imageFile);
  if (backImageFile) formData.set("backCover", backImageFile);

  const response = await fetch("/api/vinyl-records", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Could not save vinyl record");
  const result = await response.json() as { record: VinylRecord; source: VinylApiStatus; pressingStatus?: PressingSubmission["status"]; pressingError?: string };
  if (!pressing) return result;
  if (result.source !== "supabase") return { ...result, pressingError: "Album saved locally. Identification is not saved yet. Keep this form open and retry when connected." };
  // Save the album first so each photo can upload separately within request size limits.
  const endpoint = `/api/vinyl-records/${encodeURIComponent(result.record.id)}/pressing`;
  try {
    const currentResponse = await fetch(endpoint, { cache: "no-store" });
    const current = await currentResponse.json();
    if (!currentResponse.ok) throw new Error(current.error || "Could not check identification status.");
    // A retry after a lost response must not overwrite an already saved submission.
    if (current.submission) return { ...result, pressingStatus: current.submission.status };
    const evidence = { ...pressing.evidence, photos: [...pressing.evidence.photos] };
    for (const { side, file } of pressing.files) {
      const body = new FormData(); body.set("photo", file);
      const uploaded = await fetch(endpoint, { method: "POST", body });
      const photo = await uploaded.json();
      if (!uploaded.ok) throw new Error(photo.error || "Could not upload marking photo.");
      evidence.photos.push({ ...photo, kind: "runout", side });
    }
    const submit = missingEvidence(evidence, result.record).length === 0;
    const saved = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evidence, revision: null, submit }) });
    const data = await saved.json();
    if (!saved.ok) throw new Error(data.error || "Could not save identification.");
    return { ...result, pressingStatus: data.submission.status as PressingSubmission["status"] };
  } catch (error) {
    return { ...result, pressingError: `Album saved, but identification was not saved: ${error instanceof Error ? error.message : "Connection failed."} Your entries are still here. Retry saving.` };
  }
}

export async function deleteVinylRecord(id: string) {
  const response = await fetch(`/api/vinyl-records/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("Could not delete vinyl record");
  return response.json() as Promise<{ ok: boolean; source: VinylApiStatus }>;
}
