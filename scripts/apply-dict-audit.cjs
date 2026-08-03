#!/usr/bin/env node
// Apply the verified Hindi dictionary corrections (docs/hi-quality/dictverify).
// Rewrites each entry line in place so the file's shape/ordering is preserved.
// Gates every value before writing: English-only gloss, valid pos, non-empty
// IPA in house style, lemma must resolve to a real headword.
// Usage: node scripts/apply-dict-audit.cjs [--check]
const fs = require('fs');
const path = require('path');
const check = process.argv.includes('--check');
const P = path.join(__dirname, '..', 'src/data/dictionary/hi.ts');
const DIR = path.join(__dirname, '..', 'docs/hi-quality/dictverify');

const ver = new Map();
for (const f of fs.readdirSync(DIR).filter(f => /^out-\d+\.json$/.test(f)))
  for (const e of JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')))
    if (e && e.word) ver.set(e.word, e);

const POS = new Set(['n', 'v', 'adj', 'adv', 'pron', 'postp', 'part', 'conj', 'interj', 'num']);
const lines = fs.readFileSync(P, 'utf8').split('\n');
// entry line, either quote style
const RE = /^(\s*)(['"])([^'"]+)\2(\s*:\s*\{)(.*?)(\},?\s*)$/;
const headwords = new Set();
for (const l of lines) { const m = l.match(RE); if (m) headwords.add(m[3]); }

const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const fails = [];
const missingHeadwords = new Set();
let changed = 0, untouched = 0;

const out = lines.map(line => {
  const m = line.match(RE);
  if (!m) return line;
  const word = m[3];
  const e = ver.get(word);
  if (!e) return line;

  const en = (e.en ?? '').trim();
  const ipa = (e.ipa ?? '').trim();
  const pos = (e.pos ?? '').trim();
  let lemma = e.lemma ? String(e.lemma).trim() : '';

  if (!en || /[ऀ-ॿ]/.test(en)) { fails.push(`${word}: gloss empty or contains Devanagari`); return line; }
  if (!ipa) { fails.push(`${word}: empty IPA`); return line; }
  if (/[ˈˌɑɾ]/.test(ipa)) { fails.push(`${word}: IPA breaks house style (${ipa})`); return line; }
  if (!POS.has(pos)) { fails.push(`${word}: bad pos "${pos}"`); return line; }
  // A lemma pointing at a word the dictionary doesn't define would render as a
  // dead "→ x" link, so drop just the lemma and keep the gloss/IPA/pos fixes.
  // (These are real gaps — the base forms are missing entirely; logged below.)
  if (lemma && !headwords.has(lemma)) { missingHeadwords.add(lemma); lemma = ''; }

  const body = ` en: '${esc(en)}', ipa: '${esc(ipa)}', pos: '${esc(pos)}'${lemma ? `, lemma: '${esc(lemma)}'` : ''} `;
  const rebuilt = `${m[1]}'${word}'${m[4]}${body}${m[6]}`;
  if (rebuilt === line) { untouched++; return line; }
  changed++;
  return rebuilt;
});

console.log(`hindi dict: ${ver.size} verified corrections | ${changed} lines rewritten | ${untouched} already matching`);
if (missingHeadwords.size) {
  console.log(`note: ${missingHeadwords.size} lemmas dropped — those base forms aren't in the dictionary yet`);
  fs.writeFileSync(path.join(__dirname, '..', 'docs/hi-quality/missing-headwords.json'), JSON.stringify([...missingHeadwords], null, 1));
}
if (fails.length) {
  console.error(`\n✗ ${fails.length} REJECTED (left untouched):`);
  for (const f of fails.slice(0, 25)) console.error('  ' + f);
  if (fails.length > 25) console.error(`  … and ${fails.length - 25} more`);
}
if (check) { console.log('(check mode — no write)'); process.exit(0); }
fs.writeFileSync(P, out.join('\n'));
console.log('wrote', P);
