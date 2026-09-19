"use client";

import { VinylRecord } from "@/data/vinyls";
import { ChevronDown, Disc3 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type Mode = "release" | "pressing";
type Plotted = { record: VinylRecord; year: number };

const DOT = 12;
const GAP = 3;
const COLUMN = 16;

const decadeColor = (year: number) => `hsl(${(Math.floor(year / 10) * 37) % 360} 62% 46%)`;

export default function CollectionTimeline({ records }: { records: VinylRecord[] }) {
  const [mode, setMode] = useState<Mode>("release");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [openDecade, setOpenDecade] = useState<number | null>(null);

  const owned = useMemo(() => records.filter((record) => record.status !== "wishlist"), [records]);

  const plotted = useMemo<Plotted[]>(() => {
    const items: Plotted[] = [];
    for (const record of owned) {
      // A pressing year only means something once the pressing is confirmed.
      const year = mode === "release" ? record.releaseYear : record.discogsVerified ? record.pressingYear : undefined;
      if (typeof year === "number" && year >= 1800) items.push({ record, year });
    }
    return items.sort((a, b) => a.year - b.year || a.record.title.localeCompare(b.record.title));
  }, [owned, mode]);

  const byYear = useMemo(() => {
    const map = new Map<number, Plotted[]>();
    for (const item of plotted) map.set(item.year, [...(map.get(item.year) ?? []), item]);
    return map;
  }, [plotted]);

  const byDecade = useMemo(() => {
    const map = new Map<number, Plotted[]>();
    for (const item of plotted) {
      const decade = Math.floor(item.year / 10) * 10;
      map.set(decade, [...(map.get(decade) ?? []), item]);
    }
    return [...map].sort((a, b) => a[0] - b[0]);
  }, [plotted]);

  if (!owned.length) return null;

  const oldest = plotted[0];
  const newest = plotted[plotted.length - 1];
  const axisStart = oldest ? Math.floor(oldest.year / 10) * 10 : 0;
  const years = oldest && newest ? Array.from({ length: newest.year - axisStart + 1 }, (_, index) => axisStart + index) : [];
  const tallest = Math.max(1, ...[...byYear.values()].map((group) => group.length));
  const selected = plotted.find((item) => item.record.id === selectedId) ?? null;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Collection timeline</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
            Every record as a dot at the year it came out. Tap a dot to see the album.
          </p>
        </div>
        <div className="inline-flex shrink-0 rounded-md border border-gray-300 p-0.5 text-sm" role="group" aria-label="Timeline year">
          {(
            [
              ["release", "Release year"],
              ["pressing", "Pressing year"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              onClick={() => {
                setMode(value);
                setSelectedId(null);
                setOpenDecade(null);
              }}
              className={`rounded px-3 py-1.5 font-medium transition-colors ${mode === value ? "bg-gray-950 text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {mode === "pressing" ? (
        <p className="mt-3 text-xs text-gray-500">
          Only records with a confirmed pressing have a pressing year, so {plotted.length} of your {owned.length} are shown. More appear as pressings get confirmed.
        </p>
      ) : null}

      {!plotted.length ? (
        <p className="mt-6 text-sm text-gray-600">Nothing to plot yet.</p>
      ) : (
        <>
          <p className="mt-4 text-sm text-gray-700">
            Oldest: <span className="font-medium text-gray-950">{oldest.record.title}</span> ({oldest.year}). Newest:{" "}
            <span className="font-medium text-gray-950">{newest.record.title}</span> ({newest.year}).
          </p>

          <div className="mt-4 overflow-x-auto pb-2">
            <div style={{ width: years.length * COLUMN }} className="pt-2">
              <div className="flex items-end border-b border-gray-300" style={{ height: tallest * (DOT + GAP) + 4 }}>
                {years.map((year) => (
                  <div key={year} className="flex flex-col-reverse items-center" style={{ width: COLUMN, gap: GAP, paddingBottom: GAP }}>
                    {(byYear.get(year) ?? []).map(({ record }) => (
                      <button
                        key={record.id}
                        type="button"
                        onClick={() => setSelectedId((current) => (current === record.id ? null : record.id))}
                        aria-label={`${record.title} by ${record.artist}, ${year}`}
                        aria-pressed={selectedId === record.id}
                        title={`${record.title} (${year})`}
                        style={{ width: DOT, height: DOT, backgroundColor: decadeColor(year) }}
                        className={`rounded-full transition-transform hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 ${
                          selectedId === record.id ? "scale-125 ring-2 ring-gray-950 ring-offset-1" : ""
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex">
                {years.map((year) => (
                  <div key={year} className="relative h-5" style={{ width: COLUMN }}>
                    {year % 10 === 0 ? (
                      <span className="absolute left-0 top-1 whitespace-nowrap text-[10px] font-medium text-gray-500">{year}s</span>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selected ? (
            <div className="mt-2 flex items-center gap-4 rounded-lg bg-gray-50 p-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded bg-gray-100">
                {selected.record.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.record.coverImage} alt={selected.record.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Disc3 className="h-8 w-8 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-950">{selected.record.title}</p>
                <p className="truncate text-sm text-gray-600">{selected.record.artist}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {mode === "release" ? "Released" : "Pressed"} {selected.year}
                  {mode === "pressing" && selected.record.releaseYear ? `, album first out ${selected.record.releaseYear}` : ""}
                </p>
                <Link href={`/vinyl/${selected.record.id}`} className="mt-1 inline-block text-xs font-medium text-gray-700 underline-offset-4 hover:underline">
                  Open album
                </Link>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs text-gray-400">Scroll sideways for the whole timeline.</p>
          )}

          <div className="mt-6 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-semibold text-gray-950">Browse by decade</h3>
            <div className="mt-2 divide-y divide-gray-100">
              {byDecade.map(([decade, items]) => (
                <div key={decade}>
                  <button
                    type="button"
                    aria-expanded={openDecade === decade}
                    onClick={() => setOpenDecade((current) => (current === decade ? null : decade))}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: decadeColor(decade) }} />
                      {decade}s
                    </span>
                    <span className="flex items-center gap-2 text-xs text-gray-500">
                      {items.length} {items.length === 1 ? "record" : "records"}
                      <ChevronDown className={`h-4 w-4 transition-transform ${openDecade === decade ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                  {openDecade === decade ? (
                    <ul className="grid grid-cols-4 gap-2 pb-4 sm:grid-cols-6 lg:grid-cols-10">
                      {items.map(({ record, year }) => (
                        <li key={record.id}>
                          <Link href={`/vinyl/${record.id}`} title={`${record.title} (${year})`} className="block">
                            <div className="aspect-square overflow-hidden rounded bg-gray-100">
                              {record.coverImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={record.coverImage} alt={record.title} loading="lazy" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full items-center justify-center">
                                  <Disc3 className="h-5 w-5 text-gray-300" />
                                </div>
                              )}
                            </div>
                            <p className="mt-1 text-[10px] text-gray-500">{year}</p>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
