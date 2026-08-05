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
// ── Compound verbs (explicitly enumerated — never suffix-matched) ──
// Each compound conjugates as prefix + base. Enumeration matters: "bater"
// ends in -ter but is NOT a ter compound, and "requerer" must NOT derive
// from querer (its preterite is the regular "requeri", never "requis").
const COMPOUNDS: Record<string, string> = {
  // ter
  manter: 'ter', obter: 'ter', conter: 'ter', deter: 'ter', reter: 'ter',
  suster: 'ter', entreter: 'ter', abster: 'ter',
  // vir
  intervir: 'vir', convir: 'vir', provir: 'vir', advir: 'vir',
  // ver
  prever: 'ver', rever: 'ver', antever: 'ver',
  // fazer
  satisfazer: 'fazer', desfazer: 'fazer', refazer: 'fazer',
  // dizer
  predizer: 'dizer', contradizer: 'dizer', desdizer: 'dizer',
  // pedir (impeço / despeço / expeço)
  impedir: 'pedir', despedir: 'pedir', expedir: 'pedir',
  // seguir
  prosseguir: 'seguir',
  // pôr — every -por verb is a pôr compound (also derived generically below)
  compor: 'pôr', propor: 'pôr', supor: 'pôr', dispor: 'pôr', impor: 'pôr',
  opor: 'pôr', repor: 'pôr', expor: 'pôr', depor: 'pôr', pressupor: 'pôr',
};

// Junction accents: prefixed monosyllabic forms gain a written accent
// (ter: tens→manténs, tem→mantém; vir: vens→intervéns, vem→intervém).
const COMPOUND_ACCENT: Record<string, Record<string, string>> = {
  ter: { tens: 'téns', tem: 'tém' },
  vir: { vens: 'véns', vem: 'vém' },
};

