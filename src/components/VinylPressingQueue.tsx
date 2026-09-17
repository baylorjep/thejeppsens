"use client";
import { useState } from "react";
import Link from "next/link";
import type { VinylRecord } from "@/data/vinyls";
import { STATUS_LABELS, type PressingSubmission } from "@/lib/pressingEvidence";
export default function VinylPressingQueue({ records, submissions }: { records: VinylRecord[]; submissions: Pick<PressingSubmission, "record_id" | "status">[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const statuses = new Map(submissions.map(s => [s.record_id, s.status]));
  const visible = records.filter(r => `${r.artist} ${r.title}`.toLowerCase().includes(search.toLowerCase()) && (filter === "all" || (statuses.get(r.id) ?? "not_started") === filter));
  return <div className="mt-8">
    <div className="mb-6 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Find an album<input className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3" placeholder="Artist or album" value={search} onChange={e => setSearch(e.target.value)} /></label><label className="text-sm font-medium">Review status<select className="mt-2 block w-full rounded-lg border border-gray-300 px-4 py-3" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">All records</option><option value="not_started">Not started</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div>
    <p className="mb-3 text-sm text-gray-500">{submissions.filter(s => s.status === "pending").length} waiting for Baylor · {submissions.filter(s => s.status === "confirmed").length} confirmed</p>
    <div className="divide-y divide-gray-100 rounded-xl border border-gray-200">{visible.map(r => <Link key={r.id} href={`/vinyl/${encodeURIComponent(r.id)}/identify`} className="flex flex-col gap-2 p-4 hover:bg-stone-50 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{r.title}</p><p className="text-sm text-gray-500">{r.artist}</p></div><span className="text-sm text-gray-600">{statuses.has(r.id) ? STATUS_LABELS[statuses.get(r.id)!] : "Start identification"} →</span></Link>)}{!visible.length ? <p className="p-6 text-gray-500">No records match this view.</p> : null}</div>
  </div>;
}
