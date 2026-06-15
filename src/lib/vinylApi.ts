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

export async function saveVinylRecord(record: VinylRecord, imageFile?: File, backImageFile?: File) {
  const formData = new FormData();
  formData.set("record", JSON.stringify(record));
  if (imageFile) formData.set("cover", imageFile);
  if (backImageFile) formData.set("backCover", backImageFile);

  const response = await fetch("/api/vinyl-records", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Could not save vinyl record");
  return response.json() as Promise<{ record: VinylRecord; source: VinylApiStatus }>;
}

export async function deleteVinylRecord(id: string) {
  const response = await fetch(`/api/vinyl-records/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error("Could not delete vinyl record");
  return response.json() as Promise<{ ok: boolean; source: VinylApiStatus }>;
}
