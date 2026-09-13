"use client";

import { DiscogsValueResponse, fetchDiscogsValue, formatDiscogsMoney } from "@/lib/discogsClient";
import { useEffect, useState } from "react";

export default function DiscogsValueCard({
  releaseId,
  condition,
  verifiedPressing,
}: {
  releaseId: number;
  condition?: string;
  verifiedPressing: boolean;
}) {
  const [value, setValue] = useState<DiscogsValueResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let active = true;
    setStatus("loading");

    fetchDiscogsValue(releaseId, condition).then((data) => {
      if (!active) return;
      if (!data) {
        setStatus("unavailable");
        return;
      }
      setValue(data);
      setStatus("ready");
    });

    return () => {
      active = false;
    };
  }, [releaseId, condition]);

  if (status === "unavailable") return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Estimated value</h3>
      {status === "loading" ? (
        <div className="mt-3 h-7 w-24 animate-pulse rounded bg-gray-200" />
      ) : value?.estimate ? (
        <div className="mt-2">
          <p className="text-2xl font-semibold text-gray-950">{formatDiscogsMoney(value.estimate)}</p>
          <p className="mt-1 text-xs text-gray-500">
            {value.isGuess ? "Assuming" : "Based on"} {value.grade} condition, via Discogs
          </p>
          {value.lowestListing ? (
            <p className="mt-3 text-xs text-gray-500">
              {value.numForSale} for sale now from {formatDiscogsMoney(value.lowestListing)}
            </p>
          ) : null}
        </div>
      ) : value?.lowestListing ? (
        <div className="mt-2">
          <p className="text-2xl font-semibold text-gray-950">{formatDiscogsMoney(value.lowestListing)}</p>
          <p className="mt-1 text-xs text-gray-500">
            Lowest of {value.numForSale} copies currently listed on Discogs
          </p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-500">No Discogs price data for this pressing yet.</p>
      )}
      {status === "ready" && (value?.estimate || value?.lowestListing) && !verifiedPressing ? (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Approximate — this pressing hasn&apos;t been manually confirmed, so it may not be the exact one
          priced here. Edit this record and confirm the match under &quot;Discogs&quot; to sharpen this
          estimate.
        </p>
      ) : null}
    </div>
  );
}
