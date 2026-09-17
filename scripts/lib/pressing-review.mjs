export function validateDecision(decision) {
  if (!decision || typeof decision.recordId !== 'string' || !decision.recordId || !/^[0-9a-f-]{36}$/.test(decision.revision ?? '')) throw new Error('Each decision needs recordId and the exported revision.');
  if (!['confirmed', 'needs_info', 'no_match'].includes(decision.status)) throw new Error(`${decision.recordId}: choose confirmed, needs_info, or no_match.`);
  if (typeof decision.notes !== 'string' || decision.notes.trim().length < 10 || decision.notes.length > 10000) throw new Error(`${decision.recordId}: explain the evidence or the specific follow-up needed.`);
  if (decision.status === 'confirmed' && (!Number.isSafeInteger(decision.releaseId) || decision.releaseId < 1 || decision.physicalEvidenceConfirmed !== true)) throw new Error(`${decision.recordId}: confirmation requires a release ID and physicalEvidenceConfirmed: true.`);
}
export function releaseMetadata(release) {
  if (!release.formats?.some(f => f.name === 'Vinyl')) throw new Error('The selected Discogs release is not vinyl.');
  // Null clears stale guesses. Original album year and personal metadata are preserved.
  return {
    pressingYear: release.year > 0 ? release.year : null,
    label: release.labels?.map(l => l.name).join(' / ') || null,
    catalogNumber: release.labels?.map(l => l.catno).filter(Boolean).join(' / ') || null,
    country: release.country || null,
    format: release.formats.filter(f => f.name === 'Vinyl').map(f => [f.qty, f.name, ...(f.descriptions ?? [])].filter(Boolean).join(', ')).join(' / '),
    discCount: release.formats.filter(f => f.name === 'Vinyl').reduce((n, f) => n + (Number(f.qty) || 1), 0),
    pressingNotes: release.notes || null,
  };
}
