/**
 * German verb conjugation engine
 * Handles weak (regular), strong, mixed, separable-prefix, inseparable-prefix,
 * and reflexive verbs. Covers 60+ irregular verbs with full conjugation data.
 *
 * Person order: ich, du, er/sie/es, wir, ihr, sie/Sie
 *
 * Tenses:
 *   present     — Prasens
 *   preterite   — Prateritum (simple past)
 *   imperfect   — Perfekt (compound past: haben/sein + Partizip II)
 *   future      — Futur I (werden + infinitive)
 *   conditional — Konjunktiv II (wurde + infinitive, or stem-changed for strong)
 *   subjunctive — Konjunktiv I (infinitive stem + endings)
 */
import type { ConjugationTable } from '../../types';

// ── Types ───────────────────────────────────────────────────
type Forms = [string, string, string, string, string, string];
type TenseKey = 'present' | 'preterite' | 'imperfect' | 'future' | 'conditional' | 'subjunctive';

const TENSES: TenseKey[] = ['present', 'preterite', 'imperfect', 'future', 'conditional', 'subjunctive'];

// ── Helpers ─────────────────────────────────────────────────
const f = (s: string): Forms => s.split(',') as unknown as Forms;
// ── Separable prefixes ──────────────────────────────────────
const SEPARABLE_PREFIXES = [
  'zurück', 'heraus', 'herein', 'hinaus', 'hinein', 'herum',
  'zusammen', 'auseinander', 'entgegen', 'gegenüber',
  'ab', 'an', 'auf', 'aus', 'bei', 'ein', 'her', 'hin',
  'los', 'mit', 'nach', 'um', 'vor', 'weg', 'zu',
  'fest', 'fern', 'statt', 'teil', 'vorbei',
];
// Sort by length descending so longer prefixes match first
SEPARABLE_PREFIXES.sort((a, b) => b.length - a.length);

// Inseparable prefixes — never separate, no ge- in past participle
const INSEPARABLE_PREFIXES = ['be', 'emp', 'ent', 'er', 'ge', 'miss', 'ver', 'zer'];

function detectSeparablePrefix(inf: string): string | null {
  for (const p of SEPARABLE_PREFIXES) {
    if (inf.startsWith(p) && inf.length > p.length + 2) {
      // Make sure remainder looks like a verb (ends in -en, -ern, -eln, or -n)
      const remainder = inf.slice(p.length);
      if (remainder.endsWith('en') || remainder.endsWith('ern') || remainder.endsWith('eln') || remainder.endsWith('n')) {
        return p;
      }
    }
  }
  return null;
}

function hasInseparablePrefix(inf: string): boolean {
  for (const p of INSEPARABLE_PREFIXES) {
    if (inf.startsWith(p)) return true;
  }
  return false;
}

// ── Reflexive pronouns (accusative) ─────────────────────────
const REFLEXIVE_ACC: Forms = f('mich,dich,sich,uns,euch,sich');

// ── Auxiliary forms ─────────────────────────────────────────
const HABEN_PRESENT: Forms = f('habe,hast,hat,haben,habt,haben');
const SEIN_PRESENT: Forms = f('bin,bist,ist,sind,seid,sind');
const WERDEN_PRESENT: Forms = f('werde,wirst,wird,werden,werdet,werden');
const WUERDE_FORMS: Forms = f('würde,würdest,würde,würden,würdet,würden');

// ── Irregular verb data ─────────────────────────────────────
// Each entry: {
//   present?: Forms (full 6-form override for present tense)
//   presentStem23?: [du-form, er-form] (stem change for 2nd/3rd person singular only)
//   preteriteStem: string (preterite stem, endings added: -, -st, -, -en, -t, -en for strong; -e, -est, -e, -en, -et, -en for weak)
//   pastParticiple: string
//   auxiliary: 'haben' | 'sein'
//   isStrong: boolean (strong preterite: no -te suffix, uses ablaut)
//   konjII?: string (Konjunktiv II stem, if different from preterite + umlaut)
// }

interface IrregularData {
  present?: Forms;
  presentStem23?: [string, string]; // [du-stem, er-stem] for 2nd/3rd sg with normal endings
  preteriteStem: string;
  pastParticiple: string;
  auxiliary: 'haben' | 'sein';
  isStrong: boolean;
  konjII?: Forms; // Full Konjunktiv II override
}

