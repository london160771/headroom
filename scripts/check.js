// Re-check the evidence: re-read K random sampled blocks from the chain and compare
// every stored field with evidence/samples.jsonl. Exit 1 on any mismatch.
//   node scripts/check.js [--k 20]
import fs from 'node:fs';
import path from 'node:path';
import { toRecord } from '../lib/block.js';
import { rpc } from '../lib/rpc.js';
import { diffRecord } from '../lib/verify.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const args = process.argv.slice(2);
const k = args.includes('--k') ? Number(args[args.indexOf('--k') + 1]) : 20;
const stored = fs.readFileSync(path.join(ROOT, 'evidence', 'samples.jsonl'), 'utf8').split('\n').filter(Boolean)
  .flatMap((l) => JSON.parse(l).blocks);

const picks = [];
while (picks.length < Math.min(k, stored.length)) {
  const r = stored[Math.floor(Math.random() * stored.length)];
  if (!picks.includes(r)) picks.push(r);
}

let bad = 0;
for (const want of picks) {
  const got = toRecord(await rpc('block', { block_id: want.height }));
  const diff = diffRecord(got, want);
  const same = diff.length === 0;
  if (!same) bad++;
  console.log(`${same ? 'OK  ' : 'DIFF'} block ${want.height} ${new Date(want.ts).toISOString().slice(0, 16)} gas ${want.used.join(',')}${same ? '' : `\n     fields: ${diff.join(', ')}\n     chain: ${JSON.stringify(got)}\n     file:  ${JSON.stringify(want)}`}`);
}
console.log(bad ? `${bad} of ${picks.length} blocks differ from evidence/` : `${picks.length} of ${picks.length} random blocks match evidence/ exactly`);
process.exit(bad ? 1 : 0);
