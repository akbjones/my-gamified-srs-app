// Self-test: Italian findInfinitive coverage over the full deck.
// For every verb token (per dictionary pos) in every card target:
//   lemma = entry.lemma || findInfinitive(token)
//   PASS if token === lemma OR conjugate(lemma) table contains the token
//     (lowercased; multi-word table forms are also split into single words;
//      enclitic-pronoun tokens are matched on their verb core, mirroring
//      lookupWord's own pronoun stripping)
// Also computes the "before" baseline where only entry.lemma is used.
import { readFileSync } from 'fs';
import { lookupWord } from '../../src/data/dictionary/it';
import { conjugate, findInfinitive } from '../../src/data/conjugation/it';

const deck = JSON.parse(
  readFileSync(new URL('../../src/data/italian/deck.json', import.meta.url), 'utf8'),
) as { target: string }[];

function tableContains(lemma: string, token: string): boolean {
  const table = conjugate(lemma);
  if (!table) return false;
  const t = token.toLowerCase();
  if (table.infinitive.toLowerCase() === t) return true;
  for (const forms of Object.values(table.tenses)) {
    for (const form of forms) {
      if (!form || form === '-') continue;
      const lower = form.toLowerCase();
      if (lower === t) return true;
      // multi-word forms ("ho fatto", "mi alzo"): match single words too
      if (lower.includes(' ') && lower.split(' ').includes(t)) return true;
    }
  }
  return false;
}

// Enclitic pronouns Italian attaches to infinitives/imperatives/gerunds
// (vederti, chiamami, trovarci). lookupWord strips these to resolve the
// entry; mirror that when matching against the table: the verb core must
// be a table form (or the infinitive after restoring apocope:
// veder|ti -> vedere).
const CLITICS = [
  'glielo', 'gliela', 'glieli', 'gliele', 'gliene', 'melo', 'mela', 'meli',
  'mele', 'mene', 'telo', 'tela', 'teli', 'tele', 'tene', 'selo', 'sela',
  'seli', 'sele', 'sene', 'celo', 'cela', 'celi', 'cele', 'cene', 'velo',
  'vela', 'veli', 'vele', 'vene', 'gli', 'mi', 'ti', 'ci', 'vi', 'si',
  'lo', 'la', 'li', 'le', 'ne',
];

const cache = new Map<string, boolean>();
function passes(lemma: string | null, token: string): boolean {
  if (!lemma) return false;
  const t = token.toLowerCase();
  if (t === lemma.toLowerCase()) return true;
  const key = lemma + '|' + t;
  if (!cache.has(key)) {
    let ok = tableContains(lemma, t);
    if (!ok) {
      for (const cl of CLITICS) {
        if (t.length > cl.length + 2 && t.endsWith(cl)) {
          const core = t.slice(0, -cl.length);
          if (
            tableContains(lemma, core) ||
            (/[aei]r$/.test(core) && tableContains(lemma, core + 'e'))
          ) {
            ok = true;
            break;
          }
        }
      }
    }
    cache.set(key, ok);
  }
  return cache.get(key)!;
}

let total = 0;
let passBefore = 0;
let passAfter = 0;
const failures = new Map<string, number>();
const failExamples = new Map<string, string>();

let noLemmaFails = 0; // findInfinitive's responsibility
let lemmaFails = 0;   // dict lemma exists but table can't contain token

for (const card of deck) {
  const tokens = card.target
    .replace(/[^\p{L}'’\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  for (const raw of tokens) {
    let token = raw.toLowerCase().replace(/’/g, "'");
    // Elision (c'e`, l'ho, dev'essere): the verb payload follows the apostrophe
    const apo = token.lastIndexOf("'");
    if (apo >= 0 && apo < token.length - 1) token = token.slice(apo + 1);
    if (!token) continue;
    const entry = lookupWord(token);
    if (!entry || entry.pos !== 'v') continue;
    total++;

    // BEFORE: dictionary lemma only (an infinitive token is its own lemma)
    const lemmaBefore =
      entry.lemma ?? (/(?:are|ere|ire|rsi)$/.test(token) ? token : null);
    if (lemmaBefore && passes(lemmaBefore, token)) passBefore++;

    // AFTER: lemma || findInfinitive
    const lemma = entry.lemma || findInfinitive(token);
    if (lemma && passes(lemma, token)) {
      passAfter++;
    } else {
      if (entry.lemma) lemmaFails++;
      else noLemmaFails++;
      failures.set(token, (failures.get(token) ?? 0) + 1);
      if (!failExamples.has(token)) {
        failExamples.set(
          token,
          `${entry.lemma ? 'dict:' : 'find:'}${lemma ?? 'null'} | "${card.target}"`,
        );
      }
    }
  }
}

const pct = (n: number) => ((n * 100) / total).toFixed(2) + '%';
console.log(`verb tokens: ${total}`);
console.log(`BEFORE (dictionary lemma only): ${passBefore}  ${pct(passBefore)}`);
console.log(`AFTER  (lemma || findInfinitive): ${passAfter}  ${pct(passAfter)}`);
console.log(`fails with dict lemma (table/dict gap): ${lemmaFails}`);
console.log(`fails needing findInfinitive: ${noLemmaFails}`);
console.log('\nTop failing tokens:');
const top = [...failures.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
for (const [tok, n] of top) {
  console.log(`  ${String(n).padStart(4)}  ${tok}  ->  ${failExamples.get(tok)}`);
}

// Failure class breakdown
const IMPF_SUBJ = /(?:assi|asse|assero|assimo|aste|essi|esse|essero|essimo|issi|isse|issero|issimo)$/;
function classOf(tok: string): string {
  if (IMPF_SUBJ.test(tok)) return 'imperfect-subjunctive';
  if (/(?:ando|endo)$/.test(tok)) return 'gerund';
  if (/(?:ata|ate|ati|uta|ute|uti|ita|ite|iti|tta|tte|tti|sa|se|si|sta|ste|sti)$/.test(tok)) return 'participle-agreement?';
  if (/(?:ar|er|ir)$/.test(tok)) return 'truncated-infinitive';
  if (/(?:ante|ente|anti|enti)$/.test(tok)) return 'present-participle';
  return 'other';
}
const classes: Record<string, number> = {};
for (const [tok, n] of failures) {
  const cls = classOf(tok);
  classes[cls] = (classes[cls] ?? 0) + n;
}
console.log('\nFailure classes:', classes);

const findFails = [...failures.entries()].filter(([t]) => failExamples.get(t)?.startsWith('find:'));
console.log('\nfindInfinitive-side failures:');
for (const [t, n] of findFails) console.log(`  ${n}  ${t}  ${failExamples.get(t)}`);

console.log('\nSample of "other" class failures:');
let shown = 0;
for (const [tok, n] of [...failures.entries()].sort((a, b) => b[1] - a[1])) {
  if (classOf(tok) !== 'other') continue;
  console.log(`  ${n}  ${tok}  ${failExamples.get(tok)}`);
  if (++shown >= 25) break;
}
