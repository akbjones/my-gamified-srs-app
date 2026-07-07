/**
 * Brazilian Portuguese verb conjugation engine
 * Handles regular -ar/-er/-ir verbs, 60+ irregular overrides,
 * stem-changers, spelling changers, and reflexive verbs.
 *
 * Person forms: eu, tu, ele/ela/voce, nos, vos, eles/elas/voces
 * Note: "tu" and "vos" are included for completeness though rarely
 * used in spoken Brazilian Portuguese.
 */
import type { ConjugationTable } from '../../types';

// ── Types ────────────────────────────────────────────────────
type Forms = [string, string, string, string, string, string];
type TenseKey = 'present' | 'preterite' | 'imperfect' | 'future' | 'conditional' | 'subjunctive' | 'imperative' | 'past_participle';
type PartialTenses = Partial<Record<TenseKey, Forms>>;

const TENSES: TenseKey[] = ['present', 'preterite', 'imperfect', 'future', 'conditional', 'subjunctive', 'imperative', 'past_participle'];

const TENSE_LABELS: Record<TenseKey, string> = {
  present: 'Presente (Present)',
  preterite: 'Pretérito (Preterite)',
  imperfect: 'Imperfeito (Imperfect)',
  future: 'Futuro (Future)',
  conditional: 'Condicional (Conditional)',
  subjunctive: 'Subjuntivo (Subjunctive)',
  imperative: 'Imperativo (Imperative)',
  past_participle: 'Particípio (Past Participle)',
};

const PT_IRREGULAR_PARTICIPLES: Record<string, string> = {
  fazer: 'feito', dizer: 'dito', ver: 'visto', escrever: 'escrito',
  abrir: 'aberto', pôr: 'posto', vir: 'vindo', morrer: 'morto',
  pagar: 'pago', ganhar: 'ganho', gastar: 'gasto', aceitar: 'aceito',
  satisfazer: 'satisfeito', descobrir: 'descoberto', cobrir: 'coberto',
  expor: 'exposto', compor: 'composto', propor: 'proposto', supor: 'suposto',
  dispor: 'disposto', opor: 'oposto', impor: 'imposto', depor: 'deposto',
  refazer: 'refeito', desfazer: 'desfeito',
};
function ptPastParticiple(inf: string): string {
  if (PT_IRREGULAR_PARTICIPLES[inf]) return PT_IRREGULAR_PARTICIPLES[inf];
  if (inf.endsWith('ar')) return inf.slice(0, -2) + 'ado';
  if (inf.endsWith('er') || inf.endsWith('ir')) return inf.slice(0, -2) + 'ido';
  return inf;
}
const REFLEXIVE_PRONOUNS: Forms = ['me', 'te', 'se', 'nos', 'vos', 'se'];

// ── Helpers ──────────────────────────────────────────────────
const f = (s: string): Forms => s.split(',') as unknown as Forms;

/** Get verb class: 'ar' | 'er' | 'ir' | 'or' (for por) */
function verbClass(inf: string): string | null {
  if (inf === 'pôr' || inf.endsWith('por')) return 'or';
  if (inf.endsWith('ar')) return 'ar';
  if (inf.endsWith('er')) return 'er';
  if (inf.endsWith('ir')) return 'ir';
  return null;
}

/** Get the stem (infinitive minus last 2 chars, or 2 for -or) */
function stem(inf: string): string {
  if (inf === 'pôr') return 'p';
  if (inf.endsWith('por')) return inf.slice(0, -3);
  return inf.slice(0, -2);
}

/** Apply stem to endings */
function apply(s: string, ends: Forms): Forms {
  return ends.map(e => s + e) as unknown as Forms;
}

/** Merge partial overrides onto a base set of tenses */
function merge(base: Record<TenseKey, Forms>, ...overrides: PartialTenses[]): Record<TenseKey, Forms> {
  const result = { ...base };
  for (const o of overrides) {
    for (const t of TENSES) {
      if (o[t]) result[t] = o[t]!;
    }
  }
  return result;
}

// ── Regular endings ──────────────────────────────────────────
// Person order: eu, tu, ele/ela/voce, nos, vos, eles/elas/voces
const REG: Record<string, Record<TenseKey, Forms>> = {
  ar: {
    present:     f('o,as,a,amos,ais,am'),
    preterite:   f('ei,aste,ou,amos,astes,aram'),
    imperfect:   f('ava,avas,ava,ávamos,áveis,avam'),
    future:      f('arei,arás,ará,aremos,areis,arão'),
    conditional: f('aria,arias,aria,aríamos,aríeis,ariam'),
    subjunctive: f('e,es,e,emos,eis,em'),
    // Affirmative imperative. Slot 0 (eu) has no imperative; slots 2/3/5
    // (você/nós/vocês) get patched from the final subjunctive in conjugate().
    imperative:  f('-,a,e,emos,ai,em'),
    past_participle: f(',,,,,'),
  },
  er: {
    present:     f('o,es,e,emos,eis,em'),
    preterite:   f('i,este,eu,emos,estes,eram'),
    imperfect:   f('ia,ias,ia,íamos,íeis,iam'),
    future:      f('erei,erás,erá,eremos,ereis,erão'),
    conditional: f('eria,erias,eria,eríamos,eríeis,eriam'),
    subjunctive: f('a,as,a,amos,ais,am'),
    imperative:  f('-,e,a,amos,ei,am'),
    past_participle: f(',,,,,'),
  },
  ir: {
    present:     f('o,es,e,imos,is,em'),
    preterite:   f('i,iste,iu,imos,istes,iram'),
    imperfect:   f('ia,ias,ia,íamos,íeis,iam'),
    future:      f('irei,irás,irá,iremos,ireis,irão'),
    conditional: f('iria,irias,iria,iríamos,iríeis,iriam'),
    subjunctive: f('a,as,a,amos,ais,am'),
    imperative:  f('-,e,a,amos,i,am'),
    past_participle: f(',,,,,'),
  },
};

// ── Regular conjugation builder ─────────────────────────────

/** Apply stem to regular endings for one tense */
function regular(inf: string, tense: TenseKey): Forms {
  const vc = verbClass(inf);
  if (!vc || vc === 'or') return f(',,,,, ');
  const s = stem(inf);
  const endings = REG[vc][tense];
  // "-" placeholder (e.g. yo/eu slot of imperative) stays as-is rather
  // than being concatenated with the stem.
  // Future and conditional use the full infinitive as stem
  if (tense === 'future' || tense === 'conditional') {
    return endings.map(e => e === '-' ? '-' : s + e) as unknown as Forms;
  }
  return endings.map(e => e === '-' ? '-' : s + e) as unknown as Forms;
}

/** Build full regular conjugation for an infinitive */
function regularAll(inf: string): Record<TenseKey, Forms> {
  const result = {} as Record<TenseKey, Forms>;
  for (const t of TENSES) result[t] = regular(inf, t);
  return result;
}

// ── Spelling-change helpers ─────────────────────────────────
// Portuguese orthographic rules to preserve consonant sounds

interface SpellingSpec {
  from: string;
  to: string;
  /** Contexts where the change applies: 'e' = before e, 'ao' = before a/o */
  context: 'e' | 'ao';
}

/**
 * Apply spelling changes.
 * For context 'e': affects preterite eu (pos 0) and all subjunctive forms (-ar verbs)
 * For context 'ao': affects present eu (pos 0) and all subjunctive forms (-er/-ir verbs)
 */
