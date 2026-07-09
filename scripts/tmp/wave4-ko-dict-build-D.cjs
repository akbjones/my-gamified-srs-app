// Builds wave4-ko-dict-D.json + wave4-ko-verbs-D.json for slice D.
// Nouns are added as bare stems (particle stripping covers inflections);
// grammatical/copula surface forms and adnominals/quotatives get explicit
// entries with a lemma. Regular verbs go to the verbs list (merged into
// KNOWN_VERBS); true irregulars are {dict,haeyo} pairs plus a surface entry.
const fs = require('fs');
const dict = {};
const add = (k, en, ipa, pos, lemma) => {
  const e = { en, ipa, pos };
  if (lemma) e.lemma = lemma;
  dict[k] = e;
};

// ── Nouns (bare stems) ──────────────────────────────────────────────
const NOUNS = [
  ['해외', 'overseas, abroad', 'haeoe'], ['해외여행', 'overseas trip', 'haeoeyeohaeng'],
  ['국내', 'domestic, within the country', 'gungnae'], ['탑승', 'boarding', 'tapseung'],
  ['수속', 'procedures, processing', 'susok'], ['탑승권', 'boarding pass', 'tapseunggwon'],
  ['킬로', 'kilo(gram)', 'killo'], ['창가', 'window side', 'changga'], ['자리', 'seat, spot', 'jari'],
  ['통로', 'aisle', 'tongno'], ['좌석', 'seat', 'jwaseok'], ['게이트', 'gate', 'geiteu'],
  ['심사', 'screening, review', 'simsa'], ['면세점', 'duty-free shop', 'myeonsejeom'],
  ['화장품', 'cosmetics', 'hwajangpum'], ['기내', 'aircraft cabin', 'ginae'],
  ['환승', 'transfer, layover', 'hwanseung'], ['기내식', 'in-flight meal', 'ginaesik'],
  ['입국심사', 'immigration screening', 'ipguksimsa'], ['방문', 'visit', 'bangmun'],
  ['목적', 'purpose', 'mokjeok'], ['관광', 'sightseeing', 'gwangwang'], ['정도', 'degree, about', 'jeongdo'],
  ['지문', 'fingerprint', 'jimun'], ['신고서', 'declaration form', 'singoseo'], ['세관', 'customs', 'segwan'],
  ['물건', 'thing, item', 'mulgeon'], ['곳', 'place', 'got'], ['유심', 'SIM card', 'yusim'],
  ['카드', 'card', 'kadeu'], ['환전', 'currency exchange', 'hwanjeon'], ['공항버스', 'airport bus', 'gonghangbeoseu'],
  ['시내', 'downtown, city center', 'sinae'], ['비자', 'visa', 'bija'], ['무비자', 'visa-free entry', 'mubija'],
  ['대사관', 'embassy', 'daesagwan'], ['서류', 'documents', 'seoryu'], ['기간', 'period, term', 'gigan'],
  ['개월', 'months (counter)', 'gaewol'], ['영사관', 'consulate', 'yeongsagwan'], ['위치', 'location', 'wichi'],
  ['사진', 'photo', 'sajin'], ['어학연수', 'language study abroad', 'eohangyeonsu'], ['유학', 'studying abroad', 'yuhak'],
  ['어학원', 'language institute', 'eohagwon'], ['학기', 'semester', 'hakgi'], ['등록금', 'tuition', 'deungnokgeum'],
  ['반배치고사', 'class placement test', 'banbaechigosa'], ['중급', 'intermediate level', 'junggeup'],
  ['중급반', 'intermediate class', 'junggeupban'], ['초급', 'beginner level', 'chogeup'], ['고급', 'advanced level', 'gogeup'],
  ['기숙사', 'dormitory', 'gisuksa'], ['홈스테이', 'homestay', 'homseutei'], ['호스트', 'host', 'hoseuteu'],
  ['교환학생', 'exchange student', 'gyohwanhaksaeng'], ['도서관', 'library', 'doseogwan'], ['발음', 'pronunciation', 'bareum'],
  ['장학금', 'scholarship', 'janghakgeum'], ['방학', 'school vacation', 'banghak'],
  ['능력시험', 'proficiency test', 'neungnyeoksiheom'], ['한국어능력시험', 'Korean proficiency test (TOPIK)', 'hangugeo-neungnyeoksiheom'],
  ['현지', 'the local area', 'hyeonji'], ['수료증', 'certificate of completion', 'suryojeung'],
  ['룸메이트', 'roommate', 'rummeiteu'], ['사이', 'relationship, between', 'sai'], ['문화충격', 'culture shock', 'munhwachunggyeok'],
  ['충격', 'shock', 'chunggyeok'], ['문화', 'culture', 'munhwa'], ['예절', 'etiquette, manners', 'yejeol'],
  ['관습', 'custom, convention', 'gwanseup'], ['정반대', 'the exact opposite', 'jeongbandae'], ['외국', 'foreign country', 'oeguk'],
  ['시차', 'time difference, jet lag', 'sicha'], ['물가', 'cost of living, prices', 'mulga'], ['손짓', 'gesture', 'sonjit'],
  ['명절', 'traditional holiday', 'myeongjeol'], ['소포', 'parcel', 'sopo'], ['한인', 'ethnic Korean', 'hanin'],
  ['화상통화', 'video call', 'hwasangtonghwa'], ['입', 'mouth', 'ip'], ['미래', 'future', 'mirae'],
  // opinion / debate
  ['의견', 'opinion', 'uigyeon'], ['개인적', 'personal', 'gaeinjeok'], ['입장', 'position, stance', 'ipjang'],
  ['일리', 'a valid point', 'illi'], ['상황', 'situation', 'sanghwang'], ['결론', 'conclusion', 'gyeollon'],
  ['회의적', 'skeptical', 'hoeuijeok'], ['찬반', 'pro and con', 'chanban'], ['다수', 'majority', 'dasu'],
  ['근거', 'grounds, evidence', 'geungeo'], ['경우', 'case, instance', 'gyeongu'], ['첫째', 'first, firstly', 'cheotjjae'],
  ['둘째', 'second, secondly', 'duljjae'], ['통계', 'statistics', 'tonggye'], ['연구', 'research', 'yeongu'],
  ['자료', 'data, materials', 'jaryo'], ['구체적', 'concrete, specific', 'guchejeok'], ['경험', 'experience', 'gyeongheom'],
  ['주장', 'claim, argument', 'jujang'], ['전문가', 'expert', 'jeonmunga'], ['사실', 'fact', 'sasil'],
  ['환경', 'environment', 'hwangyeong'], ['재활용', 'recycling', 'jaehwaryong'], ['플라스틱', 'plastic', 'peullaseutik'],
  ['기술', 'technology', 'gisul'], ['인공지능', 'artificial intelligence', 'ingongjineung'], ['일자리', 'job, position', 'iljari'],
  ['스마트폰', 'smartphone', 'seumateupon'], ['소셜미디어', 'social media', 'soshyeolmidieo'], ['장단점', 'pros and cons', 'jangdanjeom'],
  ['장점', 'advantage, merit', 'jangjeom'], ['단점', 'disadvantage, drawback', 'danjeom'], ['교육', 'education', 'gyoyuk'],
  ['제도', 'system, institution', 'jedo'], ['위주', 'centered on', 'wiju'], ['재택근무', 'remote work', 'jaetaekgeunmu'],
  ['효율적', 'efficient', 'hyoyuljeok'], ['대중교통', 'public transportation', 'daejunggyotong'], ['워라밸', 'work-life balance', 'worabael'],
  ['세대', 'generation', 'sedae'], ['온라인', 'online', 'ollain'], ['건강', 'health', 'geongang'],
  ['스트레스', 'stress', 'seuteureseu'], ['해소', 'relief, resolution', 'haeso'], ['독서', 'reading (books)', 'dokseo'],
  ['사고력', 'thinking ability', 'sagoryeok'], ['외국어', 'foreign language', 'oegugeo'], ['시야', 'field of view, outlook', 'siya'],
  ['일회용품', 'disposable goods', 'ilhoeyongpum'], ['전기차', 'electric car', 'jeongicha'], ['가짜', 'fake', 'gajja'],
  ['뉴스', 'news', 'nyuseu'], ['정보', 'information', 'jeongbo'], ['광고', 'advertisement', 'gwanggo'],
  ['저출산', 'low birth rate', 'jeochulsan'], ['집값', 'housing price', 'jipgap'], ['봉사활동', 'volunteer work', 'bongsahwaldong'],
  ['면', 'side, aspect', 'myeon'], ['반면', 'the other side, whereas', 'banmyeon'], ['편', 'side, tendency', 'pyeon'],
  ['논란', 'controversy', 'nollan'], ['중립', 'neutrality', 'jungnip'], ['감정', 'emotion, feeling', 'gamjeong'],
  ['상대방', 'the other party', 'sangdaebang'], ['예의', 'courtesy, manners', 'yeui'], ['설득력', 'persuasiveness', 'seoldeungnyeok'],
  ['관점', 'perspective, viewpoint', 'gwanjeom'], ['정답', 'correct answer', 'jeongdap'], ['논의', 'discussion, deliberation', 'nonui'],
  ['각자', 'each person', 'gakja'], ['자기', 'oneself', 'jagi'], ['방향', 'direction', 'banghyang'],
  ['대안', 'alternative', 'daean'], ['비판', 'criticism', 'bipan'], ['핵심', 'the crux, key point', 'haeksim'],
  ['몫', "one's share, part", 'mok'], ['토론', 'debate, discussion', 'toron'], ['주제', 'topic, subject', 'juje'],
  ['가지', 'kind, type; counter for kinds', 'gaji'], ['비용', 'cost, expense', 'biyong'], ['도움', 'help', 'doum'],
  ['이유', 'reason', 'iyu'], ['선택', 'choice', 'seontaek'], ['방법', 'method, way', 'bangbeop'],
  ['비행', 'flight, flying', 'bihaeng'], ['비상구', 'emergency exit', 'bisanggu'], ['무게', 'weight', 'muge'],
  ['도장', 'seal, stamp', 'dojang'], ['렌터카', 'rental car', 'renteoka'], ['라운지', 'lounge', 'raunji'],
  ['수하물', 'baggage, checked luggage', 'suhamul'], ['안전벨트', 'seatbelt', 'anjeonbelteu'], ['생활', 'life, living', 'saenghwal'],
  ['사회', 'society', 'sahoe'], ['삶', 'life', 'sam'], ['출국', 'departure (from a country)', 'chulguk'],
  ['입국', 'entry (into a country)', 'ipguk'], ['파리', 'Paris', 'pari'], ['부분', 'part, portion', 'bubun'],
  ['그것', 'that thing', 'geugeot'], ['쪽', 'side, direction', 'jjok'],
  ['결정', 'decision', 'gyeoljeong'], ['귀', 'ear', 'gwi'], ['법', 'way, method; law', 'beop'],
  ['사용', 'use, usage', 'sayong'], ['영향', 'influence, effect', 'yeonghyang'], ['이해', 'understanding', 'ihae'],
  ['향수병', 'homesickness', 'hyangsubyeong'], ['제안', 'proposal, suggestion', 'jean'],
];
for (const [k, en, ipa] of NOUNS) add(k, en, ipa, 'noun');

