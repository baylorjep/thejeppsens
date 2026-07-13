"use client";

import { Plus, X } from "lucide-react";
import { FormEvent, useState } from "react";

const CONTINENTS = ["North America", "South America", "Europe", "Asia", "Africa", "Oceania"];

interface AddCountryControlProps {
  onSaved: () => void;
}

export default function AddCountryControl({ onSaved }: AddCountryControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [geoName, setGeoName] = useState("");
  const [flag, setFlag] = useState("");
  const [continent, setContinent] = useState("Europe");
  const [baylorVisited, setBaylorVisited] = useState(true);
  const [isabelVisited, setIsabelVisited] = useState(true);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const reset = () => {
    setDisplayName("");
    setGeoName("");
    setFlag("");
    setContinent("Europe");
    setBaylorVisited(true);
    setIsabelVisited(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/travel/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName,
          geo_name: geoName || displayName,
          flag,
          continent,
          baylor_visited: baylorVisited,
          isabel_visited: isabelVisited,
        }),
      });

      if (!response.ok) throw new Error("Save failed");

      reset();
      setIsOpen(false);
      setMessage("Country added.");
      onSaved();
    } catch {
      setMessage("Could not add that country.");
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
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-950"
        >
          <Plus className="h-3.5 w-3.5" />
          Add country
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-slate-900">Add country</h3>
        <button type="button" onClick={() => setIsOpen(false)} className="rounded-md p-1 text-slate-400 hover:text-slate-900">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder="Country"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
          required
        />
        <input
          value={geoName}
          onChange={(event) => setGeoName(event.target.value)}
          placeholder="Map name"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
        <input
          value={flag}
          onChange={(event) => setFlag(event.target.value)}
          placeholder="Flag"
          className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
        <select
          value={continent}
          onChange={(event) => setContinent(event.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
        >
          {CONTINENTS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isSaving}
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
