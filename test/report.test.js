// Tests for lib/report.js (the page data) and for the rule "no typed-in numbers in the page".
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { buildReport, busiestP95, headlineIntervals, offsets } from '../lib/report.js';
import { blockStats } from '../lib/metrics.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const DAY = 86_400_000;
const T0 = Date.UTC(2026, 0, 1);
const Y = (near) => (BigInt(Math.round(near * 1e6)) * 10n ** 18n).toString();

// FIXTURE: 400 days, 4 slots a day, 2 shards; supply grows 100 NEAR a day; 0.01 NEAR burnt per block.
function fixtureRows() {
  const rows = [];
  for (let d = 0; d < 400; d++) for (let s = 0; s < 4; s++) {
    const t = T0 + d * DAY + s * 6 * 3_600_000;
    const ordinal = (d * 4 + s) * 1000;
    rows.push({ t, blocks: [{
      height: ordinal, ordinal, ts: t, gas_price: '100000000', total_supply: Y(1e6 + d * 100),
      shards: 2, shard_ids: [0, 1], used: [10_000 + (s * 1000), 30_000], limit: [1_000_000, 1_000_000], delayed: [0, 0], burnt: Y(0.01),
    }] });
  }
  return rows;
}
const nb = { rows: [{ date: '2026-01-01', gas_used: '0', blocks: 1, txns: 5 }] };

test('report has every section the page reads, with finite numbers', () => {
  const r = buildReport({ rows: fixtureRows(), nb, nowMs: T0 + 401 * DAY });
  for (const k of ['data_as_of', 'sampling', 'recent', 'intervals', 'monthly', 'peak_month', 'congestion', 'economics', 'cross_check', 'all_time']) assert.ok(r[k] != null, k);
  assert.equal(r.sampling.blocks, 1600);
  assert.ok(r.intervals.use[0] <= r.recent.use && r.recent.use <= r.intervals.use[1]);
  assert.ok(r.intervals.feeMultiple[0] <= r.recent.feeMultiple && r.recent.feeMultiple <= r.intervals.feeMultiple[1]);
  for (const m of r.monthly) assert.ok(m.useBand[0] <= m.use + 1e-12 && m.use <= m.useBand[1] + 1e-12, m.month);
  assert.equal(r.chunk_gas_limit_tgas, 1000);
});

test('economics on the fixture: issuance, burn per Tgas, blocks per day', () => {
  const e = buildReport({ rows: fixtureRows(), nb }).economics;
  assert.equal(Math.round(e.blocksPerDay), 4000);
  // 0.01 NEAR per block over 40 + 4.x Tgas per block
  assert.ok(e.burnPerTgasNear > 0.0002 && e.burnPerTgasNear < 0.00025);
  // supply +100/day plus burn 0.01 x 4000 blocks/day = 140 NEAR/day minted
  assert.ok(Math.abs(e.issuance.mintedPerYear / 365.25 - 140) < 1);
  assert.ok(e.coverageTodayBand[0] <= e.coverageToday && e.coverageToday <= e.coverageTodayBand[1]);
});

test('busiest shard p95 and intervals are deterministic', () => {
  const bs = fixtureRows().slice(-120).map((r) => blockStats(r.blocks[0]));
  assert.equal(busiestP95(bs), 0.03);
  assert.deepEqual(headlineIntervals(bs), headlineIntervals(bs));
});

test('dense check compares with sampled blocks in the same window, only when dense evidence exists', () => {
  const rows = fixtureRows();
  assert.equal(buildReport({ rows, nb }).dense_check, null);
  const d = buildReport({ rows, nb, denseRows: rows.slice(-120) }).dense_check;
  assert.equal(d.blocks, 120);
  assert.equal(d.sampledBlocks, 120);
  assert.equal(d.useInInterval, true);
});

test('the committed page data is rebuilt exactly from evidence/ (except generated_at)', () => {
  const file = path.join(ROOT, 'web', 'public', 'data', 'headroom.json');
  const stored = JSON.parse(fs.readFileSync(file, 'utf8'));
  const jsonl = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const maybe = (f, parse) => (fs.existsSync(f) ? parse(f) : null);
  const r = buildReport({
    rows: jsonl(path.join(ROOT, 'evidence', 'samples.jsonl')),
    nb: JSON.parse(fs.readFileSync(path.join(ROOT, 'evidence', 'nearblocks-daily.json'), 'utf8')),
    denseRows: maybe(path.join(ROOT, 'evidence', 'dense-30d.jsonl'), jsonl),
    culprits: maybe(path.join(ROOT, 'evidence', 'culprits.json'), (f) => JSON.parse(fs.readFileSync(f, 'utf8'))),
    predictions: maybe(path.join(ROOT, 'predictions', 'predictions.json'), (f) => JSON.parse(fs.readFileSync(f, 'utf8'))),
    predictionsSha256: maybe(path.join(ROOT, 'predictions', 'predictions.json'), (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')),
    nowMs: Date.parse(stored.generated_at),
  });
  const rebuilt = JSON.parse(JSON.stringify({ ...r, sources: stored.sources }, (k, v) => (typeof v === 'bigint' ? v.toString() : v)));
  assert.deepEqual(rebuilt, stored);
});

test('no typed-in percentages or multiples in page components (numbers come from headroom.json)', () => {
  const dir = path.join(ROOT, 'web', 'src', 'components');
  for (const f of fs.readdirSync(dir)) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    // JSX text like ">20.8%<" or "about 84×" would be a typed-in finding.
    const hits = src.match(/>[^<{]*\d+(\.\d+)?\s?[%×][^<{]*</g) || [];
    assert.deepEqual(hits, [], `${f} has typed-in numbers`);
  }
});

test('slot offsets: median and max gap between slot time and stored block', () => {
  const rows = [{ t: 0, blocks: [{ ts: 1000 }] }, { t: 0, blocks: [{ ts: 3000 }] }, { t: 0, blocks: [{ ts: 120_000 }] }];
  assert.deepEqual(offsets(rows), { median: 3, max: 120, over60: 1 });
});
