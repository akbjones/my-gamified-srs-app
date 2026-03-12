/**
 * French verb conjugation engine
 * Handles regular -er/-ir/-re verbs, -iss- pattern (-ir type 2),
 * spelling changes, reflexive verbs, passé composé, and 70+ irregular overrides.
 */
import type { ConjugationTable } from '../../types';

// ── Types ───────────────────────────────────────────────────
type Forms = [string, string, string, string, string, string]; // je, tu, il, nous, vous, ils
type TenseKey = 'present' | 'preterite' | 'imperfect' | 'future' | 'conditional' | 'subjunctive';
type PartialTenses = Partial<Record<TenseKey, Forms>>;
const TENSES: TenseKey[] = ['present', 'preterite', 'imperfect', 'future', 'conditional', 'subjunctive'];
const REFLEXIVE_PRONOUNS: Forms = ['me', 'te', 'se', 'nous', 'vous', 'se'];

// ── Helpers ─────────────────────────────────────────────────
const f = (s: string): Forms => s.split(',') as unknown as Forms;
const stem = (inf: string, n = 2) => inf.slice(0, -n);

/** Attach endings to a stem */
const apply = (s: string, ends: Forms): Forms =>
  ends.map(e => s + e) as Forms;

/** Merge partial overrides onto a base set of tenses */
const merge = (base: Record<TenseKey, Forms>, over: PartialTenses): Record<TenseKey, Forms> => {
  const r = { ...base };
  for (const t of TENSES) if (over[t]) r[t] = over[t]!;
  return r;
};

// ── Regular ending tables ───────────────────────────────────
// Each array: [je, tu, il/elle, nous, vous, ils/elles]

// -er verbs (parler): largest class
// -ir verbs (finir): -iss- pattern in plural present + subjunctive
// -re verbs (vendre): third class
const REG: Record<string, Record<TenseKey, Forms>> = {
  er: {
    present:     f('e,es,e,ons,ez,ent'),
    preterite:   f('ai,as,a,\u00e2mes,\u00e2tes,\u00e8rent'),  // passé simple
    imperfect:   f('ais,ais,ait,ions,iez,aient'),
    future:      f('erai,eras,era,erons,erez,eront'),
    conditional: f('erais,erais,erait,erions,eriez,eraient'),
    subjunctive: f('e,es,e,ions,iez,ent'),
  },
  ir: {
    // Type 2 -ir (finir pattern): -iss- in present plural + subjunctive
    present:     f('is,is,it,issons,issez,issent'),
    preterite:   f('is,is,it,\u00eemes,\u00eetes,irent'),
    imperfect:   f('issais,issais,issait,issions,issiez,issaient'),
    future:      f('irai,iras,ira,irons,irez,iront'),
    conditional: f('irais,irais,irait,irions,iriez,iraient'),
    subjunctive: f('isse,isses,isse,issions,issiez,issent'),
  },
  re: {
    present:     f('s,s,,ons,ez,ent'),
    preterite:   f('is,is,it,\u00eemes,\u00eetes,irent'),
    imperfect:   f('ais,ais,ait,ions,iez,aient'),
    future:      f('rai,ras,ra,rons,rez,ront'),
    conditional: f('rais,rais,rait,rions,riez,raient'),
    subjunctive: f('e,es,e,ions,iez,ent'),
  },
};

// ── Type 3 -ir verbs (partir pattern: no -iss-) ────────────
// These conjugate like -re verbs in present but are -ir infinitives.
// Present: pars, pars, part, partons, partez, partent
const TYPE3_IR = new Set([
  'partir', 'sortir', 'dormir', 'servir', 'sentir', 'mentir',
  'courir', 'mourir', 'offrir', 'ouvrir', 'couvrir', 'souffrir',
  'cueillir', 'accueillir', 'recueillir', 'tenir', 'venir',
  'devenir', 'revenir', 'obtenir', 'maintenir', 'soutenir',
  'appartenir', 'contenir', 'retenir', 'convenir', 'prévenir',
  'fuir', 'acquérir',
]);

function type3Present(s: string, inf: string): Forms {
  // Most type 3 verbs: stem loses last consonant(s) in singular
  // partir → par-s, par-s, par-t  / part-ons, part-ez, part-ent
  // dormir → dor-s, dor-s, dor-t  / dorm-ons, dorm-ez, dorm-ent
  // offrir/ouvrir → -e, -es, -e pattern (like -er verbs)
  if (/(?:offrir|ouvrir|couvrir|souffrir|cueillir|accueillir|recueillir)$/.test(inf)) {
    return [s + 'e', s + 'es', s + 'e', s + 'ons', s + 'ez', s + 'ent'];
  }
  // Standard type 3: shortened singular stem
  const shortStem = s.replace(/[mntrl]$/, '');
  return [shortStem + 's', shortStem + 's', shortStem + 't', s + 'ons', s + 'ez', s + 'ent'];
}

function type3Subjunctive(s: string, inf: string): Forms {
  if (/(?:offrir|ouvrir|couvrir|souffrir|cueillir|accueillir|recueillir)$/.test(inf)) {
    return [s + 'e', s + 'es', s + 'e', s + 'ions', s + 'iez', s + 'ent'];
  }
  return [s + 'e', s + 'es', s + 'e', s + 'ions', s + 'iez', s + 'ent'];
}

