/**
 * Welsh conjugation engine
 * ------------------------
 * Welsh (Cymraeg) conjugation is distinctive among European languages:
 *
 * 1. The verb "bod" (to be) is central — used to form periphrastic tenses
 *    for the vast majority of verbs.
 * 2. Most verbs in spoken Welsh use PERIPHRASTIC forms:
 *      bod (conjugated) + yn + verbal noun
 *    e.g. "rwy'n siarad" = I speak (lit. "I am speaking")
 * 3. Some verbs retain inflected (synthetic) forms, especially in literary Welsh.
 * 4. Welsh has 6 persons: fi (I), ti (you), fe/hi (he/she), ni (we),
 *    chi (you pl./formal), nhw (they)
 *
 * Tenses produced:
 *   present     – Presennol      (rwy'n + VN / inflected present)
 *   imperfect   – Amherffaith    (roeddwn i'n + VN / inflected imperfect)
 *   preterite   – Gorffennol     (gwnes i + VN / inflected preterite)
 *   future      – Dyfodol        (bydda i'n + VN / inflected future)
 *   conditional – Amodol         (baswn i'n + VN / inflected conditional)
 *   subjunctive – Gorchmynnol    (imperative forms)
 */

import type { ConjugationTable } from '../../types';

// ─── Types ─────────────────────────────────────────────────────
type Forms = [string, string, string, string, string, string];

// ─── Irregular verb data ───────────────────────────────────────
// Welsh irregular verbs have their own inflected forms for various tenses.
// Each entry stores the 6-person forms for each tense that has inflected forms.

interface IrregularEntry {
  /** The verbal noun (dictionary form) */
  vn: string;
  present?: Forms;
  imperfect?: Forms;
  preterite?: Forms;
  future?: Forms;
  conditional?: Forms;
  imperative?: string; // 2nd person singular command form
}

