export const GRADES = ["Mint (M)", "Near Mint (NM or M-)", "Very Good Plus (VG+)", "Very Good (VG)", "Good Plus (G+)", "Good (G)", "Fair (F)", "Poor (P)"] as const;
export type EvidencePhoto = { path: string; url: string; kind: string; side?: string };
export type PressingEvidence = {
  catalogNumber: string;
  barcode: string;
  discCount: number;
  sealed: boolean;
  color: string;
  runouts: Record<string, string>;
  photos: EvidencePhoto[];
  mediaGrade: string;
  sleeveGrade: string;
  gradingMethod: string;
  conditionNotes: string;
  extras: string;
  notes: string;
};
export type PressingSubmission = {
  record_id: string;
  revision: string;
  status: "draft" | "pending" | "needs_info" | "confirmed" | "no_match";
  evidence: PressingEvidence;
  review_notes: string | null;
  release_id: number | null;
  updated_at: string;
  processed_at: string | null;
};
export const STATUS_LABELS = { draft: "Draft", pending: "Waiting for Baylor", needs_info: "More details needed", confirmed: "Pressing confirmed", no_match: "No exact match found" };
export function sidesFor(discs: number) {
  return Array.from({ length: discs * 2 }, (_, i) => String.fromCharCode(65 + i));
}
export function emptyEvidence(): PressingEvidence {
  return { catalogNumber: "", barcode: "", discCount: 1, sealed: false, color: "", runouts: {}, photos: [], mediaGrade: "", sleeveGrade: "", gradingMethod: "", conditionNotes: "", extras: "", notes: "" };
}
export function missingEvidence(e: PressingEvidence): string[] {
  const photo = (kind: string, side?: string) => e.photos.some(p => p.kind === kind && (!side || p.side === side));
  if (e.sealed) return [!photo("front") && "Front-cover photo", !photo("back") && "Back-cover photo", !(e.catalogNumber.trim() || e.barcode.trim()) && "Catalog number or barcode from the packaging"].filter(Boolean) as string[];
  const sides = sidesFor(e.discCount);
  return [
    ...(!e.catalogNumber.trim() ? sides.filter(s => !photo("label", s)).map(s => `Side ${s}: photo of the paper center label (or enter the catalog number)`) : []),
    ...sides.filter(s => !e.runouts[s]?.trim() && !photo("runout", s)).map(s => `Side ${s}: close-ups of the tiny markings near the center label, or type those markings`),
  ];
}
// The same validation is used by the server, UI, and terminal export.
export function validateEvidence(value: unknown): asserts value is PressingEvidence {
  if (!value || typeof value !== "object") throw new Error("Missing pressing evidence.");
  const e = value as PressingEvidence;
  for (const key of ["catalogNumber", "barcode", "color", "mediaGrade", "sleeveGrade", "gradingMethod", "conditionNotes", "extras", "notes"] as const) {
    if (typeof e[key] !== "string" || e[key].length > 5000) throw new Error(`Invalid ${key}.`);
  }
  if (!Number.isInteger(e.discCount) || e.discCount < 1 || e.discCount > 10 || typeof e.sealed !== "boolean") throw new Error("Choose between 1 and 10 discs.");
  if (!e.runouts || typeof e.runouts !== "object" || Array.isArray(e.runouts) || Object.entries(e.runouts).some(([k, v]) => !/^[A-T]$/.test(k) || typeof v !== "string" || v.length > 3000)) throw new Error("Invalid runout text.");
  if (!Array.isArray(e.photos) || e.photos.length > 60 || e.photos.some(p => !p || typeof p.path !== "string" || typeof p.url !== "string" || !["label", "runout", "front", "back", "extra"].includes(p.kind) || (["label", "runout"].includes(p.kind) && !/^[A-T]$/.test(p.side ?? "")))) throw new Error("Invalid evidence photos.");
  if (e.mediaGrade && !(GRADES as readonly string[]).includes(e.mediaGrade)) throw new Error("Choose a media grade from the list.");
  if (e.sleeveGrade && ![...GRADES, "Generic", "No cover"].includes(e.sleeveGrade)) throw new Error("Choose a sleeve grade from the list.");
  if (!["", "visual", "partial", "full", "sealed"].includes(e.gradingMethod)) throw new Error("Invalid grading method.");
}
