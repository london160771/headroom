// Build the page data from evidence/: web/public/data/headroom.json.
//   node scripts/build.js
import fs from 'node:fs';
import path from 'node:path';
import { blocksOf, crossCheck, floorPrice, hotShardEvents, monthly, priceRises, recent } from '../lib/metrics.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, 'evidence', f), 'utf8');

const rows = read('samples.jsonl').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const blocks = blocksOf(rows);
const nb = JSON.parse(read('nearblocks-daily.json'));
const floor = floorPrice(blocks);
const last = blocks.at(-1);

const out = {
  generated_at: new Date().toISOString(),
  sources: {
    samples: 'evidence/samples.jsonl (NEAR mainnet archival RPC, scripts/sample.js)',
    nearblocks: `evidence/nearblocks-daily.json (${nb.source}, fetched ${nb.fetched_at})`,
  },
  sampling: {
    slots: rows.length,
    blocks: blocks.length,
    first: new Date(blocks[0].ts).toISOString(),
    last: new Date(last.ts).toISOString(),
    rule: 'one block every 6 hours (UTC) since 2023-01-01',
  },
  floor_gas_price: floor.toString(),
  chunk_gas_limit_tgas: Math.max(...rows.at(-1).blocks[0].limit) / 1000,
  recent: recent(blocks, last.ts, 30, floor),
  monthly: monthly(blocks, floor),
  peak_month: monthly(blocks, floor).reduce((a, b) => (b.use > a.use ? b : a)),
  hot_shard_events: hotShardEvents(blocks, 0.5),
  above_floor_blocks: blocks.filter((b) => b.gasPrice !== floor).length,
  price_rises: priceRises(blocks, floor),
  cross_check: crossCheck(blocks, nb.rows),
  nearblocks_monthly_txns: Object.entries(
    nb.rows.reduce((m, r) => ((m[r.date.slice(0, 7)] = (m[r.date.slice(0, 7)] || 0) + r.txns), m), {}),
  ).filter(([m]) => m >= '2023-01').map(([month, txns]) => ({ month, txns })),
};

const file = path.join(ROOT, 'web', 'public', 'data', 'headroom.json');
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
const r = out.recent;
console.log(`${out.sampling.blocks} blocks, ${out.sampling.first.slice(0, 10)} to ${out.sampling.last.slice(0, 10)}`);
console.log(`last 30 days: use ${(r.use * 100).toFixed(2)}%, busiest shard ${r.busiest.shard} p95 ${(r.busiest.p95 * 100).toFixed(2)}%, fee x${r.feeMultiple?.toFixed(0)}, shard x${r.shardMultiple?.toFixed(0)}, at floor ${(r.atFloor * 100).toFixed(1)}%`);
console.log(`peak month ${out.peak_month.month}: ${(out.peak_month.use * 100).toFixed(2)}%; hot-shard events ${out.hot_shard_events.length}; blocks above floor ${out.above_floor_blocks}`);