const IRREGULARS: Record<string, IrregularData> = {
  // ─── Essential: sein, haben, werden ───
  sein: {
    present: f('bin,bist,ist,sind,seid,sind'),
    preteriteStem: 'war',
    pastParticiple: 'gewesen',
    auxiliary: 'sein',
    isStrong: true,
    konjII: f('wäre,wärest,wäre,wären,wäret,wären'),
  },
  haben: {
    present: f('habe,hast,hat,haben,habt,haben'),
    preteriteStem: 'hatt',
    pastParticiple: 'gehabt',
    auxiliary: 'haben',
    isStrong: false,
    konjII: f('hätte,hättest,hätte,hätten,hättet,hätten'),
  },
  werden: {
    present: f('werde,wirst,wird,werden,werdet,werden'),
    preteriteStem: 'wurd',
    pastParticiple: 'geworden',
    auxiliary: 'sein',
    isStrong: false, // preterite uses weak-style endings: wurde, wurdest, wurde, ...
    konjII: f('würde,würdest,würde,würden,würdet,würden'),
  },

  // ─── Modal verbs ───
  können: {
    present: f('kann,kannst,kann,können,könnt,können'),
    preteriteStem: 'konnt',
    pastParticiple: 'gekonnt',
    auxiliary: 'haben',
    isStrong: false,
    konjII: f('könnte,könntest,könnte,könnten,könntet,könnten'),
  },
  müssen: {
    present: f('muss,musst,muss,müssen,müsst,müssen'),
    preteriteStem: 'musst',
    pastParticiple: 'gemusst',
    auxiliary: 'haben',
    isStrong: false,
    konjII: f('müsste,müsstest,müsste,müssten,müsstet,müssten'),
  },
  dürfen: {
    present: f('darf,darfst,darf,dürfen,dürft,dürfen'),
    preteriteStem: 'durft',
    pastParticiple: 'gedurft',
    auxiliary: 'haben',
    isStrong: false,
    konjII: f('dürfte,dürftest,dürfte,dürften,dürftet,dürften'),
  },
  sollen: {
    present: f('soll,sollst,soll,sollen,sollt,sollen'),
    preteriteStem: 'sollt',
    pastParticiple: 'gesollt',
    auxiliary: 'haben',
    isStrong: false,
    konjII: f('sollte,solltest,sollte,sollten,solltet,sollten'),
  },
  wollen: {
    present: f('will,willst,will,wollen,wollt,wollen'),
    preteriteStem: 'wollt',
    pastParticiple: 'gewollt',
    auxiliary: 'haben',
    isStrong: false,
    konjII: f('wollte,wolltest,wollte,wollten,wolltet,wollten'),
  },
  mögen: {
    present: f('mag,magst,mag,mögen,mögt,mögen'),
    preteriteStem: 'mocht',
    pastParticiple: 'gemocht',
    auxiliary: 'haben',
    isStrong: false,
    konjII: f('möchte,möchtest,möchte,möchten,möchtet,möchten'),
  },

  // ─── Strong verbs: e→i/ie changes ───
  geben: {
    presentStem23: ['gib', 'gib'],
    preteriteStem: 'gab',
    pastParticiple: 'gegeben',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('gäbe,gäbest,gäbe,gäben,gäbet,gäben'),
  },
  nehmen: {
    presentStem23: ['nimm', 'nimm'],
    preteriteStem: 'nahm',
    pastParticiple: 'genommen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('nähme,nähmest,nähme,nähmen,nähmet,nähmen'),
  },
  sprechen: {
    presentStem23: ['sprich', 'sprich'],
    preteriteStem: 'sprach',
    pastParticiple: 'gesprochen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('spräche,sprächest,spräche,sprächen,sprächet,sprächen'),
  },
  sehen: {
    presentStem23: ['sieh', 'sieh'],
    preteriteStem: 'sah',
    pastParticiple: 'gesehen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('sähe,sähest,sähe,sähen,sähet,sähen'),
  },
  lesen: {
    presentStem23: ['lies', 'lies'],
    preteriteStem: 'las',
    pastParticiple: 'gelesen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('läse,läsest,läse,läsen,läset,läsen'),
  },
  essen: {
    present: f('esse,isst,isst,essen,esst,essen'),
    preteriteStem: 'aß',
    pastParticiple: 'gegessen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('äße,äßest,äße,äßen,äßet,äßen'),
  },
  vergessen: {
    present: f('vergesse,vergisst,vergisst,vergessen,vergesst,vergessen'),
    preteriteStem: 'vergaß',
    pastParticiple: 'vergessen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('vergäße,vergäßest,vergäße,vergäßen,vergäßet,vergäßen'),
  },
  treffen: {
    presentStem23: ['triff', 'triff'],
    preteriteStem: 'traf',
    pastParticiple: 'getroffen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('träfe,träfest,träfe,träfen,träfet,träfen'),
  },
  helfen: {
    presentStem23: ['hilf', 'hilf'],
    preteriteStem: 'half',
    pastParticiple: 'geholfen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('hülfe,hülfest,hülfe,hülfen,hülfet,hülfen'),
  },
  sterben: {
    presentStem23: ['stirb', 'stirb'],
    preteriteStem: 'starb',
    pastParticiple: 'gestorben',
    auxiliary: 'sein',
    isStrong: true,
    konjII: f('stürbe,stürbest,stürbe,stürben,stürbet,stürben'),
  },
  werfen: {
    presentStem23: ['wirf', 'wirf'],
    preteriteStem: 'warf',
    pastParticiple: 'geworfen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('würfe,würfest,würfe,würfen,würfet,würfen'),
  },
  brechen: {
    presentStem23: ['brich', 'brich'],
    preteriteStem: 'brach',
    pastParticiple: 'gebrochen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('bräche,brächest,bräche,brächen,brächet,brächen'),
  },

  // ─── Strong verbs: a→ä changes ───
  fahren: {
    presentStem23: ['fähr', 'fähr'],
    preteriteStem: 'fuhr',
    pastParticiple: 'gefahren',
    auxiliary: 'sein',
    isStrong: true,
    konjII: f('führe,führest,führe,führen,führet,führen'),
  },
  tragen: {
    presentStem23: ['träg', 'träg'],
    preteriteStem: 'trug',
    pastParticiple: 'getragen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('trüge,trügest,trüge,trügen,trüget,trügen'),
  },
  schlafen: {
    presentStem23: ['schläf', 'schläf'],
    preteriteStem: 'schlief',
    pastParticiple: 'geschlafen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('schliefe,schliefest,schliefe,schliefen,schliefet,schliefen'),
  },
  fallen: {
    presentStem23: ['fäll', 'fäll'],
    preteriteStem: 'fiel',
    pastParticiple: 'gefallen',
    auxiliary: 'sein',
    isStrong: true,
    konjII: f('fiele,fielest,fiele,fielen,fielet,fielen'),
  },
  laufen: {
    presentStem23: ['läuf', 'läuf'],
    preteriteStem: 'lief',
    pastParticiple: 'gelaufen',
    auxiliary: 'sein',
    isStrong: true,
    konjII: f('liefe,liefest,liefe,liefen,liefet,liefen'),
  },
  halten: {
    presentStem23: ['hält', 'hält'],
    preteriteStem: 'hielt',
    pastParticiple: 'gehalten',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('hielte,hieltest,hielte,hielten,hieltet,hielten'),
  },
  lassen: {
    present: f('lasse,lässt,lässt,lassen,lasst,lassen'),
    preteriteStem: 'ließ',
    pastParticiple: 'gelassen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('ließe,ließest,ließe,ließen,ließet,ließen'),
  },
  fangen: {
    presentStem23: ['fäng', 'fäng'],
    preteriteStem: 'fing',
    pastParticiple: 'gefangen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('finge,fingest,finge,fingen,finget,fingen'),
  },

  // ─── Strong verbs: no present stem change ───
  finden: {
    preteriteStem: 'fand',
    pastParticiple: 'gefunden',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('fände,fändest,fände,fänden,fändet,fänden'),
  },
  trinken: {
    preteriteStem: 'trank',
    pastParticiple: 'getrunken',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('tränke,tränkest,tränke,tränken,tränket,tränken'),
  },
  singen: {
    preteriteStem: 'sang',
    pastParticiple: 'gesungen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('sänge,sängest,sänge,sängen,sänget,sängen'),
  },
  schwimmen: {
    preteriteStem: 'schwamm',
    pastParticiple: 'geschwommen',
    auxiliary: 'sein',
    isStrong: true,
    konjII: f('schwömme,schwömmest,schwömme,schwömmen,schwömmet,schwömmen'),
  },
  beginnen: {
    preteriteStem: 'begann',
    pastParticiple: 'begonnen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('begänne,begännest,begänne,begännen,begännet,begännen'),
  },
  gewinnen: {
    preteriteStem: 'gewann',
    pastParticiple: 'gewonnen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('gewänne,gewännest,gewänne,gewännen,gewännet,gewännen'),
  },
  kommen: {
    preteriteStem: 'kam',
    pastParticiple: 'gekommen',
    auxiliary: 'sein',
    isStrong: true,
    konjII: f('käme,kämest,käme,kämen,kämet,kämen'),
  },
  gehen: {
    preteriteStem: 'ging',
    pastParticiple: 'gegangen',
    auxiliary: 'sein',
    isStrong: true,
    konjII: f('ginge,gingest,ginge,gingen,ginget,gingen'),
  },
  stehen: {
    preteriteStem: 'stand',
    pastParticiple: 'gestanden',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('stände,ständest,stände,ständen,ständet,ständen'),
  },
  verstehen: {
    preteriteStem: 'verstand',
    pastParticiple: 'verstanden',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('verstände,verständest,verstände,verständen,verständet,verständen'),
  },
  liegen: {
    preteriteStem: 'lag',
    pastParticiple: 'gelegen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('läge,lägest,läge,lägen,läget,lägen'),
  },
  sitzen: {
    preteriteStem: 'saß',
    pastParticiple: 'gesessen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('säße,säßest,säße,säßen,säßet,säßen'),
  },
  fliegen: {
    preteriteStem: 'flog',
    pastParticiple: 'geflogen',
    auxiliary: 'sein',
    isStrong: true,
    konjII: f('flöge,flögest,flöge,flögen,flöget,flögen'),
  },
  ziehen: {
    preteriteStem: 'zog',
    pastParticiple: 'gezogen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('zöge,zögest,zöge,zögen,zöget,zögen'),
  },
  schließen: {
    preteriteStem: 'schloss',
    pastParticiple: 'geschlossen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('schlösse,schlössest,schlösse,schlössen,schlösset,schlössen'),
  },
  schreiben: {
    preteriteStem: 'schrieb',
    pastParticiple: 'geschrieben',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('schriebe,schriebest,schriebe,schrieben,schriebet,schrieben'),
  },
  bleiben: {
    preteriteStem: 'blieb',
    pastParticiple: 'geblieben',
    auxiliary: 'sein',
    isStrong: true,
    konjII: f('bliebe,bliebest,bliebe,blieben,bliebet,blieben'),
  },
  scheinen: {
    preteriteStem: 'schien',
    pastParticiple: 'geschienen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('schiene,schienest,schiene,schienen,schienet,schienen'),
  },
  rufen: {
    preteriteStem: 'rief',
    pastParticiple: 'gerufen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('riefe,riefest,riefe,riefen,riefet,riefen'),
  },
  schneiden: {
    preteriteStem: 'schnitt',
    pastParticiple: 'geschnitten',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('schnitte,schnittest,schnitte,schnitten,schnittet,schnitten'),
  },
  leiden: {
    preteriteStem: 'litt',
    pastParticiple: 'gelitten',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('litte,littest,litte,litten,littet,litten'),
  },
  bitten: {
    preteriteStem: 'bat',
    pastParticiple: 'gebeten',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('bäte,bätest,bäte,bäten,bätet,bäten'),
  },
  tun: {
    present: f('tue,tust,tut,tun,tut,tun'),
    preteriteStem: 'tat',
    pastParticiple: 'getan',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('täte,tätest,täte,täten,tätet,täten'),
  },
  wissen: {
    present: f('weiß,weißt,weiß,wissen,wisst,wissen'),
    preteriteStem: 'wusst',
    pastParticiple: 'gewusst',
    auxiliary: 'haben',
    isStrong: false,
    konjII: f('wüsste,wüsstest,wüsste,wüssten,wüsstet,wüssten'),
  },

  // ─── Mixed verbs (weak endings, stem change) ───
  bringen: {
    preteriteStem: 'bracht',
    pastParticiple: 'gebracht',
    auxiliary: 'haben',
    isStrong: false,
    konjII: f('brächte,brächtest,brächte,brächten,brächtet,brächten'),
  },
  denken: {
    preteriteStem: 'dacht',
    pastParticiple: 'gedacht',
    auxiliary: 'haben',
    isStrong: false,
    konjII: f('dächte,dächtest,dächte,dächten,dächtet,dächten'),
  },
  kennen: {
    preteriteStem: 'kannt',
    pastParticiple: 'gekannt',
    auxiliary: 'haben',
    isStrong: false,
    konjII: f('kennte,kenntest,kennte,kennten,kenntet,kennten'),
  },
  nennen: {
    preteriteStem: 'nannt',
    pastParticiple: 'genannt',
    auxiliary: 'haben',
    isStrong: false,
    konjII: f('nennte,nenntest,nennte,nennten,nenntet,nennten'),
  },
  rennen: {
    preteriteStem: 'rannt',
    pastParticiple: 'gerannt',
    auxiliary: 'sein',
    isStrong: false,
    konjII: f('rennte,renntest,rennte,rennten,renntet,rennten'),
  },
  senden: {
    preteriteStem: 'sandt',
    pastParticiple: 'gesandt',
    auxiliary: 'haben',
    isStrong: false,
    konjII: f('sendete,sendetest,sendete,sendeten,sendetet,sendeten'),
  },
  wenden: {
    preteriteStem: 'wandt',
    pastParticiple: 'gewandt',
    auxiliary: 'haben',
    isStrong: false,
    konjII: f('wendete,wendetest,wendete,wendeten,wendetet,wendeten'),
  },

  // ─── Additional strong verbs ───
  waschen: {
    presentStem23: ['wäsch', 'wäsch'],
    preteriteStem: 'wusch',
    pastParticiple: 'gewaschen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('wüsche,wüschest,wüsche,wüschen,wüschet,wüschen'),
  },
  wachsen: {
    presentStem23: ['wächs', 'wächs'],
    preteriteStem: 'wuchs',
    pastParticiple: 'gewachsen',
    auxiliary: 'sein',
    isStrong: true,
    konjII: f('wüchse,wüchsest,wüchse,wüchsen,wüchset,wüchsen'),
  },
  schlagen: {
    presentStem23: ['schläg', 'schläg'],
    preteriteStem: 'schlug',
    pastParticiple: 'geschlagen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('schlüge,schlügest,schlüge,schlügen,schlüget,schlügen'),
  },
  greifen: {
    preteriteStem: 'griff',
    pastParticiple: 'gegriffen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('griffe,griffest,griffe,griffen,griffet,griffen'),
  },
  riechen: {
    preteriteStem: 'roch',
    pastParticiple: 'gerochen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('röche,röchest,röche,röchen,röchet,röchen'),
  },
  treten: {
    presentStem23: ['tritt', 'tritt'],
    preteriteStem: 'trat',
    pastParticiple: 'getreten',
    auxiliary: 'sein',
    isStrong: true,
    konjII: f('träte,trätest,träte,träten,trätet,träten'),
  },
  erscheinen: {
    preteriteStem: 'erschien',
    pastParticiple: 'erschienen',
    auxiliary: 'sein',
    isStrong: true,
    konjII: f('erschiene,erschienest,erschiene,erschienen,erschienet,erschienen'),
  },

  // ─── Separable verb base forms ───
  // These are looked up by their BASE verb after prefix stripping.
  // Entries here for separable verbs that have a base not already covered:
  // (Most separable verbs use bases already in the table: kommen, gehen, stehen, etc.)
  // steigen (for umsteigen, einsteigen)
  steigen: {
    preteriteStem: 'stieg',
    pastParticiple: 'gestiegen',
    auxiliary: 'sein',
    isStrong: true,
    konjII: f('stiege,stiegest,stiege,stiegen,stieget,stiegen'),
  },
  // laden (for einladen)
  laden: {
    presentStem23: ['läd', 'läd'],
    preteriteStem: 'lud',
    pastParticiple: 'geladen',
    auxiliary: 'haben',
    isStrong: true,
    konjII: f('lüde,lüdest,lüde,lüden,lüdet,lüden'),
  },
  // kaufen (for einkaufen) — regular, no entry needed
  // machen (for aufmachen, zumachen) — regular, no entry needed
  // stellen (for vorstellen) — regular, no entry needed
};

