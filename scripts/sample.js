// Sample NEAR mainnet blocks: one block every 6 hours (UTC) since 2023-01-01.
// Output: evidence/samples.jsonl, one line per slot: { t, blocks: [record] }.
// Resumable: slots already in the file are skipped. Run again to add new slots.
//   node scripts/sample.js [--dry-run] [--limit N]
import fs from 'node:fs';
import path from 'node:path';
import { toRecord } from '../lib/block.js';
import { blockFrom, errors, rpc } from '../lib/rpc.js';
import { BLOCKS_PER_SLOT, heightAt, slots } from '../lib/slots.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'evidence', 'samples.jsonl');
const ANCHORS = path.join(ROOT, 'evidence', 'anchors.json');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
const PARALLEL = 8;

// A [height, ms] point every 1M heights, to turn slot times into heights.
async function anchors() {
  const head = (await rpc('block', { finality: 'final' })).header.height;
  const known = fs.existsSync(ANCHORS) ? JSON.parse(fs.readFileSync(ANCHORS, 'utf8')) : [];
  const have = new Set(known.map(([h]) => Math.floor(h / 1_000_000)));
  const want = [];
  for (let h = 80_000_000; h < head - 1_000_000; h += 1_000_000) if (!have.has(h / 1_000_000)) want.push(h);
  const fresh = await Promise.all(want.map(async (h) => { const b = await blockFrom(h); return [b.header.height, Number(BigInt(b.header.timestamp) / 1_000_000n)]; }));
  const fixed = [...known.filter(([h]) => h < head - 1_000_000), ...fresh].sort((a, b) => a[0] - b[0]);
  if (!dryRun) fs.writeFileSync(ANCHORS, JSON.stringify(fixed) + '\n');
  const tip = await blockFrom(head);
  return [...fixed, [tip.header.height, Number(BigInt(tip.header.timestamp) / 1_000_000n)]];
}

// Interpolation can be off by an hour. One correction step using the local block time
// brings the first block within a few seconds of the slot time.
async function firstBlock(t, table) {
  const h = heightAt(table, t);
  const b = await blockFrom(h);
  const i = table.findIndex(([, ms]) => ms >= t);
  const [[h0, t0], [h1, t1]] = i > 0 ? [table[i - 1], table[i]] : [table.at(-2), table.at(-1)];
  const msPerHeight = (t1 - t0) / (h1 - h0);
  const off = t - Number(BigInt(b.header.timestamp) / 1_000_000n);
  if (Math.abs(off) < 60_000) return b;
  return blockFrom(Math.max(1, b.header.height + Math.round(off / msPerHeight)));
}

async function slot(t, table) {
  const blocks = [];
  let b = await firstBlock(t, table);
  blocks.push(toRecord(b));
  while (blocks.length < BLOCKS_PER_SLOT) {
    b = await blockFrom(b.header.height + 1);
    blocks.push(toRecord(b));
  }
  return { t, blocks };
}

const table = await anchors();
const done = new Set(fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).t) : []);
// Read slots in a spread-out order (every 64th first), so a partial run already covers all months.
const all = slots(table.at(-1)[1]);
const order = Array.from({ length: 64 }, (_, k) => all.filter((_, i) => i % 64 === k)).flat();
const todo = order.filter((t) => !done.has(t)).slice(0, limit);
console.error(`${done.size} slots on file, ${todo.length} to read${dryRun ? ' (dry run: nothing written)' : ''}`);

for (let i = 0; i < todo.length; i += PARALLEL) {
  const rows = await Promise.all(todo.slice(i, i + PARALLEL).map((t) => slot(t, table)));
  if (dryRun) rows.forEach((r) => console.log(JSON.stringify(r)));
  else fs.appendFileSync(OUT, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  if (i % (PARALLEL * 50) === 0) console.error(new Date().toISOString(), `${i}/${todo.length}`, JSON.stringify(errors));
}
console.error('done');
