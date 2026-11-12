// Every Headroom formula lives here. Pure functions, no network, so the scripts,
// the page and the tests all compute numbers the same way.
//
// Input: block records from evidence/samples.jsonl (see lib/block.js).
// Gas is in Ggas. "use" is a share of capacity between 0 and 1.

/**
 * NEAR raises the next gas price only when gas used, summed over ALL chunks of a block,
 * is more than half of the summed gas limit (nearcore compute_next_gas_price:
 * new = old * (1 + rate * (used/limit - 1/2))). One full shard alone cannot do it.
 */
export const FEE_TRIGGER = 0.5;

/** A single shard is full when its chunk uses its whole gas limit. */
export const SHARD_FULL = 1;

const sum = (xs) => xs.reduce((a, b) => a + b, 0);

export function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.min(sorted.length - 1, Math.max(0, rank))];
}

/** Capacity use of one block: only chunks included at this height count (INV-1). */
export function blockStats(rec) {
  const used = sum(rec.used);
  const limit = sum(rec.limit);
  const shardUse = rec.used.map((u, i) => u / rec.limit[i]);
  const hot = shardUse.length ? shardUse.indexOf(Math.max(...shardUse)) : -1;
  return {
    height: rec.height,
    ts: rec.ts,
    gasPrice: BigInt(rec.gas_price),
    shards: rec.shards,
    missing: rec.shards - rec.used.length,
    used,
    limit,
    use: limit ? used / limit : null,
    hottest: hot >= 0 ? shardUse[hot] : null,
    hottestShard: hot >= 0 ? rec.shard_ids[hot] : null,
    shardUse: shardUse.map((u, i) => ({ shard: rec.shard_ids[i], use: u })),
  };
}

/** Flatten slot rows ({ t, blocks }) into block stats, oldest first. */
export function blocksOf(rows) {
  return rows.flatMap((r) => r.blocks.map(blockStats)).filter((b) => b.limit > 0).sort((a, b) => a.ts - b.ts);
}

const monthOf = (ms) => new Date(ms).toISOString().slice(0, 7);

export function floorPrice(blocks) {
  return blocks.reduce((m, b) => (b.gasPrice < m ? b.gasPrice : m), blocks[0].gasPrice);
}

/** Summary of a set of blocks: total use, hottest-shard spread, gas price state. */
export function summarize(blocks, floor) {
  const used = sum(blocks.map((b) => b.used));
  const limit = sum(blocks.map((b) => b.limit));
  const hottest = blocks.map((b) => b.hottest);
  return {
    blocks: blocks.length,
    shards: Math.max(...blocks.map((b) => b.shards)),
    use: used / limit,
    hottestP50: percentile(hottest, 50),
    hottestP95: percentile(hottest, 95),
    hottestMax: Math.max(...hottest),
    atFloor: blocks.filter((b) => b.gasPrice === floor).length / blocks.length,
    missingChunks: sum(blocks.map((b) => b.missing)),
  };
}

export function monthly(blocks, floor = floorPrice(blocks)) {
  const groups = new Map();
  for (const b of blocks) {
    const m = monthOf(b.ts);
    if (!groups.has(m)) groups.set(m, []);
    groups.get(m).push(b);
  }
  return [...groups].map(([month, bs]) => ({ month, ...summarize(bs, floor) }));
}

/** The last `days` days before endMs, with per-shard loads and the two headroom multiples. */
export function recent(blocks, endMs, days = 30, floor = floorPrice(blocks)) {
  const from = endMs - days * 86_400_000;
  const bs = blocks.filter((b) => b.ts > from && b.ts <= endMs);
  const s = summarize(bs, floor);
  const byShard = new Map();
  for (const b of bs) for (const { shard, use } of b.shardUse) {
    if (!byShard.has(shard)) byShard.set(shard, []);
    byShard.get(shard).push(use);
  }
  const perShard = [...byShard]
    .map(([shard, uses]) => ({ shard, avg: sum(uses) / uses.length, p95: percentile(uses, 95) }))
    .sort((a, b) => a.shard - b.shard);
  const busiest = perShard.reduce((a, b) => (b.p95 > a.p95 ? b : a), perShard[0]);
  return {
    from: new Date(from).toISOString(),
    to: new Date(endMs).toISOString(),
    days,
    ...s,
    perShard,
    busiest,
    ...multiples(s.use, busiest.p95),
  };
}

/**
 * feeMultiple: how many times today's load must grow (evenly) before NEAR's fee rule raises the price.
 * shardMultiple: how many times it must grow before the busiest shard, at its own busy hours
 * (95th percentile of that shard's use), is full.
 */
export function multiples(use, busiestShardP95) {
  return {
    feeMultiple: use > 0 ? FEE_TRIGGER / use : null,
    shardMultiple: busiestShardP95 > 0 ? SHARD_FULL / busiestShardP95 : null,
  };
}

/** Sampled blocks priced above the floor: when, how full the block was, how many shards were full. */
export function priceRises(blocks, floor) {
  return blocks
    .filter((b) => b.gasPrice !== floor)
    .map((b) => ({
      ts: b.ts,
      height: b.height,
      priceMultiple: Number(b.gasPrice) / Number(floor),
      blockUse: b.use,
      fullShards: b.shardUse.filter((s) => s.use >= 0.99).length,
      shards: b.shardUse.length,
    }));
}

/** Sampled blocks where one shard used more than `threshold` of its limit. */
export function hotShardEvents(blocks, threshold = 0.5) {
  return blocks
    .filter((b) => b.hottest > threshold)
    .map((b) => ({ ts: b.ts, height: b.height, shard: b.hottestShard, use: b.hottest, blockUse: b.use, gasPrice: b.gasPrice.toString() }));
}

/**
 * Gate 0: our sampled gas per block vs NearBlocks' daily totals, per month.
 * nbRows: [{ date, gas_used (gas units, string), blocks }].
 */
export function crossCheck(blocks, nbRows) {
  const theirs = new Map();
  for (const r of nbRows) {
    const m = r.date.slice(0, 7);
    const t = theirs.get(m) || { gas: 0, blocks: 0 };
    t.gas += Number(r.gas_used) / 1e9;
    t.blocks += r.blocks;
    theirs.set(m, t);
  }
  return monthly(blocks).map(({ month }) => {
    const bs = blocks.filter((b) => monthOf(b.ts) === month);
    const ours = sum(bs.map((b) => b.used)) / bs.length;
    const t = theirs.get(month);
    const nb = t && t.blocks ? t.gas / t.blocks : null;
    return { month, oursGgasPerBlock: ours, nearblocksGgasPerBlock: nb, ratio: nb ? ours / nb : null };
  });
}

/**
 * The xN slider (a model): scale every shard's recent p95 load by n.
 * Returns each shard's scaled load, which shards would be full, and whether the
 * block-wide average would cross the fee trigger.
 */
export function stress(perShard, use, n) {
  const shards = perShard.map((s) => ({ shard: s.shard, load: s.p95 * n, full: s.p95 * n >= SHARD_FULL }));
  return { n, shards, blockUse: use * n, feeMoves: use * n > FEE_TRIGGER, fullShards: shards.filter((s) => s.full).length };
}
