"use client";

import { VinylRecord } from "@/data/vinyls";
import { useEffect, useMemo, useState } from "react";

type LabelCatalog = { artist: string; label: string; albumsConsidered: number; albums: { title: string; year: number }[] };

const normalize = (value: string) =>
  value.toLowerCase().replace(/\(.*?\)|\[.*?\]/g, "").replace(/&/g, "and").replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, "");

export default function LabelCatalogCard({ record, records }: { record: VinylRecord; records: VinylRecord[] }) {
  const [catalog, setCatalog] = useState<LabelCatalog | null>(null);
  const { artist, label } = record;

  useEffect(() => {
    if (!label) return;
    let active = true;
    fetch(`/api/label-catalog?artist=${encodeURIComponent(artist)}&label=${encodeURIComponent(label)}`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { catalog?: LabelCatalog | null } | null) => {
        if (active) setCatalog(data?.catalog ?? null);
      })
      .catch(() => {
        if (active) setCatalog(null);
      });
    return () => {
      active = false;
    };
  }, [artist, label]);

  const owned = useMemo(() => {
    if (!catalog) return 0;
    const artistKey = normalize(catalog.artist);
    const ownedTitles = new Set(
      records
        .filter((item) => item.status === "owned" && normalize(item.artist).includes(artistKey))
        .map((item) => normalize(item.title)),
    );
    return catalog.albums.filter((album) => ownedTitles.has(normalize(album.title))).length;
  }, [catalog, records]);

  if (!catalog || catalog.albums.length < 2) return null;

  const total = catalog.albums.length;
  const shownLabel = catalog.label;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">{shownLabel} and {catalog.artist}</h3>
      <p className="mt-2 text-sm text-gray-700">
        Discogs lists <span className="font-semibold text-gray-950">{total}</span> {catalog.artist} albums first released on {shownLabel}.
        {owned === 0 ? (
          "You don't own any of them yet."
        ) : (
          <>
            You own <span className="font-semibold text-gray-950">{owned}</span> of them.
          </>
        )}
      </p>
      <div className="mt-3 h-2 rounded-full bg-gray-100" role="img" aria-label={`You own ${owned} of ${total}`}>
        <div className="h-2 rounded-full bg-gray-950" style={{ width: `${Math.min(100, (owned / total) * 100)}%` }} />
      </div>
    </div>
  );
}
