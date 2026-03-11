/**
 * Italian verb conjugation engine
 * Handles regular -are/-ere/-ire verbs, -isco pattern, spelling changes,
 * reflexive verbs, and 60+ irregular overrides.
 */
import type { ConjugationTable } from '../../types';

// ── Types ───────────────────────────────────────────────────
type Forms = [string, string, string, string, string, string]; // io, tu, lui, noi, voi, loro
type TenseKey = 'present' | 'preterite' | 'imperfect' | 'future' | 'conditional' | 'subjunctive';
type PartialTenses = Partial<Record<TenseKey, Forms>>;
const TENSES: TenseKey[] = ['present', 'preterite', 'imperfect', 'future', 'conditional', 'subjunctive'];
const REFLEXIVE_PRONOUNS: Forms = ['mi', 'ti', 'si', 'ci', 'vi', 'si'];

// ── Helpers ─────────────────────────────────────────────────
const f = (s: string): Forms => s.split(',') as unknown as Forms;
const stem = (inf: string, n = 3) => inf.slice(0, -n);

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
// Each array: [io, tu, lui/lei, noi, voi, loro]
const REG: Record<string, Record<TenseKey, Forms>> = {
  are: {
    present:     f('o,i,a,iamo,ate,ano'),
    preterite:   f('ai,asti,\u00f2,ammo,aste,arono'),
    imperfect:   f('avo,avi,ava,avamo,avate,avano'),
    future:      f('er\u00f2,erai,er\u00e0,eremo,erete,eranno'),
    conditional: f('erei,eresti,erebbe,eremmo,ereste,erebbero'),
    subjunctive: f('i,i,i,iamo,iate,ino'),
  },
  ere: {
    present:     f('o,i,e,iamo,ete,ono'),
    preterite:   f('ei,esti,\u00e9,emmo,este,erono'),
    imperfect:   f('evo,evi,eva,evamo,evate,evano'),
    future:      f('er\u00f2,erai,er\u00e0,eremo,erete,eranno'),
    conditional: f('erei,eresti,erebbe,eremmo,ereste,erebbero'),
    subjunctive: f('a,a,a,iamo,iate,ano'),
  },
  ire: {
    present:     f('o,i,e,iamo,ite,ono'),
    preterite:   f('ii,isti,\u00ec,immo,iste,irono'),
    imperfect:   f('ivo,ivi,iva,ivamo,ivate,ivano'),
    future:      f('ir\u00f2,irai,ir\u00e0,iremo,irete,iranno'),
    conditional: f('irei,iresti,irebbe,iremmo,ireste,irebbero'),
    subjunctive: f('a,a,a,iamo,iate,ano'),
  },
};

// ── -isco pattern verbs ─────────────────────────────────────
// Verbs that insert -isc- before the ending in present & subjunctive (1,2,3,6)
const ISCO_VERBS = new Set([
  'finire', 'capire', 'preferire', 'pulire', 'costruire', 'spedire',
  'unire', 'colpire', 'garantire', 'gestire', 'impedire', 'inserire',
  'abolire', 'agire', 'contribuire', 'distribuire', 'esaurire',
  'esibire', 'favorire', 'ferire', 'fornire', 'guarire', 'istruire',
  'nutrire', 'obbedire', 'proibire', 'punire', 'reagire', 'restituire',
  'riferire', 'scolpire', 'sostituire', 'stupire', 'subire', 'suggerire',
  'tradire', 'trasferire', 'ubbidire',
]);

function iscoPresent(s: string): Forms {
  return [s + 'isco', s + 'isci', s + 'isce', s + 'iamo', s + 'ite', s + 'iscono'];
}
function iscoSubjunctive(s: string): Forms {
  return [s + 'isca', s + 'isca', s + 'isca', s + 'iamo', s + 'iate', s + 'iscano'];
}

