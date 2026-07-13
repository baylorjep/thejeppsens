"use client";

import { COUNTRY_CONTINENTS, COUNTRY_OPTIONS } from "@/lib/countryOptions";
import type { Country } from "@/lib/travel";
import { Plus, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

interface AddCountryControlProps {
  countries: Country[];
  onSaved: () => void;
}

export default function AddCountryControl({ countries, onSaved }: AddCountryControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [continent, setContinent] = useState("Europe");
  const [selectedGeoName, setSelectedGeoName] = useState("");
  const [baylorVisited, setBaylorVisited] = useState(true);
  const [isabelVisited, setIsabelVisited] = useState(true);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const existingGeoNames = useMemo(() => new Set(countries.map((country) => country.geo_name)), [countries]);
  const options = useMemo(
    () => COUNTRY_OPTIONS.filter((country) => country.continent === continent && !existingGeoNames.has(country.geoName)),
    [continent, existingGeoNames],
  );
  const selectedCountry = options.find((country) => country.geoName === selectedGeoName) ?? options[0] ?? null;

  const reset = () => {
    setContinent("Europe");
    setSelectedGeoName("");
    setBaylorVisited(true);
    setIsabelVisited(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    if (!selectedCountry) {
      setMessage("No countries available for that continent.");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/travel/countries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: selectedCountry.displayName,
          geo_name: selectedCountry.geoName,
          flag: selectedCountry.flag,
          continent: selectedCountry.continent,
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
      <div className="grid gap-3 sm:grid-cols-[0.9fr_1.5fr_auto]">
        <select
          value={continent}
          onChange={(event) => {
            setContinent(event.target.value);
            setSelectedGeoName("");
          }}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
        >
          {COUNTRY_CONTINENTS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        <select
          value={selectedCountry?.geoName ?? ""}
          onChange={(event) => setSelectedGeoName(event.target.value)}
          className="rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-900"
          disabled={!options.length}
        >
          {options.length ? (
            options.map((country) => (
              <option key={country.geoName} value={country.geoName}>
                {country.flag} {country.displayName}
              </option>
            ))
          ) : (
            <option>No countries left</option>
          )}
        </select>
        <button
          type="submit"
          disabled={isSaving || !selectedCountry}
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
