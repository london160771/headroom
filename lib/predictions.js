// Score the frozen predictions in predictions/predictions.json against the evidence.
// A prediction names a metric, a window [from, to], an operator and a value. The build
// recomputes the metric from sampled blocks inside the window, every time it runs.
import { issuance } from './economics.js';
import { monthly } from './metrics.js';

const day = (s) => Date.parse(`${s}T00:00:00Z`);

/** Metrics a prediction can name. Each takes the blocks inside the window. */
export const METRICS = {
  // Share of sampled blocks priced at the floor gas price.
  at_floor_share: (bs, floor) => bs.filter((b) => b.gasPrice === floor).length / bs.length,
  // Average capacity use over the window (summed gas over summed limit).
  use: (bs) => bs.reduce((s, b) => s + b.used, 0) / bs.reduce((s, b) => s + b.limit, 0),
  // Highest monthly average capacity use.
  max_month_use: (bs, floor) => Math.max(...monthly(bs, floor).map((m) => m.use)),
  // Highest monthly 95th percentile of the hottest shard in each block.
  max_month_hottest_p95: (bs, floor) => Math.max(...monthly(bs, floor).map((m) => m.hottestP95)),
  // Highest block-wide use in any sampled block (the fee rule's input).
  max_block_use: (bs) => Math.max(...bs.map((b) => b.use)),
  // NEAR burned as a share of NEAR minted over the window.
  burn_to_issuance: (bs, _floor, endMs) => {
    const i = issuance(bs, endMs, 10_000);
    return i && i.minted > 0 ? i.burnedEstimate / i.minted : null;
  },
};

// For a running maximum, once the bound is broken it can't be repaired before the window ends.
const MONOTONIC = new Set(['max_month_use', 'max_month_hottest_p95', 'max_block_use']);

const OPS = { '<=': (a, b) => a <= b, '<': (a, b) => a < b, '>=': (a, b) => a >= b, '>': (a, b) => a > b };

/**
 * status: 'waiting' (no data in the window yet), 'holding' / 'not holding' (window still open),
 * 'passed' / 'failed' (window closed, or a running maximum already broke its bound).
 */
export function score(predictions, blocks, floor, nowMs) {
  return predictions.map((p) => {
    const from = day(p.from);
    const to = day(p.to) + 86_400_000;
    const bs = blocks.filter((b) => b.ts >= from && b.ts < to);
    const closed = nowMs >= to;
    if (!METRICS[p.metric]) throw new Error(`unknown metric ${p.metric} in prediction ${p.id}`);
    if (!bs.length) return { ...p, blocks: 0, value_so_far: null, status: closed ? 'failed' : 'waiting' };
    const v = METRICS[p.metric](bs, floor, Math.min(nowMs, to));
    const ok = v != null && OPS[p.op](v, p.value);
    let status = ok ? 'holding' : 'not holding';
    if (closed) status = ok ? 'passed' : 'failed';
    else if (!ok && MONOTONIC.has(p.metric)) status = 'failed';
    return { ...p, blocks: bs.length, value_so_far: v, status };
  });
}

/**
 * Backtest: the same predictions, each window moved back so it ends on `endDay` (YYYY-MM-DD,
 * the last day of data). Shows how the thesis would have scored over the most recent past.
 */
export function shiftBack(predictions, endDay) {
  const end = day(endDay);
  return predictions.map((p) => {
    const len = day(p.to) - day(p.from);
    const iso = (ms) => new Date(ms).toISOString().slice(0, 10);
    return { ...p, from: iso(end - len), to: iso(end) };
  });
}