// ── Adverbs / conjunctions / determiners (bare) ─────────────────────
const ADV = [
  ['겨우', 'barely, only just', 'gyeou', 'adv'], ['내내', 'the whole time, throughout', 'naenae', 'adv'],
  ['잠깐', 'for a moment, briefly', 'jamkkan', 'adv'], ['특히', 'especially', 'teuki', 'adv'],
  ['점점', 'gradually, more and more', 'jeomjeom', 'adv'], ['자꾸', 'repeatedly, keep -ing', 'jakku', 'adv'],
  ['크게', 'greatly, broadly', 'keuge', 'adv'], ['깊이', 'deeply', 'gipi', 'adv'],
  ['끝까지', 'to the end', 'kkeutkkaji', 'adv'], ['그대로', 'as it is, unchanged', 'geudaero', 'adv'],
  ['완전히', 'completely', 'wanjeonhi', 'adv'], ['충분히', 'sufficiently, enough', 'chungbunhi', 'adv'],
  ['팽팽하게', 'tautly, evenly (matched)', 'paengpaenghage', 'adv'], ['급하게', 'hastily, in a hurry', 'geupage', 'adv'],
  ['미처', '(not) as far as, up to', 'micheo', 'adv'], ['나름대로', "in one's own way", 'nareumdaero', 'adv'],
  ['개인적으로', 'personally', 'gaeinjeogeuro', 'adv'], ['결론적으로', 'in conclusion', 'gyeolloncheogeuro', 'adv'],
  ['부분적으로', 'partially, in part', 'bubunjeogeuro', 'adv'], ['반반', 'half and half, fifty-fifty', 'banban', 'noun'],
  ['왜냐하면', 'because, the reason is', 'waenyahamyeon', 'conj'], ['하지만', 'but, however', 'hajiman', 'conj'],
  ['끝으로', 'lastly, in closing', 'kkeuteuro', 'adv'], ['다시', 'again', 'dasi', 'adv'],
  ['모든', 'every, all', 'modeun', 'det'], ['이런', 'this kind of', 'ireon', 'det'],
  ['그건', 'that (그것은)', 'geugeon', 'pron'], ['이건', 'this (이것은)', 'igeon', 'pron'],
  ['건', 'the thing/fact that (것은)', 'geon', 'noun'],
];
for (const [k, en, ipa, pos] of ADV) add(k, en, ipa, pos);