// ── Spelling-change helpers ─────────────────────────────────
// -care/-gare: insert h before e/i to keep /k/ or /g/
// -ciare/-giare: drop i before e/i
function needsSpellingFix(inf: string): 'ch' | 'gh' | 'drop-i' | null {
  if (/care$/.test(inf)) return 'ch';
  if (/gare$/.test(inf)) return 'gh';
  if (/[cg]iare$/.test(inf)) return 'drop-i';
  return null;
}

function fixSpelling(inf: string, base: Record<TenseKey, Forms>): Record<TenseKey, Forms> {
  const fix = needsSpellingFix(inf);
  if (!fix) return base;
  const s = stem(inf); // stem without -are
  const result = { ...base };

  if (fix === 'ch' || fix === 'gh') {
    // Insert h before endings starting with e or i
    const fixForms = (forms: Forms): Forms =>
      forms.map((form) => {
        // Rebuild from stem + h + ending where ending starts with e/i
        const ending = form.slice(s.length);
        if (/^[ei]/.test(ending)) return s + 'h' + ending;
        return form;
      }) as Forms;
    result.present = fixForms(result.present);
    result.future = fixForms(result.future);
    result.conditional = fixForms(result.conditional);
    result.subjunctive = fixForms(result.subjunctive);
  } else if (fix === 'drop-i') {
    // -ciare/-giare: stem already ends in ci/gi; drop the i before e/i endings
    // stem = "mangi" from "mangiare", "cominci" from "cominciare"
    const fixForms = (forms: Forms): Forms =>
      forms.map(form => {
        const ending = form.slice(s.length);
        // if ending starts with i or e, stem's trailing i is redundant
        if (/^[ie]/.test(ending)) return s.slice(0, -1) + ending;
        return form;
      }) as Forms;
    result.present = fixForms(result.present);
    result.future = fixForms(result.future);
    result.conditional = fixForms(result.conditional);
    result.subjunctive = fixForms(result.subjunctive);
  }
  return result;
}

// ── Contracted infinitives ───────────────────────────────────
// Map short infinitives to their conjugation class + effective stem
// These verbs lost syllables from Latin but conjugate on an expanded stem.
const CONTRACTED: Record<string, { conj: string; stem: string }> = {
  fare:     { conj: 'are', stem: 'f' },     // facere → fare
  dire:     { conj: 'ire', stem: 'd' },     // dicere → dire
  bere:     { conj: 'ere', stem: 'bev' },   // bevere → bere
  porre:    { conj: 'ere', stem: 'pon' },   // ponere → porre
  tradurre: { conj: 'ere', stem: 'traduc' },// traducere → tradurre
  trarre:   { conj: 'ere', stem: 'tra' },   // traere → trarre
};

// ── Regular conjugation builder ─────────────────────────────
function conjugateRegular(inf: string): Record<TenseKey, Forms> | null {
  let conj: string;
  let s: string;

  const contracted = CONTRACTED[inf];
  if (contracted) {
    conj = contracted.conj;
    s = contracted.stem;
  } else if (inf.endsWith('are')) {
    conj = 'are';
    s = stem(inf);
  } else if (inf.endsWith('ere')) {
    conj = 'ere';
    s = stem(inf);
  } else if (inf.endsWith('ire')) {
    conj = 'ire';
    s = stem(inf);
  } else {
    return null;
  }

  const endings = REG[conj];
  const base: Record<TenseKey, Forms> = {} as any;
  for (const t of TENSES) {
    base[t] = apply(s, endings[t]);
  }

  // Apply -isco pattern
  if (conj === 'ire' && ISCO_VERBS.has(inf)) {
    base.present = iscoPresent(s);
    base.subjunctive = iscoSubjunctive(s);
  }

  // Apply spelling fixes for -care/-gare/-ciare/-giare
  return fixSpelling(inf, base);
}

// ── Irregular verb data ─────────────────────────────────────
// Only tenses that differ from regular conjugation are listed.
// Full arrays are stored for truly irregular verbs.

