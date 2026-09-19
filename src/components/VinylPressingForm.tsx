"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { VinylRecord } from "@/data/vinyls";
import { emptyEvidence, GRADES, missingEvidence, sidesFor, STATUS_LABELS, type PressingEvidence, type PressingSubmission } from "@/lib/pressingEvidence";
import { optimizeImageFile } from "@/lib/vinylImage";

const input = "mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-950 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";
const gradeHelp: Record<string, { record: string; cover: string }> = {
  "Mint (M)": { record: "Perfect and unplayed; rarely used.", cover: "Perfect; no defects." },
  "Near Mint (NM or M-)": { record: "Almost perfect; no obvious wear; flawless playback.", cover: "Almost perfect; no creases or split edges." },
  "Very Good Plus (VG+)": { record: "Light wear that does not affect listening.", cover: "Minor wear or small corner damage." },
  "Very Good (VG)": { record: "Audible crackle, but music remains clear.", cover: "Noticeable wear, marks, or writing." },
  "Good Plus (G+)": { record: "Noisy throughout, but plays without skipping.", cover: "Heavy wear; seam splits or creases." },
  "Good (G)": { record: "Very noisy and scratched; may skip.", cover: "Torn, written on, or taped." },
  "Fair (F)": { record: "Major damage; skips or repeats.", cover: "Severe damage; barely holds the record." },
  "Poor (P)": { record: "Major damage; skips or repeats.", cover: "Severe damage; barely holds the record." },
};

const section = "rounded-2xl border border-gray-200 bg-white p-5 sm:p-7";

