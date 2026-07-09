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
const V = { a: 0, ya: 2, eo: 4, o: 8, wa: 9, yo: 12, u: 13, wo: 14, eu: 18, i: 20 };

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
  // wave-3 irregulars
  '낫다': '나아요',
  '붓다': '부어요',
  '어지럽다': '어지러워요',
  '미끄럽다': '미끄러워요',
  '바르다': '발라요',
  '가렵다': '가려워요',
  '나쁘다': '나빠요',
  '마르다': '말라요',
  '아름답다': '아름다워요',
  '뜨다': '떠요',
  '걱정되다': '걱정돼요',
  '누르다': '눌러요',
  '오래되다': '오래돼요',
  '기쁘다': '기뻐요',
  '이르다': '일러요',
  '빨갛다': '빨개요',
  '부럽다': '부러워요',
  '무섭다': '무서워요',
  '외롭다': '외로워요',
  '그립다': '그리워요',
  '아쉽다': '아쉬워요',
  '즐겁다': '즐거워요',
  '긴장되다': '긴장돼요',
  '기대되다': '기대돼요',
  '그렇다': '그래요',
  '곱다': '고와요',
  '기르다': '길러요',
  '따르다': '따라요',
  '주시다': '주세요',
  '찾아뵈다': '찾아뵈어요',
  '시끄럽다': '시끄러워요',
  '부드럽다': '부드러워요',
  '어둡다': '어두워요',
  '두껍다': '두꺼워요',
  '고르다': '골라요',
  // wave-4 irregulars
  '부담되다': '부담돼요',
  '부담스럽다': '부담스러워요',
  '매진되다': '매진돼요',
  '떠오르다': '떠올라요',
  '바뀌다': '바뀌어요',
  '긋다': '그어요',
  '만료되다': '만료돼요',
  '지연되다': '지연돼요',
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
  '쉽다': '쉬우', '고맙다': '고마우', '가깝다': '가까우', '반갑다': '반가우', '부드럽다': '부드러우',
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
    if (vow === 11) return stem.slice(0, -1) + compose(ini, 10, 0) + '요'; // 되 → 돼요 (X되다 compounds)
    if (vow === V.eo || vow === V.eu) return stem + '요';       // 서다 → 서요 (simplified)
    return stem + '요';
  }
  // Consonant-final stems: 아요 after ㅏ/ㅗ, 어요 otherwise
  const bright = vow === V.a || vow === V.o || vow === V.ya || vow === V.yo;
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

// ㄷ-irregular stem for honorific/conditional (듣 → 들, 걷 → 걸): ㄷ→ㄹ.
const IRREGULAR_STEM_L: Record<string, string> = { '듣다': '들', '걷다': '걸' };

// Suppletive honorific stems (ending in 시): 먹다 → 드시(다), not 먹으시다.
const HONORIFIC_STEM: Record<string, string> = {
  '먹다': '드시', '마시다': '드시', '자다': '주무시', '있다': '계시',
  '말하다': '말씀하시', '주다': '주시', '주시다': '주시',
};

/** Honorific 시-stem: 보 → 보시, 앉 → 앉으시, 살 → 사시, 듣 → 들으시, 춥 → 추우시. */
function honorificStem(dictForm: string): string | null {
  const w = dictForm.trim();
  if (!w.endsWith('다') || w.length < 2) return null;
  if (HONORIFIC_STEM[w]) return HONORIFIC_STEM[w];
  if (w.endsWith('하다')) return w.slice(0, -2) + '하시';
  if (IRREGULAR_STEM_L[w]) return IRREGULAR_STEM_L[w] + '으시';
  if (IRREGULAR_FUTURE_STEM[w]) return IRREGULAR_FUTURE_STEM[w] + '시'; // 추우시
  const stem = w.slice(0, -1);
  const d = decompose(stem[stem.length - 1]);
  if (!d) return null;
  const [ini, vow, fin] = d;
  if (fin === 0) return stem + '시';                                        // 보 → 보시
  if (fin === T_L) return stem.slice(0, -1) + compose(ini, vow, 0) + '시';  // 살 → 사시
  return stem + '으시';                                                     // 앉 → 앉으시
}

