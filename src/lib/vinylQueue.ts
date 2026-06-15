import { VinylRecord } from "@/data/vinyls";
import { isVinylRecord } from "@/lib/vinylRecordUtils";

export const VINYL_QUEUE_STORAGE_KEY = "vinyl-record-queue";

export function readQueuedVinyls(): VinylRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const rawRecords = window.localStorage.getItem(VINYL_QUEUE_STORAGE_KEY);
    if (!rawRecords) return [];

    const parsedRecords = JSON.parse(rawRecords);
    if (!Array.isArray(parsedRecords)) return [];

    return parsedRecords.filter(isVinylRecord);
  } catch {
    return [];
  }
}

export function writeQueuedVinyls(records: VinylRecord[]) {
  window.localStorage.setItem(VINYL_QUEUE_STORAGE_KEY, JSON.stringify(records));
}