// ── Spelling-change helpers ─────────────────────────────────
// -cer verbs: c → ç before a/o (to keep /s/ sound)
// -ger verbs: g → ge before a/o (to keep /ʒ/ sound)
// -yer verbs: y → i before mute e
// -eler/-eter verbs: double consonant before mute e (appeler→appelle)
// e+C+er verbs: è in open syllable (lever→lève)
// é+C+er verbs: è before mute endings (espérer→espère, but future keeps é)

function fixSpelling(inf: string, s: string, base: Record<TenseKey, Forms>): Record<TenseKey, Forms> {
  const result = { ...base };

  // -cer verbs: c → ç before a, o
  if (inf.endsWith('cer')) {
    const fixCedilla = (forms: Forms): Forms =>
      forms.map(form => {
        const ending = form.slice(s.length);
        if (/^[ao]/.test(ending)) return s.slice(0, -1) + 'ç' + ending;
        return form;
      }) as Forms;
    result.preterite = fixCedilla(result.preterite);
    result.imperfect = fixCedilla(result.imperfect);
  }

  // -ger verbs: insert e before a, o
  if (inf.endsWith('ger')) {
    const fixGer = (forms: Forms): Forms =>
      forms.map(form => {
        const ending = form.slice(s.length);
        if (/^[ao]/.test(ending)) return s + 'e' + ending;
        return form;
      }) as Forms;
    result.preterite = fixGer(result.preterite);
    result.imperfect = fixGer(result.imperfect);
  }

  // -yer verbs: y → i before mute e (payer → paie, envoyer → envoie)
  if (/[yY]er$/.test(inf)) {
    const iStem = s.slice(0, -1) + 'i';
    // Mute-e endings: positions 0,1,2,5 in present/subjunctive
    const fixY = (forms: Forms): Forms =>
      forms.map((form, idx) => {
        if (idx === 3 || idx === 4) return form; // nous/vous keep y
        return iStem + form.slice(s.length);
      }) as Forms;
    result.present = fixY(result.present);
    result.subjunctive = fixY(result.subjunctive);
    // Future/conditional: full stem change for -oyer/-uyer, optional for -ayer
    if (/[ou]yer$/.test(inf)) {
      result.future = apply(iStem, REG.er.future);
      result.conditional = apply(iStem, REG.er.conditional);
    }
  }

  // -eler verbs (appeler → appelle): double l before mute e
  if (/eler$/.test(inf) && !GRAVE_ELER.has(inf)) {
    const doubleStem = s + 'l';
    const fix = (forms: Forms): Forms =>
      forms.map((form, idx) => {
        if (idx === 3 || idx === 4) return form;
        return doubleStem + form.slice(s.length);
      }) as Forms;
    result.present = fix(result.present);
    result.subjunctive = fix(result.subjunctive);
    result.future = apply(doubleStem, REG.er.future);
    result.conditional = apply(doubleStem, REG.er.conditional);
  }

  // -eter verbs (jeter → jette): double t before mute e
  if (/eter$/.test(inf) && !GRAVE_ETER.has(inf)) {
    const doubleStem = s + 't';
    const fix = (forms: Forms): Forms =>
      forms.map((form, idx) => {
        if (idx === 3 || idx === 4) return form;
        return doubleStem + form.slice(s.length);
      }) as Forms;
    result.present = fix(result.present);
    result.subjunctive = fix(result.subjunctive);
    result.future = apply(doubleStem, REG.er.future);
    result.conditional = apply(doubleStem, REG.er.conditional);
  }

  // Verbs with è before mute endings (geler, acheter, etc.)
  if (GRAVE_ELER.has(inf) || GRAVE_ETER.has(inf) || E_STEM_CHANGE.has(inf)) {
    // e → è in stem before mute endings (singular + 3rd plural)
    const graveStem = s.replace(/e([^e]*)$/, 'è$1');
    const fix = (forms: Forms): Forms =>
      forms.map((form, idx) => {
        if (idx === 3 || idx === 4) return form;
        return graveStem + form.slice(s.length);
      }) as Forms;
    result.present = fix(result.present);
    result.subjunctive = fix(result.subjunctive);
    result.future = apply(graveStem, REG.er.future);
    result.conditional = apply(graveStem, REG.er.conditional);
  }

  // é → è before mute endings in present/subjunctive (but NOT future/conditional)
  if (ACUTE_STEM_CHANGE.has(inf)) {
    const graveStem = s.replace(/é([^é]*)$/, 'è$1');
    const fix = (forms: Forms): Forms =>
      forms.map((form, idx) => {
        if (idx === 3 || idx === 4) return form;
        return graveStem + form.slice(s.length);
      }) as Forms;
    result.present = fix(result.present);
    result.subjunctive = fix(result.subjunctive);
    // Future/conditional keep the é stem (traditional spelling)
  }

  return result;
}

// Verbs that use è instead of doubling (geler→gèle, acheter→achète)
const GRAVE_ELER = new Set(['geler', 'peler', 'modeler', 'celer', 'déceler', 'receler', 'ciseler', 'démanteler', 'écarteler', 'marteler']);
const GRAVE_ETER = new Set(['acheter', 'racheter', 'haleter', 'corseter', 'crocheter', 'fileter', 'fureter']);
// e+consonant+er verbs with stem change (lever→lève, mener→mène)
const E_STEM_CHANGE = new Set([
  'lever', 'mener', 'peser', 'semer', 'amener', 'emmener', 'promener',
  'enlever', 'relever', 'élever', 'soulever',
]);
// é+consonant+er verbs (espérer→espère, préférer→préfère)
const ACUTE_STEM_CHANGE = new Set([
  'espérer', 'préférer', 'répéter', 'compléter', 'protéger',
  'posséder', 'considérer', 'exagérer', 'gérer', 'libérer',
  'modérer', 'opérer', 'récupérer', 'régler', 'régner',
  'révéler', 'sécher', 'suggérer', 'tolérer', 'célébrer',
]);

