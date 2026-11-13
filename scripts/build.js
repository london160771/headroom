// Build the page data from evidence/: web/public/data/headroom.json.
//   node scripts/build.js
// All formulas live in lib/; this file only reads evidence and writes the result.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildReport } from '../lib/report.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const file = (...p) => path.join(ROOT, ...p);
const jsonl = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const maybe = (f, parse) => (fs.existsSync(f) ? parse(f) : null);
export const sha256 = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

const report = buildReport({
  rows: jsonl(file('evidence', 'samples.jsonl')),
  nb: JSON.parse(fs.readFileSync(file('evidence', 'nearblocks-daily.json'), 'utf8')),
  denseRows: maybe(file('evidence', 'dense-30d.jsonl'), jsonl),
  culprits: maybe(file('evidence', 'culprits.json'), (f) => JSON.parse(fs.readFileSync(f, 'utf8'))),
  predictions: maybe(file('predictions', 'predictions.json'), (f) => JSON.parse(fs.readFileSync(f, 'utf8'))),
  predictionsSha256: maybe(file('predictions', 'predictions.json'), sha256),
  protocol: maybe(file('evidence', 'protocol.json'), (f) => JSON.parse(fs.readFileSync(f, 'utf8'))),
  scenarios: maybe(file('evidence', 'scenarios.json'), (f) => JSON.parse(fs.readFileSync(f, 'utf8'))),
});
const nb = JSON.parse(fs.readFileSync(file('evidence', 'nearblocks-daily.json'), 'utf8'));
report.sources = {
  samples: 'evidence/samples.jsonl (NEAR mainnet archival RPC, scripts/sample.js)',
  dense: report.dense_check ? 'evidence/dense-30d.jsonl (scripts/dense.js)' : null,
  culprits: report.culprits ? 'evidence/culprits.json (scripts/culprits.js)' : null,
  protocol: report.protocol ? 'evidence/protocol.json (scripts/protocol.js)' : null,
  scenarios: 'evidence/scenarios.json (HSP-029, typed from the sources it lists)',
  nearblocks: `evidence/nearblocks-daily.json (${nb.source}, fetched ${nb.fetched_at})`,
  predictions: report.predictions ? 'predictions/predictions.json (frozen; SHA-256 in predictions/SHA256)' : null,
};

const out = file('web', 'public', 'data', 'headroom.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(report, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 1) + '\n');

const pc = (x) => `${(x * 100).toFixed(2)}%`;
const r = report.recent;
const iv = report.intervals;
console.log(`${report.sampling.blocks} blocks, ${report.sampling.first.slice(0, 10)} to ${report.sampling.last.slice(0, 10)}`);
console.log(`last 30 days: use ${pc(r.use)} [${pc(iv.use[0])}, ${pc(iv.use[1])}], busiest shard ${r.busiest.shard} p95 ${pc(r.busiest.p95)} [${pc(iv.busiestP95[0])}, ${pc(iv.busiestP95[1])}]`);
console.log(`fee x${r.feeMultiple.toFixed(0)} [${iv.feeMultiple.map((x) => x.toFixed(0)).join(', ')}], shard x${r.shardMultiple.toFixed(0)} [${iv.shardMultiple.map((x) => x.toFixed(0)).join(', ')}], at floor ${pc(r.atFloor)}`);
console.log(`peak month ${report.peak_month.month}: ${pc(report.peak_month.use)}; hot-shard events ${report.hot_shard_events.length}; above floor ${report.above_floor_blocks}; congested blocks ${report.congestion.congestedBlocks}`);
const e = report.economics;
if (e) console.log(`economics: ${e.blocksPerDay.toFixed(0)} blocks/day, burn ${e.burnPerTgasNear.toExponential(3)} NEAR/Tgas, minted ${e.issuance.mintedPerYear.toFixed(0)} NEAR/yr (${pc(e.issuance.ratePerYear)}), burn covers ${pc(e.coverageToday)} today, ${pc(e.coverageAtTrigger)} at 50%, ${pc(e.coverageFull)} full; load needed x${e.loadNeeded.toFixed(0)}`);
if (e?.hsp029) console.log(`burn rule since ${e.burnRule?.since} (${e.burnRule?.blocks} blocks): ${e.burnPerTgasNear.toExponential(3)} NEAR/Tgas vs last year ${e.burnPerTgasLastYear.toExponential(3)}; HSP-029: covers ${pc(e.hsp029.coverageToday)}, load needed x${e.hsp029.loadNeeded.toFixed(0)}, fits before fees move: ${e.hsp029.fitsBeforeFeesMove}`);
if (report.dense_check) console.log('dense check:', JSON.stringify(report.dense_check));
if (report.predictions) for (const p of report.predictions.scored) console.log(`${p.id} ${p.status} (${p.metric} ${p.value_so_far ?? '-'} ${p.op} ${p.value})`);