function applySpellingChange(inf: string, spec: SpellingSpec): PartialTenses {
  const s = stem(inf);
  const override: PartialTenses = {};

  if (spec.context === 'e') {
    // -car, -gar, -car verbs: change before e (preterite 1st person, subjunctive)
    // Preterite: only eu form
    const pret = [...regular(inf, 'preterite')] as Forms;
    const idx = s.lastIndexOf(spec.from);
    if (idx >= 0) {
      const newStem = s.slice(0, idx) + spec.to + s.slice(idx + spec.from.length);
      pret[0] = newStem + REG.ar.preterite[0];
    }
    override.preterite = pret;

    // Subjunctive: all forms
    const subjEndings = REG.ar.subjunctive;
    const newStemAll = s.slice(0, s.lastIndexOf(spec.from)) + spec.to + s.slice(s.lastIndexOf(spec.from) + spec.from.length);
    override.subjunctive = subjEndings.map(e => newStemAll + e) as unknown as Forms;
  } else {
    // -ger, -gir, -cer, -guir verbs: change before a/o (present 1st person, subjunctive)
    // Present: only eu form
    const vc = verbClass(inf)!;
    const pres = [...regular(inf, 'present')] as Forms;
    const idx = s.lastIndexOf(spec.from);
    if (idx >= 0) {
      const newStem = s.slice(0, idx) + spec.to + s.slice(idx + spec.from.length);
      pres[0] = newStem + REG[vc].present[0];
    }
    override.present = pres;

    // Subjunctive: all forms (subjunctive endings for -er/-ir start with a)
    const subjEndings = REG[vc].subjunctive;
    const newStemAll = s.slice(0, s.lastIndexOf(spec.from)) + spec.to + s.slice(s.lastIndexOf(spec.from) + spec.from.length);
    override.subjunctive = subjEndings.map(e => newStemAll + e) as unknown as Forms;
  }

  return override;
}

// Verbs with spelling changes
const SPELLING_RULES: Record<string, SpellingSpec> = {
  // -car verbs: c -> qu before e
  ficar:      { from: 'c', to: 'qu', context: 'e' },
  tocar:      { from: 'c', to: 'qu', context: 'e' },
  buscar:     { from: 'c', to: 'qu', context: 'e' },
  explicar:   { from: 'c', to: 'qu', context: 'e' },
  comunicar:  { from: 'c', to: 'qu', context: 'e' },
  indicar:    { from: 'c', to: 'qu', context: 'e' },
  praticar:   { from: 'c', to: 'qu', context: 'e' },
  publicar:   { from: 'c', to: 'qu', context: 'e' },
  // -gar verbs: g -> gu before e
  pagar:      { from: 'g', to: 'gu', context: 'e' },
  chegar:     { from: 'g', to: 'gu', context: 'e' },
  jogar:      { from: 'g', to: 'gu', context: 'e' },
  entregar:   { from: 'g', to: 'gu', context: 'e' },
  // -çar verbs: ç -> c before e
  começar:    { from: 'ç', to: 'c', context: 'e' },
  dançar:     { from: 'ç', to: 'c', context: 'e' },
  almoçar:    { from: 'ç', to: 'c', context: 'e' },
  abraçar:    { from: 'ç', to: 'c', context: 'e' },
  // -ger/-gir verbs: g -> j before a/o
  proteger:   { from: 'g', to: 'j', context: 'ao' },
  eleger:     { from: 'g', to: 'j', context: 'ao' },
  fugir:      { from: 'g', to: 'j', context: 'ao' },
  dirigir:    { from: 'g', to: 'j', context: 'ao' },
  exigir:     { from: 'g', to: 'j', context: 'ao' },
  // -cer verbs: c -> ç before a/o
  conhecer:   { from: 'c', to: 'ç', context: 'ao' },
  parecer:    { from: 'c', to: 'ç', context: 'ao' },
  esquecer:   { from: 'c', to: 'ç', context: 'ao' },
  oferecer:   { from: 'c', to: 'ç', context: 'ao' },
  acontecer:  { from: 'c', to: 'ç', context: 'ao' },
  agradecer:  { from: 'c', to: 'ç', context: 'ao' },
  crescer:    { from: 'c', to: 'ç', context: 'ao' },
  merecer:    { from: 'c', to: 'ç', context: 'ao' },
  pertencer:  { from: 'c', to: 'ç', context: 'ao' },
  reconhecer: { from: 'c', to: 'ç', context: 'ao' },
  // -guir verbs: gu -> g before a/o
  seguir:     { from: 'gu', to: 'g', context: 'ao' },
  conseguir:  { from: 'gu', to: 'g', context: 'ao' },
  perseguir:  { from: 'gu', to: 'g', context: 'ao' },
  distinguir: { from: 'gu', to: 'g', context: 'ao' },
  extinguir:  { from: 'gu', to: 'g', context: 'ao' },
};

// ── -ear verb handling ──────────────────────────────────────
// -ear verbs: insert 'i' before stressed endings in present (eu, tu, ele, eles)
// and in subjunctive (all forms, since subjunctive endings start with 'e')
const EAR_VERBS = new Set([
  'passear', 'recear', 'nomear', 'chatear', 'bloquear',
  'golpear', 'frear', 'semear', 'estrear',
]);

function applyEarChange(inf: string): PartialTenses {
  const s = stem(inf); // e.g., 'passe' for 'passear'
  const override: PartialTenses = {};

  // Present: insert i before stressed a/e/o endings in boot positions [0,1,2,5]
  const pres = [...regular(inf, 'present')] as Forms;
  // eu: passeio, tu: passeias, ele: passeia, eles: passeiam
  pres[0] = s + 'io';
  pres[1] = s + 'ias';
  pres[2] = s + 'ia';
  pres[5] = s + 'iam';
  override.present = pres;

  // Subjunctive: all forms get 'i' inserted: passeie, passeies, passeie, passeiemos, passeeis, passeiem
  // Actually: passeie, passeies, passeie, passeemos, passeeis, passeiem
  const subj = [...regular(inf, 'subjunctive')] as Forms;
  subj[0] = s + 'ie';
  subj[1] = s + 'ies';
  subj[2] = s + 'ie';
  // nos/vos keep regular: passeemos, passeeis
  subj[5] = s + 'iem';
  override.subjunctive = subj;

  return override;
}

// ── Stem-change helpers ─────────────────────────────────────
// Portuguese -ir verbs have stem vowel changes in present tense

interface StemChangeSpec {
  from: string;
  to: string;
  /** Positions to change in present: boot = [0,1,2,5], eu-only = [0] */
  positions: number[];
  /** If true, subjunctive also gets the change (in all positions) */
  subjAll?: boolean;
}

function applyStemChangePositions(
  forms: Forms,
  from: string,
  to: string,
  positions: number[],
  stemStr: string,
): Forms {
  const result = [...forms] as Forms;
  // Bound the search to the stem portion only (indices 0..stemLen-1).
  // Using stemStr.length included the first char of the ending and would
  // wrongly match the trailing vowel of subjunctive endings — same latent
  // bug the Spanish engine had.
  const searchUpTo = Math.max(0, stemStr.length - 1);
  for (const pos of positions) {
    const form = result[pos];
    if (form === '-') continue;
    const idx = form.lastIndexOf(from, searchUpTo);
    if (idx >= 0) {
      result[pos] = form.slice(0, idx) + to + form.slice(idx + from.length);
    }
  }
  return result;
}

const BOOT = [0, 1, 2, 5]; // eu, tu, ele, eles

