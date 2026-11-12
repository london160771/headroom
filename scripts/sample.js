// Sample NEAR mainnet blocks: one block every 6 hours (UTC) since 2023-01-01.
// Output: evidence/samples.jsonl, one line per slot: { t, blocks: [record] }.
// Resumable: slots already in the file are skipped. Run again to add new slots.
//   node scripts/sample.js [--dry-run] [--limit N] [--refix]
// --refix re-reads stored slots whose block is more than 60 s from the slot time.
import fs from 'node:fs';
import path from 'node:path';
import { toRecord } from '../lib/block.js';
import { anchors, blockAt } from '../lib/locate.js';
import { blockFrom, errors } from '../lib/rpc.js';
import { BLOCKS_PER_SLOT, slots } from '../lib/slots.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'evidence', 'samples.jsonl');
const ANCHORS = path.join(ROOT, 'evidence', 'anchors.json');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
const PARALLEL = 8;

async function slot(t, table) {
  const blocks = [];
  let b = await blockAt(t, table);
  blocks.push(toRecord(b));
  while (blocks.length < BLOCKS_PER_SLOT) {
    b = await blockFrom(b.header.height + 1);
    blocks.push(toRecord(b));
  }
  return { t, blocks };
}

const table = await anchors(ANCHORS, { write: !dryRun });

if (args.includes('--refix')) {
  const lines = fs.readFileSync(OUT, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const off = lines.filter((r) => Math.abs(r.blocks[0].ts - r.t) >= 60_000);
  console.error(`${off.length} of ${lines.length} slots are 60 s or more from their slot time; re-reading`);
  const fixed = new Map();
  for (let i = 0; i < off.length; i += PARALLEL) {
    for (const r of await Promise.all(off.slice(i, i + PARALLEL).map((r) => slot(r.t, table)))) fixed.set(r.t, r);
    if (i % (PARALLEL * 50) === 0) console.error(new Date().toISOString(), `${i}/${off.length}`, JSON.stringify(errors));
  }
  const out = lines.map((r) => fixed.get(r.t) || r);
  const still = out.filter((r) => Math.abs(r.blocks[0].ts - r.t) >= 60_000).length;
  if (!dryRun) fs.writeFileSync(OUT, out.map((r) => JSON.stringify(r)).join('\n') + '\n');
  console.error(`done; ${still} slots still 60 s or more off`);
  process.exit(0);
}
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