/** 높임 (Honorific): [세요, 셨어요, 셔서] from the 시-stem. */
function honorific(dictForm: string): string[] | null {
  const h = honorificStem(dictForm);
  if (!h) return null;
  const base = h.slice(0, -1); // drop 시
  return [base + '세요', base + '셨어요', base + '셔서'];
}

/** 조건 (If) -(으)면 — same (으) insertion + irregular handling as future. */
function conditional(dictForm: string): string | null {
  const w = dictForm.trim();
  if (!w.endsWith('다') || w.length < 2) return null;
  if (w.endsWith('하다')) return w.slice(0, -2) + '하면';
  if (IRREGULAR_STEM_L[w]) return IRREGULAR_STEM_L[w] + '으면';   // 들으면
  if (IRREGULAR_FUTURE_STEM[w]) return IRREGULAR_FUTURE_STEM[w] + '면'; // 추우면
  const stem = w.slice(0, -1);
  const d = decompose(stem[stem.length - 1]);
  if (!d) return null;
  if (d[2] === 0 || d[2] === T_L) return stem + '면';   // 가면, 살면
  return stem + '으면';                                  // 먹으면, 있으면
}

/** 제안·약속 (Shall/Will) -(으)ㄹ게요/-(으)ㄹ까요 — reuses the future ㄹ-stem. */
function modalLForms(dictForm: string): string[] | null {
  const fut = future(dictForm);
  if (!fut) return null;
  const lstem = fut.replace(/ 거예요$/, '');
  if (!lstem || lstem.includes(' ')) return null; // suppletive futures (θα-style) skip
  return [lstem + '게요', lstem + '까요'];
}

// ㄴ final-consonant index (for adnominal -(으)ㄴ)
const T_N = 4;

// Korean descriptive verbs (형용사): present adnominal is -(으)ㄴ (좋은, 예쁜),
// NOT the verbal -는. Existence adjectives (있다/없다 class) pattern like verbs
// (있는, 맛있는) and are excluded below.
const ADJECTIVES = new Set<string>([
  '가렵다', '가볍다', '강하다', '같다', '개운하다', '건강하다', '건조하다', '고맙다', '곱다', '괜찮다', '귀엽다', '그렇다', '그립다', '기쁘다', '길다', '깊다', '깨끗하다', '나쁘다', '넉넉하다', '넓다', '높다', '느리다', '늦다', '다르다', '달다', '답답하다', '당연하다', '덥다', '두껍다', '둥글다', '따뜻하다', '딱딱하다', '똑똑하다', '뜨겁다', '많다', '맑다', '맛없다', '맛있다', '맵다', '멋있다', '목마르다', '무겁다', '무섭다', '문제없다', '미끄럽다', '바쁘다', '바삭하다', '밝다', '배고프다', '배부르다', '복잡하다', '부담스럽다', '부드럽다', '부럽다', '부족하다', '부지런하다', '비싸다', '빠르다', '빨갛다', '뻐근하다', '뿌듯하다', '서운하다', '선선하다', '세다', '솔직하다', '쉽다', '슬프다', '습하다', '시끄럽다', '시다', '시원하다', '신선하다', '심심하다', '심하다', '싱겁다', '싸다', '쌀쌀하다', '쓸쓸하다', '아름답다', '아쉽다', '아프다', '안전하다', '얇다', '어둡다', '어렵다', '어지럽다', '예쁘다', '외롭다', '유명하다', '이르다', '작다', '재미있다', '적다', '젊다', '조용하다', '졸리다', '좁다', '좋다', '죄송하다', '중요하다', '즐겁다', '진하다', '짜다', '짧다', '차갑다', '착하다', '창백하다', '창피하다', '춥다', '충분하다', '친절하다', '크다', '편안하다', '편하다', '푹신하다', '피곤하다', '행복하다', '환하다', '후련하다', '흐리다', '힘들다',
]);

// ㅎ-irregular adjective adnominals (drop ㅎ, contract): 빨갛다 → 빨간.
const H_ADNOMINAL: Record<string, string> = {
  '빨갛다': '빨간', '노랗다': '노란', '파랗다': '파란', '하얗다': '하얀', '까맣다': '까만',
  '그렇다': '그런', '이렇다': '이런', '저렇다': '저런', '어떻다': '어떤', '동그랗다': '동그란',
};

