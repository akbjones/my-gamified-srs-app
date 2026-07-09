import { lookupWord } from '../../src/data/dictionary/ko';
import { findInfinitive, haeyo, past, future } from '../../src/data/conjugation/ko';
import * as fs from 'fs';
import * as path from 'path';

const HERE = '/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones/scripts/tmp';
const cards = JSON.parse(fs.readFileSync(path.join(HERE, 'wave4-ko-cards-C.json'), 'utf8'));
const engineCovered: string[] = JSON.parse(fs.readFileSync(path.join(HERE, '_koC_coveredverbs.json'), 'utf8'));
const ENGINE = new Set(engineCovered);

// ── jamo ──
const S = 0xac00, VC = 21, TC = 28;
function dec(ch: string): [number, number, number] | null { const c = ch.charCodeAt(0) - S; if (c < 0 || c > 11171) return null; return [Math.floor(c / (VC * TC)), Math.floor((c % (VC * TC)) / TC), c % TC]; }
function comp(i: number, v: number, t: number) { return String.fromCharCode(S + i * VC * TC + v * TC + t); }
const T_L = 8, T_N = 4;
const CHO = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
const JUNG = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'yeo', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
const JONG = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'p', 'l', 't', 'p', 'p', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];
function rr(w: string): string { let o = ''; for (const ch of w) { const d = dec(ch); if (!d) { continue; } o += CHO[d[0]] + JUNG[d[1]] + JONG[d[2]]; } return o; }

// ── morphology helpers (для surface generation) ──
function euStem(w: string): string | null { // stem with (으) — mirrors conditional()
  if (!w.endsWith('다')) return null;
  if (w.endsWith('하다')) return w.slice(0, -2) + '하';
  const stem = w.slice(0, -1); const d = dec(stem[stem.length - 1]); if (!d) return null;
  if (d[2] === 0 || d[2] === T_L) return stem; // vowel/ㄹ: no 으
  return stem + '으';
}
function adnPresent(w: string): string | null { // -는 (verbs)
  const stem = w.slice(0, -1); const last = stem[stem.length - 1]; const d = dec(last); if (!d) return null;
  if (d[2] === T_L) return stem.slice(0, -1) + comp(d[0], d[1], 0) + '는'; // ㄹ drop: 만들→만드는
  return stem + '는';
}
function adnMod(w: string): string | null { // -(으)ㄴ  (past for verbs / present for adj)
  if (w.endsWith('하다')) return w.slice(0, -2) + '한';
  const stem = w.slice(0, -1); const last = stem[stem.length - 1]; const d = dec(last); if (!d) return null;
  if (d[2] === 0) return stem.slice(0, -1) + comp(d[0], d[1], T_N); // vowel→ㄴ받침: 어리→어린
  if (d[2] === T_L) return stem.slice(0, -1) + comp(d[0], d[1], T_N); // ㄹ→ㄴ: 만들→만든
  return stem + '은'; // consonant: 먹→먹은
}
function prospective(w: string): string | null { const f = future(w); if (!f) return null; const s = f.replace(/ 거예요$/, ''); return s.includes(' ') ? null : s; }
function honStem(w: string): string | null {
  if (w.endsWith('하다')) return w.slice(0, -2) + '하시';
  const stem = w.slice(0, -1); const d = dec(stem[stem.length - 1]); if (!d) return null;
  if (d[2] === 0) return stem + '시';
  if (d[2] === T_L) return stem.slice(0, -1) + comp(d[0], d[1], 0) + '시';
  return stem + '으시';
}