// ── Regular conjugation builder ─────────────────────────────
function conjugateRegular(inf: string): Record<TenseKey, Forms> | null {
  let conj: string;
  let s: string;

  if (inf.endsWith('er')) {
    conj = 'er';
    s = stem(inf);
  } else if (inf.endsWith('ir')) {
    conj = 'ir';
    s = stem(inf);
    // Type 3 -ir verbs use different present/subjunctive
    if (TYPE3_IR.has(inf)) {
      const base: Record<TenseKey, Forms> = {} as any;
      for (const t of TENSES) {
        if (t === 'present') base[t] = type3Present(s, inf);
        else if (t === 'subjunctive') base[t] = type3Subjunctive(s, inf);
        else if (t === 'imperfect') base[t] = apply(s, f('ais,ais,ait,ions,iez,aient'));
        else if (t === 'future') base[t] = apply(s, REG.ir.future);
        else if (t === 'conditional') base[t] = apply(s, REG.ir.conditional);
        else base[t] = apply(s, REG.ir.preterite); // preterite
      }
      return base;
    }
  } else if (inf.endsWith('re')) {
    conj = 're';
    s = stem(inf);
  } else {
    return null;
  }

  const endings = REG[conj];
  const base: Record<TenseKey, Forms> = {} as any;
  for (const t of TENSES) {
    base[t] = apply(s, endings[t]);
  }

  // Apply spelling fixes
  return fixSpelling(inf, s, base);
}

// ── Passé composé helpers ───────────────────────────────────
// Être verbs (DR MRS VANDERTRAMP + compounds)
const ETRE_VERBS = new Set([
  'aller', 'arriver', 'descendre', 'devenir', 'entrer', 'monter',
  'mourir', 'naître', 'partir', 'passer', 'rentrer', 'rester',
  'retourner', 'revenir', 'sortir', 'tomber', 'venir',
  'décéder', 'intervenir', 'parvenir', 'survenir',
]);

const AVOIR_PRESENT: Forms = f("ai,as,a,avons,avez,ont");
const ETRE_PRESENT: Forms = f("suis,es,est,sommes,\u00eates,sont");

// Past participle patterns
function getParticiple(inf: string): string {
  // Check irregular participles first
  if (IRR_PARTICIPLES[inf]) return IRR_PARTICIPLES[inf];
  if (inf.endsWith('er')) return stem(inf) + 'é';
  if (inf.endsWith('ir')) return stem(inf) + 'i';
  if (inf.endsWith('re')) return stem(inf) + 'u';
  return inf;
}

const IRR_PARTICIPLES: Record<string, string> = {
  'être': 'été', 'avoir': 'eu', 'faire': 'fait', 'dire': 'dit',
  'écrire': 'écrit', 'lire': 'lu', 'mettre': 'mis', 'prendre': 'pris',
  'voir': 'vu', 'savoir': 'su', 'pouvoir': 'pu', 'vouloir': 'voulu',
  'devoir': 'dû', 'boire': 'bu', 'connaître': 'connu', 'vivre': 'vécu',
  'mourir': 'mort', 'naître': 'né', 'ouvrir': 'ouvert', 'offrir': 'offert',
  'couvrir': 'couvert', 'souffrir': 'souffert', 'découvrir': 'découvert',
  'venir': 'venu', 'devenir': 'devenu', 'revenir': 'revenu',
  'tenir': 'tenu', 'obtenir': 'obtenu', 'maintenir': 'maintenu',
  'soutenir': 'soutenu', 'retenir': 'retenu', 'contenir': 'contenu',
  'appartenir': 'appartenu', 'convenir': 'convenu',
  'courir': 'couru', 'craindre': 'craint', 'peindre': 'peint',
  'joindre': 'joint', 'plaindre': 'plaint', 'atteindre': 'atteint',
  'éteindre': 'éteint', 'résoudre': 'résolu', 'absoudre': 'absous',
  'conduire': 'conduit', 'construire': 'construit', 'produire': 'produit',
  'traduire': 'traduit', 'détruire': 'détruit', 'introduire': 'introduit',
  'réduire': 'réduit', 'séduire': 'séduit', 'instruire': 'instruit',
  'suivre': 'suivi', 'plaire': 'plu', 'taire': 'tu',
  'rire': 'ri', 'suffire': 'suffi', 'vaincre': 'vaincu',
  'convaincre': 'convaincu', 'battre': 'battu', 'rompre': 'rompu',
  'interrompre': 'interrompu', 'corrompre': 'corrompu',
  'valoir': 'valu', 'falloir': 'fallu', 'asseoir': 'assis',
  'acquérir': 'acquis', 'conquérir': 'conquis',
  'coudre': 'cousu', 'moudre': 'moulu', 'croître': 'crû',
  'croire': 'cru', 'paraître': 'paru', 'apparaître': 'apparu',
  'disparaître': 'disparu', 'pleuvoir': 'plu',
  'recevoir': 'reçu', 'apercevoir': 'aperçu', 'concevoir': 'conçu',
  'décevoir': 'déçu', 'percevoir': 'perçu',
};

