import { conjugate } from '../src/data/conjugation/pt';

const table = conjugate('ter');
if (!table) { console.log('FAIL: ter returned null'); process.exit(1); }

const presentKey = Object.keys(table.tenses).find(k => /Presente/i.test(k));
if (!presentKey) { console.log('FAIL: no Presente'); process.exit(1); }
const present = table.tenses[presentKey];
console.log(`Present forms for "ter": [${present.join(', ')}]`);

const strict = (s: string) => s.toLowerCase().replace(/\s+/g, '');
const loose = (s: string) => strict(s).normalize('NFD').replace(/[̀-ͯ]/g, '');

const rawToken = 'tem';
const sT = strict(rawToken), lT = loose(rawToken);
let idx = present.findIndex(f => f && f !== '-' && strict(f) === sT);
if (idx === -1) idx = present.findIndex(f => f && f !== '-' && loose(f) === lT);

const personLabels = ['eu','tu','ele','nós','vós','eles'];
console.log(`Matched row (new algo): ${idx}  →  ${personLabels[idx]} ${present[idx]}`);

const oldMatches: number[] = [];
present.forEach((f, i) => { if (f && f !== '-' && loose(f) === lT) oldMatches.push(i); });
console.log(`Old algo would match: [${oldMatches.join(',')}] → [${oldMatches.map(i=>personLabels[i] + ' ' + present[i]).join(', ')}]`);

console.log();
if (idx === 2) console.log('✓ PASS — strict-first picks only "ele tem" (3sg)');
else { console.log(`✗ FAIL — expected row 2 (ele), got row ${idx}`); process.exit(1); }
if (oldMatches.length >= 2) console.log('✓ CONFIRMED — old algorithm would have double-highlighted (this is the bug we fixed)');