function surfacesFor(w: string): string[] {
  const out: string[] = [];
  const hy = haeyo(w); if (hy) { out.push(hy); if (hy.endsWith('요')) out.push(hy.slice(0, -1)); }
  const p = past(w); if (p) out.push(p);
  const f = future(w); if (f) out.push(f.split(' ')[0]);
  const stem = w.endsWith('다') ? w.slice(0, -1) : w;
  out.push(stem + '고', stem + '지', stem + '게', stem + '기', stem + '기가', stem + '기로', stem + '지만', stem + '자마자', stem + '자', stem + '도록');
  const eu = euStem(w); if (eu) out.push(eu + '면', eu + '면서', eu + '니까', eu + '며', eu + '려고');
  const ap = adnPresent(w); if (ap) out.push(ap);
  const am = adnMod(w); if (am) out.push(am);
  const pr = prospective(w); if (pr) out.push(pr, pr + '게요', pr + '까요', pr + '지', pr + '수록'); // future stem, -ㄹ게요, -ㄹ까요, -ㄹ지, -ㄹ수록
  const hs = honStem(w); if (hs) { const b = hs.slice(0, -1); out.push(b + '세요', b + '셨어요', b + '셔서'); }
  if (hy) out.push(hy.slice(0, -1) + '서', hy.slice(0, -1) + '야'); // -어서 / -어야
  return out.filter(Boolean);
}

// ── content tables ──
type V = [string, string, string?]; // [dictform, en, irregularHaeyo?]
const LEMMA: V[] = [
  // new verbs / adjectives used in the slice
  ['매진되다', 'to sell out', '매진돼요'], ['떠오르다', 'to come to mind, occur', '떠올라요'], ['바뀌다', 'to change, be replaced', '바뀌어요'],
  ['반대하다', 'to oppose, object'], ['반하다', 'to fall for, be charmed'], ['다투다', 'to quarrel, argue'],
  ['그리워하다', 'to miss (3rd person)'], ['부러워하다', 'to envy (3rd person)'], ['힘들어하다', 'to have a hard time (3rd person)'],
  ['끊다', 'to cut off, quit'], ['내밀다', 'to hold out, reach out'], ['넘다', 'to exceed, go over'],
  ['그리다', 'to draw, paint'], ['고백하다', 'to confess (feelings)'], ['데려가다', 'to take (someone) along'],
  ['데려다주다', 'to see/walk (someone) to'], ['던지다', 'to throw'], ['떨다', 'to shake; (수다를) chatter'],
  ['만들어지다', 'to be made'], ['말다툼하다', 'to have an argument'], ['말씀드리다', 'to tell (humble)'],
  ['바라다', 'to hope, wish'], ['방송하다', 'to broadcast, air'], ['부딪치다', 'to clash, collide'],
  ['붐비다', 'to be crowded'], ['빌려주다', 'to lend'], ['빨라지다', 'to get faster'],
  ['사과하다', 'to apologize'], ['사라지다', 'to disappear'], ['선물하다', 'to give as a gift'],
  ['설명하다', 'to explain'], ['소중하다', 'to be precious'], ['손꼽다', 'to count on fingers; to eagerly await'],
  ['약혼하다', 'to get engaged'], ['양보하다', 'to yield, give way'], ['연주하다', 'to perform (music)'],
  ['열리다', 'to be open, be held'], ['외우다', 'to memorize'], ['외치다', 'to shout'],
  ['우렁차다', 'to be resounding, loud'], ['우아하다', 'to be elegant'], ['울다', 'to cry'],
  ['웅장하다', 'to be grand, majestic'], ['위로하다', 'to comfort, console'], ['유명해지다', 'to become famous'],
  ['좋아지다', 'to get better, improve'], ['지키다', 'to protect, keep'], ['참다', 'to endure, hold in'],
  ['축복하다', 'to bless'], ['친해지다', 'to become close'], ['편해지다', 'to become comfortable'],
  ['화내다', 'to get angry'], ['화려하다', 'to be splendid, dazzling'], ['화해하다', 'to reconcile, make up'],
  ['후회하다', 'to regret'], ['훌륭하다', 'to be excellent'], ['흔들다', 'to shake, wave'],
  ['흘리다', 'to shed, spill'], ['힘차다', 'to be powerful, vigorous'], ['가입하다', 'to join, sign up'],
  ['기억하다', 'to remember'], ['긴장하다', 'to get nervous'], ['부족하다', 'to be lacking, insufficient'],
  ['담담하다', 'to be calm, composed'], ['어리다', 'to be young'], ['친하다', 'to be close (friends)'],
  ['헤어지다', 'to break up, part'], ['끝나다', 'to end, finish'],
  ['사소하다', 'to be trivial, minor'], ['비슷하다', 'to be similar'], ['불편하다', 'to be uncomfortable'],
  ['부담스럽다', 'to feel burdensome', '부담스러워요'], ['가능하다', 'to be possible'], ['시작하다', 'to start, begin'],
  ['들어오다', 'to come in, enter'], ['높이다', 'to raise, lift'], ['지나다', 'to pass (of time)'],
  ['이야기하다', 'to talk, tell a story'], ['풀리다', 'to be resolved, ease up'], ['잘못하다', 'to do wrong, be at fault'],
  ['미안하다', 'to be sorry'], ['안다', 'to hug, hold'], ['하다', 'to do'], ['않다', 'to not do (long negation)'],
  ['이해하다', 'to understand'], ['못하다', 'to be unable'], ['위하다', 'to be for the sake of'], ['구하다', 'to obtain, get'],
  ['사귀다', 'to date, make friends'], ['나오다', 'to come out'], ['입다', 'to wear'], ['나다', 'to occur; (아/어) after doing'],
  ['죄송하다', 'to be sorry (humble)'], ['걱정하다', 'to worry'],
  ['말하다', 'to speak, say'], ['보다', 'to see, watch'], ['읽다', 'to read'], ['짧다', 'to be short'],
  ['가다', 'to go'], ['모르다', 'to not know'], ['편하다', 'to be comfortable'], ['긋다', 'to draw (a line)', '그어요'],
  // reused verbs/adjs whose adnominal/other surfaces appear (kept in LEMMA for surface-map + gloss; skipped from verbs-C if engine-covered)
  ['좋아하다', 'to like'], ['이해하다', 'to understand'], ['좋다', 'to be good'], ['많다', 'to be many, much'],
  ['젊다', 'to be young'], ['있다', 'to exist, have'], ['치다', 'to hit, play (percussion)'], ['유명하다', 'to be famous'],
  ['그치다', 'to stop'], ['담기다', 'to be contained'], ['적히다', 'to be written'],
];
const IRREG_HAEYO: Record<string, string> = {};
for (const [d, , h] of LEMMA) if (h) IRREG_HAEYO[d] = h;
const LEMMA_EN: Record<string, string> = {};
for (const [d, en] of LEMMA) LEMMA_EN[d] = en;

