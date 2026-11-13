// One command, one answer: is everything Headroom publishes what its evidence says?
//   npm run verify             (offline checks + the NEAR mainnet anchors)
//   npm run verify -- --offline
// Prints one line per check and ends with ALL OK, or with the number of failures (exit 1).
import fs from 'node:fs';
import path from 'node:path';
import { compare, published, recompute } from '../lib/independent.js';
import { MANIFEST, manifestMismatches } from '../lib/manifest.js';
import { anchorTx, mainnetReachable, viewAnchor } from '../lib/nearproof.js';
import { pageData, sha256File } from '../lib/pagedata.js';
import { renderThesis, withFindings } from '../lib/thesis.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const file = (...p) => path.join(ROOT, ...p);
const read = (f) => fs.readFileSync(file(f), 'utf8');
const jsonl = (f) => read(f).split('\n').filter(Boolean).map((l) => JSON.parse(l));
const offline = process.argv.includes('--offline');

let failed = 0;
let skipped = null;
const line = (ok, text) => {
  if (!ok) failed++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${text}`);
};
const info = (text) => console.log(`     ${text}`);

console.log('1. Files match evidence/MANIFEST.sha256');
for (const m of manifestMismatches(ROOT)) line(m.ok, m.file);
const manifestHash = sha256File(file(MANIFEST));
info(`SHA-256 of the manifest: ${manifestHash}`);

console.log('2. Frozen predictions');
line(sha256File(file('predictions', 'predictions.json')) === read('predictions/SHA256').trim().split(/\s+/)[0], 'predictions/predictions.json matches predictions/SHA256');

console.log('3. Page data rebuilds from evidence/, byte for byte');
const { text, report } = pageData(ROOT);
line(text === read('web/public/data/headroom.json'), 'web/public/data/headroom.json');
line(renderThesis(report) === read('THESIS.md'), 'THESIS.md');
line(withFindings(read('README.md'), report) === read('README.md'), 'README findings table');

console.log('4. Headline numbers recomputed a second way (lib/independent.js shares no code with lib/report.js)');
const mine = recompute({
  rows: jsonl('evidence/samples.jsonl'),
  dense: fs.existsSync(file('evidence', 'dense-30d.jsonl')) ? jsonl('evidence/dense-30d.jsonl') : [],
  protocol: JSON.parse(read('evidence/protocol.json')),
  scenarios: JSON.parse(read('evidence/scenarios.json')),
});
for (const c of compare(mine, published(report))) line(c.ok, `${c.key} = ${c.published}${c.ok ? '' : ` (independent: ${c.independent})`}`);

console.log('5. Hashes anchored on NEAR mainnet');
const proofFile = file('proof', 'near-mainnet.json');
if (offline) info('skipped (--offline)');
else if (!fs.existsSync(proofFile)) info('no anchors recorded yet (proof/near-mainnet.json)');
else if (!(await mainnetReachable())) {
  // A sandbox without network is not a failed check: say plainly what was not checked.
  skipped = 'NEAR mainnet RPC unreachable from here, so the anchors were not checked';
  info(`skipped: ${skipped}`);
} else {
  const proof = JSON.parse(fs.readFileSync(proofFile, 'utf8'));
  for (const a of proof.anchors) {
    const onChain = await viewAnchor(proof.contract, a.sha256).catch((e) => ({ error: e.message }));
    line(onChain?.sha256 === a.sha256, `${proof.contract} get(${a.sha256.slice(0, 12)}…): ${onChain?.error ?? (onChain ? `block ${onChain.block_height}, ${new Date(onChain.timestamp_ms).toISOString()}, "${onChain.label}"` : 'not found')}`);
    const tx = await anchorTx(proof.contract, a.tx).catch((e) => ({ error: e.message }));
    line(tx?.succeeded && tx.sha256 === a.sha256 && tx.receiver === proof.contract, `transaction ${a.tx} carries that hash${tx?.error ? `: ${tx.error}` : ''}`);
  }
  const current = proof.anchors.some((a) => a.sha256 === manifestHash);
  info(current
    ? 'the current evidence/MANIFEST.sha256 is the one anchored on NEAR'
    : `evidence has been refreshed since the last anchor; check out commit ${proof.anchors.at(-1).commit} to verify that snapshot`);
}

console.log(failed ? `\n${failed} check(s) FAILED` : `\nALL OK${skipped ? ` (${skipped})` : ''}`);
process.exit(failed ? 1 : 0);
