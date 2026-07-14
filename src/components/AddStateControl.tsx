"use client";

import type { TravelState } from "@/lib/travel";
import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

interface AddStateControlProps {
  states: TravelState[];
}

export default function AddStateControl({ states }: AddStateControlProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStateId, setSelectedStateId] = useState(states[0]?.id ?? "");
  const selectedState = useMemo(
    () => states.find((state) => state.id === selectedStateId) ?? states[0] ?? null,
    [selectedStateId, states],
  );
  const [baylorVisited, setBaylorVisited] = useState(selectedState?.baylor_visited ?? true);
  const [isabelVisited, setIsabelVisited] = useState(selectedState?.isabel_visited ?? true);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const chooseState = (stateId: string) => {
    const nextState = states.find((state) => state.id === stateId) ?? states[0] ?? null;
    setSelectedStateId(stateId);
    setBaylorVisited(nextState?.baylor_visited ?? false);
    setIsabelVisited(nextState?.isabel_visited ?? false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedState) return;

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/travel/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedState.id,
          baylor_visited: baylorVisited,
          isabel_visited: isabelVisited,
        }),
      });

      if (!response.ok) throw new Error("Save failed");

      setMessage("State updated.");
      setIsOpen(false);
      router.refresh();
    } catch {
      setMessage("Could not update that state.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="flex items-center gap-3">
        {message && <span className="text-xs text-slate-400">{message}</span>}
        <button
          type="button"
          onClick={() => {
            chooseState(selectedStateId || states[0]?.id || "");
            setIsOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-950"
        >
          <Plus className="h-3.5 w-3.5" />
          Add/edit state
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-900">Add or edit state</h3>
        <button type="button" onClick={() => setIsOpen(false)} className="rounded-md p-1 text-slate-400 hover:text-slate-900">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <select
          value={selectedState?.id ?? ""}
          onChange={(event) => chooseState(event.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
        >
          {states.map((state) => (
            <option key={state.id} value={state.id}>
              {state.state_name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isSaving || !selectedState}
          className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={baylorVisited} onChange={(event) => setBaylorVisited(event.target.checked)} />
          Baylor
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={isabelVisited} onChange={(event) => setIsabelVisited(event.target.checked)} />
          Isabel
        </label>
        {message && <span>{message}</span>}
      </div>
    </form>
  );
}