/** Attach a ㄴ 받침 to a vowel-final syllable: 어려우 → 어려운, 예쁘 → 예쁜. */
function addNBatchim(stem: string): string {
  const d = decompose(stem[stem.length - 1]);
  if (!d) return stem + '은';
  return stem.slice(0, -1) + compose(d[0], d[1], T_N);
}

/** 관형사형 현재 (Present adnominal): verb/existence → -는, adjective → -(으)ㄴ. */
function adnominalPresent(w: string): string | null {
  if (!w.endsWith('다') || w.length < 2) return null;
  const existence = /[있없]다$/.test(w);
  if (!ADJECTIVES.has(w) || existence) {
    // verb (or 있다/없다-class) → 는
    if (w.endsWith('하다')) return w.slice(0, -2) + '하는';
    const stem = w.slice(0, -1);
    const d = decompose(stem[stem.length - 1]);
    if (!d) return null;
    if (d[2] === T_L) return stem.slice(0, -1) + compose(d[0], d[1], 0) + '는'; // 살 → 사는
    return stem + '는';
  }
  // adjective → (으)ㄴ
  if (H_ADNOMINAL[w]) return H_ADNOMINAL[w];
  if (w.endsWith('하다')) return w.slice(0, -2) + '한';
  if (IRREGULAR_FUTURE_STEM[w]) return addNBatchim(IRREGULAR_FUTURE_STEM[w]); // 어렵다 → 어려운
  const stem = w.slice(0, -1);
  const d = decompose(stem[stem.length - 1]);
  if (!d) return null;
  if (d[2] === 0) return addNBatchim(stem);                               // 예쁘 → 예쁜, 크 → 큰
  if (d[2] === T_L) return stem.slice(0, -1) + compose(d[0], d[1], T_N);  // 길 → 긴
  return stem + '은';                                                     // 좋 → 좋은, 작 → 작은
}

/** 관형사형 과거 (Past adnominal, verbs only): stem+(으)ㄴ. 가 → 간, 먹 → 먹은. */
function adnominalPast(w: string): string | null {
  if (!w.endsWith('다') || w.length < 2 || ADJECTIVES.has(w) || /[있없]다$/.test(w)) return null;
  if (w.endsWith('하다')) return w.slice(0, -2) + '한';
  if (IRREGULAR_STEM_L[w]) return IRREGULAR_STEM_L[w] + '은';   // 들은, 걸은
  if (IRREGULAR_FUTURE_STEM[w]) return addNBatchim(IRREGULAR_FUTURE_STEM[w]); // 도운
  const stem = w.slice(0, -1);
  const d = decompose(stem[stem.length - 1]);
  if (!d) return null;
  if (d[2] === 0 || d[2] === T_L) return addNBatchim(d[2] === T_L ? stem.slice(0, -1) + compose(d[0], d[1], 0) : stem); // 가→간, 살→산
  return stem + '은';                                          // 먹은, 읽은
}

