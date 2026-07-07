/**
 * Dutch verb conjugation engine
 * Handles regular weak verbs, strong verbs, mixed verbs, separable-prefix,
 * inseparable-prefix verbs. Covers 60+ irregular verbs with full conjugation data.
 *
 * Person order: ik, jij, hij/zij, wij, jullie, zij
 *
 * Tenses:
 *   present     – presens
 *   preterite   – imperfectum (simple past)
 *   imperfect   – perfectum (compound past: hebben/zijn + voltooid deelwoord)
 *   future      – futurum (zullen + infinitive)
 *   conditional – conditionalis (zou/zouden + infinitive)
 *   subjunctive – aanv. wijs (aanvoegende wijs)
 */
import type { ConjugationTable } from '../../types';
import { lookupWord } from '../dictionary/nl';

// ── Types ───────────────────────────────────────────────────
type Forms = [string, string, string, string, string, string];
type TenseKey = 'present' | 'preterite' | 'imperfect' | 'future' | 'conditional' | 'subjunctive';

const TENSES: TenseKey[] = ['present', 'preterite', 'imperfect', 'future', 'conditional', 'subjunctive'];

const TENSE_LABELS: Record<TenseKey, string> = {
  present: 'Presens (Present)',
  preterite: 'Verleden Tijd (Past)',
  imperfect: 'Perfectum (Perfect)',
  future: 'Toekomende Tijd (Future)',
  conditional: 'Voorwaardelijk (Conditional)',
  subjunctive: 'Gebiedende Wijs (Imperative)',
};

// ── Helpers ─────────────────────────────────────────────────
const f = (s: string): Forms => s.split(',') as unknown as Forms;

// ── Separable prefixes ──────────────────────────────────────
const SEPARABLE_PREFIXES = [
  'terug', 'samen', 'verder', 'achter',
  'op', 'af', 'aan', 'uit', 'mee', 'bij', 'door', 'over',
  'om', 'toe', 'weg', 'in', 'na', 'voor',
];
SEPARABLE_PREFIXES.sort((a, b) => b.length - a.length);

// Inseparable prefixes – never separate, no ge- in past participle
const INSEPARABLE_PREFIXES = ['be', 'er', 'ge', 'her', 'ont', 'ver'];

