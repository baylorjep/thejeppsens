import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyEvidence } from '../src/lib/pressingEvidence.ts';
import { matchPressing, compareRelease } from '../src/lib/pressingMatcher.ts';
const album = { title: 'Album', artist: 'Artist' };
const evidence = () => ({ ...emptyEvidence(), runouts: { A: '123 A MASTER 1', B: '123 B MASTER 1' } });
const release = (id = 1) => ({ id, title: 'Album', artists: [{ name: 'Artist' }], year: 2020, formats: [{ name: 'Vinyl', qty: '1', descriptions: ['LP'] }], identifiers: [{ type: 'Matrix / Runout', description: 'Side A runout', value: '123 A MASTER 1' }, { type: 'Matrix / Runout', description: 'Side B runout', value: '123 B MASTER 1' }] });

test('one complete all-side match confirms; only whitespace and case are ignored', () => {
  const e = evidence(); e.runouts.A = '  123   a master 1 ';
  assert.equal(matchPressing(e, album, [release()], true).kind, 'confirmed');
  e.runouts.A += ' LABS';
  assert.notEqual(matchPressing(e, album, [release()], true).kind, 'confirmed');
  e.runouts.A = '123 A MASTER 11';
  assert.notEqual(matchPressing(e, album, [release()], true).kind, 'confirmed');
});
test('incomplete search, partial matrices, uncertain characters and sealed copies cannot confirm', () => {
  assert.equal(matchPressing(evidence(), album, [release()], false).kind, 'review');
  for (const e of [{ ...evidence(), sealed: true }, { ...evidence(), runouts: { A: '123 A MASTER 1' } }, { ...evidence(), runouts: { A: '?', B: '?' } }]) assert.equal(matchPressing(e, album, [release()], true).kind, 'review');
});
test('unknown competitor blocks even an exact match', () => {
  const competitor = { ...release(2), identifiers: [] };
  assert.equal(matchPressing(evidence(), album, [release(), competitor], true).kind, 'ambiguous');
  competitor.identifiers = release(2).identifiers.map(i => ({ ...i, value: i.value + ' X' }));
  assert.equal(matchPressing(evidence(), album, [release(), competitor], true).kind, 'confirmed');
});
test('two exact releases remain ambiguous', () => {
  assert.equal(matchPressing(evidence(), album, [release(1), release(2)], true).kind, 'ambiguous');
});
test('never mix sides from separate matrix variants', () => {
  const r = release();
  r.identifiers = [
    ...release().identifiers.map(i => ({ ...i, description: i.description + ', variant 1', value: i.value + (i.description.includes('B') ? ' X' : '') })),
    ...release().identifiers.map(i => ({ ...i, description: i.description + ', variant 2', value: i.value + (i.description.includes('A') ? ' X' : '') })),
  ];
  assert.equal(compareRelease(evidence(), r), 'different');
});
test('unlabelled or fragmentary identifiers do not get assigned to sides by guessing', () => {
  const r = release(); delete r.identifiers[0].description;
  assert.equal(compareRelease(evidence(), r), 'unknown');
  r.identifiers = [...release().identifiers, release().identifiers[0]];
  assert.equal(compareRelease(evidence(), r), 'unknown');
});
test('conflicting barcode, color, catalog, artist, or disc count cannot confirm', () => {
  assert.equal(compareRelease({ ...evidence(), barcode: '012345678901' }, release()), 'unknown');
  assert.equal(compareRelease({ ...evidence(), color: 'Blue' }, release()), 'unknown');
  assert.equal(compareRelease({ ...evidence(), catalogNumber: 'ABC' }, release()), 'unknown');
  assert.notEqual(matchPressing(evidence(), { ...album, artist: 'Someone else' }, [release()], true).kind, 'confirmed');
  assert.equal(compareRelease({ ...evidence(), discCount: 2 }, release()), 'different');
});
test('limited edition qualifiers cannot silently confirm from matching matrices', () => {
  const r = release(); r.formats[0].descriptions.push('Limited Edition');
  assert.equal(compareRelease(evidence(), r), 'unknown');
});
