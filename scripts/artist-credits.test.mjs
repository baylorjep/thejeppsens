import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getArtistBreakdown, getArtistCollectionStat, groupRecordsByArtist } from '../src/lib/vinylRecordUtils.ts';

let n = 0;
const rec = (artist, title = `Album ${++n}`, extra = {}) => ({ id: `r${++n}`, artist, title, genres: [], moods: [], status: 'owned', dateAdded: `2026-01-${String(n % 28 + 1).padStart(2, '0')}`, ...extra });

const sinatraShelf = () => [
  rec('Frank Sinatra'),
  rec('Frank Sinatra'),
  rec('Frank Sinatra & Antônio Carlos Jobim'),
  rec('Frank Sinatra, Nancy Sinatra, Tina Sinatra, Frank Sinatra Jr.'),
  rec('Tommy Dorsey and His Orchestra', 'Tommy Dorsey and His Orchestra Featuring Frank Sinatra'),
  rec('Hall & Oates'),
  rec('Various Artists'),
  rec('Various Artists'),
];

test('collabs, family credits and title-only features all count toward the artist', () => {
  const groups = groupRecordsByArtist(sinatraShelf());
  assert.equal(groups.get('Frank Sinatra').length, 5);
});

test('real act names containing & / and are not shredded', () => {
  const groups = groupRecordsByArtist(sinatraShelf());
  assert.equal(groups.get('Hall & Oates').length, 1);
  assert.equal(groups.has('Hall'), false);
});

test('catch-all "Various Artists" never ranks as an artist', () => {
  const breakdown = getArtistBreakdown(sinatraShelf());
  assert.equal(breakdown.some((item) => /^various/i.test(item.label)), false);
  assert.equal(breakdown[0].label, 'Frank Sinatra');
});

test('album-page stat, chart count and click-through list always agree', () => {
  const records = sinatraShelf();
  const chart = getArtistBreakdown(records).find((item) => item.label === 'Frank Sinatra').count;
  const list = groupRecordsByArtist(records).get('Frank Sinatra').length;
  assert.equal(chart, list);
  const positions = new Set();
  for (const record of groupRecordsByArtist(records).get('Frank Sinatra')) {
    const stat = getArtistCollectionStat(record, records);
    assert.equal(stat.artist, 'Frank Sinatra');
    assert.equal(stat.total, chart);
    positions.add(stat.position);
  }
  assert.equal(positions.size, chart);
});

// Guard: a new "how many records by X" spot that groups on the raw artist string
// silently disagrees with the rest of the site (Sinatra: 14 solo vs. 19 real).
test('no source file counts or groups records by the raw artist string', () => {
  const root = join(fileURLToPath(new URL('..', import.meta.url)), 'src');
  const banned = [
    /\[\s*\w+\.artist\s*\]/,
    /new Set\(\s*\w+\.map\(\s*\(?\s*\w+\s*\)?\s*=>\s*\w+\.artist\s*\)\s*\)/,
    /\.artist\s*===\s*artist\b/,
    /\.map\(\s*\(?\s*\w+\s*\)?\s*=>\s*\w+\.artist\s*\)\s*\)\s*\.(length|size)/,
    /(getBreakdown|getTopValue|uniqueSorted)\(\s*\w+\.map\(\s*\(?\s*\w+\s*\)?\s*=>\s*\w+\.artist\s*\)/,
  ];
  const offenders = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.(ts|tsx)$/.test(name) && !path.endsWith('vinylRecordUtils.ts')) {
        const text = readFileSync(path, 'utf8');
        for (const pattern of banned) if (pattern.test(text)) offenders.push(`${relative(root, path)} matches ${pattern}`);
      }
    }
  };
  walk(root);
  assert.deepEqual(offenders, [], 'Use groupRecordsByArtist / getArtistBreakdown from src/lib/vinylRecordUtils.ts instead.');
});