const IRREGULARS: Record<string, IrregularEntry> = {
  // ── bod (to be) — the most important Welsh verb ──
  'bod': {
    vn: 'bod',
    present: [
      'rydw i',
      'rwyt ti',
      'mae e/hi',
      'rydyn ni',
      'rydych chi',
      'maen nhw',
    ],
    imperfect: [
      'roeddwn i',
      'roeddet ti',
      'roedd e/hi',
      'roedden ni',
      'roeddech chi',
      'roedden nhw',
    ],
    preterite: [
      'bûm i',
      'buest ti',
      'bu e/hi',
      'buon ni',
      'buoch chi',
      'buon nhw',
    ],
    future: [
      'bydda i',
      'byddi di',
      'bydd e/hi',
      'byddwn ni',
      'byddwch chi',
      'byddan nhw',
    ],
    conditional: [
      'baswn i',
      'baset ti',
      'basai fe/hi',
      'basen ni',
      'basech chi',
      'basen nhw',
    ],
    imperative: 'bydd',
  },

  // ── mynd (to go) ──
  'mynd': {
    vn: 'mynd',
    present: [
      "rwy'n mynd",
      "rwyt ti'n mynd",
      "mae e/hi'n mynd",
      "rydyn ni'n mynd",
      "rydych chi'n mynd",
      "maen nhw'n mynd",
    ],
    imperfect: [
      "roeddwn i'n mynd",
      "roeddet ti'n mynd",
      "roedd e/hi'n mynd",
      "roedden ni'n mynd",
      "roeddech chi'n mynd",
      "roedden nhw'n mynd",
    ],
    preterite: [
      'es i',
      'est ti',
      'aeth e/hi',
      'aethon ni',
      'aethoch chi',
      'aethon nhw',
    ],
    future: [
      'af i',
      'ei di',
      'aiff e/hi',
      'awn ni',
      'ewch chi',
      'ân nhw',
    ],
    conditional: [
      "baswn i'n mynd",
      "baset ti'n mynd",
      "basai fe/hi'n mynd",
      "basen ni'n mynd",
      "basech chi'n mynd",
      "basen nhw'n mynd",
    ],
    imperative: 'cer / dos',
  },

  // ── dod (to come) ──
  'dod': {
    vn: 'dod',
    present: [
      "rwy'n dod",
      "rwyt ti'n dod",
      "mae e/hi'n dod",
      "rydyn ni'n dod",
      "rydych chi'n dod",
      "maen nhw'n dod",
    ],
    imperfect: [
      "roeddwn i'n dod",
      "roeddet ti'n dod",
      "roedd e/hi'n dod",
      "roedden ni'n dod",
      "roeddech chi'n dod",
      "roedden nhw'n dod",
    ],
    preterite: [
      'des i',
      'dest ti',
      'daeth e/hi',
      'daethon ni',
      'daethoch chi',
      'daethon nhw',
    ],
    future: [
      'dof i',
      'doi di',
      'daw e/hi',
      'down ni',
      'dewch chi',
      'dôn nhw',
    ],
    conditional: [
      "baswn i'n dod",
      "baset ti'n dod",
      "basai fe/hi'n dod",
      "basen ni'n dod",
      "basech chi'n dod",
      "basen nhw'n dod",
    ],
    imperative: 'tyrd / dere',
  },

  // ── gwneud (to do / to make) ──
  'gwneud': {
    vn: 'gwneud',
    present: [
      "rwy'n gwneud",
      "rwyt ti'n gwneud",
      "mae e/hi'n gwneud",
      "rydyn ni'n gwneud",
      "rydych chi'n gwneud",
      "maen nhw'n gwneud",
    ],
    imperfect: [
      "roeddwn i'n gwneud",
      "roeddet ti'n gwneud",
      "roedd e/hi'n gwneud",
      "roedden ni'n gwneud",
      "roeddech chi'n gwneud",
      "roedden nhw'n gwneud",
    ],
    preterite: [
      'gwnes i',
      'gwnest ti',
      'gwnaeth e/hi',
      'gwnaethon ni',
      'gwnaethoch chi',
      'gwnaethon nhw',
    ],
    future: [
      'gwna i',
      'gwnei di',
      'gwnaiff e/hi',
      'gwnawn ni',
      'gwnewch chi',
      'gwnân nhw',
    ],
    conditional: [
      "baswn i'n gwneud",
      "baset ti'n gwneud",
      "basai fe/hi'n gwneud",
      "basen ni'n gwneud",
      "basech chi'n gwneud",
      "basen nhw'n gwneud",
    ],
    imperative: 'gwna',
  },

  // ── cael (to get / to have / to be allowed) ──
  'cael': {
    vn: 'cael',
    present: [
      "rwy'n cael",
      "rwyt ti'n cael",
      "mae e/hi'n cael",
      "rydyn ni'n cael",
      "rydych chi'n cael",
      "maen nhw'n cael",
    ],
    imperfect: [
      "roeddwn i'n cael",
      "roeddet ti'n cael",
      "roedd e/hi'n cael",
      "roedden ni'n cael",
      "roeddech chi'n cael",
      "roedden nhw'n cael",
    ],
    preterite: [
      'ces i',
      'cest ti',
      'cafodd e/hi',
      'cawson ni',
      'cawsoch chi',
      'cawson nhw',
    ],
    future: [
      'ca i',
      'cei di',
      'caiff e/hi',
      'cawn ni',
      'cewch chi',
      'cân nhw',
    ],
    conditional: [
      "baswn i'n cael",
      "baset ti'n cael",
      "basai fe/hi'n cael",
      "basen ni'n cael",
      "basech chi'n cael",
      "basen nhw'n cael",
    ],
    imperative: '-',
  },

  // ── gallu (can / to be able to) ──
  'gallu': {
    vn: 'gallu',
    present: [
      'galla i',
      'galli di',
      'gall e/hi',
      'gallwn ni',
      'gallwch chi',
      'gallan nhw',
    ],
    imperfect: [
      'gallwn i',
      'gallet ti',
      'gallai fe/hi',
      'gallen ni',
      'gallech chi',
      'gallen nhw',
    ],
    preterite: [
      'gelles i',
      'gellest ti',
      'gallodd e/hi',
      'gallon ni',
      'galloch chi',
      'gallon nhw',
    ],
    future: [
      'galla i',
      'galli di',
      'gall e/hi',
      'gallwn ni',
      'gallwch chi',
      'gallan nhw',
    ],
    conditional: [
      'gallwn i',
      'gallet ti',
      'gallai fe/hi',
      'gallen ni',
      'gallech chi',
      'gallen nhw',
    ],
    imperative: '-',
  },

  // ── gwybod (to know — facts) ──
  'gwybod': {
    vn: 'gwybod',
    present: [
      'gwn i',
      'gwyddost ti',
      'gŵyr e/hi',
      'gwyddon ni',
      'gwyddoch chi',
      'gwyddan nhw',
    ],
    imperfect: [
      'gwyddwn i',
      'gwyddet ti',
      'gwyddai fe/hi',
      'gwydden ni',
      'gwyddech chi',
      'gwydden nhw',
    ],
    preterite: [
      'gwybûm i',
      'gwybuest ti',
      'gwybu e/hi',
      'gwybuon ni',
      'gwybuoch chi',
      'gwybuon nhw',
    ],
    future: [
      'gwybydda i',
      'gwybyddi di',
      'gwybydd e/hi',
      'gwybyddwn ni',
      'gwybyddwch chi',
      'gwybyddan nhw',
    ],
    conditional: [
      'gwybyddwn i',
      'gwybyddet ti',
      'gwybyddai fe/hi',
      'gwybydden ni',
      'gwybyddech chi',
      'gwybydden nhw',
    ],
    imperative: '-',
  },

  // ── adnabod (to know / recognize — people, places) ──
  'adnabod': {
    vn: 'adnabod',
    present: [
      "rwy'n adnabod",
      "rwyt ti'n adnabod",
      "mae e/hi'n adnabod",
      "rydyn ni'n adnabod",
      "rydych chi'n adnabod",
      "maen nhw'n adnabod",
    ],
    imperfect: [
      "roeddwn i'n adnabod",
      "roeddet ti'n adnabod",
      "roedd e/hi'n adnabod",
      "roedden ni'n adnabod",
      "roeddech chi'n adnabod",
      "roedden nhw'n adnabod",
    ],
    preterite: [
      'adnabûm i',
      'adnabuest ti',
      'adnabu e/hi',
      'adnabuon ni',
      'adnabuoch chi',
      'adnabuon nhw',
    ],
    future: [
      "bydda i'n adnabod",
      "byddi di'n adnabod",
      "bydd e/hi'n adnabod",
      "byddwn ni'n adnabod",
      "byddwch chi'n adnabod",
      "byddan nhw'n adnabod",
    ],
    conditional: [
      "baswn i'n adnabod",
      "baset ti'n adnabod",
      "basai fe/hi'n adnabod",
      "basen ni'n adnabod",
      "basech chi'n adnabod",
      "basen nhw'n adnabod",
    ],
    imperative: '-',
  },

  // ── darganfod (to discover) ──
  'darganfod': {
    vn: 'darganfod',
    preterite: [
      'darganfûm i',
      'darganfuest ti',
      'darganfu e/hi',
      'darganfuon ni',
      'darganfuoch chi',
      'darganfuon nhw',
    ],
    imperative: '-',
  },

  // ── gweld (to see) ──
  'gweld': {
    vn: 'gweld',
    present: [
      "rwy'n gweld",
      "rwyt ti'n gweld",
      "mae e/hi'n gweld",
      "rydyn ni'n gweld",
      "rydych chi'n gweld",
      "maen nhw'n gweld",
    ],
    imperfect: [
      "roeddwn i'n gweld",
      "roeddet ti'n gweld",
      "roedd e/hi'n gweld",
      "roedden ni'n gweld",
      "roeddech chi'n gweld",
      "roedden nhw'n gweld",
    ],
    preterite: [
      'gwelais i',
      'gwelaist ti',
      'gwelodd e/hi',
      'gwelon ni',
      'gweloch chi',
      'gwelon nhw',
    ],
    future: [
      'gwela i',
      'gweli di',
      'gwelith e/hi',
      'gwelwn ni',
      'gwelwch chi',
      'gwelan nhw',
    ],
    conditional: [
      'gwelwn i',
      'gwelet ti',
      'gwelai fe/hi',
      'gwelen ni',
      'gwelech chi',
      'gwelen nhw',
    ],
    imperative: '-',
  },

  // ── clywed (to hear) ──
  'clywed': {
    vn: 'clywed',
    present: [
      "rwy'n clywed",
      "rwyt ti'n clywed",
      "mae e/hi'n clywed",
      "rydyn ni'n clywed",
      "rydych chi'n clywed",
      "maen nhw'n clywed",
    ],
    imperfect: [
      "roeddwn i'n clywed",
      "roeddet ti'n clywed",
      "roedd e/hi'n clywed",
      "roedden ni'n clywed",
      "roeddech chi'n clywed",
      "roedden nhw'n clywed",
    ],
    preterite: [
      'clywais i',
      'clywaist ti',
      'clywodd e/hi',
      'clywon ni',
      'clywoch chi',
      'clywon nhw',
    ],
    future: [
      'clywa i',
      'clywi di',
      'clywith e/hi',
      'clywwn ni',
      'clywwch chi',
      'clywan nhw',
    ],
    conditional: [
      'clywwn i',
      'clywet ti',
      'clywai fe/hi',
      'clywen ni',
      'clywech chi',
      'clywen nhw',
    ],
    imperative: '-',
  },

  // ── dweud (to say / to tell) ──
  'dweud': {
    vn: 'dweud',
    present: [
      "rwy'n dweud",
      "rwyt ti'n dweud",
      "mae e/hi'n dweud",
      "rydyn ni'n dweud",
      "rydych chi'n dweud",
      "maen nhw'n dweud",
    ],
    imperfect: [
      "roeddwn i'n dweud",
      "roeddet ti'n dweud",
      "roedd e/hi'n dweud",
      "roedden ni'n dweud",
      "roeddech chi'n dweud",
      "roedden nhw'n dweud",
    ],
    preterite: [
      'dywedais i',
      'dywedaist ti',
      'dywedodd e/hi',
      'dywedon ni',
      'dywedoch chi',
      'dywedon nhw',
    ],
    future: [
      'dyweda i',
      'dywedi di',
      'dywedith e/hi',
      'dywedwn ni',
      'dywedwch chi',
      'dywedan nhw',
    ],
    conditional: [
      'dywedwn i',
      'dywedet ti',
      'dywedai fe/hi',
      'dyweden ni',
      'dywedech chi',
      'dyweden nhw',
    ],
    imperative: 'dywed / dwed',
  },

  // ── rhoi (to give) ──
  'rhoi': {
    vn: 'rhoi',
    present: [
      "rwy'n rhoi",
      "rwyt ti'n rhoi",
      "mae e/hi'n rhoi",
      "rydyn ni'n rhoi",
      "rydych chi'n rhoi",
      "maen nhw'n rhoi",
    ],
    imperfect: [
      "roeddwn i'n rhoi",
      "roeddet ti'n rhoi",
      "roedd e/hi'n rhoi",
      "roedden ni'n rhoi",
      "roeddech chi'n rhoi",
      "roedden nhw'n rhoi",
    ],
    preterite: [
      'rhoddais i',
      'rhoddaist ti',
      'rhoddodd e/hi',
      'rhoddon ni',
      'rhoddoch chi',
      'rhoddon nhw',
    ],
    future: [
      'rhodda i',
      'rhoddi di',
      'rhydd e/hi',
      'rhoddwn ni',
      'rhoddwch chi',
      'rhoddan nhw',
    ],
    conditional: [
      'rhoddwn i',
      'rhoddet ti',
      'rhoddai fe/hi',
      'rhodden ni',
      'rhoddech chi',
      'rhodden nhw',
    ],
    imperative: 'rho',
  },

  // ── cymryd (to take) ──
  'cymryd': {
    vn: 'cymryd',
    preterite: [
      'cymerais i',
      'cymeraist ti',
      'cymerodd e/hi',
      'cymeron ni',
      'cymeroch chi',
      'cymeron nhw',
    ],
    future: [
      'cymera i',
      'cymeri di',
      'cymerith e/hi',
      'cymerwn ni',
      'cymerwch chi',
      'cymeran nhw',
    ],
    conditional: [
      'cymerwn i',
      'cymeret ti',
      'cymerai fe/hi',
      'cymeren ni',
      'cymerech chi',
      'cymeren nhw',
    ],
    imperative: 'cymer',
  },

  // ── bwyta (to eat) ──
  'bwyta': {
    vn: 'bwyta',
    preterite: [
      'bwytais i',
      'bwytaist ti',
      'bwytodd e/hi',
      'bwyton ni',
      'bwytoch chi',
      'bwyton nhw',
    ],
    future: [
      'bwyta i',
      'bwyti di',
      'bwytith e/hi',
      'bwytwn ni',
      'bwytwch chi',
      'bwytan nhw',
    ],
    imperative: 'bwyta',
  },

  // ── yfed (to drink) ──
  'yfed': {
    vn: 'yfed',
    preterite: [
      'yfais i',
      'yfaist ti',
      'yfodd e/hi',
      'yfon ni',
      'yfoch chi',
      'yfon nhw',
    ],
    future: [
      'yfa i',
      'yfi di',
      'yfith e/hi',
      'yfwn ni',
      'yfwch chi',
      'yfan nhw',
    ],
    imperative: 'yf',
  },

  // ── cysgu (to sleep) ──
  'cysgu': {
    vn: 'cysgu',
    preterite: [
      'cysgais i',
      'cysgaist ti',
      'cysgodd e/hi',
      'cysgon ni',
      'cysgoch chi',
      'cysgon nhw',
    ],
    future: [
      'cysga i',
      'cysgi di',
      'cysgith e/hi',
      'cysgwn ni',
      'cysgwch chi',
      'cysgan nhw',
    ],
    imperative: 'cysga',
  },

  // ── gyrru (to drive) ──
  'gyrru': {
    vn: 'gyrru',
    preterite: [
      'gyrrais i',
      'gyrraist ti',
      'gyrrodd e/hi',
      'gyrron ni',
      'gyrroch chi',
      'gyrron nhw',
    ],
    imperative: 'gyrra',
  },

  // ── darllen (to read) ──
  'darllen': {
    vn: 'darllen',
    preterite: [
      'darllenais i',
      'darllenais ti',
      'darllenodd e/hi',
      'darllenon ni',
      'darllenoch chi',
      'darllenon nhw',
    ],
    future: [
      'darllena i',
      'darlleni di',
      'darllenith e/hi',
      'darlenwn ni',
      'darlenwch chi',
      'darlenan nhw',
    ],
    imperative: 'darllena',
  },

  // ── ysgrifennu (to write) ──
  'ysgrifennu': {
    vn: 'ysgrifennu',
    preterite: [
      'ysgrifennais i',
      'ysgrifennaist ti',
      'ysgrifennodd e/hi',
      'ysgrifennon ni',
      'ysgrifennoch chi',
      'ysgrifennon nhw',
    ],
    future: [
      'ysgrifenna i',
      'ysgrifenni di',
      'ysgrifennith e/hi',
      'ysgrifennwn ni',
      'ysgrifennwch chi',
      'ysgrifennan nhw',
    ],
    imperative: 'ysgrifenna',
  },

  // ── siarad (to speak / to talk) ──
  'siarad': {
    vn: 'siarad',
    preterite: [
      'siaradais i',
      'siaradaist ti',
      'siaradodd e/hi',
      'siaradon ni',
      'siaradoch chi',
      'siaradon nhw',
    ],
    future: [
      'siarada i',
      'siaradi di',
      'siaradith e/hi',
      'siaradwn ni',
      'siaradwch chi',
      'siaradan nhw',
    ],
    imperative: 'siarada',
  },

  // ── dysgu (to learn / to teach) ──
  'dysgu': {
    vn: 'dysgu',
    preterite: [
      'dysgais i',
      'dysgaist ti',
      'dysgodd e/hi',
      'dysgon ni',
      'dysgoch chi',
      'dysgon nhw',
    ],
    future: [
      'dysga i',
      'dysgi di',
      'dysgith e/hi',
      'dysgwn ni',
      'dysgwch chi',
      'dysgan nhw',
    ],
    imperative: 'dysga',
  },

  // ── prynu (to buy) ──
  'prynu': {
    vn: 'prynu',
    preterite: [
      'prynais i',
      'prynaist ti',
      'prynodd e/hi',
      'prynon ni',
      'prynoch chi',
      'prynon nhw',
    ],
    future: [
      'pryna i',
      'pryni di',
      'prynith e/hi',
      'prynwn ni',
      'prynwch chi',
      'prynan nhw',
    ],
    imperative: 'pryna',
  },

  // ── gwerthu (to sell) ──
  'gwerthu': {
    vn: 'gwerthu',
    preterite: [
      'gwerthais i',
      'gwerthaist ti',
      'gwerthodd e/hi',
      'gwerthon ni',
      'gwerthoch chi',
      'gwerthon nhw',
    ],
    future: [
      'gwertha i',
      'gwerthi di',
      'gwerthith e/hi',
      'gwerthwn ni',
      'gwerthwch chi',
      'gwerthan nhw',
    ],
    imperative: 'gwertha',
  },

  // ── agor (to open) ──
  'agor': {
    vn: 'agor',
    preterite: [
      'agorais i',
      'agoraist ti',
      'agorodd e/hi',
      'agoron ni',
      'agoroch chi',
      'agoron nhw',
    ],
    future: [
      'agora i',
      'agori di',
      'agorith e/hi',
      'agorwn ni',
      'agorwch chi',
      'agoran nhw',
    ],
    imperative: 'agora',
  },

  // ── cau (to close / to shut) ──
  'cau': {
    vn: 'cau',
    preterite: [
      'caeais i',
      'caeaist ti',
      'caeodd e/hi',
      'caeon ni',
      'caeoch chi',
      'caeon nhw',
    ],
    future: [
      'caea i',
      'caei di',
      'caeith e/hi',
      'caewn ni',
      'caewch chi',
      'caean nhw',
    ],
    imperative: 'caea',
  },

  // ── rhedeg (to run) ──
  'rhedeg': {
    vn: 'rhedeg',
    preterite: [
      'rhedais i',
      'rhedaist ti',
      'rhedodd e/hi',
      'rhedon ni',
      'rhedoch chi',
      'rhedon nhw',
    ],
    future: [
      'rheda i',
      'rhedi di',
      'rhedith e/hi',
      'rhedwn ni',
      'rhedwch chi',
      'rhedan nhw',
    ],
    imperative: 'rheda',
  },

  // ── cerdded (to walk) ──
  'cerdded': {
    vn: 'cerdded',
    preterite: [
      'cerddais i',
      'cerddaist ti',
      'cerddodd e/hi',
      'cerddon ni',
      'cerddoch chi',
      'cerddon nhw',
    ],
    future: [
      'cerdda i',
      'cerddi di',
      'cerddith e/hi',
      'cerddwn ni',
      'cerddwch chi',
      'cerddan nhw',
    ],
    imperative: 'cerdda',
  },

  // ── nofio (to swim) ──
  'nofio': {
    vn: 'nofio',
    preterite: [
      'nofiais i',
      'nofiaist ti',
      'nofiodd e/hi',
      'nofion ni',
      'nofioch chi',
      'nofion nhw',
    ],
    future: [
      'nofia i',
      'nofi di',
      'nofith e/hi',
      'nofiwn ni',
      'nofiwch chi',
      'nofian nhw',
    ],
    imperative: 'nofia',
  },

  // ── hedfan (to fly) ──
  'hedfan': {
    vn: 'hedfan',
    preterite: [
      'hedfanais i',
      'hedfanaist ti',
      'hedfanodd e/hi',
      'hedfanon ni',
      'hedfanoch chi',
      'hedfanon nhw',
    ],
    future: [
      'hedfana i',
      'hedfani di',
      'hedfanith e/hi',
      'hedfanwn ni',
      'hedfanwch chi',
      'hedfanan nhw',
    ],
    imperative: 'hedfana',
  },

  // ── hoffi (to like) ──
  'hoffi': {
    vn: 'hoffi',
    preterite: [
      'hoffais i',
      'hoffaist ti',
      'hoffodd e/hi',
      'hoffon ni',
      'hoffoch chi',
      'hoffon nhw',
    ],
    imperative: '-',
  },

  // ── caru (to love) ──
  'caru': {
    vn: 'caru',
    preterite: [
      'carais i',
      'caraist ti',
      'carodd e/hi',
      'caron ni',
      'caroch chi',
      'caron nhw',
    ],
    future: [
      'cara i',
      'cari di',
      'carith e/hi',
      'carwn ni',
      'carwch chi',
      'caran nhw',
    ],
    imperative: 'cara',
  },

  // ── meddwl (to think) ──
  'meddwl': {
    vn: 'meddwl',
    preterite: [
      'meddyliais i',
      'meddyliaist ti',
      'meddyliodd e/hi',
      'meddylion ni',
      'meddylioch chi',
      'meddylion nhw',
    ],
    future: [
      'meddylia i',
      'meddyli di',
      'meddylith e/hi',
      'meddyliwn ni',
      'meddyliwch chi',
      'meddylian nhw',
    ],
    imperative: 'meddylia',
  },

  // ── credu (to believe) ──
  'credu': {
    vn: 'credu',
    preterite: [
      'credais i',
      'credaist ti',
      'credodd e/hi',
      'credon ni',
      'credoch chi',
      'credon nhw',
    ],
    future: [
      'creda i',
      'credi di',
      'credith e/hi',
      'credwn ni',
      'credwch chi',
      'credan nhw',
    ],
    imperative: 'creda',
  },

  // ── deall (to understand) ──
  'deall': {
    vn: 'deall',
    preterite: [
      'deallais i',
      'deallaist ti',
      'deallodd e/hi',
      'deallon ni',
      'dealloch chi',
      'deallon nhw',
    ],
    future: [
      'dealla i',
      'dealli di',
      'deallith e/hi',
      'deallwn ni',
      'deallwch chi',
      'deallan nhw',
    ],
    imperative: 'dealla',
  },

  // ── gofyn (to ask) ──
  'gofyn': {
    vn: 'gofyn',
    preterite: [
      'gofynnais i',
      'gofynnaist ti',
      'gofynnodd e/hi',
      'gofynnon ni',
      'gofynnoch chi',
      'gofynnon nhw',
    ],
    future: [
      'gofynna i',
      'gofynni di',
      'gofynnith e/hi',
      'gofynnwn ni',
      'gofynnwch chi',
      'gofynnan nhw',
    ],
    imperative: 'gofynna',
  },

  // ── ateb (to answer) ──
  'ateb': {
    vn: 'ateb',
    preterite: [
      'atebais i',
      'atebaist ti',
      'atebodd e/hi',
      'atebon ni',
      'ateboch chi',
      'atebon nhw',
    ],
    future: [
      'ateba i',
      'atebi di',
      'atebith e/hi',
      'atebwn ni',
      'atebwch chi',
      'ateban nhw',
    ],
    imperative: 'ateba',
  },

  // ── helpu (to help) ──
  'helpu': {
    vn: 'helpu',
    preterite: [
      'helpais i',
      'helpaist ti',
      'helpodd e/hi',
      'helpon ni',
      'helpoch chi',
      'helpon nhw',
    ],
    future: [
      'helpa i',
      'helpi di',
      'helpith e/hi',
      'helpwn ni',
      'helpwch chi',
      'helpan nhw',
    ],
    imperative: 'helpa',
  },

  // ── gweithio (to work) ──
  'gweithio': {
    vn: 'gweithio',
    preterite: [
      'gweithiais i',
      'gweithiaist ti',
      'gweithiodd e/hi',
      'gweithion ni',
      'gweithioch chi',
      'gweithion nhw',
    ],
    future: [
      'gweithia i',
      'gweithi di',
      'gweithith e/hi',
      'gweithiwn ni',
      'gweithiwch chi',
      'gweithian nhw',
    ],
    imperative: 'gweithia',
  },

  // ── chwarae (to play) ──
  'chwarae': {
    vn: 'chwarae',
    preterite: [
      'chwaraeais i',
      'chwaraeaist ti',
      'chwaraeodd e/hi',
      'chwaraeon ni',
      'chwaraeoch chi',
      'chwaraeon nhw',
    ],
    future: [
      'chwaraea i',
      'chwaraei di',
      'chwaraeith e/hi',
      'chwaraewn ni',
      'chwaraewch chi',
      'chwaraean nhw',
    ],
    imperative: 'chwaraea',
  },

  // ── talu (to pay) ──
  'talu': {
    vn: 'talu',
    preterite: [
      'talais i',
      'talaist ti',
      'talodd e/hi',
      'talon ni',
      'taloch chi',
      'talon nhw',
    ],
    future: [
      'tala i',
      'tali di',
      'talith e/hi',
      'talwn ni',
      'talwch chi',
      'talan nhw',
    ],
    imperative: 'tala',
  },

  // ── byw (to live) ──
  'byw': {
    vn: 'byw',
    preterite: [
      "bûm i'n byw",
      "buest ti'n byw",
      "bu e/hi'n byw",
      "buon ni'n byw",
      "buoch chi'n byw",
      "buon nhw'n byw",
    ],
    imperative: '-',
  },

  // ── marw (to die) ──
  'marw': {
    vn: 'marw',
    preterite: [
      'bu farw i',
      'buest farw ti',
      'bu farw e/hi',
      'buon farw ni',
      'buoch farw chi',
      'buon farw nhw',
    ],
    imperative: '-',
  },

  // ── aros (to wait / to stay) ──
  'aros': {
    vn: 'aros',
    preterite: [
      'arhosais i',
      'arhosaist ti',
      'arhosodd e/hi',
      'arhoson ni',
      'arhosoch chi',
      'arhoson nhw',
    ],
    future: [
      'arhosa i',
      'arhosi di',
      'arhosith e/hi',
      'arhoswn ni',
      'arhoswch chi',
      'arhosan nhw',
    ],
    imperative: 'aros / arhoswch',
  },

  // ── cofio (to remember) ──
  'cofio': {
    vn: 'cofio',
    preterite: [
      'cofiais i',
      'cofiaist ti',
      'cofiodd e/hi',
      'cofion ni',
      'cofioch chi',
      'cofion nhw',
    ],
    future: [
      'cofia i',
      'cofi di',
      'cofith e/hi',
      'cofiwn ni',
      'cofiwch chi',
      'cofian nhw',
    ],
    imperative: 'cofia',
  },

  // ── anghofio (to forget) ──
  'anghofio': {
    vn: 'anghofio',
    preterite: [
      'anghofiais i',
      'anghofiaist ti',
      'anghofiodd e/hi',
      'anghofion ni',
      'anghofioch chi',
      'anghofion nhw',
    ],
    future: [
      'anghofia i',
      'anghofi di',
      'anghofith e/hi',
      'anghofiwn ni',
      'anghofiwch chi',
      'anghofian nhw',
    ],
    imperative: 'anghofia',
  },

  // ── dechrau (to start / to begin) ──
  'dechrau': {
    vn: 'dechrau',
    preterite: [
      'dechreuais i',
      'dechreuaist ti',
      'dechreuodd e/hi',
      'dechreuon ni',
      'dechreuoch chi',
      'dechreuon nhw',
    ],
    future: [
      'dechreua i',
      'dechreui di',
      'dechreuith e/hi',
      'dechreuwn ni',
      'dechreuwch chi',
      'dechreuan nhw',
    ],
    imperative: 'dechreua',
  },

  // ── gorffen (to finish) ──
  'gorffen': {
    vn: 'gorffen',
    preterite: [
      'gorffennais i',
      'gorffennaist ti',
      'gorffennodd e/hi',
      'gorffennon ni',
      'gorffennoch chi',
      'gorffennon nhw',
    ],
    future: [
      'gorffenna i',
      'gorffenni di',
      'gorffennith e/hi',
      'gorffennwn ni',
      'gorffennwch chi',
      'gorffennan nhw',
    ],
    imperative: 'gorffenna',
  },

  // ── ceisio (to try) ──
  'ceisio': {
    vn: 'ceisio',
    preterite: [
      'ceisiais i',
      'ceisiaist ti',
      'ceisiodd e/hi',
      'ceision ni',
      'ceisioch chi',
      'ceision nhw',
    ],
    imperative: 'ceisia',
  },

  // ── gobeithio (to hope) ──
  'gobeithio': {
    vn: 'gobeithio',
    preterite: [
      'gobeithiais i',
      'gobeithiaist ti',
      'gobeithiodd e/hi',
      'gobeithion ni',
      'gobeithioch chi',
      'gobeithion nhw',
    ],
    imperative: '-',
  },

  // ── eistedd (to sit) ──
  'eistedd': {
    vn: 'eistedd',
    preterite: [
      'eisteddais i',
      'eisteddaist ti',
      'eisteddodd e/hi',
      'eisteddon ni',
      'eisteddoch chi',
      'eisteddon nhw',
    ],
    future: [
      'eistedda i',
      'eistedddi di',
      'eisteddith e/hi',
      'eisteddwn ni',
      'eisteddwch chi',
      'eisteddan nhw',
    ],
    imperative: 'eistedda',
  },

  // ── sefyll (to stand) ──
  'sefyll': {
    vn: 'sefyll',
    preterite: [
      'sefais i',
      'sefaist ti',
      'safodd e/hi',
      'safon ni',
      'safoch chi',
      'safon nhw',
    ],
    future: [
      'safa i',
      'sefi di',
      'saiff e/hi',
      'safwn ni',
      'safwch chi',
      'safan nhw',
    ],
    imperative: 'saf / sefa',
  },

  // ── canu (to sing) ──
  'canu': {
    vn: 'canu',
    preterite: [
      'cenais i',
      'cenaist ti',
      'canodd e/hi',
      'canon ni',
      'canoch chi',
      'canon nhw',
    ],
    future: [
      'cana i',
      'ceni di',
      'canith e/hi',
      'canwn ni',
      'canwch chi',
      'canan nhw',
    ],
    imperative: 'cana',
  },

  // ── coginio (to cook) ──
  'coginio': {
    vn: 'coginio',
    preterite: [
      'coginiais i',
      'coginiaist ti',
      'coginiodd e/hi',
      'coginion ni',
      'coginioch chi',
      'coginion nhw',
    ],
    imperative: 'coginia',
  },

  // ── golchi (to wash) ──
  'golchi': {
    vn: 'golchi',
    preterite: [
      'golchais i',
      'golchaist ti',
      'golchodd e/hi',
      'golchon ni',
      'golchoch chi',
      'golchon nhw',
    ],
    imperative: 'golcha',
  },
};