const NOUN: Record<string, string> = {
  '가사': 'lyrics', '가야금': 'gayageum (12-string zither)', '갈등': 'conflict', '결말': 'ending (of a story)',
  '결정': 'decision', '결혼': 'marriage', '결혼반지': 'wedding ring', '결혼사진': 'wedding photo',
  '고수': 'gosu (pansori drummer)', '곡': 'song (counter)', '공식': 'official', '공연': 'performance',
  '공연장': 'performance venue', '관객': 'audience member', '관광객': 'tourist', '관심': 'interest',
  '광고': 'advertisement', '국악': 'traditional Korean music', '권': 'volume (book counter)', '그녀': 'she, her',
  '그들': 'they, them', '그룹': 'group', '그림책': 'picture book', '극장': 'theater, cinema',
  '기대': 'expectation', '기부': 'donation', '기억': 'memory', '꽹과리': 'kkwaenggwari (small gong)',
  '남자친구': 'boyfriend', '넷플릭스': 'Netflix', '노력': 'effort', '농악': "farmers' percussion music",
  '대화': 'conversation', '데뷔': 'debut', '데이트': 'a date', '도록': 'art catalog', '동작': 'movement, motion',
  '동화책': 'storybook, fairy-tale book', '뒷이야기': 'behind-the-scenes story', '마을': 'village',
  '마당': 'act/piece (of pansori)', '멤버': 'member', '모임': 'gathering, club', '무대': 'stage',
  '문장': 'sentence', '문체': 'writing style', '미술': 'fine art', '미술관': 'art museum', '밑줄': 'underline',
  '바탕': 'basis, foundation', '배경': 'background', '번역': 'translation', '베스트셀러': 'bestseller',
  '부케': 'bouquet', '북': 'drum', '북장단': 'drum rhythm', '부채춤': 'fan dance', '비밀': 'secret',
  '사물놀이': 'samulnori (percussion quartet)', '사설': 'pansori narration', '사이': 'relationship, terms',
  '사인': 'signature, autograph', '사인회': 'signing event', '삽화': 'illustration', '상영': 'screening',
  '생중계': 'live broadcast', '서운함': 'hurt feelings', '성적': 'grades, scores', '소개팅': 'a blind date',
  '소리꾼': 'pansori singer', '수다': 'chatter', '시집': 'poetry collection', '신간': 'new release (book)',
  '신곡': 'new song', '신랑': 'groom', '신부': 'bride', '실제': 'reality, actual', '실화': 'true story',
  '아이돌': 'idol (K-pop)', '악기': 'musical instrument', '앙코르': 'encore', '앞날': 'future, days ahead',
  '액션': 'action', '앨범': 'album', '여운': 'lingering resonance', '여자친구': 'girlfriend', '연기': 'acting',
  '연락': 'contact', '열성': 'devotion, enthusiasm', '엽서': 'postcard', '영감': 'inspiration',
  '예고편': 'trailer, preview', '예술': 'art', '예식장': 'wedding hall', '예의': 'manners, etiquette',
  '예전': 'the past, before', '오해': 'misunderstanding', '외국': 'foreign country', '외국인': 'foreigner',
  '용기': 'courage', '우정': 'friendship', '원작': 'original work', '음원': 'digital music, sound source',
  '응원봉': 'light stick', '인터뷰': 'interview', '입장료': 'admission fee', '자막': 'subtitles',
  '작품': 'work (of art)', '잔소리': 'nagging', '장구': 'janggu (drum)', '장단': 'rhythm, beat',
  '장르': 'genre', '장면': 'scene', '조각상': 'statue, sculpture', '조명': 'lighting', '종이책': 'paper book',
  '전자책': 'e-book', '주례': 'wedding officiant', '주소': 'address', '주인공': 'protagonist, lead',
  '진로': 'career path', '진심': 'sincerity', '차트': 'chart', '청첩장': 'wedding invitation',
  '체험': 'hands-on experience', '촬영': 'filming, shooting', '최애': 'one’s absolute favorite',
  '추리': 'mystery, deduction', '추상화': 'abstract painting', '추임새': "audience's shouts (chuimsae)",
  '축가': 'congratulatory song', '축의금': 'congratulatory cash gift', '춤': 'dance', '취향': 'taste, preference',
  '케이팝': 'K-pop', '콘서트장': 'concert venue', '탈춤': 'masked dance', '판소리': 'pansori (sung storytelling)',
  '팬': 'fan', '팬클럽': 'fan club', '풍경': 'scenery, landscape', '풍경화': 'landscape painting',
  '피로연': 'wedding reception', '하객': 'wedding guest', '하나하나': 'one by one', '해설사': 'docent, guide',
  '현대': 'modern times', '화가': 'painter', '전통': 'tradition', '특별': 'special', '음악': 'music',
  '백일': '100-day mark', '다행': 'a relief, luckily', '명장면': 'iconic scene', '감동적': 'moving, touching',
  '전시': 'exhibition', '전시회': 'exhibition (event)', '전시장': 'exhibition hall', '신혼여행': 'honeymoon',
  '짝사랑': 'one-sided love, crush', '분위기': 'atmosphere, mood', '끝': 'the end', '예술가': 'artist',
  '무료': 'free of charge', '자기': 'oneself; sleeping', '에세이': 'essay', '가지': 'kind, variety',
};
const ADV: Record<string, [string, string]> = { // word -> [en, pos]
  '멀리': ['far away', 'adv'], '자꾸': ['repeatedly, keep (doing)', 'adv'], '자세히': ['in detail', 'adv'],
  '직접': ['in person, oneself', 'adv'], '절대': ['(not) at all, never', 'adv'], '점점': ['gradually', 'adv'],
  '원래': ['originally', 'adv'], '최대한': ['as much as possible', 'adv'], '한참': ['for a good while', 'adv'],
  '한동안': ['for a while', 'adv'], '한결': ['noticeably (more)', 'adv'], '흔쾌히': ['gladly, willingly', 'adv'],
  '제대로': ['properly', 'adv'], '오래오래': ['for a long, long time', 'adv'], '뭐든지': ['anything, everything', 'pron'],
  '뭘': ['what (object)', 'pron'], '신기하게': ['amazingly, curiously', 'adv'], '새롭게': ['anew, freshly', 'adv'],
  '멋지게': ['splendidly', 'adv'], '소중하게': ['preciously', 'adv'], '오랜': ['long-standing, old', 'det'],
  '말없이': ['without a word', 'adv'], '쉽게': ['easily', 'adv'], '몰아서': ['all at once (binge)', 'adv'],
  '번': ['time(s) (counter)', 'n'], '곡': ['song (counter)', 'n'],
};
// surface forms too irregular / lexicalized to derive — [surface] -> [en, pos, lemma?]
const MISC: Record<string, [string, string, string?]> = {
  '무서운': ['scary (before a noun)', 'adj', '무섭다'], '외로운': ['lonely (before a noun)', 'adj', '외롭다'],
  '보라고': ['(told) to watch', 'v', '보다'], '가자고': ['(suggested) to go', 'v', '가다'],
  '죄송하다고': ['(said) sorry', 'v', '죄송하다'], '고수라고': ['called a gosu', 'n', '고수'],
  '다행이에요': ["it's a relief", 'v', '이다'], '백일이에요': ["it's the 100-day mark", 'v', '이다'],
  '명장면이에요': ["it's an iconic scene", 'v', '이다'], '감동적이었어요': ['was moving, touching', 'v', '이다'],
  '감동적인': ['moving, touching (before a noun)', 'adj', '이다'], '거예요': ['it is (that) ...', 'aux'],
  '흘리며': ['while shedding (tears)', 'v', '흘리다'], '된': ['that has become; -old', 'v', '되다'],
  '무료였어요': ['was free of charge', 'v', '이다'], '행복하시길': ['(I hope you) be happy', 'v', '행복하다'],
  '베스트셀러라서': ['since it is a bestseller', 'v', '이다'],
};

