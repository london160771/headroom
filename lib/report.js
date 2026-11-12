// Build the page data (headroom.json) from parsed evidence. Pure: no files, no network,
// so tests can run it on fixtures and scripts/build.js only does the reading and writing.
import { blocksPerDay, bridge, burnPerTgas, issuance } from './economics.js';
import { blocksOf, congestion, crossCheck, floorPrice, hotShardEvents, monthly, percentile, priceRises, recent, summarize } from './metrics.js';
import { score, shiftBack } from './predictions.js';
import { targetTime } from './slots.js';
import { bootstrap, byDay } from './stats.js';

const sum = (xs) => xs.reduce((a, b) => a + b, 0);
const useOf = (bs) => sum(bs.map((b) => b.used)) / sum(bs.map((b) => b.limit));

/** Median and maximum distance (seconds) between each slot's target time and its stored block. */
export function offsets(rows) {
  const off = rows.map((r) => Math.abs(r.blocks[0].ts - targetTime(r.t)) / 1000).sort((a, b) => a - b);
  return { median: percentile(off, 50), max: off.at(-1), over60: off.filter((x) => x >= 60).length };
}

/** Highest per-shard 95th percentile in a set of blocks (the "busiest shard" of the headline). */
export function busiestP95(bs) {
  const by = new Map();
  for (const b of bs) for (const { shard, use } of b.shardUse) {
    if (!by.has(shard)) by.set(shard, []);
    by.get(shard).push(use);
  }
  return Math.max(...[...by.values()].map((u) => percentile(u, 95)));
}

/** 90% intervals for the headline numbers: whole days of blocks are resampled (lib/stats.js). */
export function headlineIntervals(bs, opts) {
  const days = byDay(bs);
  const use = bootstrap(days, useOf, opts);
  const p95 = bootstrap(days, busiestP95, opts);
  return {
    method: `day-clustered bootstrap, ${use.draws} draws, seed ${use.seed}, ${days.length} days`,
    level: use.level,
    use: [use.lo, use.hi],
    busiestP95: [p95.lo, p95.hi],
    // The multiples are 0.5/use and 1/p95, so their bounds swap ends.
    feeMultiple: [0.5 / use.hi, 0.5 / use.lo],
    shardMultiple: [1 / p95.hi, 1 / p95.lo],
  };
}

/** Monthly capacity use with a 90% band per month. */
export function monthlyBands(bs, floor, opts = { draws: 500 }) {
  return monthly(bs, floor).map((m) => {
    const inMonth = bs.filter((b) => new Date(b.ts).toISOString().startsWith(m.month));
    const iv = bootstrap(byDay(inMonth), useOf, opts);
    return { ...m, useBand: [iv.lo, iv.hi] };
  });
}

/** Can the spare blockspace pay for NEAR? Burn per Tgas and issuance over the last year. */
export function economics(blocks, endMs, rec, iv) {
  const year = blocks.filter((b) => b.ts > endMs - 365 * 86_400_000);
  const last30 = blocks.filter((b) => b.ts > endMs - 30 * 86_400_000);
  const perDay = blocksPerDay(last30);
  const capacityTgasPerDay = perDay * rec.shards * 1000;
  const issued = issuance(blocks, endMs, 365);
  const burn = burnPerTgas(year);
  if (!issued || !burn || !perDay) return null;
  const args = { capacityTgasPerDay, burnPerTgasNear: burn, mintedPerYear: issued.mintedPerYear, feeMultiple: rec.feeMultiple };
  const b = bridge({ use: rec.use, ...args });
  const lo = bridge({ use: iv.use[0], ...args });
  const hi = bridge({ use: iv.use[1], ...args });
  return {
    blocksPerDay: perDay,
    capacityTgasPerDay,
    burnPerTgasNear: burn,
    issuance: issued,
    ...b,
    coverageTodayBand: [lo.coverageToday, hi.coverageToday],
    loadNeededBand: [hi.loadNeeded, lo.loadNeeded],
  };
}

