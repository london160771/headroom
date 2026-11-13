// A second, independent recompute of Headroom's headline numbers, straight from the raw evidence
// rows. It deliberately imports NOTHING from the rest of lib/: it is written again from the
// definitions in README/THESIS, so a bug in lib/metrics.js, lib/economics.js or lib/report.js
// would show up as a mismatch in `npm run verify` instead of being copied into both answers.
const DAY = 86_400_000;
const YOCTO = 1e24;

function rawBlocks(rows) {
  const out = [];
  for (const row of rows) {
    for (const b of row.blocks) {
      let used = 0;
      let limit = 0;
      for (let i = 0; i < b.used.length; i++) {
        used += b.used[i];
        limit += b.limit[i];
      }
      // A block with no chunk included at its height has nothing to measure: skip it, never 0%.
      if (limit > 0) out.push({ ...b, sumUsed: used, sumLimit: limit });
    }
  }
  out.sort((x, y) => x.ts - y.ts);
  return out;
}

// Nearest-rank 95th percentile.
function p95(values) {
  const s = [...values].sort((x, y) => x - y);
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil(0.95 * s.length) - 1))];
}

/**
 * rows: evidence/samples.jsonl rows. dense: evidence/dense-30d.jsonl rows (or []).
 * protocol: evidence/protocol.json. scenarios: evidence/scenarios.json.
 */
export function recompute({ rows, dense = [], protocol, scenarios }) {
  const all = rawBlocks(rows);
  const end = all[all.length - 1].ts;
  const win = all.filter((b) => b.ts > end - 30 * DAY && b.ts <= end);

  let used = 0;
  let limit = 0;
  for (const b of win) {
    used += b.sumUsed;
    limit += b.sumLimit;
  }
  const use = used / limit;

  // Per-shard use in the window, then the shard with the highest 95th percentile.
  const perShard = {};
  for (const b of win) {
    b.shard_ids.forEach((id, i) => (perShard[id] ??= []).push(b.used[i] / b.limit[i]));
  }
  let busiest = { shard: null, p95: -1 };
  for (const id of Object.keys(perShard).map(Number).sort((x, y) => x - y)) {
    const v = p95(perShard[id]);
    if (v > busiest.p95) busiest = { shard: id, p95: v };
  }

  // The floor is the lowest gas price ever seen in the sample.
  let floor = BigInt(all[0].gas_price);
  for (const b of all) if (BigInt(b.gas_price) < floor) floor = BigInt(b.gas_price);
  const atFloor = win.filter((b) => BigInt(b.gas_price) === floor).length / win.length;

  // Blocks per day from block_ordinal (heights skip numbers, ordinals do not).
  const ordWin = win.filter((b) => b.ordinal != null);
  const o0 = ordWin[0];
  const o1 = ordWin[ordWin.length - 1];
  const blocksPerDay = (o1.ordinal - o0.ordinal) / ((o1.ts - o0.ts) / DAY);
  const shards = Math.max(...win.map((b) => b.shards));
  const capacityTgasPerDay = blocksPerDay * shards * 1000;

  // Issuance over the last 365 days: supply change plus the NEAR burned in between.
  const yr = all.filter((b) => b.total_supply != null && b.ts > end - 365 * DAY && b.ts <= end);
  const a = yr[0];
  const z = yr[yr.length - 1];
  let burntYear = 0n;
  for (const b of yr) burntYear += BigInt(b.burnt);
  const burnedBetween = (Number(burntYear) / YOCTO / yr.length) * (z.ordinal - a.ordinal);
  const minted = Number(BigInt(z.total_supply) - BigInt(a.total_supply)) / YOCTO + burnedBetween;
  const mintedPerYear = minted / ((z.ts - a.ts) / (365.25 * DAY));
  const ratePerYear = mintedPerYear / (Number(BigInt(a.total_supply)) / YOCTO);

  // Burn per Tgas under the current burn rule: every sampled or dense block at or after the change.
  const since = protocol.burn_rule_change.first_height;
  const seen = new Set();
  let burnt = 0n;
  let ggas = 0;
  for (const b of [...all, ...rawBlocks(dense)]) {
    if (b.height < since || seen.has(b.height)) continue;
    seen.add(b.height);
    burnt += BigInt(b.burnt);
    ggas += b.sumUsed;
  }
  const burnPerTgasNear = Number(burnt) / YOCTO / (ggas / 1000);

  const coverage = (u, mintedYr) => (u * capacityTgasPerDay * 365.25 * burnPerTgasNear) / mintedYr;
  const coverageToday = coverage(use, mintedPerYear);
  const feeMultiple = 0.5 / use;
  const hspMinted = mintedPerYear * (scenarios.hsp029.max_inflation / protocol.now.max_inflation);
  const hspLoad = 1 / coverage(use, hspMinted);

  // Gas per day (average gas per block x blocks per day) now vs the same 30 days a year earlier.
  const perDay = (from, to) => {
    const w = all.filter((b) => b.ts > from && b.ts <= to && b.ordinal != null);
    let g = 0;
    for (const b of w) g += b.sumUsed;
    return (g / w.length / 1000) * ((w[w.length - 1].ordinal - w[0].ordinal) / ((w[w.length - 1].ts - w[0].ts) / DAY));
  };
  const gasYearOverYear = perDay(end - 30 * DAY, end) / perDay(end - 395 * DAY, end - 365 * DAY);

  return {
    use,
    feeMultiple,
    busiestShard: busiest.shard,
    busiestP95: busiest.p95,
    shardMultiple: 1 / busiest.p95,
    atFloor,
    blocksPerDay,
    mintedPerYear,
    ratePerYear,
    burnPerTgasNear,
    coverageToday,
    loadNeeded: 1 / coverageToday,
    hsp029LoadNeeded: hspLoad,
    hsp029FitsBeforeFeesMove: hspLoad <= feeMultiple,
    gasYearOverYear,
  };
}

/** The same numbers as published in web/public/data/headroom.json. */
export function published(d) {
  const e = d.economics;
  return {
    use: d.recent.use,
    feeMultiple: d.recent.feeMultiple,
    busiestShard: d.recent.busiest.shard,
    busiestP95: d.recent.busiest.p95,
    shardMultiple: d.recent.shardMultiple,
    atFloor: d.recent.atFloor,
    blocksPerDay: e.blocksPerDay,
    mintedPerYear: e.issuance.mintedPerYear,
    ratePerYear: e.issuance.ratePerYear,
    burnPerTgasNear: e.burnPerTgasNear,
    coverageToday: e.coverageToday,
    loadNeeded: e.loadNeeded,
    hsp029LoadNeeded: e.hsp029.loadNeeded,
    hsp029FitsBeforeFeesMove: e.hsp029.fitsBeforeFeesMove,
    gasYearOverYear: d.long_term.rows.find((r) => r.id === 'last_year').pace,
  };
}

/** Compare two answers. Numbers must agree to 1 part in a billion (float rounding only). */
export function compare(mine, theirs) {
  return Object.keys(mine).map((k) => {
    const x = mine[k];
    const y = theirs[k];
    const ok = typeof x === 'number' ? Math.abs(x - y) <= 1e-9 * Math.max(1, Math.abs(x), Math.abs(y)) : x === y;
    return { key: k, independent: x, published: y, ok };
  });
}