// ─── Build periphrastic forms for a verbal noun ───────────────

/**
 * Build the standard periphrastic conjugation for any verb using
 * forms of "bod" (to be) + yn + verbal noun.
 * This is how most Welsh verbs work in spoken Welsh.
 */
function buildPeriphrasticPresent(vn: string): Forms {
  return [
    `rwy'n ${vn}`,
    `rwyt ti'n ${vn}`,
    `mae e/hi'n ${vn}`,
    `rydyn ni'n ${vn}`,
    `rydych chi'n ${vn}`,
    `maen nhw'n ${vn}`,
  ];
}

function buildPeriphrasticImperfect(vn: string): Forms {
  return [
    `roeddwn i'n ${vn}`,
    `roeddet ti'n ${vn}`,
    `roedd e/hi'n ${vn}`,
    `roedden ni'n ${vn}`,
    `roeddech chi'n ${vn}`,
    `roedden nhw'n ${vn}`,
  ];
}

function buildPeriphrasticPreterite(vn: string): Forms {
  return [
    `gwnes i ${vn}`,
    `gwnest ti ${vn}`,
    `gwnaeth e/hi ${vn}`,
    `gwnaethon ni ${vn}`,
    `gwnaethoch chi ${vn}`,
    `gwnaethon nhw ${vn}`,
  ];
}

