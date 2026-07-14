"use client";

import { CalendarDays, Camera, MapPin, Utensils, Waves, Youtube } from "lucide-react";
import type { TravelFavoriteType } from "@/lib/travel";

type QuickAddKind = "trip" | "photo" | "favorite" | "restaurant" | "activity" | "video";

const ICONS = {
  trip: CalendarDays,
  photo: Camera,
  favorite: MapPin,
  restaurant: Utensils,
  activity: Waves,
  video: Youtube,
};

const LABELS = {
  trip: "Add trip",
  photo: "Add photo",
  favorite: "Add favorite",
  restaurant: "Add restaurant",
  activity: "Add activity",
  video: "Add video",
};

const FAVORITE_TYPE_BY_KIND: Partial<Record<QuickAddKind, TravelFavoriteType>> = {
  restaurant: "restaurant",
  activity: "activity",
  favorite: "place",
};

export interface TravelQuickAddDetail {
  mode: "trip" | "photo" | "favorite" | "video";
  favoriteType?: TravelFavoriteType;
}

export default function TravelQuickAddButton({ kind, label }: { kind: QuickAddKind; label?: string }) {
  const Icon = ICONS[kind];
  const visibleLabel = label ?? LABELS[kind];

  return (
    <button
      type="button"
      aria-label={visibleLabel}
      title={visibleLabel}
      onClick={() => {
        const mode = kind === "trip" || kind === "photo" || kind === "video" ? kind : "favorite";
        window.dispatchEvent(
          new CustomEvent<TravelQuickAddDetail>("travel:quick-add", {
            detail: { mode, favoriteType: FAVORITE_TYPE_BY_KIND[kind] },
          })
        );
      }}
      className={
        label
          ? "inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          : "rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
      }
    >
      <Icon className="h-5 w-5" />
      {label && <span>{label}</span>}
    </button>
  );
}