// Stem-changing -ir verbs
const STEM_CHANGERS: Record<string, StemChangeSpec> = {
  // e -> i (present: eu only for most; boot for some)
  sentir:    { from: 'e', to: 'i', positions: [0] },
  mentir:    { from: 'e', to: 'i', positions: [0] },
  vestir:    { from: 'e', to: 'i', positions: [0] },
  servir:    { from: 'e', to: 'i', positions: [0] },
  repetir:   { from: 'e', to: 'i', positions: [0] },
  competir:  { from: 'e', to: 'i', positions: [0] },
  preferir:  { from: 'e', to: 'i', positions: [0] },
  sugerir:   { from: 'e', to: 'i', positions: [0] },
  divertir:  { from: 'e', to: 'i', positions: [0] },
  ferir:     { from: 'e', to: 'i', positions: [0] },
  aderir:    { from: 'e', to: 'i', positions: [0] },
  inserir:   { from: 'e', to: 'i', positions: [0] },
  // o -> u (present: eu only)
  dormir:    { from: 'o', to: 'u', positions: [0] },
  cobrir:    { from: 'o', to: 'u', positions: [0] },
  descobrir: { from: 'o', to: 'u', positions: [0] },
  engolir:   { from: 'o', to: 'u', positions: [0] },
  tossir:    { from: 'o', to: 'u', positions: [0] },
  // u -> o (present: boot pattern -- eu stays u, others get o)
  subir:     { from: 'u', to: 'o', positions: [1, 2, 5] },
  acudir:    { from: 'u', to: 'o', positions: [1, 2, 5] },
  sacudir:   { from: 'u', to: 'o', positions: [1, 2, 5] },
  // e -> i for -eguir verbs (handled via spelling + stem change interaction)
  seguir:    { from: 'e', to: 'i', positions: [0] },
  conseguir: { from: 'e', to: 'i', positions: [0] },
  perseguir: { from: 'e', to: 'i', positions: [0] },
};

function applyStemChanges(inf: string, spec: StemChangeSpec): PartialTenses {
  const s = stem(inf);
  const override: PartialTenses = {};

  // Present: apply to specified positions
  override.present = applyStemChangePositions(
    regular(inf, 'present'), spec.from, spec.to, spec.positions, s
  );

  return override;
}

// ── Irregular future/conditional stems ───────────────────────
function futCond(s: string): Pick<PartialTenses, 'future' | 'conditional'> {
  return {
    future:      f(`${s}ei,${s}ás,${s}á,${s}emos,${s}eis,${s}ão`),
    conditional: f(`${s}ia,${s}ias,${s}ia,${s}íamos,${s}íeis,${s}iam`),
  };
}

// ── Irregular preterite helper (Portuguese strong preterite) ──
// Portuguese strong preterites: -e, -este, -e(special), -emos, -estes, -eram
function irregPreterite(s: string, third: string, thirdPl: string): Forms {
  return [s + 'e', s + 'este', third, s + 'emos', s + 'estes', thirdPl];
}

// ── Fully irregular verb table ───────────────────────────────
// Irregular tu-imperative forms — these don't follow the 3sg-present
// pattern. Slots 2/3/5 (você/nós/vocês) come from the final subjunctive,
// so we only override slot 1 here.
const IRREGULAR_TU_IMPERATIVE: Record<string, string> = {
  ser: 'sê',
  ter: 'tem',
  ir: 'vai',
  fazer: 'faz',
  vir: 'vem',
  dizer: 'diz',
  pôr: 'põe',
  ver: 'vê',
  saber: 'sabe',
  haver: 'há',
  estar: 'está',
  poder: 'pode',
  querer: 'quer',
};

// Irregular vós (slot 4) imperative forms — for short-stem verbs the regular
// stem + ei/i pattern fails (ser → "sei" instead of "sede"). The vós form
// is morphologically infinitive minus -r + -de for these.
const IRREGULAR_VOS_IMPERATIVE: Record<string, string> = {
  ser: 'sede',
  ter: 'tende',
  ir: 'ide',
  vir: 'vinde',
  ver: 'vede',
  pôr: 'ponde',
};

