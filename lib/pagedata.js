// Read evidence/ from disk and build the page data. Shared by scripts/build.js (writes it),
// scripts/verify.js and the tests (compare it with the committed file byte for byte).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildReport } from './report.js';

export const sha256File = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

export function pageData(root) {
  const file = (...p) => path.join(root, ...p);
  const json = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
  const jsonl = (f) => fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  const maybe = (f, parse) => (fs.existsSync(f) ? parse(f) : null);
  const nb = json(file('evidence', 'nearblocks-daily.json'));
  const report = buildReport({
    rows: jsonl(file('evidence', 'samples.jsonl')),
    nb,
    denseRows: maybe(file('evidence', 'dense-30d.jsonl'), jsonl),
    culprits: maybe(file('evidence', 'culprits.json'), json),
    predictions: maybe(file('predictions', 'predictions.json'), json),
    predictionsSha256: maybe(file('predictions', 'predictions.json'), sha256File),
    protocol: maybe(file('evidence', 'protocol.json'), json),
    scenarios: maybe(file('evidence', 'scenarios.json'), json),
  });
  report.sources = {
    samples: 'evidence/samples.jsonl (NEAR mainnet archival RPC, scripts/sample.js)',
    dense: report.dense_check ? 'evidence/dense-30d.jsonl (scripts/dense.js)' : null,
    culprits: report.culprits ? 'evidence/culprits.json (scripts/culprits.js)' : null,
    protocol: report.protocol ? 'evidence/protocol.json (scripts/protocol.js)' : null,
    scenarios: 'evidence/scenarios.json (HSP-029, typed from the sources it lists)',
    nearblocks: `evidence/nearblocks-daily.json (${nb.source}, fetched ${nb.fetched_at})`,
    predictions: report.predictions ? 'predictions/predictions.json (frozen; SHA-256 in predictions/SHA256)' : null,
  };
  const text = JSON.stringify(report, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 1) + '\n';
  return { report: JSON.parse(text), text };
}
