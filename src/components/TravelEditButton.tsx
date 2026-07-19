"use client";

import type { TravelFavorite, TravelPhoto, TravelTrip, TravelVideo } from "@/lib/travel";
import { Edit3 } from "lucide-react";

type EditItem =
  | { type: "trip"; item: TravelTrip }
  | { type: "photo"; item: TravelPhoto }
  | { type: "favorite"; item: TravelFavorite }
  | { type: "video"; item: TravelVideo };

export default function TravelEditButton({ type, item, label = "Edit", className }: EditItem & { label?: string; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => window.dispatchEvent(new CustomEvent("travel:edit-item", { detail: { type, item } }))}
      className={className ?? "inline-flex items-center justify-center rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-teal-500"}
    >
      <Edit3 className="h-4 w-4" />
    </button>
  );
}
