import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyEvidence, missingEvidence, validateEvidence, sidesFor } from '../src/lib/pressingEvidence.ts';
import { normalizeConditionToDiscogsGrade } from '../src/lib/discogsServer.ts';
import { releaseMetadata, validateDecision } from './lib/pressing-review.mjs';
const photo = (kind, side) => ({ kind, side, path: 'test.jpg', url: 'https://example.com/test.jpg' });

test('typed catalog and every side runout are sufficient; condition optional', () => {
  const e = { ...emptyEvidence(), catalogNumber: 'ST-1234', runouts: { A: 'A-1', B: 'B-1' } };
  validateEvidence(e); assert.deepEqual(missingEvidence(e), []);
  e.discCount = 2; assert.equal(missingEvidence(e).length, 2);
  e.runouts.C = 'C-1'; e.runouts.D = 'D-1'; assert.deepEqual(missingEvidence(e), []);
});
test('photo-only submission requires labels and runouts for both sides', () => {
  const e = emptyEvidence();
  e.photos = [photo('label', 'A'), photo('runout', 'A'), photo('label', 'B')];
  assert.equal(missingEvidence(e).length, 1);
  e.photos.push(photo('runout', 'B')); assert.deepEqual(missingEvidence(e), []);
});
test('sealed path needs exterior evidence, not hidden runouts', () => {
  const e = { ...emptyEvidence(), sealed: true, barcode: '001234' };
  assert.equal(missingEvidence(e).length, 2);
  e.photos = [photo('front'), photo('back')]; assert.deepEqual(missingEvidence(e), []);
});
test('malformed submissions and nonstandard grades fail validation', () => {
  for (const patch of [{ discCount: 0 }, { discCount: 1.5 }, { discCount: 100 }, { photos: [{}] }, { runouts: [] }, { mediaGrade: 'new' }, { sleeveGrade: 'nice' }]) {
    assert.throws(() => validateEvidence({ ...emptyEvidence(), ...patch }));
  }
  assert.deepEqual(sidesFor(2), ['A','B','C','D']);
});
test('new, sealed, blank and unknown never become assumed grades', () => {
  for (const condition of [undefined, '', 'Unknown', 'new', 'sealed', 'used']) assert.deepEqual(normalizeConditionToDiscogsGrade(condition), { grade: 'Unknown', isGuess: true });
  assert.equal(normalizeConditionToDiscogsGrade('VG+').grade, 'Very Good Plus (VG+)');
  assert.equal(normalizeConditionToDiscogsGrade('Near Mint (NM or M-)').grade, 'Near Mint (NM or M-)');
});
test('confirmation requires explicit physical evidence and useful review notes', () => {
  const d = { recordId: 'test', revision: '12345678-1234-1234-1234-123456789abc', status: 'confirmed', releaseId: 123, notes: 'Both sides and label design match.' };
  assert.throws(() => validateDecision(d));
  validateDecision({ ...d, physicalEvidenceConfirmed: true });
  validateDecision({ ...d, status: 'needs_info', notes: 'Please photograph the side B label.' });
});
test('Discogs metadata clears unknown pressing date and preserves album/personal fields', () => {
  const m = releaseMetadata({ year: 0, formats: [{ name: 'Vinyl', qty: '2', descriptions: ['LP'] }], labels: [{ name: 'Capitol', catno: '123' }] });
  assert.equal(m.pressingYear, null); assert.equal(m.discCount, 2);
  assert.equal(m.catalogNumber, '123'); assert.equal(m.releaseYear, undefined); assert.equal(m.notes, undefined);
  assert.throws(() => releaseMetadata({ formats: [{ name: 'CD' }] }));
});


test('sealed submissions reuse saved covers and require only missing views', () => {
  const e = { ...emptyEvidence(), sealed: true, barcode: '001234' };
  assert.deepEqual(missingEvidence(e, { coverImage: 'front.jpg', backCoverImage: 'back.jpg' }), []);
  assert.deepEqual(missingEvidence(e, { coverImage: 'front.jpg' }), ['Back-cover photo']);
  e.photos = [photo('back')];
  assert.deepEqual(missingEvidence(e, { coverImage: 'front.jpg' }), []);
  assert.deepEqual(missingEvidence(e, { coverImage: '   ' }), ['Front-cover photo']);
  e.barcode = '';
  assert.deepEqual(missingEvidence(e, { coverImage: 'front.jpg' }), []);
});

test('saved covers replace label requirements but never replace runouts', () => {
  const e = emptyEvidence();
  assert.equal(missingEvidence(e, { coverImage: 'front.jpg', backCoverImage: 'back.jpg' }).length, 2);
  e.runouts = { A: 'A-1', B: 'B-1' };
  assert.deepEqual(missingEvidence(e, { coverImage: 'front.jpg', backCoverImage: 'back.jpg' }), []);
  assert.equal(missingEvidence(e, { coverImage: 'front.jpg' }).length, 2);
});


test('new-record intake is ready with covers and every side, including mixed photos and text', () => {
  const e = { ...emptyEvidence(), discCount: 2, runouts: { A: 'A1', B: 'B1', C: 'C1' } };
  const covers = { coverImage: 'front.jpg', backCoverImage: 'back.jpg' };
  assert.equal(missingEvidence(e, covers).length, 1);
  e.photos = [photo('runout', 'D')];
  validateEvidence(e);
  assert.deepEqual(missingEvidence(e, covers), []);
  e.discCount = 3;
  assert.equal(missingEvidence(e, covers).length, 2);
});