function buildPeriphrasticFuture(vn: string): Forms {
  return [
    `bydda i'n ${vn}`,
    `byddi di'n ${vn}`,
    `bydd e/hi'n ${vn}`,
    `byddwn ni'n ${vn}`,
    `byddwch chi'n ${vn}`,
    `byddan nhw'n ${vn}`,
  ];
}

function buildPeriphrasticConditional(vn: string): Forms {
  return [
    `baswn i'n ${vn}`,
    `baset ti'n ${vn}`,
    `basai fe/hi'n ${vn}`,
    `basen ni'n ${vn}`,
    `basech chi'n ${vn}`,
    `basen nhw'n ${vn}`,
  ];
}

/**
 * Build imperative forms. Welsh imperatives are typically:
 *   2sg: verb stem + -a (familiar)
 *   2pl: verb stem + -wch (formal / plural)
 * Slots: [1sg, 2sg, 3sg, 1pl, 2pl, 3pl] — only 2sg and 2pl filled, others stay '-'.
 */
function buildImperative(form: string): Forms {
  return ['-', form, '-', '-', '-', '-'];
}

/** Compute Welsh imperative stem by dropping the verb-noun's typical ending. */
function welshStem(vn: string): string {
  if (vn.endsWith('io'))   return vn.slice(0, -2) + 'i'; // coginio → cogini
  if (vn.endsWith('eu'))   return vn.slice(0, -2);       // mwynheu → mwynh (rare)
  if (vn.endsWith('u'))    return vn.slice(0, -1);       // cysgu → cysg
  if (vn.endsWith('i'))    return vn.slice(0, -1);       // codi → cod
  if (vn.endsWith('o'))    return vn.slice(0, -1);       // gwneuthuro → gwneuthur
  if (vn.endsWith('ed'))   return vn.slice(0, -2);       // cerdded → cerdd
  if (vn.endsWith('eg'))   return vn.slice(0, -2);       // disgwyl → disgwy (rare)
  if (vn.endsWith('yd'))   return vn.slice(0, -2);       // dychwelyd → dychwel
  return vn;                                              // siarad, bwyta stay as-is
}

