import { VinylRecord } from "@/data/vinyls";
import { getArtistCollectionStat, getLimitedEditionSize, getPressingFacts } from "@/lib/vinylRecordUtils";
import { Lightbulb } from "lucide-react";

export default function PressingFactsCard({ record, allRecords }: { record: VinylRecord; allRecords: VinylRecord[] }) {
  // Hand-curated facts (real trivia + the best of Discogs' notes, reviewed by a
  // person) take priority over the auto-filtered raw notes when they exist --
  // no denylist of regex patterns will ever catch everything Discogs' free-form
  // community prose throws at it as well as an actual read-through does. Gated
  // on discogsVerified same as the raw-notes fallback: this card's header claims
  // "about this pressing," which isn't an honest claim to make about a release
  // that was only ever loosely linked (title/search match), never matrix-checked.
  const facts = record.discogsVerified ? (record.curatedFacts?.length ? record.curatedFacts : getPressingFacts(record)) : [];
  const limitedEditionSize = getLimitedEditionSize(record);
  const artistStat = getArtistCollectionStat(record, allRecords);
  if (!facts.length && !limitedEditionSize && !artistStat) return null;

  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
        <Lightbulb className="h-4 w-4" />
        Interesting facts about this pressing
      </div>
      {limitedEditionSize || artistStat ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {limitedEditionSize ? (
            <p className="inline-flex rounded-full bg-indigo-900 px-3 py-1 text-xs font-semibold text-white">
              Limited to {limitedEditionSize.toLocaleString()} copies
            </p>
          ) : null}
          {artistStat ? (
            <p className="inline-flex rounded-full bg-indigo-900 px-3 py-1 text-xs font-semibold text-white">
              #{artistStat.position} of {artistStat.total} {artistStat.artist} albums you own
            </p>
          ) : null}
        </div>
      ) : null}
      {facts.length ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-indigo-950">
          {facts.map((fact, index) => (
            <li key={index} className="flex gap-2">
              <span className="text-indigo-400">•</span>
              <span className="whitespace-pre-line">{fact}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
