// Tests for lib/metrics.js. All inputs are FIXTURE blocks written by hand below, not chain data.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toRecord } from '../lib/block.js';
import { blockStats, blocksOf, crossCheck, floorPrice, hotShardEvents, monthly, multiples, percentile, priceRises, recent, stress } from '../lib/metrics.js';
import { heightAt, slots, STEP_MS, targetTime } from '../lib/slots.js';

const LIMIT = 1_000_000; // 1,000 Tgas in Ggas
const FLOOR = '100000000';
const fixture = (height, ts, used, { price = FLOOR, shards = used.length, ids } = {}) => ({
  height, ts, gas_price: price, shards,
  shard_ids: ids || used.map((_, i) => i),
  used, limit: used.map(() => LIMIT), delayed: used.map(() => 0),
});
const DAY = 86_400_000;
const T0 = Date.UTC(2026, 9, 1);

test('toRecord keeps only chunks included at this height (missing chunks are not 0%)', () => {
  const chunk = (shard, inc, gas) => ({ shard_id: shard, height_included: inc, gas_used: String(gas), gas_limit: '1000000000000000', balance_burnt: '5', congestion_info: { delayed_receipts_gas: '0' } });
  const rpcBlock = { header: { height: 100, block_ordinal: 90, timestamp: String(T0 * 1e6), gas_price: FLOOR, total_supply: '7' }, chunks: [chunk(0, 100, 5e12), chunk(1, 99, 9e14), chunk(2, 100, 0)] };
  const r = toRecord(rpcBlock);
  assert.deepEqual(r.shard_ids, [0, 2]);
  assert.deepEqual(r.used, [5000, 0]);
  assert.equal(r.shards, 3);
  assert.equal(r.burnt, '10'); // the repeated (missing) chunk's burn is not counted again
  assert.equal(r.ordinal, 90);
  const s = blockStats(r);
  assert.equal(s.missing, 1);
  assert.equal(s.use, 5000 / (2 * LIMIT));
});

test('block use is summed gas over summed limit, hottest shard found', () => {
  const s = blockStats(fixture(1, T0, [100_000, 600_000, 0, 0]));
  assert.equal(s.use, 0.175);
  assert.equal(s.hottest, 0.6);
  assert.equal(s.hottestShard, 1);
});

test('percentile uses nearest rank', () => {
  assert.equal(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 95), 10);
  assert.equal(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 50), 5);
  assert.equal(percentile([], 50), null);
});

test('monthly groups by UTC month and counts blocks at the floor price', () => {
  const rows = [
    { t: T0, blocks: [fixture(1, T0, [10_000, 0]), fixture(2, T0 + 1, [30_000, 0], { price: '110000000' })] },
    { t: T0 + 40 * DAY, blocks: [fixture(3, T0 + 40 * DAY, [0, 20_000])] },
  ];
  const m = monthly(blocksOf(rows));
  assert.deepEqual(m.map((x) => x.month), ['2026-10', '2026-11']);
  assert.equal(m[0].use, 40_000 / (4 * LIMIT));
  assert.equal(m[0].atFloor, 0.5);
  assert.equal(m[1].hottestMax, 0.02);
});

test('multiples: fee rule needs the block-wide average past 50%, a shard is full at 100%', () => {
  const { feeMultiple, shardMultiple } = multiples(0.005, 0.04);
  assert.equal(feeMultiple, 100);
  assert.equal(shardMultiple, 25);
  assert.deepEqual(multiples(0, 0), { feeMultiple: null, shardMultiple: null });
});

test('recent window: per-shard p95 and multiples from the last N days only', () => {
  const rows = [];
  for (let d = 0; d < 40; d++) rows.push({ t: T0 + d * DAY, blocks: [fixture(d, T0 + d * DAY, d < 10 ? [900_000, 900_000] : [10_000, 40_000])] });
  const r = recent(blocksOf(rows), T0 + 39 * DAY, 30);
  assert.equal(r.blocks, 30);
  assert.equal(r.use, 0.025);
  assert.deepEqual(r.perShard.map((s) => s.p95), [0.01, 0.04]);
  assert.equal(r.busiest.shard, 1);
  assert.equal(r.busiest.p95, 0.04);
  assert.equal(r.feeMultiple, 20);
  assert.equal(r.shardMultiple, 25);
});

test('hot-shard events: one shard over 50% while the block average stays low', () => {
  const bs = blocksOf([{ t: T0, blocks: [fixture(1, T0, [650_000, 20_000, 10_000, 0]), fixture(2, T0 + 1, [100_000, 0, 0, 0])] }]);
  const ev = hotShardEvents(bs);
  assert.equal(ev.length, 1);
  assert.equal(ev[0].shard, 0);
  assert.equal(ev[0].blockUse, 0.17);
});

test('cross-check compares gas per block with NearBlocks daily totals', () => {
  const bs = blocksOf([{ t: T0, blocks: [fixture(1, T0, [10_000, 10_000])] }]);
  const nb = [{ date: '2026-10-01', gas_used: String(2e13 * 100), blocks: 100 }];
  const [c] = crossCheck(bs, nb);
  assert.equal(c.oursGgasPerBlock, 20_000);
  assert.equal(c.nearblocksGgasPerBlock, 20_000);
  assert.equal(c.ratio, 1);
});

test('stress model: scaling loads by N shows which shards fill and if the fee moves', () => {
  const perShard = [{ shard: 0, p95: 0.02 }, { shard: 1, p95: 0.05 }];
  assert.equal(stress(perShard, 0.01, 10).fullShards, 0);
  const s = stress(perShard, 0.01, 20);
  assert.deepEqual(s.shards.map((x) => x.full), [false, true]);
  assert.equal(s.feeMoves, false);
  assert.equal(stress(perShard, 0.01, 51).feeMoves, true);
});

test('slots are fixed 6-hour UTC times and heights interpolate between anchors', () => {
  const s = slots(Date.UTC(2023, 0, 2), Date.UTC(2023, 0, 1));
  assert.equal(s.length, 4);
  assert.equal(new Date(s[1]).toISOString(), '2023-01-01T06:00:00.000Z');
  assert.equal(heightAt([[100, 0], [200, 1000]], 500), 150);
});

test('price rises: blocks above the floor, with how many shards were full', () => {
  const bs = blocksOf([{ t: T0, blocks: [fixture(1, T0, [1_000_000, 0, 1_000_000, 100_000], { price: '2000000000' }), fixture(2, T0 + 1, [0, 0, 0, 0])] }]);
  const r = priceRises(bs, floorPrice(bs));
  assert.equal(r.length, 1);
  assert.equal(r[0].priceMultiple, 20);
  assert.equal(r[0].fullShards, 2);
  assert.equal(r[0].blockUse, 0.525);
});

test('each slot is sampled at a fixed pseudo-random moment that covers all hours of the day', () => {
  const ts = slots(Date.UTC(2024, 0, 1));
  assert.equal(targetTime(ts[5]), targetTime(ts[5])); // same moment on every run
  const offs = ts.map((t) => targetTime(t) - t);
  assert.ok(offs.every((o) => o >= 0 && o < STEP_MS));
  // Hours of day covered by the sampled moments (fixed times would give only 4).
  const hours = new Set(ts.map((t) => new Date(targetTime(t)).getUTCHours()));
  assert.equal(hours.size, 24);
});