// ── Regular verbs: dict-form entry + verbs-list (merged into KNOWN_VERBS) ─
const VERBS_REG = [
  ['통과하다', 'to pass through', 'tonggwahada'], ['경유하다', 'to go via, transit', 'gyeongyuhada'],
  ['신청하다', 'to apply (for)', 'sincheonghada'], ['연장하다', 'to extend, renew', 'yeonjanghada'],
  ['부족하다', 'to be insufficient, lacking', 'bujokada'], ['검색하다', 'to search (for)', 'geomsaekada'],
  ['관광하다', 'to sightsee', 'gwangwanghada'], ['익숙해지다', 'to get used to', 'iksukaejida'],
  ['편해지다', 'to become comfortable', 'pyeonhaejida'], ['다양하다', 'to be diverse, various', 'dayanghada'],
  ['설명하다', 'to explain', 'seolmyeonghada'], ['오해하다', 'to misunderstand', 'ohaehada'],
  ['인정하다', 'to acknowledge, admit', 'injeonghada'], ['존중하다', 'to respect', 'jonjunghada'],
  ['찬성하다', 'to agree, be in favor', 'chanseonghada'], ['반대하다', 'to oppose, object', 'bandaehada'],
  ['동의하다', 'to agree, consent', 'donguihada'], ['고민하다', 'to ponder, worry over', 'gominhada'],
  ['인사하다', 'to greet', 'insahada'], ['이용하다', 'to use, make use of', 'iyonghada'],
  ['노력하다', 'to make an effort', 'noryeokada'], ['이해하다', 'to understand', 'ihaehada'],
  ['지지하다', 'to support, back', 'jijihada'], ['협력하다', 'to cooperate', 'hyeomnyeokada'],
  ['양보하다', 'to yield, compromise', 'yangbohada'], ['완벽하다', 'to be perfect', 'wanbyeokada'],
  ['심각하다', 'to be serious, grave', 'simgakada'], ['궁금해하다', 'to wonder, be curious (of others)', 'gunggeumhaehada'],
  ['그리워하다', 'to miss (of others)', 'geuriwohada'], ['저렴하다', 'to be cheap, inexpensive', 'jeoryeomhada'],
  ['긴장하다', 'to be nervous, tense', 'ginjanghada'], ['낯설다', 'to be unfamiliar', 'natseolda'],
  ['설레다', 'to feel excited, flutter', 'seolleda'], ['헤매다', 'to wander, be lost', 'hemaeda'],
  ['갈리다', 'to be split, divided', 'gallida'], ['나아지다', 'to get better, improve', 'naajida'],
  ['늘다', 'to increase, improve', 'neulda'], ['느끼다', 'to feel', 'neukkida'],
  ['많아지다', 'to increase, grow many', 'manajida'], ['넓어지다', 'to widen, broaden', 'neolbeojida'],
  ['뻗다', 'to stretch out', 'ppeotda'], ['머물다', 'to stay, remain', 'meomulda'],
  ['매다', 'to fasten, tie', 'maeda'], ['들어가다', 'to enter, go in', 'deureogada'],
  ['덧붙이다', 'to add on, append', 'deotbuchida'], ['요약하다', 'to summarize', 'yoyakada'],
  ['적응하다', 'to adjust, adapt', 'jeogeunghada'], ['토론하다', 'to debate, discuss', 'toronhada'],
  ['급하다', 'to be urgent, hasty', 'geupada'], ['신고하다', 'to declare, report', 'singohada'],
];
const verbs = [];
for (const [d, en, ipa] of VERBS_REG) { add(d, en, ipa, 'v'); verbs.push(d); }