const IRREGULARS: Record<string, PartialTenses> = {
  // ─── ser ───
  ser: {
    present:     f('sou,és,é,somos,sois,são'),
    preterite:   f('fui,foste,foi,fomos,fostes,foram'),
    imperfect:   f('era,eras,era,éramos,éreis,eram'),
    subjunctive: f('seja,sejas,seja,sejamos,sejais,sejam'),
    ...futCond('ser'),
  },
  // ─── estar ───
  estar: {
    present:     f('estou,estás,está,estamos,estais,estão'),
    preterite:   f('estive,estiveste,esteve,estivemos,estivestes,estiveram'),
    subjunctive: f('esteja,estejas,esteja,estejamos,estejais,estejam'),
  },
  // ─── ter ───
  ter: {
    present:     f('tenho,tens,tem,temos,tendes,têm'),
    preterite:   f('tive,tiveste,teve,tivemos,tivestes,tiveram'),
    imperfect:   f('tinha,tinhas,tinha,tínhamos,tínheis,tinham'),
    subjunctive: f('tenha,tenhas,tenha,tenhamos,tenhais,tenham'),
    ...futCond('ter'),
  },
  // ─── haver ───
  haver: {
    present:     f('hei,hás,há,havemos,haveis,hão'),
    preterite:   f('houve,houveste,houve,houvemos,houvestes,houveram'),
    subjunctive: f('haja,hajas,haja,hajamos,hajais,hajam'),
    ...futCond('haver'),
  },
  // ─── ir ───
  ir: {
    present:     f('vou,vais,vai,vamos/vamo,ides,vão'),
    preterite:   f('fui,foste,foi,fomos,fostes,foram'),
    imperfect:   f('ia,ias,ia,íamos,íeis,iam'),
    subjunctive: f('vá,vás,vá,vamos,vades,vão'),
    ...futCond('ir'),
  },
  // ─── vir ───
  vir: {
    present:     f('venho,vens,vem,vimos,vindes,vêm'),
    preterite:   f('vim,vieste,veio,viemos,viestes,vieram'),
    imperfect:   f('vinha,vinhas,vinha,vínhamos,vínheis,vinham'),
    subjunctive: f('venha,venhas,venha,venhamos,venhais,venham'),
    ...futCond('vir'),
  },
  // ─── ver ───
  ver: {
    present:     f('vejo,vês,vê,vemos,vedes,veem'),
    preterite:   f('vi,viste,viu,vimos,vistes,viram'),
    subjunctive: f('veja,vejas,veja,vejamos,vejais,vejam'),
    ...futCond('ver'),
  },
  // ─── dar ───
  dar: {
    present:     f('dou,dás,dá,damos,dais,dão'),
    preterite:   f('dei,deste,deu,demos,destes,deram'),
    subjunctive: f('dê,dês,dê,demos,deis,deem'),
  },
  // ─── dizer ───
  dizer: {
    present:     f('digo,dizes,diz,dizemos,dizeis,dizem'),
    preterite:   f('disse,disseste,disse,dissemos,dissestes,disseram'),
    subjunctive: f('diga,digas,diga,digamos,digais,digam'),
    ...futCond('dir'),
  },
  // ─── fazer ───
  fazer: {
    present:     f('faço,fazes,faz,fazemos,fazeis,fazem'),
    preterite:   f('fiz,fizeste,fez,fizemos,fizestes,fizeram'),
    subjunctive: f('faça,faças,faça,façamos,façais,façam'),
    ...futCond('far'),
  },
  // ─── poder ───
  poder: {
    present:     f('posso,podes,pode,podemos,podeis,podem'),
    preterite:   f('pude,pudeste,pôde,pudemos,pudestes,puderam'),
    subjunctive: f('possa,possas,possa,possamos,possais,possam'),
  },
  // ─── saber ───
  saber: {
    present:     f('sei,sabes,sabe,sabemos,sabeis,sabem'),
    preterite:   f('soube,soubeste,soube,soubemos,soubestes,souberam'),
    subjunctive: f('saiba,saibas,saiba,saibamos,saibais,saibam'),
    ...futCond('saber'),
  },
  // ─── querer ───
  querer: {
    present:     f('quero,queres,quer,queremos,quereis,querem'),
    preterite:   f('quis,quiseste,quis,quisemos,quisestes,quiseram'),
    subjunctive: f('queira,queiras,queira,queiramos,queirais,queiram'),
  },
  // ─── trazer ───
  trazer: {
    present:     f('trago,trazes,traz,trazemos,trazeis,trazem'),
    preterite:   f('trouxe,trouxeste,trouxe,trouxemos,trouxestes,trouxeram'),
    subjunctive: f('traga,tragas,traga,tragamos,tragais,tragam'),
    ...futCond('trar'),
  },
  // ─── por (and derivatives) ───
  'pôr': {
    present:     f('ponho,pões,põe,pomos,pondes,põem'),
    preterite:   f('pus,puseste,pôs,pusemos,pusestes,puseram'),
    imperfect:   f('punha,punhas,punha,púnhamos,púnheis,punham'),
    subjunctive: f('ponha,ponhas,ponha,ponhamos,ponhais,ponham'),
    ...futCond('por'),
  },
  compor: {
    present:     f('componho,compões,compõe,compomos,compondes,compõem'),
    preterite:   f('compus,compuseste,compôs,compusemos,compusestes,compuseram'),
    imperfect:   f('compunha,compunhas,compunha,compúnhamos,compúnheis,compunham'),
    subjunctive: f('componha,componhas,componha,componhamos,componhais,componham'),
    ...futCond('compor'),
  },
  propor: {
    present:     f('proponho,propões,propõe,propomos,propondes,propõem'),
    preterite:   f('propus,propuseste,propôs,propusemos,propusestes,propuseram'),
    imperfect:   f('propunha,propunhas,propunha,propúnhamos,propúnheis,propunham'),
    subjunctive: f('proponha,proponhas,proponha,proponhamos,proponhais,proponham'),
    ...futCond('propor'),
  },
  supor: {
    present:     f('suponho,supões,supõe,supomos,supondes,supõem'),
    preterite:   f('supus,supuseste,supôs,supusemos,supusestes,supuseram'),
    imperfect:   f('supunha,supunhas,supunha,supúnhamos,supúnheis,supunham'),
    subjunctive: f('suponha,suponhas,suponha,suponhamos,suponhais,suponham'),
    ...futCond('supor'),
  },
  dispor: {
    present:     f('disponho,dispões,dispõe,dispomos,dispondes,dispõem'),
    preterite:   f('dispus,dispuseste,dispôs,dispusemos,dispusestes,dispuseram'),
    imperfect:   f('dispunha,dispunhas,dispunha,dispúnhamos,dispúnheis,dispunham'),
    subjunctive: f('disponha,disponhas,disponha,disponhamos,disponhais,disponham'),
    ...futCond('dispor'),
  },
  impor: {
    present:     f('imponho,impões,impõe,impomos,impondes,impõem'),
    preterite:   f('impus,impuseste,impôs,impusemos,impusestes,impuseram'),
    imperfect:   f('impunha,impunhas,impunha,impúnhamos,impúnheis,impunham'),
    subjunctive: f('imponha,imponhas,imponha,imponhamos,imponhais,imponham'),
    ...futCond('impor'),
  },
  opor: {
    present:     f('oponho,opões,opõe,opomos,opondes,opõem'),
    preterite:   f('opus,opuseste,opôs,opusemos,opusestes,opuseram'),
    imperfect:   f('opunha,opunhas,opunha,opúnhamos,opúnheis,opunham'),
    subjunctive: f('oponha,oponhas,oponha,oponhamos,oponhais,oponham'),
    ...futCond('opor'),
  },
  repor: {
    present:     f('reponho,repões,repõe,repomos,repondes,repõem'),
    preterite:   f('repus,repuseste,repôs,repusemos,repusestes,repuseram'),
    imperfect:   f('repunha,repunhas,repunha,repúnhamos,repúnheis,repunham'),
    subjunctive: f('reponha,reponhas,reponha,reponhamos,reponhais,reponham'),
    ...futCond('repor'),
  },
  expor: {
    present:     f('exponho,expões,expõe,expomos,expondes,expõem'),
    preterite:   f('expus,expuseste,expôs,expusemos,expusestes,expuseram'),
    imperfect:   f('expunha,expunhas,expunha,expúnhamos,expúnheis,expunham'),
    subjunctive: f('exponha,exponhas,exponha,exponhamos,exponhais,exponham'),
    ...futCond('expor'),
  },
  // ─── caber ───
  caber: {
    present:     f('caibo,cabes,cabe,cabemos,cabeis,cabem'),
    preterite:   f('coube,coubeste,coube,coubemos,coubestes,couberam'),
    subjunctive: f('caiba,caibas,caiba,caibamos,caibais,caibam'),
  },
  // ─── ler ───
  ler: {
    present:     f('leio,lês,lê,lemos,ledes,leem'),
    preterite:   f('li,leste,leu,lemos,lestes,leram'),
    subjunctive: f('leia,leias,leia,leiamos,leiais,leiam'),
  },
  // ─── crer ───
  crer: {
    present:     f('creio,crês,crê,cremos,credes,creem'),
    preterite:   f('cri,creste,creu,cremos,crestes,creram'),
    subjunctive: f('creia,creias,creia,creiamos,creiais,creiam'),
  },
  // ─── rir ───
  rir: {
    present:     f('rio,ris,ri,rimos,rides,riem'),
    subjunctive: f('ria,rias,ria,riamos,riais,riam'),
  },
  // ─── ouvir ───
  ouvir: {
    present:     f('ouço,ouves,ouve,ouvimos,ouvis,ouvem'),
    subjunctive: f('ouça,ouças,ouça,ouçamos,ouçais,ouçam'),
  },
  // ─── pedir ───
  pedir: {
    present:     f('peço,pedes,pede,pedimos,pedis,pedem'),
    subjunctive: f('peça,peças,peça,peçamos,peçais,peçam'),
  },
  // ─── medir ───
  medir: {
    present:     f('meço,medes,mede,medimos,medis,medem'),
    subjunctive: f('meça,meças,meça,meçamos,meçais,meçam'),
  },
  // ─── perder ───
  perder: {
    present:     f('perco,perdes,perde,perdemos,perdeis,perdem'),
    subjunctive: f('perca,percas,perca,percamos,percais,percam'),
  },
  // ─── valer ───
  valer: {
    present:     f('valho,vales,vale,valemos,valeis,valem'),
    subjunctive: f('valha,valhas,valha,valhamos,valhais,valham'),
  },
  // ─── sair ───
  sair: {
    present:     f('saio,sais,sai,saímos,saís,saem'),
    subjunctive: f('saia,saias,saia,saiamos,saiais,saiam'),
  },
  // ─── cair ───
  cair: {
    present:     f('caio,cais,cai,caímos,caís,caem'),
    subjunctive: f('caia,caias,caia,caiamos,caiais,caiam'),
  },
  // ─── subir (irregular present) ───
  subir: {
    present:     f('subo,sobes,sobe,subimos,subis,sobem'),
  },
  // ─── fugir ───
  fugir: {
    present:     f('fujo,foges,foge,fugimos,fugis,fogem'),
    subjunctive: f('fuja,fujas,fuja,fujamos,fujais,fujam'),
  },
  // ─── sentir ───
  sentir: {
    present:     f('sinto,sentes,sente,sentimos,sentis,sentem'),
    subjunctive: f('sinta,sintas,sinta,sintamos,sintais,sintam'),
  },
  // ─── mentir ───
  mentir: {
    present:     f('minto,mentes,mente,mentimos,mentis,mentem'),
    subjunctive: f('minta,mintas,minta,mintamos,mintais,mintam'),
  },
  // ─── dormir ───
  dormir: {
    present:     f('durmo,dormes,dorme,dormimos,dormis,dormem'),
    subjunctive: f('durma,durmas,durma,durmamos,durmais,durmam'),
  },
  // ─── cobrir ───
  cobrir: {
    present:     f('cubro,cobres,cobre,cobrimos,cobris,cobrem'),
    subjunctive: f('cubra,cubras,cubra,cubramos,cubrais,cubram'),
  },
  // ─── descobrir ───
  descobrir: {
    present:     f('descubro,descobres,descobre,descobrimos,descobris,descobrem'),
    subjunctive: f('descubra,descubras,descubra,descubramos,descubrais,descubram'),
  },
  // ─── abrir ───
  abrir: {
    // Regular present, but included for completeness
    present:     f('abro,abres,abre,abrimos,abris,abrem'),
    subjunctive: f('abra,abras,abra,abramos,abrais,abram'),
  },
  // ─── engolir ───
  engolir: {
    present:     f('engulo,engoles,engole,engolimos,engolis,engolem'),
    subjunctive: f('engula,engulas,engula,engulamos,engulais,engulam'),
  },
  // ─── tossir ───
  tossir: {
    present:     f('tusso,tosses,tosse,tossimos,tossis,tossem'),
    subjunctive: f('tussa,tussas,tussa,tussamos,tussais,tussam'),
  },
  // ─── construir ───
  construir: {
    present:     f('construo,constróis,constrói,construímos,construís,constroem'),
    subjunctive: f('construa,construas,construa,construamos,construais,construam'),
  },
  // ─── destruir ───
  destruir: {
    present:     f('destruo,destróis,destrói,destruímos,destruís,destroem'),
    subjunctive: f('destrua,destruas,destrua,destruamos,destruais,destruam'),
  },
  // ─── incluir ───
  incluir: {
    present:     f('incluo,incluis,inclui,incluímos,incluís,incluem'),
    subjunctive: f('inclua,incluas,inclua,incluamos,incluais,incluam'),
  },
  // ─── possuir ───
  possuir: {
    present:     f('possuo,possuis,possui,possuímos,possuís,possuem'),
    subjunctive: f('possua,possuas,possua,possuamos,possuais,possuam'),
  },
  // ─── seguir ───
  seguir: {
    present:     f('sigo,segues,segue,seguimos,seguis,seguem'),
    subjunctive: f('siga,sigas,siga,sigamos,sigais,sigam'),
  },
  // ─── conseguir ───
  conseguir: {
    present:     f('consigo,consegues,consegue,conseguimos,conseguis,conseguem'),
    subjunctive: f('consiga,consigas,consiga,consigamos,consigais,consigam'),
  },
  // ─── preferir ───
  preferir: {
    present:     f('prefiro,preferes,prefere,preferimos,preferis,preferem'),
    subjunctive: f('prefira,prefiras,prefira,prefiramos,prefirais,prefiram'),
  },
  // ─── sugerir ───
  sugerir: {
    present:     f('sugiro,sugeres,sugere,sugerimos,sugeris,sugerem'),
    subjunctive: f('sugira,sugiras,sugira,sugiramos,sugirais,sugiram'),
  },
  // ─── divertir ───
  divertir: {
    present:     f('divirto,divertes,diverte,divertimos,divertis,divertem'),
    subjunctive: f('divirta,divirtas,divirta,divirtamos,divirtais,divirtam'),
  },
  // ─── vestir ───
  vestir: {
    present:     f('visto,vestes,veste,vestimos,vestis,vestem'),
    subjunctive: f('vista,vistas,vista,vistamos,vistais,vistam'),
  },
  // ─── servir ───
  servir: {
    present:     f('sirvo,serves,serve,servimos,servis,servem'),
    subjunctive: f('sirva,sirvas,sirva,sirvamos,sirvais,sirvam'),
  },
  // ─── repetir ───
  repetir: {
    present:     f('repito,repetes,repete,repetimos,repetis,repetem'),
    subjunctive: f('repita,repitas,repita,repitamos,repitais,repitam'),
  },
  // ─── competir ───
  competir: {
    present:     f('compito,competes,compete,competimos,competis,competem'),
    subjunctive: f('compita,compitas,compita,compitamos,compitais,compitam'),
  },
  // ─── produzir ───
  produzir: {
    present:     f('produzo,produzes,produz,produzimos,produzis,produzem'),
    subjunctive: f('produza,produzas,produza,produzamos,produzais,produzam'),
  },
  // ─── conduzir ───
  conduzir: {
    present:     f('conduzo,conduzes,conduz,conduzimos,conduzis,conduzem'),
    subjunctive: f('conduza,conduzas,conduza,conduzamos,conduzais,conduzam'),
  },
  // ─── traduzir ───
  traduzir: {
    present:     f('traduzo,traduzes,traduz,traduzimos,traduzis,traduzem'),
    subjunctive: f('traduza,traduzas,traduza,traduzamos,traduzais,traduzam'),
  },
  // ─── reduzir ───
  reduzir: {
    present:     f('reduzo,reduzes,reduz,reduzimos,reduzis,reduzem'),
    subjunctive: f('reduza,reduzas,reduza,reduzamos,reduzais,reduzam'),
  },
  // ─── agredir ───
  agredir: {
    present:     f('agrido,agrides,agride,agredimos,agredis,agridem'),
    subjunctive: f('agrida,agridas,agrida,agridamos,agridais,agridam'),
  },
  // ─── progredir ───
  progredir: {
    present:     f('progrido,progrides,progride,progredimos,progredis,progridem'),
    subjunctive: f('progrida,progridas,progrida,progridamos,progridais,progridam'),
  },
  // ─── prevenir ───
  prevenir: {
    present:     f('previno,prevines,previne,prevenimos,prevenis,previnem'),
    subjunctive: f('previna,previnas,previna,previnamos,previnais,previnam'),
  },
  // ─── perseguir ───
  perseguir: {
    present:     f('persigo,persegues,persegue,perseguimos,perseguis,perseguem'),
    subjunctive: f('persiga,persigas,persiga,persigamos,persigais,persigam'),
  },
};

