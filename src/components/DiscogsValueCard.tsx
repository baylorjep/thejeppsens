"use client";

import { DiscogsValueResponse, fetchDiscogsValue, formatDiscogsMoney } from "@/lib/discogsClient";
import { RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

function marketplaceUrl(releaseId: number) {
  return `https://www.discogs.com/sell/release/${releaseId}?sort=price&sort_order=asc`;
}

export default function DiscogsValueCard({
  releaseId,
  condition,
  verifiedPressing,
  noMatch = false,
}: {
  releaseId: number;
  condition?: string;
  verifiedPressing: boolean;
  noMatch?: boolean;
}) {
  const [value, setValue] = useState<DiscogsValueResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  const load = (forceRefresh = false) => {
    let active = true;
    setStatus("loading");

    fetchDiscogsValue(releaseId, condition, { forceRefresh }).then((data) => {
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
  };

  useEffect(() => load(false), [releaseId, condition]);

  if (status === "unavailable") return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Discogs price reference</h3>
        <button
          type="button"
          onClick={() => load(true)}
          disabled={status === "loading"}
          className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50"
          aria-label="Refresh estimate"
        >
          <RotateCw className={`h-3.5 w-3.5 ${status === "loading" ? "animate-spin" : ""}`} />
        </button>
      </div>
      {status === "loading" ? (
        <div className="mt-3 h-7 w-24 animate-pulse rounded bg-gray-200" />
      ) : value?.estimate ? (
        <div className="mt-2">
          <p className="text-2xl font-semibold text-gray-950">{formatDiscogsMoney(value.estimate)}</p>
          <p className="mt-1 text-xs text-gray-500">
            {value.isGuess ? "Assuming" : "Based on"} {value.grade} condition, via Discogs
          </p>
          {value.lowestListing ? (
            <a
              href={marketplaceUrl(releaseId)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-xs text-gray-500 underline-offset-4 hover:text-gray-950 hover:underline"
            >
              {value.numForSale} for sale now from {formatDiscogsMoney(value.lowestListing)} · see listings
            </a>
          ) : null}
        </div>
      ) : value?.lowestListing ? (
        <div className="mt-2">
          <p className="text-2xl font-semibold text-gray-950">{formatDiscogsMoney(value.lowestListing)}</p>
          <a
            href={marketplaceUrl(releaseId)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-xs text-gray-500 underline-offset-4 hover:text-gray-950 hover:underline"
          >
            Lowest of {value.numForSale} copies currently listed · see listings
          </a>
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-500">No Discogs price data for this pressing yet.</p>
      )}
      {status === "ready" && value?.isGuess ? <p className="mt-3 text-xs text-gray-600">No media grade recorded. Asking prices are shown only as market context, not your copy’s value.</p> : null}
      {status === "ready" && value?.estimate ? <p className="mt-3 text-xs text-gray-500">Discogs suggestion for this media grade. Jacket condition, missing extras, and comparable sales still need review.</p> : null}
      {status === "ready" && (value?.estimate || value?.lowestListing) && noMatch ? (
        <p className="mt-3 text-xs text-gray-500">Priced from the closest listed pressing, since yours isn&apos;t on Discogs.</p>
      ) : status === "ready" && (value?.estimate || value?.lowestListing) && !verifiedPressing ? (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Approximate. This pressing hasn&apos;t been manually confirmed, so it may not be the exact one
          priced here. Use “Identify this pressing” to submit physical evidence for review.
        </p>
      ) : null}
    </div>
  );
}