// ── Sein-verbs: use "sein" as auxiliary in Perfekt ──────────
const SEIN_VERBS = new Set([
  'sein', 'werden', 'gehen', 'kommen', 'fahren', 'fliegen',
  'laufen', 'fallen', 'sterben', 'bleiben', 'schwimmen',
  'aufstehen', 'ankommen', 'einsteigen', 'umsteigen', 'abfahren',
  'passieren', 'rennen', 'steigen',
  // bases for separable verbs (detected via base lookup)
]);

// ── Stem extraction ─────────────────────────────────────────
/** Get the stem of a regular German verb (strip -en, -n) */
function getStem(inf: string): string {
  if (inf.endsWith('eln') || inf.endsWith('ern')) return inf.slice(0, -1); // wandern→wander, sammeln→sammel
  if (inf.endsWith('en')) return inf.slice(0, -2);
  if (inf.endsWith('n')) return inf.slice(0, -1);
  return inf;
}

/** Check if stem needs extra -e- before -st/-t endings (stems ending in -t, -d, or consonant cluster + -m/-n) */
function needsEInsertion(stem: string): boolean {
  // Stems ending in -t or -d
  if (/[td]$/.test(stem)) return true;
  // Stems ending in consonant + m or consonant + n (but not after l, r, m, n, h)
  if (/[^lrmnhaeiouäöü][mn]$/.test(stem)) return true;
  return false;
}

