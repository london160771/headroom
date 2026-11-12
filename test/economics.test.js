// Tests for lib/economics.js, lib/stats.js and the congestion metric. FIXTURE blocks only.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blocksPerDay, bridge, burnPerBlock, burnPerTgas, issuance } from '../lib/economics.js';
import { blockStats, congestion } from '../lib/metrics.js';
import { bootstrap, byDay, rng } from '../lib/stats.js';

const DAY = 86_400_000;
const T0 = Date.UTC(2025, 0, 1);
const Y = (near) => (BigInt(Math.round(near * 1e6)) * 10n ** 18n).toString();
const fixture = ({ ts, ordinal = 0, supply = 1_000_000, burnt = 0, used = [0], delayed }) =>
  blockStats({
    height: ordinal, ordinal, ts, gas_price: '100000000', total_supply: Y(supply), shards: used.length,
    shard_ids: used.map((_, i) => i), used, limit: used.map(() => 1_000_000), delayed: delayed || used.map(() => 0), burnt: Y(burnt),
  });

test('blocks per day comes from block_ordinal, not height', () => {
  const bs = [fixture({ ts: T0, ordinal: 1000 }), fixture({ ts: T0 + 2 * DAY, ordinal: 1000 + 2 * 140_000 })];
  assert.equal(blocksPerDay(bs), 140_000);
});

test('burn per Tgas is total burnt over total gas used', () => {
  const bs = [fixture({ ts: T0, burnt: 0.07, used: [1000] }), fixture({ ts: T0 + 1, burnt: 0.07, used: [1000] })];
  assert.ok(Math.abs(burnPerTgas(bs) - 0.07) < 1e-12); // 0.14 NEAR over 2 Tgas
  assert.ok(Math.abs(burnPerBlock(bs) - 0.07) < 1e-12);
});

test('issuance adds back the NEAR burned over the window', () => {
  const bs = [
    fixture({ ts: T0, ordinal: 0, supply: 1_000_000, burnt: 1 }),
    fixture({ ts: T0 + 365.25 * DAY, ordinal: 100, supply: 1_049_900, burnt: 1 }),
  ];
  const i = issuance(bs, T0 + 365.25 * DAY, 400);
  assert.equal(Math.round(i.burnedEstimate), 100);
  assert.equal(Math.round(i.mintedPerYear), 50_000);
  assert.ok(Math.abs(i.ratePerYear - 0.05) < 1e-9);
});

test('bridge: coverage scales with use; load needed is compared with the fee multiple', () => {
  const b = bridge({ use: 0.01, capacityTgasPerDay: 1e9, burnPerTgasNear: 0.0001, mintedPerYear: 365.25 * 1e5 * 2, feeMultiple: 50 });
  assert.ok(Math.abs(b.coverageToday - 0.005) < 1e-12);
  assert.ok(Math.abs(b.coverageAtTrigger - 0.25) < 1e-12);
  assert.ok(Math.abs(b.coverageFull - 0.5) < 1e-12);
  assert.ok(Math.abs(b.loadNeeded - 200) < 1e-9);
  assert.equal(b.fitsBeforeFeesMove, false);
  assert.ok(Math.abs(b.priceNeededAtFull - 2) < 1e-12);
});

test('congestion counts blocks with any delayed receipts, per month', () => {
  const c = congestion([
    fixture({ ts: T0, used: [10, 10], delayed: [0, 5000] }),
    fixture({ ts: T0 + DAY, used: [10, 10] }),
  ]);
  assert.equal(c.congestedBlocks, 1);
  assert.equal(c.monthly[0].share, 0.5);
  assert.equal(c.monthly[0].maxDelayedTgas, 5);
});

test('seeded PRNG is deterministic', () => {
  const a = rng(7);
  const b = rng(7);
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
  assert.notEqual(rng(8)(), rng(7)());
});

test('bootstrap resamples whole days and is reproducible', () => {
  const items = [];
  for (let d = 0; d < 30; d++) for (let k = 0; k < 4; k++) items.push({ ts: T0 + d * DAY + k, v: d % 2 ? 1 : 3 });
  const groups = byDay(items);
  assert.equal(groups.length, 30);
  const mean = (xs) => xs.reduce((s, x) => s + x.v, 0) / xs.length;
  const i1 = bootstrap(groups, mean, { seed: 1 });
  const i2 = bootstrap(groups, mean, { seed: 1 });
  assert.deepEqual(i1, i2);
  assert.ok(i1.lo < 2 && i1.hi > 2 && i1.lo >= 1 && i1.hi <= 3);
  assert.equal(bootstrap([[{ ts: 0, v: 5 }]], mean).lo, 5);
});
