/**
 * Dutch verb conjugation engine
 * Handles regular weak verbs, strong verbs, mixed verbs, separable-prefix,
 * inseparable-prefix verbs. Covers 60+ irregular verbs with full conjugation data.
 *
 * Person order: ik, jij, hij/zij, wij, jullie, zij
 *
 * Tenses:
 *   present     — Presens
 *   preterite   — Imperfectum (simple past)
 *   imperfect   — Perfectum (compound past: hebben/zijn + voltooid deelwoord)
 *   future      — Futurum (zullen + infinitive)
 *   conditional — Conditionalis (zou/zouden + infinitive)
 *   subjunctive — Aanv. wijs (aanvoegende wijs)
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
  'terug', 'samen', 'verder', 'achter',
  'op', 'af', 'aan', 'uit', 'mee', 'bij', 'door', 'over',
  'om', 'toe', 'weg', 'in', 'na', 'voor',
];
SEPARABLE_PREFIXES.sort((a, b) => b.length - a.length);

// Inseparable prefixes — never separate, no ge- in past participle
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
  // e.g., re-zen → stem needs "reiz" → then z→s = "reis" — wait, reizen → reiz → reis

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

  // ── Aanvoegende wijs (subjunctive) — same as present in modern Dutch ───
  const subjunctive: Forms = [...present] as Forms;

  return { present, preterite, imperfect, future, conditional, subjunctive };
}

// ── Main conjugation function ───────────────────────────────
export function conjugate(infinitive: string): ConjugationTable | null {
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

    return {
      infinitive: raw,
      isReflexive: false,
      tenses: baseTenses,
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
        // Future: "zal opbellen" — prefix stays with infinitive
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

    finalTenses[t] = [...forms];
  }

  return {
    infinitive: raw,
    isReflexive: false,
    tenses: finalTenses,
  };
}