export default function VinylPressingForm({ id }: { id: string }) {
  const [record, setRecord] = useState<VinylRecord | null>(null);
  const [submission, setSubmission] = useState<PressingSubmission | null>(null);
  const [evidence, setEvidence] = useState<PressingEvidence>(emptyEvidence);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(0);
  const [touchedSides, setTouchedSides] = useState<Record<string, boolean>>({});
  const [copiedFrom, setCopiedFrom] = useState<Record<string, string>>({});
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const endpoint = `/api/vinyl-records/${encodeURIComponent(id)}/pressing`;

  useEffect(() => {
    let active = true;
    fetch(endpoint, { cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (!active) return;
      setRecord(data.record);
      setSubmission(data.submission);
      // Existing imported metadata is not physical evidence: don't prefill identifiers.
      const loaded = data.submission?.evidence ?? { ...emptyEvidence(), discCount: Math.min(10, Math.max(1, data.record.discCount ?? 1)) };
      setEvidence(loaded);
      // "Touched" tracks edits made in this session only — a side saved with content on a
      // previous visit isn't assumed to be a deliberate override, so re-editing an earlier
      // side still cascades forward into it (the "Copied from" hint flags it either way).
      setTouchedSides({});
      setCopiedFrom({});
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [endpoint]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update<K extends keyof PressingEvidence>(key: K, value: PressingEvidence[K]) {
    setEvidence(current => ({ ...current, [key]: value }));
    setDirty(true);
    setMessage("");
  }

  async function upload(files: FileList | null, kind: string, side?: string) {
    if (!files?.length) return;
    setBusy("Uploading photos…"); setError(""); setMessage("");
    try {
      if (evidence.photos.length + files.length > 60) throw new Error("Keep up to 60 photos per record.");
      for (const original of Array.from(files)) {
        let file: File;
        try { file = await optimizeImageFile(original, 2800, 0.92); }
        catch { throw new Error("This photo could not be opened. Try a JPG/PNG export or take a new photo."); }
        if (file.size > 4_000_000) throw new Error("This photo is too large. Crop it to the label or runout and try again.");
        const body = new FormData(); body.set("photo", file);
        const response = await fetch(endpoint, { method: "POST", body });
        const photo = await response.json();
        if (!response.ok) throw new Error(photo.error);
        setEvidence(current => ({ ...current, photos: [...current.photos, { ...photo, kind, side }] }));
        setDirty(true);
      }
      setMessage("Photos uploaded. Save your draft or submit below to attach them to this record.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not upload photos."); }
    finally { setBusy(""); }
  }

  async function save(submit: boolean) {
    setBusy(submit ? "Saving & checking Discogs…" : "Saving draft…"); setError(""); setMessage("");
    try {
      const response = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evidence, revision: submission?.revision ?? null, submit }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSubmission(data.submission); setDirty(false);
      setMessage(submit ? (data.submission.status === "confirmed" ? "Matched automatically! Your album now links to the confirmed Discogs release." : data.submission.review_notes || "Saved for Baylor’s review. No notification is sent automatically.") : "Draft saved. You can leave and come back to finish it.");
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save. Please retry."); }
    finally { setBusy(""); }
  }

  function photoField(kind: string, title: string, side?: string) {
    const photos = evidence.photos.filter(p => p.kind === kind && p.side === side);
    return <div className="mt-4">
      <label className="block text-sm font-medium text-gray-800">{title}
        <input type="file" accept="image/*" multiple disabled={Boolean(busy)} onChange={event => { void upload(event.target.files, kind, side); event.target.value = ""; }} className="mt-2 block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-3 file:font-medium file:text-gray-900" />
      </label>
      <div className="mt-3 flex flex-wrap gap-3">{photos.map(p => <div key={p.path} className="w-24">
        <a href={p.url} target="_blank" rel="noreferrer" aria-label={`Open ${title}`}>
          {/* Evidence thumbnails must preserve the uploaded source for close inspection. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.url} alt={`${title}${side ? `, side ${side}` : ""}`} className="h-24 w-24 rounded-lg border border-gray-200 object-contain" />
        </a>
        <button type="button" disabled={Boolean(busy)} onClick={() => update("photos", evidence.photos.filter(item => item.path !== p.path))} className="mt-1 text-xs text-red-700 underline">Remove</button>
      </div>)}</div>
    </div>;
  }

  function coverField(kind: "front" | "back") {
    const url = kind === "front" ? record?.coverImage : record?.backCoverImage;
    const title = kind === "front" ? "Front cover" : "Back cover";
    if (!url) return photoField(kind, `${title} (optional)`);
    return <div className="mt-4 rounded-xl bg-stone-50 p-4">
      <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`Saved ${title.toLowerCase()}`} className="h-16 w-16 rounded-lg object-contain" />
        <span className="text-sm"><strong>{title} already saved</strong><span className="mt-1 block text-gray-600">We’ll use this photo.</span></span>
      </a>
      <details className="mt-3" open={evidence.photos.some(p => p.kind === kind) ? true : undefined}><summary className="cursor-pointer text-sm underline">Add a different photo</summary>{photoField(kind, title)}</details>
    </div>;
  }

  if (loading) return <p role="status">Loading saved pressing details…</p>;
  if (!record) return <div role="alert" className={section}><p>{error || "Record unavailable."}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 underline">Retry</button></div>;
  const missing = missingEvidence(evidence, record);
  const locked = Boolean(busy);
  const sides = sidesFor(evidence.discCount);
  const conditionStep = sides.length + 1;
  const reviewStep = conditionStep + 1;
  const activeSide = sides[step - 1];
  function updateRunout(side: string, value: string) {
    setTouchedSides(current => ({ ...current, [side]: true }));
    setCopiedFrom(current => {
      const next = { ...current };
      delete next[side];
      for (let i = sides.indexOf(side) + 1; i < sides.length; i++) {
        if (touchedSides[sides[i]]) break;
        next[sides[i]] = side;
      }
      return next;
    });
    setEvidence(current => {
      const runouts = { ...current.runouts, [side]: value };
      for (let i = sides.indexOf(side) + 1; i < sides.length; i++) {
        if (touchedSides[sides[i]]) break;
        runouts[sides[i]] = value;
      }
      return { ...current, runouts };
    });
    setDirty(true);
    setMessage("");
  }
  function goToStep(next: number) {
    setStep(next);
    requestAnimationFrame(() => {
      stepHeading.current?.focus();
      stepHeading.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  const identifiers = <div className="space-y-4">
    <label className="block text-sm font-medium">Barcode
      <input className={input} value={evidence.barcode} onChange={e => update("barcode", e.target.value)} placeholder="Numbers under the bars" maxLength={5000} />
    </label>
    <label className="block text-sm font-medium">Catalog number
      <input className={input} value={evidence.catalogNumber} onChange={e => update("catalogNumber", e.target.value)} placeholder="e.g. ST-1234" maxLength={5000} />
    </label>
  </div>;
  return <div className="mx-auto max-w-3xl">
    <Link href={`/vinyl/${encodeURIComponent(id)}`} onClick={event => { if (dirty && !window.confirm("Leave without saving your changes?")) event.preventDefault(); }} className="text-sm text-gray-500 hover:underline">← Back to album</Link>
    <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Identify this pressing</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{record.title}</h1>
    <p className="mt-2 text-lg text-gray-500">{record.artist}</p>
    <div className="my-6 rounded-xl bg-stone-100 p-4 text-sm leading-6">
      <span className="font-semibold">{submission ? STATUS_LABELS[submission.status] : "Not submitted"}{dirty ? " · Unsaved changes" : ""}</span>
      {submission?.status === "pending" ? <p>Your details are saved and waiting for review. Tell Baylor you’ve submitted this album; no notification is sent automatically.</p> : null}
      {submission?.review_notes ? <p className="mt-2 whitespace-pre-wrap">Identification result: {submission.review_notes}</p> : null}
      {submission?.release_id ? <a className="mt-2 block underline" href={`https://www.discogs.com/release/${submission.release_id}`} target="_blank" rel="noreferrer">View confirmed Discogs release ↗</a> : null}
      {submission?.status === "confirmed" ? <p className="mt-2">Saving new evidence reopens the review. A confirmed pressing still needs condition and sales comparisons for an accurate value.</p> : null}
    </div>
    <form onSubmit={event => { event.preventDefault(); if (step === reviewStep && !missing.length && !locked) void save(true); }} className="space-y-5">
      <fieldset disabled={locked} className="space-y-5 disabled:opacity-60">
        <nav aria-label="Identification steps" className="flex flex-wrap gap-2">
          {["Your copy", ...sides.map(side => `Side ${side}`), "Condition", "Review"].map((label, index) => <button key={label} type="button" onClick={() => goToStep(index)} aria-current={step === index ? "step" : undefined} className={`rounded-full px-4 py-2 text-sm ${step === index ? "bg-gray-950 text-white" : "bg-stone-100 text-gray-700"}`}>{index + 1}. {label}</button>)}
        </nav>
        <h2 ref={stepHeading} tabIndex={-1} className="scroll-mt-6 text-2xl font-semibold outline-none">{step === 0 ? "First, check your copy" : step === reviewStep ? "Review & finish" : step === conditionStep ? "What shape is your copy in?" : `Disc ${Math.floor((step - 1) / 2) + 1} · Side ${activeSide}`}</h2>
        {step === 0 ? <section className={section}>
          <label className="block text-sm font-medium">How many vinyl discs are inside?<select className={input} value={evidence.discCount} onChange={e => update("discCount", Number(e.target.value))}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "disc · 2 sides" : `discs · ${(i + 1) * 2} sides`}</option>)}</select></label>
          <div className="mt-5">{identifiers}</div>
          <label className="mt-5 block text-sm font-medium">Vinyl color<input className={input} value={evidence.color} onChange={e => update("color", e.target.value)} placeholder="Black, clear, blue splatter…" maxLength={5000} /></label>
        </section> : null}
        {activeSide ? <section key={activeSide} className={section}>
          <figure className="rounded-xl bg-stone-50 p-4">
            <svg viewBox="0 0 360 240" role="img" aria-label="Record diagram: the highlighted ring just outside the paper center label is where to look for matrix and runout markings" className="mx-auto w-full max-w-sm">
              <circle cx="145" cy="120" r="108" fill="#292524" />
              {[98, 90, 82, 74].map(r => <circle key={r} cx="145" cy="120" r={r} fill="none" stroke="#57534e" />)}
              <circle cx="145" cy="120" r="60" fill="none" stroke="#fbbf24" strokeWidth="19" />
              <circle cx="145" cy="120" r="46" fill="#e7e5e4" />
              <circle cx="145" cy="120" r="5" fill="#292524" />
              <text x="145" y="106" textAnchor="middle" fontSize="12" fill="#292524">Paper label</text>
              <path d="M198 93 L246 48 H346" fill="none" stroke="#92400e" strokeWidth="2" />
              <text x="252" y="40" fontSize="13" fontWeight="bold" fill="#92400e">Look here</text>
              <text x="145" y="209" textAnchor="middle" fontSize="12" fill="white">Music grooves</text>
            </svg>
          </figure>
          {photoField("runout", `Side ${activeSide} marking photos`, activeSide)}
          <label className="mt-4 block text-sm font-medium">Or type the markings<textarea rows={3} className={input} value={evidence.runouts[activeSide] ?? ""} onChange={e => updateRunout(activeSide, e.target.value)} placeholder="Copy exactly what you see" maxLength={3000} /></label>
          {copiedFrom[activeSide] ? <p className="mt-2 text-sm text-amber-700">Copied from side {copiedFrom[activeSide]} — check it, or edit above.</p> : null}
        </section> : null}
        {step === reviewStep ? <section className={section}>
          <details className="mt-5"><summary className="cursor-pointer text-sm font-medium underline">Extra photos</summary>
            <div className="mt-3">{coverField("front")}{coverField("back")}{photoField("extra", "Stickers, inserts, or other details")}</div>
          </details>
        </section> : null}
        {step === conditionStep ? <section className={section}>
          <label className="block text-sm font-medium">Vinyl disc grade<select className={input} value={evidence.mediaGrade} onChange={e => update("mediaGrade", e.target.value)}><option value="">Not sure</option>{GRADES.map(g => <option key={g} value={g}>{g} — {gradeHelp[g].record}</option>)}</select></label>
          <label className="mt-5 block text-sm font-medium">Cardboard cover grade<select className={input} value={evidence.sleeveGrade} onChange={e => update("sleeveGrade", e.target.value)}><option value="">Not sure</option>{GRADES.map(g => <option key={g} value={g}>{g} — {gradeHelp[g].cover}</option>)}<option value="Generic">Generic</option><option value="No cover">No cover</option></select></label>
          <label className="mt-6 block text-sm font-medium">Notes<textarea className={input} rows={3} value={evidence.conditionNotes} onChange={e => update("conditionNotes", e.target.value)} placeholder="Disc, sound, cover…" maxLength={5000} /></label>
        </section> : null}
      </fieldset>
      <div className={`${section} border-stone-300 bg-stone-50`}>
        <h2 className="font-semibold">{step !== reviewStep ? "Work at your own pace" : missing.length ? "Still needed before submitting" : "Ready to identify"}</h2>
        {step !== reviewStep ? <p className="mt-2 text-sm text-gray-600">Save a draft before leaving. Continue moves to the next step without saving.</p> : missing.length ? <><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">{missing.map(item => <li key={item}><button type="button" disabled={locked} className="text-left underline underline-offset-4" onClick={() => { const side = /^Side ([A-T]):/.exec(item)?.[1]; goToStep(side ? sides.indexOf(side) + 1 : 0); }}>{item} →</button></li>)}</ul><p className="mt-3 text-sm text-gray-500">You can save an incomplete draft at any time.</p></> : <p className="mt-2 text-sm leading-6 text-gray-600">Typed codes are checked against Discogs now. Photos and uncertain matches stay saved for Baylor; no notification is sent.</p>}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => void save(false)} disabled={locked || (!dirty && Boolean(submission))} className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium disabled:opacity-40">Save draft</button>
          {step > 0 ? <button type="button" disabled={locked} onClick={() => goToStep(step - 1)} className="rounded-lg border border-gray-300 px-5 py-3 text-sm font-medium">Back</button> : null}
          {step < reviewStep ? <button type="button" disabled={locked} onClick={() => goToStep(step + 1)} className="rounded-lg bg-gray-950 px-5 py-3 text-sm font-medium text-white">{step + 1 === reviewStep ? "Continue to review" : step + 1 === conditionStep ? "Continue to condition (optional)" : `Continue to side ${sides[step]}`}</button> : <button type="submit" disabled={locked || missing.length > 0 || (!dirty && Boolean(submission) && ["pending", "confirmed"].includes(submission!.status))} className="rounded-lg bg-gray-950 px-5 py-3 text-sm font-medium text-white disabled:opacity-40">Save & identify</button>}
        </div>
        {busy ? <p role="status" className="mt-4 text-sm">{busy}</p> : null}
        {message ? <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{message}</p> : null}
        {!dirty && !busy && submission && submission.status !== "draft" ? <Link href="/vinyl/identify" className="mt-4 inline-block rounded-lg bg-gray-950 px-5 py-3 text-sm font-medium text-white">Identify another record →</Link> : null}
        {error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
      </div>
    </form>
  </div>;
}
