"use client";

import { fetchDiscogsValue, rarityTierLabel } from "@/lib/discogsClient";
import { useEffect, useState } from "react";

function releaseUrl(releaseId: number) {
  return `https://www.discogs.com/release/${releaseId}`;
}

export default function DiscogsRarityCard({
  releaseId,
  condition,
}: {
  releaseId: number;
  condition?: string;
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

  if (status === "unavailable") return null;

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-6">
      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Rarity</h3>
      {status === "loading" ? (
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
    </div>
  );
}
