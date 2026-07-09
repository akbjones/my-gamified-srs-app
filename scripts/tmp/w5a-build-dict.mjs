import { readFileSync, writeFileSync } from 'fs';
const src = readFileSync('src/data/dictionary/id.ts','utf8');
// extract entries
const entries = {};
const re = /^\s{2}(?:'([^']+)'|"([^"]+)"):\s*\{\s*(.*?)\s*\},?\s*$/gm;
let m;
while ((m = re.exec(src))) {
  const key = m[1] ?? m[2];
  const body = m[3];
  const obj = {};
  const fre = /(en|ipa|pos|lemma):\s*'((?:[^'\\]|\\.)*)'/g;
  let f;
  while ((f = fre.exec(body))) obj[f[1]] = f[2].replace(/\\'/g,"'").replace(/\\\\/g,'\\');
  entries[key] = obj;
}
console.log('parsed dict entries:', Object.keys(entries).length);
const toks = readFileSync('scripts/tmp/w5a-tokens-all.txt','utf8').split('\n').filter(Boolean);
const covered = {};
const missing = [];
for (const t of toks) {
  if (entries[t]) covered[t] = entries[t]; else missing.push(t);
}
writeFileSync('scripts/tmp/w5a-covered.json', JSON.stringify(covered, null, 1));
console.log('covered:', Object.keys(covered).length, 'missing:', missing.length);
// which lemma bases referenced by covered entries