/**
 * Sampling check: the dense read (scripts/dense.js, one block every 30 minutes) against the
 * 6-hour sample over the same time window. The sampled numbers should land close to the
 * dense ones, and the dense ones inside the sampled 90% intervals.
 */
export function denseCheck(denseRows, blocks) {
  if (!denseRows?.length) return null;
  const dense = blocksOf(denseRows);
  const from = Math.min(...denseRows.map((r) => r.t)) - 30 * 60_000;
  const to = Math.max(...denseRows.map((r) => r.t));
  const sampled = blocks.filter((b) => b.ts > from && b.ts <= to + 60_000);
  const iv = headlineIntervals(sampled);
  const within = (v, [lo, hi]) => v >= lo && v <= hi;
  const use = useOf(dense);
  const p95 = busiestP95(dense);
  return {
    from: new Date(from).toISOString(),
    to: new Date(to).toISOString(),
    blocks: dense.length,
    sampledBlocks: sampled.length,
    use,
    busiestP95: p95,
    sampledUse: useOf(sampled),
    sampledBusiestP95: busiestP95(sampled),
    sampledIntervals: { use: iv.use, busiestP95: iv.busiestP95 },
    useInInterval: within(use, iv.use),
    busiestP95InInterval: within(p95, iv.busiestP95),
  };
}

export function buildReport({ rows, nb, denseRows = null, predictions = null, predictionsSha256 = null, culprits = null, nowMs = Date.now() }) {
  const blocks = blocksOf(rows);
  const floor = floorPrice(blocks);
  const last = blocks.at(-1);
  const rec = recent(blocks, last.ts, 30, floor);
  const recentBlocks = blocks.filter((b) => b.ts > last.ts - 30 * 86_400_000);
  const iv = headlineIntervals(recentBlocks);
  const months = monthlyBands(blocks, floor);
  return {
    generated_at: new Date(nowMs).toISOString(),
    data_as_of: new Date(last.ts).toISOString(),
    sampling: {
      slots: rows.length,
      blocks: blocks.length,
      first: new Date(blocks[0].ts).toISOString(),
      last: new Date(last.ts).toISOString(),
      rule: 'one block in every 6-hour UTC slot since 2023-01-01, at a seeded random moment inside the slot',
      // How far each stored block is from its target time.
      offsetSeconds: offsets(rows),
    },
    floor_gas_price: floor.toString(),
    chunk_gas_limit_tgas: last.limit / last.shardUse.length / 1000,
    recent: rec,
    intervals: iv,
    monthly: months,
    peak_month: months.reduce((a, b) => (b.use > a.use ? b : a)),
    hot_shard_events: hotShardEvents(blocks, 0.5),
    above_floor_blocks: blocks.filter((b) => b.gasPrice !== floor).length,
    price_rises: priceRises(blocks, floor),
    congestion: congestion(blocks),
    economics: economics(blocks, last.ts, rec, iv),
    dense_check: denseCheck(denseRows, blocks),
    culprits,
    predictions: predictions ? {
      ...predictions,
      sha256: predictionsSha256,
      scored: score(predictions.predictions, blocks, floor, nowMs),
      // Days before last.ts are complete; the backtest window ends on the last full day of data.
      backtest: score(shiftBack(predictions.predictions, new Date(last.ts - 86_400_000).toISOString().slice(0, 10)), blocks, floor, last.ts),
    } : null,
    cross_check: crossCheck(blocks, nb.rows),
    nearblocks_monthly_txns: Object.entries(
      nb.rows.reduce((m, r) => ((m[r.date.slice(0, 7)] = (m[r.date.slice(0, 7)] || 0) + r.txns), m), {}),
    ).filter(([m]) => m >= '2023-01').map(([month, txns]) => ({ month, txns })),
    all_time: summarize(blocks, floor),
  };
}