// ── verbs-C.json ──
const verbsOut: any[] = [];
for (const [d] of LEMMA) {
  if (ENGINE.has(d)) continue; // already covered by the engine
  if (IRREG_HAEYO[d]) verbsOut.push({ dict: d, haeyo: IRREG_HAEYO[d] });
  else verbsOut.push(d);
}

// ── build surface -> lemma map ──
const surf2lemma = new Map<string, string>();
for (const [d] of LEMMA) for (const s of surfacesFor(d)) { const k = s.replace(/[^가-힣]/g, ''); if (k && !surf2lemma.has(k)) surf2lemma.set(k, d); }

// ── verbForms replica (mirror audit) so covered() matches ──
const T_SS = 20;
function pastFromHaeyo(hy: string): string | null { if (!hy.endsWith('요')) return null; const pre = hy.slice(0, -1); const d = dec(pre[pre.length - 1]); if (!d || d[2] !== 0) return null; return pre.slice(0, -1) + comp(d[0], d[1], T_SS) + '어요'; }
const verbForms = new Set<string>();
function addForm(f: string | null) { if (!f) return; const first = f.includes(' ') ? f.split(' ')[0] : f; verbForms.add(first); if (first.endsWith('요')) verbForms.add(first.slice(0, -1)); }
for (const spec of verbsOut) {
  const d = typeof spec === 'string' ? spec : spec.dict; const hy = typeof spec === 'string' ? haeyo(d) : spec.haeyo;
  addForm(hy); verbForms.add(d.slice(0, -1) + '고');
  addForm(typeof spec === 'string' ? past(d) : pastFromHaeyo(hy)); if (typeof spec === 'string') { const f = future(d); if (f) addForm(f); }
}

