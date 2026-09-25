"use client";

import { VinylRecord } from "@/data/vinyls";
import { alphabetTiles, groupArtistsByLetter } from "@/lib/insightsExtras";
import { groupRecordsByArtist } from "@/lib/vinylRecordUtils";
import Link from "next/link";
import { useMemo, useState } from "react";

const MAX_CHIPS = 36;

export default function ArtistBingo({ records }: { records: VinylRecord[] }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);
  const [showAllArtists, setShowAllArtists] = useState(false);

  const recordsByArtist = useMemo(() => new Map(groupRecordsByArtist(records.filter((record) => record.status === "owned"))), [records]);

  const byLetter = useMemo(() => {
    const artists = [...recordsByArtist].map(([artist, group]) => ({ artist, count: group.length }));
    return groupArtistsByLetter(artists);
  }, [recordsByArtist]);

  if (!byLetter.size) return null;

  const tiles = alphabetTiles(byLetter);
  const letters = tiles.filter((letter) => letter !== "#");
  const filled = letters.filter((letter) => byLetter.has(letter)).length;
  const missing = letters.filter((letter) => !byLetter.has(letter));
  const complete = missing.length === 0;
  const busiest = letters.reduce<{ letter: string; count: number } | null>((best, letter) => {
    const count = byLetter.get(letter)?.length ?? 0;
    return count > (best?.count ?? 0) ? { letter, count } : best;
  }, null);
  const selectedArtists = selected ? byLetter.get(selected) ?? [] : [];
  const selectedRecords = selectedArtists.reduce((sum, entry) => sum + entry.count, 0);

  const tile = (letter: string) => {
    const artists = byLetter.get(letter);
    const isFilled = Boolean(artists?.length);
    const isSelected = selected === letter;
    return (
      <button
        key={letter}
        type="button"
        disabled={!isFilled}
        aria-pressed={isSelected}
        aria-label={isFilled ? `${letter}: ${artists!.length} ${artists!.length === 1 ? "artist" : "artists"}` : `${letter}: none yet`}
        onClick={() => { setSelected((current) => (current === letter ? null : letter)); setSelectedArtist(null); setShowAllArtists(false); }}
        className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border font-serif text-2xl font-semibold transition-all duration-150 sm:text-3xl ${
          isSelected
            ? "scale-105 border-gray-950 bg-gray-950 text-white shadow-lg"
            : isFilled
              ? "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-100 text-amber-950 shadow-sm hover:-translate-y-0.5 hover:shadow-md"
              : "border-dashed border-gray-200 bg-gray-50 text-gray-300"
        }`}
      >
        {letter}
        {isFilled ? (
          <span
            className={`absolute right-1 top-1 rounded-full px-1.5 text-[10px] font-sans font-semibold leading-4 ${
              isSelected ? "bg-white/20 text-white" : "bg-amber-200/70 text-amber-900"
            }`}
          >
            {artists!.length}
          </span>
        ) : null}
      </button>
    );
  };

  return (
    <section id="artist-az" className="scroll-mt-24 overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className={`p-5 ${complete ? "bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100" : "bg-gradient-to-r from-amber-50 to-white"}`}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Artist A to Z</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
              {complete
                ? "Every letter filled. Full alphabet, nicely done."
                : `Fill the whole alphabet with artists you own. ${missing.length} ${missing.length === 1 ? "letter" : "letters"} to go.`}
            </p>
          </div>
          <p className="shrink-0 font-serif text-3xl font-semibold tabular-nums text-amber-900 sm:text-4xl">
            {filled}
            <span className="text-lg text-amber-700/60 sm:text-xl">/26</span>
          </p>
        </div>
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-white/70"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={26}
          aria-valuenow={filled}
          aria-label="Letters filled"
        >
          <div className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all" style={{ width: `${(filled / 26) * 100}%` }} />
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-9 sm:gap-2.5 lg:grid-cols-[repeat(13,minmax(0,1fr))]">{letters.map(tile)}</div>

        {tiles.includes("#") ? (
          <div className="mt-2.5 grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-[repeat(13,minmax(0,1fr))]">
            <div className="col-span-1 sm:col-span-1">{tile("#")}</div>
            <p className="col-span-5 self-center pl-3 text-xs text-gray-500 sm:col-span-8 lg:col-span-12">Numbers and symbols</p>
          </div>
        ) : null}

        {busiest ? (
          <p className="mt-4 text-sm text-gray-600">
            Busiest letter: <span className="font-semibold text-gray-950">{busiest.letter}</span> with {busiest.count} {busiest.count === 1 ? "artist" : "artists"}.
          </p>
        ) : null}

        {!complete ? (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-sm text-gray-600">Still hunting:</span>
            {missing.map((letter) => (
              <span key={letter} className="rounded-md border border-dashed border-gray-300 px-2 py-0.5 font-serif text-sm font-semibold text-gray-500">
                {letter}
              </span>
            ))}
          </div>
        ) : null}

        {selected ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold text-gray-950">
                {selected === "#" ? "Numbers and symbols" : `Artists starting with ${selected}`}
              </p>
              <p className="text-xs text-gray-500">
                {selectedArtists.length} {selectedArtists.length === 1 ? "artist" : "artists"}, {selectedRecords} {selectedRecords === 1 ? "record" : "records"}
              </p>
            </div>
            <ul className="mt-3 flex flex-wrap gap-2">
              {selectedArtists.slice(0, showAllArtists ? undefined : MAX_CHIPS).map((entry) => (
                <li key={entry.artist}>
                  <button type="button" aria-expanded={selectedArtist === entry.artist} onClick={() => setSelectedArtist((current) => current === entry.artist ? null : entry.artist)} className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-white px-3 py-1 text-sm text-gray-800 hover:border-amber-500">
                    {entry.artist}
                    {entry.count > 1 ? <span className="rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-900">{entry.count}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
            {selectedArtists.length > MAX_CHIPS ? <button type="button" onClick={() => setShowAllArtists((current) => !current)} className="mt-3 text-sm font-medium text-amber-900 underline-offset-4 hover:underline">{showAllArtists ? "Show fewer artists" : `Show ${selectedArtists.length - MAX_CHIPS} more artists`}</button> : null}
            {selectedArtist ? <div className="mt-4 border-t border-amber-200 pt-3"><p className="text-sm font-semibold text-gray-950">{selectedArtist}</p><ul className="mt-2 grid gap-1 sm:grid-cols-2">{(recordsByArtist.get(selectedArtist) ?? []).map((record) => <li key={record.id}><Link href={`/vinyl/${record.id}`} className="block rounded px-2 py-1 text-sm text-gray-700 hover:bg-white hover:underline">{record.title}</Link></li>)}</ul></div> : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
