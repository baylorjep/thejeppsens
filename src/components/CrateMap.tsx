"use client";

import { VinylRecord } from "@/data/vinyls";
import { summarizeCrates } from "@/lib/insightsExtras";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function CrateMap({ records }: { records: VinylRecord[] }) {
  const [openCrate, setOpenCrate] = useState<string | null>(null);

  const crates = useMemo(() => summarizeCrates(records.filter((record) => record.status === "owned")), [records]);
  const largest = Math.max(1, ...crates.map((crate) => crate.count));
  const open = crates.find((crate) => crate.name === openCrate);

  if (!crates.length) return null;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-5">
      <h2 className="text-base font-semibold text-gray-950 sm:text-xl">Crate map</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600">Where everything lives. Tap a crate to see what is inside.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {crates.map((crate) => (
          <button
            key={crate.name}
            type="button"
            aria-pressed={openCrate === crate.name}
            onClick={() => setOpenCrate((current) => (current === crate.name ? null : crate.name))}
            className={`rounded-lg border p-4 text-left transition-colors ${
              openCrate === crate.name ? "border-gray-950 bg-gray-50" : "border-gray-200 hover:border-gray-400"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold text-gray-950">{crate.name}</p>
              <p className="shrink-0 text-2xl font-semibold tabular-nums text-gray-950">{crate.count}</p>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-amber-500" style={{ width: `${(crate.count / largest) * 100}%` }} />
            </div>
            {crate.topGenre ? (
              <p className="mt-3 text-xs text-gray-600">
                Mostly {crate.topGenre.name} ({Math.round((crate.topGenre.count / crate.count) * 100)}%)
              </p>
            ) : null}
            {crate.topArtist && crate.topArtist.count > 1 ? (
              <p className="mt-1 truncate text-xs text-gray-500">
                Most: {crate.topArtist.name} ({crate.topArtist.count})
              </p>
            ) : null}
          </button>
        ))}
      </div>
      {open ? (
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {open.name}, {open.count} {open.count === 1 ? "record" : "records"}
          </p>
          <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {open.records.map((record) => (
              <li key={record.id} className="truncate text-sm">
                <Link href={`/vinyl/${record.id}`} className="text-gray-700 hover:text-gray-950 hover:underline">
                  {record.title}
                </Link>
                <span className="text-gray-400"> · {record.artist}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
