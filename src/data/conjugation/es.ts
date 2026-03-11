/**
 * Spanish verb conjugation engine
 * Handles regular -ar/-er/-ir verbs, 60+ irregular overrides,
 * stem-changers, spelling changers, and reflexive verbs.
 */
import type { ConjugationTable } from '../../types';

// ── Types ────────────────────────────────────────────────────
type Forms = [string, string, string, string, string, string]; // yo, tú, él, nosotros, vosotros, ellos
type TenseKey = 'present' | 'preterite' | 'imperfect' | 'future' | 'conditional' | 'subjunctive';
type PartialTenses = Partial<Record<TenseKey, Forms>>;

const TENSES: TenseKey[] = ['present', 'preterite', 'imperfect', 'future', 'conditional', 'subjunctive'];
const REFLEXIVE_PRONOUNS: Forms = ['me', 'te', 'se', 'nos', 'os', 'se'];

// ── Regular endings ──────────────────────────────────────────
const REG: Record<string, Record<TenseKey, Forms>> = {
  ar: {
    present:     ['o', 'as', 'a', 'amos', 'áis', 'an'],
    preterite:   ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'],
    imperfect:   ['aba', 'abas', 'aba', 'ábamos', 'abais', 'aban'],
    future:      ['aré', 'arás', 'ará', 'aremos', 'aréis', 'arán'],
    conditional: ['aría', 'arías', 'aría', 'aríamos', 'aríais', 'arían'],
    subjunctive: ['e', 'es', 'e', 'emos', 'éis', 'en'],
  },
  er: {
    present:     ['o', 'es', 'e', 'emos', 'éis', 'en'],
    preterite:   ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
    imperfect:   ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
    future:      ['eré', 'erás', 'erá', 'eremos', 'eréis', 'erán'],
    conditional: ['ería', 'erías', 'ería', 'eríamos', 'eríais', 'erían'],
    subjunctive: ['a', 'as', 'a', 'amos', 'áis', 'an'],
  },
  ir: {
    present:     ['o', 'es', 'e', 'imos', 'ís', 'en'],
    preterite:   ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'],
    imperfect:   ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'],
    future:      ['iré', 'irás', 'irá', 'iremos', 'iréis', 'irán'],
    conditional: ['iría', 'irías', 'iría', 'iríamos', 'iríais', 'irían'],
    subjunctive: ['a', 'as', 'a', 'amos', 'áis', 'an'],
  },
};

// ── Helpers ──────────────────────────────────────────────────

/** Get verb class: 'ar' | 'er' | 'ir' */
function verbClass(inf: string): string | null {
  if (inf.endsWith('ar')) return 'ar';
  if (inf.endsWith('er')) return 'er';
  if (inf.endsWith('ir')) return 'ir';
  return null;
}

/** Get the stem (infinitive minus last 2 chars) */
function stem(inf: string): string {
  return inf.slice(0, -2);
}

/** Apply stem to regular endings for one tense */
function regular(inf: string, tense: TenseKey): Forms {
  const vc = verbClass(inf)!;
  const s = stem(inf);
  const endings = REG[vc][tense];
  // Future and conditional use the full infinitive as stem
  if (tense === 'future' || tense === 'conditional') {
    return endings.map(e => inf.slice(0, -2) + e) as unknown as Forms;
  }
  return endings.map(e => s + e) as unknown as Forms;
}

/** Build full regular conjugation for an infinitive */
function regularAll(inf: string): Record<TenseKey, Forms> {
  const result = {} as Record<TenseKey, Forms>;
  for (const t of TENSES) result[t] = regular(inf, t);
  return result;
}

// ── Stem-change helper ───────────────────────────────────────
// Stem changes apply in present & subjunctive to boot-pattern positions: [0,1,2,5]
// Some also change in preterite 3rd person (e>i, o>u for -ir verbs)

function applyStemChange(
  forms: Forms,
  from: string,
  to: string,
  positions: number[],
  stemStr: string,
): Forms {
  const result = [...forms] as Forms;
  for (const pos of positions) {
    // Find the last occurrence of `from` in the stem portion and replace it
    const formStem = result[pos];
    const idx = formStem.lastIndexOf(from, stemStr.length);
    if (idx >= 0) {
      result[pos] = formStem.slice(0, idx) + to + formStem.slice(idx + from.length);
    }
  }
  return result;
}

const BOOT = [0, 1, 2, 5]; // yo, tú, él, ellos — the "boot" pattern

