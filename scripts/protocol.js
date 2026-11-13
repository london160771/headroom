// Read NEAR's economic protocol parameters and find when the gas-burn rule last changed.
// Output: evidence/protocol.json.
//   node scripts/protocol.js [--dry-run]
// burnt_gas_reward is the share of gas fees paid to the called contract instead of burned.
// It was 3/10 for years; the archival bisection below finds the block where it changed.
import fs from 'node:fs';
import path from 'node:path';
import { rpc } from '../lib/rpc.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'evidence', 'protocol.json');
const dryRun = process.argv.includes('--dry-run');
const ratio = ([n, d]) => n / d;

async function config(blockId) {
  const c = await rpc('EXPERIMENTAL_protocol_config', blockId ? { block_id: blockId } : { finality: 'final' });
  return {
    protocol_version: c.protocol_version,
    max_inflation_rate: c.max_inflation_rate,
    burnt_gas_reward: c.runtime_config.transaction_costs.burnt_gas_reward,
    protocol_reward_rate: c.protocol_reward_rate,
  };
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const tip = (await rpc('block', { finality: 'final' })).header;
const now = await config();
// Walk back 1M heights at a time until the burn rule differs, then bisect to the first new block.
let hi = tip.height;
let lo = null;
for (let k = 1; k <= 40; k++) {
  const h = tip.height - k * 1_000_000;
  const c = await config(h).catch(() => null);
  if (c && !same(c.burnt_gas_reward, now.burnt_gas_reward)) { lo = h; break; }
  hi = h;
}
let change = null;
if (lo) {
  const before = (await config(lo)).burnt_gas_reward;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    const c = await config(mid).catch(() => null);
    if (c && same(c.burnt_gas_reward, now.burnt_gas_reward)) hi = mid; else lo = mid;
  }
  const b = await rpc('block', { block_id: hi });
  change = {
    param: 'burnt_gas_reward', from: before, to: now.burnt_gas_reward,
    first_height: hi, ts: Number(BigInt(b.header.timestamp) / 1_000_000n),
    protocol_version: (await config(hi)).protocol_version,
  };
}
const out = {
  source: 'NEAR RPC EXPERIMENTAL_protocol_config (live and archival, bisected)',
  fetched_at: new Date().toISOString(),
  tip_height: tip.height,
  now: { ...now, burn_share: 1 - ratio(now.burnt_gas_reward), max_inflation: ratio(now.max_inflation_rate) },
  burn_rule_change: change,
};
console.log(JSON.stringify(out, null, 1));
if (!dryRun) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