function detectSeparablePrefix(inf: string): string | null {
  for (const p of SEPARABLE_PREFIXES) {
    if (inf.startsWith(p) && inf.length > p.length + 2) {
      const remainder = inf.slice(p.length);
      if (remainder.endsWith('en') || remainder.endsWith('n')) {
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

// ── Auxiliary forms ─────────────────────────────────────────
const HEBBEN_PRESENT: Forms = f('heb,hebt,heeft,hebben,hebben,hebben');
const ZIJN_PRESENT: Forms = f('ben,bent,is,zijn,zijn,zijn');
const ZULLEN_PRESENT: Forms = f('zal,zult,zal,zullen,zullen,zullen');
const ZOU_FORMS: Forms = f('zou,zou,zou,zouden,zouden,zouden');

// ── 't kofschip rule ────────────────────────────────────────
// If the stem ends in one of these consonants, use -te/-ten (past) and -t (participle)
// Otherwise use -de/-den and -d
function isKofschip(stem: string): boolean {
  return /[tkfscp]$/.test(stem) || stem.endsWith('ch');
}

// ── Stem extraction ─────────────────────────────────────────
/**
 * Get the stem of a Dutch verb from its infinitive.
 * Rules:
 * - Remove -en (or -n for single-syllable like "doen", "gaan", "staan", "zien", "slaan")
 * - v at end of stem → f (leven → leef)
 * - z at end of stem → s (reizen → reis)
 * - Double vowel in open syllable stays single in closed syllable (lopen → loop)
 *   Actually in Dutch: we keep the long vowel by doubling it in closed syllable
 *   e.g., lopen → stem "loop" (long o preserved), maken → stem "maak" (long a preserved)
 */
function getStem(inf: string): string {
  // Remove -en ending
  let stem: string;
  if (inf.endsWith('ien')) {
    // zien → zie (not zi)
    stem = inf.slice(0, -2) + 'e';
    // but we handle this in irregulars, so just strip -en
    stem = inf.slice(0, -2);
  } else if (inf.endsWith('en')) {
    stem = inf.slice(0, -2);
  } else if (inf.endsWith('n')) {
    stem = inf.slice(0, -1);
  } else {
    return inf;
  }

  // Apply Dutch spelling rules for stems:

  // Double vowel preservation: if stem has single vowel + single consonant,
  // and infinitive had the vowel in an open syllable, double the vowel.
  // Pattern: CVC where V was long in infinitive → CVVC
  // e.g., lo-pen → stem needs "loop" (the 'o' was long/open)
  // e.g., ma-ken → stem needs "maak"
  // e.g., le-ven → stem needs "leev" → then v→f = "leef"
  // e.g., re-zen → stem needs "reiz" → then z→s = "reis" – wait, reizen → reiz → reis

  // Detect: if infinitive minus -en gives a stem like CVC where the vowel was in open syllable
  // An open syllable = the vowel is followed by a single consonant + vowel (the -en)
  // So the pattern is: ...V C en  where V is a single vowel
  // We need to double that vowel to keep it long in the closed stem.

  // Match single vowel followed by single consonant at end of stem
  // But NOT double consonants, NOT double vowels already
  const singleVowelPattern = /^(.*?)([aeiou])([^aeiou])$/;
  const match = stem.match(singleVowelPattern);
  if (match) {
    const [, prefix, vowel, consonant] = match;
    // Check the vowel isn't already doubled and the consonant isn't doubled in infinitive
    // Only double if the infinitive had open syllable (single consonant before -en)
    const beforeEn = inf.slice(0, -2);
    if (beforeEn === stem && !prefix.endsWith(vowel)) {
      // The vowel was in an open syllable, double it
      stem = prefix + vowel + vowel + consonant;
    }
  }

  // Handle doubled consonants: if stem ends in double consonant, reduce to single
  // e.g., werken → werk (already fine), but rennen → renn → ren? No, rennen → ren in stem
  // Actually: pakken → pak, zitten → zit, liggen → lig
  if (/([^aeiou])\1$/.test(stem)) {
    stem = stem.slice(0, -1);
  }

  // v → f at end of stem
  if (stem.endsWith('v')) {
    stem = stem.slice(0, -1) + 'f';
  }

  // z → s at end of stem
  if (stem.endsWith('z')) {
    stem = stem.slice(0, -1) + 's';
  }

  return stem;
}

// ── Irregular verb data ─────────────────────────────────────
interface IrregularData {
  present?: Forms;               // full present override
  pastSg: string;                // past tense singular stem (ik/jij/hij)
  pastPl: string;                // past tense plural stem (wij/jullie/zij)
  pastParticiple: string;        // voltooid deelwoord
  auxiliary: 'hebben' | 'zijn';  // auxiliary in perfect tense
}

const IRREGULARS: Record<string, IrregularData> = {
  // ─── Essential: zijn, hebben, worden, zullen ───
  zijn: {
    present: f('ben,bent,is,zijn,zijn,zijn'),
    pastSg: 'was',
    pastPl: 'waren',
    pastParticiple: 'geweest',
    auxiliary: 'zijn',
  },
  hebben: {
    present: f('heb,hebt,heeft,hebben,hebben,hebben'),
    pastSg: 'had',
    pastPl: 'hadden',
    pastParticiple: 'gehad',
    auxiliary: 'hebben',
  },
  worden: {
    present: f('word,wordt,wordt,worden,worden,worden'),
    pastSg: 'werd',
    pastPl: 'werden',
    pastParticiple: 'geworden',
    auxiliary: 'zijn',
  },
  zullen: {
    present: f('zal,zult,zal,zullen,zullen,zullen'),
    pastSg: 'zou',
    pastPl: 'zouden',
    pastParticiple: '-',
    auxiliary: 'hebben',
  },

  // ─── Modal verbs ───
  kunnen: {
    present: f('kan,kunt,kan,kunnen,kunnen,kunnen'),
    pastSg: 'kon',
    pastPl: 'konden',
    pastParticiple: 'gekund',
    auxiliary: 'hebben',
  },
  moeten: {
    present: f('moet,moet,moet,moeten,moeten,moeten'),
    pastSg: 'moest',
    pastPl: 'moesten',
    pastParticiple: 'gemoeten',
    auxiliary: 'hebben',
  },
  mogen: {
    present: f('mag,mag,mag,mogen,mogen,mogen'),
    pastSg: 'mocht',
    pastPl: 'mochten',
    pastParticiple: 'gemogen',
    auxiliary: 'hebben',
  },
  willen: {
    present: f('wil,wilt,wil,willen,willen,willen'),
    pastSg: 'wilde',
    pastPl: 'wilden',
    pastParticiple: 'gewild',
    auxiliary: 'hebben',
  },

  // ─── Strong verbs ───
  zien: {
    present: f('zie,ziet,ziet,zien,zien,zien'),
    pastSg: 'zag',
    pastPl: 'zagen',
    pastParticiple: 'gezien',
    auxiliary: 'hebben',
  },
  gaan: {
    present: f('ga,gaat,gaat,gaan,gaan,gaan'),
    pastSg: 'ging',
    pastPl: 'gingen',
    pastParticiple: 'gegaan',
    auxiliary: 'zijn',
  },
  staan: {
    present: f('sta,staat,staat,staan,staan,staan'),
    pastSg: 'stond',
    pastPl: 'stonden',
    pastParticiple: 'gestaan',
    auxiliary: 'hebben',
  },
  doen: {
    present: f('doe,doet,doet,doen,doen,doen'),
    pastSg: 'deed',
    pastPl: 'deden',
    pastParticiple: 'gedaan',
    auxiliary: 'hebben',
  },
  komen: {
    present: f('kom,komt,komt,komen,komen,komen'),
    pastSg: 'kwam',
    pastPl: 'kwamen',
    pastParticiple: 'gekomen',
    auxiliary: 'zijn',
  },
  geven: {
    present: f('geef,geeft,geeft,geven,geven,geven'),
    pastSg: 'gaf',
    pastPl: 'gaven',
    pastParticiple: 'gegeven',
    auxiliary: 'hebben',
  },
  nemen: {
    present: f('neem,neemt,neemt,nemen,nemen,nemen'),
    pastSg: 'nam',
    pastPl: 'namen',
    pastParticiple: 'genomen',
    auxiliary: 'hebben',
  },
  lopen: {
    present: f('loop,loopt,loopt,lopen,lopen,lopen'),
    pastSg: 'liep',
    pastPl: 'liepen',
    pastParticiple: 'gelopen',
    auxiliary: 'zijn',
  },
  rijden: {
    present: f('rijd,rijdt,rijdt,rijden,rijden,rijden'),
    pastSg: 'reed',
    pastPl: 'reden',
    pastParticiple: 'gereden',
    auxiliary: 'zijn',
  },
  schrijven: {
    present: f('schrijf,schrijft,schrijft,schrijven,schrijven,schrijven'),
    pastSg: 'schreef',
    pastPl: 'schreven',
    pastParticiple: 'geschreven',
    auxiliary: 'hebben',
  },
  lezen: {
    present: f('lees,leest,leest,lezen,lezen,lezen'),
    pastSg: 'las',
    pastPl: 'lazen',
    pastParticiple: 'gelezen',
    auxiliary: 'hebben',
  },
  spreken: {
    present: f('spreek,spreekt,spreekt,spreken,spreken,spreken'),
    pastSg: 'sprak',
    pastPl: 'spraken',
    pastParticiple: 'gesproken',
    auxiliary: 'hebben',
  },
  eten: {
    present: f('eet,eet,eet,eten,eten,eten'),
    pastSg: 'at',
    pastPl: 'aten',
    pastParticiple: 'gegeten',
    auxiliary: 'hebben',
  },
  drinken: {
    present: f('drink,drinkt,drinkt,drinken,drinken,drinken'),
    pastSg: 'dronk',
    pastPl: 'dronken',
    pastParticiple: 'gedronken',
    auxiliary: 'hebben',
  },
  slapen: {
    present: f('slaap,slaapt,slaapt,slapen,slapen,slapen'),
    pastSg: 'sliep',
    pastPl: 'sliepen',
    pastParticiple: 'geslapen',
    auxiliary: 'hebben',
  },
  vinden: {
    present: f('vind,vindt,vindt,vinden,vinden,vinden'),
    pastSg: 'vond',
    pastPl: 'vonden',
    pastParticiple: 'gevonden',
    auxiliary: 'hebben',
  },
  denken: {
    present: f('denk,denkt,denkt,denken,denken,denken'),
    pastSg: 'dacht',
    pastPl: 'dachten',
    pastParticiple: 'gedacht',
    auxiliary: 'hebben',
  },
  weten: {
    present: f('weet,weet,weet,weten,weten,weten'),
    pastSg: 'wist',
    pastPl: 'wisten',
    pastParticiple: 'geweten',
    auxiliary: 'hebben',
  },
  brengen: {
    present: f('breng,brengt,brengt,brengen,brengen,brengen'),
    pastSg: 'bracht',
    pastPl: 'brachten',
    pastParticiple: 'gebracht',
    auxiliary: 'hebben',
  },
  kopen: {
    present: f('koop,koopt,koopt,kopen,kopen,kopen'),
    pastSg: 'kocht',
    pastPl: 'kochten',
    pastParticiple: 'gekocht',
    auxiliary: 'hebben',
  },
  zoeken: {
    present: f('zoek,zoekt,zoekt,zoeken,zoeken,zoeken'),
    pastSg: 'zocht',
    pastPl: 'zochten',
    pastParticiple: 'gezocht',
    auxiliary: 'hebben',
  },
  vragen: {
    present: f('vraag,vraagt,vraagt,vragen,vragen,vragen'),
    pastSg: 'vroeg',
    pastPl: 'vroegen',
    pastParticiple: 'gevraagd',
    auxiliary: 'hebben',
  },
  zeggen: {
    present: f('zeg,zegt,zegt,zeggen,zeggen,zeggen'),
    pastSg: 'zei',
    pastPl: 'zeiden',
    pastParticiple: 'gezegd',
    auxiliary: 'hebben',
  },
  zitten: {
    present: f('zit,zit,zit,zitten,zitten,zitten'),
    pastSg: 'zat',
    pastPl: 'zaten',
    pastParticiple: 'gezeten',
    auxiliary: 'hebben',
  },
  liggen: {
    present: f('lig,ligt,ligt,liggen,liggen,liggen'),
    pastSg: 'lag',
    pastPl: 'lagen',
    pastParticiple: 'gelegen',
    auxiliary: 'hebben',
  },
  houden: {
    present: f('houd,houdt,houdt,houden,houden,houden'),
    pastSg: 'hield',
    pastPl: 'hielden',
    pastParticiple: 'gehouden',
    auxiliary: 'hebben',
  },
  laten: {
    present: f('laat,laat,laat,laten,laten,laten'),
    pastSg: 'liet',
    pastPl: 'lieten',
    pastParticiple: 'gelaten',
    auxiliary: 'hebben',
  },
  beginnen: {
    present: f('begin,begint,begint,beginnen,beginnen,beginnen'),
    pastSg: 'begon',
    pastPl: 'begonnen',
    pastParticiple: 'begonnen',
    auxiliary: 'zijn',
  },
  vergeten: {
    present: f('vergeet,vergeet,vergeet,vergeten,vergeten,vergeten'),
    pastSg: 'vergat',
    pastPl: 'vergaten',
    pastParticiple: 'vergeten',
    auxiliary: 'zijn',
  },
  vallen: {
    present: f('val,valt,valt,vallen,vallen,vallen'),
    pastSg: 'viel',
    pastPl: 'vielen',
    pastParticiple: 'gevallen',
    auxiliary: 'zijn',
  },
  sterven: {
    present: f('sterf,sterft,sterft,sterven,sterven,sterven'),
    pastSg: 'stierf',
    pastPl: 'stierven',
    pastParticiple: 'gestorven',
    auxiliary: 'zijn',
  },
  helpen: {
    present: f('help,helpt,helpt,helpen,helpen,helpen'),
    pastSg: 'hielp',
    pastPl: 'hielpen',
    pastParticiple: 'geholpen',
    auxiliary: 'hebben',
  },
  trekken: {
    present: f('trek,trekt,trekt,trekken,trekken,trekken'),
    pastSg: 'trok',
    pastPl: 'trokken',
    pastParticiple: 'getrokken',
    auxiliary: 'hebben',
  },
  breken: {
    present: f('breek,breekt,breekt,breken,breken,breken'),
    pastSg: 'brak',
    pastPl: 'braken',
    pastParticiple: 'gebroken',
    auxiliary: 'hebben',
  },
  stelen: {
    present: f('steel,steelt,steelt,stelen,stelen,stelen'),
    pastSg: 'stal',
    pastPl: 'stalen',
    pastParticiple: 'gestolen',
    auxiliary: 'hebben',
  },
  kiezen: {
    present: f('kies,kiest,kiest,kiezen,kiezen,kiezen'),
    pastSg: 'koos',
    pastPl: 'kozen',
    pastParticiple: 'gekozen',
    auxiliary: 'hebben',
  },
  sluiten: {
    present: f('sluit,sluit,sluit,sluiten,sluiten,sluiten'),
    pastSg: 'sloot',
    pastPl: 'sloten',
    pastParticiple: 'gesloten',
    auxiliary: 'hebben',
  },
  kruipen: {
    present: f('kruip,kruipt,kruipt,kruipen,kruipen,kruipen'),
    pastSg: 'kroop',
    pastPl: 'kropen',
    pastParticiple: 'gekropen',
    auxiliary: 'zijn',
  },
  bieden: {
    present: f('bied,biedt,biedt,bieden,bieden,bieden'),
    pastSg: 'bood',
    pastPl: 'boden',
    pastParticiple: 'geboden',
    auxiliary: 'hebben',
  },
  verbieden: {
    present: f('verbied,verbiedt,verbiedt,verbieden,verbieden,verbieden'),
    pastSg: 'verbood',
    pastPl: 'verboden',
    pastParticiple: 'verboden',
    auxiliary: 'hebben',
  },
  winnen: {
    present: f('win,wint,wint,winnen,winnen,winnen'),
    pastSg: 'won',
    pastPl: 'wonnen',
    pastParticiple: 'gewonnen',
    auxiliary: 'hebben',
  },
  zwemmen: {
    present: f('zwem,zwemt,zwemt,zwemmen,zwemmen,zwemmen'),
    pastSg: 'zwom',
    pastPl: 'zwommen',
    pastParticiple: 'gezwommen',
    auxiliary: 'hebben',
  },
  zingen: {
    present: f('zing,zingt,zingt,zingen,zingen,zingen'),
    pastSg: 'zong',
    pastPl: 'zongen',
    pastParticiple: 'gezongen',
    auxiliary: 'hebben',
  },
  vliegen: {
    present: f('vlieg,vliegt,vliegt,vliegen,vliegen,vliegen'),
    pastSg: 'vloog',
    pastPl: 'vlogen',
    pastParticiple: 'gevlogen',
    auxiliary: 'zijn',
  },
  schieten: {
    present: f('schiet,schiet,schiet,schieten,schieten,schieten'),
    pastSg: 'schoot',
    pastPl: 'schoten',
    pastParticiple: 'geschoten',
    auxiliary: 'hebben',
  },
  gieten: {
    present: f('giet,giet,giet,gieten,gieten,gieten'),
    pastSg: 'goot',
    pastPl: 'goten',
    pastParticiple: 'gegoten',
    auxiliary: 'hebben',
  },
  bijten: {
    present: f('bijt,bijt,bijt,bijten,bijten,bijten'),
    pastSg: 'beet',
    pastPl: 'beten',
    pastParticiple: 'gebeten',
    auxiliary: 'hebben',
  },
  glijden: {
    present: f('glijd,glijdt,glijdt,glijden,glijden,glijden'),
    pastSg: 'gleed',
    pastPl: 'gleden',
    pastParticiple: 'gegleden',
    auxiliary: 'zijn',
  },
  roepen: {
    present: f('roep,roept,roept,roepen,roepen,roepen'),
    pastSg: 'riep',
    pastPl: 'riepen',
    pastParticiple: 'geroepen',
    auxiliary: 'hebben',
  },
  hangen: {
    present: f('hang,hangt,hangt,hangen,hangen,hangen'),
    pastSg: 'hing',
    pastPl: 'hingen',
    pastParticiple: 'gehangen',
    auxiliary: 'hebben',
  },
  vangen: {
    present: f('vang,vangt,vangt,vangen,vangen,vangen'),
    pastSg: 'ving',
    pastPl: 'vingen',
    pastParticiple: 'gevangen',
    auxiliary: 'hebben',
  },

  // ─── Mixed / irregular weak verbs ───
  lachen: {
    present: f('lach,lacht,lacht,lachen,lachen,lachen'),
    pastSg: 'lachte',
    pastPl: 'lachten',
    pastParticiple: 'gelachen',
    auxiliary: 'hebben',
  },
  wassen: {
    present: f('was,wast,wast,wassen,wassen,wassen'),
    pastSg: 'waste',
    pastPl: 'wasten',
    pastParticiple: 'gewassen',
    auxiliary: 'hebben',
  },
  bakken: {
    present: f('bak,bakt,bakt,bakken,bakken,bakken'),
    pastSg: 'bakte',
    pastPl: 'bakten',
    pastParticiple: 'gebakken',
    auxiliary: 'hebben',
  },
  groeien: {
    present: f('groei,groeit,groeit,groeien,groeien,groeien'),
    pastSg: 'groeide',
    pastPl: 'groeiden',
    pastParticiple: 'gegroeid',
    auxiliary: 'zijn',
  },
  bouwen: {
    present: f('bouw,bouwt,bouwt,bouwen,bouwen,bouwen'),
    pastSg: 'bouwde',
    pastPl: 'bouwden',
    pastParticiple: 'gebouwd',
    auxiliary: 'hebben',
  },
  ontmoeten: {
    present: f('ontmoet,ontmoet,ontmoet,ontmoeten,ontmoeten,ontmoeten'),
    pastSg: 'ontmoette',
    pastPl: 'ontmoetten',
    pastParticiple: 'ontmoet',
    auxiliary: 'hebben',
  },

  // ─── Additional common strong/irregular verbs ───
  blijven: {
    present: f('blijf,blijft,blijft,blijven,blijven,blijven'),
    pastSg: 'bleef',
    pastPl: 'bleven',
    pastParticiple: 'gebleven',
    auxiliary: 'zijn',
  },
  vertrekken: {
    present: f('vertrek,vertrekt,vertrekt,vertrekken,vertrekken,vertrekken'),
    pastSg: 'vertrok',
    pastPl: 'vertrokken',
    pastParticiple: 'vertrokken',
    auxiliary: 'zijn',
  },
  verschijnen: {
    present: f('verschijn,verschijnt,verschijnt,verschijnen,verschijnen,verschijnen'),
    pastSg: 'verscheen',
    pastPl: 'verschenen',
    pastParticiple: 'verschenen',
    auxiliary: 'zijn',
  },
  bestaan: {
    present: f('besta,bestaat,bestaat,bestaan,bestaan,bestaan'),
    pastSg: 'bestond',
    pastPl: 'bestonden',
    pastParticiple: 'bestaan',
    auxiliary: 'hebben',
  },
  verstaan: {
    present: f('versta,verstaat,verstaat,verstaan,verstaan,verstaan'),
    pastSg: 'verstond',
    pastPl: 'verstonden',
    pastParticiple: 'verstaan',
    auxiliary: 'hebben',
  },
  begrijpen: {
    present: f('begrijp,begrijpt,begrijpt,begrijpen,begrijpen,begrijpen'),
    pastSg: 'begreep',
    pastPl: 'begrepen',
    pastParticiple: 'begrepen',
    auxiliary: 'hebben',
  },
  besluiten: {
    present: f('besluit,besluit,besluit,besluiten,besluiten,besluiten'),
    pastSg: 'besloot',
    pastPl: 'besloten',
    pastParticiple: 'besloten',
    auxiliary: 'hebben',
  },
  verdwijnen: {
    present: f('verdwijn,verdwijnt,verdwijnt,verdwijnen,verdwijnen,verdwijnen'),
    pastSg: 'verdween',
    pastPl: 'verdwenen',
    pastParticiple: 'verdwenen',
    auxiliary: 'zijn',
  },
  bezoeken: {
    present: f('bezoek,bezoekt,bezoekt,bezoeken,bezoeken,bezoeken'),
    pastSg: 'bezocht',
    pastPl: 'bezochten',
    pastParticiple: 'bezocht',
    auxiliary: 'hebben',
  },
  vergelijken: {
    present: f('vergelijk,vergelijkt,vergelijkt,vergelijken,vergelijken,vergelijken'),
    pastSg: 'vergeleek',
    pastPl: 'vergeleken',
    pastParticiple: 'vergeleken',
    auxiliary: 'hebben',
  },
};

// ── Zijn-verbs: use "zijn" as auxiliary in Perfectum ─────────
const ZIJN_VERBS = new Set([
  'zijn', 'worden', 'gaan', 'komen', 'lopen', 'rijden', 'vliegen',
  'vallen', 'sterven', 'groeien', 'blijven', 'verschijnen', 'vertrekken',
  'beginnen', 'vergeten', 'kruipen', 'glijden', 'verdwijnen',
]);

// ── Regular present tense ───────────────────────────────────
function conjugateRegularPresent(stem: string, inf: string): Forms {
  return [
    stem,                // ik
    stem + 't',          // jij
    stem + 't',          // hij/zij
    inf,                 // wij
    inf,                 // jullie
    inf,                 // zij
  ] as Forms;
}

// ── Regular past tense (imperfectum) ────────────────────────
function conjugateRegularPast(stem: string): Forms {
  const suffix = isKofschip(stem) ? 'te' : 'de';
  const suffixPl = isKofschip(stem) ? 'ten' : 'den';
  return [
    stem + suffix,       // ik
    stem + suffix,       // jij
    stem + suffix,       // hij/zij
    stem + suffixPl,     // wij
    stem + suffixPl,     // jullie
    stem + suffixPl,     // zij
  ] as Forms;
}

// ── Regular past participle ─────────────────────────────────
function buildPastParticiple(inf: string, stem: string, isInseparable: boolean): string {
  const prefix = isInseparable ? '' : 'ge';
  const suffix = isKofschip(stem) ? 't' : 'd';
  return prefix + stem + suffix;
}

// ── Build full conjugation for a base verb ──────────────────
function conjugateBase(
  inf: string,
  isInseparable: boolean,
): Record<TenseKey, Forms> | null {
  const stem = getStem(inf);
  const irrData = IRREGULARS[inf];

  // ── Present ───
  let present: Forms;
  if (irrData?.present) {
    present = irrData.present;
  } else {
    present = conjugateRegularPresent(stem, inf);
  }

  // ── Preterite (Imperfectum) ───
  let preterite: Forms;
  if (irrData) {
    preterite = [
      irrData.pastSg,
      irrData.pastSg,
      irrData.pastSg,
      irrData.pastPl,
      irrData.pastPl,
      irrData.pastPl,
    ] as Forms;
  } else {
    preterite = conjugateRegularPast(stem);
  }

  // ── Past participle (for Perfectum) ───
  let pastParticiple: string;
  if (irrData) {
    pastParticiple = irrData.pastParticiple;
  } else {
    pastParticiple = buildPastParticiple(inf, stem, isInseparable);
  }

  // ── Determine auxiliary ───
  let auxiliary: 'hebben' | 'zijn' = 'hebben';
  if (irrData?.auxiliary) {
    auxiliary = irrData.auxiliary;
  } else if (ZIJN_VERBS.has(inf)) {
    auxiliary = 'zijn';
  }

  // ── Perfectum (mapped to 'imperfect' tense key) ───
  const auxForms = auxiliary === 'zijn' ? ZIJN_PRESENT : HEBBEN_PRESENT;
  const imperfect: Forms = auxForms.map(a => a + ' ' + pastParticiple) as Forms;

  // ── Futurum (future) ───
  const future: Forms = ZULLEN_PRESENT.map(z => z + ' ' + inf) as Forms;

  // ── Conditionalis (conditional) ───
  const conditional: Forms = ZOU_FORMS.map(z => z + ' ' + inf) as Forms;

  // ── Aanvoegende wijs (subjunctive) – same as present in modern Dutch ───
  const subjunctive: Forms = [...present] as Forms;

  return { present, preterite, imperfect, future, conditional, subjunctive };
}

// ── Reverse lookup: form → infinitive ───────────────────────
// Built once at module init: every known irregular form (all present
// persons, past sg/pl, past participle, the infinitive itself) maps back
// to its infinitive so tapping a conjugated form routes to the right table.
const IRREGULAR_REVERSE = new Map<string, string>();
for (const [inf, data] of Object.entries(IRREGULARS)) {
  const forms: string[] = [inf, data.pastSg, data.pastPl, data.pastParticiple];
  if (data.present) forms.push(...data.present);
  for (const fo of forms) {
    if (fo && fo !== '-' && !IRREGULAR_REVERSE.has(fo)) IRREGULAR_REVERSE.set(fo, inf);
  }
}

/**
 * Is this candidate a real Dutch verb lemma? Accept irregular-table entries
 * and dictionary entries marked pos 'v' (or glossed "to ..."). The dict's
 * fuzzy lookup can resolve a fake spelling to a real entry, so when the
 * matched entry carries a `lemma` it must equal the candidate itself.
 */
function isVerbLemma(candidate: string): boolean {
  if (IRREGULARS[candidate]) return true;
  const e = lookupWord(candidate);
  if (!e) return false;
  if (e.lemma && e.lemma !== candidate) return false;
  // Require the infinitive-style "to …" gloss: the dict's fuzzy fallbacks
  // (suffix stripping, compound splitting) can resolve fake spellings to
  // form-level entries, which are glossed "goes"/"made", not "to go".
  return e.pos === 'v' && e.en.startsWith('to ');
}

// Prefixes recognised when REVERSING separable forms. Superset of the
// engine's SEPARABLE_PREFIXES, which stays untouched (conjugate()
// behavior unchanged).
const REVERSE_PREFIXES = [
  ...SEPARABLE_PREFIXES,
  'binnen', 'thuis', 'open', 'schoon', 'langs', 'rond', 'neer', 'vast',
  'tegen', 'goed', 'verder', 'voorbij',
].sort((a, b) => b.length - a.length);

/**
 * Given a bare verb stem (as produced by Dutch spelling: maak, zit, werk,
 * leef, reis…), generate infinitive candidates in likelihood order.
 * Dutch open/closed-syllable spelling means the reverse mapping is not
 * unique, so callers validate candidates against the dictionary.
 */
function stemCandidates(stem: string): string[] {
  const cands: string[] = [];
  if (!stem || stem.length < 2) return cands;

  // Stem ends in a long vowel (ga → gaan, zie → zien, doe → doen)
  if (/(?:aa|ee|oo|uu|ie|oe)$/.test(stem)) {
    cands.push(stem + 'n');
    return cands;
  }

  // Doubled vowel + single consonant: closed syllable opens up again.
  // maak → maken, loop → lopen; with f/v & s/z alternation:
  // leef → leven, lees → lezen.
  const dv = stem.match(/^(.*)(aa|ee|oo|uu)([bcdfghjklmnpqrstvwxz])$/);
  if (dv) {
    const [, pre, vv, c] = dv;
    const open = pre + vv[0];
    if (c === 'f') {
      cands.push(open + 'ven', open + 'fen');
    } else if (c === 's') {
      cands.push(open + 'zen', open + 'sen');
    } else {
      cands.push(open + c + 'en');
    }
    // NOTE: no `stem + 'en'` fallback here — a double vowel in an open
    // syllable (maaken, informeeren) is never valid modern Dutch spelling.
    return cands;
  }

  // Final syllable -el/-er/-em/-en after a consonant: usually unstressed
  // (wandel → wandelen, luister → luisteren — no doubling), but stressed
  // monosyllable-final stems double (bel → bellen), so offer both.
  if (/[^aeiou]e[lrmn]$/.test(stem)) {
    cands.push(stem + 'en');
    cands.push(stem + stem[stem.length - 1] + 'en');
    return cands;
  }

  // Diphthong / vowel cluster + f/s: f→v, s→z is common but not universal.
  // reis → reizen, blijf → blijven; but eis → eisen.
  const fs = stem.match(/^(.*(?:[aeiou]{2}|ij))([fs])$/);
  if (fs) {
    const [, pre, c] = fs;
    cands.push(pre + (c === 'f' ? 'v' : 'z') + 'en');
    cands.push(stem + 'en');
    return cands;
  }

  // Single vowel + single final consonant: closed short syllable doubles
  // the consonant in the infinitive. zit → zitten, stop → stoppen.
  const sv = stem.match(/(?:^|[^aeiou])[aeiou]([bcdfgklmnprstz])$/);
  if (sv) {
    cands.push(stem + sv[1] + 'en');
    cands.push(stem + 'en');
    return cands;
  }

  // Vowel-final stems: only glide endings (-aai/-ooi/-oei) take -en
  // (naai → naaien, gooi → gooien); anything else (omva, spoelde) is not
  // a possible Dutch verb stem — emit nothing rather than fake lemmas.
  if (/[aeiou]$/.test(stem)) {
    if (/[aeiou]{2}i$/.test(stem)) cands.push(stem + 'en');
    return cands;
  }

  // Consonant cluster endings: werk → werken, wacht → wachten;
  // cluster + f often hides a v (durf → durven), cluster + s usually stays.
  if (stem.endsWith('f')) cands.push(stem.slice(0, -1) + 'ven');
  cands.push(stem + 'en');
  if (stem.endsWith('s')) cands.push(stem.slice(0, -1) + 'zen');
  return cands;
}

/** Does conjugate(lemma)'s table contain the form (single words of multi-word rows count)? */
function tableHasForm(lemma: string, form: string): boolean {
  if (lemma === form) return true;
  const table = conjugate(lemma);
  if (!table) return false;
  for (const forms of Object.values(table.tenses)) {
    for (const fo of forms) {
      const lf = fo.toLowerCase();
      if (lf === form) return true;
      if (lf.includes(' ')) {
        const words = lf.split(/\s+/);
        if (words.includes(form)) return true;
        // Separable verbs are tabled in main-clause order ("gaat weg");
        // subclause order joins them ("weggaat").
        if (words.length === 2 && words[1] + words[0] === form) return true;
      }
    }
  }
  return false;
}

/** Deferred fallbacks accumulated while unwinding. */
interface ResolveOut {
  dictOnly: string[]; // dict-validated lemmas whose table lacks the form
  guesses: string[];  // unvalidated spelling-rule guesses
}

/**
 * Try stem candidates against the ORIGINAL form. Priority:
 *   1. dictionary-validated lemma whose table round-trips the form
 *   2. lemma whose table round-trips the form (spelling adjudicates itself)
 *   3. (deferred) dictionary-validated lemma — table may be incomplete
 *   4. (deferred) first spelling-rule guess
 */
function resolveStem(stem: string, original: string, out: ResolveOut): string | null {
  // Prefix + irregular present stem: terugkom → terug + kom → terugkomen.
  // Must run before spelling-rule doubling, which would guess "terugkommen".
  for (const p of REVERSE_PREFIXES) {
    if (stem.startsWith(p) && stem.length > p.length + 1) {
      const restIrr = IRREGULAR_REVERSE.get(stem.slice(p.length));
      if (restIrr) {
        const full = p + restIrr;
        if (isVerbLemma(full) || tableHasForm(full, original)) return full;
      }
    }
  }

  const cands = stemCandidates(stem);
  let roundtripOnly: string | null = null;
  let dictOnly: string | null = null;
  for (const c of cands) {
    const valid = isVerbLemma(c);
    const rt = tableHasForm(c, original);
    if (valid && rt) return c;
    if (rt && c !== original && !roundtripOnly) roundtripOnly = c;
    if (valid && !dictOnly) dictOnly = c;
  }
  if (roundtripOnly) return roundtripOnly;
  if (dictOnly) out.dictOnly.push(dictOnly);
  if (cands.length > 0) out.guesses.push(cands[0]);
  return null;
}

/**
 * Core suffix unwinding for a single word. Returns a confident lemma, or
 * null (accumulating fallbacks in `out`). ORDER MATTERS: longer/more
 * specific suffixes are tried before shorter ones, and whole-word readings
 * before prefix-stripped ones so inseparable ge- verbs (gebruiken,
 * geloven) beat the ge-participle reading.
 */
function unwind(w: string, out: ResolveOut): string | null {
  const irr = IRREGULAR_REVERSE.get(w);
  if (irr) return irr;

  // The word may already be an infinitive (wachten, maken, opstaan, doen)
  if (w.endsWith('n') && w.length >= 4 && isVerbLemma(w)) return w;

  // ── Other -en forms: past plural, strong participle ──
  if (w.endsWith('en') && w.length >= 4) {
    // Strong past participle: ge + infinitive-shaped (gelopen → lopen);
    // irregulars are caught above, this covers dict-known strong verbs.
    if (w.startsWith('ge') && w.length >= 6) {
      const rest = w.slice(2);
      if (isVerbLemma(rest) && tableHasForm(rest, w)) return rest;
    }
    // Weak past plural: werkten → werk → werken, maakten → maken
    if (w.endsWith('ten') || w.endsWith('den')) {
      const hit = resolveStem(w.slice(0, -3), w, out);
      if (hit) return hit;
    }
    // Generic: strip -en and re-derive (covers odd spellings)
    const hit = resolveStem(w.slice(0, -2), w, out);
    if (hit) return hit;
    out.guesses.push(w); // infinitive-shaped word is itself a decent guess
    return null;
  }

  // ── Present participle: -end / -ende (lachend → lachen) ──
  if (w.endsWith('ende') && w.length >= 7) {
    const hit = resolveStem(w.slice(0, -4), w, out);
    if (hit) return hit;
  }
  if (w.endsWith('end') && w.length >= 6) {
    const hit = resolveStem(w.slice(0, -3), w, out);
    if (hit) return hit;
  }

  // ── Weak past singular: -te / -de (maakte → maken, woonde → wonen) ──
  if ((w.endsWith('te') || w.endsWith('de')) && w.length >= 5) {
    const hit = resolveStem(w.slice(0, -2), w, out);
    if (hit) return hit;
  }

  // ── Present 2/3sg or weak participle: -t / -d ──
  if ((w.endsWith('t') || w.endsWith('d')) && w.length >= 4) {
    // ge- weak participle first, but only with full confidence (dict-valid
    // AND round-trip): gemaakt → maken. Inseparable ge- verbs (gebruikt →
    // gebruiken) fail this test and resolve as whole words below.
    if (w.startsWith('ge') && w.length >= 6) {
      for (const c of stemCandidates(w.slice(2, -1))) {
        if (isVerbLemma(c) && tableHasForm(c, w)) return c;
      }
    }
    const hit = resolveStem(w.slice(0, -1), w, out);
    if (hit) return hit;
    // ge- weak participle, lower confidence: gereisd → reizen
    if (w.startsWith('ge') && w.length >= 6) {
      const geHit = resolveStem(w.slice(2, -1), w, out);
      if (geHit) return geHit;
    }
  }

  // ── Bare stem: 1sg present / imperative (maak, werk, reis) ──
  return resolveStem(w, w, out);
}

/**
 * Find the infinitive (lemma) for a conjugated Dutch verb form, so tapping
 * any verb in a card resolves to a lemma whose conjugation table contains
 * that form. Irregular forms come from the reverse map; regular forms are
 * unwound by suffix + Dutch spelling rules; candidates are validated
 * against the dictionary and by round-tripping through conjugate() so
 * spelling-rule guesses don't produce fake lemmas.
 */
export function findInfinitive(form: string): string | null {
  if (!form) return null;
  const w = form.toLowerCase().trim();
  if (!w || w.length < 2 || !/^[a-zäëïöüé]+$/.test(w)) return null;

  const out: ResolveOut = { dictOnly: [], guesses: [] };
  const direct = unwind(w, out);
  if (direct) return direct;

  // ── Separable-prefix forms: opgestaan → op + gestaan → opstaan,
  //    weggaat → weggaan, aankomt → aankomen, opbelde → opbellen ──
  for (const p of REVERSE_PREFIXES) {
    if (!w.startsWith(p) || w.length < p.length + 3) continue;
    const rest = w.slice(p.length);
    const subOut: ResolveOut = { dictOnly: [], guesses: [] };
    const confident = unwind(rest, subOut);
    const restInf = confident ?? subOut.dictOnly[0] ?? subOut.guesses[0] ?? null;
    if (!restInf) continue;
    const full = p + restInf;
    // Accept when the recombined verb is a real dictionary verb, its table
    // round-trips the form, the remainder resolved confidently (irregular
    // form, participle, or round-tripping stem), or the remainder is an
    // unmistakable irregular participle (opgestaan: ge- + irregular).
    if (
      isVerbLemma(full) ||
      tableHasForm(full, w) ||
      confident !== null ||
      (rest.startsWith('ge') && IRREGULAR_REVERSE.has(rest)) ||
      IRREGULARS[restInf]
    ) {
      return full;
    }
  }

  // ── Fall back: dictionary-validated lemma (table may be incomplete),
  //    then the best unvalidated spelling-rule guess ──
  return out.dictOnly[0] ?? out.guesses[0] ?? null;
}

// ── Main conjugation function ───────────────────────────────
export function conjugate(infinitive: string): ConjugationTable | null {
  if (!infinitive) return null;
  const raw = infinitive.trim().toLowerCase();
  if (!raw) return null;

  const inf = raw;

  // ── Detect separable prefix ───
  const sepPrefix = detectSeparablePrefix(inf);
  const isInseparable = !sepPrefix && hasInseparablePrefix(inf);
  const baseVerb = sepPrefix ? inf.slice(sepPrefix.length) : inf;

  // Validate it looks like a Dutch verb
  if (
    !baseVerb.endsWith('en') &&
    !baseVerb.endsWith('n') &&
    baseVerb !== 'doen' &&
    baseVerb !== 'gaan' &&
    baseVerb !== 'staan' &&
    baseVerb !== 'zien' &&
    baseVerb !== 'slaan'
  ) {
    return null;
  }

  // ── Check if the full verb has an irregular entry first ───
  if (IRREGULARS[inf]) {
    const baseTenses = conjugateBase(inf, isInseparable);
    if (!baseTenses) return null;

    // Remap tense keys to localized labels
    const labeledTenses: Record<string, string[]> = {};
    for (const t of TENSES) {
      labeledTenses[TENSE_LABELS[t]] = [...baseTenses[t]];
    }

    return {
      infinitive: raw,
      isReflexive: false,
      tenses: labeledTenses,
    };
  }

  // ── Conjugate the base verb ───
  const baseTenses = conjugateBase(baseVerb, isInseparable);
  if (!baseTenses) return null;

  // ── Determine auxiliary for the full verb ───
  const irrData = IRREGULARS[baseVerb];
  let auxiliary: 'hebben' | 'zijn' = irrData?.auxiliary || 'hebben';
  if (ZIJN_VERBS.has(inf) || ZIJN_VERBS.has(baseVerb)) auxiliary = 'zijn';

  // ── Apply separable prefix transformations ───
  const finalTenses: Record<string, string[]> = {};

  for (const t of TENSES) {
    let forms = baseTenses[t];

    if (sepPrefix) {
      if (t === 'present') {
        // Prefix separates: "ik bel op"
        forms = forms.map(form => form + ' ' + sepPrefix) as Forms;
      } else if (t === 'preterite') {
        // Prefix separates: "ik belde op"
        forms = forms.map(form => form + ' ' + sepPrefix) as Forms;
      } else if (t === 'imperfect') {
        // Perfectum: ge- goes between prefix and base participle
        let pp: string;
        if (irrData) {
          pp = irrData.pastParticiple;
        } else {
          const baseStem = getStem(baseVerb);
          pp = buildPastParticiple(baseVerb, baseStem, false);
        }
        // For separable: prefix + participle (which has ge-)
        const sepPP = sepPrefix + pp;
        const auxForms = auxiliary === 'zijn' ? ZIJN_PRESENT : HEBBEN_PRESENT;
        forms = auxForms.map(a => a + ' ' + sepPP) as Forms;
      } else if (t === 'future') {
        // Future: "zal opbellen" – prefix stays with infinitive
        forms = ZULLEN_PRESENT.map(z => z + ' ' + inf) as Forms;
      } else if (t === 'conditional') {
        // Conditional: "zou opbellen"
        forms = ZOU_FORMS.map(z => z + ' ' + inf) as Forms;
      } else if (t === 'subjunctive') {
        // Same as present with prefix separated
        forms = baseTenses.present.map(form => form + ' ' + sepPrefix) as Forms;
      }
    } else if (isInseparable) {
      if (t === 'present') {
        // Conjugate the whole verb directly
        const fullStem = getStem(inf);
        if (irrData?.present) {
          forms = irrData.present;
        } else {
          forms = conjugateRegularPresent(fullStem, inf);
        }
      } else if (t === 'preterite') {
        if (irrData) {
          forms = [
            irrData.pastSg, irrData.pastSg, irrData.pastSg,
            irrData.pastPl, irrData.pastPl, irrData.pastPl,
          ] as Forms;
        } else {
          const fullStem = getStem(inf);
          forms = conjugateRegularPast(fullStem);
        }
      } else if (t === 'imperfect') {
        let pp: string;
        if (irrData) {
          pp = irrData.pastParticiple;
        } else {
          const fullStem = getStem(inf);
          pp = buildPastParticiple(inf, fullStem, true);
        }
        const auxForms = auxiliary === 'zijn' ? ZIJN_PRESENT : HEBBEN_PRESENT;
        forms = auxForms.map(a => a + ' ' + pp) as Forms;
      } else if (t === 'future') {
        forms = ZULLEN_PRESENT.map(z => z + ' ' + inf) as Forms;
      } else if (t === 'conditional') {
        forms = ZOU_FORMS.map(z => z + ' ' + inf) as Forms;
      } else if (t === 'subjunctive') {
        const fullStem = getStem(inf);
        if (irrData?.present) {
          forms = irrData.present;
        } else {
          forms = conjugateRegularPresent(fullStem, inf);
        }
      }
    }

    finalTenses[TENSE_LABELS[t]] = [...forms];
  }

  return {
    infinitive: raw,
    isReflexive: false,
    tenses: finalTenses,
  };
}
