// Find the block at a given UTC time. NEAR heights don't map to time evenly (block time
// changed from ~1.1 s to ~0.6 s in 2025, and some heights are skipped), so we keep a table
// of [height, ms] anchors and correct once with the local block rate.
import fs from 'node:fs';
import { blockFrom, rpc } from './rpc.js';
import { heightAt } from './slots.js';

const msOf = (b) => Number(BigInt(b.header.timestamp) / 1_000_000n);

/** A [height, ms] point every 1M heights (cached in `file`), plus the current final tip. */
export async function anchors(file, { write = true } = {}) {
  const head = (await rpc('block', { finality: 'final' })).header.height;
  const known = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
  const have = new Set(known.map(([h]) => Math.floor(h / 1_000_000)));
  const want = [];
  for (let h = 80_000_000; h < head - 1_000_000; h += 1_000_000) if (!have.has(h / 1_000_000)) want.push(h);
  const fresh = await Promise.all(want.map(async (h) => { const b = await blockFrom(h); return [b.header.height, msOf(b)]; }));
  const fixed = [...known.filter(([h]) => h < head - 1_000_000), ...fresh].sort((a, b) => a[0] - b[0]);
  if (write) fs.writeFileSync(file, JSON.stringify(fixed) + '\n');
  const tip = await blockFrom(head);
  return [...fixed, [tip.header.height, msOf(tip)]];
}

/**
 * The block at time t (ms): interpolate between anchors, then correct with the anchors' block
 * rate until the block is within 60 s of t (at most 4 steps).
 */
export async function blockAt(t, table) {
  let b = await blockFrom(heightAt(table, t));
  const i = table.findIndex(([, ms]) => ms >= t);
  const [[h0, t0], [h1, t1]] = i > 0 ? [table[i - 1], table[i]] : [table.at(-2), table.at(-1)];
  const msPerHeight = (t1 - t0) / (h1 - h0);
  for (let step = 0; step < 4; step++) {
    const off = t - msOf(b);
    if (Math.abs(off) < 60_000) break;
    b = await blockFrom(Math.max(1, b.header.height + Math.round(off / msPerHeight)));
  }
  return b;
}
