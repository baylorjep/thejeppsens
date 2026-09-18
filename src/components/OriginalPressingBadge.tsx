import { VinylRecord } from "@/data/vinyls";
import { isOriginalPressing } from "@/lib/vinylRecordUtils";
import { Sparkles } from "lucide-react";

export default function OriginalPressingBadge({ record }: { record: VinylRecord }) {
  if (!isOriginalPressing(record)) return null;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-1 text-xs font-semibold text-amber-800">
      <Sparkles className="h-3.5 w-3.5" />
      Original pressing
    </span>
  );
}
