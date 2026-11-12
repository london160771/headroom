// THESIS.md must be exactly what lib/thesis.js renders from the committed page data,
// so every number in it comes from evidence/ and none is typed in.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { renderThesis, withFindings } from '../lib/thesis.js';

const ROOT = path.resolve(import.meta.dirname, '..');

test('THESIS.md matches the page data (run npm run thesis after npm run data)', () => {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'web', 'public', 'data', 'headroom.json'), 'utf8'));
  assert.equal(fs.readFileSync(path.join(ROOT, 'THESIS.md'), 'utf8'), renderThesis(d));
});

test('THESIS.md has the four sections the track asks for', () => {
  const t = fs.readFileSync(path.join(ROOT, 'THESIS.md'), 'utf8');
  for (const h of ['## Claim', '## Evidence for', '## Evidence against', '## What would change my mind']) assert.ok(t.includes(h), h);
});

test('README findings table matches the page data', () => {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'web', 'public', 'data', 'headroom.json'), 'utf8'));
  const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');
  assert.equal(readme, withFindings(readme, d));
});
