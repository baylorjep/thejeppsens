import { VinylRecord } from "@/data/vinyls";
import { isRecordStoreDay } from "@/lib/vinylRecordUtils";
import { Store } from "lucide-react";

export default function RecordStoreDayBadge({ record }: { record: VinylRecord }) {
  if (!isRecordStoreDay(record)) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-gradient-to-r from-rose-50 to-pink-50 px-3 py-1 text-xs font-semibold text-rose-800">
      <Store className="h-3.5 w-3.5" />
      Record Store Day
    </span>
  );
}
