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
  "Good Plus (G+)": { record: "Heavy noise and wear; plays without skipping.", cover: "Worn; split edges, tape, or writing." },
  "Good (G)": { record: "Heavy noise and wear; plays without skipping.", cover: "Worn; split edges, tape, or writing." },
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
    if (!url) return photoField(kind, `${title}${evidence.sealed ? " — required" : " (optional)"}`);
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
  const hasCovers = Boolean((record.coverImage || evidence.photos.some(p => p.kind === "front")) && (record.backCoverImage || evidence.photos.some(p => p.kind === "back")));
  const labelNeeded = !hasCovers && !evidence.catalogNumber.trim();
  const sides = evidence.sealed ? [] : sidesFor(evidence.discCount);
  const conditionStep = sides.length + 1;
  const reviewStep = conditionStep + 1;
  const activeSide = sides[step - 1];
  function goToStep(next: number) {
    setStep(next);
    requestAnimationFrame(() => {
      stepHeading.current?.focus();
      stepHeading.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
  const identifiers = <div className="space-y-5">
    <label className="block text-sm font-medium">Barcode numbers (optional)
      <span className="mt-1 block font-normal leading-6 text-gray-600">Numbers below the black bars on the back cover. Include the small digits at both ends and any leading zeros. No barcode? Skip it.</span>
      <input className={input} value={evidence.barcode} onChange={e => update("barcode", e.target.value)} placeholder="Numbers underneath the black bars" maxLength={5000} />
    </label>
    <label className="block text-sm font-medium">Catalog number (optional)
      <span className="mt-1 block font-normal leading-6 text-gray-600">Printed code on the cover’s spine, back, or paper label, such as ST-1234. Not the code scratched into the vinyl.</span>
      <input className={input} value={evidence.catalogNumber} onChange={e => update("catalogNumber", e.target.value)} placeholder="For example: ST-1234" maxLength={5000} />
    </label>
  </div>;
  return <div className="mx-auto max-w-3xl">
    <Link href={`/vinyl/${encodeURIComponent(id)}`} onClick={event => { if (dirty && !window.confirm("Leave without saving your changes?")) event.preventDefault(); }} className="text-sm text-gray-500 hover:underline">← Back to album</Link>
    <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Identify this pressing</p>
    <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{record.title}</h1>
    <p className="mt-2 text-lg text-gray-500">{record.artist}</p>
    <p className="mt-5 leading-7 text-gray-600">Grab your record, phone, and a lamp. We’ll check one side at a time. Typed codes are checked automatically. Baylor reviews uncertain matches.</p>
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
          <label className="flex items-start gap-3 font-medium"><input type="checkbox" checked={evidence.sealed} onChange={e => update("sealed", e.target.checked)} className="mt-1 h-5 w-5" /><span>My copy is still factory sealed<span className="mt-1 block text-sm font-normal leading-6 text-gray-600">Leave it sealed. We’ll use the jacket instead of asking you to open it.</span></span></label>
          {!evidence.sealed && (record.coverImage || record.backCoverImage) ? <p className="mt-4 text-sm text-gray-600">{record.coverImage && record.backCoverImage ? "Front and back photos already saved — no need to upload them again." : `${record.coverImage ? "Front" : "Back"} photo already saved — we’ll use it.`}</p> : null}
          {!evidence.sealed ? <>
            <label className="mt-6 block text-sm font-medium">How many vinyl discs are inside?<select className={input} value={evidence.discCount} onChange={e => update("discCount", Number(e.target.value))}>{Array.from({ length: 10 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? "disc · 2 sides" : `discs · ${(i + 1) * 2} sides`}</option>)}</select></label>
            <p className="mt-5 rounded-lg bg-stone-50 p-4 text-sm leading-6"><strong>Start with these photos:</strong> photos OR typed text of every marking around each side’s smooth inner ring. With both cover photos saved, label photos are optional.</p>
            <details className="mt-5"><summary className="cursor-pointer text-sm font-medium underline">Have a barcode or catalog number? Add it here (optional)</summary><div className="mt-4">{identifiers}</div></details>
          </> : <>
            <p className="mt-5 text-sm leading-6 text-gray-600">We’ll use your saved cover photos. Add any missing view. Barcode typing is optional. Keep it sealed.</p>
            {coverField("front")}
            {coverField("back")}
            <div className="mt-5">{identifiers}</div>
          </>}
        </section> : null}
        {activeSide ? <section key={activeSide} className={section}>
          <p className="text-sm leading-6 text-gray-600">{step % 2 === 1 ? `Take out disc ${Math.floor((step - 1) / 2) + 1} and start with its first side.` : "Flip the same disc over to its other side."} A/B = disc 1; C/D = disc 2. The labels may say 1/2/3/4 instead.</p>
          <details className="mt-5" open={labelNeeded ? true : undefined}><summary className="cursor-pointer text-sm font-medium">Paper label photo {labelNeeded ? "(needed without both covers or a catalog number)" : "(optional)"}</summary>
            <p className="mt-2 text-sm text-gray-600">Include the whole round label with readable small print.</p>
            {photoField("label", `Side ${activeSide} label photo`, activeSide)}
          </details>
          <h3 className="mt-6 text-lg font-semibold">Copy or photograph the tiny markings</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">Look at the <strong>smooth ring between the music grooves and the paper label</strong>. The scratched or stamped codes are called <strong>matrix / runout markings</strong>.</p>
          <details key={`guide-${activeSide}`} open={step === 1 ? true : undefined} className="mt-4"><summary className="cursor-pointer text-sm underline">Show me where to look</summary>
          <figure className="mt-5 rounded-xl bg-stone-50 p-4">
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
            <figcaption className="text-center text-sm leading-6 text-gray-600">The yellow ring shows where to look. On your record, it’s the same color as the vinyl.</figcaption>
          </figure>
          <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-6 text-gray-700"><li>Tilt the record under a lamp until the markings catch the light.</li><li>Turn it slowly and check the entire ring. Markings can be in several separate places.</li><li>Take close-ups of every group. Zoom into each photo to check that the characters are readable.</li></ol>
          </details>
          {photoField("runout", `Add side ${activeSide} marking close-ups`, activeSide)}
          <details className="mt-5" open={evidence.runouts[activeSide]?.trim() ? true : undefined}><summary className="cursor-pointer text-sm font-medium underline">Prefer to type the markings? Use this instead of photos</summary>
            <label className="mt-3 block text-sm font-medium">Side {activeSide} markings<span className="mt-1 block font-normal leading-6 text-gray-600">Copy the whole ring, including symbols and crossed-out text. One group per line. Use ? if unreadable.</span><textarea rows={3} className={input} value={evidence.runouts[activeSide] ?? ""} onChange={e => update("runouts", { ...evidence.runouts, [activeSide]: e.target.value })} placeholder="Copy exactly what you see on this side" maxLength={3000} /></label>
          </details>
          <p className="mt-5 text-sm leading-6 text-gray-500">Hard to read? Save a draft and try different lighting later.</p>
        </section> : null}
        {step === reviewStep ? <>
        <details className={section}><summary className="cursor-pointer font-semibold">Extra photos & vinyl color (optional)</summary>
          <p className="mt-3 text-sm leading-6 text-gray-600">Skip this unless you have details to add. Jacket photos and stickers can help distinguish similar editions.</p>
          {!evidence.sealed ? <>{coverField("front")}{coverField("back")}</> : null}
          {photoField("extra", "Stickers, inserts, or other details")}
          <label className="mt-5 block text-sm font-medium">Vinyl color<input className={input} value={evidence.color} onChange={e => update("color", e.target.value)} placeholder="Black, clear, blue splatter…" maxLength={5000} /></label>
        </details>
        </> : null}
        {step === conditionStep ? <section className={section}>
          <p className="text-sm leading-6 text-gray-700">Optional: describe wear to help estimate your copy’s value.</p>
          <div className="mt-4 rounded-xl bg-stone-50 p-4 text-sm leading-6"><strong>Use your own words.</strong> No need to choose a grade. “Not sure” is fine.</div>
          <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6 text-gray-700">
            <li><strong>Disc:</strong> Check both sides for scratches or bending. Hold by the edges.</li>
            <li><strong>Sound:</strong> Any crackle, jumps (skips), or repeating? Haven’t played it? Say so.</li>
            <li><strong>Cardboard cover:</strong> Check corners and edges for tears, stains, writing, or splits.</li>
          </ol>
          <label className="mt-6 block text-sm font-medium">What did you notice? (optional)<span className="mt-1 block font-normal leading-6 text-gray-600">Use your own words. For more than one disc, say which disc and side has the problem.</span><textarea className={input} rows={4} value={evidence.conditionNotes} onChange={e => update("conditionNotes", e.target.value)} placeholder="Example: Disc 1 has a few light scratches. I haven’t played it. The cover has a bent corner and a small tear along the bottom." maxLength={5000} /></label>
          <label className="mt-5 block text-sm font-medium">How did you check it?<select className={input} value={evidence.gradingMethod} onChange={e => update("gradingMethod", e.target.value)}><option value="">Not checked</option><option value="visual">I looked at it, but did not play it</option><option value="partial">Played some of it</option><option value="full">I listened to every side all the way through</option><option value="sealed">Sealed — playback unknown</option></select></label>
          <details className="mt-6 rounded-xl border border-gray-200 p-4"><summary className="cursor-pointer font-medium">Choose a condition grade (optional)</summary>
            <p className="mt-3 text-sm leading-6 text-gray-600">“Good” means worn. Sealed does not mean Mint. Unsure? Leave the grade blank and describe the wear.</p>
            <div className="mt-5 space-y-5">
              <label className="block text-sm font-medium">Vinyl disc grade<select className={input} value={evidence.mediaGrade} onChange={e => update("mediaGrade", e.target.value)}><option value="">Not sure — let Baylor review my notes</option>{GRADES.map(g => <option key={g} value={g}>{g} — {gradeHelp[g].record}</option>)}</select></label>
              <label className="block text-sm font-medium">Cardboard cover grade<select className={input} value={evidence.sleeveGrade} onChange={e => update("sleeveGrade", e.target.value)}><option value="">Not sure — let Baylor review my notes</option>{GRADES.map(g => <option key={g} value={g}>{g} — {gradeHelp[g].cover}</option>)}<option value="Generic">Generic — a plain or standard company cover, not this album’s cover</option><option value="No cover">No cover — the cover is missing</option></select></label>
            </div>
            <a href="https://support.discogs.com/hc/en-us/articles/360001566193-How-To-Grade-Items" target="_blank" rel="noreferrer" className="mt-4 inline-block text-sm underline">Read the full Discogs grading guide ↗</a>
          </details>
          <label className="mt-5 block text-sm font-medium">What else is inside the cover? (optional)<span className="mt-1 block font-normal leading-6 text-gray-600">List any paper sleeves, posters, booklets, or lyric sheets. Don’t know what’s missing? Say “not sure.”</span><textarea className={input} rows={2} value={evidence.extras} onChange={e => update("extras", e.target.value)} placeholder="Example: Paper bag and lyric sheet included. Not sure if it came with a poster." maxLength={5000} /></label>
          <label className="mt-5 block text-sm font-medium">Anything else Baylor should know? (optional)<textarea className={input} rows={3} value={evidence.notes} onChange={e => update("notes", e.target.value)} placeholder="Different numbers on jacket and disc, retailer sticker, numbered edition, hard-to-read markings…" maxLength={5000} /></label>
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
        {error ? <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p> : null}
      </div>
    </form>
  </div>;
}