/** Check if stem ends in -s, -ss, -ß, -z, -tz (du-form gets -t instead of -st) */
function hasSibilantEnding(stem: string): boolean {
  return /(?:s|ss|ß|z|tz|x)$/.test(stem);
}

// ── Regular (weak) conjugation ──────────────────────────────
function conjugateWeakPresent(stem: string, inf?: string): Forms {
  const e = needsEInsertion(stem);
  const sib = hasSibilantEnding(stem);
  // For -eln verbs: wir/sie use the infinitive form, not stem+en
  // e.g., sammeln: wir sammeln (not wir sammelen)
  const pluralForm = inf || (stem + 'en');
  return [
    stem + 'e',
    stem + (sib ? 't' : (e ? 'est' : 'st')),
    stem + (e ? 'et' : 't'),
    pluralForm,
    stem + (e ? 'et' : 't'),
    pluralForm,
  ] as Forms;
}

function conjugateWeakPreterite(stem: string): Forms {
  const e = needsEInsertion(stem);
  const base = stem + (e ? 'ete' : 'te');
  return [
    base,
    base + 'st',
    base,
    base + 'n',
    base + 't',
    base + 'n',
  ] as Forms;
}

function conjugateStrongPreterite(pretStem: string): Forms {
  // Strong preterite: stem + -, -st, -, -en, -t, -en
  // If stem ends in -s/-ß, du gets -est instead of -st
  const e = needsEInsertion(pretStem);
  const sib = hasSibilantEnding(pretStem);
  return [
    pretStem,
    pretStem + (sib ? 'est' : (e ? 'est' : 'st')),
    pretStem,
    pretStem + 'en',
    pretStem + (e ? 'et' : 't'),
    pretStem + 'en',
  ] as Forms;
}