// ── slice dict ──
const sliceDict: Record<string, any> = {};
const posOf: Record<string, string> = {};
for (const [w, en] of Object.entries(NOUN)) sliceDict[w] = { en, ipa: rr(w), pos: 'n' };
for (const [w, [en, pos]] of Object.entries(ADV)) sliceDict[w] = { en, ipa: rr(w), pos };
for (const [d, en] of LEMMA) { const pos = en.startsWith('to ') ? 'v' : 'adj'; if (!sliceDict[d]) sliceDict[d] = { en, ipa: rr(d), pos, lemma: d }; }
for (const [w, [en, pos, lemma]] of Object.entries(MISC)) sliceDict[w] = lemma ? { en, ipa: rr(w), pos, lemma } : { en, ipa: rr(w), pos };

// ── coverage loop (mirror audit covered()) ──
const PART = ['에서는', '에서도', '한테서', '으로는', '까지는', '에서', '에게', '한테', '부터', '까지', '처럼', '보다', '마다', '으로', '에는', '이랑', '하고', '께', '은', '는', '이', '가', '을', '를', '에', '도', '만', '와', '과', '랑', '의', '로'];
function inSliceDict(tok: string, w: string): boolean { if (sliceDict[tok] || sliceDict[w]) return true; for (const p of PART) if (w.endsWith(p) && w.length > p.length && sliceDict[w.slice(0, -p.length)]) return true; return false; }
function covered(tok: string): boolean { const w = tok.replace(/[^가-힣]/g, ''); if (!w) return true; if (lookupWord(tok) || lookupWord(w) || findInfinitive(w)) return true; if (inSliceDict(tok, w)) return true; if (verbForms.has(w)) return true; return false; }