// ── Main conjugation function ────────────────────────────────
export function conjugate(infinitive: string): ConjugationTable | null {
  if (!infinitive) return null;
  const raw = infinitive.trim().toLowerCase();

  // Detect reflexive: "se " prefix or "-se" suffix
  let isReflexive = false;
  let inf = raw;
  if (raw.startsWith('se ')) {
    inf = raw.slice(3);
    isReflexive = true;
  } else if (raw.endsWith('-se')) {
    inf = raw.slice(0, -3);
    isReflexive = true;
  }

  // Validate verb class
  const vc = verbClass(inf);
  if (!vc) return null;

  // Handle -or verbs (por and derivatives): they are fully irregular
  if (vc === 'or') {
    const irrData = IRREGULARS[inf];
    if (!irrData) return null; // unknown -or verb

    // Build a base from the irregular data. -or verbs need full overrides.
    // Use pôr regular pattern as fallback (future/conditional use 'por' stem)
    const subj = irrData.subjunctive || f(',,,,, ');
    const base: Record<TenseKey, Forms> = {
      present:     irrData.present || f(',,,,, '),
      preterite:   irrData.preterite || f(',,,,, '),
      imperfect:   irrData.imperfect || f(',,,,, '),
      future:      irrData.future || f(',,,,, '),
      conditional: irrData.conditional || f(',,,,, '),
      subjunctive: subj,
      // Build imperative from subjunctive (slots 2/3/5) + irregular tu (slot 1)
      // + vosotros-style slot 4 (pôr → ponde).
      imperative: ['-', IRREGULAR_TU_IMPERATIVE[inf] || subj[2], subj[2], subj[3], 'ponde', subj[5]] as unknown as Forms,
      past_participle: ['-', '-', ptPastParticiple(inf), '-', '-', '-'] as unknown as Forms,
    };

    // Prepend reflexive pronouns if needed
    const tenses = applyReflexive(base, isReflexive);

    // Remap tense keys to localized labels
    const labeledTenses: Record<string, string[]> = {};
    for (const t of TENSES) {
      labeledTenses[TENSE_LABELS[t]] = [...tenses[t]];
    }

    return {
      infinitive: raw,
      isReflexive,
      tenses: labeledTenses,
    };
  }

  // Start with regular conjugation
  let tenses = regularAll(inf);

  // Apply spelling changes (if any)
  if (SPELLING_RULES[inf]) {
    tenses = merge(tenses, applySpellingChange(inf, SPELLING_RULES[inf]));
  }

  // Apply -ear verb changes
  if (EAR_VERBS.has(inf)) {
    tenses = merge(tenses, applyEarChange(inf));
  }

  // Apply stem changes (if any, for -ir verbs without full irregular override)
  if (STEM_CHANGERS[inf] && !IRREGULARS[inf]) {
    tenses = merge(tenses, applyStemChanges(inf, STEM_CHANGERS[inf]));
  }

  // Apply full irregular overrides (highest priority)
  if (IRREGULARS[inf]) {
    tenses = merge(tenses, IRREGULARS[inf]);
  }

  // Derive imperative slots 2/3/5 from the FINAL subjunctive — every
  // irregular subjunctive (sea/tenha/vá/...) flows through automatically.
  // Slot 1 (tu) keeps the regular stem-changed form unless we have an
  // irregular tu form mapped.
  const imp = [...tenses.imperative] as Forms;
  imp[2] = tenses.subjunctive[2];
  imp[3] = tenses.subjunctive[3];
  imp[5] = tenses.subjunctive[5];
  if (IRREGULAR_TU_IMPERATIVE[inf]) imp[1] = IRREGULAR_TU_IMPERATIVE[inf];
  if (IRREGULAR_VOS_IMPERATIVE[inf]) imp[4] = IRREGULAR_VOS_IMPERATIVE[inf];
  tenses.imperative = imp;

  // Past participle as a standalone tense row, single form in slot 2.
  tenses.past_participle = ['-', '-', ptPastParticiple(inf), '-', '-', '-'] as Forms;

  // Prepend reflexive pronouns if needed
  const finalTenses = applyReflexive(tenses, isReflexive);

  // Remap tense keys to localized labels
  const labeledTenses: Record<string, string[]> = {};
  for (const t of TENSES) {
    labeledTenses[TENSE_LABELS[t]] = [...finalTenses[t]];
  }

  return {
    infinitive: raw,
    isReflexive,
    tenses: labeledTenses,
  };
}

