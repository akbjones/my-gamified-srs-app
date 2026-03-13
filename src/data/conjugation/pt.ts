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
type TenseKey = 'present' | 'preterite' | 'imperfect' | 'future' | 'conditional' | 'subjunctive';
type PartialTenses = Partial<Record<TenseKey, Forms>>;

const TENSES: TenseKey[] = ['present', 'preterite', 'imperfect', 'future', 'conditional', 'subjunctive'];
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
  },
  er: {
    present:     f('o,es,e,emos,eis,em'),
    preterite:   f('i,este,eu,emos,estes,eram'),
    imperfect:   f('ia,ias,ia,íamos,íeis,iam'),
    future:      f('erei,erás,erá,eremos,ereis,erão'),
    conditional: f('eria,erias,eria,eríamos,eríeis,eriam'),
    subjunctive: f('a,as,a,amos,ais,am'),
  },
  ir: {
    present:     f('o,es,e,imos,is,em'),
    preterite:   f('i,iste,iu,imos,istes,iram'),
    imperfect:   f('ia,ias,ia,íamos,íeis,iam'),
    future:      f('irei,irás,irá,iremos,ireis,irão'),
    conditional: f('iria,irias,iria,iríamos,iríeis,iriam'),
    subjunctive: f('a,as,a,amos,ais,am'),
  },
};

// ── Regular conjugation builder ─────────────────────────────

/** Apply stem to regular endings for one tense */
function regular(inf: string, tense: TenseKey): Forms {
  const vc = verbClass(inf);
  if (!vc || vc === 'or') return f(',,,,, ');
  const s = stem(inf);
  const endings = REG[vc][tense];
  // Future and conditional use the full infinitive as stem
  if (tense === 'future' || tense === 'conditional') {
    return endings.map(e => s + e) as unknown as Forms;
  }
  return endings.map(e => s + e) as unknown as Forms;
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
  for (const pos of positions) {
    const form = result[pos];
    const idx = form.lastIndexOf(from, stemStr.length);
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
    present:     f('vou,vais,vai,vamos,ides,vão'),
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
    const base: Record<TenseKey, Forms> = {
      present:     irrData.present || f(',,,,, '),
      preterite:   irrData.preterite || f(',,,,, '),
      imperfect:   irrData.imperfect || f(',,,,, '),
      future:      irrData.future || f(',,,,, '),
      conditional: irrData.conditional || f(',,,,, '),
      subjunctive: irrData.subjunctive || f(',,,,, '),
    };

    // Prepend reflexive pronouns if needed
    const tenses = applyReflexive(base, isReflexive);

    return {
      infinitive: raw,
      isReflexive,
      tenses: tenses as Record<string, string[]>,
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

  // Prepend reflexive pronouns if needed
  const finalTenses = applyReflexive(tenses, isReflexive);

  return {
    infinitive: raw,
    isReflexive,
    tenses: finalTenses as Record<string, string[]>,
  };
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