function ptPastParticiple(inf: string): string {
  if (PT_IRREGULAR_PARTICIPLES[inf]) return PT_IRREGULAR_PARTICIPLES[inf];
  const base = COMPOUNDS[inf];
  if (base) return inf.slice(0, inf.length - base.length) + ptPastParticiple(base);
  if (inf !== 'pôr' && inf.endsWith('por')) return inf.slice(0, -3) + 'posto';
  if (inf.endsWith('ar')) return inf.slice(0, -2) + 'ado';
  if (inf.endsWith('er') || inf.endsWith('ir')) {
    // Vowel-final stems take an accented participle (saído, moído,
    // contribuído) — gu/qu digraphs don't count (seguido, not *seguído).
    const hiatus = /[aeiou][ei]r$/.test(inf) && !/[gq]u[ei]r$/.test(inf);
    return inf.slice(0, -2) + (hiatus ? 'ído' : 'ido');
  }
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

// ── Orthography (pattern-based) ─────────────────────────────
// Portuguese spelling changes are exceptionless orthography, not lexical
// quirks: EVERY -car/-gar/-çar verb changes before e (fiquei/cheguei/
// comecei) and EVERY -cer/-ger/-gir/-guer/-guir verb changes before a/o
// (venço/protejo/surjo/ergo/sigo). The old per-verb table here silently
// produced "pegei"/"venco" for any verb it didn't list — the root cause of
// the "certain verbs" bug reports. Pattern-matching is safe for pure
// orthography (unlike stem changes, which stay enumerated below).

/** Fix a stem-final consonant for an ending starting with the given vowel
 *  class ('e' = front vowel, 'ao' = back vowel). Returns stem unchanged
 *  when no rule applies. */
function orthoFix(stemStr: string, context: 'e' | 'ao'): string {
  if (context === 'e') {
    if (stemStr.endsWith('ç')) return stemStr.slice(0, -1) + 'c';  // começ → comec(ei)
    if (stemStr.endsWith('c')) return stemStr.slice(0, -1) + 'qu'; // fic → fiqu(ei)
    if (stemStr.endsWith('g')) return stemStr + 'u';               // cheg → chegu(ei)
  } else {
    if (stemStr.endsWith('gu')) return stemStr.slice(0, -1);       // ergu → erg(o), distingu → disting(o)
    if (stemStr.endsWith('qu')) return stemStr.slice(0, -2) + 'c'; // delinqu → delinc(o)
    if (stemStr.endsWith('ç')) return stemStr;                     // already back-vowel spelling
    if (stemStr.endsWith('c')) return stemStr.slice(0, -1) + 'ç';  // venc → venç(o)
    if (stemStr.endsWith('g')) return stemStr.slice(0, -1) + 'j';  // proteg → protej(o)
  }
  return stemStr;
}

// Common orthography-changing lemmas, kept only to seed the reverse map so
// forms like "fiquei" / "sigo" hit the precomputed lookup directly.
const ORTHO_SEED_LEMMAS = [
  'ficar', 'tocar', 'buscar', 'explicar', 'comunicar', 'indicar', 'praticar',
  'publicar', 'marcar', 'trocar', 'secar', 'significar', 'verificar',
  'pagar', 'chegar', 'jogar', 'entregar', 'pegar', 'ligar',
  'começar', 'dançar', 'almoçar', 'abraçar',
  'proteger', 'eleger', 'fugir', 'dirigir', 'exigir', 'surgir', 'atingir',
  'fingir', 'agir', 'reagir', 'corrigir', 'erguer',
  'conhecer', 'parecer', 'esquecer', 'oferecer', 'acontecer', 'agradecer',
  'crescer', 'merecer', 'pertencer', 'reconhecer', 'vencer', 'descer',
  'nascer', 'aquecer',
  'seguir', 'conseguir', 'perseguir', 'distinguir', 'extinguir',
];

// ── -ear verb handling ──────────────────────────────────────
// -ear verbs: insert 'i' before stressed endings in present (eu, tu, ele, eles)
// and in subjunctive (all forms, since subjunctive endings start with 'e')
const EAR_VERBS = new Set([
  'passear', 'recear', 'nomear', 'chatear', 'bloquear',
  'golpear', 'frear', 'semear', 'estrear',
  // dictionary lemmas the old set missed
  'barbear', 'basear', 'cachear', 'nortear',
]);

function applyEarChange(inf: string): PartialTenses {
  const s = stem(inf); // e.g., 'passe' for 'passear'
  // Present: insert i before stressed endings in boot positions [0,1,2,5].
  // Subjunctive (passeie / passeemos) now derives from the 1sg present in
  // the shared derivation step, so only the present is overridden here.
  const pres = [...regular(inf, 'present')] as Forms;
  pres[0] = s + 'io';   // passeio
  pres[1] = s + 'ias';  // passeias
  pres[2] = s + 'ia';   // passeia
  pres[5] = s + 'iam';  // passeiam
  return { present: pres };
}

// -iar verbs that conjugate like -ear in the boot (the "MARIO" set:
// Mediar, Ansiar, Remediar, Incendiar, Odiar → odeio/odeias/odeia/odeiam).
// Every other -iar verb is regular (anuncio, copio, envio...) — this is a
// closed lexical class, so it is enumerated, never suffix-matched.
const ODIAR_VERBS = new Set(['odiar', 'mediar', 'ansiar', 'remediar', 'incendiar']);

function applyOdiarChange(inf: string): PartialTenses {
  const s = stem(inf);                 // odi
  const boot = s.slice(0, -1) + 'ei';  // odei
  const pres = [...regular(inf, 'present')] as Forms;
  pres[0] = boot + 'o';   // odeio
  pres[1] = boot + 'as';  // odeias
  pres[2] = boot + 'a';   // odeia
  pres[5] = boot + 'am';  // odeiam
  return { present: pres };
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
  // -ferir family (confiro / refiro / transfiro ...)
  aferir:     { from: 'e', to: 'i', positions: [0] },
  conferir:   { from: 'e', to: 'i', positions: [0] },
  referir:    { from: 'e', to: 'i', positions: [0] },
  inferir:    { from: 'e', to: 'i', positions: [0] },
  indeferir:  { from: 'e', to: 'i', positions: [0] },
  interferir: { from: 'e', to: 'i', positions: [0] },
  transferir: { from: 'e', to: 'i', positions: [0] },
  // o -> u (present: eu only)
  dormir:    { from: 'o', to: 'u', positions: [0] },
  cobrir:    { from: 'o', to: 'u', positions: [0] },
  descobrir: { from: 'o', to: 'u', positions: [0] },
  engolir:   { from: 'o', to: 'u', positions: [0] },
  tossir:    { from: 'o', to: 'u', positions: [0] },
  demolir:   { from: 'o', to: 'u', positions: [0] },
  // u -> o (present: boot pattern -- eu stays u, others get o)
  // NOTE: enumerated, never matched on -umir/-ubir: assumir/presumir/resumir
  // are fully regular — the Turkish lookalike trap all over again.
  subir:     { from: 'u', to: 'o', positions: [1, 2, 5] },
  acudir:    { from: 'u', to: 'o', positions: [1, 2, 5] },
  sacudir:   { from: 'u', to: 'o', positions: [1, 2, 5] },
  consumir:  { from: 'u', to: 'o', positions: [1, 2, 5] },
  sumir:     { from: 'u', to: 'o', positions: [1, 2, 5] },
  // e -> i for -eguir verbs (handled via spelling + stem change interaction)
  seguir:    { from: 'e', to: 'i', positions: [0] },
  conseguir: { from: 'e', to: 'i', positions: [0] },
  perseguir: { from: 'e', to: 'i', positions: [0] },
};

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
  // ─── pôr (compounds — compor/propor/… — derive via COMPOUNDS) ───
  'pôr': {
    present:     f('ponho,pões,põe,pomos,pondes,põem'),
    preterite:   f('pus,puseste,pôs,pusemos,pusestes,puseram'),
    imperfect:   f('punha,punhas,punha,púnhamos,púnheis,punham'),
    subjunctive: f('ponha,ponhas,ponha,ponhamos,ponhais,ponham'),
    ...futCond('por'),
  },
  // ─── requerer ───
  // NOT a querer compound: preterite is the regular "requeri" (never
  // "requis"), future is "requererei". Only present eu + subjunctive shift.
  requerer: {
    present:     f('requeiro,requeres,requer,requeremos,requereis,requerem'),
    subjunctive: f('requeira,requeiras,requeira,requeiramos,requeirais,requeiram'),
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

/** Conjugate a compound as prefix + base forms, with junction accents
 *  (manter → mantém, intervir → intervém, compor → compõe). */
function buildCompound(inf: string, base: string): Record<TenseKey, Forms> | null {
  const prefix = inf.slice(0, inf.length - base.length);
  if (!prefix) return null;
  const baseTenses = buildTenses(base);
  if (!baseTenses) return null;
  const accent = COMPOUND_ACCENT[base] ?? {};
  const out = {} as Record<TenseKey, Forms>;
  for (const t of TENSES) {
    out[t] = baseTenses[t].map(raw =>
      raw
        .split('/')
        .map(p => (!p || p === '-') ? p : prefix + (accent[p] ?? p))
        .join('/')
    ) as unknown as Forms;
  }
  return out;
}

/** Build the full (unlabeled, non-reflexive) tense table for an infinitive. */
function buildTenses(inf: string): Record<TenseKey, Forms> | null {
  const vc = verbClass(inf);
  if (!vc) return null;

  // pôr itself is enumerated; every other -or verb is a pôr compound
  // (compor, propor, pressupor, ...) and derives from it with a prefix.
  if (vc === 'or') {
    if (inf !== 'pôr') return buildCompound(inf, 'pôr');
    const irr = IRREGULARS['pôr'];
    const subj = irr.subjunctive!;
    return {
      present:     irr.present!,
      preterite:   irr.preterite!,
      imperfect:   irr.imperfect!,
      future:      irr.future!,
      conditional: irr.conditional!,
      subjunctive: subj,
      imperative:  ['-', IRREGULAR_TU_IMPERATIVE['pôr'], subj[2], subj[3], IRREGULAR_VOS_IMPERATIVE['pôr'], subj[5]] as unknown as Forms,
      past_participle: ['-', '-', ptPastParticiple('pôr'), '-', '-', '-'] as unknown as Forms,
    };
  }

  // Enumerated compounds (manter, intervir, prever, satisfazer, ...)
  if (COMPOUNDS[inf]) return buildCompound(inf, COMPOUNDS[inf]);

  // Start with regular conjugation
  let tenses = regularAll(inf);
  const s = stem(inf);

  // Orthography, pattern-based (see orthoFix):
  // -ar verbs adjust before the e of the preterite-eu (fiquei/cheguei/comecei);
  // -er/-ir verbs adjust before the o of the present-eu (venço/protejo/sigo→ ergo).
  // The subjunctive inherits both automatically via the 1sg derivation below.
  if (vc === 'ar') {
    const fixed = orthoFix(s, 'e');
    if (fixed !== s) {
      const pret = [...tenses.preterite] as Forms;
      pret[0] = fixed + 'ei';
      tenses.preterite = pret;
    }
  } else {
    const fixed = orthoFix(s, 'ao');
    if (fixed !== s) {
      const pres = [...tenses.present] as Forms;
      pres[0] = fixed + 'o';
      tenses.present = pres;
    }
  }

  // Hiatus -ir verbs (-air/-uir, but never -guir/-quir): the stem ends in a
  // vowel, so the theme vowel i takes a written accent when stressed
  // (saio/saímos/saí/saía, contribuo/contribuis/contribuí/contribuía).
  // Class-wide phonological rule — every such verb behaves this way.
  const isHiatus = vc === 'ir' && /[au]ir$/.test(inf) && !/[gq]uir$/.test(inf);
  if (isHiatus) {
    tenses.present   = apply(s, inf.endsWith('air') ? f('io,is,i,ímos,ís,em') : f('o,is,i,ímos,ís,em'));
    tenses.preterite = apply(s, f('í,íste,iu,ímos,ístes,íram'));
    tenses.imperfect = apply(s, f('ía,ías,ía,íamos,íeis,íam'));
    const imp = [...tenses.imperative] as Forms;
    imp[4] = s + 'í'; // vós imperative: saí, contribuí
    tenses.imperative = imp;
  }

  // Hiatus -oer verbs (doer, moer, roer, corroer): mói/móis take an acute,
  // í appears when stressed (moí, moía). Same closed class-wide rule.
  if (vc === 'er' && inf.endsWith('oer')) {
    const b = s.slice(0, -1); // d / m / r
    tenses.present   = apply(b, f('oo,óis,ói,oemos,oeis,oem'));
    tenses.preterite = apply(b, f('oí,oeste,oeu,oemos,oestes,oeram'));
    tenses.imperfect = apply(b, f('oía,oías,oía,oíamos,oíeis,oíam'));
  }

  // -uzir verbs drop the final e in the 3sg present (produz, traduz, aduz) —
  // also class-wide.
  if (inf.endsWith('uzir')) {
    const pres = [...tenses.present] as Forms;
    pres[2] = s; // stem of aduzir is "aduz"
    tenses.present = pres;
  }

  // -ear boot i-insertion (passeio) and the enumerated odiar class (odeio)
  if (EAR_VERBS.has(inf)) tenses = merge(tenses, applyEarChange(inf));
  if (ODIAR_VERBS.has(inf)) tenses = merge(tenses, applyOdiarChange(inf));

  // Apply stem changes (enumerated -ir verbs without full irregular override)
  if (STEM_CHANGERS[inf] && !IRREGULARS[inf]) {
    const spec = STEM_CHANGERS[inf];
    tenses = merge(tenses, {
      present: applyStemChangePositions(tenses.present, spec.from, spec.to, spec.positions, s),
    });
  }

  // Apply full irregular overrides (highest priority)
  if (IRREGULARS[inf]) {
    tenses = merge(tenses, IRREGULARS[inf]);
  }

  // Derive the present subjunctive from the FINAL 1sg present unless an
  // irregular table provides it explicitly. This is the actual Portuguese
  // rule (venço→vença, prefiro→prefira, contribuo→contribua, fico→fique)
  // and is what the old per-verb subjunctive overrides kept getting wrong
  // for anything not enumerated. -ar keeps its regular stem in nós/vós
  // (passeemos, not *passeiemos), with e-context orthography at the seam.
  if (!IRREGULARS[inf]?.subjunctive) {
    const p1 = tenses.present[0];
    if (p1 && p1 !== '-' && p1.endsWith('o')) {
      const st1 = p1.slice(0, -1);
      if (vc === 'ar') {
        const boot = orthoFix(st1, 'e');
        const nv = orthoFix(s, 'e');
        tenses.subjunctive = [
          boot + 'e', boot + 'es', boot + 'e', nv + 'emos', nv + 'eis', boot + 'em',
        ] as unknown as Forms;
      } else {
        tenses.subjunctive = apply(st1, REG[vc].subjunctive);
      }
    }
  }

  // Imperative: tu (slot 1) = 3sg present (fala/come/sai/produz) unless an
  // irregular tu form is mapped (sê/vai/faz); você/nós/vocês (2/3/5) come
  // from the FINAL subjunctive so every irregular subjunctive flows through.
  const imp = [...tenses.imperative] as Forms;
  imp[1] = IRREGULAR_TU_IMPERATIVE[inf] ?? tenses.present[2];
  imp[2] = tenses.subjunctive[2];
  imp[3] = tenses.subjunctive[3];
  imp[5] = tenses.subjunctive[5];
  if (IRREGULAR_VOS_IMPERATIVE[inf]) imp[4] = IRREGULAR_VOS_IMPERATIVE[inf];
  tenses.imperative = imp;

  // Past participle as a standalone tense row, single form in slot 2.
  tenses.past_participle = ['-', '-', ptPastParticiple(inf), '-', '-', '-'] as Forms;

  return tenses;
}

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

  const built = buildTenses(inf);
  if (!built) return null;

  // Prepend reflexive pronouns if needed
  const finalTenses = applyReflexive(built, isReflexive);

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
// Verbs already present in IRREGULARS / COMPOUNDS / STEM_CHANGERS /
// EAR_VERBS / ORTHO_SEED_LEMMAS do not need to be listed here.
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
  'adquirir', 'sorrir', 'confundir',
  'demitir', 'latir', 'incumbir', 'iludir',
  // hiatus -air / -uir (tables come from the class-wide rule; listed here so
  // findInfinitive resolves their ambiguous person endings)
  'cair', 'atrair', 'trair', 'extrair', 'distrair', 'contrair',
  'concluir', 'constituir', 'destituir', 'reconstruir', 'excluir',
  'instruir', 'influir', 'fluir', 'retribuir',
  // -uzir (aduz/introduz/reluz come from the class-wide 3sg rule)
  'aduzir', 'introduzir', 'reluzir', 'deduzir', 'seduzir',
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
  ...Object.keys(COMPOUNDS),
  ...ORTHO_SEED_LEMMAS,
  ...Object.keys(STEM_CHANGERS),
  ...EAR_VERBS,
  ...ODIAR_VERBS,
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
    ...Object.keys(COMPOUNDS),
    ...ORTHO_SEED_LEMMAS,
    ...Object.keys(STEM_CHANGERS),
    ...EAR_VERBS,
    ...ODIAR_VERBS,
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

/** True when the engine itself regenerates `form` from `inf` — table rows
 *  plus the derived rows the table doesn't store (gerund, participle
 *  agreement, personal infinitive, preterite-stem subjunctives). */
function regenerates(inf: string, form: string): boolean {
  const t = buildTenses(inf);
  if (!t) return false;
  for (const tk of TENSES) {
    for (const raw of t[tk]) {
      for (const p of raw.split('/')) if (p === form) return true;
    }
  }
  if (gerundOf(inf) === form) return true;
  const pp = ptPastParticiple(inf);
  if (pp === form) return true;
  if (pp.endsWith('o') &&
      (form === pp + 's' || form === pp.slice(0, -1) + 'a' || form === pp.slice(0, -1) + 'as')) {
    return true;
  }
  const pret3pl = t.preterite[5];
  if (pret3pl.endsWith('ram')) {
    const b = pret3pl.slice(0, -3);
    for (const sfx of ['sse', 'sses', 'ssem', 'r', 'res', 'rmos', 'rem', 'rdes']) {
      if (b + sfx === form) return true;
    }
  }
  for (const sfx of ['mos', 'es', 'em', 'des']) {
    if (inf + sfx === form) return true;
  }
  return false;
}

/**
 * Resolve a conjugated Portuguese form to its infinitive.
 * Irregular forms hit the precomputed reverse map. Regular forms gather
 * candidates from ordered suffix rules (longest / most specific first),
 * then adjudicate the way tr.ts does: a candidate the lexicon knows beats
 * everything (pass `isKnownVerb` — the dictionary does), a candidate whose
 * own conjugation regenerates the form beats a blind suffix guess, and the
 * first (most specific) guess is the last resort — a best-guess lemma is
 * always preferable to nothing for unknown verb-looking tokens.
 */
export function findInfinitive(form: string, isKnownVerb?: (w: string) => boolean): string | null {
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
    return findInfinitive(words[words.length - 1], isKnownVerb);
  }

  // Clitic-attached forms: levanta-se, buscá-lo, vendê-la, ouvi-lo,
  // mesoclisis (far-se-á), and -mos+nos elision (reservamo-nos)
  if (f.includes('-')) {
    const parts = f.split('-');
    const CLITICS_SET = new Set(['se', 'me', 'te', 'nos', 'vos', 'lhe', 'lhes',
      'o', 'a', 'os', 'as', 'lo', 'la', 'los', 'las', 'no', 'na', 'nas']);
    // Mesoclisis: far-se-á → fará, dir-me-ia → diria
    if (parts.length === 3 && CLITICS_SET.has(parts[1])) {
      return findInfinitive(parts[0] + parts[2], isKnownVerb);
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

  const known = (w: string): boolean => KNOWN_VERBS.has(w) || !!(isKnownVerb && isKnownVerb(w));

  // ── Candidate generation (ordered, most specific first) ──
  const candidates: string[] = [];
  const add = (...cs: string[]): void => {
    for (const c of cs) {
      if (c && c.length >= 4 && !candidates.includes(c)) candidates.push(c);
    }
  };
  /** -er/-ir candidates with a/o-context orthography reversed (conheç→conhec) */
  const addClass = (s: string, cls: 'er' | 'ir'): void => {
    for (const st of erIrStems(s)) add(st + cls);
    // Hiatus stems keep their i as part of a diphthong (atrai-o, sai-a):
    // the infinitive is stem + r, not stem + ir.
    if (cls === 'ir' && /[aeou]i$/.test(s)) add(s + 'r');
  };

  // Personal infinitive / future subjunctive: falarmos → falar,
  // comerem → comer, saíres → sair (accented hiatus stem loses its accent)
  let m = f.match(/^(.{2,}[aeií]r)(mos|em|es|des)$/);
  if (m) add(m[1].replace(/ír$/, 'ir'), m[1]);

  // Gerunds — plus the "final -o is a 1sg present" reading ("acendo" is
  // acender's present, not the gerund of a fake "acer")
  if (f.length >= 6) {
    const s4 = f.slice(0, -4), s1 = f.slice(0, -1);
    if (f.endsWith('ando')) add(s4 + 'ar', s1 + 'ar', s1 + 'er', s1 + 'ir');
    if (f.endsWith('endo')) add(s4 + 'er', s1 + 'er', s1 + 'ar', s1 + 'ir');
    if (f.endsWith('indo')) add(s4 + 'ir', s1 + 'ar', s1 + 'er', s1 + 'ir');
  }

  // Participles (incl. feminine/plural agreement)
  m = f.match(/^(.{2,})ad[oa]s?$/);
  if (m) add(m[1] + 'ar');
  m = f.match(/^(.{2,})id[oa]s?$/);
  if (m) { addClass(m[1], 'er'); addClass(m[1], 'ir'); }
  m = f.match(/^(.{2,})íd[oa]s?$/);
  if (m) add(m[1] + 'ir', m[1] + 'er');  // atraído → atrair, moído → moer

  // Future / conditional: the stem IS the infinitive (falarei → falar,
  // comeria → comer, abriria → abrir, comporá → compor)
  m = f.match(/^(.{2,}[aeio]r)(ei|ás|á|emos|eis|ão)$/);
  if (m) add(m[1]);
  m = f.match(/^(.{2,}[aeio]r)(ia|ias|íamos|íeis|iam)$/);
  if (m) add(m[1]);

  // Imperfect -ar (unambiguous)
  m = f.match(/^(.{2,})(ávamos|áveis|avas|avam|ava)$/);
  if (m) add(m[1] + 'ar');

  // Accented imperfect (saía, contribuíamos): only hiatus -air/-uir verbs
  // put an í here, so the stem ends in a vowel.
  m = f.match(/^(.{2,}[aeiou])(íamos|íeis|ías|íam|ía)$/);
  if (m) add(m[1] + 'ir', m[1] + 'er');

  // Imperfect -er/-ir — also matches -iar presents (anuncia → anunciar),
  // so the -iar reading goes first.
  m = f.match(/^(.{2,})(íamos|íeis|ias|iam|ia)$/);
  if (m) add(m[1] + 'iar', m[1] + 'er', m[1] + 'ir');

  // Preterite (mostly unambiguous)
  if (f.endsWith('aram') && f.length >= 6) add(f.slice(0, -4) + 'ar');
  if (f.endsWith('eram') && f.length >= 6) add(f.slice(0, -4) + 'er');
  if (f.endsWith('iram') && f.length >= 6) add(f.slice(0, -4) + 'ir');
  if (f.endsWith('íram') && f.length >= 6) add(f.slice(0, -4) + 'ir');   // saíram
  if (f.endsWith('astes') && f.length >= 7) add(f.slice(0, -5) + 'ar');
  if (f.endsWith('estes') && f.length >= 7) add(f.slice(0, -5) + 'er');
  if (f.endsWith('istes') && f.length >= 7) add(f.slice(0, -5) + 'ir');
  if (f.endsWith('ístes') && f.length >= 6) add(f.slice(0, -5) + 'ir');  // saístes
  if (f.endsWith('aste') && f.length >= 6) add(f.slice(0, -4) + 'ar');
  if (f.endsWith('este') && f.length >= 6) add(f.slice(0, -4) + 'er');
  if (f.endsWith('iste') && f.length >= 6) add(f.slice(0, -4) + 'ir');
  if (f.endsWith('íste') && f.length >= 5) add(f.slice(0, -4) + 'ir');   // saíste
  if (f.endsWith('ou') && f.length >= 4) add(f.slice(0, -2) + 'ar');
  if (f.endsWith('ei') && f.length >= 4) {
    const s = f.slice(0, -2);
    add(arCandidate(s), s + 'ar', s + 'er'); // falei / minguei / comei (vós imperative)
  }
  if (f.endsWith('eu') && f.length >= 4) add(f.slice(0, -2) + 'er');
  if (f.endsWith('iu') && f.length >= 4) add(f.slice(0, -2) + 'ir');
  if (f.endsWith('í') && f.length >= 3) add(f.slice(0, -1) + 'ir');      // saí / contribuí

  // Imperfect subjunctive (class-specific theme vowel)
  m = f.match(/^(.{2,})(ássemos|asses|assem|asse)$/);
  if (m) add(m[1] + 'ar');
  m = f.match(/^(.{2,})(êssemos|esses|essem|esse)$/);
  if (m) add(m[1] + 'er');
  m = f.match(/^(.{2,})(íssemos|isses|issem|isse)$/);
  if (m) add(m[1] + 'ir');
  m = f.match(/^(.{2,})(ísses|íssem|ísse)$/);
  if (m) add(m[1] + 'ir');                                               // saísse

  // -ear / odiar-class presents (passeia → passear, odeia → odiar)
  m = f.match(/^(.{2,})ei([oa]s?|am)$/);
  if (m) add(m[1] + 'ear', m[1] + 'iar');

  // -uzir 3sg present drops its e entirely (aduz → aduzir)
  if (f.endsWith('uz') && f.length >= 4) add(f + 'ir');

  // Vós forms
  if (f.endsWith('ais') && f.length >= 5) {
    const s = f.slice(0, -3);
    add(s + 'ar'); addClass(s, 'er'); addClass(s, 'ir'); // falais / comais / partais
  }
  if (f.endsWith('eis') && f.length >= 5) {
    const s = f.slice(0, -3);
    add(s + 'er', arCandidate(s), s + 'ar');             // comeis / faleis / fiqueis / mingueis
  }
  if (f.endsWith('ís') && f.length >= 4) add(f.slice(0, -2) + 'ir');  // saís / contribuís
  if (f.endsWith('ai') && f.length >= 4) add(f.slice(0, -2) + 'ar');  // falai (imperative)

  // Person endings shared across classes
  if (f.endsWith('amos') && f.length >= 6) {
    const s = f.slice(0, -4);
    add(s + 'ar'); addClass(s, 'er'); addClass(s, 'ir');
  }
  if (f.endsWith('emos') && f.length >= 6) {
    const s = f.slice(0, -4);
    add(s + 'er', arCandidate(s), s + 'ar'); addClass(s, 'ir');
  }
  if (f.endsWith('imos') && f.length >= 6) add(f.slice(0, -4) + 'ir');
  if (f.endsWith('ímos') && f.length >= 5) add(f.slice(0, -4) + 'ir'); // saímos
  if (f.endsWith('am') && f.length >= 4) {
    const s = f.slice(0, -2);
    add(s + 'ar'); addClass(s, 'er'); addClass(s, 'ir');
  }
  if (f.endsWith('em') && f.length >= 4) {
    const s = f.slice(0, -2);
    addClass(s, 'er'); addClass(s, 'ir'); add(arCandidate(s), s + 'ar');
  }
  if (f.endsWith('es') && f.length >= 4) {
    const s = f.slice(0, -2);
    addClass(s, 'er'); addClass(s, 'ir'); add(arCandidate(s), s + 'ar');
  }
  if (f.endsWith('as') && f.length >= 4) {
    const s = f.slice(0, -2);
    add(s + 'ar'); addClass(s, 'er'); addClass(s, 'ir');
  }
  if (f.endsWith('is') && f.length >= 4) add(f.slice(0, -2) + 'ir');  // partis / unis / contribuis
  if (f.endsWith('i') && f.length >= 3) {
    const s = f.slice(0, -1);
    add(s + 'er', s + 'ir', s + 'ar');
  }
  if (f.endsWith('o') && f.length >= 3) {
    const s = f.slice(0, -1);
    add(s + 'ar'); addClass(s, 'er'); addClass(s, 'ir');
  }
  if (f.endsWith('a') && f.length >= 3) {
    const s = f.slice(0, -1);
    add(s + 'ar'); addClass(s, 'er'); addClass(s, 'ir');
  }
  if (f.endsWith('e') && f.length >= 3) {
    const s = f.slice(0, -1);
    addClass(s, 'er'); addClass(s, 'ir'); add(arCandidate(s), s + 'ar');
  }

  // ── Adjudication (tr.ts pattern) ──
  // 1. A known verb that actually regenerates the form ("conte" belongs to
  //    contar, not conter — conter never produces "conte").
  // 2. A known verb even without regeneration (covers derived rows the
  //    engine doesn't model).
  // 3. An unknown candidate that regenerates the form.
  // 4. The first (most specific) suffix guess as a last resort.
  const target = f;
  const knownVerified = candidates.find(c => known(c) && regenerates(c, target));
  if (knownVerified) return knownVerified;
  const kHit = candidates.find(known);
  if (kHit) return kHit;
  const verified = candidates.find(c => regenerates(c, target));
  if (verified) return verified;
  return candidates[0] ?? null;
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