// ── Reverse lookup: form → infinitive ────────────────────────
// Built once at module init from the engine's own tables so that
// tapping any conjugated form in a card routes to the right lemma.

/** Gerund of an infinitive (not stored in the table, derived here) */
function gerundOf(inf: string): string {
  if (inf === 'pôr') return 'pondo';
  if (inf.endsWith('por')) return inf.slice(0, -1) + 'ndo'; // compor → compondo
  const vc = verbClass(inf);
  const s = stem(inf);
  if (vc === 'ar') return s + 'ando';
  if (vc === 'er') return s + 'endo';
  if (vc === 'ir') return s + 'indo';
  return inf;
}

// Common REGULAR verbs used to disambiguate ambiguous person endings
// (-a/-e/-o/-am/-em/... can belong to -ar, -er or -ir paradigms).
// Verbs already present in IRREGULARS / SPELLING_RULES / STEM_CHANGERS /
// EAR_VERBS do not need to be listed here.
const KNOWN_REGULAR_VERBS = new Set([
  // -er
  'comer', 'beber', 'viver', 'escrever', 'aprender', 'entender', 'compreender',
  'atender', 'pretender', 'vender', 'correr', 'morrer', 'responder', 'receber',
  'dever', 'resolver', 'devolver', 'envolver', 'desenvolver', 'prometer',
  'cometer', 'bater', 'sofrer', 'esconder', 'acender', 'defender', 'depender',
  'surpreender', 'erguer', 'mexer', 'chover', 'romper', 'interromper',
  'vencer', 'descer', 'nascer', 'aquecer', 'adoecer', 'estabelecer',
  'permanecer', 'aparecer', 'desaparecer', 'falecer', 'favorecer',
  'fortalecer', 'envelhecer', 'escolher', 'encher', 'colher', 'recolher',
  'acolher', 'doer', 'prender', 'suceder', 'conceder', 'proceder', 'correr',
  // -ir
  'partir', 'decidir', 'dividir', 'assistir', 'existir', 'insistir',
  'desistir', 'resistir', 'persistir', 'discutir', 'garantir', 'permitir',
  'admitir', 'transmitir', 'emitir', 'omitir', 'imprimir', 'cumprir',
  'curtir', 'unir', 'reunir', 'definir', 'surgir', 'atingir', 'fingir',
  'agir', 'reagir', 'corrigir', 'proibir', 'contribuir', 'distribuir',
  'atribuir', 'evoluir', 'diminuir', 'substituir', 'assumir', 'consumir',
  'presumir', 'resumir', 'investir', 'aplaudir', 'expandir', 'refletir',
  'adquirir', 'interferir', 'transferir', 'sorrir', 'confundir',
  // -iar (present: anuncio/anuncia — the 'ia' ending is NOT imperfect here)
  'anunciar', 'pronunciar', 'denunciar', 'copiar', 'negociar', 'premiar',
  'adiar', 'confiar', 'desconfiar', 'variar', 'criar', 'guiar', 'enviar',
  'avaliar', 'iniciar', 'financiar', 'apreciar', 'presenciar', 'associar',
  'beneficiar', 'odiar',
  // -ar (needed so subjunctive/imperative -e/-em forms resolve)
  'falar', 'trabalhar', 'olhar', 'pensar', 'andar', 'morar', 'estudar',
  'comprar', 'usar', 'tomar', 'deixar', 'esperar', 'precisar', 'gostar',
  'ajudar', 'encontrar', 'lembrar', 'levar', 'chamar', 'visitar', 'passar',
  'entrar', 'voltar', 'tentar', 'tirar', 'parar', 'mandar', 'mostrar',
  'mudar', 'acabar', 'acordar', 'amar', 'assinar', 'avisar', 'cantar',
  'casar', 'cozinhar', 'cuidar', 'descansar', 'desejar', 'ensinar',
  'escutar', 'evitar', 'fechar', 'ganhar', 'guardar', 'jantar', 'lavar',
  'ligar', 'limpar', 'melhorar', 'nadar', 'notar', 'organizar', 'participar',
  'pegar', 'perguntar', 'preparar', 'procurar', 'provar', 'reclamar',
  'reservar', 'respirar', 'sonhar', 'telefonar', 'terminar', 'tratar',
  'treinar', 'trocar', 'viajar', 'virar', 'gritar', 'caminhar', 'cancelar',
  'combinar', 'comemorar', 'completar', 'concordar', 'confirmar',
  'considerar', 'contar', 'continuar', 'conversar', 'convidar', 'demorar',
  'economizar', 'faltar', 'funcionar', 'imaginar', 'importar', 'informar',
  'lutar', 'marcar', 'misturar', 'montar', 'observar', 'pintar', 'plantar',
  'puxar', 'quebrar', 'realizar', 'recomendar', 'registrar', 'relaxar',
  'renovar', 'respeitar', 'salvar', 'secar', 'segurar', 'separar',
  'significar', 'soltar', 'superar', 'transformar', 'utilizar', 'verificar',
  'voar', 'acreditar', 'aproveitar', 'apresentar', 'descobrir', 'aumentar',
]);