function conjugateWeakPreteriteFromStem(mixedStem: string): Forms {
  // For mixed verbs: stem already includes the change, add weak endings -e, -est, -e, -en, -et, -en
  return [
    mixedStem + 'e',
    mixedStem + 'est',
    mixedStem + 'e',
    mixedStem + 'en',
    mixedStem + 'et',
    mixedStem + 'en',
  ] as Forms;
}

// ── Past participle builder ─────────────────────────────────
function buildPastParticiple(inf: string, isInseparable: boolean): string {
  const stem = getStem(inf);
  // Regular (weak) past participle: ge- + stem + -t
  // Stems ending in -t/-d get -et
  const e = needsEInsertion(stem);
  const prefix = isInseparable ? '' : 'ge';
  return prefix + stem + (e ? 'et' : 't');
}

// ── Konjunktiv I (subjunctive) ──────────────────────────────
function conjugateKonjunktivI(inf: string): Forms {
  // Stem from infinitive (strip -en/-n) + -e, -est, -e, -en, -et, -en
  // For -eln/-ern verbs, wir/sie use the infinitive form (not stem + en)
  let stem: string;
  if (inf.endsWith('eln')) {
    // sammeln → samml → sammle, sammlest, sammle, sammeln, sammlet, sammeln
    stem = inf.slice(0, -3) + 'l';
  } else if (inf.endsWith('ern')) {
    // wandern → wander → wandere, wanderest, wandere, wandern, wanderet, wandern
    stem = inf.slice(0, -1); // strip just the 'n'
  } else if (inf.endsWith('en')) {
    stem = inf.slice(0, -2);
  } else if (inf.endsWith('n')) {
    stem = inf.slice(0, -1);
  } else {
    stem = inf;
  }
  const pluralForm = inf; // wir/sie forms always match the infinitive
  return [
    stem + 'e',
    stem + 'est',
    stem + 'e',
    pluralForm,
    stem + 'et',
    pluralForm,
  ] as Forms;
}

