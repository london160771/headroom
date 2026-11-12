// Who fills the hot shards? For every sampled block where one shard used more than half of its
// gas limit, read that shard's chunk and count the accounts receiving its receipts and transactions.
// Output: evidence/culprits.json.
//   node scripts/culprits.js [--dry-run]
// Counts are receipts, not gas: a chunk lists receipts without per-receipt gas. They show who is
// active on the hot shard, not exact gas shares.
import fs from 'node:fs';
import path from 'node:path';
import { blocksOf, hotShardEvents } from '../lib/metrics.js';
import { errors, rpc } from '../lib/rpc.js';
import { rankAccounts } from '../lib/culprits.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'evidence', 'culprits.json');
const dryRun = process.argv.includes('--dry-run');
const PARALLEL = 6;

const rows = fs.readFileSync(path.join(ROOT, 'evidence', 'samples.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const events = hotShardEvents(blocksOf(rows), 0.5);
const old = fs.existsSync(OUT) ? new Map(JSON.parse(fs.readFileSync(OUT, 'utf8')).events.map((e) => [e.height, e])) : new Map();
console.error(`${events.length} hot-shard events, ${old.size} already read`);

const out = [];
for (let i = 0; i < events.length; i += PARALLEL) {
  out.push(...(await Promise.all(events.slice(i, i + PARALLEL).map(async (e) => {
    if (old.has(e.height)) return old.get(e.height);
    const c = await rpc('chunk', { block_id: e.height, shard_id: e.shard });
    const counts = {};
    for (const r of c.receipts) counts[r.receiver_id] = (counts[r.receiver_id] || 0) + 1;
    for (const t of c.transactions) counts[t.receiver_id] = (counts[t.receiver_id] || 0) + 1;
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return { height: e.height, ts: e.ts, shard: e.shard, use: e.use, receipts: c.receipts.length, transactions: c.transactions.length, top };
  }))));
  if (i % (PARALLEL * 20) === 0) console.error(`${i}/${events.length}`, JSON.stringify(errors));
}
const result = {
  method: 'NEAR RPC chunk {block_id, shard_id} for each sampled block with a shard over 50%; accounts ranked by receipts + transactions received',
  events: out,
  ranking: rankAccounts(out),
};
if (dryRun) console.log(JSON.stringify(result.ranking, null, 1));
else fs.writeFileSync(OUT, JSON.stringify(result) + '\n');
console.error('done');
