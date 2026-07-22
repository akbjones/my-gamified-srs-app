/**
 * Japanese conjugation engine — Stage-1 scaffold (starter nodes 1-18).
 *
 * Canonical register: polite です/ます per docs/japanese-register-policy.md —
 * tables lead with the ます forms the starter teaches; plain forms
 * (dictionary / ない / た) are included because node 19+ teaches them and
 * the dictionary lemma IS the plain form.
 *
 * Classes:
 * - godan (五段): kana-row suffix swap on the final syllable
 *   (書く → 書きます) plus the て/た sound changes (う/つ/る→って,
 *   ぬ/ぶ/む→んで, く→いて, ぐ→いで, す→して; 行く → 行って is lexical)
 * - ichidan (一段): drop る (食べる → 食べます / 食べて)
 * - する compounds (勉強する) and 来る/くる as irregulars; ある has the
 *   suppletive plain negative ない
 * - i-adjectives (node 11): 高い → 高くないです / 高かったです; いい
 *   conjugates on the stem よ (よくない, よかった)
 *
 * Verbs are stored with BOTH kanji and kana surfaces so findInfinitive
 * works from either spelling (the seq 1-50 starter band is kana-only).
 *
 * Stage 2 (parity): potential, volitional, conditionals (ば/たら),
 * passive/causative, keigo (irassharu/mairu class) — mirrors the ko.ts
 * Stage-2 note.
 */

export interface ConjugationTable {
  infinitive: string; // dictionary (plain) form
  isReflexive: boolean;
  tenses: Record<string, string[]>;
}

type VerbClass = 'godan' | 'ichidan' | 'suru' | 'kuru' | 'iadj';

interface VerbInfo {
  cls: VerbClass;
  /** kana spelling of the same lemma (indexed for kana-only cards). */
  kana?: string;
  /** lexical te-form override (行く → 行って). */
  te?: string;
  /** lexical plain-negative override (ある → ない). */
  nai?: string;
}

// Godan final-syllable algebra: i-row (ます stem), a-row (ない stem, う→わ
// already encoded), て/た sound changes.
const GODAN_ROWS: Record<string, { i: string; a: string; te: string; ta: string }> = {
  'う': { i: 'い', a: 'わ', te: 'って', ta: 'った' },
  'く': { i: 'き', a: 'か', te: 'いて', ta: 'いた' },
  'ぐ': { i: 'ぎ', a: 'が', te: 'いで', ta: 'いだ' },
  'す': { i: 'し', a: 'さ', te: 'して', ta: 'した' },
  'つ': { i: 'ち', a: 'た', te: 'って', ta: 'った' },
  'ぬ': { i: 'に', a: 'な', te: 'んで', ta: 'んだ' },
  'ぶ': { i: 'び', a: 'ば', te: 'んで', ta: 'んだ' },
  'む': { i: 'み', a: 'ま', te: 'んで', ta: 'んだ' },
  'る': { i: 'り', a: 'ら', te: 'って', ta: 'った' },
};

/** Starter verb/adjective lexicon — every KNOWN_VERBS key must round-trip
 *  through conjugate() (audit gate). Grows with the deck; the P2 lint
 *  refuses deck verbs missing from this map (kanji-る verbs are otherwise
 *  unclassifiable — the class is not derivable from orthography). */
