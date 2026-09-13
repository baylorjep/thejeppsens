"use client";

import { Achievement } from "@/lib/achievements";
import { X } from "lucide-react";
import Confetti from "react-confetti";
import { useEffect } from "react";

export default function AchievementCelebration({
  achievements,
  onDismiss,
}: {
  achievements: Achievement[];
  onDismiss: (id: string) => void;
}) {
  const current = achievements[0];

  useEffect(() => {
    if (!current) return;
    const timeout = window.setTimeout(() => onDismiss(current.id), 6000);
    return () => window.clearTimeout(timeout);
  }, [current, onDismiss]);

  if (!current) return null;

  return (
    <>
      <Confetti recycle={false} numberOfPieces={220} />
      <div className="fixed inset-x-0 top-4 z-[200] flex justify-center px-4">
        <div className="flex items-center gap-3 rounded-full border border-gray-200 bg-white px-5 py-3 shadow-xl">
          <span className="text-2xl">{current.emoji}</span>
          <div>
            <p className="text-sm font-semibold text-gray-950">Achievement unlocked: {current.title}</p>
            <p className="text-xs text-gray-500">{current.description}</p>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(current.id)}
            className="ml-2 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-950"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
