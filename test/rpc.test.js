// Tests for the RPC client, block locating and the evidence check, against a MOCK fetch
// (no network). The mock chain below is made up for the tests.
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { toRecord } from '../lib/block.js';
import { blockAt } from '../lib/locate.js';
import { blockFrom, rpc } from '../lib/rpc.js';
import { diffRecord } from '../lib/verify.js';

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

// Mock chain: heights 1000..1999, one block per 600 ms from t=0, height 1500 skipped.
const MS0 = Date.UTC(2026, 0, 1);
const mockBlock = (h) => ({
  header: { height: h, block_ordinal: h, timestamp: String(BigInt(MS0 + (h - 1000) * 600) * 1_000_000n), gas_price: '100000000', total_supply: '1', prev_hash: 'x' },
  chunks: [{ shard_id: 0, height_included: h, gas_used: '1000000000', gas_limit: '1000000000000000', balance_burnt: '0' }],
});
function mockFetch({ fail = 0 } = {}) {
  let calls = 0;
  globalThis.fetch = async (_url, init) => {
    calls++;
    if (calls <= fail) return { status: 429, json: async () => ({}) };
    const { params } = JSON.parse(init.body);
    const h = params.block_id;
    if (h === 1500 || h < 1000 || h > 1999) return { status: 200, json: async () => ({ error: { cause: { name: 'UNKNOWN_BLOCK' } } }) };
    return { status: 200, json: async () => ({ result: mockBlock(h) }) };
  };
  return () => calls;
}

test('rpc returns null for a skipped height (UNKNOWN_BLOCK is normal, not an error)', async () => {
  mockFetch();
  assert.equal(await rpc('block', { block_id: 1500 }, { rpcs: ['mock'] }), null);
});

test('rpc retries after HTTP 429 and then succeeds', async () => {
  const calls = mockFetch({ fail: 1 });
  const b = await rpc('block', { block_id: 1200 }, { rpcs: ['mock'] });
  assert.equal(b.header.height, 1200);
  assert.equal(calls(), 2);
});

test('blockFrom moves past a skipped height to the next real block', async () => {
  mockFetch();
  assert.equal((await blockFrom(1500, { rpcs: ['mock'] })).header.height, 1501);
});

test('blockAt corrects a coarse anchor table to within 60 s of the time asked', async () => {
  mockFetch();
  // Anchors claim 1 s per block; the mock chain runs at 0.6 s, so interpolation lands far off.
  const table = [[1000, MS0], [1600, MS0 + 600_000]];
  const want = MS0 + 300 * 600; // height 1300
  const b = await blockAt(want, table);
  const ms = Number(BigInt(b.header.timestamp) / 1_000_000n);
  assert.ok(Math.abs(ms - want) < 60_000, `off by ${ms - want} ms`);
  assert.notEqual(b.header.height, 1180); // plain interpolation would stop 72 s early
});

test('the evidence check flags a tampered stored row, field by field', () => {
  const chain = toRecord(mockBlock(1200));
  assert.deepEqual(diffRecord(chain, structuredClone(chain)), []);
  const tampered = { ...structuredClone(chain), used: [999] };
  assert.deepEqual(diffRecord(chain, tampered), ['used']);
});