export const KNOWN_VERBS: Record<string, VerbInfo> = {
  // ── godan ──────────────────────────────────────────────────────
  '行く': { cls: 'godan', kana: 'いく' }, // te 行って/いって is lexical, in stems()
  '書く': { cls: 'godan', kana: 'かく' },
  '聞く': { cls: 'godan', kana: 'きく' },
  '働く': { cls: 'godan', kana: 'はたらく' },
  '泳ぐ': { cls: 'godan', kana: 'およぐ' },
  '急ぐ': { cls: 'godan', kana: 'いそぐ' },
  '話す': { cls: 'godan', kana: 'はなす' },
  '消す': { cls: 'godan', kana: 'けす' },
  '貸す': { cls: 'godan', kana: 'かす' },
  '待つ': { cls: 'godan', kana: 'まつ' },
  '持つ': { cls: 'godan', kana: 'もつ' },
  '立つ': { cls: 'godan', kana: 'たつ' },
  '死ぬ': { cls: 'godan', kana: 'しぬ' },
  '遊ぶ': { cls: 'godan', kana: 'あそぶ' },
  '呼ぶ': { cls: 'godan', kana: 'よぶ' },
  '飲む': { cls: 'godan', kana: 'のむ' },
  '読む': { cls: 'godan', kana: 'よむ' },
  '休む': { cls: 'godan', kana: 'やすむ' },
  '買う': { cls: 'godan', kana: 'かう' },
  '会う': { cls: 'godan', kana: 'あう' },
  '使う': { cls: 'godan', kana: 'つかう' },
  '歌う': { cls: 'godan', kana: 'うたう' },
  'もらう': { cls: 'godan' },
  // kanji-る godan (the classic ichidan look-alikes)
  '帰る': { cls: 'godan', kana: 'かえる' },
  '入る': { cls: 'godan', kana: 'はいる' },
  '走る': { cls: 'godan', kana: 'はしる' },
  '知る': { cls: 'godan', kana: 'しる' },
  '切る': { cls: 'godan', kana: 'きる' },
  '作る': { cls: 'godan', kana: 'つくる' },
  '売る': { cls: 'godan', kana: 'うる' },
  '撮る': { cls: 'godan', kana: 'とる' },
  '乗る': { cls: 'godan', kana: 'のる' },
  'わかる': { cls: 'godan' },
  'ある': { cls: 'godan', nai: 'ない' },
  // ── ichidan ────────────────────────────────────────────────────
  '食べる': { cls: 'ichidan', kana: 'たべる' },
  '見る': { cls: 'ichidan', kana: 'みる' },
  '起きる': { cls: 'ichidan', kana: 'おきる' },
  '寝る': { cls: 'ichidan', kana: 'ねる' },
  '出る': { cls: 'ichidan', kana: 'でる' },
  '着る': { cls: 'ichidan' }, // kana きる collides with 切る — kanji only
  '借りる': { cls: 'ichidan', kana: 'かりる' },
  '教える': { cls: 'ichidan', kana: 'おしえる' },
  '開ける': { cls: 'ichidan', kana: 'あける' },
  '閉める': { cls: 'ichidan', kana: 'しめる' },
  '見せる': { cls: 'ichidan', kana: 'みせる' },
  'あげる': { cls: 'ichidan' },
  'くれる': { cls: 'ichidan' },
  'いる': { cls: 'ichidan' },
  // ── する / 来る ────────────────────────────────────────────────
  'する': { cls: 'suru' },
  '勉強する': { cls: 'suru', kana: 'べんきょうする' },
  '電話する': { cls: 'suru', kana: 'でんわする' },
  '買い物する': { cls: 'suru', kana: 'かいものする' },
  '来る': { cls: 'kuru', kana: 'くる' },
  'くる': { cls: 'kuru' }, // free-text taps on くる itself; reverse map owns 来る
  // ── i-adjectives (node 11) ─────────────────────────────────────
  '高い': { cls: 'iadj', kana: 'たかい' },
  '安い': { cls: 'iadj', kana: 'やすい' },
  '大きい': { cls: 'iadj', kana: 'おおきい' },
  '小さい': { cls: 'iadj', kana: 'ちいさい' },
  '新しい': { cls: 'iadj', kana: 'あたらしい' },
  '古い': { cls: 'iadj', kana: 'ふるい' },
  '暑い': { cls: 'iadj', kana: 'あつい' },
  '寒い': { cls: 'iadj', kana: 'さむい' },
  '楽しい': { cls: 'iadj', kana: 'たのしい' },
  'おいしい': { cls: 'iadj' },
  '面白い': { cls: 'iadj', kana: 'おもしろい' },
  '難しい': { cls: 'iadj', kana: 'むずかしい' },
  '忙しい': { cls: 'iadj', kana: 'いそがしい' },
  '早い': { cls: 'iadj', kana: 'はやい' },
  '遅い': { cls: 'iadj', kana: 'おそい' },
  '近い': { cls: 'iadj', kana: 'ちかい' },
  '遠い': { cls: 'iadj', kana: 'とおい' },
  '多い': { cls: 'iadj', kana: 'おおい' },
  '少ない': { cls: 'iadj', kana: 'すくない' },
  'いい': { cls: 'iadj' }, // stem よ — special-cased in adjTable
  '良い': { cls: 'iadj', kana: 'よい' },
};

