// Write THESIS.md and the README findings table from web/public/data/headroom.json.
//   node scripts/thesis.js
import fs from 'node:fs';
import path from 'node:path';
import { renderThesis, withFindings } from '../lib/thesis.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const d = JSON.parse(fs.readFileSync(path.join(ROOT, 'web', 'public', 'data', 'headroom.json'), 'utf8'));
fs.writeFileSync(path.join(ROOT, 'THESIS.md'), renderThesis(d));
const readme = path.join(ROOT, 'README.md');
fs.writeFileSync(readme, withFindings(fs.readFileSync(readme, 'utf8'), d));
console.log(`THESIS.md and README findings written (data as of ${d.data_as_of})`);