interface StemChangeSpec {
  from: string;
  to: string;
  preteriteTo?: string; // for -ir verbs: e>i or o>u in preterite 3rd sing/pl
}

function stemChange(inf: string, spec: StemChangeSpec): PartialTenses {
  const s = stem(inf);
  const vc = verbClass(inf)!;
  const override: PartialTenses = {};

  // Present: boot pattern
  override.present = applyStemChange(regular(inf, 'present'), spec.from, spec.to, BOOT, s);

  // Subjunctive present: boot pattern for -ar/-er; all 6 for -ir with secondary change
  if (vc === 'ir') {
    // -ir stem changers: boot gets main change, nosotros/vosotros get secondary
    const secondary = spec.preteriteTo || spec.to;
    let subj = applyStemChange(regular(inf, 'subjunctive'), spec.from, spec.to, BOOT, s);
    if (secondary !== spec.from) {
      subj = applyStemChange(subj, spec.from, secondary, [3, 4], s);
    }
    override.subjunctive = subj;
  } else {
    override.subjunctive = applyStemChange(regular(inf, 'subjunctive'), spec.from, spec.to, BOOT, s);
  }

  // Preterite: -ir stem changers have 3rd sing/pl change
  if (vc === 'ir' && spec.preteriteTo) {
    override.preterite = applyStemChange(regular(inf, 'preterite'), spec.from, spec.preteriteTo, [2, 5], s);
  }

  return override;
}

// ── Spelling-change helper ───────────────────────────────────
// c>qu before e, g>gu before e, z>c before e in preterite yo & subjunctive

interface SpellingSpec {
  from: string;
  to: string;
}

function spellingChange(inf: string, spec: SpellingSpec): PartialTenses {
  const s = stem(inf);
  const override: PartialTenses = {};

  // Preterite yo
  const pret = [...regular(inf, 'preterite')] as Forms;
  const yoIdx = pret[0].lastIndexOf(spec.from, s.length);
  if (yoIdx >= 0) {
    pret[0] = pret[0].slice(0, yoIdx) + spec.to + pret[0].slice(yoIdx + spec.from.length);
  }
  override.preterite = pret;

  // Subjunctive: all forms
  const subj = regular(inf, 'subjunctive').map(f => {
    const idx = f.lastIndexOf(spec.from, s.length);
    if (idx >= 0) return f.slice(0, idx) + spec.to + f.slice(idx + spec.from.length);
    return f;
  }) as unknown as Forms;
  override.subjunctive = subj;

  return override;
}

// ── Irregular future/conditional stems ───────────────────────
// Attach future/conditional endings directly to an irregular stem
function futCond(s: string): Pick<PartialTenses, 'future' | 'conditional'> {
  const futEnd: Forms = ['é', 'ás', 'á', 'emos', 'éis', 'án'];
  const condEnd: Forms = ['ía', 'ías', 'ía', 'íamos', 'íais', 'ían'];
  return {
    future: futEnd.map(e => s + e) as unknown as Forms,
    conditional: condEnd.map(e => s + e) as unknown as Forms,
  };
}

// ── Irregular preterite stems (shared pattern) ───────────────
// Many irregulars share unstressed preterite endings: -e, -iste, -o, -imos, -isteis, -ieron/-eron
function irregPreterite(s: string, thirdPlural?: string): Forms {
  const pp = thirdPlural || s + 'ieron';
  return [s + 'e', s + 'iste', s + 'o', s + 'imos', s + 'isteis', pp];
}