// extended particle stripping (superset of audit PART) to resolve plural / multi-particle tokens to a base
const XPART = ['들에게도', '들한테도', '들에게', '들한테', '들이', '들을', '들은', '들도', '들',
  '에게도', '한테도', '에게서', '한테서', '에게', '한테', '에서도', '에서는', '에서', '으로는', '으로도', '으로',
  '이라도', '이나', '까지만', '까지는', '까지도', '부터는', '부터도', '끼리도', '끼리는', '끼리',
  '만큼', '처럼', '밖에', '조차', '마저', '이랑은', '랑은', '이라고', '랑', '씩', '에도', '에는',
  '만', '도', '은', '는', '이', '가', '을', '를', '와', '과', '의', '로', '에', '께', '부터', '까지', '마다', '보다'];
const PRON: Record<string, string> = { '저': 'me (humble)', '나': 'me', '우리': 'us', '그': 'that/him', '이': 'this', '너': 'you' };
function baseGloss(b: string): [string, string] | null { // -> [en, pos]
  if (NOUN[b]) return [NOUN[b], 'n'];
  if (ADV[b]) return [ADV[b][0], ADV[b][1]];
  if (PRON[b]) return [PRON[b], 'pron'];
  const le = lookupWord(b); if (le) return [le.en, le.pos || 'n'];
  return null;
}
const unresolved: string[] = [];
for (const c of cards) for (const raw of String(c.target).split(/\s+/).filter(Boolean)) {
  const w = raw.replace(/[^가-힣]/g, ''); if (!w) continue;
  if (covered(raw)) continue;
  const lem = surf2lemma.get(w);
  if (lem) { const en = LEMMA_EN[lem] || ''; const pos = en.startsWith('to ') ? 'v' : 'adj'; sliceDict[w] = { en: en + ' (inflected)', ipa: rr(w), pos, lemma: lem }; continue; }
  // fallback: strip an extended particle to reach a known base, then store the full surface
  let done = false;
  for (const p of XPART) {
    if (w.endsWith(p) && w.length > p.length) {
      const bg = baseGloss(w.slice(0, -p.length));
      if (bg) { sliceDict[w] = { en: bg[0], ipa: rr(w), pos: bg[1] }; done = true; break; }
    }
  }
  if (!done) unresolved.push(`${c.id}:${w}`);
}

// keep only NEW dict keys (drop any already present in ko.ts to avoid merge duplicates)
const existing: Set<string> = new Set(JSON.parse(fs.readFileSync(path.join(HERE, '_koC_dictkeys.json'), 'utf8')));
const newDict: Record<string, any> = {};
let dropped = 0;
for (const [k, v] of Object.entries(sliceDict)) { if (existing.has(k)) { dropped++; continue; } newDict[k] = v; }

fs.writeFileSync(path.join(HERE, 'wave4-ko-verbs-C.json'), JSON.stringify(verbsOut, null, 2));
fs.writeFileSync(path.join(HERE, 'wave4-ko-dict-C.json'), JSON.stringify(newDict, null, 2));
console.log('verbs-C:', verbsOut.length, ' dict-C keys:', Object.keys(newDict).length, ' (dropped already-in-ko.ts:', dropped + ')');
console.log('UNRESOLVED:', unresolved.length);
for (const u of unresolved) console.log('  ', u);
