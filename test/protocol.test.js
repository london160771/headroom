// Tests for lib/protocol.js (the bisection that found NEAR's burn-rule change), against a
// FIXTURE chain of protocol configs made up for the tests (no network).
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { burnShare, findChange } from '../lib/protocol.js';

const OLD = [3, 10];
const NEW = [0, 1];
const chain = ({ changeAt, missing = new Set(), tip = 50_000 }) => {
  const calls = [];
  const config = async (h) => {
    calls.push(h);
    if (h > tip || missing.has(h)) throw new Error('UNKNOWN_BLOCK');
    return { burnt_gas_reward: h >= changeAt ? NEW : OLD };
  };
  return { config, calls, tip };
};
const pick = (c) => c.burnt_gas_reward;

test('findChange finds the exact first block with the new value', async () => {
  const c = chain({ changeAt: 37_123 });
  const r = await findChange({ config: c.config, tipHeight: c.tip, pick, step: 5_000 });
  assert.deepEqual(r, { from: OLD, to: NEW, firstHeight: 37_123 });
  assert.ok(c.calls.length < 40, `${c.calls.length} calls`);
});

test('findChange returns null when the value never changed in range', async () => {
  const c = chain({ changeAt: -1 });
  assert.equal(await findChange({ config: c.config, tipHeight: c.tip, pick, step: 5_000, maxSteps: 5 }), null);
});

test('heights the node cannot serve do not break the bisection', async () => {
  const missing = new Set(Array.from({ length: 200 }, (_, i) => 37_000 + i * 3));
  const c = chain({ changeAt: 37_123, missing });
  const r = await findChange({ config: c.config, tipHeight: c.tip, pick, step: 5_000 });
  // A missing height is treated as "old", so the answer is the first readable new block.
  assert.ok(r.firstHeight >= 37_123 && r.firstHeight <= 37_125, `got ${r.firstHeight}`);
});

test('burnShare: burnt_gas_reward is the share paid to contracts', () => {
  assert.equal(burnShare([3, 10]), 0.7);
  assert.equal(burnShare([0, 1]), 1);
});