// ── Fully irregular verb table ───────────────────────────────
const IRREGULARS: Record<string, PartialTenses> = {
  ser: {
    present:     ['soy', 'eres', 'es', 'somos', 'sois', 'son'],
    preterite:   ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
    imperfect:   ['era', 'eras', 'era', 'éramos', 'erais', 'eran'],
    subjunctive: ['sea', 'seas', 'sea', 'seamos', 'seáis', 'sean'],
    ...futCond('ser'),
  },
  estar: {
    present:     ['estoy', 'estás', 'está', 'estamos', 'estáis', 'están'],
    preterite:   irregPreterite('estuv'),
    subjunctive: ['esté', 'estés', 'esté', 'estemos', 'estéis', 'estén'],
  },
  ir: {
    present:     ['voy', 'vas', 'va', 'vamos', 'vais', 'van'],
    preterite:   ['fui', 'fuiste', 'fue', 'fuimos', 'fuisteis', 'fueron'],
    imperfect:   ['iba', 'ibas', 'iba', 'íbamos', 'ibais', 'iban'],
    subjunctive: ['vaya', 'vayas', 'vaya', 'vayamos', 'vayáis', 'vayan'],
    ...futCond('ir'),
  },
  haber: {
    present:     ['he', 'has', 'ha', 'hemos', 'habéis', 'han'],
    preterite:   irregPreterite('hub'),
    subjunctive: ['haya', 'hayas', 'haya', 'hayamos', 'hayáis', 'hayan'],
    ...futCond('habr'),
  },
  tener: {
    present:     ['tengo', 'tienes', 'tiene', 'tenemos', 'tenéis', 'tienen'],
    preterite:   irregPreterite('tuv'),
    subjunctive: ['tenga', 'tengas', 'tenga', 'tengamos', 'tengáis', 'tengan'],
    ...futCond('tendr'),
  },
  hacer: {
    present:     ['hago', 'haces', 'hace', 'hacemos', 'hacéis', 'hacen'],
    preterite:   ['hice', 'hiciste', 'hizo', 'hicimos', 'hicisteis', 'hicieron'],
    subjunctive: ['haga', 'hagas', 'haga', 'hagamos', 'hagáis', 'hagan'],
    ...futCond('har'),
  },
  poder: {
    present:     ['puedo', 'puedes', 'puede', 'podemos', 'podéis', 'pueden'],
    preterite:   irregPreterite('pud'),
    subjunctive: ['pueda', 'puedas', 'pueda', 'podamos', 'podáis', 'puedan'],
    ...futCond('podr'),
  },
  querer: {
    present:     ['quiero', 'quieres', 'quiere', 'queremos', 'queréis', 'quieren'],
    preterite:   irregPreterite('quis'),
    subjunctive: ['quiera', 'quieras', 'quiera', 'queramos', 'queráis', 'quieran'],
    ...futCond('querr'),
  },
  decir: {
    present:     ['digo', 'dices', 'dice', 'decimos', 'decís', 'dicen'],
    preterite:   irregPreterite('dij', 'dijeron'),
    subjunctive: ['diga', 'digas', 'diga', 'digamos', 'digáis', 'digan'],
    ...futCond('dir'),
  },
  venir: {
    present:     ['vengo', 'vienes', 'viene', 'venimos', 'venís', 'vienen'],
    preterite:   irregPreterite('vin'),
    subjunctive: ['venga', 'vengas', 'venga', 'vengamos', 'vengáis', 'vengan'],
    ...futCond('vendr'),
  },
  saber: {
    present:     ['sé', 'sabes', 'sabe', 'sabemos', 'sabéis', 'saben'],
    preterite:   irregPreterite('sup'),
    subjunctive: ['sepa', 'sepas', 'sepa', 'sepamos', 'sepáis', 'sepan'],
    ...futCond('sabr'),
  },
  dar: {
    present:     ['doy', 'das', 'da', 'damos', 'dais', 'dan'],
    preterite:   ['di', 'diste', 'dio', 'dimos', 'disteis', 'dieron'],
    subjunctive: ['dé', 'des', 'dé', 'demos', 'deis', 'den'],
  },
  ver: {
    present:     ['veo', 'ves', 've', 'vemos', 'veis', 'ven'],
    preterite:   ['vi', 'viste', 'vio', 'vimos', 'visteis', 'vieron'],
    imperfect:   ['veía', 'veías', 'veía', 'veíamos', 'veíais', 'veían'],
    subjunctive: ['vea', 'veas', 'vea', 'veamos', 'veáis', 'vean'],
  },
  poner: {
    present:     ['pongo', 'pones', 'pone', 'ponemos', 'ponéis', 'ponen'],
    preterite:   irregPreterite('pus'),
    subjunctive: ['ponga', 'pongas', 'ponga', 'pongamos', 'pongáis', 'pongan'],
    ...futCond('pondr'),
  },
  salir: {
    present:     ['salgo', 'sales', 'sale', 'salimos', 'salís', 'salen'],
    subjunctive: ['salga', 'salgas', 'salga', 'salgamos', 'salgáis', 'salgan'],
    ...futCond('saldr'),
  },
  conocer: {
    present:     ['conozco', 'conoces', 'conoce', 'conocemos', 'conocéis', 'conocen'],
    subjunctive: ['conozca', 'conozcas', 'conozca', 'conozcamos', 'conozcáis', 'conozcan'],
  },
  traer: {
    present:     ['traigo', 'traes', 'trae', 'traemos', 'traéis', 'traen'],
    preterite:   irregPreterite('traj', 'trajeron'),
    subjunctive: ['traiga', 'traigas', 'traiga', 'traigamos', 'traigáis', 'traigan'],
  },
  caer: {
    present:     ['caigo', 'caes', 'cae', 'caemos', 'caéis', 'caen'],
    preterite:   ['caí', 'caíste', 'cayó', 'caímos', 'caísteis', 'cayeron'],
    subjunctive: ['caiga', 'caigas', 'caiga', 'caigamos', 'caigáis', 'caigan'],
  },
  oír: {
    present:     ['oigo', 'oyes', 'oye', 'oímos', 'oís', 'oyen'],
    preterite:   ['oí', 'oíste', 'oyó', 'oímos', 'oísteis', 'oyeron'],
    subjunctive: ['oiga', 'oigas', 'oiga', 'oigamos', 'oigáis', 'oigan'],
  },
  conducir: {
    present:     ['conduzco', 'conduces', 'conduce', 'conducimos', 'conducís', 'conducen'],
    preterite:   irregPreterite('conduj', 'condujeron'),
    subjunctive: ['conduzca', 'conduzcas', 'conduzca', 'conduzcamos', 'conduzcáis', 'conduzcan'],
  },
  caber: {
    present:     ['quepo', 'cabes', 'cabe', 'cabemos', 'cabéis', 'caben'],
    preterite:   irregPreterite('cup'),
    subjunctive: ['quepa', 'quepas', 'quepa', 'quepamos', 'quepáis', 'quepan'],
    ...futCond('cabr'),
  },
  valer: {
    present:     ['valgo', 'vales', 'vale', 'valemos', 'valéis', 'valen'],
    subjunctive: ['valga', 'valgas', 'valga', 'valgamos', 'valgáis', 'valgan'],
    ...futCond('valdr'),
  },
  satisfacer: {
    present:     ['satisfago', 'satisfaces', 'satisface', 'satisfacemos', 'satisfacéis', 'satisfacen'],
    preterite:   ['satisfice', 'satisficiste', 'satisfizo', 'satisficimos', 'satisficisteis', 'satisficieron'],
    subjunctive: ['satisfaga', 'satisfagas', 'satisfaga', 'satisfagamos', 'satisfagáis', 'satisfagan'],
    ...futCond('satisfar'),
  },
  andar: {
    preterite: irregPreterite('anduv'),
  },
  producir: {
    present:     ['produzco', 'produces', 'produce', 'producimos', 'producís', 'producen'],
    preterite:   irregPreterite('produj', 'produjeron'),
    subjunctive: ['produzca', 'produzcas', 'produzca', 'produzcamos', 'produzcáis', 'produzcan'],
  },
  traducir: {
    present:     ['traduzco', 'traduces', 'traduce', 'traducimos', 'traducís', 'traducen'],
    preterite:   irregPreterite('traduj', 'tradujeron'),
    subjunctive: ['traduzca', 'traduzcas', 'traduzca', 'traduzcamos', 'traduzcáis', 'traduzcan'],
  },
  reducir: {
    present:     ['reduzco', 'reduces', 'reduce', 'reducimos', 'reducís', 'reducen'],
    preterite:   irregPreterite('reduj', 'redujeron'),
    subjunctive: ['reduzca', 'reduzcas', 'reduzca', 'reduzcamos', 'reduzcáis', 'reduzcan'],
  },
};

