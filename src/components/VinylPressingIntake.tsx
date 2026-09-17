"use client";

import { sidesFor } from "@/lib/pressingEvidence";

export type PressingIntake = { sealed: boolean; runouts: Record<string, string>; files: Record<string, File[]> };
export const emptyPressingIntake = (): PressingIntake => ({ sealed: false, runouts: {}, files: {} });

export default function VinylPressingIntake({ value, onChange, discs, onDiscsChange }: {
  value: PressingIntake; onChange: (value: PressingIntake) => void; discs: number; onDiscsChange: (count: number) => void;
}) {
  return <section className="my-6 rounded-xl border border-gray-200 bg-stone-50 p-4 sm:p-5">
    <h3 className="text-lg font-semibold">Identify your exact edition</h3>
    <p className="mt-2 text-sm leading-6 text-gray-600">We’ll use the cover photos above. Add the tiny codes from each side below, then save once. Baylor will review the match.</p>
    <label className="mt-4 flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={value.sealed} onChange={e => onChange({ ...value, sealed: e.target.checked })} className="h-5 w-5" />Still factory sealed</label>
    {value.sealed ? <p className="mt-3 text-sm text-gray-600">Keep it sealed. We’ll start with the front and back photos; some copies need more detail to identify.</p> : <>
      <label className="mt-4 block text-sm font-medium">How many discs?<select value={discs} onChange={e => onDiscsChange(Number(e.target.value))} className="mt-2 block w-full rounded-lg border border-gray-300 bg-white p-3">{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1} {i === 0 ? "disc" : "discs"}</option>)}</select></label>
      <details className="mt-4 rounded-lg bg-white p-4"><summary className="cursor-pointer text-sm font-medium">Where are the matrix codes?</summary>
        <svg viewBox="0 0 320 200" role="img" aria-label="Look in the smooth ring between the music grooves and the paper label" className="mx-auto mt-3 w-full max-w-xs"><circle cx="110" cy="100" r="92" fill="#292524" />{[82, 73, 64].map(r => <circle key={r} cx="110" cy="100" r={r} fill="none" stroke="#57534e" />)}<circle cx="110" cy="100" r="48" fill="none" stroke="#fbbf24" strokeWidth="16" /><circle cx="110" cy="100" r="38" fill="#e7e5e4" /><circle cx="110" cy="100" r="5" fill="#292524" /><path d="M154 78 L215 35 H310" fill="none" stroke="#92400e" strokeWidth="2" /><text x="218" y="27" fontSize="13" fill="#92400e">Codes here</text><text x="110" y="88" textAnchor="middle" fontSize="11">Paper label</text></svg>
        <p className="mt-3 text-sm leading-6 text-gray-600">Look in the smooth vinyl just outside the paper label. Tilt it under a lamp and turn it all the way around. Copy every group of letters, numbers, and symbols, including crossed-out text. Use ? for anything unreadable.</p>
        <p className="mt-2 text-sm leading-6 text-gray-600">Photos instead? Take close-ups of every group. Tap to focus and check that you can read the letters when zoomed in.</p>
      </details>
      {sidesFor(discs).map((side, index) => <div key={side} className="mt-5 border-t border-gray-200 pt-4">
        <label className="block text-sm font-medium">Disc {Math.floor(index / 2) + 1} · Side {side} {index % 2 ? "(flip it over)" : "(first side)"}<textarea value={value.runouts[side] ?? ""} onChange={e => onChange({ ...value, runouts: { ...value.runouts, [side]: e.target.value } })} rows={2} maxLength={3000} placeholder="Type every marking around the smooth ring" className="mt-2 block w-full rounded-lg border border-gray-300 bg-white p-3 text-base" /></label>
        <label className="mt-3 block text-sm text-gray-600">Or add readable close-up photos<input type="file" accept="image/*" multiple onChange={e => { onChange({ ...value, files: { ...value.files, [side]: [...(value.files[side] ?? []), ...Array.from(e.target.files ?? [])] } }); e.target.value = ""; }} className="mt-2 block w-full text-sm" /></label>
        {(value.files[side] ?? []).map((file, i) => <div key={`${file.name}-${i}`} className="mt-2 flex items-center justify-between gap-3 text-sm"><span className="truncate">{file.name}</span><button type="button" className="underline" aria-label={`Remove ${file.name} from side ${side}`} onClick={() => onChange({ ...value, files: { ...value.files, [side]: value.files[side].filter((_, j) => i !== j) } })}>Remove</button></div>)}
      </div>)}
    </>}
    <p className="mt-4 text-sm text-gray-600">Missing something? Save now and finish later using the album’s identification card.</p>
  </section>;
}
