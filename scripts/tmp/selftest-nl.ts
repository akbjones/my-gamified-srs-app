/**
 * Self-test for Dutch findInfinitive (src/data/conjugation/nl.ts).
 * For every verb token in the Dutch deck: resolve a lemma via
 * entry.lemma || findInfinitive(token) and check the token appears in
 * conjugate(lemma)'s table. Prints pass % (before = lemma-field only,
 * after = with findInfinitive) and the top failing tokens.
 *
 * Run: npx tsx scripts/tmp/selftest-nl.ts
 */
import deck from '../../src/data/dutch/deck.json';
import { lookupWord } from '../../src/data/dictionary/nl';
import { conjugate, findInfinitive } from '../../src/data/conjugation/nl';

interface Card { target: string; }

function tableContains(lemma: string, token: string, allowJoin = false): boolean {
  if (lemma.toLowerCase() === token) return true;
  const table = conjugate(lemma);
  if (!table) return false;
  for (const forms of Object.values(table.tenses)) {
    for (const f of forms) {
      const lf = f.toLowerCase();
      if (lf === token) return true;
      if (lf.includes(' ')) {
        const words = lf.split(/\s+/);
        // multi-word forms ("heeft gemaakt", "belde op"): match single words
        if (words.includes(token)) return true;
        // subclause join: table "gaat weg" ↔ token "weggaat"
        if (allowJoin && words.length === 2 && words[1] + words[0] === token) return true;
      }
    }
  }
  return false;
}

const cards = deck as unknown as Card[];
const tokens = new Map<string, number>(); // verb token → occurrence count

for (const card of cards) {
  const raw = card.target.toLowerCase().split(/[^a-zà-üij]+/);
  for (const tok of raw) {
    if (tok.length < 2) continue;
    const entry = lookupWord(tok);
    if (!entry || entry.pos !== 'v') continue;
    tokens.set(tok, (tokens.get(tok) ?? 0) + 1);
  }
}

let totalOcc = 0;
let passBeforeOcc = 0;
let passAfterOcc = 0;
let passJoinOcc = 0;
const failures = new Map<string, { count: number; lemma: string | null }>();

for (const [tok, count] of tokens) {
  totalOcc += count;
  const entry = lookupWord(tok)!;

  // BEFORE: dictionary lemma field only
  const lemmaBefore = entry.lemma ?? null;
  if (lemmaBefore && tableContains(lemmaBefore, tok)) passBeforeOcc += count;
  else if (!lemmaBefore && tok.endsWith('en') && conjugate(tok) && tableContains(tok, tok)) {
    // token is itself an infinitive — trivially resolves without findInfinitive
    passBeforeOcc += count;
  }

  // AFTER: lemma field, else findInfinitive
  const lemma = entry.lemma || findInfinitive(tok);
  if (lemma && tableContains(lemma, tok)) {
    passAfterOcc += count;
    passJoinOcc += count;
  } else {
    if (lemma && tableContains(lemma, tok, true)) passJoinOcc += count;
    failures.set(tok, { count, lemma });
  }
}

const uniqueTotal = tokens.size;
const uniqueFail = failures.size;
console.log(`Verb tokens: ${uniqueTotal} unique, ${totalOcc} occurrences`);
console.log(`BEFORE (lemma field only): ${(100 * passBeforeOcc / totalOcc).toFixed(1)}% of occurrences`);
console.log(`AFTER  (with findInfinitive): ${(100 * passAfterOcc / totalOcc).toFixed(1)}% of occurrences`);
console.log(`AFTER + subclause-join match: ${(100 * passJoinOcc / totalOcc).toFixed(1)}% of occurrences`);
console.log(`Unique-token pass rate: ${(100 * (uniqueTotal - uniqueFail) / uniqueTotal).toFixed(1)}%`);
console.log(`\nTop 15 failing tokens:`);
const sorted = [...failures.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 15);
for (const [tok, { count, lemma }] of sorted) {
  console.log(`  ${tok.padEnd(18)} x${String(count).padEnd(5)} lemma=${lemma ?? 'NULL'}`);
}
console.log(`\nTotal failing unique tokens: ${uniqueFail}`);

// ── Failure classification ──
let dictLemmaBad = 0, fiBad = 0, fiNull = 0;
const fiBadList: string[] = [], fiNullList: string[] = [], dictBadList: string[] = [];
for (const [tok, { count }] of failures) {
  const entry = lookupWord(tok)!;
  if (entry.lemma) { dictLemmaBad += count; dictBadList.push(`${tok}(${entry.lemma})x${count}`); }
  else {
    const fi = findInfinitive(tok);
    if (fi) { fiBad += count; fiBadList.push(`${tok}->${fi}x${count}`); }
    else { fiNull += count; fiNullList.push(`${tok}x${count}`); }
  }
}
console.log(`\nFailure classes (occurrences):`);
console.log(`  dict entry.lemma wrong/table-miss: ${dictLemmaBad}`);
console.log(`  findInfinitive wrong/table-miss:   ${fiBad}`);
console.log(`  findInfinitive null:               ${fiNull}`);
console.log(`\ndict-lemma failures: ${dictBadList.slice(0, 40).join(' ')}`);
console.log(`\nfindInf failures: ${fiBadList.slice(0, 60).join(' ')}`);
console.log(`\nnull failures: ${fiNullList.slice(0, 40).join(' ')}`);