// Special Konjunktiv I for sein
function getKonjunktivI(inf: string): Forms {
  if (inf === 'sein') return f('sei,seiest,sei,seien,seiet,seien');
  return conjugateKonjunktivI(inf);
}

// ── Present tense with stem changes ─────────────────────────
function applyPresentStemChange(baseStem: string, stemChange: [string, string], inf?: string): Forms {
  const [duStem, erStem] = stemChange;
  const e = needsEInsertion(baseStem);
  const duSib = hasSibilantEnding(duStem);
  const pluralForm = inf || (baseStem + 'en');
  // Strong verbs with stem changes do NOT get e-insertion in du/er forms,
  // even when the changed stem ends in -t/-d. E.g., halten -> du haltst, er halt
  // but with stem change: du haltst, er halt.
  // The stem change forms already account for this.
  return [
    baseStem + 'e',
    duStem + (duSib ? 't' : 'st'),
    erStem + (erStem.endsWith('t') ? '' : 't'),
    pluralForm,
    baseStem + (e ? 'et' : 't'),
    pluralForm,
  ] as Forms;
}

// ── Build full conjugation for a base verb ──────────────────
function conjugateBase(inf: string, isInseparable: boolean): Record<TenseKey, Forms> | null {
  const stem = getStem(inf);
  const irrData = IRREGULARS[inf];

  // ── Present ───
  let present: Forms;
  if (irrData?.present) {
    present = irrData.present;
  } else if (irrData?.presentStem23) {
    present = applyPresentStemChange(stem, irrData.presentStem23, inf);
  } else {
    present = conjugateWeakPresent(stem, inf);
  }

  // ── Preterite ───
  let preterite: Forms;
  if (irrData) {
    if (irrData.isStrong) {
      preterite = conjugateStrongPreterite(irrData.preteriteStem);
    } else {
      preterite = conjugateWeakPreteriteFromStem(irrData.preteriteStem);
    }
  } else {
    preterite = conjugateWeakPreterite(stem);
  }

  // ── Past participle (for Perfekt / imperfect tense) ───
  let pastParticiple: string;
  if (irrData) {
    pastParticiple = irrData.pastParticiple;
  } else {
    pastParticiple = buildPastParticiple(inf, isInseparable);
  }

  // ── Determine auxiliary ───
  let auxiliary: 'haben' | 'sein' = 'haben';
  if (irrData?.auxiliary) {
    auxiliary = irrData.auxiliary;
  } else if (SEIN_VERBS.has(inf)) {
    auxiliary = 'sein';
  }

  // ── Perfekt (imperfect tense key) ───
  const auxForms = auxiliary === 'sein' ? SEIN_PRESENT : HABEN_PRESENT;
  const imperfect: Forms = auxForms.map(a => a + ' ' + pastParticiple) as Forms;

  // ── Futur I (future) ───
  const future: Forms = WERDEN_PRESENT.map(w => w + ' ' + inf) as Forms;

  // ── Konjunktiv II (conditional) ───
  let conditional: Forms;
  if (irrData?.konjII) {
    conditional = irrData.konjII;
  } else {
    // Regular verbs: wurde + infinitive
    conditional = WUERDE_FORMS.map(w => w + ' ' + inf) as Forms;
  }

  // ── Konjunktiv I (subjunctive) ───
  const subjunctive = getKonjunktivI(inf);

  return { present, preterite, imperfect, future, conditional, subjunctive };
}

