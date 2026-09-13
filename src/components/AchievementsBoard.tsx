"use client";

import { VinylRecord } from "@/data/vinyls";
import AchievementCelebration from "@/components/AchievementCelebration";
import {
  ACHIEVEMENTS,
  Achievement,
  AchievementCategory,
  computeInstantStats,
} from "@/lib/achievements";
import { useAchievementUnlocks } from "@/lib/achievementUnlocks";
import { formatDiscogsMoney, useCollectionValue } from "@/lib/discogsClient";
import { fetchVinylRecords } from "@/lib/vinylApi";
import { readQueuedVinyls } from "@/lib/vinylQueue";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AchievementsBoardProps = {
  records: VinylRecord[];
};

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  collection: "Collection size",
  favorites: "Favorites",
  artists: "Artists",
  genres: "Genres",
  discogsVerified: "Discogs confirmations",
  value: "Collection value",
};

const CATEGORY_ORDER: AchievementCategory[] = [
  "collection",
  "favorites",
  "artists",
  "genres",
  "discogsVerified",
  "value",
];

export default function AchievementsBoard({ records }: AchievementsBoardProps) {
  const [allRecords, setAllRecords] = useState(records);

  useEffect(() => {
    const queuedRecords = readQueuedVinyls();
    fetchVinylRecords()
      .then((response) => {
        setAllRecords(response.source === "supabase" ? response.records : [...response.records, ...queuedRecords]);
      })
      .catch(() => setAllRecords([...records, ...queuedRecords]));
  }, [records]);

  const instantStats = useMemo(() => computeInstantStats(allRecords), [allRecords]);
  const { value: collectionValue } = useCollectionValue(allRecords);

  const stats = useMemo(
    () => ({ ...instantStats, collectionValue: collectionValue?.total }),
    [instantStats, collectionValue],
  );

  const { newlyUnlocked, dismiss } = useAchievementUnlocks(stats);

  const grouped = useMemo(() => {
    const map = new Map<AchievementCategory, Achievement[]>();
    for (const achievement of ACHIEVEMENTS) {
      const list = map.get(achievement.category) ?? [];
      list.push(achievement);
      map.set(achievement.category, list);
    }
    return map;
  }, []);

  const unlockedCount = ACHIEVEMENTS.filter((achievement) => {
    const current = stats[achievement.metric];
    return typeof current === "number" && current >= achievement.threshold;
  }).length;

  return (
    <div className="space-y-8">
      <AchievementCelebration achievements={newlyUnlocked} onDismiss={dismiss} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-gray-500">Milestones</p>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-950 sm:text-5xl">Achievements</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
            {unlockedCount} of {ACHIEVEMENTS.length} unlocked.
          </p>
        </div>
        <Link
          href="/vinyl/insights"
          className="inline-flex w-fit shrink-0 rounded-md border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-500"
        >
          Back to insights
        </Link>
      </div>

      {CATEGORY_ORDER.map((category) => {
        const achievements = grouped.get(category);
        if (!achievements?.length) return null;

        return (
          <section key={category}>
            <h2 className="mb-4 text-base font-semibold text-gray-950 sm:text-lg">{CATEGORY_LABELS[category]}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {achievements.map((achievement) => {
                const current = stats[achievement.metric] ?? 0;
                const unlocked = current >= achievement.threshold;
                const pct = Math.min(100, Math.round((current / achievement.threshold) * 100));
                const isMoney = achievement.metric === "collectionValue";

                return (
                  <div
                    key={achievement.id}
                    className={`rounded-lg border p-4 text-center transition-colors ${
                      unlocked ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50 grayscale opacity-50"
                    }`}
                  >
                    <p className="text-3xl">{achievement.emoji}</p>
                    <p className="mt-2 text-sm font-semibold text-gray-950">{achievement.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{achievement.description}</p>
                    <div className="mt-3 h-1.5 rounded-full bg-gray-100">
                      <div
                        className={`h-1.5 rounded-full ${unlocked ? "bg-gray-950" : "bg-gray-300"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-gray-400">
                      {isMoney
                        ? `${formatDiscogsMoney({ currency: "USD", value: Math.min(current, achievement.threshold) }, { cents: false })} of ${formatDiscogsMoney({ currency: "USD", value: achievement.threshold }, { cents: false })}`
                        : `${Math.min(current, achievement.threshold)} / ${achievement.threshold}`}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