const KNOWN_VERBS = new Set<string>([
  ...Object.keys(IRREGULARS),
  ...Object.keys(SPELLING_RULES),
  ...Object.keys(STEM_CHANGERS),
  ...EAR_VERBS,
  ...Object.keys(PT_IRREGULAR_PARTICIPLES),
  ...KNOWN_REGULAR_VERBS,
]);

const IRREGULAR_REVERSE = new Map<string, string>();
function addReverse(form: string, inf: string): void {
  // Some slots hold alternatives ("vamos/vamo") — index each one.
  for (const piece of form.split('/')) {
    const p = piece.trim().toLowerCase();
    if (!p || p === '-') continue;
    if (!IRREGULAR_REVERSE.has(p)) IRREGULAR_REVERSE.set(p, inf);
  }
}

// Build the reverse map. Order matters for shared forms (fui/foi/foram are
// both ser and ir): first lemma wins, and IRREGULARS is ordered by frequency.
(function buildReverseMap(): void {
  const lemmas = [
    ...Object.keys(IRREGULARS),
    ...Object.keys(SPELLING_RULES),
    ...Object.keys(STEM_CHANGERS),
    ...EAR_VERBS,
    ...Object.keys(PT_IRREGULAR_PARTICIPLES),
  ];
  const seen = new Set<string>();
  for (const inf of lemmas) {
    if (seen.has(inf)) continue;
    seen.add(inf);
    addReverse(inf, inf);
    const table = conjugate(inf);
    if (table) {
      for (const forms of Object.values(table.tenses)) {
        for (const form of forms) addReverse(form, inf);
      }
      // Imperfect + future subjunctive derive from the preterite 3pl stem
      // (tiveram → tivesse/tiver, fizeram → fizesse/fizer, foram → fosse/for)
      const pret3pl = table.tenses[TENSE_LABELS.preterite]?.[5];
      if (pret3pl && pret3pl.endsWith('ram')) {
        const base = pret3pl.slice(0, -3); // tiveram → tive
        for (const s of ['sse', 'sses', 'ssem']) addReverse(base + s, inf);
        for (const s of ['r', 'res', 'rmos', 'rem']) addReverse(base + s, inf);
      }
    }
    // Gerund + inflected participles are not table rows — derive them.
    addReverse(gerundOf(inf), inf);
    const pp = ptPastParticiple(inf);
    if (pp.endsWith('o')) {
      addReverse(pp, inf);
      addReverse(pp + 's', inf);
      addReverse(pp.slice(0, -1) + 'a', inf);
      addReverse(pp.slice(0, -1) + 'as', inf);
    }
  }
  // Colloquial spoken-BR reductions of estar
  // ('tão' is deliberately excluded — it is almost always the adverb "so")
  for (const c of ['tô', 'tá', 'tamos', 'tava', 'tavam']) {
    if (!IRREGULAR_REVERSE.has(c)) IRREGULAR_REVERSE.set(c, 'estar');
  }
})();

/**
 * Rebuild an -ar infinitive from a stem that appeared before 'e'
 * (preterite eu / subjunctive): orthography reverses there.
 *   fiqu(ei) → ficar, chegu(e) → chegar, comec(ei) → começar
 */
function arCandidate(s: string): string {
  if (s.endsWith('qu')) return s.slice(0, -2) + 'car';
  if (s.endsWith('gu')) return s.slice(0, -2) + 'gar';
  if (s.endsWith('c')) return s.slice(0, -1) + 'çar';
  return s + 'ar';
}

/** Reverse a/o-context orthography for -er/-ir candidates (conheç → conhec) */
function erIrStems(s: string): string[] {
  const out = [s];
  if (s.endsWith('ç')) out.push(s.slice(0, -1) + 'c');
  if (s.endsWith('j')) out.push(s.slice(0, -1) + 'g');
  if (s.endsWith('g')) out.push(s + 'u');
  return out;
}

/** First candidate present in KNOWN_VERBS, else the given default */
function pickKnown(candidates: string[], fallback: string): string {
  for (const c of candidates) {
    if (KNOWN_VERBS.has(c)) return c;
  }
  return fallback;
}

/** Candidates for endings shared by -ar / -er / -ir paradigms */
function ambiguous(s: string, order: ('ar' | 'er' | 'ir')[], fallback: string): string {
  const cands: string[] = [];
  for (const cls of order) {
    if (cls === 'ar') {
      cands.push(s + 'ar');
    } else {
      for (const st of erIrStems(s)) cands.push(st + cls);
    }
  }
  return pickKnown(cands, fallback);
}

/**
 * Resolve a conjugated Portuguese form to its infinitive.
 * Irregular forms hit the precomputed reverse map; regular forms are
 * unwound with ordered suffix rules (longest / most specific first).
 * Returns null only for empty input — a best-guess lemma is always
 * preferable to nothing for unknown verb-looking tokens.
 */
