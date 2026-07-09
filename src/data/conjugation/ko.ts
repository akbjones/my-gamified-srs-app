/**
 * Korean conjugation engine — Stage-1 scaffold.
 *
 * Canonical speech level: 해요체 (polite informal) per the register
 * policy — every table row is the -요 form.
 *
 * Stage 2 adds 과거 (past: haeyo form + ㅆ 받침 → 갔어요/먹었어요, with
 * the copula family as explicit irregulars) and 미래 (future: stem +
 * (으)ㄹ 거예요, with ㄹ-stem, ㅂ-irregular and ㄷ-irregular handling).
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
  '이시다': '이세요', // honorific copula (박 선생님이세요)
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
  // wave-2 irregulars
  '쉬다': '쉬어요',
  '슬프다': '슬퍼요',
  '모으다': '모아요',
  '사귀다': '사귀어요',
  '배고프다': '배고파요',
  '목마르다': '목말라요',
  '맵다': '매워요',
  '뜨겁다': '뜨거워요',
  '차갑다': '차가워요',
  '싱겁다': '싱거워요',
  '배부르다': '배불러요',
  '빠르다': '빨라요',
  '굽다': '구워요',
  '예쁘다': '예뻐요',
  '귀엽다': '귀여워요',
  '가볍다': '가벼워요',
  '무겁다': '무거워요',
  '계시다': '계세요',
  '드시다': '드세요',
  '끄다': '꺼요',
  '오르다': '올라요',
  '시작되다': '시작돼요',
};

// Past forms the ㅆ-받침 algebra can't derive (copula/honorific family).
const IRREGULAR_PAST: Record<string, string> = {
  '이다': '이었어요',   // + 였어요 allomorph added in the table row
  '이시다': '이셨어요',
  '아니다': '아니었어요',
};

// Future attachment stems for irregular classes: the (으)ㄹ attaches to a
// MODIFIED stem for ㅂ-irregulars (춥 → 추우 + ㄹ → 추울 거예요) and
// ㄷ-irregulars (듣 → 들 + 을 → 들을 거예요).
const IRREGULAR_FUTURE_STEM: Record<string, string> = {
  '돕다': '도우', '춥다': '추우', '덥다': '더우', '어렵다': '어려우',
  '쉽다': '쉬우', '고맙다': '고마우', '가깝다': '가까우', '반갑다': '반가우',
};

// ㄷ-irregulars mutate ㄷ→ㄹ but still take 을 (들을 거예요), so the
// (으)ㄹ algebra can't place them — full futures instead.
const IRREGULAR_FUTURE: Record<string, string> = {
  '듣다': '들을 거예요',
  '걷다': '걸을 거예요',
  '어떻다': '어떨 거예요',
};

/** Derive the 해요체 (polite present) form of a -다 dictionary form. */
export function haeyo(dictForm: string): string | null {
  const w = dictForm.trim();
  if (!w.endsWith('다') || w.length < 2) return null;
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

// ㅆ final-consonant index in the jamo block
const T_SS = 20;
// ㄹ final-consonant index
const T_L = 8;

/** 과거 (past): polite form minus 요, ㅆ 받침 on the last syllable, + 어요. */
export function past(dictForm: string): string | null {
  const w = dictForm.trim();
  if (IRREGULAR_PAST[w]) return IRREGULAR_PAST[w];
  const polite = haeyo(w);
  if (!polite) return null;
  const pre = polite.slice(0, -1); // strip 요
  const last = pre[pre.length - 1];
  const d = decompose(last);
  if (!d || d[2] !== 0) return null; // last syllable must be open
  return pre.slice(0, -1) + compose(d[0], d[1], T_SS) + '어요';
}

/** 미래 (future): stem + (으)ㄹ 거예요. */
export function future(dictForm: string): string | null {
  const w = dictForm.trim();
  if (!w.endsWith('다')) return null;
  if (IRREGULAR_FUTURE[w]) return IRREGULAR_FUTURE[w];
  const stem = IRREGULAR_FUTURE_STEM[w] ?? w.slice(0, -1);
  const last = stem[stem.length - 1];
  const d = decompose(last);
  if (!d) return null;
  const [ini, vow, fin] = d;
  if (fin === 0) {
    // vowel-final (incl. modified ㅂ-irregular stems): attach ㄹ 받침
    return stem.slice(0, -1) + compose(ini, vow, T_L) + ' 거예요';
  }
  if (fin === T_L) return stem + ' 거예요'; // ㄹ-stem: 살다 → 살 거예요
  return stem + '을 거예요'; // consonant-final: 먹다 → 먹을 거예요
}

export function conjugate(dictForm: string): ConjugationTable | null {
  if (!dictForm) return null;
  const w = dictForm.trim();
  const polite = haeyo(w);
  if (!polite) return null;
  // The copula has two 해요체 allomorphs: 이에요 after consonant-final
  // nouns, 예요 after vowel-final (학생이에요 / 친구예요).
  const politeRow = w === '이다' ? ['이에요', '예요'] : [polite];
  const tenses: Record<string, string[]> = {
    '해요체 (Polite present)': politeRow,
  };
  const pst = past(w);
  if (pst) tenses['과거 (Past)'] = w === '이다' ? [pst, '였어요'] : [pst];
  const fut = future(w);
  if (fut) tenses['미래 (Future)'] = w === '이다' ? ['일 거예요'] : [fut];
  // connectives: -어/아 (before auxiliaries 봐요/주세요) and stem+고
  if (w !== '이다' && w !== '이시다' && w !== '아니다') {
    const conn = polite.endsWith('요') ? polite.slice(0, -1) : polite;
    tenses['연결형 (Connective)'] = [conn, w.slice(0, -1) + '고'];
  }
  tenses['사전형 (Dictionary form)'] = [w];
  return {
    infinitive: w,
    isReflexive: false,
    tenses,
  };
}

// ── findInfinitive: conjugated form → dictionary form ────────────

let REVERSE: Map<string, string> | null = null;

/** Dictionary forms the reverse map is seeded from — grows with the deck. */
export const KNOWN_VERBS = [
  '이다', '이시다', '아니다', '있다', '없다',
  '걸리다', '괜찮다', '끝나다', '만나다', '맛있다', '맞다', '비싸다', '사다', '산책하다', '샤워하다', '쇼핑하다', '숙제하다', '싸다', '웃다', '일어나다', '자다', '작다', '좋다', '죄송하다', '청소하다', '타다', '필요하다',
  '가다', '오다', '보다', '주다', '되다', '하다', '먹다', '읽다', '앉다',
  '입다', '찾다', '받다', '살다', '알다', '만들다', '듣다', '걷다',
  '마시다', '가르치다', '기다리다', '배우다', '쓰다', '크다', '바쁘다',
  '아프다', '모르다', '다르다', '부르다', '돕다', '춥다', '덥다',
  '어렵다', '쉽다', '고맙다', '공부하다', '일하다', '말하다', '좋아하다',
  '사랑하다', '전화하다', '운동하다', '요리하다', '시작하다', '도착하다',
  // wave-2 verbs
  '가볍다', '갈아타다', '같다', '건너다', '결혼하다', '계산하다', '계시다', '구경하다', '굽다', '귀엽다', '길다', '깎다', '끄다', '끓이다', '나가다', '나오다', '내다', '내리다', '넓다', '놀다', '놓다', '놓치다', '느리다', '늦다', '다니다', '닦다', '달다', '닮다', '도와주다', '돌리다', '돌아오다', '드시다', '따뜻하다', '똑똑하다', '뜨겁다', '막히다', '많다', '맑다', '맛없다', '맞추다', '맵다', '멋있다', '모으다', '목마르다', '무겁다', '물어보다', '바꾸다', '바삭하다', '발표하다', '배고프다', '배부르다', '버리다', '보내다', '보이다', '복잡하다', '불다', '빠르다', '빨다', '빨래하다', '사귀다', '생기다', '세다', '세우다', '세일하다', '소개하다', '수고하다', '수영하다', '쉬다', '슬프다', '시다', '시원하다', '시작되다', '시키다', '신다', '신선하다', '심다', '심하다', '싱겁다', '싶다', '야근하다', '어울리다', '여행하다', '연습하다', '예매하다', '예쁘다', '예약하다', '오르다', '외식하다', '유명하다', '이사하다', '잃다', '잃어버리다', '잊다', '잘하다', '잡다', '재미있다', '젊다', '정리하다', '조용하다', '주문하다', '준비하다', '지내다', '지키다', '진하다', '질문하다', '짜다', '짧다', '찍다', '차갑다', '착하다', '초대하다', '추천하다', '축하하다', '출근하다', '출발하다', '충전하다', '친절하다', '카톡하다', '켜다', '퇴근하다', '팔다', '편하다', '피곤하다', '피다', '확인하다', '환불하다', '흐리다', '힘들다',
];

function buildReverse(): Map<string, string> {
  const m = new Map<string, string>();
  const add = (key: string, v: string) => {
    if (key && !m.has(key)) m.set(key, v);
  };
  for (const v of new Set([...KNOWN_VERBS, ...Object.keys(IRREGULARS)])) {
    const t = conjugate(v);
    if (!t) continue;
    for (const forms of Object.values(t.tenses)) {
      for (const f of forms) {
        if (f.includes(' ')) {
          // future 갈 거예요: index the stem word — 갈 → 가다
          add(f.split(' ')[0], v);
        } else {
          add(f, v);
          // bare form without -요 (해체/banmal): 가요 → 가, 갔어요 → 갔어
          if (f.endsWith('요')) add(f.slice(0, -1), v);
        }
      }
    }
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
