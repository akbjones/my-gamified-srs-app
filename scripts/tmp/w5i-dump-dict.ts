// Dump existing dict entries for slice-I covered tokens
import { readFileSync, writeFileSync } from 'fs';
const src = readFileSync('src/data/dictionary/id.ts', 'utf8');
const body = src.slice(src.indexOf('const DICT'), src.indexOf('export function lookupWord'));
const entries: Record<string, any> = {};
const re = /^\s{2}['"]([^'"]+)['"]:\s*\{([^}]*)\},?\s*$/gm;
let m;
while ((m = re.exec(body))) {
  const obj: any = {};
  const inner = m[2];
  for (const f of ['en', 'ipa', 'pos', 'lemma']) {
    const fm = inner.match(new RegExp(`${f}:\\s*'((?:[^'\\\\]|\\\\.)*)'`));
    if (fm) obj[f] = fm[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\');
  }
  if (obj.en !== undefined) entries[m[1]] = obj;
}
console.log('parsed entries:', Object.keys(entries).length);
const toks = readFileSync('scripts/tmp/w5i-my-tokens.txt', 'utf8').split('\n').filter(Boolean);
const out: Record<string, any> = {};
const miss: string[] = [];
for (const t of toks) {
  if (entries[t]) out[t] = entries[t];
  else miss.push(t);
}
writeFileSync('scripts/tmp/w5i-dict-reused.json', JSON.stringify(out, null, 1));
console.log('reused:', Object.keys(out).length, 'still missing:', miss.length);