function buildPasseCompose(inf: string, isReflexive: boolean): Forms {
  const participle = getParticiple(inf);
  const useEtre = isReflexive || ETRE_VERBS.has(inf);
  const aux = useEtre ? ETRE_PRESENT : AVOIR_PRESENT;
  return aux.map(a => a + ' ' + participle) as Forms;
}

// ── Irregular verb data ─────────────────────────────────────
const IRR: Record<string, PartialTenses> = {
  // ─── Fully irregular ───
  être: {
    present:     f('suis,es,est,sommes,\u00eates,sont'),
    preterite:   f('fus,fus,fut,f\u00fbmes,f\u00fbtes,furent'),
    imperfect:   f('\u00e9tais,\u00e9tais,\u00e9tait,\u00e9tions,\u00e9tiez,\u00e9taient'),
    future:      f('serai,seras,sera,serons,serez,seront'),
    conditional: f('serais,serais,serait,serions,seriez,seraient'),
    subjunctive: f('sois,sois,soit,soyons,soyez,soient'),
  },
  avoir: {
    present:     f('ai,as,a,avons,avez,ont'),
    preterite:   f('eus,eus,eut,e\u00fbmes,e\u00fbtes,eurent'),
    imperfect:   f('avais,avais,avait,avions,aviez,avaient'),
    future:      f('aurai,auras,aura,aurons,aurez,auront'),
    conditional: f('aurais,aurais,aurait,aurions,auriez,auraient'),
    subjunctive: f('aie,aies,ait,ayons,ayez,aient'),
  },
  aller: {
    present:     f('vais,vas,va,allons,allez,vont'),
    preterite:   f('allai,allas,alla,all\u00e2mes,all\u00e2tes,all\u00e8rent'),
    future:      f('irai,iras,ira,irons,irez,iront'),
    conditional: f('irais,irais,irait,irions,iriez,iraient'),
    subjunctive: f('aille,ailles,aille,allions,alliez,aillent'),
  },
  faire: {
    present:     f('fais,fais,fait,faisons,faites,font'),
    preterite:   f('fis,fis,fit,f\u00eemes,f\u00eetes,firent'),
    imperfect:   f('faisais,faisais,faisait,faisions,faisiez,faisaient'),
    future:      f('ferai,feras,fera,ferons,ferez,feront'),
    conditional: f('ferais,ferais,ferait,ferions,feriez,feraient'),
    subjunctive: f('fasse,fasses,fasse,fassions,fassiez,fassent'),
  },
  dire: {
    present:     f('dis,dis,dit,disons,dites,disent'),
    preterite:   f('dis,dis,dit,d\u00eemes,d\u00eetes,dirent'),
    future:      f('dirai,diras,dira,dirons,direz,diront'),
    conditional: f('dirais,dirais,dirait,dirions,diriez,diraient'),
    subjunctive: f('dise,dises,dise,disions,disiez,disent'),
  },
  voir: {
    present:     f('vois,vois,voit,voyons,voyez,voient'),
    preterite:   f('vis,vis,vit,v\u00eemes,v\u00eetes,virent'),
    future:      f('verrai,verras,verra,verrons,verrez,verront'),
    conditional: f('verrais,verrais,verrait,verrions,verriez,verraient'),
    subjunctive: f('voie,voies,voie,voyions,voyiez,voient'),
  },
  savoir: {
    present:     f('sais,sais,sait,savons,savez,savent'),
    preterite:   f('sus,sus,sut,s\u00fbmes,s\u00fbtes,surent'),
    future:      f('saurai,sauras,saura,saurons,saurez,sauront'),
    conditional: f('saurais,saurais,saurait,saurions,sauriez,sauraient'),
    subjunctive: f('sache,saches,sache,sachions,sachiez,sachent'),
  },
  pouvoir: {
    present:     f('peux,peux,peut,pouvons,pouvez,peuvent'),
    preterite:   f('pus,pus,put,p\u00fbmes,p\u00fbtes,purent'),
    future:      f('pourrai,pourras,pourra,pourrons,pourrez,pourront'),
    conditional: f('pourrais,pourrais,pourrait,pourrions,pourriez,pourraient'),
    subjunctive: f('puisse,puisses,puisse,puissions,puissiez,puissent'),
  },
  vouloir: {
    present:     f('veux,veux,veut,voulons,voulez,veulent'),
    preterite:   f('voulus,voulus,voulut,voul\u00fbmes,voul\u00fbtes,voulurent'),
    future:      f('voudrai,voudras,voudra,voudrons,voudrez,voudront'),
    conditional: f('voudrais,voudrais,voudrait,voudrions,voudriez,voudraient'),
    subjunctive: f('veuille,veuilles,veuille,voulions,vouliez,veuillent'),
  },
  devoir: {
    present:     f('dois,dois,doit,devons,devez,doivent'),
    preterite:   f('dus,dus,dut,d\u00fbmes,d\u00fbtes,durent'),
    future:      f('devrai,devras,devra,devrons,devrez,devront'),
    conditional: f('devrais,devrais,devrait,devrions,devriez,devraient'),
    subjunctive: f('doive,doives,doive,devions,deviez,doivent'),
  },
  venir: {
    present:     f('viens,viens,vient,venons,venez,viennent'),
    preterite:   f('vins,vins,vint,v\u00eenmes,v\u00eentes,vinrent'),
    future:      f('viendrai,viendras,viendra,viendrons,viendrez,viendront'),
    conditional: f('viendrais,viendrais,viendrait,viendrions,viendriez,viendraient'),
    subjunctive: f('vienne,viennes,vienne,venions,veniez,viennent'),
  },
  tenir: {
    present:     f('tiens,tiens,tient,tenons,tenez,tiennent'),
    preterite:   f('tins,tins,tint,t\u00eenmes,t\u00eentes,tinrent'),
    future:      f('tiendrai,tiendras,tiendra,tiendrons,tiendrez,tiendront'),
    conditional: f('tiendrais,tiendrais,tiendrait,tiendrions,tiendriez,tiendraient'),
    subjunctive: f('tienne,tiennes,tienne,tenions,teniez,tiennent'),
  },
  prendre: {
    present:     f('prends,prends,prend,prenons,prenez,prennent'),
    preterite:   f('pris,pris,prit,pr\u00eemes,pr\u00eetes,prirent'),
    subjunctive: f('prenne,prennes,prenne,prenions,preniez,prennent'),
  },
  mettre: {
    present:     f('mets,mets,met,mettons,mettez,mettent'),
    preterite:   f('mis,mis,mit,m\u00eemes,m\u00eetes,mirent'),
    subjunctive: f('mette,mettes,mette,mettions,mettiez,mettent'),
  },
  connaître: {
    present:     f('connais,connais,conna\u00eet,connaissons,connaissez,connaissent'),
    preterite:   f('connus,connus,connut,conn\u00fbmes,conn\u00fbtes,connurent'),
    subjunctive: f('connaisse,connaisses,connaisse,connaissions,connaissiez,connaissent'),
  },
  croire: {
    present:     f('crois,crois,croit,croyons,croyez,croient'),
    preterite:   f('crus,crus,crut,cr\u00fbmes,cr\u00fbtes,crurent'),
    subjunctive: f('croie,croies,croie,croyions,croyiez,croient'),
  },
  lire: {
    present:     f('lis,lis,lit,lisons,lisez,lisent'),
    preterite:   f('lus,lus,lut,l\u00fbmes,l\u00fbtes,lurent'),
    subjunctive: f('lise,lises,lise,lisions,lisiez,lisent'),
  },
  écrire: {
    present:     f('\u00e9cris,\u00e9cris,\u00e9crit,\u00e9crivons,\u00e9crivez,\u00e9crivent'),
    preterite:   f('\u00e9crivis,\u00e9crivis,\u00e9crivit,\u00e9criv\u00eemes,\u00e9criv\u00eetes,\u00e9crivirent'),
    subjunctive: f('\u00e9crive,\u00e9crives,\u00e9crive,\u00e9crivions,\u00e9criviez,\u00e9crivent'),
  },
  boire: {
    present:     f('bois,bois,boit,buvons,buvez,boivent'),
    preterite:   f('bus,bus,but,b\u00fbmes,b\u00fbtes,burent'),
    imperfect:   f('buvais,buvais,buvait,buvions,buviez,buvaient'),
    subjunctive: f('boive,boives,boive,buvions,buviez,boivent'),
  },
  vivre: {
    present:     f('vis,vis,vit,vivons,vivez,vivent'),
    preterite:   f('v\u00e9cus,v\u00e9cus,v\u00e9cut,v\u00e9c\u00fbmes,v\u00e9c\u00fbtes,v\u00e9curent'),
    subjunctive: f('vive,vives,vive,vivions,viviez,vivent'),
  },
  suivre: {
    present:     f('suis,suis,suit,suivons,suivez,suivent'),
    preterite:   f('suivis,suivis,suivit,suiv\u00eemes,suiv\u00eetes,suivirent'),
    subjunctive: f('suive,suives,suive,suivions,suiviez,suivent'),
  },
  mourir: {
    present:     f('meurs,meurs,meurt,mourons,mourez,meurent'),
    preterite:   f('mourus,mourus,mourut,mour\u00fbmes,mour\u00fbtes,moururent'),
    future:      f('mourrai,mourras,mourra,mourrons,mourrez,mourront'),
    conditional: f('mourrais,mourrais,mourrait,mourrions,mourriez,mourraient'),
    subjunctive: f('meure,meures,meure,mourions,mouriez,meurent'),
  },
  naître: {
    present:     f('nais,nais,na\u00eet,naissons,naissez,naissent'),
    preterite:   f('naquis,naquis,naquit,naqu\u00eemes,naqu\u00eetes,naquirent'),
    subjunctive: f('naisse,naisses,naisse,naissions,naissiez,naissent'),
  },
  courir: {
    present:     f('cours,cours,court,courons,courez,courent'),
    preterite:   f('courus,courus,courut,cour\u00fbmes,cour\u00fbtes,coururent'),
    future:      f('courrai,courras,courra,courrons,courrez,courront'),
    conditional: f('courrais,courrais,courrait,courrions,courriez,courraient'),
  },
  plaire: {
    present:     f('plais,plais,pla\u00eet,plaisons,plaisez,plaisent'),
    preterite:   f('plus,plus,plut,pl\u00fbmes,pl\u00fbtes,plurent'),
    subjunctive: f('plaise,plaises,plaise,plaisions,plaisiez,plaisent'),
  },
  craindre: {
    present:     f('crains,crains,craint,craignons,craignez,craignent'),
    preterite:   f('craignis,craignis,craignit,craign\u00eemes,craign\u00eetes,craignirent'),
    subjunctive: f('craigne,craignes,craigne,craignions,craigniez,craignent'),
  },
  peindre: {
    present:     f('peins,peins,peint,peignons,peignez,peignent'),
    preterite:   f('peignis,peignis,peignit,peign\u00eemes,peign\u00eetes,peignirent'),
    subjunctive: f('peigne,peignes,peigne,peignions,peigniez,peignent'),
  },
  joindre: {
    present:     f('joins,joins,joint,joignons,joignez,joignent'),
    preterite:   f('joignis,joignis,joignit,joign\u00eemes,joign\u00eetes,joignirent'),
    subjunctive: f('joigne,joignes,joigne,joignions,joigniez,joignent'),
  },
  résoudre: {
    present:     f('r\u00e9sous,r\u00e9sous,r\u00e9sout,r\u00e9solvons,r\u00e9solvez,r\u00e9solvent'),
    preterite:   f('r\u00e9solus,r\u00e9solus,r\u00e9solut,r\u00e9sol\u00fbmes,r\u00e9sol\u00fbtes,r\u00e9solurent'),
    subjunctive: f('r\u00e9solve,r\u00e9solves,r\u00e9solve,r\u00e9solvions,r\u00e9solviez,r\u00e9solvent'),
  },
  conduire: {
    present:     f('conduis,conduis,conduit,conduisons,conduisez,conduisent'),
    preterite:   f('conduisis,conduisis,conduisit,conduis\u00eemes,conduis\u00eetes,conduisirent'),
    subjunctive: f('conduise,conduises,conduise,conduisions,conduisiez,conduisent'),
  },
  construire: {
    present:     f('construis,construis,construit,construisons,construisez,construisent'),
    preterite:   f('construisis,construisis,construisit,construis\u00eemes,construis\u00eetes,construisirent'),
    subjunctive: f('construise,construises,construise,construisions,construisiez,construisent'),
  },
  produire: {
    present:     f('produis,produis,produit,produisons,produisez,produisent'),
    preterite:   f('produisis,produisis,produisit,produis\u00eemes,produis\u00eetes,produisirent'),
    subjunctive: f('produise,produises,produise,produisions,produisiez,produisent'),
  },
  traduire: {
    present:     f('traduis,traduis,traduit,traduisons,traduisez,traduisent'),
    preterite:   f('traduisis,traduisis,traduisit,traduis\u00eemes,traduis\u00eetes,traduisirent'),
    subjunctive: f('traduise,traduises,traduise,traduisions,traduisiez,traduisent'),
  },
  rire: {
    present:     f('ris,ris,rit,rions,riez,rient'),
    preterite:   f('ris,ris,rit,r\u00eemes,r\u00eetes,rirent'),
    subjunctive: f('rie,ries,rie,riions,riiez,rient'),
  },
  valoir: {
    present:     f('vaux,vaux,vaut,valons,valez,valent'),
    preterite:   f('valus,valus,valut,val\u00fbmes,val\u00fbtes,valurent'),
    future:      f('vaudrai,vaudras,vaudra,vaudrons,vaudrez,vaudront'),
    conditional: f('vaudrais,vaudrais,vaudrait,vaudrions,vaudriez,vaudraient'),
    subjunctive: f('vaille,vailles,vaille,valions,valiez,vaillent'),
  },
  battre: {
    present:     f('bats,bats,bat,battons,battez,battent'),
    preterite:   f('battis,battis,battit,batt\u00eemes,batt\u00eetes,battirent'),
    subjunctive: f('batte,battes,batte,battions,battiez,battent'),
  },
  recevoir: {
    present:     f('re\u00e7ois,re\u00e7ois,re\u00e7oit,recevons,recevez,re\u00e7oivent'),
    preterite:   f('re\u00e7us,re\u00e7us,re\u00e7ut,re\u00e7\u00fbmes,re\u00e7\u00fbtes,re\u00e7urent'),
    future:      f('recevrai,recevras,recevra,recevrons,recevrez,recevront'),
    conditional: f('recevrais,recevrais,recevrait,recevrions,recevriez,recevraient'),
    subjunctive: f('re\u00e7oive,re\u00e7oives,re\u00e7oive,recevions,receviez,re\u00e7oivent'),
  },
  apercevoir: {
    present:     f('aper\u00e7ois,aper\u00e7ois,aper\u00e7oit,apercevons,apercevez,aper\u00e7oivent'),
    preterite:   f('aper\u00e7us,aper\u00e7us,aper\u00e7ut,aper\u00e7\u00fbmes,aper\u00e7\u00fbtes,aper\u00e7urent'),
    future:      f('apercevrai,apercevras,apercevra,apercevrons,apercevrez,apercevront'),
    conditional: f('apercevrais,apercevrais,apercevrait,apercevrions,apercevriez,apercevraient'),
    subjunctive: f('aper\u00e7oive,aper\u00e7oives,aper\u00e7oive,apercevions,aperceviez,aper\u00e7oivent'),
  },
  falloir: {
    // Impersonal: only il (position 2) is meaningful
    present:     f('-,-,faut,-,-,-'),
    preterite:   f('-,-,fallut,-,-,-'),
    imperfect:   f('-,-,fallait,-,-,-'),
    future:      f('-,-,faudra,-,-,-'),
    conditional: f('-,-,faudrait,-,-,-'),
    subjunctive: f('-,-,faille,-,-,-'),
  },
  pleuvoir: {
    // Impersonal
    present:     f('-,-,pleut,-,-,-'),
    preterite:   f('-,-,plut,-,-,-'),
    imperfect:   f('-,-,pleuvait,-,-,-'),
    future:      f('-,-,pleuvra,-,-,-'),
    conditional: f('-,-,pleuvrait,-,-,-'),
    subjunctive: f('-,-,pleuve,-,-,-'),
  },

  // ─── Verbs with irregular future/conditional stems ───
  envoyer: {
    future:      f('enverrai,enverras,enverra,enverrons,enverrez,enverront'),
    conditional: f('enverrais,enverrais,enverrait,enverrions,enverriez,enverraient'),
  },
  acquérir: {
    present:     f('acquiers,acquiers,acquiert,acqu\u00e9rons,acqu\u00e9rez,acqui\u00e8rent'),
    preterite:   f('acquis,acquis,acquit,acqu\u00eemes,acqu\u00eetes,acquirent'),
    future:      f('acquerrai,acquerras,acquerra,acquerrons,acquerrez,acquerront'),
    conditional: f('acquerrais,acquerrais,acquerrait,acquerrions,acquerriez,acquerraient'),
    subjunctive: f('acqui\u00e8re,acqui\u00e8res,acqui\u00e8re,acqu\u00e9rions,acqu\u00e9riez,acqui\u00e8rent'),
  },
  coudre: {
    present:     f('couds,couds,coud,cousons,cousez,cousent'),
    preterite:   f('cousis,cousis,cousit,cous\u00eemes,cous\u00eetes,cousirent'),
    subjunctive: f('couse,couses,couse,cousions,cousiez,cousent'),
  },
  moudre: {
    present:     f('mouds,mouds,moud,moulons,moulez,moulent'),
    preterite:   f('moulus,moulus,moulut,moul\u00fbmes,moul\u00fbtes,moulurent'),
    subjunctive: f('moule,moules,moule,moulions,mouliez,moulent'),
  },

  // ─── Compound verbs (inherit from base + override) ───
  devenir: {
    present:     f('deviens,deviens,devient,devenons,devenez,deviennent'),
    preterite:   f('devins,devins,devint,dev\u00eenmes,dev\u00eentes,devinrent'),
    future:      f('deviendrai,deviendras,deviendra,deviendrons,deviendrez,deviendront'),
    conditional: f('deviendrais,deviendrais,deviendrait,deviendrions,deviendriez,deviendraient'),
    subjunctive: f('devienne,deviennes,devienne,devenions,deveniez,deviennent'),
  },
  revenir: {
    present:     f('reviens,reviens,revient,revenons,revenez,reviennent'),
    preterite:   f('revins,revins,revint,rev\u00eenmes,rev\u00eentes,revinrent'),
    future:      f('reviendrai,reviendras,reviendra,reviendrons,reviendrez,reviendront'),
    conditional: f('reviendrais,reviendrais,reviendrait,reviendrions,reviendriez,reviendraient'),
    subjunctive: f('revienne,reviennes,revienne,revenions,reveniez,reviennent'),
  },
  obtenir: {
    present:     f('obtiens,obtiens,obtient,obtenons,obtenez,obtiennent'),
    preterite:   f('obtins,obtins,obtint,obt\u00eenmes,obt\u00eentes,obtinrent'),
    future:      f('obtiendrai,obtiendras,obtiendra,obtiendrons,obtiendrez,obtiendront'),
    conditional: f('obtiendrais,obtiendrais,obtiendrait,obtiendrions,obtiendriez,obtiendraient'),
    subjunctive: f('obtienne,obtiennes,obtienne,obtenions,obteniez,obtiennent'),
  },
  maintenir: {
    present:     f('maintiens,maintiens,maintient,maintenons,maintenez,maintiennent'),
    future:      f('maintiendrai,maintiendras,maintiendra,maintiendrons,maintiendrez,maintiendront'),
    conditional: f('maintiendrais,maintiendrais,maintiendrait,maintiendrions,maintiendriez,maintiendraient'),
    subjunctive: f('maintienne,maintiennes,maintienne,maintenions,mainteniez,maintiennent'),
  },
  apprendre: {
    present:     f('apprends,apprends,apprend,apprenons,apprenez,apprennent'),
    preterite:   f('appris,appris,apprit,appr\u00eemes,appr\u00eetes,apprirent'),
    subjunctive: f('apprenne,apprennes,apprenne,apprenions,appreniez,apprennent'),
  },
  comprendre: {
    present:     f('comprends,comprends,comprend,comprenons,comprenez,comprennent'),
    preterite:   f('compris,compris,comprit,compr\u00eemes,compr\u00eetes,comprirent'),
    subjunctive: f('comprenne,comprennes,comprenne,comprenions,compreniez,comprennent'),
  },
  surprendre: {
    present:     f('surprends,surprends,surprend,surprenons,surprenez,surprennent'),
    preterite:   f('surpris,surpris,surprit,surpr\u00eemes,surpr\u00eetes,surprirent'),
    subjunctive: f('surprenne,surprennes,surprenne,surprenions,surpreniez,surprennent'),
  },
  permettre: {
    present:     f('permets,permets,permet,permettons,permettez,permettent'),
    preterite:   f('permis,permis,permit,perm\u00eemes,perm\u00eetes,permirent'),
    subjunctive: f('permette,permettes,permette,permettions,permettiez,permettent'),
  },
  promettre: {
    present:     f('promets,promets,promet,promettons,promettez,promettent'),
    preterite:   f('promis,promis,promit,prom\u00eemes,prom\u00eetes,promirent'),
    subjunctive: f('promette,promettes,promette,promettions,promettiez,promettent'),
  },
  ouvrir: {
    present:     f('ouvre,ouvres,ouvre,ouvrons,ouvrez,ouvrent'),
    preterite:   f('ouvris,ouvris,ouvrit,ouvr\u00eemes,ouvr\u00eetes,ouvrirent'),
    subjunctive: f('ouvre,ouvres,ouvre,ouvrions,ouvriez,ouvrent'),
  },
  offrir: {
    present:     f('offre,offres,offre,offrons,offrez,offrent'),
    preterite:   f('offris,offris,offrit,offr\u00eemes,offr\u00eetes,offrirent'),
    subjunctive: f('offre,offres,offre,offrions,offriez,offrent'),
  },
  souffrir: {
    present:     f('souffre,souffres,souffre,souffrons,souffrez,souffrent'),
    preterite:   f('souffris,souffris,souffrit,souffr\u00eemes,souffr\u00eetes,souffrirent'),
    subjunctive: f('souffre,souffres,souffre,souffrions,souffriez,souffrent'),
  },
  couvrir: {
    present:     f('couvre,couvres,couvre,couvrons,couvrez,couvrent'),
    preterite:   f('couvris,couvris,couvrit,couvr\u00eemes,couvr\u00eetes,couvrirent'),
    subjunctive: f('couvre,couvres,couvre,couvrions,couvriez,couvrent'),
  },
  découvrir: {
    present:     f('d\u00e9couvre,d\u00e9couvres,d\u00e9couvre,d\u00e9couvrons,d\u00e9couvrez,d\u00e9couvrent'),
    preterite:   f('d\u00e9couvris,d\u00e9couvris,d\u00e9couvrit,d\u00e9couvr\u00eemes,d\u00e9couvr\u00eetes,d\u00e9couvrirent'),
    subjunctive: f('d\u00e9couvre,d\u00e9couvres,d\u00e9couvre,d\u00e9couvrions,d\u00e9couvriez,d\u00e9couvrent'),
  },
  fuir: {
    present:     f('fuis,fuis,fuit,fuyons,fuyez,fuient'),
    preterite:   f('fuis,fuis,fuit,fu\u00eemes,fu\u00eetes,fuirent'),
    subjunctive: f('fuie,fuies,fuie,fuyions,fuyiez,fuient'),
  },
  asseoir: {
    present:     f('assieds,assieds,assied,asseyons,asseyez,asseyent'),
    preterite:   f('assis,assis,assit,ass\u00eemes,ass\u00eetes,assirent'),
    future:      f('assi\u00e9rai,assi\u00e9ras,assi\u00e9ra,assi\u00e9rons,assi\u00e9rez,assi\u00e9ront'),
    conditional: f('assi\u00e9rais,assi\u00e9rais,assi\u00e9rait,assi\u00e9rions,assi\u00e9riez,assi\u00e9raient'),
    subjunctive: f('asseye,asseyes,asseye,asseyions,asseyiez,asseyent'),
  },
  vaincre: {
    present:     f('vaincs,vaincs,vainc,vainquons,vainquez,vainquent'),
    preterite:   f('vainquis,vainquis,vainquit,vainqu\u00eemes,vainqu\u00eetes,vainquirent'),
    subjunctive: f('vainque,vainques,vainque,vainquions,vainquiez,vainquent'),
  },
};

