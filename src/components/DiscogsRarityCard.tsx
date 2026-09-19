"use client";

import { fetchDiscogsValue, rarityTierLabel } from "@/lib/discogsClient";
import { VinylRecord } from "@/data/vinyls";
import { getPressRun, isOriginalPressing } from "@/lib/vinylRecordUtils";
import { useEffect, useState } from "react";

function releaseUrl(releaseId: number) {
  return `https://www.discogs.com/release/${releaseId}`;
}

export default function DiscogsRarityCard({
  releaseId,
  condition,
  record,
}: {
  releaseId: number;
  condition?: string;
  record?: VinylRecord;
}) {
  const [have, setHave] = useState<number | null>(null);
  const [want, setWant] = useState<number | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");

  useEffect(() => {
    let active = true;
    setStatus("loading");

    fetchDiscogsValue(releaseId, condition).then((data) => {
      if (!active) return;
      if (!data || (data.have === null && data.want === null)) {
        setStatus("unavailable");
        return;
      }
      setHave(data.have);
      setWant(data.want);
      setStatus("ready");
    });

    return () => {
      active = false;
    };
  }, [releaseId, condition]);

  const pressRun = record ? getPressRun(record) : null;
  // Originals always get a run-size line so a missing number reads as "nobody
  // published one" instead of the card just leaving it out.
  const showPressRun = Boolean(record && (pressRun || isOriginalPressing(record)));

  if (status === "unavailable" && !showPressRun) return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Rarity</h3>
      {status === "unavailable" ? null : status === "loading" ? (
        <div className="mt-3 h-7 w-32 animate-pulse rounded bg-gray-200" />
      ) : (
        <div className="mt-2">
          {have !== null ? (
            <p className="text-sm text-gray-700">
              <span className="font-semibold text-gray-950">{have.toLocaleString()}</span>{" "}
              {have === 1 ? "person" : "people"} on Discogs {have === 1 ? "has" : "have"} this exact pressing
              {" · "}
              <span className="font-medium">{rarityTierLabel(have)}</span>
            </p>
          ) : null}
          {want !== null ? (
            <p className="mt-1 text-sm text-gray-700">
              <span className="font-semibold text-gray-950">{want.toLocaleString()}</span> {want === 1 ? "wants" : "want"} it
            </p>
          ) : null}
          <a
            href={releaseUrl(releaseId)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-xs text-gray-500 underline-offset-4 hover:text-gray-950 hover:underline"
          >
            View on Discogs
          </a>
        </div>
      )}
      {showPressRun ? (
        <p className="mt-3 border-t border-gray-200 pt-3 text-sm text-gray-700">
          {pressRun ? (
            <>
              {record && isOriginalPressing(record) ? "Original press run" : "Press run"}: <span className="font-semibold text-gray-950">{pressRun.size.toLocaleString()} copies</span>
              <span className="text-xs text-gray-400"> ({pressRun.source})</span>
            </>
          ) : (
            <>
              Original press run: <span className="font-medium">no public record</span>
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}