/** Productive imperative for any regular verb-noun. */
function buildPeriphrasticImperative(vn: string): Forms {
  const stem = welshStem(vn);
  // 2sg: stem + -a, unless stem already ends in -a (avoid -aa)
  const sg = stem.endsWith('a') ? stem : stem + 'a';
  // 2pl: stem + -wch. If stem ends in -a, the conventional form is -ewch
  // (e.g. bwyta → bwytewch, not bwytawch)
  const pl = stem.endsWith('a') ? stem.slice(0, -1) + 'ewch' : stem + 'wch';
  return ['-', sg, '-', '-', pl, '-'];
}

// ─── Build full conjugation table ──────────────────────────────

function buildTable(
  vn: string,
  present: Forms,
  imperfect: Forms,
  preterite: Forms,
  future: Forms,
  conditional: Forms,
  imperative: Forms,
): ConjugationTable {
  const tenses: Record<string, string[]> = {
    'Presennol (Present)': [...present],
    'Amherffaith (Imperfect)': [...imperfect],
    'Gorffennol (Preterite)': [...preterite],
    'Dyfodol (Future)': [...future],
    'Amodol (Conditional)': [...conditional],
    'Gorchmynnol (Imperative)': [...imperative],
  };

  return {
    infinitive: vn,
    isReflexive: false, // Welsh does not have reflexive verbs in the Romance sense
    tenses,
  };
}

