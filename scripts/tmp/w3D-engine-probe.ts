/** Which slice-D tokens resolve via engine, and do key forms match real Greek? */
import { readFileSync } from 'fs';
import { conjugate, findInfinitive, normalizeGreek } from '../../src/data/conjugation/el';
const ROOT = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones';
const cards: any[] = JSON.parse(readFileSync(`${ROOT}/scripts/tmp/wave3-el-cards-D.json`, 'utf8'));
const existing = new Set(readFileSync(`${ROOT}/scripts/tmp/w3D-existing-dictkeys.txt`, 'utf8').split('\n'));
const tokenize = (t: string): string[] =>
  t.split(/\s+/).map((w) => normalizeGreek(w).replace(/[^α-ωάέήίόύώϊϋΐΰ-]/g, '')).filter(Boolean);
const missing = new Set<string>();
for (const c of cards) for (const tok of tokenize(c.target)) if (!existing.has(tok)) missing.add(tok);
const resolved: Record<string, string> = {}; const unresolved: string[] = [];
for (const tok of [...missing].sort()) {
  const fi = findInfinitive(tok.replace(/σ$/, 'ς')) ?? findInfinitive(tok);
  if (fi) resolved[tok] = fi; else unresolved.push(tok);
}
console.log('RESOLVED (' + Object.keys(resolved).length + '):');
for (const [k, v] of Object.entries(resolved)) console.log(`  ${k} -> ${v}`);
console.log('UNRESOLVED (' + unresolved.length + '):');
console.log(unresolved.join(' '));
// spot-check critical mechanical forms against real Greek
const expect: [string, string, string][] = [
  ['ακυρώνω', 'Αόριστος (Past)', 'ακύρωσα,ακύρωσες,ακύρωσε,ακυρώσαμε,ακυρώσατε,ακύρωσαν'],
  ['νυχτώνω', 'Αόριστος (Past)', 'νύχτωσα,νύχτωσες,νύχτωσε,νυχτώσαμε,νυχτώσατε,νύχτωσαν'],
  ['δένω', 'Αόριστος (Past)', 'έδεσα,έδεσες,έδεσε,δέσαμε,δέσατε,έδεσαν'],
  ['λάμπω', 'Παρατατικός (Imperfect)', 'έλαμπα,έλαμπες,έλαμπε,λάμπαμε,λάμπατε,έλαμπαν'],
  ['κοκκινίζω', 'Αόριστος (Past)', 'κοκκίνισα,κοκκίνισες,κοκκίνισε,κοκκινίσαμε,κοκκινίσατε,κοκκίνισαν'],
  ['φυσάω', 'Παρατατικός (Imperfect)', 'φυσούσα,φυσούσες,φυσούσε,φυσούσαμε,φυσούσατε,φυσούσαν'],
  ['γυαλίζω', 'Παρατατικός (Imperfect)', 'γυάλιζα,γυάλιζες,γυάλιζε,γυαλίζαμε,γυαλίζατε,γυάλιζαν'],
  ['λιάζομαι', 'Παρατατικός (Imperfect)', 'λιαζόμουν,λιαζόσουν,λιαζόταν,λιαζόμασταν,λιαζόσασταν,λιάζονταν'],
  ['νοικιάζω', 'Αόριστος (Past)', ',,,νοικιάσαμε,,'],
  ['χορεύω', 'Παρατατικός (Imperfect)', 'χόρευα,χόρευες,χόρευε,χορεύαμε,χορεύατε,χόρευαν'],
  ['συστήνω', 'Αόριστος (Past)', ',,,,,σύστησαν'],
  ['γεμίζω', 'Αόριστος (Past)', ',,,γεμίσαμε,,'],
  ['ψωνίζω', 'Αόριστος (Past)', ',,,ψωνίσαμε,,'],
  ['δοκιμάζω', 'Αόριστος (Past)', ',,,δοκιμάσαμε,,'],
  ['γνωρίζω', 'Αόριστος (Past)', ',,,γνωρίσαμε,,'],
  ['περπατάω', 'Αόριστος (Past)', ',,,περπατήσαμε,,'],
];
let bad = 0;
for (const [lemma, tense, want] of expect) {
  const t = conjugate(lemma);
  const got = t?.tenses[tense];
  if (!got) { console.log(`FAIL ${lemma}: no ${tense}`); bad++; continue; }
  want.split(',').forEach((w, i) => {
    if (w && got[i] !== w) { console.log(`FAIL ${lemma} ${tense}[${i}]: got ${got[i]}, want ${w}`); bad++; }
  });
}
console.log(bad ? `${bad} MISMATCHES` : 'all engine spot-checks pass');
