// Write evidence/MANIFEST.sha256 (see lib/manifest.js) and print its own SHA-256.
//   node scripts/manifest.js
import fs from 'node:fs';
import path from 'node:path';
import { MANIFEST, manifestText } from '../lib/manifest.js';
import { sha256File } from '../lib/pagedata.js';

const ROOT = path.resolve(import.meta.dirname, '..');
fs.writeFileSync(path.join(ROOT, MANIFEST), manifestText(ROOT));
console.log(`${MANIFEST} written; its SHA-256: ${sha256File(path.join(ROOT, MANIFEST))}`);