// ── Copula: its own table (not a KNOWN_VERBS class) ──────────────
const COPULA_TABLE: ConjugationTable = {
  infinitive: 'です',
  isReflexive: false,
  tenses: {
    'です (Polite present)': ['です'],
    'ではありません (Polite negative)': ['ではありません', 'じゃないです'],
    'でした (Polite past)': ['でした'],
    'ではありませんでした (Polite past negative)': ['ではありませんでした', 'じゃなかったです'],
    '普通形 (Plain form)': ['だ'],
    'ない形 (Plain negative)': ['じゃない'],
  },
};

/** Resolve a lemma's VerbInfo, falling back to kana-shape heuristics for
 *  unknown verbs: る preceded by an i/e-row kana → ichidan, otherwise
 *  godan. Kanji-る verbs NOT in KNOWN_VERBS default to godan (the lint
 *  forces deck verbs into the map, so the default only serves free text). */
function classify(w: string): VerbInfo | null {
  const known = KNOWN_VERBS[w];
  if (known) return known;
  if (w.length >= 3 && w.endsWith('する')) return { cls: 'suru' };
  const last = w.slice(-1);
  if (!GODAN_ROWS[last]) return null; // not a verb shape
  if (last === 'る') {
    const prev = w.slice(-2, -1);
    if (/[いきぎしじちにひびみりえけげせぜてでねへべめれ]/.test(prev)) return { cls: 'ichidan' };
  }
  return { cls: 'godan' };
}

function adjTable(w: string): ConjugationTable {
  const stem = w === 'いい' ? 'よ' : w.slice(0, -1);
  return {
    infinitive: w,
    isReflexive: false,
    tenses: {
      'いです (Polite present)': [w + 'です'],
      'くないです (Polite negative)': [stem + 'くないです'],
      'かったです (Polite past)': [stem + 'かったです'],
      'くなかったです (Polite past negative)': [stem + 'くなかったです'],
      '辞書形 (Plain form)': [w],
      'て形 (Te-form)': [stem + 'くて'],
    },
  };
}

/** ます stem, て form, plain negative, plain past for one lemma. */
function stems(w: string, info: VerbInfo): { masu: string; te: string; nai: string; ta: string } | null {
  switch (info.cls) {
    case 'godan': {
      const base = w.slice(0, -1);
      const row = GODAN_ROWS[w.slice(-1)];
      if (!row) return null;
      // 行く is the one く-verb with the って sound change (行って/いって)
      const te = (w === '行く' || w === 'いく') ? base + 'って' : info.te ?? base + row.te;
      return {
        masu: base + row.i,
        te,
        nai: info.nai ?? base + row.a + 'ない',
        // た rides the て sound change (って→った, んで→んだ, いて→いた)
        ta: te.slice(0, -1) + (te.endsWith('で') ? 'だ' : 'た'),
      };
    }
    case 'ichidan': {
      const base = w.slice(0, -1);
      return { masu: base, te: base + 'て', nai: base + 'ない', ta: base + 'た' };
    }
    case 'suru': {
      const prefix = w.slice(0, -2);
      return { masu: prefix + 'し', te: prefix + 'して', nai: prefix + 'しない', ta: prefix + 'した' };
    }
    case 'kuru': {
      // 来る keeps the kanji across forms (reading changes: きます/きて/こない);
      // the kana spelling くる conjugates on き/こ.
      const k = w === '来る';
      return k
        ? { masu: '来', te: '来て', nai: '来ない', ta: '来た' }
        : { masu: 'き', te: 'きて', nai: 'こない', ta: 'きた' };
    }
    default:
      return null;
  }
}

