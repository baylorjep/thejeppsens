import type { PressingEvidence } from "./pressingEvidence";

export type MatchRelease = {
  id: number; title: string; artists?: { name: string }[]; year?: number; country?: string;
  identifiers?: { type: string; value: string; description?: string }[];
  formats?: { name: string; qty?: string; descriptions?: string[]; text?: string }[];
  labels?: { name: string; catno?: string }[]; notes?: string;
};
export type MatchDecision = { kind: "confirmed" | "review" | "ambiguous"; notes: string; release?: MatchRelease };
// Only presentation differences are ignored. Never drop words, symbols, or digits.
export const normalizeRunout = (value: string) => value.normalize("NFC").toLowerCase().replace(/\s+/g, " ").trim();
const barcode = (value: string) => value.replace(/[\s-]/g, "");
const name = (value: string) => value.toLowerCase().replace(/\s+/g, " ").trim();
export function canMatchText(e: PressingEvidence) {
  return !e.sealed && Array.from({ length: e.discCount * 2 }, (_, i) => e.runouts[String.fromCharCode(65 + i)]).every(v => v?.trim() && !v.includes("?"));
}

export function compareRelease(e: PressingEvidence, release: MatchRelease): "exact" | "different" | "unknown" {
  const vinyl = release.formats?.filter(f => f.name === "Vinyl") ?? [];
  if (!vinyl.length || vinyl.some(f => !f.qty || !Number.isInteger(Number(f.qty)) || Number(f.qty) < 1)) return "unknown";
  if (vinyl.reduce((n, f) => n + Number(f.qty), 0) !== e.discCount) return "different";
  if (!canMatchText(e)) return "unknown";
  const groups = new Map<string, Map<string, string[]>>();
  for (const identifier of release.identifiers ?? []) {
    if (identifier.type !== "Matrix / Runout") continue;
    const description = identifier.description ?? "";
    const sideMatch = /\bside\s+([a-t]|\d{1,2})\b/i.exec(description);
    if (!sideMatch) return "unknown"; // Unlabelled runouts cannot be assigned to sides safely.
    const side = /^\d+$/.test(sideMatch[1]) ? String.fromCharCode(64 + Number(sideMatch[1])) : sideMatch[1].toUpperCase();
    const variant = /\bvariant\s+([a-z0-9]+)\b/i.exec(description)?.[1]?.toLowerCase() ?? "default";
    const group = groups.get(variant) ?? new Map<string, string[]>();
    group.set(side, [...(group.get(side) ?? []), normalizeRunout(identifier.value)]);
    groups.set(variant, group);
  }
  const sides = Array.from({ length: e.discCount * 2 }, (_, i) => String.fromCharCode(65 + i));
  let incomplete = groups.size === 0;
  let exact = false;
  for (const group of groups.values()) {
    // Multiple fragments for a side need a person; never assemble or mix variants.
    if (group.size !== sides.length || sides.some(s => group.get(s)?.length !== 1)) { incomplete = true; continue; }
    if (sides.every(s => group.get(s)![0] === normalizeRunout(e.runouts[s]))) exact = true;
  }
  if (!exact) return incomplete ? "unknown" : "different";
  if (e.catalogNumber.trim() && !release.labels?.some(l => normalizeRunout(l.catno ?? "") === normalizeRunout(e.catalogNumber))) return "unknown";
  const inputBarcode = barcode(e.barcode);
  const barcodes = (release.identifiers ?? []).filter(i => i.type === "Barcode").map(i => barcode(i.value));
  if (inputBarcode && (!/^\d{8,14}$/.test(inputBarcode) || !barcodes.includes(inputBarcode))) return "unknown";
  const simpleColors = new Set(["black", "blue", "red", "clear", "white", "green", "yellow", "orange", "purple", "pink"]);
  const declaredColors = vinyl.map(f => name(f.text ?? "")).filter(c => simpleColors.has(c));
  if (simpleColors.has(name(e.color)) && declaredColors.length && declaredColors.every(c => c !== name(e.color))) return "different";
  // A matrix can be reused for a colored/limited edition. Require explicit evidence
  // for any format qualifier, even if only one candidate was returned.
  const qualifiers = vinyl.flatMap(f => [f.text ?? "", ...(f.descriptions ?? []).filter(d => /limited|numbered|picture|test pressing|promo/i.test(d))]).filter(Boolean);
  if (qualifiers.some(q => !/^(?:180\s*(?:g|gram)|200\s*(?:g|gram))$/i.test(q.trim()))) {
    if (!e.color.trim() || !qualifiers.every(q => name(q) === name(e.color))) return "unknown";
  }
  if (e.color.trim() && name(e.color) !== "black" && !qualifiers.some(q => name(q) === name(e.color))) return "unknown";
  return "exact";
}

