"use client";
import { useState } from "react";
import Link from "next/link";
import type { VinylRecord } from "@/data/vinyls";
import { STATUS_LABELS, type PressingSubmission } from "@/lib/pressingEvidence";
import { Disc3 } from "lucide-react";
const SORTS = [
  ["album", "Album A to Z"],
  ["artist", "Artist A to Z"],
  ["updated", "Recently updated"],
  ["stale", "Least recently updated"],
  ["added", "Recently added to collection"],
] as const;
type SortKey = (typeof SORTS)[number][0];

export default function VinylPressingQueue({ records, submissions }: { records: VinylRecord[]; submissions: Pick<PressingSubmission, "record_id" | "status" | "updated_at">[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState<SortKey>("album");
  const statuses = new Map(submissions.map(s => [s.record_id, s.status]));
  const updatedAt = new Map(submissions.map(s => [s.record_id, s.updated_at ?? ""]));
  // Records with no submission yet have no update time, so they sort after the ones with activity.
  const byTime = (a: VinylRecord, b: VinylRecord, key: (r: VinylRecord) => string) => (key(b) || "").localeCompare(key(a) || "");
  const visible = records
    .filter(r => `${r.artist} ${r.title}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || (statuses.get(r.id) ?? "not_started") === filter))
    .sort((a, b) => {
      if (sort === "artist") return a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title);
      if (sort === "updated") return byTime(a, b, r => updatedAt.get(r.id) ?? "") || a.title.localeCompare(b.title);
      if (sort === "stale") {
        const missing = (r: VinylRecord) => !updatedAt.get(r.id);
        return Number(missing(a)) - Number(missing(b)) || (updatedAt.get(a.id) ?? "").localeCompare(updatedAt.get(b.id) ?? "") || a.title.localeCompare(b.title);
      }
      if (sort === "added") return byTime(a, b, r => r.dateAdded ?? "") || a.title.localeCompare(b.title);
      return a.title.localeCompare(b.title) || a.artist.localeCompare(b.artist);
    });
  return <div className="mt-8">
    <div className="mb-6 grid gap-4 sm:grid-cols-3"><label className="text-sm font-medium">Find an album<input className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3" placeholder="Artist or album" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="text-sm font-medium">Review status<select className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All records</option><option value="not_started">Not started</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-medium">Sort by<select className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3" value={sort} onChange={e => setSort(e.target.value as SortKey)}>{SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <p className="mb-3 text-sm text-gray-500">{submissions.filter(s => s.status === "pending").length} waiting for Baylor · {submissions.filter(s => s.status === "confirmed").length} confirmed</p>
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">
      {visible.map(r => {
        const status = statuses.get(r.id);
        const isConfirmed = status === "confirmed";
        const primaryHref = isConfirmed ? `/vinyl/${encodeURIComponent(r.id)}` : `/vinyl/${encodeURIComponent(r.id)}/identify`;
        return (
          <div key={r.id} className="flex items-center gap-2 p-4 hover:bg-stone-50">
            <Link href={primaryHref} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-sm text-gray-500">{r.artist}</p>
              </div>
              <span className="text-sm text-gray-600">{status ? STATUS_LABELS[status] : "Start identification"} →</span>
            </Link>
            {!isConfirmed ? (
              <Link
                href={`/vinyl/${encodeURIComponent(r.id)}`}
                className="shrink-0 rounded-full border border-gray-200 p-2 text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-950"
                aria-label={`Go straight to the ${r.title} album page`}
                title="Go straight to the album page"
              >
                <Disc3 className="h-4 w-4" />
              </Link>
            ) : null}
          </div>
        );
      })}
      {!visible.length ? <p className="p-6 text-gray-500">No records match this view.</p> : null}
    </div>
  </div>;
}
