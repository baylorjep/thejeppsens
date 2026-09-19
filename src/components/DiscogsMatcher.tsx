"use client";

import { VinylRecord } from "@/data/vinyls";
import {
  DiscogsSearchResult,
  applyDiscogsMatchToRecord,
  buildDiscogsMatchQuery,
  discogsReleaseUrl,
  fetchDiscogsReleaseDetails,
  searchDiscogsReleases,
} from "@/lib/discogsMatch";
import { fetchVinylRecords, saveVinylRecord } from "@/lib/vinylApi";
import { readQueuedVinyls } from "@/lib/vinylQueue";
import { statusLabel } from "@/lib/vinylRecordUtils";
import { CheckCircle2, Disc3, ExternalLink, FlipHorizontal, Search, SkipForward, Undo2, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const BATCH_SIZE = 8;

type RowStatus = "searching" | "ready" | "no-results" | "linking" | "error";

type RowState = {
  status: RowStatus;
  results: DiscogsSearchResult[];
  selectedId?: number;
  query: string;
};

function optionLabel(result: DiscogsSearchResult) {
  return (
    [result.catno, result.label?.[0], result.format?.[0], result.country, result.year].filter(Boolean).join(" · ") ||
    result.title
  );
}

export default function DiscogsMatcher() {
  const [records, setRecords] = useState<VinylRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const [linkedIds, setLinkedIds] = useState<Set<string>>(new Set());
  const [deferredIds, setDeferredIds] = useState<Set<string>>(new Set());
  const [flippedIds, setFlippedIds] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [rowStates, setRowStates] = useState<Record<string, RowState>>({});
  const [queryDrafts, setQueryDrafts] = useState<Record<string, string>>({});
  const [showSkipped, setShowSkipped] = useState(false);

  useEffect(() => {
    const queuedRecords = readQueuedVinyls();
    fetchVinylRecords()
      .then((response) => {
        setRecords(response.source === "supabase" ? response.records : [...response.records, ...queuedRecords]);
      })
      .catch(() => setRecords(queuedRecords))
      .finally(() => setIsLoadingRecords(false));
  }, []);

  const unmatchedRecords = useMemo(
    () =>
      records
        .filter(
          (record) =>
            record.status !== "wishlist" &&
            !record.discogsReleaseId &&
            !record.discogsNoMatch &&
            !linkedIds.has(record.id) &&
            !deferredIds.has(record.id),
        )
        .sort((a, b) => {
          if (a.status !== b.status) return a.status === "owned" ? -1 : b.status === "owned" ? 1 : 0;
          return a.title.localeCompare(b.title);
        }),
    [records, linkedIds, deferredIds],
  );

  const skippedRecords = useMemo(() => records.filter((record) => record.discogsNoMatch), [records]);

  const totalUnmatched = useMemo(
    () => records.filter((record) => record.status !== "wishlist" && !record.discogsReleaseId && !record.discogsNoMatch).length,
    [records],
  );
  const visibleRecords = unmatchedRecords.slice(0, visibleCount);
  const visibleIdsKey = visibleRecords.map((record) => record.id).join(",");

  useEffect(() => {
    let cancelled = false;

    const runSearches = async () => {
      for (const record of visibleRecords) {
        if (cancelled) return;
        if (rowStates[record.id]) continue;

        const query = buildDiscogsMatchQuery(record);
        setRowStates((current) => ({ ...current, [record.id]: { status: "searching", results: [], query } }));

        const results = await searchDiscogsReleases(query);
        if (cancelled) return;

        setRowStates((current) => ({
          ...current,
          [record.id]: { status: results.length ? "ready" : "no-results", results, selectedId: results[0]?.id, query },
        }));

        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    };

    runSearches();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIdsKey]);

  const selectOption = (recordId: string, id: number) => {
    setRowStates((current) => ({
      ...current,
      [recordId]: { ...current[recordId], selectedId: id },
    }));
  };

  const retrySearch = async (record: VinylRecord) => {
    const query = (queryDrafts[record.id] ?? rowStates[record.id]?.query ?? buildDiscogsMatchQuery(record)).trim();
    if (!query) return;

    setRowStates((current) => ({ ...current, [record.id]: { status: "searching", results: [], query } }));
    const results = await searchDiscogsReleases(query);
    setRowStates((current) => ({
      ...current,
      [record.id]: { status: results.length ? "ready" : "no-results", results, selectedId: results[0]?.id, query },
    }));
  };

  const confirmMatch = async (record: VinylRecord) => {
    const state = rowStates[record.id];
    if (!state?.selectedId) return;

    setRowStates((current) => ({ ...current, [record.id]: { ...current[record.id], status: "linking" } }));

    const release = await fetchDiscogsReleaseDetails(state.selectedId);
    if (!release) {
      setRowStates((current) => ({ ...current, [record.id]: { ...current[record.id], status: "error" } }));
      return;
    }

    const nextRecord = applyDiscogsMatchToRecord(record, release);

    try {
      const response = await saveVinylRecord(nextRecord);
      setRecords((current) => current.map((item) => (item.id === response.record.id ? response.record : item)));
    } catch {
      setRecords((current) => current.map((item) => (item.id === nextRecord.id ? nextRecord : item)));
    }

    setLinkedIds((current) => new Set(current).add(record.id));
  };

  const deferRecord = (recordId: string) => {
    setDeferredIds((current) => new Set(current).add(recordId));
  };

  const toggleFlip = (recordId: string) => {
    setFlippedIds((current) => {
      const next = new Set(current);
      if (next.has(recordId)) next.delete(recordId);
      else next.add(recordId);
      return next;
    });
  };

  const markNoMatch = async (record: VinylRecord) => {
    const nextRecord = { ...record, discogsNoMatch: true };
    setRecords((current) => current.map((item) => (item.id === record.id ? nextRecord : item)));

    try {
      const response = await saveVinylRecord(nextRecord);
      setRecords((current) => current.map((item) => (item.id === response.record.id ? response.record : item)));
    } catch {
      // local state already updated above
    }
  };

  const undoNoMatch = async (record: VinylRecord) => {
    const nextRecord = { ...record, discogsNoMatch: undefined };
    setRecords((current) => current.map((item) => (item.id === record.id ? nextRecord : item)));

    try {
      const response = await saveVinylRecord(nextRecord);
      setRecords((current) => current.map((item) => (item.id === response.record.id ? response.record : item)));
    } catch {
      // local state already updated above
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-gray-500">Bulk tool</p>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">Match to Discogs</h1>
          <p className="mt-4 text-base leading-7 text-gray-600">
            Each record is auto-searched on Discogs by artist and title. Compare the thumbnail (or open the full
            listing on Discogs) against your copy, pick the right pressing from the dropdown, and confirm.
            Nothing gets linked without that confirm.
          </p>
        </div>
        <Link
          href="/vinyl/manage"
          className="inline-flex w-fit shrink-0 rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
        >
          Back to manage
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
        {isLoadingRecords
          ? "Loading records..."
          : `${totalUnmatched} record${totalUnmatched === 1 ? "" : "s"} still need a Discogs link. ${linkedIds.size} linked this session.${deferredIds.size ? ` ${deferredIds.size} skipped for now. Reload the page to see them again.` : ""}`}
      </div>

      <div className="space-y-4">
        {visibleRecords.map((record) => {
          const state = rowStates[record.id];
          const selectedResult = state?.results.find((result) => result.id === state.selectedId);

          return (
            <div key={record.id} className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex shrink-0 gap-3">
                  <div>
                    {(() => {
                      const isFlipped = flippedIds.has(record.id) && Boolean(record.backCoverImage);
                      const shownImage = isFlipped ? record.backCoverImage : record.coverImage;

                      return (
                        <div className="relative aspect-square w-20 overflow-hidden rounded bg-gray-100">
                          {shownImage ? (
                            <Image
                              src={shownImage}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized={shownImage.startsWith("data:")}
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Disc3 className="h-6 w-6 text-gray-300" />
                            </div>
                          )}
                          {record.backCoverImage ? (
                            <button
                              type="button"
                              onClick={() => toggleFlip(record.id)}
                              className="absolute bottom-0.5 right-0.5 rounded bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
                              aria-label="Flip to see the other side"
                            >
                              <FlipHorizontal className="h-3 w-3" />
                            </button>
                          ) : null}
                        </div>
                      );
                    })()}
                    <p className="mt-1 text-center text-[10px] uppercase tracking-wide text-gray-400">
                      Yours{record.backCoverImage ? (flippedIds.has(record.id) ? " (back)" : " (front)") : ""}
                    </p>
                  </div>
                  <div>
                    <div className="relative aspect-square w-20 overflow-hidden rounded bg-gray-100">
                      {selectedResult?.thumb ? (
                        <Image src={selectedResult.thumb} alt="" fill className="object-cover" unoptimized />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Disc3 className="h-6 w-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <p className="mt-1 text-center text-[10px] uppercase tracking-wide text-gray-400">Discogs</p>
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <p className="font-medium leading-snug text-gray-950">{record.title}</p>
                    <p className="text-sm text-gray-600">{record.artist}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-gray-400">{statusLabel(record.status)}</p>
                  </div>

                  {!state || state.status === "searching" ? (
                    <p className="text-sm text-gray-500">Searching Discogs...</p>
                  ) : (
                    <>
                      {state.status === "no-results" ? (
                        <p className="text-sm text-gray-500">No matches found. Try refining the search below.</p>
                      ) : state.status === "error" ? (
                        <p className="text-sm text-red-600">Could not link that release. Try again.</p>
                      ) : (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <select
                            value={state.selectedId ?? ""}
                            onChange={(event) => selectOption(record.id, Number(event.target.value))}
                            className="w-full rounded-md border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 outline-none focus:border-gray-950 sm:flex-1"
                          >
                            {state.results.map((result) => (
                              <option key={result.id} value={result.id}>
                                {optionLabel(result)}
                              </option>
                            ))}
                          </select>
                          {selectedResult ? (
                            <a
                              href={discogsReleaseUrl(selectedResult)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 transition-colors hover:border-gray-500"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              View on Discogs
                            </a>
                          ) : null}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          value={queryDrafts[record.id] ?? state.query}
                          onChange={(event) =>
                            setQueryDrafts((current) => ({ ...current, [record.id]: event.target.value }))
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              retrySearch(record);
                            }
                          }}
                          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 outline-none focus:border-gray-950"
                          placeholder="Refine search, e.g. add the catalog number from the label..."
                        />
                        <button
                          type="button"
                          onClick={() => retrySearch(record)}
                          className="shrink-0 rounded-md border border-gray-200 p-1.5 text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-950"
                          aria-label="Search again"
                        >
                          <Search className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
                  <button
                    type="button"
                    onClick={() => confirmMatch(record)}
                    disabled={!state?.selectedId || state.status === "linking"}
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-950 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {state?.status === "linking" ? "Linking..." : "Confirm"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deferRecord(record.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-500"
                  >
                    <SkipForward className="h-4 w-4" />
                    Not sure, skip for now
                  </button>
                  <button
                    type="button"
                    onClick={() => markNoMatch(record)}
                    className="inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-gray-500 transition-colors hover:text-gray-950"
                  >
                    <X className="h-3.5 w-3.5" />
                    Confirm not on Discogs
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!isLoadingRecords && !visibleRecords.length ? (
        <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
          {totalUnmatched === 0 ? "Every record is linked to Discogs." : "All visible records handled. Nice work."}
        </p>
      ) : null}

      {visibleCount < unmatchedRecords.length ? (
        <button
          type="button"
          onClick={() => setVisibleCount((count) => count + BATCH_SIZE)}
          className="rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
        >
          Load {Math.min(BATCH_SIZE, unmatchedRecords.length - visibleCount)} more
        </button>
      ) : null}

      {skippedRecords.length ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <button
            type="button"
            onClick={() => setShowSkipped((current) => !current)}
            className="text-sm font-medium text-gray-700 underline-offset-4 hover:underline"
          >
            {showSkipped ? "Hide" : "Show"} {skippedRecords.length} marked &quot;not on Discogs&quot;
          </button>
          {showSkipped ? (
            <div className="mt-3 space-y-2">
              {skippedRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <span className="min-w-0 truncate text-gray-700">
                    {record.title} · {record.artist}
                  </span>
                  <button
                    type="button"
                    onClick={() => undoNoMatch(record)}
                    className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-950"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    Undo
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
