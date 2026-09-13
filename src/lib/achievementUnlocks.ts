"use client";

import { Achievement, AchievementStats, getUnlockedAchievements } from "@/lib/achievements";
import { useEffect, useState } from "react";

const STORAGE_KEY = "vinyl-achievements-seen";
const INIT_KEY = "vinyl-achievements-initialized";

function readSeen(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<string>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    // ignore — celebration just replays next visit, not worth failing over
  }
}

/**
 * Compares currently-unlocked achievements against what this browser has
 * already celebrated (localStorage, so it's per-device on purpose) and
 * returns only the newly-crossed ones for a celebration to show.
 */
export function useAchievementUnlocks(stats: AchievementStats) {
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);
  const statsKey = JSON.stringify(stats);

  useEffect(() => {
    if (!Object.keys(stats).length) return;

    const seen = readSeen();
    const unlocked = getUnlockedAchievements(stats);

    // First time this browser has ever checked: treat everything already true
    // right now as history, not news — otherwise a collection that's already
    // past a dozen thresholds would dump a wall of celebrations on day one.
    const isInitialized = window.localStorage.getItem(INIT_KEY) === "true";
    if (!isInitialized) {
      const baseline = new Set(seen);
      unlocked.forEach((achievement) => baseline.add(achievement.id));
      writeSeen(baseline);
      window.localStorage.setItem(INIT_KEY, "true");
      return;
    }

    const fresh = unlocked.filter((achievement) => !seen.has(achievement.id));

    if (fresh.length) {
      const nextSeen = new Set(seen);
      fresh.forEach((achievement) => nextSeen.add(achievement.id));
      writeSeen(nextSeen);
      setNewlyUnlocked((current) => [...current, ...fresh]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsKey]);

  const dismiss = (id: string) => {
    setNewlyUnlocked((current) => current.filter((achievement) => achievement.id !== id));
  };

  return { newlyUnlocked, dismiss };
}