// ─── Main export ───────────────────────────────────────────────

export function conjugate(verb: string): ConjugationTable | null {
  if (!verb || verb.length < 2) return null;

  const vn = verb.toLowerCase().trim();

  // Check irregulars first
  const irr = IRREGULARS[vn];
  if (irr) {
    // For irregular verbs, use their specific forms where available,
    // falling back to periphrastic forms for any missing tenses.
    const present = irr.present
      ? (irr.present as Forms)
      : buildPeriphrasticPresent(vn);
    const imperfect = irr.imperfect
      ? (irr.imperfect as Forms)
      : buildPeriphrasticImperfect(vn);
    const preterite = irr.preterite
      ? (irr.preterite as Forms)
      : buildPeriphrasticPreterite(vn);
    const future = irr.future
      ? (irr.future as Forms)
      : buildPeriphrasticFuture(vn);
    const conditional = irr.conditional
      ? (irr.conditional as Forms)
      : buildPeriphrasticConditional(vn);
    const imperative = buildImperative(irr.imperative || '-');

    return buildTable(vn, present, imperfect, preterite, future, conditional, imperative);
  }

  // ── Regular verb: full periphrastic conjugation ──
  // In spoken Welsh, virtually all verbs use bod + yn + verbal noun.
  // We accept any string that looks plausible as a Welsh verbal noun.
  // Welsh verbal nouns can end in many ways: -u, -i, -o, -ed, -eg, -en,
  // -yd, -io, etc. There is no single reliable suffix test, so we
  // conjugate any input that passes basic length checks.

  const present = buildPeriphrasticPresent(vn);
  const imperfect = buildPeriphrasticImperfect(vn);
  const preterite = buildPeriphrasticPreterite(vn);
  const future = buildPeriphrasticFuture(vn);
  const conditional = buildPeriphrasticConditional(vn);
  const imperative = buildPeriphrasticImperative(vn);

  return buildTable(vn, present, imperfect, preterite, future, conditional, imperative);
}