export function conjugate(dictForm: string): ConjugationTable | null {
  if (!dictForm) return null;
  const w = dictForm.trim();
  if (w === 'です' || w === 'だ') return COPULA_TABLE;
  const info = classify(w);
  if (!info) return null;
  return tableFor(w, info);
}

/** Table for a surface + explicit class — used by conjugate() and by the
 *  reverse-map builder, which must conjugate kana spellings with the
 *  KANJI entry's class (the kana heuristic would misread しる/きる as
 *  ichidan and collide with する/来る). */
function tableFor(w: string, info: VerbInfo): ConjugationTable | null {
  if (info.cls === 'iadj') return adjTable(w);
  const s = stems(w, info);
  if (!s) return null;
  return {
    infinitive: w,
    isReflexive: false,
    tenses: {
      'ます (Polite present)': [s.masu + 'ます'],
      'ません (Polite negative)': [s.masu + 'ません'],
      'ました (Polite past)': [s.masu + 'ました'],
      'ませんでした (Polite past negative)': [s.masu + 'ませんでした'],
      'て形 (Te-form)': [s.te],
      '辞書形 (Dictionary form)': [w],
      'ない形 (Plain negative)': [s.nai],
      'た形 (Plain past)': [s.ta],
    },
  };
}

// ── findInfinitive: conjugated form → dictionary form ────────────

let REVERSE: Map<string, string> | null = null;

function buildReverse(): Map<string, string> {
  const m = new Map<string, string>();
  const add = (key: string, v: string) => {
    if (key && !m.has(key)) m.set(key, v);
  };
  const index = (surface: string, info: VerbInfo, lemma: string) => {
    const t = tableFor(surface, info);
    if (!t) return;
    for (const forms of Object.values(t.tenses)) {
      for (const f of forms) add(f, lemma);
    }
  };
  // Keys that are merely the kana spelling of another entry (くる for 来る)
  // are indexed as variants, not as their own lemma.
  const kanaOf = new Set(Object.values(KNOWN_VERBS).map((i) => i.kana).filter(Boolean));
  // Pass 1: real headword surfaces — these win every homograph tie
  // (ある's あって beats 会う's kana-variant あって).
  for (const [lemma, info] of Object.entries(KNOWN_VERBS)) {
    if (kanaOf.has(lemma)) continue;
    index(lemma, info, lemma);
  }
  for (const f of Object.values(COPULA_TABLE.tenses).flat()) add(f, 'です');
  // Pass 2: kana spellings resolve to the kanji headword, same class
  // (drop lexical overrides — they carry kanji surfaces).
  for (const [lemma, info] of Object.entries(KNOWN_VERBS)) {
    if (info.kana) index(info.kana, { cls: info.cls }, lemma);
  }
  return m;
}

export function findInfinitive(form: string): string | null {
  if (!form) return null;
  const w = form.trim();
  if (KNOWN_VERBS[w]) {
    // kana spelling of a kanji headword (くる) → the headword (来る),
    // so dictionary entries keyed on the kanji lemma resolve.
    const owner = Object.entries(KNOWN_VERBS).find(([, i]) => i.kana === w)?.[0];
    return owner ?? w;
  }
  if (!REVERSE) REVERSE = buildReverse();
  const hit = REVERSE.get(w);
  if (hit) return hit;
  // Unknown-but-regular polite forms (free text): peel ます-family endings
  // back to a dictionary form via the godan i-row / ichidan る.
  for (const end of ['ませんでした', 'ました', 'ません', 'ます']) {
    if (w.endsWith(end) && w.length > end.length) {
      const stem = w.slice(0, -end.length);
      const lastKana = stem.slice(-1);
      const godan = Object.entries(GODAN_ROWS).find(([, r]) => r.i === lastKana);
      if (godan) {
        const cand = stem.slice(0, -1) + godan[0];
        if (conjugate(cand)) return cand;
      }
      const ichidan = stem + 'る';
      if (conjugate(ichidan)) return ichidan;
    }
  }
  return null;
}
