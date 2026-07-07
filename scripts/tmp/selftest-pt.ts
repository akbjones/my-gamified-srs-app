/**
 * Self-test for the Portuguese findInfinitive implementation.
 * Iterates every card target token in the PT deck; for verb tokens
 * (per the dictionary), resolves a lemma via entry.lemma || findInfinitive
 * and checks the lemma's conjugation table contains the token.
 *
 * Run: npx tsx scripts/tmp/selftest-pt.ts
 */
import deck from '../../src/data/portuguese/deck.json';
import { lookupWord } from '../../src/data/dictionary/pt';
import { conjugate, findInfinitive } from '../../src/data/conjugation/pt';

interface Card { target: string }

function cleanToken(tok: string): string {
  return tok
    .toLowerCase()
    .replace(/[¿¡.,!?;:"“”‘’'()«»…\d/]/g, '')
    .replace(/^-+|-+$/g, '');
}

// Cache conjugation tables per lemma
const tableCache = new Map<string, Set<string> | null>();
function formsOf(lemma: string): Set<string> | null {
  if (tableCache.has(lemma)) return tableCache.get(lemma)!;
  const t = conjugate(lemma);
  if (!t) {
    tableCache.set(lemma, null);
    return null;
  }
  const set = new Set<string>();
  for (const forms of Object.values(t.tenses)) {
    for (const form of forms) {
      const lf = form.toLowerCase();
      if (!lf || lf === '-') continue;
      set.add(lf);
      // split multi-word / alternative forms ("vamos/vamo", "se levanta")
      for (const piece of lf.split(/[\s/]+/)) {
        if (piece && piece !== '-') set.add(piece);
      }
    }
  }
  tableCache.set(lemma, set);
  return set;
}

function gerundOf(inf: string): string {
  if (inf === 'pôr') return 'pondo';
  if (inf.endsWith('por')) return inf.slice(0, -1) + 'ndo';
  if (inf.endsWith('ar')) return inf.slice(0, -2) + 'ando';
  if (inf.endsWith('er')) return inf.slice(0, -2) + 'endo';
  if (inf.endsWith('ir')) return inf.slice(0, -2) + 'indo';
  return inf;
}

// Clitic-attached tokens (trata-se, recebê-los, far-se-á): the tappable
// verb form is the part without the pronoun. Generate the variants the
// popover would highlight against the table.
const CLITICS = new Set(['se', 'me', 'te', 'nos', 'vos', 'lhe', 'lhes',
  'o', 'a', 'os', 'as', 'lo', 'la', 'los', 'las', 'no', 'na', 'nas']);
function tokenVariants(token: string): string[] {
  const out = [token];
  if (!token.includes('-')) return out;
  const parts = token.split('-');
  // mesoclisis: far-se-á → fará
  if (parts.length === 3 && CLITICS.has(parts[1])) out.push(parts[0] + parts[2]);
  if (CLITICS.has(parts[parts.length - 1])) {
    let vp = parts.slice(0, -1).join('-');
    // nós form drops -s before "nos": reservamo-nos → reservamos
    if (parts[parts.length - 1] === 'nos' && vp.endsWith('mo')) vp += 's';
    out.push(vp);
    // truncated infinitive before l-clitics: buscá-la → buscar, ouvi-lo → ouvir
    const de = vp.replace(/á$/, 'a').replace(/ê$/, 'e').replace(/ô$/, 'o');
    if (de !== vp) out.push(de + 'r');
    if (/i$/.test(vp)) out.push(vp + 'r');
  }
  return out;
}

function passes(token: string, lemma: string | null): boolean {
  if (!lemma) return false;
  const l = lemma.toLowerCase();
  const set = formsOf(l);
  for (const v of tokenVariants(token)) {
    if (v === l) return true;
    if (set && set.has(v)) return true;
  }
  return false;
}

// Supplementary: gerund forms are real verb forms but not table rows.
function passesWithGerund(token: string, lemma: string | null): boolean {
  if (!lemma) return false;
  if (passes(token, lemma)) return true;
  return token === gerundOf(lemma.toLowerCase());
}

// Extended check: is the token a real form of the lemma that the 8-tense
// table simply does not render? (imperfect/future subjunctive, pluperfect,
// personal infinitive, gerund, participle gender/number agreement)
function extendedForms(lemma: string): Set<string> {
  const set = new Set<string>();
  set.add(gerundOf(lemma));
  const t = conjugate(lemma);
  if (t) {
    const pretLabel = Object.keys(t.tenses).find(k => k.startsWith('Pretérito'));
    const pret3pl = pretLabel ? t.tenses[pretLabel][5]?.toLowerCase() : '';
    if (pret3pl && pret3pl.endsWith('ram')) {
      const base = pret3pl.slice(0, -3); // tiveram → tive
      for (const s of ['sse', 'sses', 'ssem', 'ssemos', 'r', 'res', 'rmos', 'rem', 'ra', 'ras', 'ram', 'ramos']) {
        set.add(base + s);
      }
      // accented nós forms: tivéssemos / tivéramos (approximate: skip accent)
    }
    const ppLabel = Object.keys(t.tenses).find(k => k.startsWith('Particípio'));
    const pp = ppLabel ? t.tenses[ppLabel][2]?.toLowerCase() : '';
    if (pp && pp.endsWith('o')) {
      set.add(pp + 's');
      set.add(pp.slice(0, -1) + 'a');
      set.add(pp.slice(0, -1) + 'as');
    }
  }
  // personal infinitive
  for (const s of ['mos', 'es', 'em', 'des']) set.add(lemma + s);
  return set;
}

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

const cards = deck as unknown as Card[];
let verbTokens = 0;
let passBefore = 0; // entry.lemma only
let passAfter = 0; // entry.lemma || findInfinitive
let passAfterGerund = 0; // after + gerund credit
let unrendered = 0; // correct lemma, but tense not rendered in the table
const fails = new Map<string, number>();
const failLemma = new Map<string, string>();

for (const card of cards) {
  for (const rawTok of String(card.target).split(/\s+/)) {
    const token = cleanToken(rawTok);
    if (!token) continue;
    const entry = lookupWord(token);
    if (!entry || entry.pos !== 'v') continue;
    verbTokens++;

    const lemmaBefore = entry.lemma ?? null;
    if (passes(token, lemmaBefore)) passBefore++;

    const lemmaAfter = entry.lemma || findInfinitive(token);
    if (passes(token, lemmaAfter)) {
      passAfter++;
      passAfterGerund++;
    } else if (passesWithGerund(token, lemmaAfter)) {
      passAfterGerund++;
      fails.set(token, (fails.get(token) || 0) + 1);
      failLemma.set(token, `${lemmaAfter} [gerund-only]`);
    } else {
      fails.set(token, (fails.get(token) || 0) + 1);
      const l = lemmaAfter?.toLowerCase();
      let tag = '';
      if (l) {
        const ext = extendedForms(l);
        if (ext.has(token) || ext.has(stripAccents(token))
          || [...ext].some(e => stripAccents(e) === stripAccents(token))) {
          tag = ' [unrendered-tense]';
          unrendered++;
        }
      }
      failLemma.set(token, (lemmaAfter ?? '(null)') + tag);
    }
  }
}

const pct = (n: number) => ((100 * n) / verbTokens).toFixed(2) + '%';
console.log(`Verb tokens:            ${verbTokens}`);
console.log(`PASS lemma-only:        ${passBefore}  (${pct(passBefore)})`);
console.log(`PASS with findInfinitive: ${passAfter}  (${pct(passAfter)})`);
console.log(`PASS incl. gerund credit: ${passAfterGerund}  (${pct(passAfterGerund)})`);
console.log(`Correct lemma, unrendered tense: ${unrendered}  (cumulative: ${pct(passAfterGerund + unrendered)})`);
console.log('\nTop failing tokens:');
const sorted = [...fails.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2000);
for (const [tok, count] of sorted) {
  console.log(`  ${String(count).padStart(4)}  ${tok}  →  ${failLemma.get(tok)}`);
}
