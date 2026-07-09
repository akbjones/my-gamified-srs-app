import { writeFileSync } from 'fs';
import { KNOWN_ROOTS } from '../../src/data/conjugation/id';
const candidates = ['balik','banding','bohong','lambai','lompat','mogok','sangka','sapa','tampil','tumpah'];
const dupes = candidates.filter(r => KNOWN_ROOTS.has(r));
if (dupes.length) console.log('ALREADY KNOWN (drop):', dupes.join(', '));
const roots = candidates.filter(r => !KNOWN_ROOTS.has(r)).sort();
writeFileSync('scripts/tmp/wave5-roots-A.json', JSON.stringify(roots) + '\n');
console.log('wrote wave5-roots-A.json:', roots.join(', '));
