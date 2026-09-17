"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { VinylRecord } from "@/data/vinyls";
import { emptyEvidence, GRADES, missingEvidence, sidesFor, STATUS_LABELS, type PressingEvidence, type PressingSubmission } from "@/lib/pressingEvidence";
import { optimizeImageFile } from "@/lib/vinylImage";

const input = "mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-base text-gray-950 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";
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
      setEvidence(data.submission?.evidence ?? { ...emptyEvidence(), discCount: Math.min(10, Math.max(1, data.record.discCount ?? 1)) });
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
    setBusy(submit ? "Submitting…" : "Saving draft…"); setError(""); setMessage("");
    try {
      const response = await fetch(endpoint, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ evidence, revision: submission?.revision ?? null, submit }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSubmission(data.submission); setDirty(false);
      setMessage(submit ? "Saved for review! Let Baylor know to run the Discogs processing. Your photos and details are saved; no automatic message was sent." : "Draft saved. You can leave and come back to finish it.");
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

  if (loading) return <p role="status">Loading saved pressing details…</p>;
  if (!record) return <div role="alert" className={section}><p>{error || "Record unavailable."}</p><button type="button" onClick={() => window.location.reload()} className="mt-4 underline">Retry</button></div>;
  const missing = missingEvidence(evidence);
  const locked = Boolean(busy);
  return <div className="mx-auto max-w-3xl">
    <Link href={`/vinyl/${encodeURIComponent(id)}`} onClick={event => { if (dirty && !window.confirm("Leave without saving your changes?")) event.preventDefault(); }} className="text-sm text-gray-500 hover:underline">← Back to album</Link>
    <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Identify this pressing</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{record.title}</h1>
    <p className="mt-2 text-lg text-gray-500">{record.artist}</p>
    <p className="mt-5 leading-7 text-gray-600">Capture what’s on your copy. Baylor will review it and find the exact Discogs edition. You don’t need to research the pressing year, label, or country.</p>
    <div className="my-6 rounded-xl bg-stone-100 p-4 text-sm leading-6">
      <span className="font-semibold">{submission ? STATUS_LABELS[submission.status] : "Not submitted"}{dirty ? " · Unsaved changes" : ""}</span>
      {submission?.status === "pending" ? <p>Let Baylor know to run the Discogs processing. This submission is saved and waiting for review.</p> : null}
      {submission?.review_notes ? <p className="mt-2 whitespace-pre-wrap">Baylor’s review: {submission.review_notes}</p> : null}
      {submission?.release_id ? <a className="mt-2 block underline" href={`https://www.discogs.com/release/${submission.release_id}`} target="_blank" rel="noreferrer">View confirmed Discogs release ↗</a> : null}
      {submission?.status === "confirmed" ? <p className="mt-2">Saving new evidence reopens the review. A confirmed pressing still needs condition and sales comparisons for an accurate value.</p> : null}
    </div>
    <form onSubmit={event => { event.preventDefault(); void save(true); }} className="space-y-5">
      <fieldset disabled={locked} className="space-y-5 disabled:opacity-60">
        <section className={section}>
          <h2 className="text-xl font-semibold">1. Start with your copy</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">Copy identifiers from the physical record, even if the catalog already has a number. Leave anything uncertain blank.</p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium">Catalog number <span className="font-normal text-gray-500">(or label photos below)</span><input className={input} value={evidence.catalogNumber} onChange={e => update("catalogNumber", e.target.value)} placeholder="Spine / back / center label, e.g. ST-1234" maxLength={5000} /></label>
            <label className="text-sm font-medium">Barcode <span className="font-normal text-gray-500">(optional)</span><input className={input} value={evidence.barcode} onChange={e => update("barcode", e.target.value)} placeholder="Keep any leading zeros" maxLength={5000} /></label>
            <label className="text-sm font-medium">Number of discs<select className={input} value={evidence.discCount} onChange={e => update("discCount", Number(e.target.value))}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select></label>
            <label className="text-sm font-medium">Vinyl color / variant <span className="font-normal text-gray-500">(optional)</span><input className={input} value={evidence.color} onChange={e => update("color", e.target.value)} placeholder="Black, clear, blue splatter, unknown…" maxLength={5000} /></label>
          </div>
          <label className="mt-5 flex items-center gap-3 text-sm"><input type="checkbox" checked={evidence.sealed} onChange={e => update("sealed", e.target.checked)} className="h-5 w-5" />Still factory sealed — use packaging evidence</label>
        </section>
        <section className={section}>
          <h2 className="text-xl font-semibold">2. {evidence.sealed ? "Photograph the packaging" : "Labels & runouts"}</h2>
          {evidence.sealed ? <p className="mt-2 text-sm leading-6 text-gray-600">Keep it sealed. Add front and back photos plus the catalog number or barcode. We’ll check exterior details; some sealed copies cannot be confirmed exactly.</p> : <>
            <p className="mt-2 text-sm leading-6 text-gray-600">For each side, add a center-label photo (unless you entered the catalog number) and either runout text or readable close-ups. Label photos are recommended even with a catalog number.</p>
            <details className="mt-4 rounded-lg bg-stone-50 p-4 text-sm leading-6"><summary className="cursor-pointer font-medium">Where are the runouts? How do I photograph them?</summary><p className="mt-3">Look in the smooth ring between the last music groove and the center label. Tilt the record under a lamp. Capture every separate group of etched or stamped letters, numbers, and symbols, working around the whole ring. Use several close-ups if needed. Keep the full text, including crossed-out markings; write ? for unreadable characters. Don’t guess.</p><p className="mt-2">Check that small text is readable when zoomed in. Use JPG/PNG if your phone’s photo format won’t upload. Photos alone can be enough if all markings are clear.</p></details>
            {sidesFor(evidence.discCount).map((side, index) => <div key={side} className="mt-6 border-t border-gray-100 pt-5">
              <h3 className="font-semibold">Disc {Math.floor(index / 2) + 1} · Side {side}</h3>
              {photoField("label", `Side ${side} center-label photos`, side)}
              <label className="mt-4 block text-sm font-medium">Side {side} runout text<textarea rows={2} className={input} value={evidence.runouts[side] ?? ""} onChange={e => update("runouts", { ...evidence.runouts, [side]: e.target.value })} placeholder="All markings around the ring — or upload readable photos below" maxLength={3000} /></label>
              {photoField("runout", `Side ${side} runout close-ups`, side)}
            </div>)}
          </>}
          {photoField("front", `Front cover${evidence.sealed ? " (required)" : " (helpful)"}`)}
          {photoField("back", `Back cover / spine${evidence.sealed ? " (required)" : " (helpful)"}`)}
          {photoField("extra", "Other details: stickers, inserts, edition number (optional)")}
        </section>
        <section className={section}>
          <h2 className="text-xl font-semibold">3. Condition & what’s included</h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">Optional for identifying the pressing; needed to assess your copy’s value. Unknown is better than a guess. “Good” is a worn grade; sealed does not automatically mean Mint. <a href="https://support.discogs.com/hc/en-us/articles/360001566193-How-To-Grade-Items" target="_blank" rel="noreferrer" className="underline">See grading guide ↗</a></p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium">Record condition<select className={input} value={evidence.mediaGrade} onChange={e => update("mediaGrade", e.target.value)}><option value="">Unknown / not graded</option>{GRADES.map(g => <option key={g}>{g}</option>)}</select></label>
            <label className="text-sm font-medium">Jacket condition<select className={input} value={evidence.sleeveGrade} onChange={e => update("sleeveGrade", e.target.value)}><option value="">Unknown / not graded</option>{[...GRADES, "Generic", "No cover"].map(g => <option key={g}>{g}</option>)}</select></label>
          </div>
          <label className="mt-5 block text-sm font-medium">How did you check it?<select className={input} value={evidence.gradingMethod} onChange={e => update("gradingMethod", e.target.value)}><option value="">Not checked</option><option value="visual">Visual inspection only</option><option value="partial">Played some of it</option><option value="full">Played every side</option><option value="sealed">Sealed — playback unknown</option></select></label>
          <label className="mt-5 block text-sm font-medium">Condition notes<textarea className={input} rows={2} value={evidence.conditionNotes} onChange={e => update("conditionNotes", e.target.value)} placeholder="Noise, skips, scratches, warps; jacket splits, writing. Note differences between discs." maxLength={5000} /></label>
          <label className="mt-5 block text-sm font-medium">Extras present or missing<textarea className={input} rows={2} value={evidence.extras} onChange={e => update("extras", e.target.value)} placeholder="Original inner sleeve, poster, booklet, obi, bonus disc; write unknown if unsure." maxLength={5000} /></label>
          <label className="mt-5 block text-sm font-medium">Anything else Baylor should know?<textarea className={input} rows={3} value={evidence.notes} onChange={e => update("notes", e.target.value)} placeholder="Different numbers on jacket and disc, retailer sticker, numbered edition, hard-to-read markings…" maxLength={5000} /></label>
        </section>
      </fieldset>
      <div className={`${section} border-stone-300 bg-stone-50`}>
        <h2 className="font-semibold">{missing.length ? "Before submitting" : "Ready for Baylor’s review"}</h2>
        {missing.length ? <><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-600">{missing.map(item => <li key={item}>{item}</li>)}</ul><p className="mt-3 text-sm text-gray-500">You can save an incomplete draft at any time.</p></> : <p className="mt-2 text-sm leading-6 text-gray-600">Your identification evidence is filled in. Baylor still needs to check readability and the exact match. After submitting, let him know to run the processing.</p>}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={() => void save(false)} disabled={locked || (!dirty && Boolean(submission))} className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium disabled:opacity-40">Save draft</button>
          <button type="submit" disabled={locked || missing.length > 0 || (!dirty && Boolean(submission) && ["pending", "confirmed"].includes(submission!.status))} className="rounded-lg bg-gray-950 px-5 py-3 text-sm font-medium text-white disabled:opacity-40">Submit for Baylor to review</button>
        </div>
        {busy ? <p role="status" className="mt-4 text-sm">{busy}</p> : null}
        {message ? <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{message}</p> : null}
        {error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
      </div>
    </form>
  </div>;
}
