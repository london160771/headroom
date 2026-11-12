// Save the NearBlocks daily chart series (a third-party indexer) for the Gate 0 cross-check.
//   node scripts/nearblocks.js
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const URL_ = 'https://api.nearblocks.io/v1/charts';
const res = await fetch(URL_);
if (!res.ok) throw new Error(`NearBlocks ${res.status}`);
const { charts } = await res.json();
const rows = charts.map((c) => ({
  date: c.date.slice(0, 10),
  gas_used: c.gas_used, // gas units, as a decimal string
  blocks: Number(c.blocks),
  txns: Number(c.txns),
  active_accounts: Number(c.active_accounts),
}));
const out = { source: URL_, fetched_at: new Date().toISOString(), rows };
fs.writeFileSync(path.join(ROOT, 'evidence', 'nearblocks-daily.json'), JSON.stringify(out) + '\n');
console.error(`${rows.length} days, ${rows[0].date} to ${rows.at(-1).date}`);
