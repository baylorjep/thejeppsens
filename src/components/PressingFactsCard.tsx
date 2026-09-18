import { VinylRecord } from "@/data/vinyls";
import { getLimitedEditionSize, getPressingFacts } from "@/lib/vinylRecordUtils";
import { Lightbulb } from "lucide-react";

export default function PressingFactsCard({ record }: { record: VinylRecord }) {
  const facts = getPressingFacts(record);
  const limitedEditionSize = getLimitedEditionSize(record);
  if (!facts.length && !limitedEditionSize) return null;

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
        <Lightbulb className="h-4 w-4" />
        Interesting facts about this pressing
      </div>
      {limitedEditionSize ? (
        <p className="mt-3 inline-flex rounded-full bg-indigo-900 px-3 py-1 text-xs font-semibold text-white">
          Limited to {limitedEditionSize.toLocaleString()} copies
        </p>
      ) : null}
      <ul className="mt-3 space-y-2 text-sm leading-6 text-indigo-950">
        {facts.map((fact, index) => (
          <li key={index} className="flex gap-2">
            <span className="text-indigo-400">•</span>
            <span className="whitespace-pre-line">{fact}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