// ── Main conjugation function ───────────────────────────────
export function conjugate(infinitive: string): ConjugationTable | null {
  const raw = infinitive.trim().toLowerCase();

  // ── Detect reflexive ───
  let isReflexive = false;
  let inf = raw;
  if (raw.startsWith('sich ')) {
    inf = raw.slice(5);
    isReflexive = true;
  }

  // ── Detect separable prefix ───
  const sepPrefix = detectSeparablePrefix(inf);
  const isInseparable = !sepPrefix && hasInseparablePrefix(inf);
  const baseVerb = sepPrefix ? inf.slice(sepPrefix.length) : inf;

  // Validate it looks like a German verb
  if (!baseVerb.endsWith('en') && !baseVerb.endsWith('ern') && !baseVerb.endsWith('eln') && !baseVerb.endsWith('n') && baseVerb !== 'tun') {
    return null;
  }

  // ── Conjugate the base verb ───
  const baseTenses = conjugateBase(baseVerb, isInseparable);
  if (!baseTenses) return null;

  // ── Determine auxiliary for the full verb (including prefix) ───
  const irrData = IRREGULARS[baseVerb];
  let auxiliary: 'haben' | 'sein' = irrData?.auxiliary || 'haben';
  if (SEIN_VERBS.has(inf)) auxiliary = 'sein';

  // ── Apply separable prefix transformations ───
  const finalTenses: Record<string, string[]> = {};

  for (const t of TENSES) {
    let forms = baseTenses[t];

    if (sepPrefix) {
      if (t === 'present' || t === 'preterite') {
        // Prefix separates: "ich mache auf", "ich machte auf"
        forms = forms.map(form => form + ' ' + sepPrefix) as Forms;
      } else if (t === 'imperfect') {
        // Perfekt: ge- goes between prefix and stem → "aufgemacht"
        // The base pastParticiple already has ge- or not; we need to reconstruct
        let pp: string;
        if (irrData) {
          pp = irrData.pastParticiple;
        } else {
          pp = buildPastParticiple(baseVerb, false);
        }
        // For separable: prefix + past participle (which already has ge-)
        const sepPP = sepPrefix + pp;
        const auxForms = auxiliary === 'sein' ? SEIN_PRESENT : HABEN_PRESENT;
        forms = auxForms.map(a => a + ' ' + sepPP) as Forms;
      } else if (t === 'future') {
        // Future: "werde aufmachen" — prefix stays with infinitive
        forms = WERDEN_PRESENT.map(w => w + ' ' + inf) as Forms;
      } else if (t === 'conditional') {
        // Konjunktiv II: for most separable verbs, use "wurde + sep-infinitive"
        // For strong bases with konjII, prefix separates: "finge an"
        if (irrData?.konjII) {
          forms = irrData.konjII.map(form => form + ' ' + sepPrefix) as Forms;
        } else {
          forms = WUERDE_FORMS.map(w => w + ' ' + inf) as Forms;
        }
      } else if (t === 'subjunctive') {
        // Konjunktiv I: prefix separates: "fange an"
        forms = forms.map(form => form + ' ' + sepPrefix) as Forms;
      }
    } else if (isInseparable && t === 'imperfect') {
      // Inseparable: no ge- in past participle — already handled in conjugateBase
      // but we need to rebuild Perfekt with the inseparable verb's participle
      let pp: string;
      if (irrData) {
        pp = irrData.pastParticiple;
      } else {
        pp = buildPastParticiple(inf, true);
      }
      const auxForms = auxiliary === 'sein' ? SEIN_PRESENT : HABEN_PRESENT;
      forms = auxForms.map(a => a + ' ' + pp) as Forms;
    } else if (isInseparable && t === 'future') {
      forms = WERDEN_PRESENT.map(w => w + ' ' + inf) as Forms;
    } else if (isInseparable && t === 'conditional') {
      if (irrData?.konjII) {
        forms = irrData.konjII;
      } else {
        forms = WUERDE_FORMS.map(w => w + ' ' + inf) as Forms;
      }
    } else if (isInseparable && t === 'subjunctive') {
      forms = getKonjunktivI(inf);
    } else if (isInseparable && t === 'present') {
      // Inseparable present: conjugate the whole verb directly
      // The stem includes the prefix
      const fullStem = getStem(inf);
      if (irrData?.present) {
        forms = irrData.present;
      } else if (irrData?.presentStem23) {
        // Need to add inseparable prefix to the stem changes
        const prefix = inf.slice(0, inf.length - baseVerb.length);
        const duStem = prefix + irrData.presentStem23[0];
        const erStem = prefix + irrData.presentStem23[1];
        forms = applyPresentStemChange(fullStem, [duStem, erStem], inf);
      } else {
        forms = conjugateWeakPresent(fullStem, inf);
      }
    } else if (isInseparable && t === 'preterite') {
      const fullStem = getStem(inf);
      if (irrData) {
        const prefix = inf.slice(0, inf.length - baseVerb.length);
        if (irrData.isStrong) {
          forms = conjugateStrongPreterite(prefix + irrData.preteriteStem);
        } else {
          forms = conjugateWeakPreteriteFromStem(prefix + irrData.preteriteStem);
        }
      } else {
        forms = conjugateWeakPreterite(fullStem);
      }
    }

    // ── Apply reflexive pronouns ───
    // Pronoun goes AFTER the first word: "wasche mich", "habe mich gewaschen", "stelle mich vor"
    if (isReflexive) {
      forms = forms.map((form, i) => {
        const parts = form.split(' ');
        return [parts[0], REFLEXIVE_ACC[i], ...parts.slice(1)].join(' ');
      }) as Forms;
    }

    finalTenses[t] = [...forms];
  }

  return {
    infinitive: raw,
    isReflexive,
    tenses: finalTenses,
  };
}