const IRR: Record<string, PartialTenses> = {
  // ─── Fully irregular ───
  essere: {
    present:     f('sono,sei,\u00e8,siamo,siete,sono'),
    preterite:   f('fui,fosti,fu,fummo,foste,furono'),
    imperfect:   f('ero,eri,era,eravamo,eravate,erano'),
    future:      f('sar\u00f2,sarai,sar\u00e0,saremo,sarete,saranno'),
    conditional: f('sarei,saresti,sarebbe,saremmo,sareste,sarebbero'),
    subjunctive: f('sia,sia,sia,siamo,siate,siano'),
  },
  avere: {
    present:     f('ho,hai,ha,abbiamo,avete,hanno'),
    preterite:   f('ebbi,avesti,ebbe,avemmo,aveste,ebbero'),
    future:      f('avr\u00f2,avrai,avr\u00e0,avremo,avrete,avranno'),
    conditional: f('avrei,avresti,avrebbe,avremmo,avreste,avrebbero'),
    subjunctive: f('abbia,abbia,abbia,abbiamo,abbiate,abbiano'),
  },
  fare: {
    present:     f('faccio,fai,fa,facciamo,fate,fanno'),
    preterite:   f('feci,facesti,fece,facemmo,faceste,fecero'),
    imperfect:   f('facevo,facevi,faceva,facevamo,facevate,facevano'),
    future:      f('far\u00f2,farai,far\u00e0,faremo,farete,faranno'),
    conditional: f('farei,faresti,farebbe,faremmo,fareste,farebbero'),
    subjunctive: f('faccia,faccia,faccia,facciamo,facciate,facciano'),
  },
  andare: {
    present:     f('vado,vai,va,andiamo,andate,vanno'),
    future:      f('andr\u00f2,andrai,andr\u00e0,andremo,andrete,andranno'),
    conditional: f('andrei,andresti,andrebbe,andremmo,andreste,andrebbero'),
    subjunctive: f('vada,vada,vada,andiamo,andiate,vadano'),
  },
  dare: {
    present:     f('do,dai,d\u00e0,diamo,date,danno'),
    preterite:   f('diedi,desti,diede,demmo,deste,diedero'),
    future:      f('dar\u00f2,darai,dar\u00e0,daremo,darete,daranno'),
    conditional: f('darei,daresti,darebbe,daremmo,dareste,darebbero'),
    subjunctive: f('dia,dia,dia,diamo,diate,diano'),
  },
  stare: {
    present:     f('sto,stai,sta,stiamo,state,stanno'),
    preterite:   f('stetti,stesti,stette,stemmo,steste,stettero'),
    future:      f('star\u00f2,starai,star\u00e0,staremo,starete,staranno'),
    conditional: f('starei,staresti,starebbe,staremmo,stareste,starebbero'),
    subjunctive: f('stia,stia,stia,stiamo,stiate,stiano'),
  },
  dire: {
    present:     f('dico,dici,dice,diciamo,dite,dicono'),
    preterite:   f('dissi,dicesti,disse,dicemmo,diceste,dissero'),
    imperfect:   f('dicevo,dicevi,diceva,dicevamo,dicevate,dicevano'),
    future:      f('dir\u00f2,dirai,dir\u00e0,diremo,direte,diranno'),
    conditional: f('direi,diresti,direbbe,diremmo,direste,direbbero'),
    subjunctive: f('dica,dica,dica,diciamo,diciate,dicano'),
  },
  venire: {
    present:     f('vengo,vieni,viene,veniamo,venite,vengono'),
    preterite:   f('venni,venisti,venne,venimmo,veniste,vennero'),
    future:      f('verr\u00f2,verrai,verr\u00e0,verremo,verrete,verranno'),
    conditional: f('verrei,verresti,verrebbe,verremmo,verreste,verrebbero'),
    subjunctive: f('venga,venga,venga,veniamo,veniate,vengano'),
  },
  potere: {
    present:     f('posso,puoi,pu\u00f2,possiamo,potete,possono'),
    future:      f('potr\u00f2,potrai,potr\u00e0,potremo,potrete,potranno'),
    conditional: f('potrei,potresti,potrebbe,potremmo,potreste,potrebbero'),
    subjunctive: f('possa,possa,possa,possiamo,possiate,possano'),
  },
  volere: {
    present:     f('voglio,vuoi,vuole,vogliamo,volete,vogliono'),
    preterite:   f('volli,volesti,volle,volemmo,voleste,vollero'),
    future:      f('vorr\u00f2,vorrai,vorr\u00e0,vorremo,vorrete,vorranno'),
    conditional: f('vorrei,vorresti,vorrebbe,vorremmo,vorreste,vorrebbero'),
    subjunctive: f('voglia,voglia,voglia,vogliamo,vogliate,vogliano'),
  },
  dovere: {
    present:     f('devo,devi,deve,dobbiamo,dovete,devono'),
    future:      f('dovr\u00f2,dovrai,dovr\u00e0,dovremo,dovrete,dovranno'),
    conditional: f('dovrei,dovresti,dovrebbe,dovremmo,dovreste,dovrebbero'),
    subjunctive: f('debba,debba,debba,dobbiamo,dobbiate,debbano'),
  },
  sapere: {
    present:     f('so,sai,sa,sappiamo,sapete,sanno'),
    preterite:   f('seppi,sapesti,seppe,sapemmo,sapeste,seppero'),
    future:      f('sapr\u00f2,saprai,sapr\u00e0,sapremo,saprete,sapranno'),
    conditional: f('saprei,sapresti,saprebbe,sapremmo,sapreste,saprebbero'),
    subjunctive: f('sappia,sappia,sappia,sappiamo,sappiate,sappiano'),
  },
  uscire: {
    present:     f('esco,esci,esce,usciamo,uscite,escono'),
    subjunctive: f('esca,esca,esca,usciamo,usciate,escano'),
  },
  morire: {
    present:     f('muoio,muori,muore,moriamo,morite,muoiono'),
    preterite:   f('morii,moristi,mor\u00ec,morimmo,moriste,morirono'),
    future:      f('morr\u00f2,morrai,morr\u00e0,morremo,morrete,morranno'),
    conditional: f('morrei,morresti,morrebbe,morremmo,morreste,morrebbero'),
    subjunctive: f('muoia,muoia,muoia,moriamo,moriate,muoiano'),
  },
  rimanere: {
    present:     f('rimango,rimani,rimane,rimaniamo,rimanete,rimangono'),
    preterite:   f('rimasi,rimanesti,rimase,rimanemmo,rimaneste,rimasero'),
    future:      f('rimarr\u00f2,rimarrai,rimarr\u00e0,rimarremo,rimarrete,rimarranno'),
    conditional: f('rimarrei,rimarresti,rimarrebbe,rimarremmo,rimarreste,rimarrebbero'),
    subjunctive: f('rimanga,rimanga,rimanga,rimaniamo,rimaniate,rimangano'),
  },
  tenere: {
    present:     f('tengo,tieni,tiene,teniamo,tenete,tengono'),
    preterite:   f('tenni,tenesti,tenne,tenemmo,teneste,tennero'),
    future:      f('terr\u00f2,terrai,terr\u00e0,terremo,terrete,terranno'),
    conditional: f('terrei,terresti,terrebbe,terremmo,terreste,terrebbero'),
    subjunctive: f('tenga,tenga,tenga,teniamo,teniate,tengano'),
  },
  porre: {
    present:     f('pongo,poni,pone,poniamo,ponete,pongono'),
    preterite:   f('posi,ponesti,pose,ponemmo,poneste,posero'),
    imperfect:   f('ponevo,ponevi,poneva,ponevamo,ponevate,ponevano'),
    future:      f('porr\u00f2,porrai,porr\u00e0,porremo,porrete,porranno'),
    conditional: f('porrei,porresti,porrebbe,porremmo,porreste,porrebbero'),
    subjunctive: f('ponga,ponga,ponga,poniamo,poniate,pongano'),
  },
  tradurre: {
    present:     f('traduco,traduci,traduce,traduciamo,traducete,traducono'),
    preterite:   f('tradussi,traducesti,tradusse,traducemmo,traduceste,tradussero'),
    imperfect:   f('traducevo,traducevi,traduceva,traducevamo,traducevate,traducevano'),
    future:      f('tradurr\u00f2,tradurrai,tradurr\u00e0,tradurremo,tradurrete,tradurranno'),
    conditional: f('tradurrei,tradurresti,tradurrebbe,tradurremmo,tradurreste,tradurrebbero'),
    subjunctive: f('traduca,traduca,traduca,traduciamo,traduciate,traducano'),
  },
  bere: {
    present:     f('bevo,bevi,beve,beviamo,bevete,bevono'),
    preterite:   f('bevvi,bevesti,bevve,bevemmo,beveste,bevvero'),
    imperfect:   f('bevevo,bevevi,beveva,bevevamo,bevevate,bevevano'),
    future:      f('berr\u00f2,berrai,berr\u00e0,berremo,berrete,berranno'),
    conditional: f('berrei,berresti,berrebbe,berremmo,berreste,berrebbero'),
    subjunctive: f('beva,beva,beva,beviamo,beviate,bevano'),
  },
  trarre: {
    present:     f('traggo,trai,trae,traiamo,traete,traggono'),
    preterite:   f('trassi,traesti,trasse,traemmo,traeste,trassero'),
    imperfect:   f('traevo,traevi,traeva,traevamo,traevate,traevano'),
    future:      f('trarr\u00f2,trarrai,trarr\u00e0,trarremo,trarrete,trarranno'),
    conditional: f('trarrei,trarresti,trarrebbe,trarremmo,trarreste,trarrebbero'),
    subjunctive: f('tragga,tragga,tragga,traiamo,traiate,traggano'),
  },
  salire: {
    present:     f('salgo,sali,sale,saliamo,salite,salgono'),
    subjunctive: f('salga,salga,salga,saliamo,saliate,salgano'),
  },
  apparire: {
    present:     f('appaio,appari,appare,appariamo,apparite,appaiono'),
    preterite:   f('apparvi,apparisti,apparve,apparimmo,appariste,apparvero'),
    subjunctive: f('appaia,appaia,appaia,appariamo,appariate,appaiano'),
  },
  parere: {
    present:     f('paio,pari,pare,pariamo,parete,paiono'),
    preterite:   f('parvi,paresti,parve,paremmo,pareste,parvero'),
    future:      f('parr\u00f2,parrai,parr\u00e0,parremo,parrete,parranno'),
    conditional: f('parrei,parresti,parrebbe,parremmo,parreste,parrebbero'),
    subjunctive: f('paia,paia,paia,pariamo,pariate,paiano'),
  },
  piacere: {
    present:     f('piaccio,piaci,piace,piacciamo,piacete,piacciono'),
    preterite:   f('piacqui,piacesti,piacque,piacemmo,piaceste,piacquero'),
    subjunctive: f('piaccia,piaccia,piaccia,piacciamo,piacciate,piacciano'),
  },
  tacere: {
    present:     f('taccio,taci,tace,tacciamo,tacete,tacciono'),
    preterite:   f('tacqui,tacesti,tacque,tacemmo,taceste,tacquero'),
    subjunctive: f('taccia,taccia,taccia,tacciamo,tacciate,tacciano'),
  },
  giacere: {
    present:     f('giaccio,giaci,giace,giacciamo,giacete,giacciono'),
    preterite:   f('giacqui,giacesti,giacque,giacemmo,giaceste,giacquero'),
    subjunctive: f('giaccia,giaccia,giaccia,giacciamo,giacciate,giacciano'),
  },
  nuocere: {
    present:     f('nuoccio,nuoci,nuoce,nociamo,nocete,nuocciono'),
    preterite:   f('nocqui,nocesti,nocque,nocemmo,noceste,nocquero'),
    subjunctive: f('nuoccia,nuoccia,nuoccia,nociamo,nociate,nuocciano'),
  },
  cuocere: {
    present:     f('cuocio,cuoci,cuoce,cociamo,cocete,cuociono'),
    preterite:   f('cossi,cocesti,cosse,cocemmo,coceste,cossero'),
    subjunctive: f('cuocia,cuocia,cuocia,cociamo,cociate,cuociano'),
  },

  // ─── Common irregulars ───
  sedere: {
    present:     f('siedo,siedi,siede,sediamo,sedete,siedono'),
    subjunctive: f('sieda,sieda,sieda,sediamo,sediate,siedano'),
  },
  scegliere: {
    present:     f('scelgo,scegli,sceglie,scegliamo,scegliete,scelgono'),
    preterite:   f('scelsi,scegliesti,scelse,scegliemmo,sceglieste,scelsero'),
    subjunctive: f('scelga,scelga,scelga,scegliamo,scegliate,scelgano'),
  },
  togliere: {
    present:     f('tolgo,togli,toglie,togliamo,togliete,tolgono'),
    preterite:   f('tolsi,togliesti,tolse,togliemmo,toglieste,tolsero'),
    subjunctive: f('tolga,tolga,tolga,togliamo,togliate,tolgano'),
  },
  cogliere: {
    present:     f('colgo,cogli,coglie,cogliamo,cogliete,colgono'),
    preterite:   f('colsi,cogliesti,colse,cogliemmo,coglieste,colsero'),
    subjunctive: f('colga,colga,colga,cogliamo,cogliate,colgano'),
  },
  sciogliere: {
    present:     f('sciolgo,sciogli,scioglie,sciogliamo,sciogliete,sciolgono'),
    preterite:   f('sciolsi,sciogliesti,sciolse,sciogliemmo,scioglieste,sciolsero'),
    subjunctive: f('sciolga,sciolga,sciolga,sciogliamo,sciogliate,sciolgano'),
  },
  raccogliere: {
    present:     f('raccolgo,raccogli,raccoglie,raccogliamo,raccogliete,raccolgono'),
    preterite:   f('raccolsi,raccogliesti,raccolse,raccogliemmo,raccoglieste,raccolsero'),
    subjunctive: f('raccolga,raccolga,raccolga,raccogliamo,raccogliate,raccolgano'),
  },
  spegnere: {
    present:     f('spengo,spegni,spegne,spegniamo,spegnete,spengono'),
    preterite:   f('spensi,spegnesti,spense,spegnemmo,spegneste,spensero'),
    subjunctive: f('spenga,spenga,spenga,spegniamo,spegniate,spengano'),
  },
  valere: {
    present:     f('valgo,vali,vale,valiamo,valete,valgono'),
    preterite:   f('valsi,valesti,valse,valemmo,valeste,valsero'),
    future:      f('varr\u00f2,varrai,varr\u00e0,varremo,varrete,varranno'),
    conditional: f('varrei,varresti,varrebbe,varremmo,varreste,varrebbero'),
    subjunctive: f('valga,valga,valga,valiamo,valiate,valgano'),
  },
  vivere: {
    preterite:   f('vissi,vivesti,visse,vivemmo,viveste,vissero'),
    future:      f('vivr\u00f2,vivrai,vivr\u00e0,vivremo,vivrete,vivranno'),
    conditional: f('vivrei,vivresti,vivrebbe,vivremmo,vivreste,vivrebbero'),
  },
  scrivere: {
    preterite:   f('scrissi,scrivesti,scrisse,scrivemmo,scriveste,scrissero'),
  },
  leggere: {
    preterite:   f('lessi,leggesti,lesse,leggemmo,leggeste,lessero'),
  },
  chiudere: {
    preterite:   f('chiusi,chiudesti,chiuse,chiudemmo,chiudeste,chiusero'),
  },
  chiedere: {
    preterite:   f('chiesi,chiedesti,chiese,chiedemmo,chiedeste,chiesero'),
  },
  rispondere: {
    preterite:   f('risposi,rispondesti,rispose,rispondemmo,rispondeste,risposero'),
  },
  prendere: {
    preterite:   f('presi,prendesti,prese,prendemmo,prendeste,presero'),
  },
  scendere: {
    preterite:   f('scesi,scendesti,scese,scendemmo,scendeste,scesero'),
  },
  accendere: {
    preterite:   f('accesi,accendesti,accese,accendemmo,accendeste,accesero'),
  },
  spendere: {
    preterite:   f('spesi,spendesti,spese,spendemmo,spendeste,spesero'),
  },
  nascere: {
    preterite:   f('nacqui,nascesti,nacque,nascemmo,nasceste,nacquero'),
  },
  crescere: {
    preterite:   f('crebbi,crescesti,crebbe,crescemmo,cresceste,crebbero'),
  },
  conoscere: {
    preterite:   f('conobbi,conoscesti,conobbe,conoscemmo,conosceste,conobbero'),
  },
  vincere: {
    preterite:   f('vinsi,vincesti,vinse,vincemmo,vinceste,vinsero'),
  },
  dipingere: {
    preterite:   f('dipinsi,dipingesti,dipinse,dipingemmo,dipingeste,dipinsero'),
  },
  piangere: {
    preterite:   f('piansi,piangesti,pianse,piangemmo,piangeste,piansero'),
  },
  stringere: {
    preterite:   f('strinsi,stringesti,strinse,stringemmo,stringeste,strinsero'),
  },
  giungere: {
    preterite:   f('giunsi,giungesti,giunse,giungemmo,giungeste,giunsero'),
  },
  correre: {
    preterite:   f('corsi,corresti,corse,corremmo,correste,corsero'),
  },
  mettere: {
    preterite:   f('misi,mettesti,mise,mettemmo,metteste,misero'),
  },
  rompere: {
    preterite:   f('ruppi,rompesti,ruppe,rompemmo,rompeste,ruppero'),
  },
  muovere: {
    preterite:   f('mossi,muovesti,mosse,muovemmo,muoveste,mossero'),
  },
  ridere: {
    preterite:   f('risi,ridesti,rise,ridemmo,rideste,risero'),
  },
  perdere: {
    preterite:   f('persi,perdesti,perse,perdemmo,perdeste,persero'),
  },

  // ─── Spelling-pattern verbs (irregular overrides beyond auto-fix) ───
  cercare: {
    // Handled by spelling fix helper, but preterite needs explicit entry
    preterite: f('cercai,cercasti,cerc\u00f2,cercammo,cercaste,cercarono'),
  },
  pagare: {
    preterite: f('pagai,pagasti,pag\u00f2,pagammo,pagaste,pagarono'),
  },
  // mangiare, cominciare, lasciare: handled entirely by the spelling-fix helper
};

// ── Main conjugation function ───────────────────────────────
export function conjugate(infinitive: string): ConjugationTable | null {
  const raw = infinitive.trim().toLowerCase();

  // Detect reflexive
  let isReflexive = false;
  let inf = raw;
  if (raw.endsWith('si')) {
    // alzarsi → alzare, sedersi → sedere, vestirsi → vestire
    const base = raw.slice(0, -2);
    if (base.endsWith('ar')) inf = base + 'e';
    else if (base.endsWith('er')) inf = base + 'e';
    else if (base.endsWith('ir')) inf = base + 'e';
    else return null;
    isReflexive = true;
  }

  // Build regular base
  const regular = conjugateRegular(inf);
  if (!regular) return null;

  // Apply irregular overrides
  const overrides = IRR[inf];
  const tenses = overrides ? merge(regular, overrides) : regular;

  // Build final tenses record (with reflexive pronouns if needed)
  const finalTenses: Record<string, string[]> = {};
  for (const t of TENSES) {
    if (isReflexive) {
      finalTenses[t] = tenses[t].map(
        (form, i) => REFLEXIVE_PRONOUNS[i] + ' ' + form
      );
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