// ── Main conjugation function ───────────────────────────────
export function conjugate(infinitive: string): ConjugationTable | null {
  const raw = infinitive.trim().toLowerCase();

  // Detect reflexive: se/s' prefix
  let isReflexive = false;
  let inf = raw;
  if (raw.startsWith('se ') || raw.startsWith("s'")) {
    inf = raw.startsWith('se ') ? raw.slice(3) : raw.slice(2);
    isReflexive = true;
  }

  // Build regular base
  const regular = conjugateRegular(inf);
  if (!regular) return null;

  // Apply irregular overrides
  const overrides = IRR[inf];
  const tenses = overrides ? merge(regular, overrides) : regular;

  // Replace passé simple with passé composé (more useful for learners)
  const passeCompose = buildPasseCompose(inf, isReflexive);

  // Build final tenses record
  const finalTenses: Record<string, string[]> = {};
  for (const t of TENSES) {
    if (t === 'preterite') {
      // Show passé composé instead of passé simple
      if (isReflexive) {
        // Add reflexive pronoun before auxiliary: "me suis lavé", "t'es lavé"
        finalTenses[t] = passeCompose.map((form, i) => {
          const pron = REFLEXIVE_PRONOUNS[i];
          // Elide: me/te/se → m'/t'/s' before vowel (suis, es, est, etc.)
          if (/^[aeéèêiîoôuûhyœæ]/.test(form) && (pron === 'me' || pron === 'te' || pron === 'se')) {
            return pron.charAt(0) + "'" + form;
          }
          return pron + ' ' + form;
        });
      } else {
        finalTenses[t] = [...passeCompose];
      }
    } else if (isReflexive) {
      finalTenses[t] = tenses[t].map((form, i) => {
        if (form === '-') return '-';
        const pron = REFLEXIVE_PRONOUNS[i];
        // Elide before vowel: me → m', te → t', se → s'
        if (/^[aeéèêiîoôuûhyœæ]/.test(form) && (pron === 'me' || pron === 'te' || pron === 'se')) {
          return pron.charAt(0) + "'" + form;
        }
        return pron + ' ' + form;
      });
    } else {
      finalTenses[t] = [...tenses[t]];
    }
  }

  return {
    infinitive: raw,
    isReflexive,
    tenses: finalTenses,
  };
}
