"use client";

import { CalendarDays, Camera, MapPin, Utensils, Waves } from "lucide-react";
import type { TravelFavoriteType } from "@/lib/travel";

type QuickAddKind = "trip" | "photo" | "favorite" | "restaurant" | "activity";

const ICONS = {
  trip: CalendarDays,
  photo: Camera,
  favorite: MapPin,
  restaurant: Utensils,
  activity: Waves,
};

const LABELS = {
  trip: "Add trip",
  photo: "Add photo",
  favorite: "Add favorite",
  restaurant: "Add restaurant",
  activity: "Add activity",
};

const FAVORITE_TYPE_BY_KIND: Partial<Record<QuickAddKind, TravelFavoriteType>> = {
  restaurant: "restaurant",
  activity: "activity",
  favorite: "place",
};

export interface TravelQuickAddDetail {
  mode: "trip" | "photo" | "favorite";
  favoriteType?: TravelFavoriteType;
}

export default function TravelQuickAddButton({ kind }: { kind: QuickAddKind }) {
  const Icon = ICONS[kind];

  return (
    <button
      type="button"
      aria-label={LABELS[kind]}
      title={LABELS[kind]}
      onClick={() => {
        const mode = kind === "trip" || kind === "photo" ? kind : "favorite";
        window.dispatchEvent(
          new CustomEvent<TravelQuickAddDetail>("travel:quick-add", {
            detail: { mode, favoriteType: FAVORITE_TYPE_BY_KIND[kind] },
          })
        );
      }}
      className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
