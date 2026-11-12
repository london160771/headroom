// Sampling check: read one block every 30 minutes over the last 30 days of the sample
// (12x denser than the 6-hour sample) into evidence/dense-30d.jsonl. scripts/build.js then
// compares the dense numbers with the sampled headline and its 90% intervals.
//   node scripts/dense.js [--dry-run] [--limit N]
// Resumable: times already in the file are skipped.
import fs from 'node:fs';
import path from 'node:path';
import { toRecord } from '../lib/block.js';
import { anchors, blockAt } from '../lib/locate.js';
import { errors } from '../lib/rpc.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'evidence', 'dense-30d.jsonl');
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity;
const STEP_MS = 30 * 60_000;
const PARALLEL = 8;

// The window ends at the newest 6-hour slot on file, so it matches the headline window.
const sampled = fs.readFileSync(path.join(ROOT, 'evidence', 'samples.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).t);
const end = Math.max(...sampled);
const times = [];
for (let t = end - 30 * 86_400_000 + STEP_MS; t <= end; t += STEP_MS) times.push(t);

const table = await anchors(path.join(ROOT, 'evidence', 'anchors.json'), { write: !dryRun });
const done = new Set(fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).t) : []);
const todo = times.filter((t) => !done.has(t)).slice(0, limit);
console.error(`window ${new Date(times[0]).toISOString()} to ${new Date(end).toISOString()}: ${done.size} on file, ${todo.length} to read${dryRun ? ' (dry run)' : ''}`);

for (let i = 0; i < todo.length; i += PARALLEL) {
  const rows = await Promise.all(todo.slice(i, i + PARALLEL).map(async (t) => ({ t, blocks: [toRecord(await blockAt(t, table))] })));
  if (dryRun) rows.forEach((r) => console.log(JSON.stringify(r)));
  else fs.appendFileSync(OUT, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  if (i % (PARALLEL * 25) === 0) console.error(new Date().toISOString(), `${i}/${todo.length}`, JSON.stringify(errors));
}
console.error('done');
