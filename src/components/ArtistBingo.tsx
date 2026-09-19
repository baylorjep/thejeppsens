"use client";

import { VinylRecord } from "@/data/vinyls";
import { alphabetTiles, groupArtistsByLetter } from "@/lib/insightsExtras";
import { groupRecordsByArtist } from "@/lib/vinylRecordUtils";
import { useMemo, useState } from "react";

export default function ArtistBingo({ records }: { records: VinylRecord[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  const byLetter = useMemo(() => {
    const owned = records.filter((record) => record.status === "owned");
    const artists = [...groupRecordsByArtist(owned)].map(([artist, group]) => ({ artist, count: group.length }));
    return groupArtistsByLetter(artists);
  }, [records]);

  const tiles = alphabetTiles(byLetter);
  const letters = tiles.filter((letter) => letter !== "#");
  const filled = letters.filter((letter) => byLetter.has(letter)).length;
  const missing = letters.filter((letter) => !byLetter.has(letter));
  const selectedArtists = selected ? byLetter.get(selected) ?? [] : [];

  if (!byLetter.size) return null;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Artist A to Z</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
        You have an artist for {filled} of 26 letters.
        {missing.length === 0
          ? " Full alphabet, nicely done."
          : ` Still missing: ${missing.join(", ")}.`}
      </p>
      <div className="mt-5 grid grid-cols-7 gap-2 sm:grid-cols-9 lg:grid-cols-[repeat(14,minmax(0,1fr))]">
        {tiles.map((letter) => {
          const artists = byLetter.get(letter);
          const isFilled = Boolean(artists?.length);
          return (
            <button
              key={letter}
              type="button"
              disabled={!isFilled}
              aria-pressed={selected === letter}
              onClick={() => setSelected((current) => (current === letter ? null : letter))}
              className={`flex aspect-square flex-col items-center justify-center rounded-md border text-lg font-semibold transition-colors ${
                isFilled
                  ? selected === letter
                    ? "border-gray-950 bg-gray-950 text-white"
                    : "border-gray-950 bg-gray-50 text-gray-950 hover:bg-gray-100"
                  : "border-dashed border-gray-300 text-gray-300"
              }`}
            >
              {letter}
              {isFilled ? <span className="text-[10px] font-normal opacity-70">{artists!.length}</span> : null}
            </button>
          );
        })}
      </div>
      {selected ? (
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {selected === "#" ? "Numbers and symbols" : `Artists starting with ${selected}`}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            {selectedArtists.map((entry, index) => (
              <span key={entry.artist}>
                {index > 0 ? ", " : ""}
                {entry.artist}
                {entry.count > 1 ? ` (${entry.count})` : ""}
              </span>
            ))}
          </p>
        </div>
      ) : null}
    </section>
  );
}
