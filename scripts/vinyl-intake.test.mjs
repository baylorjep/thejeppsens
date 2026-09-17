import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { emptyEvidence } from '../src/lib/pressingEvidence.ts';

const source = await readFile(new URL('../src/lib/vinylApi.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText.replace('"./pressingEvidence"', JSON.stringify(new URL('../src/lib/pressingEvidence.ts', import.meta.url).href));
const { saveVinylRecord } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const record = { id: 'test', title: 'Test', artist: 'Artist', coverImage: 'front.jpg', backCoverImage: 'back.jpg' };
const json = data => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });

test('saving a new album uploads marking photos separately and queues complete evidence', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    calls.push({ url, options });
    if (url === '/api/vinyl-records') {
      assert.deepEqual([...options.body.keys()], ['record']);
      return json({ record, source: 'supabase' });
    }
    if (!options.method) return json({ submission: null });
    if (options.method === 'POST') return json({ path: 'pressing/test/b.jpg', url: 'b.jpg' });
    const body = JSON.parse(options.body);
    assert.equal(body.submit, true);
    assert.equal(body.revision, null);
    assert.equal(body.evidence.photos[0].side, 'B');
    assert.equal(body.evidence.runouts.A, 'A-1');
    return json({ submission: { status: 'pending' } });
  });
  const result = await saveVinylRecord(record, undefined, undefined, { evidence: { ...emptyEvidence(), runouts: { A: 'A-1' } }, files: [{ side: 'B', file: new File(['image'], 'b.jpg', { type: 'image/jpeg' }) }] });
  assert.equal(result.pressingStatus, 'pending');
  assert.equal(calls.length, 4);
});

test('incomplete matrices create a draft, not a pending review', async t => {
  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    if (url === '/api/vinyl-records') return json({ record, source: 'supabase' });
    if (!options.method) return json({ submission: null });
    assert.equal(JSON.parse(options.body).submit, false);
    return json({ submission: { status: 'draft' } });
  });
  const result = await saveVinylRecord(record, undefined, undefined, { evidence: emptyEvidence(), files: [] });
  assert.equal(result.pressingStatus, 'draft');
});

test('upload failure reports partial success without mutating the supplied evidence', async t => {
  const evidence = emptyEvidence();
  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    if (url === '/api/vinyl-records') return json({ record, source: 'supabase' });
    if (!options.method) return json({ submission: null });
    throw new Error('Disconnected');
  });
  const result = await saveVinylRecord(record, undefined, undefined, { evidence, files: [{ side: 'A', file: new File(['image'], 'a.jpg') }] });
  assert.match(result.pressingError, /Album saved.*Disconnected/);
  assert.deepEqual(evidence.photos, []);
  assert.equal(result.pressingStatus, undefined);
});

test('retry does not overwrite an existing submission after a lost response', async t => {
  let writes = 0;
  t.mock.method(globalThis, 'fetch', async (url, options = {}) => {
    if (url === '/api/vinyl-records') return json({ record, source: 'supabase' });
    if (options.method) writes++;
    return json({ submission: { status: 'pending' } });
  });
  const result = await saveVinylRecord(record, undefined, undefined, { evidence: emptyEvidence(), files: [] });
  assert.equal(result.pressingStatus, 'pending');
  assert.equal(writes, 0);
});

test('offline album save does not claim identification was saved', async t => {
  t.mock.method(globalThis, 'fetch', async () => json({ record, source: 'local' }));
  const result = await saveVinylRecord(record, undefined, undefined, { evidence: emptyEvidence(), files: [] });
  assert.match(result.pressingError, /not saved yet/);
  assert.equal(result.pressingStatus, undefined);
});