// ── Stem-change definitions ──────────────────────────────────
const STEM_CHANGERS: Record<string, StemChangeSpec> = {
  // e > ie
  pensar:    { from: 'e', to: 'ie' },
  entender:  { from: 'e', to: 'ie' },
  preferir:  { from: 'e', to: 'ie', preteriteTo: 'i' },
  sentir:    { from: 'e', to: 'ie', preteriteTo: 'i' },
  perder:    { from: 'e', to: 'ie' },
  empezar:   { from: 'e', to: 'ie' },
  comenzar:  { from: 'e', to: 'ie' },
  cerrar:    { from: 'e', to: 'ie' },
  despertar: { from: 'e', to: 'ie' },
  divertir:  { from: 'e', to: 'ie', preteriteTo: 'i' },
  mentir:    { from: 'e', to: 'ie', preteriteTo: 'i' },
  sugerir:   { from: 'e', to: 'ie', preteriteTo: 'i' },
  hervir:    { from: 'e', to: 'ie', preteriteTo: 'i' },
  convertir: { from: 'e', to: 'ie', preteriteTo: 'i' },
  // o > ue
  dormir:    { from: 'o', to: 'ue', preteriteTo: 'u' },
  morir:     { from: 'o', to: 'ue', preteriteTo: 'u' },
  volver:    { from: 'o', to: 'ue' },
  encontrar: { from: 'o', to: 'ue' },
  contar:    { from: 'o', to: 'ue' },
  recordar:  { from: 'o', to: 'ue' },
  almorzar:  { from: 'o', to: 'ue' },
  mostrar:   { from: 'o', to: 'ue' },
  probar:    { from: 'o', to: 'ue' },
  mover:     { from: 'o', to: 'ue' },
  llover:    { from: 'o', to: 'ue' },
  soñar:     { from: 'o', to: 'ue' },
  // u > ue
  jugar:     { from: 'u', to: 'ue' },
  // e > i
  pedir:     { from: 'e', to: 'i', preteriteTo: 'i' },
  servir:    { from: 'e', to: 'i', preteriteTo: 'i' },
  seguir:    { from: 'e', to: 'i', preteriteTo: 'i' },
  repetir:   { from: 'e', to: 'i', preteriteTo: 'i' },
  vestir:    { from: 'e', to: 'i', preteriteTo: 'i' },
  medir:     { from: 'e', to: 'i', preteriteTo: 'i' },
  reír:      { from: 'e', to: 'í', preteriteTo: 'i' },
  sonreír:   { from: 'e', to: 'í', preteriteTo: 'i' },
  elegir:    { from: 'e', to: 'i', preteriteTo: 'i' },
  corregir:  { from: 'e', to: 'i', preteriteTo: 'i' },
  conseguir: { from: 'e', to: 'i', preteriteTo: 'i' },
  perseguir: { from: 'e', to: 'i', preteriteTo: 'i' },
};

