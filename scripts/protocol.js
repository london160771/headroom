// Read NEAR's economic protocol parameters and find when the gas-burn rule last changed.
// Output: evidence/protocol.json.
//   node scripts/protocol.js [--dry-run]
// burnt_gas_reward is the share of gas fees paid to the called contract instead of burned.
// It was 3/10 for years; the archival bisection below finds the block where it changed.
import fs from 'node:fs';
import path from 'node:path';
import { burnShare, findChange } from '../lib/protocol.js';
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
const tip = (await rpc('block', { finality: 'final' })).header;
const now = await config();
const found = await findChange({
  config: (h) => (h === tip.height ? Promise.resolve(now) : config(h)),
  tipHeight: tip.height,
  pick: (c) => c.burnt_gas_reward,
});
let change = null;
if (found) {
  const b = await rpc('block', { block_id: found.firstHeight });
  change = {
    param: 'burnt_gas_reward', from: found.from, to: found.to,
    first_height: found.firstHeight, ts: Number(BigInt(b.header.timestamp) / 1_000_000n),
    protocol_version: (await config(found.firstHeight)).protocol_version,
  };
}
const out = {
  source: 'NEAR RPC EXPERIMENTAL_protocol_config (live and archival, bisected)',
  fetched_at: new Date().toISOString(),
  tip_height: tip.height,
  now: { ...now, burn_share: burnShare(now.burnt_gas_reward), max_inflation: ratio(now.max_inflation_rate) },
  burn_rule_change: change,
};
console.log(JSON.stringify(out, null, 1));
if (!dryRun) fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
