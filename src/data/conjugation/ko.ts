/**
 * Korean conjugation engine — Stage-1 scaffold.
 *
 * Canonical speech level: 해요체 (polite informal) per the register
 * policy — every table row is the -요 form. The pilot stage adds
 * 합니다체 rows and past/future tenses.
 *
 * The scaffold covers the three conjugation classes that matter first:
 * - vowel-harmony contraction: 가다 → 가요, 오다 → 와요, 먹다 → 먹어요
 * - 하다 verbs: 하다 → 해요, 공부하다 → 공부해요
 * - ㅂ-irregulars: 돕다 → 도와요, 춥다 → 추워요 (seeded via IRREGULARS)
 *
 * Hangul is decomposed algebraically (jamo arithmetic on the syllable
 * block range U+AC00–U+D7A3) — no lookup tables of syllables.
 */

export interface ConjugationTable {
  infinitive: string; // dictionary form (-다)
  isReflexive: boolean;
  tenses: Record<string, string[]>;
}

const S_BASE = 0xac00;
const V_COUNT = 21, T_COUNT = 28;

/** Decompose a Hangul syllable into [initial, vowel, final] indices. */
function decompose(ch: string): [number, number, number] | null {
  const c = ch.charCodeAt(0) - S_BASE;
  if (c < 0 || c > 11171) return null;
  return [Math.floor(c / (V_COUNT * T_COUNT)), Math.floor((c % (V_COUNT * T_COUNT)) / T_COUNT), c % T_COUNT];
}

function compose(ini: number, vow: number, fin: number): string {
  return String.fromCharCode(S_BASE + ini * V_COUNT * T_COUNT + vow * T_COUNT + fin);
}

// Vowel indices: ㅏ=0 ㅐ=1 ㅑ=2 ㅒ=3 ㅓ=4 ㅔ=5 ㅕ=6 ㅖ=7 ㅗ=8 ㅘ=9 ㅙ=10 ㅚ=11 ㅛ=12 ㅜ=13 ㅝ=14 ㅞ=15 ㅟ=16 ㅠ=17 ㅡ=18 ㅢ=19 ㅣ=20
const V = { a: 0, eo: 4, o: 8, wa: 9, u: 13, wo: 14, eu: 18, i: 20 };

// Full 해요체 forms for stems the algebra can't derive (irregulars).
const IRREGULARS: Record<string, string> = {
  '이다': '이에요',   // copula "to be" (X이에요/예요)
  '아니다': '아니에요', // negative copula
  '하다': '해요',
  '가깝다': '가까워요',
  '닫다': '닫아요',
  '멀다': '멀어요',
  '반갑다': '반가워요',
  '씻다': '씻어요',
  '어떻다': '어때요',
  '열다': '열어요',
  '돕다': '도와요',
  '춥다': '추워요',
  '덥다': '더워요',
  '어렵다': '어려워요',
  '쉽다': '쉬워요',
  '고맙다': '고마워요',
  '듣다': '들어요',   // ㄷ-irregular
  '걷다': '걸어요',
  '살다': '살아요',   // ㄹ stems keep ㄹ before -아/어
  '알다': '알아요',
  '만들다': '만들어요',
  '모르다': '몰라요', // 르-irregular
  '다르다': '달라요',
  '부르다': '불러요',
  '쓰다': '써요',     // ㅡ-drop
  '바쁘다': '바빠요',
  '아프다': '아파요',
  '크다': '커요',
  '마시다': '마셔요',
  '가르치다': '가르쳐요',
  '기다리다': '기다려요',
  '되다': '돼요',
  '보다': '봐요',
  '오다': '와요',
  '주다': '줘요',
  '배우다': '배워요',
};

/** Derive the 해요체 (polite present) form of a -다 dictionary form. */
export function haeyo(dictForm: string): string | null {
  const w = dictForm.trim();
  if (!w.endsWith('다')) return null;
  if (IRREGULARS[w]) return IRREGULARS[w];
  // X하다 compounds → X해요 (공부하다 → 공부해요)
  if (w.endsWith('하다')) return w.slice(0, -2) + '해요';

  const stem = w.slice(0, -1);
  const last = stem[stem.length - 1];
  const d = decompose(last);
  if (!d) return null;
  const [ini, vow, fin] = d;

  // Vowel-final stems contract
  if (fin === 0) {
    if (vow === V.a) return stem + '요';                       // 가다 → 가요
    if (vow === V.o) return stem.slice(0, -1) + compose(ini, V.wa, 0) + '요';  // 오다 → 와요
    if (vow === V.u) return stem.slice(0, -1) + compose(ini, V.wo, 0) + '요';  // 주다 → 줘요
    if (vow === V.i) return stem.slice(0, -1) + compose(ini, 6, 0) + '요';     // 마시다 → 마셔요 (ㅕ)
    if (vow === V.eo || vow === V.eu) return stem + '요';       // 서다 → 서요 (simplified)
    return stem + '요';
  }
  // Consonant-final stems: 아요 after ㅏ/ㅗ, 어요 otherwise
  const bright = vow === V.a || vow === V.o;
  return stem + (bright ? '아요' : '어요');
}

export function conjugate(dictForm: string): ConjugationTable | null {
  if (!dictForm) return null;
  const w = dictForm.trim();
  const polite = haeyo(w);
  if (!polite) return null;
  // The copula has two 해요체 allomorphs: 이에요 after consonant-final
  // nouns, 예요 after vowel-final (학생이에요 / 친구예요).
  const politeRow = w === '이다' ? ['이에요', '예요'] : [polite];
  return {
    infinitive: w,
    isReflexive: false,
    tenses: {
      '해요체 (Polite present)': politeRow,
      '사전형 (Dictionary form)': [w],
    },
  };
}

// ── findInfinitive: conjugated form → dictionary form ────────────

let REVERSE: Map<string, string> | null = null;

/** Dictionary forms the reverse map is seeded from — grows with the deck. */
export const KNOWN_VERBS = [
  '이다', '아니다', '있다', '없다',
  '걸리다', '괜찮다', '끝나다', '만나다', '맛있다', '맞다', '비싸다', '사다', '산책하다', '샤워하다', '쇼핑하다', '숙제하다', '싸다', '웃다', '일어나다', '자다', '작다', '좋다', '죄송하다', '청소하다', '타다', '필요하다',
  '가다', '오다', '보다', '주다', '되다', '하다', '먹다', '읽다', '앉다',
  '입다', '찾다', '받다', '살다', '알다', '만들다', '듣다', '걷다',
  '마시다', '가르치다', '기다리다', '배우다', '쓰다', '크다', '바쁘다',
  '아프다', '모르다', '다르다', '부르다', '돕다', '춥다', '덥다',
  '어렵다', '쉽다', '고맙다', '공부하다', '일하다', '말하다', '좋아하다',
  '사랑하다', '전화하다', '운동하다', '요리하다', '시작하다', '도착하다',
];

function buildReverse(): Map<string, string> {
  const m = new Map<string, string>();
  for (const v of KNOWN_VERBS) {
    const p = haeyo(v);
    if (!p) continue;
    if (!m.has(p)) m.set(p, v);
    // bare form without -요 (해체/banmal): 가요 → 가
    const bare = p.slice(0, -1);
    if (bare && !m.has(bare)) m.set(bare, v);
  }
  return m;
}

export function findInfinitive(form: string): string | null {
  if (!form) return null;
  const w = form.trim();
  if (w.endsWith('다') && haeyo(w)) return w; // already a dictionary form
  if (!REVERSE) REVERSE = buildReverse();
  return REVERSE.get(w) ?? null;
}
