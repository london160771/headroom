// evidence/MANIFEST.sha256: one SHA-256 per input and output file, in `sha256sum` format with
// paths from the repo root, so `sha256sum -c evidence/MANIFEST.sha256` works anywhere.
// The SHA-256 of the manifest itself is the single hash that is anchored on NEAR mainnet.
import fs from 'node:fs';
import path from 'node:path';
import { sha256File } from './pagedata.js';

export const MANIFEST = 'evidence/MANIFEST.sha256';
export const MANIFEST_FILES = [
  'evidence/samples.jsonl',
  'evidence/dense-30d.jsonl',
  'evidence/culprits.json',
  'evidence/protocol.json',
  'evidence/scenarios.json',
  'evidence/nearblocks-daily.json',
  'evidence/anchors.json',
  'predictions/predictions.json',
  'web/public/data/headroom.json',
];

export function manifestText(root) {
  return MANIFEST_FILES.filter((f) => fs.existsSync(path.join(root, f)))
    .map((f) => `${sha256File(path.join(root, f))}  ${f}`)
    .join('\n') + '\n';
}

/** Lines of the committed manifest whose file no longer has that hash. */
export function manifestMismatches(root) {
  const text = fs.readFileSync(path.join(root, MANIFEST), 'utf8');
  return text.split('\n').filter(Boolean).map((line) => {
    const [hash, file] = line.split(/\s+/);
    const actual = fs.existsSync(path.join(root, file)) ? sha256File(path.join(root, file)) : null;
    return { file, ok: actual === hash };
  });
}