// ── True irregulars: {dict,haeyo} pair + dict-form + used surface forms ──
// 되다-compounds derive 되요 (wrong) instead of 돼요, so they are irregular.
const VERBS_IRR = [
  ['만료되다', '만료돼요', 'to expire', 'mallyodoeda', [['만료돼요', 'expires']]],
  ['지연되다', '지연돼요', 'to be delayed', 'jiyeondoeda', [['지연됐어요', 'got delayed']]],
];
for (const [d, hy, en, ipa, surfaces] of VERBS_IRR) {
  add(d, en, ipa, 'v');
  verbs.push([d, hy]);
  for (const [form, gloss] of surfaces) add(form, gloss, ipa.replace(/da$/, '') + 'wa-yo', 'v', '되다');
}

// ── Grammatical surface forms (not produced by conjugate): lemma-tagged ──
// adnominals (present -는/-은/-ㄴ, past -ㄴ), quotatives -다고/-라고, -어야/-아야,
// -려고, -(으)니까, -ㄴ대요, -네요, -겠어요, -지만/-지, -기 nominalizer, copula.
const SURF = [
  // adnominals
  ['따르는', 'following (adnominal)', 'ttareuneun', '따르다'], ['반대하는', 'opposing (adnominal)', 'bandaehaneun', '반대하다'],
  ['찬성하는', 'agreeing (adnominal)', 'chanseonghaneun', '찬성하다'], ['이용하는', 'using (adnominal)', 'iyonghaneun', '이용하다'],
  ['인사하는', 'greeting (adnominal)', 'insahaneun', '인사하다'], ['찾는', 'finding, looking for (adnominal)', 'channeun', '찾다'],
  ['있는', 'that exists, having (adnominal)', 'inneun', '있다'], ['만든', 'made (adnominal past)', 'mandeun', '만들다'],
  ['다양한', 'various (adnominal)', 'dayanghan', '다양하다'], ['나쁜', 'bad (adnominal)', 'nappeun', '나쁘다'],
  ['젊은', 'young (adnominal)', 'jeolmeun', '젊다'], ['심각한', 'serious (adnominal)', 'simgakan', '심각하다'],
  ['구체적인', 'concrete, specific (adnominal)', 'guchejeogin', '이다'], ['많은', 'many (adnominal)', 'maneun', '많다'],
  ['말하는', 'speaking, saying (adnominal)', 'malhaneun', '말하다'], ['적응하는', 'adjusting (adnominal)', 'jeogeunghaneun', '적응하다'],
  ['말씀하신', 'that (an elder) said (honorific adnominal)', 'malsseumhasin', '말하다'],
  ['설명한', 'explained (adnominal)', 'seolmyeonghan', '설명하다'],
  // quotatives -다고 / -라고
  ['좋다고', 'that (it) is good (quoted)', 'jotago', '좋다'], ['중요하다고', 'that (it) is important (quoted)', 'jungyohadago', '중요하다'],
  ['편하다고', 'that (it) is comfortable (quoted)', 'pyeonhadago', '편하다'], ['한다고', 'that (one) does (quoted)', 'handago', '하다'],
  ['문제라고', 'that (it) is a problem (quoted)', 'munjerago', '이다'], ['그렇다고', 'that (it) is so (quoted)', 'geureotago', '그렇다'],
  ['토론이었다고', 'that it was a discussion (quoted)', 'toron-ieotdago', '이다'],
  // -어야/-아야 (must)
  ['해야', 'must do', 'haeya', '하다'], ['봐야', 'must see/look', 'bwaya', '보다'], ['줄여야', 'must reduce', 'juryeoya', '줄이다'],
  ['바꿔야', 'must change', 'bakkwoya', '바꾸다'], ['들어야', 'must listen', 'deureoya', '듣다'], ['기울여야', 'must incline/lend', 'giullyeoya', '기울이다'],
  ['지켜야', 'must keep/protect', 'jikyeoya', '지키다'], ['찾아야', 'must find', 'chajaya', '찾다'], ['확인해야', 'must check', 'hwaginhaeya', '확인하다'],
  ['노력해야', 'must make an effort', 'noryeokaeya', '노력하다'], ['고민해야', 'must think it over', 'gominhaeya', '고민하다'],
  // -려고 / -(으)니까 / -ㄴ대요 / -네요 / -겠어요
  ['이해하려고', 'in order to understand', 'ihaeharyeogo', '이해하다'], ['지나니까', 'as time passes', 'jinanikka', '지나다'],
  ['온대요', '(they) say they will come', 'ondaeyo', '오다'], ['있네요', '(oh,) there is / it makes sense', 'inneyo', '있다'],
  ['좋겠어요', 'would be good, I hope', 'jokesseoyo', '좋다'],
  // -지만 / -지 / -기
  ['있지만', 'there is, but', 'itjiman', '있다'], ['반대했지만', 'opposed, but', 'bandaehaetjiman', '반대하다'],
  ['않지만', 'is not, but', 'anchiman', '않다'], ['확실하지는', '(not) exactly certain', 'hwaksilhajineun', '확실하다'],
  ['오해하지', 'do not misunderstand', 'ohaehaji', '오해하다'], ['완벽하지', '(not) perfect', 'wanbyeokaji', '완벽하다'],
  ['믿지', 'do not believe', 'mitji', '믿다'], ['그렇지', 'is not so', 'geureochi', '그렇다'],
  ['부족하기', 'being insufficient', 'bujokagi', '부족하다'], ['말하기', 'speaking, talking (skill)', 'malhagi', '말하다'],
  ['살기', 'living, to live', 'salgi', '살다'], ['보기에는', 'from the standpoint of seeing', 'bogieneun', '보다'],
  ['관광하러', 'in order to sightsee', 'gwangwanghareo', '관광하다'],
  // -(으)ㄹ future/potential stems not auto-indexed
  ['많아질', 'will increase (adnominal/future)', 'manajil', '많아지다'], ['그리울', 'when one misses', 'geuriul', '그립다'],
  ['확실해요', 'is certain', 'hwaksilhaeyo', '확실하다'],
  // copula surface forms (lemma 이다)
  ['개월이에요', 'is ... months', 'gaewol-ieyo', '이다'], ['걱정이에요', 'I am worried', 'geokjeong-ieyo', '이다'],
  ['때문이에요', 'is because', 'ttaemun-ieyo', '이다'], ['말이에요', 'I mean, that is', 'mar-ieyo', '이다'],
  ['몫이에요', "is one's share", 'moks-ieyo', '이다'], ['문제예요', 'is a problem', 'munje-yeyo', '이다'],
  ['정반대예요', 'is the exact opposite', 'jeongbandae-yeyo', '이다'], ['편이에요', 'tends to be', 'pyeon-ieyo', '이다'],
  ['핵심이에요', 'is the key point', 'haeksim-ieyo', '이다'], ['이래요', 'is like this', 'iraeyo', '이다'],
  ['회의적이에요', 'is skeptical', 'hoeuijeog-ieyo', '이다'], ['효율적이에요', 'is efficient', 'hyoyuljeog-ieyo', '이다'],
  ['어디인지', 'where it is (embedded)', 'eodi-inji', '이다'], ['정도면', 'if it is about this much', 'jeongdomyeon', '이다'],
  ['정리하자면', 'to sum up, if we organize', 'jeongnihajamyeon', '정리하다'],
  ['보니', 'upon (doing and) seeing', 'boni', '보다'], ['가지예요', 'is ... kinds', 'gaji-yeyo', '이다'],
  ['해외여행이라서', 'because it is an overseas trip', 'haeoeyeohaeng-iraseo', '이다'],
  ['신고할', 'to declare (adnominal/future)', 'singohal', '신고하다'],
  // connective/conditional/honorific/modal forms of NEW verbs (belt-and-suspenders)
  ['경유해서', 'going via, transiting (and so)', 'gyeongyuhaeseo', '경유하다'],
  ['양보하면', 'if (we) compromise', 'yangbohamyeon', '양보하다'], ['협력하면', 'if (we) cooperate', 'hyeomnyeokamyeon', '협력하다'],
  ['요약하면', 'to summarize, if summarized', 'yoyakamyeon', '요약하다'], ['그리워하세요', '(she) misses (honorific)', 'geuriwohaseyo', '그리워하다'],
  ['덧붙일게요', "I'll add on", 'deotbuchilgeyo', '덧붙이다'],
];
for (const [k, en, ipa, lemma] of SURF) add(k, en, ipa, 'v', lemma);

fs.writeFileSync(__dirname + '/wave4-ko-dict-D.json', JSON.stringify(dict, null, 1) + '\n');
fs.writeFileSync(__dirname + '/wave4-ko-verbs-D.json', JSON.stringify(verbs, null, 1) + '\n');
console.log('dict entries:', Object.keys(dict).length, 'verbs:', verbs.length);
