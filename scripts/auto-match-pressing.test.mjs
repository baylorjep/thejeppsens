import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { emptyEvidence } from '../src/lib/pressingEvidence.ts';
const source = await readFile(new URL('../src/lib/autoMatchPressing.ts', import.meta.url), 'utf8');
const stub = 'data:text/javascript,' + encodeURIComponent('export async function fetchPressingCandidates(){throw new Error("Use injected lookup")}');
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace('"./discogsServer"', JSON.stringify(stub)).replace('"./pressingMatcher"', JSON.stringify(new URL('../src/lib/pressingMatcher.ts', import.meta.url).href));
const { autoMatchPressing } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const album = { title: 'Album', artist: 'Artist' };
const submission = { record_id: 'album', revision: 'original', status: 'pending', evidence: { ...emptyEvidence(), runouts: { A: 'A1', B: 'B1' } } };
const release = { id: 1, title: 'Album', artists: [{ name: 'Artist' }], formats: [{ name: 'Vinyl', qty: '1' }], identifiers: [{ type: 'Matrix / Runout', description: 'Side A', value: 'A1' }, { type: 'Matrix / Runout', description: 'Side B', value: 'B1' }] };
function database({ stale = false } = {}) {
  const updates = []; const rpcs = []; const filters = [];
  const latest = { ...submission, revision: 'newer', status: 'draft' };
  const chain = { update(value) { updates.push(value); return this; }, eq(key, value) { filters.push([key, value]); return this; }, select() { return this; }, async maybeSingle() { return { data: stale ? latest : { ...submission, ...updates.at(-1) }, error: null }; } };
  return { updates, rpcs, filters, from() { return chain; }, async rpc(fn, args) { rpcs.push({ fn, args }); return stale ? { error: new Error('Changed') } : { data: { ...submission, status: 'confirmed', release_id: args.p_release_id, revision: 'confirmed-revision' } }; } };
}
test('unambiguous match uses atomic RPC with the submitted revision', async () => {
  const db = database();
  const saved = await autoMatchPressing(db, album, submission, async () => ({ releases: [release], complete: true }));
  assert.equal(saved.status, 'confirmed');
  assert.equal(db.rpcs[0].args.p_revision, 'original');
  assert.equal(db.rpcs[0].args.p_release_id, 1);
  assert.equal(db.updates.length, 0);
});
test('Discogs failure keeps evidence pending and writes a revision-guarded explanation', async () => {
  const db = database();
  const saved = await autoMatchPressing(db, album, submission, async () => { throw new Error('429'); });
  assert.equal(saved.status, 'pending');
  assert.match(saved.review_notes, /unavailable/);
  assert.ok(db.filters.some(([k,v]) => k === 'revision' && v === 'original'));
  assert.ok(db.filters.some(([k,v]) => k === 'status' && v === 'pending'));
  assert.equal(db.rpcs.length, 0);
  assert.equal(db.updates[0].evidence, undefined);
});
test('a newer edit wins over an automatic confirmation in flight', async () => {
  const db = database({ stale: true });
  const saved = await autoMatchPressing(db, album, submission, async () => ({ releases: [release], complete: true }));
  assert.equal(saved.revision, 'newer');
  assert.equal(saved.status, 'draft');
  assert.equal(db.updates.length, 0);
});
test('photo-only submissions skip Discogs text lookup and stay pending', async () => {
  const db = database();
  const saved = await autoMatchPressing(db, album, { ...submission, evidence: emptyEvidence() }, async () => { assert.fail('must not fetch'); });
  assert.match(saved.review_notes, /photos/);
  assert.equal(db.rpcs.length, 0);
});
