// Portuguese conjugation regression test (2026-08-05).
//
// A "conjugation not working for certain Portuguese verbs" report turned out
// to be several systemic engine bugs: orthographic changes (-car/-gar/-çar,
// -cer/-ger/-gir/-guer) were enumerated per verb instead of pattern-matched,
// so anything off the list got "pegei"/"venco"; ter/vir/ver/fazer/dizer/pedir
// compounds (manter, intervir, prever, despedir...) conjugated as regular;
// hiatus -air/-uir verbs produced "contribues"/"trao" and lost their accents
// (saí, construía); and findInfinitive was a credulous suffix-stripper that
// invented lemmas like "abandoner". This test asserts the classic trouble
// spots exactly and reports the dictionary-wide round-trip rate.
//
// Run: node scripts/test-pt-conjugation.cjs
const { execFileSync } = require('child_process');
const path = require('path');
const ROOT = path.join(__dirname, '..');

// The engine is TypeScript, so all assertions run inside one npx tsx
// subprocess; this wrapper just relays its verdict.
const TS = `
import { readFileSync } from 'fs';
import { conjugate, findInfinitive } from '${ROOT.replace(/\\/g, '/')}/src/data/conjugation/pt';

let failed = 0;
const check = (ok: boolean, msg: string): void => {
  console.log((ok ? '  ok ' : '  FAIL ') + msg);
  if (!ok) failed++;
};

// ── 1. Trouble-spot forms must be generated exactly ──
const SPOT: Array<[string, string]> = [
  // orthographic -car/-gar/-çar (pattern-based, incl. verbs the old
  // per-verb table missed: pegar/marcar/trocar/ligar)
  ['ficar', 'fiquei'], ['ficar', 'fique'], ['chegar', 'cheguei'],
  ['começar', 'comecei'], ['começar', 'comece'], ['pegar', 'peguei'],
  ['marcar', 'marquei'], ['trocar', 'troquei'], ['tocar', 'toquei'],
  ['dançar', 'dancei'], ['ligar', 'liguei'],
  // orthographic -cer/-ger/-gir/-guer before a/o
  ['vencer', 'venço'], ['vencer', 'vença'], ['descer', 'desço'],
  ['nascer', 'nasço'], ['esquecer', 'esqueço'], ['aquecer', 'aqueço'],
  ['surgir', 'surjo'], ['fingir', 'finjo'], ['agir', 'ajo'],
  ['corrigir', 'corrijo'], ['erguer', 'ergo'],
  // stem-changing -ir (enumerated: assumir/presumir stay regular)
  ['dormir', 'durmo'], ['dormir', 'durma'], ['preferir', 'prefiro'],
  ['seguir', 'sigo'], ['conferir', 'confiro'], ['transferir', 'transfiro'],
  ['subir', 'subo'], ['subir', 'sobe'], ['consumir', 'consome'],
  ['consumir', 'consumo'], ['sumir', 'some'],
  // classic irregulars
  ['fazer', 'faço'], ['fazer', 'fiz'], ['fazer', 'farei'],
  ['dizer', 'digo'], ['dizer', 'disse'], ['dizer', 'direi'],
  ['trazer', 'trouxe'], ['poder', 'pude'], ['pôr', 'ponho'], ['pôr', 'pôs'],
  ['ver', 'vejo'], ['ver', 'vi'], ['vir', 'venho'], ['vir', 'vim'],
  ['dar', 'dou'], ['dar', 'dei'], ['saber', 'sei'], ['saber', 'soube'],
  ['caber', 'caibo'], ['querer', 'quis'], ['ler', 'leio'],
  ['ouvir', 'ouço'], ['pedir', 'peço'], ['perder', 'perco'],
  ['medir', 'meço'], ['ser', 'fui'], ['estar', 'estive'],
  ['ter', 'tenho'], ['ir', 'vou'], ['haver', 'há'],
  // requerer is NOT a querer compound
  ['requerer', 'requeiro'], ['requerer', 'requeri'], ['requerer', 'requer'],
  // -ear / odiar-class -iar
  ['passear', 'passeio'], ['passear', 'passeia'], ['passear', 'passeie'],
  ['passear', 'passeemos'], ['odiar', 'odeio'], ['odiar', 'odiemos'],
  // ter/vir/ver/fazer/dizer/pedir/seguir compounds with junction accents
  ['manter', 'mantém'], ['manter', 'mantenho'], ['manter', 'mantive'],
  ['manter', 'manténs'], ['manter', 'mantêm'],
  ['obter', 'obtém'], ['conter', 'contém'], ['deter', 'detém'],
  ['reter', 'retém'],
  ['intervir', 'intervém'], ['intervir', 'intervenho'], ['intervir', 'interveio'],
  ['convir', 'convém'],
  ['prever', 'prevejo'], ['prever', 'previsto'], ['rever', 'revejo'],
  ['satisfazer', 'satisfaço'], ['satisfazer', 'satisfeito'],
  ['desfazer', 'desfaço'], ['refazer', 'refaço'],
  ['impedir', 'impeço'], ['despedir', 'despeço'],
  ['prosseguir', 'prossigo'],
  // pôr compounds (incl. pressupor, which used to return a NULL table)
  ['compor', 'compõe'], ['compor', 'compus'], ['pressupor', 'pressuponho'],
  ['pressupor', 'pressuposto'],
  // hiatus -air / -uir / -oer (accents included)
  ['sair', 'saio'], ['sair', 'saí'], ['sair', 'saía'], ['sair', 'saído'],
  ['cair', 'caio'], ['cair', 'caiu'],
  ['atrair', 'atraio'], ['contribuir', 'contribuo'], ['contribuir', 'contribui'],
  ['contribuir', 'contribuí'], ['contribuir', 'contribuído'],
  ['diminuir', 'diminui'], ['substituir', 'substituo'],
  ['incluir', 'inclui'], ['possuir', 'possui'],
  ['construir', 'constrói'], ['construir', 'construí'], ['destruir', 'destrói'],
  ['doer', 'dói'], ['doer', 'doía'],
  // -uzir 3sg drops the e
  ['produzir', 'produz'], ['traduzir', 'traduz'], ['aduzir', 'aduz'],
];

console.log('trouble spots:');
let spotPass = 0;
for (const [inf, expected] of SPOT) {
  const t = conjugate(inf);
  const all = t ? Object.values(t.tenses).flat().flatMap(x => x.split('/')) : [];
  const ok = all.includes(expected);
  if (ok) spotPass++;
  else check(false, inf + ' must produce "' + expected + '"' + (t ? '' : ' (NULL table)'));
}
check(spotPass === SPOT.length, 'trouble spots: ' + spotPass + '/' + SPOT.length + ' exact forms present');

// Forms that must NOT appear (regulars corrupted by lookalike rules)
const NEVER: Array<[string, string]> = [
  ['assumir', 'assome'],   // assumir is regular, not subir-class
  ['presumir', 'presome'],
  ['requerer', 'requis'],  // requerer is not a querer compound
  ['bater', 'batém'],      // bater is not a ter compound
  ['anunciar', 'anuneio'], // regular -iar, not odiar-class
  ['pegar', 'pegei'],      // orthography must apply
  ['vencer', 'venco'],
  ['contribuir', 'contribue'],
];
console.log('lookalike guards:');
for (const [inf, bad] of NEVER) {
  const t = conjugate(inf);
  const all = t ? Object.values(t.tenses).flat().flatMap(x => x.split('/')) : [];
  check(!all.includes(bad), inf + ' must never produce "' + bad + '"');
}

// ── 2. Round-trip: every generated form resolves back to its lemma ──
// Verb lemmas come from the dictionary source; the dictionary's verb keys
// also serve as the isKnownVerb lexicon (mirrors lookupWord's fallback).
const dictSrc = readFileSync('${ROOT.replace(/\\/g, '/')}/src/data/dictionary/pt.ts', 'utf8');
const entryRe = /^\\s*(?:'([^']+)'|"([^"]+)")\\s*:\\s*\\{([^}]*)\\}/gm;
const verbKeys = new Set<string>();
const lemmas = new Set<string>();
let m: RegExpExecArray | null;
while ((m = entryRe.exec(dictSrc)) !== null) {
  const key = m[1] ?? m[2];
  const body = m[3];
  if (!/\\ben\\s*:/.test(body) || !/\\bipa\\s*:/.test(body)) continue;
  const isVerb = /pos\\s*:\\s*'v'/.test(body) || /en\\s*:\\s*['\\"]to /.test(body);
  if (!isVerb) continue;
  verbKeys.add(key);
  const lm = body.match(/lemma\\s*:\\s*'([^']+)'/);
  if (lm) lemmas.add(lm[1]);
  else if (/(ar|er|ir|ôr|or)$/.test(key)) lemmas.add(key);
}
const isKnown = (w: string): boolean => verbKeys.has(w);

let total = 0, fail = 0;
const failures: string[] = [];
for (const v of lemmas) {
  const t = conjugate(v);
  if (!t) continue;
  const seen = new Set<string>();
  for (const forms of Object.values(t.tenses)) {
    for (const raw of forms) {
      for (let form of raw.split('/')) {
        form = form.replace(/^(me|te|se|nos|vos) /, '').trim();
        if (!form || form === '-' || seen.has(form)) continue;
        seen.add(form);
        total++;
        if (findInfinitive(form, isKnown) !== v) {
          fail++;
          if (failures.length < 8) failures.push(v + ': ' + form);
        }
      }
    }
  }
}
const pct = ((1 - fail / total) * 100);
console.log('round-trip over ' + lemmas.size + ' dictionary verbs: '
  + (total - fail) + '/' + total + ' forms (' + pct.toFixed(1) + '%)');
if (failures.length) console.log('  residual (genuine homographs like fui=ser/ir): ' + failures.join(', ') + ' ...');
// 33 known residual collisions are genuine homographs (fui/foi → ser|ir,
// visto → ver|vestir, virei → virar|vir, sente → sentar|sentir...).
check(pct >= 99.5, 'round-trip rate >= 99.5% (was 83.5% before the fix)');

console.log(failed ? ('\\n✗ ' + failed + ' assertion(s) failed') : '\\n✓ all assertions passed');
process.exit(failed ? 1 : 0);
`;

try {
  execFileSync('npx', ['tsx', '-e', TS], {
    cwd: ROOT,
    stdio: 'inherit',
    timeout: 300000,
  });
} catch (e) {
  process.exit(typeof e.status === 'number' ? e.status : 1);
}