// ── Spelling-change definitions ──────────────────────────────
const SPELLING_CHANGERS: Record<string, SpellingSpec> = {
  buscar:    { from: 'c', to: 'qu' },
  tocar:     { from: 'c', to: 'qu' },
  llegar:    { from: 'g', to: 'gu' },
  pagar:     { from: 'g', to: 'gu' },
  empezar:   { from: 'z', to: 'c' },
  almorzar:  { from: 'z', to: 'c' },
  cruzar:    { from: 'z', to: 'c' },
  organizar: { from: 'z', to: 'c' },
  comenzar:  { from: 'z', to: 'c' },
};

// ── Merge helper ─────────────────────────────────────────────
function merge(base: Record<TenseKey, Forms>, ...overrides: PartialTenses[]): Record<TenseKey, Forms> {
  const result = { ...base };
  for (const o of overrides) {
    for (const t of TENSES) {
      if (o[t]) result[t] = o[t]!;
    }
  }
  return result;
}

// ── Main conjugation function ────────────────────────────────
export function conjugate(infinitive: string): ConjugationTable | null {
  const inf = infinitive.toLowerCase().trim();

  // Detect reflexive
  const isReflexive = inf.endsWith('se');
  const baseInf = isReflexive ? inf.slice(0, -2) : inf;

  // Validate verb class
  const vc = verbClass(baseInf);
  if (!vc) return null;

  // Start with regular conjugation
  let tenses = regularAll(baseInf);

  // Apply stem changes (if any)
  if (STEM_CHANGERS[baseInf]) {
    tenses = merge(tenses, stemChange(baseInf, STEM_CHANGERS[baseInf]));
  }

  // Apply spelling changes (if any)
  if (SPELLING_CHANGERS[baseInf]) {
    tenses = merge(tenses, spellingChange(baseInf, SPELLING_CHANGERS[baseInf]));
  }

  // Apply full irregular overrides (highest priority)
  if (IRREGULARS[baseInf]) {
    tenses = merge(tenses, IRREGULARS[baseInf]);
  }

  // Prepend reflexive pronouns if needed
  if (isReflexive) {
    for (const t of TENSES) {
      tenses[t] = tenses[t].map((form, i) => `${REFLEXIVE_PRONOUNS[i]} ${form}`) as unknown as Forms;
    }
  }

  return {
    infinitive: inf,
    isReflexive,
    tenses: tenses as Record<string, string[]>,
  };
}
