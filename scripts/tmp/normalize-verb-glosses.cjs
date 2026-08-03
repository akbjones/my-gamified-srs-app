#!/usr/bin/env node
// Verb policy: an inflected verb form shows its INFINITIVE's definition — the
// conjugation engine is what explains which form you're looking at. So कर-forms
// stop saying "having lifted; after picking up" and past forms stop carrying
// "(f. pl.)" annotations; they all read as the dictionary verb, with the lemma
// link and the conjugation table doing the grammatical work.
const fs = require('fs');
const P = 'src/data/dictionary/hi.ts';
const lines = fs.readFileSync(P, 'utf8').split('\n');
const RE = /^(\s*)(['"])([^'"]+)\2(\s*:\s*\{)(.*?)(\},?\s*)$/;
const field = (body, k) => { const m = body.match(new RegExp(`${k}:\\s*'((?:[^'\\\\]|\\\\.)*)'`)); return m ? m[1] : null; };

// pass 1 — index every headword's gloss + pos
const info = new Map();
for (const l of lines) { const m = l.match(RE); if (!m) continue; info.set(m[3], { en: field(m[5], 'en'), pos: field(m[5], 'pos') }); }

// pass 2 — rewrite verb forms that have a lemma
let changed = 0; const samples = [];
const out = lines.map(line => {
  const m = line.match(RE);
  if (!m) return line;
  const body = m[5];
  const pos = field(body, 'pos'), lemma = field(body, 'lemma'), en = field(body, 'en');
  if (pos !== 'v' || !lemma) return line;
  const base = info.get(lemma);
  if (!base || !base.en || base.en === en) return line;
  if (samples.length < 8) samples.push({ w: m[3], from: en, to: base.en, lemma });
  changed++;
  const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  return line.replace(/en:\s*'(?:[^'\\]|\\.)*'/, `en: '${esc(base.en)}'`);
});
fs.writeFileSync(P, out.join('\n'));
console.log(`verb forms re-pointed to their infinitive's gloss: ${changed}`);
for (const s of samples) console.log(`  ${s.w} (→ ${s.lemma})\n    was: ${s.from}\n    now: ${s.to}`);
