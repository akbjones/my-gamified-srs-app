#!/usr/bin/env node
// Add the authored base-form headwords (docs/hi-quality/headwords/out-*.json) to
// the Hindi dictionary, then restore the lemma links the audit had to drop
// because those base forms didn't exist yet — that link is what makes the
// conjugation engine reachable from an inflected form.
// Usage: node scripts/apply-hi-headwords.cjs [--check]
const fs = require('fs');
const path = require('path');
const check = process.argv.includes('--check');
const ROOT = path.join(__dirname, '..');
const P = path.join(ROOT, 'src/data/dictionary/hi.ts');
const DIR = path.join(ROOT, 'docs/hi-quality/headwords');
const AUDIT = path.join(ROOT, 'docs/hi-quality/dictverify');

const POS = new Set(['n', 'v', 'adj', 'adv', 'pron', 'postp', 'part', 'conj', 'interj', 'num']);
const DEVA = /[ऀ-ॿ]/;
const esc = s => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const RE = /^(\s*)(['"])([^'"]+)\2(\s*:\s*\{)(.*?)(\},?\s*)$/;
const field = (b, k) => { const m = b.match(new RegExp(`${k}:\\s*(['"])((?:(?!\\1)[^\\\\]|\\\\.)*)\\1`)); return m ? m[2] : null; };

const lines = fs.readFileSync(P, 'utf8').split('\n');
const headwords = new Set();
for (const l of lines) { const m = l.match(RE); if (m) headwords.add(m[3]); }

// ── collect + gate the authored entries ──────────────────────────────
const authored = new Map();
const fails = [];
let alreadyPresent = 0;
for (const f of fs.readdirSync(DIR).filter(f => /^out-\d+\.json$/.test(f))) {
  let arr;
  try { arr = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); }
  catch (e) { fails.push(`${f}: unparseable — ${e.message}`); continue; }
  for (const e of arr) {
    if (!e || !e.word) { fails.push(`${f}: entry with no word`); continue; }
    const w = String(e.word).trim();
    const en = (e.en ?? '').trim(), ipa = (e.ipa ?? '').trim(), pos = (e.pos ?? '').trim();
    // Already applied in an earlier run — skip so re-running is a no-op rather
    // than a wall of failures.
    if (headwords.has(w)) { alreadyPresent++; continue; }
    if (!DEVA.test(w)) { fails.push(`${w}: headword isn't Devanagari`); continue; }
    if (!en || DEVA.test(en)) { fails.push(`${w}: gloss empty or contains Devanagari`); continue; }
    if (!ipa) { fails.push(`${w}: empty IPA`); continue; }
    if (DEVA.test(ipa)) { fails.push(`${w}: IPA contains Devanagari (${ipa})`); continue; }
    if (/[ˈˌɑɾ]/.test(ipa)) { fails.push(`${w}: IPA breaks house style (${ipa})`); continue; }
    if (!POS.has(pos)) { fails.push(`${w}: bad pos "${pos}"`); continue; }
    // Verbs must read as infinitives — the conjugation engine explains the form.
    if (pos === 'v' && !/^to /.test(en)) { fails.push(`${w}: verb gloss not an infinitive ("${en}")`); continue; }
    if (authored.has(w)) { fails.push(`${w}: authored twice`); continue; }
    authored.set(w, { en, ipa, pos });
  }
}

if (fails.length) {
  console.error(`✗ ${fails.length} REJECTED:`);
  for (const f of fails.slice(0, 30)) console.error('  ' + f);
  if (fails.length > 30) console.error(`  … and ${fails.length - 30} more`);
}

// ── restore the lemma links now that the base forms exist ────────────
const wanted = new Map();
for (const f of fs.readdirSync(AUDIT).filter(f => /^out-\d+\.json$/.test(f)))
  for (const e of JSON.parse(fs.readFileSync(path.join(AUDIT, f), 'utf8')))
    if (e && e.word && e.lemma) wanted.set(String(e.word), String(e.lemma).trim());

const nowResolvable = new Set([...headwords, ...authored.keys()]);
let relinked = 0, stillOrphan = new Set();
const out = lines.map(line => {
  const m = line.match(RE);
  if (!m) return line;
  const word = m[3], body = m[5];
  const lemma = wanted.get(word);
  if (!lemma || field(body, 'lemma')) return line;      // no lemma wanted, or already linked
  if (!nowResolvable.has(lemma)) { stillOrphan.add(lemma); return line; }
  if (lemma === word) return line;                       // never self-link
  relinked++;
  return line.replace(m[6], `, lemma: '${esc(lemma)}' ${m[6].trimStart()}`);
});

// ── append the new headwords just before the object closes ───────────
const closeIdx = out.findIndex(l => /^};\s*$/.test(l));
if (closeIdx === -1) { console.error('could not find the end of the dictionary object'); process.exit(1); }
const block = [...authored.entries()].map(([w, e]) =>
  `  '${esc(w)}': { en: '${esc(e.en)}', ipa: '${esc(e.ipa)}', pos: '${esc(e.pos)}' },`);
out.splice(closeIdx, 0, ...block);

console.log(`headwords authored+gated: ${authored.size} | already present (skipped): ${alreadyPresent} | lemma links restored: ${relinked}`);
if (stillOrphan.size) console.log(`note: ${stillOrphan.size} lemmas still unresolvable (not authored)`);
if (fails.length) { console.error('\nrefusing to write while entries are rejected'); process.exit(1); }
if (check) { console.log('(check mode — no write)'); process.exit(0); }
fs.writeFileSync(P, out.join('\n'));
console.log('wrote', P);