export function matchPressing(e: PressingEvidence, album: { title: string; artist: string }, releases: MatchRelease[], complete: boolean): MatchDecision {
  if (!canMatchText(e)) return { kind: "review", notes: "Saved for Baylor: photos, sealed copies, or unreadable codes need a person to review them." };
  if (!complete) return { kind: "review", notes: "Saved for Baylor: the Discogs search could not be checked completely. No automatic match was confirmed." };
  const checked = releases.map(release => ({ release, result: name(release.title) === name(album.title) && release.artists?.some(a => name(a.name.replace(/ \(\d+\)$/, "")) === name(album.artist)) ? compareRelease(e, release) : "unknown" }));
  const exact = checked.filter(c => c.result === "exact");
  const possible = checked.filter(c => c.result !== "different");
  // Rank suggestions separately from the exact-match decision. Similarity can
  // suggest a listing for review, but can never authorize confirmation.
  const similarity = (release: MatchRelease) => Object.values(e.runouts).reduce((score, value) => {
    const tokens = new Set(normalizeRunout(value).split(" "));
    return score + Math.max(0, ...(release.identifiers ?? []).filter(i => i.type === "Matrix / Runout").map(i => {
      const other = new Set(normalizeRunout(i.value).split(" "));
      return [...tokens].filter(t => other.has(t)).length / new Set([...tokens, ...other]).size;
    }));
  }, 0);
  const ranked = releases.map(release => ({ release, score: similarity(release) })).filter(c => c.score > 0).sort((a, b) => b.score - a.score || a.release.id - b.release.id);
  const candidates = ranked.slice(0, 3).map(c => `Discogs #${c.release.id}${c.release.year ? ` (${c.release.year})` : ""}`).join(", ");
  if (exact.length === 1 && possible.length === 1) {
    return { kind: "confirmed", release: exact[0].release, notes: `Automatically matched every side's complete typed matrix to Discogs #${exact[0].release.id}. Only spacing and letter case were normalized. All ${releases.length} returned vinyl candidates were checked; no competing or incomplete candidate remained. This confirms the database match, not condition or value.` };
  }
  if (possible.length > 1 && exact.length) return { kind: "ambiguous", notes: `More than one edition remains possible. Closest text candidates (not confirmed): ${candidates}. What color is the vinyl, and are there any edition stickers? Add those details or a label photo and submit again. Baylor can review this saved submission.` };
  return { kind: "review", notes: `${exact.length ? "Strong matrix match, but other edition details need checking." : "No unique complete text match."}${candidates ? ` Closest text candidates (not confirmed): ${candidates}.` : ""} Your codes are saved for Baylor; no need to retype them. Extra words, symbols, missing Discogs entries, or incomplete identifiers need review.` };
}

export function matchedMetadata(release: MatchRelease) {
  const vinyl = release.formats!.filter(f => f.name === "Vinyl");
  return { pressingYear: release.year && release.year > 0 ? release.year : null, label: release.labels?.map(l => l.name).join(" / ") || null, catalogNumber: release.labels?.map(l => l.catno).filter(Boolean).join(" / ") || null, country: release.country || null, format: vinyl.map(f => [f.qty, f.name, ...(f.descriptions ?? [])].join(", ")).join(" / "), discCount: vinyl.reduce((n, f) => n + Number(f.qty), 0), pressingNotes: release.notes || null };
}
