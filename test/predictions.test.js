// Tests for lib/predictions.js and lib/culprits.js on FIXTURE blocks.
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { rankAccounts } from '../lib/culprits.js';
import { blockStats } from '../lib/metrics.js';
import { METRICS, score, shiftBack } from '../lib/predictions.js';

const FLOOR = 100_000_000n;
const b = (iso, used, price = '100000000') => blockStats({
  height: 1, ts: Date.parse(iso), gas_price: price, shards: used.length, shard_ids: used.map((_, i) => i),
  used, limit: used.map(() => 1_000_000), delayed: used.map(() => 0), burnt: '0', total_supply: '0', ordinal: 1,
});
const P = (o) => ({ id: 'P', text: 't', from: '2027-01-01', to: '2027-12-31', ...o });

test('a prediction with no blocks in its window is waiting, then failed once closed', () => {
  const [s] = score([P({ metric: 'at_floor_share', op: '>=', value: 0.99 })], [b('2026-12-01T00:00:00Z', [0])], FLOOR, Date.parse('2027-03-01'));
  assert.equal(s.status, 'waiting');
  const [c] = score([P({ metric: 'at_floor_share', op: '>=', value: 0.99 })], [], FLOOR, Date.parse('2028-02-01'));
  assert.equal(c.status, 'failed');
});

test('a running maximum fails early; a share can still recover while open', () => {
  const bs = [b('2027-02-01T00:00:00Z', [600_000, 600_000], '200000000'), b('2027-02-02T00:00:00Z', [0, 0])];
  const now = Date.parse('2027-03-01');
  const [m, f] = score([P({ metric: 'max_block_use', op: '<=', value: 0.5 }), P({ metric: 'at_floor_share', op: '>=', value: 0.99 })], bs, FLOOR, now);
  assert.equal(m.status, 'failed');
  assert.equal(m.value_so_far, 0.6);
  assert.equal(f.status, 'not holding');
  assert.equal(f.value_so_far, 0.5);
});

test('a closed window is scored passed or failed', () => {
  const bs = [b('2027-06-10T00:00:00Z', [10_000, 30_000])];
  const [s] = score([P({ metric: 'use', op: '<', value: 0.05, from: '2027-06-01', to: '2027-06-30' })], bs, FLOOR, Date.parse('2027-07-01T00:00:01Z'));
  assert.equal(s.status, 'passed');
  assert.equal(s.value_so_far, 0.02);
});

test('monthly metrics take the worst month in the window', () => {
  const bs = [b('2027-01-05T00:00:00Z', [100_000]), b('2027-02-05T00:00:00Z', [300_000]), b('2027-02-06T00:00:00Z', [100_000])];
  assert.equal(METRICS.max_month_use(bs, FLOOR), 0.2);
  assert.equal(METRICS.max_month_hottest_p95(bs, FLOOR), 0.3);
});

test('an unknown metric is an error, not a silent pass', () => {
  assert.throws(() => score([P({ metric: 'vibes', op: '>', value: 0 })], [b('2027-02-01T00:00:00Z', [1])], FLOOR, Date.now()), /unknown metric/);
});

test('culprit ranking: accounts that lead the most hot chunks come first, also per year', () => {
  const r = rankAccounts([
    { ts: Date.parse('2024-01-01'), top: [['a.near', 50], ['b.near', 10]] },
    { ts: Date.parse('2024-02-01'), top: [['a.near', 30]] },
    { ts: Date.parse('2025-01-01'), top: [['b.near', 70], ['a.near', 5]] },
  ]);
  assert.deepEqual(r.overall.map((x) => [x.account, x.led, x.receipts]), [['a.near', 2, 85], ['b.near', 1, 80]]);
  assert.deepEqual(r.byYear.map((y) => [y.year, y.top[0].account]), [[2024, 'a.near'], [2025, 'b.near']]);
});

test('backtest moves each window back to end on the last day of data, keeping its length', () => {
  const [a, b] = shiftBack([P({}), P({ from: '2027-06-01', to: '2027-06-30' })], '2026-11-11');
  assert.deepEqual([a.from, a.to], ['2025-11-12', '2026-11-11']);
  assert.deepEqual([b.from, b.to], ['2026-10-13', '2026-11-11']);
});

test('the frozen predictions file still matches its recorded SHA-256', () => {
  const dir = path.resolve(import.meta.dirname, '..', 'predictions');
  const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, 'predictions.json'))).digest('hex');
  assert.equal(fs.readFileSync(path.join(dir, 'SHA256'), 'utf8').split(/\s+/)[0], hash);
});