export function findInfinitive(form: string): string | null {
  if (!form) return null;
  let f = form.toLowerCase().trim();
  if (!f) return null;

  const direct = IRREGULAR_REVERSE.get(f);
  if (direct) return direct;

  // Multi-word forms ("se levanta", "vai falar"): resolve the main verb.
  if (f.includes(' ')) {
    const CLITIC_WORDS = new Set(['se', 'me', 'te', 'nos', 'vos', 'lhe', 'lhes', 'não', 'o', 'a', 'os', 'as']);
    const words = f.split(/\s+/).filter(w => !CLITIC_WORDS.has(w));
    if (words.length === 0) return null;
    return findInfinitive(words[words.length - 1]);
  }

  // Clitic-attached forms: levanta-se, buscá-lo, vendê-la, ouvi-lo,
  // mesoclisis (far-se-á), and -mos+nos elision (reservamo-nos)
  if (f.includes('-')) {
    const parts = f.split('-');
    const CLITICS_SET = new Set(['se', 'me', 'te', 'nos', 'vos', 'lhe', 'lhes',
      'o', 'a', 'os', 'as', 'lo', 'la', 'los', 'las', 'no', 'na', 'nas']);
    // Mesoclisis: far-se-á → fará, dir-me-ia → diria
    if (parts.length === 3 && CLITICS_SET.has(parts[1])) {
      return findInfinitive(parts[0] + parts[2]);
    }
    let base = parts[0];
    // Nós form drops its -s before the clitic "nos": reservamo-nos → reservamos
    if (parts[1] === 'nos' && base.endsWith('mo')) base += 's';
    const deacc = base.replace(/á$/, 'a').replace(/ê$/, 'e').replace(/ô$/, 'o');
    const hit = IRREGULAR_REVERSE.get(base) ?? IRREGULAR_REVERSE.get(deacc + 'r');
    if (hit) return hit;
    // Stressed final vowel = truncated infinitive (buscá-lo → buscar)
    if (/[áêô]$/.test(base)) return deacc + 'r';
    if (/[ai]$/.test(base) && IRREGULAR_REVERSE.get(base + 'r')) return IRREGULAR_REVERSE.get(base + 'r')!;
    f = base;
    const hit2 = IRREGULAR_REVERSE.get(f);
    if (hit2) return hit2;
  }

  // Already an infinitive (falar, comer, partir)
  if (/(ar|er|ir)$/.test(f) && f.length >= 4) return f;

  // Personal infinitive / future subjunctive of regulars:
  // falarmos → falar, comerem → comer, partires → partir
  let m = f.match(/^(.{2,}[aei]r)(mos|em|es|des)$/);
  if (m) return m[1];

  // Gerunds (unambiguous: -ando/-endo/-indo map 1:1 to class)
  if (f.endsWith('ando') && f.length >= 6) return f.slice(0, -4) + 'ar';
  if (f.endsWith('endo') && f.length >= 6) return f.slice(0, -4) + 'er';
  if (f.endsWith('indo') && f.length >= 6) return f.slice(0, -4) + 'ir';

  // Participles (incl. feminine/plural agreement)
  m = f.match(/^(.{2,})ad[oa]s?$/);
  if (m) return m[1] + 'ar';
  m = f.match(/^(.{2,})id[oa]s?$/);
  if (m) return ambiguous(m[1], ['er', 'ir'], m[1] + 'er');

  // Future / conditional: the stem IS the infinitive (falarei → falar,
  // comeria → comer, abriria → abrir, comporá → compor)
  m = f.match(/^(.{2,}[aeio]r)(ei|ás|á|emos|eis|ão)$/);
  if (m) return m[1];
  m = f.match(/^(.{2,}[aeio]r)(ia|ias|íamos|íeis|iam)$/);
  if (m) return m[1];

  // Imperfect -ar (unambiguous)
  m = f.match(/^(.{2,})(ávamos|áveis|avas|avam|ava)$/);
  if (m) return m[1] + 'ar';

  // Imperfect -er/-ir — also matches -iar presents (anuncia → anunciar),
  // so try the -iar reading against known verbs first.
  m = f.match(/^(.{2,})(íamos|íeis|ias|iam|ia)$/);
  if (m) {
    const s = m[1];
    return pickKnown([s + 'iar', s + 'er', s + 'ir'], s + 'er');
  }

  // Preterite (mostly unambiguous)
  if (f.endsWith('aram') && f.length >= 6) return f.slice(0, -4) + 'ar';
  if (f.endsWith('eram') && f.length >= 6) return f.slice(0, -4) + 'er';
  if (f.endsWith('iram') && f.length >= 6) return f.slice(0, -4) + 'ir';
  if (f.endsWith('astes') && f.length >= 7) return f.slice(0, -5) + 'ar';
  if (f.endsWith('estes') && f.length >= 7) return f.slice(0, -5) + 'er';
  if (f.endsWith('istes') && f.length >= 7) return f.slice(0, -5) + 'ir';
  if (f.endsWith('aste') && f.length >= 6) return f.slice(0, -4) + 'ar';
  if (f.endsWith('este') && f.length >= 6) return f.slice(0, -4) + 'er';
  if (f.endsWith('iste') && f.length >= 6) return f.slice(0, -4) + 'ir';
  if (f.endsWith('ou') && f.length >= 4) return f.slice(0, -2) + 'ar';
  if (f.endsWith('ei') && f.length >= 4) return arCandidate(f.slice(0, -2));
  if (f.endsWith('eu') && f.length >= 4) return f.slice(0, -2) + 'er';
  if (f.endsWith('iu') && f.length >= 4) return f.slice(0, -2) + 'ir';

  // Imperfect subjunctive (class-specific theme vowel)
  m = f.match(/^(.{2,})(ássemos|asses|assem|asse)$/);
  if (m) return m[1] + 'ar';
  m = f.match(/^(.{2,})(êssemos|esses|essem|esse)$/);
  if (m) return m[1] + 'er';
  m = f.match(/^(.{2,})(íssemos|isses|issem|isse)$/);
  if (m) return m[1] + 'ir';

  // Unknown -ear verbs in the present (passeia-pattern)
  m = f.match(/^(.{2,})ei([oa]s?|am)$/);
  if (m && KNOWN_VERBS.has(m[1] + 'ear')) return m[1] + 'ear';

  // Person endings shared across classes — resolve via known-verb set,
  // then fall back to the statistically likeliest class.
  if (f.endsWith('amos') && f.length >= 6) {
    return ambiguous(f.slice(0, -4), ['ar', 'er', 'ir'], f.slice(0, -4) + 'ar');
  }
  if (f.endsWith('emos') && f.length >= 6) {
    const s = f.slice(0, -4);
    return pickKnown([s + 'er', arCandidate(s), ...erIrStems(s).map(st => st + 'ir')], s + 'er');
  }
  if (f.endsWith('imos') && f.length >= 6) return f.slice(0, -4) + 'ir';
  if (f.endsWith('am') && f.length >= 4) {
    return ambiguous(f.slice(0, -2), ['ar', 'er', 'ir'], f.slice(0, -2) + 'ar');
  }
  if (f.endsWith('em') && f.length >= 4) {
    const s = f.slice(0, -2);
    return pickKnown([s + 'er', s + 'ir', arCandidate(s)], s + 'er');
  }
  if (f.endsWith('es') && f.length >= 4) {
    const s = f.slice(0, -2);
    return pickKnown([s + 'er', s + 'ir', arCandidate(s)], s + 'er');
  }
  if (f.endsWith('as') && f.length >= 4) {
    return ambiguous(f.slice(0, -2), ['ar', 'er', 'ir'], f.slice(0, -2) + 'ar');
  }
  if (f.endsWith('i') && f.length >= 4) {
    const s = f.slice(0, -1);
    return pickKnown([s + 'er', s + 'ir'], s + 'ir');
  }
  if (f.endsWith('o') && f.length >= 3) {
    return ambiguous(f.slice(0, -1), ['ar', 'er', 'ir'], f.slice(0, -1) + 'ar');
  }
  if (f.endsWith('a') && f.length >= 3) {
    return ambiguous(f.slice(0, -1), ['ar', 'er', 'ir'], f.slice(0, -1) + 'ar');
  }
  if (f.endsWith('e') && f.length >= 3) {
    const s = f.slice(0, -1);
    return pickKnown([s + 'er', s + 'ir', arCandidate(s)], s + 'er');
  }

  return null;
}

/** Prepend reflexive pronouns to all forms */
function applyReflexive(
  tenses: Record<TenseKey, Forms>,
  isReflexive: boolean,
): Record<TenseKey, Forms> {
  if (!isReflexive) return tenses;
  const result = { ...tenses };
  for (const t of TENSES) {
    result[t] = result[t].map((form, i) =>
      `${REFLEXIVE_PRONOUNS[i]} ${form}`
    ) as unknown as Forms;
  }
  return result;
}
