// Tests for `npm run verify`: the independent recompute, the manifest and the NEAR proof readers.
// The NEAR responses below come from a MOCK fetch (no network) and are made up for the tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { afterEach, test } from 'node:test';
import { compare, published, recompute } from '../lib/independent.js';
import { MANIFEST, manifestMismatches, manifestText } from '../lib/manifest.js';
import { anchorTx, viewAnchor } from '../lib/nearproof.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const jsonl = (f) => read(f).split('\n').filter(Boolean).map((l) => JSON.parse(l));
const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

test('the independent recompute agrees with every published headline number', () => {
  const mine = recompute({
    rows: jsonl('evidence/samples.jsonl'),
    dense: jsonl('evidence/dense-30d.jsonl'),
    protocol: JSON.parse(read('evidence/protocol.json')),
    scenarios: JSON.parse(read('evidence/scenarios.json')),
  });
  const rows = compare(mine, published(JSON.parse(read('web/public/data/headroom.json'))));
  assert.equal(rows.length, 15);
  assert.deepEqual(rows.filter((r) => !r.ok), []);
});

test('compare flags a number that differs by more than float rounding', () => {
  const [r] = compare({ use: 0.0066 }, { use: 0.0067 });
  assert.equal(r.ok, false);
  assert.equal(compare({ use: 0.1 + 0.2 }, { use: 0.3 })[0].ok, true);
});

test('the committed manifest lists the current files and every hash matches', () => {
  assert.equal(read(MANIFEST), manifestText(ROOT));
  assert.deepEqual(manifestMismatches(ROOT).filter((m) => !m.ok), []);
});

const H = '8229c89e7f27f92f8e59b2c6aa6d2e8747a8d5917839579f793df4f5a4b2c933';
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64');

test('viewAnchor decodes the contract view result (mock RPC)', async () => {
  const stored = { sha256: H, label: 'mock', block_height: 7, timestamp_ms: 1 };
  globalThis.fetch = async (_u, init) => {
    const { params } = JSON.parse(init.body);
    assert.equal(params.method_name, 'get');
    assert.deepEqual(JSON.parse(Buffer.from(params.args_base64, 'base64')), { sha256: H });
    return { status: 200, json: async () => ({ result: { result: [...Buffer.from(JSON.stringify(stored))] } }) };
  };
  assert.deepEqual(await viewAnchor('mock-anchor.near', H, { rpcs: ['mock'], tries: 1 }), stored);
});

test('anchorTx reads the hash out of the original transaction (mock RPC)', async () => {
  globalThis.fetch = async () => ({
    status: 200,
    json: async () => ({ result: {
      status: { SuccessValue: '' },
      transaction: { receiver_id: 'mock-anchor.near', actions: [{ FunctionCall: { method_name: 'anchor', args: b64({ sha256: H, label: 'x' }) } }] },
    } }),
  });
  assert.deepEqual(await anchorTx('mock-anchor.near', 'TX', { rpcs: ['mock'], tries: 1 }), { receiver: 'mock-anchor.near', method: 'anchor', sha256: H, succeeded: true });
});