/** 기타 (Other productive endings): -겠어요, -지, -어야, -(으)면서, -(으)니까, -(으)러. */
function otherForms(w: string, polite: string): string[] {
  const out: string[] = [];
  const plain = w.slice(0, -1);
  out.push(plain + '겠어요');                         // intention/conjecture
  out.push(plain + '지');                             // -지 않아요/마세요
  out.push(plain + '기');                             // -기 nominalizer (하기, 먹기)
  const conn = polite.endsWith('요') ? polite.slice(0, -1) : polite;
  out.push(conn + '야');                              // -어야 해요/돼요
  const cond = conditional(w);                        // irregular-aware -(으)면
  if (cond) {
    out.push(cond + '서');                            // -(으)면서 (while) — ㄹ kept
    if (!ADJECTIVES.has(w)) out.push(cond.replace(/면$/, '러')); // -(으)러 (purpose, verbs)
  }
  // -(으)니까 (because): ㄹ-stems DROP ㄹ before ㄴ (사니까, not 살니까)
  const nstem = w.slice(0, -1);
  const nd = decompose(nstem[nstem.length - 1]);
  if (w.endsWith('하다')) out.push(w.slice(0, -2) + '하니까');
  else if (IRREGULAR_STEM_L[w]) out.push(IRREGULAR_STEM_L[w] + '으니까');
  else if (IRREGULAR_FUTURE_STEM[w]) out.push(IRREGULAR_FUTURE_STEM[w] + '니까');
  else if (nd && nd[2] === T_L) out.push(nstem.slice(0, -1) + compose(nd[0], nd[1], 0) + '니까');
  else if (nd && nd[2] === 0) out.push(nstem + '니까');
  else if (nd) out.push(nstem + '으니까');
  return out;
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
  if (w === '이다') {
    // copula connective/adnominal: 학생이라서 (because it's), 학생인 사람
    tenses['연결형 (Connective)'] = ['이라서', '여서'];
    tenses['관형사형 (Adnominal)'] = ['인'];
  } else if (w === '아니다') {
    tenses['관형사형 (Adnominal)'] = ['아닌'];
  } else if (w !== '이시다') {
    // -어/아 (before auxiliaries 봐요/주세요), -아서/-어서 (and so / because),
    // and stem+고 chaining. All three ride the polite stem's harmony.
    const conn = polite.endsWith('요') ? polite.slice(0, -1) : polite;
    tenses['연결형 (Connective)'] = [conn, conn + '서', w.slice(0, -1) + '고'];
    const cond = conditional(w);
    if (cond) tenses['조건 (If)'] = [cond];
    const modal = modalLForms(w);
    if (modal) tenses['제안·약속 (Shall/Will)'] = modal;
    const hon = honorific(w);
    if (hon) tenses['높임 (Honorific)'] = hon;
    // 관형사형 (Adnominal): present (verb -는 / adjective -(으)ㄴ) + past (verbs)
    const adn = [adnominalPresent(w), adnominalPast(w)].filter(Boolean) as string[];
    if (adn.length) tenses['관형사형 (Adnominal)'] = adn;
    tenses['기타 (Other)'] = otherForms(w, polite);
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
  // wave-3 verbs
  '가득하다', '가렵다', '가져가다', '가져오다', '가지다', '감동하다', '감사드리다', '감사하다', '강하다', '갚다', '개운하다', '걱정되다', '걱정하다', '건강하다', '건조하다', '게임하다', '결정하다', '결제하다', '고르다', '곱다', '공감하다', '괜찮아지다', '궁금하다', '그렇다', '그립다', '그치다', '기대되다', '기르다', '기쁘다', '기침하다', '긴장되다', '깊다', '깨끗하다', '깨지다', '꺼내다', '꺼지다', '꽂다', '끊기다', '끝내다', '끼다', '나누다', '나다', '나쁘다', '낚시하다', '날리다', '날아가다', '남기다', '남다', '낫다', '낮다', '낳다', '내려놓다', '넉넉하다', '넘어지다', '넣다', '노래하다', '녹다', '놀라다', '높다', '놓이다', '누르다', '다치다', '달리다', '닳다', '담다', '답답하다', '당연하다', '동의하다', '두껍다', '둘러앉다', '둥글다', '드리다', '들다', '등록하다', '등산하다', '따르다', '딱딱하다', '떠나다', '떨어뜨리다', '떨어지다', '뜨다', '뜻하다', '마르다', '맡기다', '멈추다', '모시다', '모이다', '모자라다', '못하다', '무섭다', '묵다', '문제없다', '미끄럽다', '믿다', '바르다', '밝다', '부드럽다', '부럽다', '부지런하다', '부치다', '부탁하다', '붓다', '비우다', '빌다', '빌리다', '빚다', '빠뜨리다', '빨갛다', '뻐근하다', '뿌듯하다', '삭제하다', '생각나다', '생각하다', '서다', '서운하다', '선선하다', '설치하다', '솔직하다', '습하다', '시끄럽다', '신나다', '실망하다', '실수하다', '심심하다', '싸우다', '쌀쌀하다', '쓸쓸하다', '아끼다', '아름답다', '아쉽다', '안전하다', '않다', '알리다', '얇다', '어기다', '어둡다', '어지럽다', '얼다', '업데이트하다', '연락하다', '오래되다', '올라가다', '올리다', '외롭다', '원하다', '응원하다', '이기다', '이르다', '이야기하다', '이해하다', '입력하다', '잊어버리다', '자라다', '재다', '저장하다', '전하다', '정하다', '젖다', '졸리다', '졸업하다', '좁다', '주시다', '줄다', '줄이다', '중요하다', '즐겁다', '지나다', '지다', '지우다', '차려입다', '차리다', '찬성하다', '창백하다', '창피하다', '찾아뵈다', '챙기다', '처방하다', '체크아웃하다', '체크인하다', '추워지다', '충분하다', '취소하다', '치다', '켜지다', '토하다', '통하다', '통화하다', '틀리다', '팔리다', '편안하다', '편집하다', '푹신하다', '풀다', '풀리다', '합격하다', '행복하다', '환하다', '후련하다', '흔들리다',
  // wave-4 verbs
  '가능하다', '가입하다', '갈리다', '개설하다', '검색하다', '경유하다', '고민하다', '고백하다', '관광하다', '관리하다', '구독하다', '구하다', '궁금해하다', '그리다', '그리워하다', '긁다', '급하다', '긋다', '기도하다', '기억하다', '긴장하다', '깔다', '꾸미다', '끊다', '나아지다', '낯설다', '내밀다', '넓어지다', '넘다', '노력하다', '높이다', '느끼다', '늘다', '다가오다', '다양하다', '다운로드하다', '다투다', '담기다', '담담하다', '대답하다', '던지다', '덧붙이다', '데려가다', '데려다주다', '두다', '들어가다', '들어오다', '따다', '떠들다', '떠오르다', '떨다', '떨리다', '만들어지다', '만료되다', '만족하다', '많아지다', '말다툼하다', '말씀드리다', '맡다', '매다', '매진되다', '머물다', '미안하다', '바뀌다', '바라다', '반대하다', '반하다', '방송하다', '백업하다', '복습하다', '부담되다', '부담스럽다', '부딪치다', '부러워하다', '부족하다', '불편하다', '붐비다', '붙다', '비슷하다', '빌려주다', '빠지다', '빨라지다', '빼다', '뻗다', '뽑다', '사과하다', '사라지다', '사소하다', '살리다', '새우다', '선물하다', '설레다', '설명하다', '소중하다', '속상하다', '속상해하다', '손꼽다', '송금하다', '승진하다', '신고하다', '신청하다', '싫다', '심각하다', '싶어하다', '쌓다', '쌓이다', '쏟다', '아쉬워하다', '안다', '앞두다', '약혼하다', '양보하다', '어려워하다', '어리다', '여쭤보다', '연장하다', '연주하다', '열리다', '예민해지다', '예습하다', '오해하다', '올라오다', '옮기다', '완벽하다', '외우다', '외치다', '요약하다', '요청하다', '우렁차다', '우아하다', '우울하다', '울다', '웅장하다', '위로하다', '위하다', '유명해지다', '유용하다', '이용하다', '이직하다', '이체하다', '익숙해지다', '인사하다', '인정받다', '인정하다', '입금하다', '입사하다', '입학하다', '잘못하다', '잡히다', '저렴하다', '저축하다', '적다', '적응하다', '적히다', '전공하다', '정주행하다', '정해지다', '제출하다', '존경하다', '존중하다', '졸다', '좋아지다', '즐기다', '지연되다', '지원하다', '지지하다', '짜증나다', '차다', '차단하다', '참다', '찾아보다', '처리하다', '축복하다', '취직하다', '친하다', '친해지다', '칭찬하다', '캡처하다', '키우다', '토론하다', '통과하다', '퇴사하다', '투자하다', '팔로우하다', '편해지다', '포기하다', '헤매다', '헤어지다', '협력하다', '혼나다', '화내다', '화려하다', '화해하다', '환급받다', '환전하다', '후회하다', '훌륭하다', '흔들다', '흘리다', '힘들어하다', '힘차다',
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
