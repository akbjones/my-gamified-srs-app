// Builds wave4-ko-cards-D.json (250 cards, ko-3051..ko-3300).
// node-27 (3051-3175): 여행 III & 해외.  node-28 (3176-3300): 의견 & 토론.
const fs = require('fs');

// Each entry: [target, english, tags, grammar?]  ("general" auto-prepended)
const T = (t) => (t ? ['travel'] : []);

// ─────────────────── node-27 (125): 여행 III & 해외 ───────────────────
const node27 = [
  // A. 공항 출국 (airport / departure)
  ['다음 달에 해외여행을 가요.', "I'm going on an overseas trip next month.", 'travel', '해외 (haeoe) = overseas: 해외여행 = trip abroad, 국내 여행 = domestic trip.'],
  ['여권을 미리 만들었어요.', 'I got my passport ready in advance.', 'travel', '미리 (miri) = in advance: 미리 준비해요 = prepare ahead of time.'],
  ['공항에 세 시간 전에 도착했어요.', 'I arrived at the airport three hours early.', 'travel', 'Hours of duration use native numbers: 세 시간 (se sigan) = three hours.'],
  ['탑승 수속을 어디에서 해요?', 'Where do I check in?', 'travel', '수속 (susok) = procedures: 탑승 수속 = check-in for boarding.'],
  ['탑승권을 여기 보여 주세요.', 'Please show your boarding pass here.', 'travel', '보여 주세요 (boyeo juseyo) = please show me — 보이다 + 주다.'],
  ['짐이 생각보다 무거워요.', "My luggage is heavier than I thought.", 'travel', '무겁다 flips ㅂ to 우: 무거워요 (mugeowoyo) = is heavy.'],
  ['수하물은 몇 킬로까지 돼요?', 'How many kilos of baggage are allowed?', 'travel', '까지 = up to a limit: 이십 킬로까지 (killo-kkaji) = up to 20 kilos.'],
  ['창가 자리로 부탁해요.', 'A window seat, please.', 'travel', '(으)로 marks the choice: 창가 자리로 (changga jariro) = as a window seat.'],
  ['통로 쪽 좌석이 더 편해요.', 'An aisle seat is more comfortable.', 'travel', '쪽 = side: 통로 쪽 (tongno jjok) = the aisle side.'],
  ['게이트가 어디인지 잘 모르겠어요.', "I'm not sure where the gate is.", 'travel', '-ㄴ지 embeds a question: 어디인지 (eodi-inji) = where it is.'],
  ['비행기가 두 시간 지연됐어요.', 'The flight was delayed two hours.', 'travel', '지연되다 = to be delayed: 지연됐어요 (jiyeondwaesseoyo) = got delayed.'],
  ['출국 심사를 빨리 통과했어요.', 'I got through departure screening quickly.', 'travel', '통과하다 = to pass through: 통과했어요 (tonggwahaesseoyo) = passed.'],
  ['면세점에서 화장품을 샀어요.', 'I bought cosmetics at the duty-free shop.', 'travel', null],
  ['안전벨트를 매 주세요.', 'Please fasten your seatbelt.', 'travel', '매다 = to fasten: 안전벨트를 매요 (maeyo) = fasten a seatbelt.'],
  ['이 짐은 기내에 들고 탈 거예요.', "I'll carry this bag on board.", 'travel', '들고 타다 = carry on: 들고 탈 거예요 = will carry it aboard.'],
  ['환승 시간이 넉넉해요.', 'The layover time is plenty.', 'travel', '환승 (hwanseung) = transfer: 환승 시간 = layover time.'],
  ['다음 비행기를 갈아탔어요.', 'I transferred to the next flight.', 'travel', '갈아타다 = to transfer: 갈아탔어요 (garatasseoyo) = changed transport.'],
  ['경유해서 파리로 가요.', "I'm going to Paris via a connection.", 'travel', '경유하다 = to go via: 경유해서 가요 = go by way of.'],
  ['비행이 열두 시간 걸렸어요.', 'The flight took twelve hours.', 'travel', 'Hours of duration use native numbers: 열두 시간 (yeoldu sigan) = 12 hours.'],
  ['기내식이 생각보다 맛있었어요.', 'The in-flight meal was tastier than expected.', 'travel', '기내식 (ginaesik) = in-flight meal.'],
  // C. 입국심사 / 세관 (immigration / customs)
  ['입국심사에서 줄을 오래 섰어요.', 'I stood in line a long time at immigration.', 'travel', '입국심사 (ipguksimsa) = immigration screening.'],
  ['방문 목적이 뭐예요?', 'What is the purpose of your visit?', 'travel', '목적 (mokjeok) = purpose: 방문 목적 = purpose of visit.'],
  ['관광하러 왔어요.', "I came to do some sightseeing.", 'travel', '-러 marks purpose of going: 관광하러 (gwangwanghareo) = in order to sightsee.'],
  ['얼마나 머물 거예요?', 'How long will you stay?', 'travel', '머물다 = to stay: 머물 거예요 (meomul geoyeyo) = will stay.'],
  ['일주일 정도 있을 거예요.', "I'll be here about a week.", 'travel', '정도 (jeongdo) = about, roughly: 일주일 정도 = about a week.'],
  ['호텔에서 지낼 거예요.', "I'll be staying at a hotel.", 'travel', '지내다 = to stay/spend time: 지낼 거예요 = will stay.'],
  ['여기 지문을 찍어 주세요.', 'Please scan your fingerprint here.', 'travel', '지문 (jimun) = fingerprint: 지문을 찍어요 = scan a fingerprint.'],
  ['입국 신고서를 미리 썼어요.', 'I filled out the arrival card in advance.', 'travel', '신고서 (singoseo) = declaration form.'],
  ['세관에서 가방을 열었어요.', 'They opened my bag at customs.', 'travel', '세관 (segwan) = customs.'],
  ['신고할 물건이 없어요.', 'I have nothing to declare.', 'travel', '신고하다 = to declare: 신고할 물건 = items to declare.'],
  ['짐을 찾는 곳이 어디예요?', 'Where is baggage claim?', 'travel', '-는 곳 = the place where: 짐을 찾는 곳 (channeun got) = baggage claim.'],
  ['수하물이 아직 안 나왔어요.', "My baggage hasn't come out yet.", 'travel', '아직 안 = not yet: 아직 안 나왔어요 (ajik an nawasseoyo).'],
  ['공항에서 유심 카드를 하나 샀어요.', 'I bought a SIM card at the airport.', 'travel', '유심 (yusim) = SIM card — a borrowed word from "USIM".'],
  ['환전을 어디에서 해요?', 'Where do I exchange money?', 'travel', '환전 (hwanjeon) = currency exchange: 환전해요 = exchange money.'],
  ['공항버스를 타고 시내로 갔어요.', 'I took the airport bus into the city.', 'travel', null],
  // D. 비자 / 대사관 (visa / embassy)
  ['비자를 신청했어요.', 'I applied for a visa.', 'travel', '비자 (bija) = visa: 비자를 신청해요 = apply for a visa.'],
  ['관광 비자로 왔어요.', 'I came on a tourist visa.', 'travel', '(으)로 marks the means: 관광 비자로 = on a tourist visa.'],
  ['학생 비자가 필요해요.', 'I need a student visa.', 'travel', null],
  ['한국은 무비자로 갈 수 있어요.', 'You can go to Korea visa-free.', 'travel', '무비자 (mubija) = visa-free: 무- means "without".'],
  ['비자를 연장하고 싶어요.', "I'd like to extend my visa.", 'travel', '연장하다 = to extend: 연장하고 싶어요 = want to extend.'],
  ['대사관에 서류를 냈어요.', 'I submitted documents to the embassy.', 'travel', '대사관 (daesagwan) = embassy.'],
  ['비자가 다음 주에 나와요.', 'The visa comes out next week.', 'travel', null],
  ['여권이 곧 만료돼요.', 'My passport expires soon.', 'travel', '만료되다 = to expire: 만료돼요 (mallyodwaeyo) = expires.'],
  ['비자 기간이 삼 개월이에요.', 'The visa is valid for three months.', 'travel', 'Months of duration use Sino numbers: 삼 개월 (sam gaewol) = 3 months.'],
  ['영사관 위치를 검색했어요.', 'I searched for the consulate location.', 'travel', '영사관 (yeongsagwan) = consulate.'],
  ['서류가 하나 부족해요.', "I'm missing one document.", 'travel', '부족하다 = to be lacking: 하나 부족해요 = short by one.'],
  ['비자 사진을 새로 찍었어요.', 'I took new visa photos.', 'travel', null],
  // E. 어학연수 / 유학 (study abroad)
  ['내년에 어학연수를 갈 거예요.', "I'll go study a language abroad next year.", 'travel', '어학연수 (eohangyeonsu) = language study abroad.'],
  ['서울로 유학을 왔어요.', 'I came to Seoul to study.', 'travel', '유학 (yuhak) = studying abroad: 유학을 왔어요 = came to study.'],
  ['어학원에 등록했어요.', 'I enrolled at a language school.', 'travel', '어학원 (eohagwon) = language institute.'],
  ['한 학기 동안 공부할 거예요.', "I'll study for one semester.", 'travel', '동안 = for a duration: 한 학기 동안 = for one semester.'],
  ['등록금이 조금 비싸요.', 'The tuition is a bit expensive.', 'travel', '등록금 (deungnokgeum) = tuition.'],
  ['반배치고사를 봤어요.', 'I took the placement test.', 'travel', '반배치고사 (banbaechigosa) = class placement exam.'],
  ['중급반에 들어갔어요.', 'I got into the intermediate class.', 'travel', '중급 (junggeup) = intermediate level; 초급 = beginner, 고급 = advanced.'],
  ['기숙사에서 살아요.', "I live in a dormitory.", 'travel', '기숙사 (gisuksa) = dormitory.'],
  ['홈스테이 가족이 정말 친절해요.', 'My homestay family is really kind.', 'travel', '홈스테이 (homseutei) = homestay.'],
  ['호스트 어머니가 요리를 잘하세요.', 'My host mother cooks well.', 'travel', 'Elders take -세요: 잘하세요 (jalhaseyo) shows respect.'],
  ['교환학생으로 왔어요.', 'I came as an exchange student.', 'travel', '교환학생 (gyohwanhaksaeng) = exchange student.'],
  ['수업이 아침 아홉 시에 시작해요.', 'Class starts at nine in the morning.', 'travel', 'Clock hours use native numbers: 아홉 시 (ahop si) = nine oclock.'],
  ['숙제가 매일 많아요.', "There's a lot of homework every day.", 'travel', null],
  ['말하기 시험이 제일 어려워요.', 'The speaking test is the hardest.', 'travel', '제일 (jeil) = most: 제일 어려워요 = the most difficult.'],
  ['한국 친구를 많이 사귀었어요.', 'I made a lot of Korean friends.', 'travel', '사귀다 = to make friends: 사귀었어요 (sagwieosseoyo) = made friends.'],
  ['수업 후에 도서관에서 공부해요.', 'I study at the library after class.', 'travel', '후에 = after: 수업 후에 (sueop hue) = after class.'],
  ['발음이 많이 늘었어요.', 'My pronunciation has improved a lot.', 'travel', '늘다 = to improve: 늘었어요 (neureosseoyo) = got better.'],
  ['선생님이 천천히 말씀하세요.', 'The teacher speaks slowly.', 'travel', '말씀하시다 = to speak (honorific): 말씀하세요 for a teacher.'],
  ['장학금을 받고 싶어요.', "I want to get a scholarship.", 'travel', '장학금 (janghakgeum) = scholarship.'],
  ['방학 때 여행을 다닐 거예요.', "I'll travel around during the break.", 'travel', '방학 (banghak) = school vacation: 방학 때 = during break.'],
  ['한국어능력시험을 준비해요.', "I'm preparing for the Korean proficiency test.", 'travel', '능력시험 (neungnyeoksiheom) = proficiency test (TOPIK).'],
  ['현지 생활에 점점 익숙해져요.', "I'm gradually getting used to local life.", 'travel', '익숙해지다 = to get used to: 익숙해져요 (iksukaejyeoyo).'],
  ['수료증을 받았어요.', 'I received a certificate of completion.', 'travel', '수료증 (suryojeung) = completion certificate.'],
  ['다음 학기도 등록할게요.', "I'll register for next semester too.", 'travel', '-(으)ㄹ게요 is a promise: 등록할게요 (deungnokalgeyo) = I will register.'],
  ['룸메이트하고 사이가 좋아요.', 'I get along well with my roommate.', 'travel', '사이가 좋다 = to be close: 사이가 좋아요 = get along well.'],
  // F. 문화 차이 (cultural differences)
  ['처음에는 문화충격을 받았어요.', 'At first I had culture shock.', 'travel', '문화충격 (munhwachunggyeok) = culture shock: 충격을 받다 = be shocked.'],
  ['여기는 팁 문화가 있어요.', 'There is a tipping culture here.', 'travel', '문화 (munhwa) = culture: 팁 문화 = tipping culture.'],
  ['한국하고 문화가 많이 달라요.', "The culture is very different from Korea's.", 'travel', '와/과 다르다 = different from: 한국하고 달라요 (dallayo).'],
  ['식사 예절이 우리하고 달라요.', 'Table manners differ from ours.', 'travel', '예절 (yejeol) = manners, etiquette.'],
  ['인사하는 방법이 달라요.', 'The way people greet is different.', 'travel', '-는 방법 = the way of: 인사하는 방법 = way of greeting.'],
  ['이 나라 관습을 잘 몰라요.', "I don't know this country's customs well.", 'travel', '관습 (gwanseup) = custom, convention.'],
  ['처음에는 모든 게 낯설었어요.', 'At first everything felt unfamiliar.', 'travel', '낯설다 = to be unfamiliar: 낯설었어요 (natseoreosseoyo).'],
  ['이제는 많이 익숙해졌어요.', "Now I've gotten quite used to it.", 'travel', null],
  ['여기 사람들은 정말 친절해요.', 'People here are really friendly.', 'travel', null],
  ['가게가 일찍 문을 닫아서 놀랐어요.', 'I was surprised the shops close early.', 'travel', '-아서 gives a cause: 닫아서 (dadaseo) = because it closes.'],
  ['현지 음식이 입에 잘 맞아요.', 'The local food suits my taste well.', 'travel', '입에 맞다 = to suit ones taste: 입에 맞아요 (ibe majayo).'],
  ['가끔 매운 음식이 그리워요.', 'Sometimes I miss spicy food.', 'travel', '그립다 flips ㅂ to 우: 그리워요 (geuriwoyo) = I miss it.'],
  ['날씨가 한국하고 정반대예요.', "The weather is the opposite of Korea's.", 'travel', '정반대 (jeongbandae) = the exact opposite.'],
  ['외국 생활이 생각보다 힘들어요.', 'Life abroad is harder than I thought.', 'travel', '외국 (oeguk) = foreign country: 외국 생활 = life abroad.'],
  ['말이 안 통해서 답답했어요.', "I felt frustrated because I couldn't communicate.", 'travel', '말이 통하다 = to communicate: 안 통해서 = because it doesnt get through.'],
  ['손짓으로 겨우 설명했어요.', 'I barely explained with gestures.', 'travel', '겨우 (gyeou) = barely, only just.'],
  ['현지 친구가 많이 도와줬어요.', 'A local friend helped me a lot.', 'travel', '현지 (hyeonji) = local: 현지 친구 = a local friend.'],
  ['버스 타는 법을 몰라서 헤맸어요.', "I got lost because I didn't know how to take the bus.", 'travel', '헤매다 = to wander lost: 헤맸어요 (hemaesseoyo).'],
  ['시차 때문에 밤에 잠이 안 와요.', "I can't sleep at night because of jet lag.", 'travel', '시차 (sicha) = time difference/jet lag: 시차 때문에 = because of jet lag.'],
  ['물가가 한국보다 비싸요.', 'Prices are higher than in Korea.', 'travel', '물가 (mulga) = cost of living: 물가가 비싸요 = prices are high.'],
  ['이제 이 도시가 편해졌어요.', 'This city feels comfortable to me now.', 'travel', '편해지다 = to become comfortable: 편해졌어요 (pyeonhaejyeosseoyo).'],
  ['다양한 나라 친구를 만났어요.', 'I met friends from various countries.', 'travel', '다양하다 = to be diverse: 다양한 나라 = various countries.'],
  // G. 향수병 (homesickness)
  ['요즘 향수병이 심해요.', "My homesickness is bad these days.", 'family', '향수병 (hyangsubyeong) = homesickness (lit. nostalgia illness).'],
  ['가족이 정말 보고 싶어요.', 'I really miss my family.', 'family', '보고 싶다 = to miss (a person): 보고 싶어요 (bogo sipeoyo).'],
  ['부모님하고 매일 화상통화를 해요.', 'I video-call my parents every day.', 'family', '화상통화 (hwasangtonghwa) = video call.'],
  ['엄마가 저를 많이 그리워하세요.', 'My mom misses me a lot.', 'family', "3rd-person feelings take -어하다: 그리워하세요 (geuriwohaseyo) = (she) misses."],
  ['동생이 제 소식을 궁금해해요.', 'My younger sibling wonders how I am.', 'family', "Others' curiosity uses -어하다: 궁금해해요 (gunggeumhaehaeyo)."],
  ['한국 음식이 자꾸 생각나요.', 'I keep thinking of Korean food.', 'family', '생각나다 = to come to mind: 생각나요 (saenggangnayo).'],
  ['고향이 그리울 때 사진을 봐요.', 'When I miss home, I look at photos.', 'family', "-(으)ㄹ 때 = when: 그리울 때 (geuriul ttae) = when I miss it."],
  ['밤에 혼자 있으면 외로워요.', "I feel lonely when I'm alone at night.", 'family', '외롭다 flips ㅂ to 우: 외로워요 (oeroweoyo) = I feel lonely.'],
  ['친구들이 저를 걱정해요.', 'My friends worry about me.', 'family', null],
  ['부모님 목소리를 들으면 힘이 나요.', "Hearing my parents' voices gives me strength.", 'family', '들으면: 듣다 is ㄷ-irregular — 들으면 (deureumyeon) = if/when I hear.'],
  ['가족사진을 책상에 놓았어요.', 'I put a family photo on my desk.', 'family', '놓다 = to put/place: 놓았어요 (noasseoyo) = placed.'],
  ['한국 뉴스를 매일 챙겨 봐요.', 'I make sure to watch Korean news every day.', 'family', '챙겨 보다 = to make a point of watching: 챙겨 봐요.'],
  ['명절에 특히 가족이 그리워요.', 'I miss my family especially on holidays.', 'family', '명절 (myeongjeol) = traditional holiday.'],
  ['엄마가 만든 김치찌개가 먹고 싶어요.', 'I want to eat the kimchi stew my mom makes.', 'family', '-고 싶다 = to want to: 먹고 싶어요 (meokgo sipeoyo).'],
  ['친구가 소포를 보내 줬어요.', 'A friend sent me a package.', 'family', '보내 주다 = to send (for me): 보내 줬어요 (bonae jwosseoyo).'],
  ['시간이 지나니까 좀 나아졌어요.', 'As time passed it got a little better.', 'family', '-(으)니까 = as/since: 지나니까 (jinanikka) = as time passes.'],
  ['한인 마트에서 라면을 샀어요.', 'I bought ramen at the Korean grocery store.', 'family', '한인 (hanin) = ethnic Korean: 한인 마트 = Korean market.'],
  ['가족이 곧 보러 온대요.', "My family says they'll come visit soon.", 'family', "-ㄴ대요 relays what was said: 온대요 (ondaeyo) = (they) say they'll come."],
  ['적응하는 데 시간이 걸렸어요.', 'It took time to adjust.', 'travel', '-는 데 = for the task of: 적응하는 데 (jeogeunghaneun de) = to adjust.'],
  ['이제 여기가 제2의 고향 같아요.', 'Now this place feels like a second home.', 'family', '-같아요 = seems like: 고향 같아요 (gohyang gatayo) = feels like home.'],
  ['방학에 한국에 갈 생각을 하면 설레요.', 'I get excited thinking about going to Korea on break.', 'family', '설레다 = to feel excited/flutter: 설레요 (seolleyo).'],
  ['부모님께 편지를 자주 써요.', 'I write letters to my parents often.', 'family', '께 is the honorific 에게: 부모님께 (bumonimkke) = to (my) parents.'],
  ['힘들 때마다 가족을 생각해요.', 'Whenever things are hard I think of my family.', 'family', '-ㄹ 때마다 = every time: 힘들 때마다 (himdeul ttaemada).'],
  // A2. 공항 추가 (more airport / flight)
  ['짐을 부칠 때 무게를 쟀어요.', 'They weighed my bag when I checked it in.', 'travel', '부치다 = to check/send: 짐을 부쳐요 (buchyeoyo) = check baggage.'],
  ['비상구 좌석은 다리를 뻗을 수 있어요.', 'Emergency-exit seats let you stretch your legs.', 'travel', '비상구 (bisanggu) = emergency exit.'],
  ['비행 내내 잠을 잤어요.', 'I slept the whole flight.', 'travel', '내내 (naenae) = the whole time, throughout.'],
  ['입국 도장을 여권에 받았어요.', 'I got an entry stamp in my passport.', 'travel', '도장 (dojang) = seal/stamp: 도장을 받아요 = get a stamp.'],
  ['공항에서 렌터카를 빌렸어요.', 'I rented a car at the airport.', 'travel', '렌터카 (renteoka) = rental car.'],
  ['현지 유심이 훨씬 저렴해요.', 'A local SIM is much cheaper.', 'travel', '저렴하다 = to be inexpensive: 저렴해요 (jeoryeomhaeyo).'],
  ['첫 해외여행이라서 많이 긴장했어요.', 'I was very nervous since it was my first trip abroad.', 'travel', '-이라서 = because it is: 첫 여행이라서 (yeohaeng-iraseo).'],
  ['공항 라운지에서 잠깐 쉬었어요.', 'I rested briefly in the airport lounge.', 'travel', '라운지 (raunji) = lounge; 잠깐 = for a moment.'],
];

// ─────────────────── node-28 (125): 의견 & 토론 ───────────────────
const node28 = [
  // A. 의견 프레임 (opinion frames)
  ['제 생각에는 그게 맞아요.', 'In my opinion, that is right.', 'general', '제 생각에는 (je saenggageneun) = in my opinion — a soft opinion opener.'],
  ['저는 꼭 그렇게 생각하지는 않아요.', "I don't necessarily think so.", 'general', '-지 않다 negates: 생각하지 않아요 (saenggakaji anayo) = I dont think so.'],
  ['이 계획이 좋다고 생각해요.', 'I think this plan is good.', 'work', '~다고 생각해요 = I think that ~: 좋다고 생각해요 (jotago saenggakaeyo).'],
  ['그 말이 맞는 것 같아요.', 'I think that is correct.', 'general', '~것 같아요 softens a claim: 맞는 것 같아요 (manneun geot gatayo) = seems right.'],
  ['제 의견은 그것과 조금 달라요.', 'My opinion is a bit different from that.', 'general', '의견 (uigyeon) = opinion: 제 의견은 = my opinion is.'],
  ['개인적으로는 반대예요.', "Personally, I'm against it.", 'general', '개인적으로 (gaeinjeogeuro) = personally.'],
  ['솔직히 말하면 잘 모르겠어요.', "Honestly, I'm not sure.", 'general', '솔직히 말하면 (soljikhi malhamyeon) = to be honest.'],
  ['제가 보기에는 문제가 있어요.', 'The way I see it, there is a problem.', 'general', '-기에는 = from the standpoint of: 제가 보기에는 = as I see it.'],
  ['그 의견에 일리가 있어요.', 'That opinion makes sense.', 'general', '일리가 있다 = to have a point: 일리가 있어요 (illiga isseoyo).'],
  ['이건 사람마다 생각이 달라요.', 'This differs from person to person.', 'general', '마다 = each/every: 사람마다 (saramada) = each person.'],
  ['저도 같은 생각이에요.', 'I think the same.', 'general', '같은 생각 = the same thought: 같은 생각이에요 (gateun saenggagieyo).'],
  ['확실하지는 않지만 그럴 거예요.', "I'm not certain, but it's probably so.", 'general', '-지는 않지만 = not quite, but: 확실하지는 않지만.'],
  ['제 생각을 솔직하게 이야기할게요.', "I'll share my honest opinion.", 'work', '-(으)ㄹ게요 is a commitment: 이야기할게요 (iyagihalgeyo) = I will tell.'],
  ['한번 생각해 볼게요.', "I'll give it some thought.", 'general', '-아/어 볼게요 = I will try: 생각해 볼게요 (saenggakae bolgeyo).'],
  ['그 점은 저도 인정해요.', 'I admit that point too.', 'general', '인정하다 = to acknowledge: 인정해요 (injeonghaeyo).'],
  ['제 입장에서는 이해가 안 돼요.', "From my position, it doesn't make sense.", 'general', '입장 (ipjang) = position/stance: 제 입장에서는 = from my standpoint.'],
  ['이 문제는 좀 더 고민해야 해요.', 'We need to think this over more.', 'work', '-아야 하다 = must: 고민해야 해요 (gominhaeya haeyo) = must ponder.'],
  ['많은 사람들이 그렇게 느껴요.', 'Many people feel that way.', 'general', '느끼다 = to feel: 느껴요 (neukkyeoyo) = feel.'],
  ['제 나름대로 이유가 있어요.', 'I have my own reasons.', 'general', '나름대로 (nareumdaero) = in ones own way.'],
  ['그건 상황에 따라 달라요.', 'That depends on the situation.', 'general', '-에 따라 = depending on: 상황에 따라 (sanghwange ttara).'],
  ['말씀하신 부분에 동의해요.', 'I agree with the part you mentioned.', 'work', '말씀하시다 is honorific 말하다: 말씀하신 (malsseumhasin) = that you said.'],
  ['제 결론은 이래요.', 'My conclusion is this.', 'work', '이래요 = is like this: 결론은 이래요 (gyeolloneun iraeyo).'],
  // B. 찬성 / 반대 / 동의 (agree / disagree)
  ['저는 그 의견에 찬성해요.', 'I support that opinion.', 'work', '찬성하다 = to be in favor: 찬성해요 (chanseonghaeyo) = I agree/support.'],
  ['저는 그 계획에 반대해요.', "I'm against that plan.", 'work', '반대하다 = to oppose: 반대해요 (bandaehaeyo) = I object.'],
  ['그 말에 완전히 동의해요.', 'I completely agree with that.', 'general', '동의하다 = to agree: 완전히 동의해요 (wanjeonhi dongihaeyo).'],
  ['저도 그렇게 생각해요.', 'I think so too.', 'general', '저도 = me too: 저도 그렇게 생각해요 shows agreement.'],
  ['그 점에는 반대하고 싶어요.', "I'd like to object to that point.", 'work', null],
  ['어느 정도는 맞는 말이에요.', "It's right to some degree.", 'general', '어느 정도 (eoneu jeongdo) = to some extent.'],
  ['그건 좀 아닌 것 같아요.', "I don't think that's quite right.", 'general', '아닌 것 같아요 = seems not so — a polite disagreement.'],
  ['찬성하는 사람이 더 많아요.', 'There are more people in favor.', 'work', '-는 사람 = people who: 찬성하는 사람 (chanseonghaneun saram).'],
  ['반대하는 이유를 듣고 싶어요.', 'I want to hear the reasons against.', 'work', '이유 (iyu) = reason: 반대하는 이유 = the reason for opposing.'],
  ['그 의견에 반대하는 건 아니에요.', "It's not that I oppose that opinion.", 'general', '-는 건 아니에요 = its not that: softens the stance.'],
  ['부분적으로만 동의해요.', 'I only partly agree.', 'general', '부분적으로 (bubunjeogeuro) = partially.'],
  ['그 생각도 존중해요.', 'I respect that view too.', 'general', '존중하다 = to respect: 존중해요 (jonjunghaeyo).'],
  ['서로 생각이 다를 수 있어요.', 'We can think differently from each other.', 'general', '서로 (seoro) = each other; -(으)ㄹ 수 있다 = can.'],
  ['그 의견에는 조금 회의적이에요.', "I'm a bit skeptical of that opinion.", 'work', '회의적 (hoeuijeok) = skeptical: 회의적이에요.'],
  ['의견이 찬반으로 팽팽하게 갈렸어요.', 'Opinions split evenly for and against.', 'work', '찬반 (chanban) = pro and con: 찬반으로 갈리다 = split into for/against.'],
  ['다수의 의견을 따르는 게 좋겠어요.', "It'd be best to follow the majority view.", 'work', '다수 (dasu) = the majority: 다수의 의견 = majority opinion.'],
  // C. 근거 / 예 / 이유 (reasons, examples)
  ['근거를 들면 이렇게 설명할 수 있어요.', 'To give grounds, I can explain it this way.', 'work', '근거를 들다 = to cite grounds: 근거를 들면 (geungeoreul deulmyeon).'],
  ['예를 들면 이런 경우가 있어요.', 'For example, there are cases like this.', 'general', '예를 들면 (yereul deulmyeon) = for example.'],
  ['왜냐하면 시간이 부족하기 때문이에요.', "It's because there isn't enough time.", 'general', '왜냐하면 ~기 때문에 = because: 부족하기 때문이에요.'],
  ['첫째로 비용이 너무 많이 들어요.', 'First, it costs too much.', 'work', '첫째 (cheotjjae) = firstly: 첫째로 = first of all.'],
  ['둘째로 시간도 오래 걸려요.', 'Second, it also takes a long time.', 'work', '둘째 (duljjae) = secondly.'],
  ['통계에 따르면 그렇지 않아요.', "According to statistics, that isn't so.", 'work', '-에 따르면 = according to: 통계에 따르면 (tonggye-e ttareumyeon).'],
  ['연구 결과가 그것을 보여 줘요.', 'Research results show that.', 'work', '연구 (yeongu) = research: 연구 결과 = research results.'],
  ['자료를 보면 확실해요.', "It's clear when you look at the data.", 'work', '자료 (jaryo) = data/materials: 자료를 보면 = if you look at the data.'],
  ['구체적인 예가 필요해요.', 'A concrete example is needed.', 'work', '구체적 (guchejeok) = concrete/specific: 구체적인 예.'],
  ['제 경험을 근거로 말하는 거예요.', "I'm speaking based on my experience.", 'general', '-을 근거로 = based on: 경험을 근거로 (gyeongheomeul geungeoro).'],
  ['이유는 크게 두 가지예요.', 'There are broadly two reasons.', 'work', '크게 = broadly: 크게 두 가지 (keuge du gaji) = two main kinds.'],
  ['그 주장에는 근거가 부족해요.', 'That claim lacks evidence.', 'work', '주장 (jujang) = claim/argument: 주장에 근거가 부족하다.'],
  ['전문가도 같은 말을 해요.', 'Experts say the same thing too.', 'work', '전문가 (jeonmunga) = expert.'],
  ['사실을 먼저 확인해야 해요.', 'We should check the facts first.', 'work', '사실 (sasil) = fact: 사실을 확인하다 = verify the facts.'],
  ['근거 없이 말하면 안 돼요.', "You shouldn't speak without grounds.", 'general', '-면 안 되다 = must not: 말하면 안 돼요 (malhamyeon an dwaeyo).'],
  // D. 토론 주제 opinions (real topics)
  ['환경 문제가 제일 중요하다고 생각해요.', 'I think environmental issues are the most important.', 'general', '환경 (hwangyeong) = environment: 환경 문제 = environmental issue.'],
  ['재활용을 더 열심히 해야 해요.', 'We should recycle more diligently.', 'general', '재활용 (jaehwaryong) = recycling.'],
  ['플라스틱 사용을 줄여야 해요.', 'We should reduce plastic use.', 'general', '줄이다 = to reduce: 줄여야 해요 (juryeoya haeyo) = must cut down.'],
  ['기술이 우리 삶을 바꿨어요.', 'Technology has changed our lives.', 'work', '기술 (gisul) = technology: 삶을 바꾸다 = change lives.'],
  ['인공지능이 일자리를 줄일까 봐 걱정돼요.', "I worry AI might cut jobs.", 'work', '-(으)ㄹ까 봐 = worried that: 줄일까 봐 (juril-kka bwa).'],
  ['스마트폰 없이는 살기 힘들어요.', "It's hard to live without a smartphone.", 'general', '없이는 = without: 스마트폰 없이는 (seumateupon eopsineun).'],
  ['소셜미디어에 장단점이 있어요.', 'Social media has pros and cons.', 'general', '장단점 (jangdanjeom) = pros and cons.'],
  ['소셜미디어를 너무 많이 하면 안 좋아요.', "It's not good to overuse social media.", 'general', null],
  ['교육 제도를 바꿔야 한다고 생각해요.', 'I think the education system should change.', 'work', '제도 (jedo) = system: 교육 제도 = education system.'],
  ['시험 위주 교육이 문제예요.', 'Exam-centered education is a problem.', 'work', '위주 (wiju) = -centered: 시험 위주 = exam-focused.'],
  ['재택근무가 더 효율적이에요.', 'Working from home is more efficient.', 'work', '재택근무 (jaetaekgeunmu) = remote work; 효율적 = efficient.'],
  ['재택근무는 단점도 있어요.', 'Remote work has downsides too.', 'work', '단점 (danjeom) = downside, weakness.'],
  ['도시 생활이 더 편하다고 생각해요.', 'I think city life is more convenient.', 'general', '도시 생활 (dosi saenghwal) = city life.'],
  ['시골이 도시보다 살기 좋아요.', 'The countryside is nicer to live in than the city.', 'general', '살기 좋다 = good to live in: 살기 좋아요 (salgi joayo).'],
  ['대중교통을 이용하는 게 좋아요.', "It's good to use public transport.", 'general', '대중교통 (daejunggyotong) = public transportation.'],
  ['워라밸이 정말 중요해요.', 'Work-life balance is really important.', 'work', '워라밸 (worabael) = work-life balance — a clipped loanword.'],
  ['젊은 세대는 생각이 달라요.', 'The younger generation thinks differently.', 'general', '세대 (sedae) = generation: 젊은 세대 = the young generation.'],
  ['온라인 수업에도 장점이 많아요.', 'Online classes have many advantages too.', 'work', '장점 (jangjeom) = advantage, strong point.'],
  ['건강이 돈보다 더 중요해요.', 'Health is more important than money.', 'general', 'A보다 = more than A: 돈보다 (donboda) = than money.'],
  ['운동이 스트레스 해소에 도움이 돼요.', 'Exercise helps relieve stress.', 'general', '해소 (haeso) = relief: 스트레스 해소 = stress relief.'],
  ['독서가 사고력을 길러 줘요.', 'Reading develops thinking skills.', 'general', '기르다 = to cultivate: 길러 줘요 (gilleo jwoyo) = it develops.'],
  ['외국어를 배우면 시야가 넓어져요.', 'Learning a foreign language broadens your view.', 'general', '넓어지다 = to widen: 넓어져요 (neolbeojyeoyo).'],
  ['일회용품을 줄이는 게 환경에 좋아요.', 'Cutting disposables is good for the environment.', 'general', '일회용품 (ilhoeyongpum) = disposable goods.'],
  ['전기차가 미래에는 더 많아질 거예요.', 'Electric cars will grow more common in the future.', 'general', '많아지다 = to increase: 많아질 거예요 (manajil geoyeyo).'],
  ['가짜 뉴스가 사회에 나쁜 영향을 줘요.', 'Fake news has a bad influence on society.', 'general', '영향을 주다 = to influence: 영향을 줘요 (yeonghyangeul jwoyo).'],
  ['정보를 그대로 믿으면 안 돼요.', "You shouldn't just believe information as is.", 'general', '그대로 (geudaero) = as it is, without change.'],
  ['광고를 너무 믿지 마세요.', "Don't trust ads too much.", 'general', '-지 마세요 = please dont: 믿지 마세요 (mitji maseyo).'],
  ['저출산이 심각한 문제라고 생각해요.', 'I think low birth rates are a serious problem.', 'general', '저출산 (jeochulsan) = low birth rate; 심각하다 = serious.'],
  ['집값이 너무 비싸서 걱정이에요.', "I'm worried because housing is too expensive.", 'general', '집값 (jipgap) = housing price: 집값이 비싸다.'],
  ['봉사활동이 사회에 도움이 돼요.', 'Volunteering helps society.', 'general', '봉사활동 (bongsahwaldong) = volunteer work.'],
  // E. 헤징 / 부분 동의 / 전환 (hedging, contrast)
  ['하지만 다른 면도 봐야 해요.', 'But we should look at the other side too.', 'general', '하지만 (hajiman) = but, however — starts a contrast.'],
  ['반면에 이런 문제도 있어요.', 'On the other hand, there are these problems too.', 'general', '반면에 (banmyeone) = on the other hand.'],
  ['그래도 저는 찬성하는 편이에요.', 'Still, I tend to be in favor.', 'work', '-는 편이다 = tend to: 찬성하는 편이에요 (chanseonghaneun pyeonieyo).'],
  ['물론 단점도 있지만 괜찮아요.', "Of course there are downsides, but it's fine.", 'general', '물론 (mullon) = of course; -지만 = but.'],
  ['어떻게 보면 둘 다 맞아요.', 'In a way, both are right.', 'general', '어떻게 보면 (eotteoke bomyeon) = in a sense.'],
  ['꼭 그렇다고 볼 수는 없어요.', "You can't necessarily say that's so.", 'general', '꼭 ~ 것은 아니다 = not necessarily: 꼭 그렇다고 볼 수 없어요.'],
  ['어느 쪽도 완벽하지 않아요.', 'Neither side is perfect.', 'general', '어느 쪽도 = neither side: 완벽하지 않아요 (wanbyeokhaji anayo).'],
  ['생각해 보니 제가 틀렸어요.', 'On reflection, I was wrong.', 'general', '-아 보니 = upon doing: 생각해 보니 (saenggakae boni) = now that I think.'],
  ['그 점은 미처 생각하지 못했어요.', "I hadn't thought of that point.", 'general', '미처 (micheo) = (not) up to that point: 미처 못했어요.'],
  ['듣고 보니 일리가 있네요.', "Now that I hear it, it makes sense.", 'general', '-고 보니 = after doing: 듣고 보니 (deutgo boni).'],
  ['처음에는 반대했지만 지금은 찬성해요.', 'I opposed it at first, but now I agree.', 'work', null],
  ['서로 조금씩 양보하면 좋겠어요.', "I hope we each give a little.", 'work', '양보하다 = to yield/compromise: 조금씩 양보해요.'],
  // F. 결론 / 요약 (conclusion, summary)
  ['결론적으로 저는 이 제안에 찬성해요.', 'In conclusion, I support this proposal.', 'work', '결론적으로 (gyeolloncheogeuro) = in conclusion.'],
  ['요약하면 두 가지가 핵심이에요.', 'To summarize, two things are key.', 'work', '요약하면 (yoyakamyeon) = to summarize; 핵심 = the crux.'],
  ['다시 말하면 시간이 더 필요해요.', 'In other words, we need more time.', 'work', '다시 말하면 (dasi malhamyeon) = in other words.'],
  ['정리하자면 이렇게 돼요.', 'To put it in order, it comes to this.', 'work', '정리하자면 (jeongnihajamyeon) = to sum up.'],
  ['결국 선택은 각자의 몫이에요.', 'In the end the choice is up to each person.', 'general', '몫 (mok) = ones share/part: 각자의 몫 = each ones responsibility.'],
  ['이 정도면 충분히 설명한 것 같아요.', 'I think that explains it well enough.', 'general', '이 정도면 = at this level: 이 정도면 충분해요 = this much is enough.'],
  ['끝으로 한 가지만 덧붙일게요.', "Lastly, I'll add just one thing.", 'work', '끝으로 (kkeuteuro) = lastly; 덧붙이다 = to add on.'],
  ['좋은 토론이었다고 생각해요.', 'I think it was a good discussion.', 'work', '토론 (toron) = debate/discussion: 좋은 토론이었어요.'],
  ['다들 의견을 나눠 줘서 고마워요.', 'Thanks, everyone, for sharing your opinions.', 'general', '나누다 = to share: 나눠 줘서 (nanwo jwoseo) = for sharing.'],
  ['다음에 더 깊이 이야기해요.', "Let's talk more deeply next time.", 'general', '깊이 (gipi) = deeply: 깊이 이야기해요 = talk in depth.'],
  // G2. 토론 태도 / 추가 주제 (debate manners & more topics)
  ['그 주제는 논란이 많아요.', 'That topic is very controversial.', 'general', '논란 (nollan) = controversy: 논란이 많다 = be controversial.'],
  ['사람들의 의견이 크게 갈려요.', "People's opinions are sharply divided.", 'general', '갈리다 = to be split: 의견이 갈려요 (uigyeoni gallyeoyo).'],
  ['저는 중립을 지키고 싶어요.', 'I want to stay neutral.', 'work', '중립 (jungnip) = neutrality: 중립을 지키다 = stay neutral.'],
  ['감정보다 사실이 중요해요.', 'Facts matter more than emotions.', 'general', '감정 (gamjeong) = emotion: 감정보다 사실 = facts over feelings.'],
  ['상대방의 말을 끝까지 들어야 해요.', 'You should hear the other person out fully.', 'general', '상대방 (sangdaebang) = the other party; 끝까지 = to the end.'],
  ['반대 의견에도 귀를 기울여야 해요.', 'We should lend an ear to opposing views too.', 'general', '귀를 기울이다 = to lend an ear: 귀를 기울여요.'],
  ['토론할 때는 예의를 지켜야 해요.', 'In a debate you must be polite.', 'work', '예의 (yeui) = courtesy: 예의를 지키다 = be polite.'],
  ['제 말을 오해하지 마세요.', "Please don't misunderstand me.", 'general', '오해하다 = to misunderstand: 오해하지 마세요 (ohaehaji maseyo).'],
  ['근거 있는 주장이 설득력이 있어요.', 'A grounded argument is persuasive.', 'work', '설득력 (seoldeungnyeok) = persuasive power.'],
  ['다양한 관점이 필요해요.', 'We need diverse perspectives.', 'work', '관점 (gwanjeom) = perspective, viewpoint.'],
  ['이 문제에 정답은 없어요.', 'There is no single right answer to this.', 'general', '정답 (jeongdap) = correct answer.'],
  ['서로 이해하려고 노력해야 해요.', 'We should try to understand each other.', 'general', '-려고 = in order to: 이해하려고 노력해요 = try to understand.'],
  ['결정을 급하게 내리면 안 돼요.', "We shouldn't make the decision hastily.", 'work', '급하게 (geupage) = hastily: 급하게 내리다 = decide in a rush.'],
  ['저는 그 의견을 지지해요.', 'I back that opinion.', 'work', '지지하다 = to support/back: 지지해요 (jijihaeyo).'],
  ['이 논의는 시간이 좀 걸릴 것 같아요.', 'This discussion will probably take a while.', 'work', '논의 (nonui) = discussion: 논의가 걸리다 = it takes time.'],
  ['각자 자기 입장이 있어요.', 'Each person has their own stance.', 'general', '각자 (gakja) = each; 자기 (jagi) = ones own.'],
  ['더 나은 방향을 찾아야 해요.', 'We must find a better direction.', 'work', '나은 = better (from 낫다); 방향 (banghyang) = direction.'],
  ['협력하면 더 좋은 결과가 나와요.', 'Cooperation yields better results.', 'work', '협력하다 = to cooperate; 결과 (gyeolgwa) = result.'],
  ['비판보다 대안이 필요해요.', 'We need alternatives more than criticism.', 'work', '대안 (daean) = alternative; 비판 = criticism.'],
  ['좋은 질문이 좋은 토론을 만들어요.', 'Good questions make good discussions.', 'general', '만들다 keeps ㄹ before -어: 만들어요 (mandeureoyo) = makes.'],
];

// Keep tips on ~40% of cards (spec: ~40%). Selected for the most instructive,
// non-duplicated rules, spread across every sub-theme.
const KEEP = new Set([
  // node-27
  3051, 3053, 3055, 3056, 3058, 3060, 3065, 3067, 3073, 3075, 3081, 3082, 3089,
  3094, 3098, 3099, 3101, 3104, 3107, 3109, 3113, 3115, 3119, 3121, 3123, 3125,
  3127, 3132, 3133, 3134, 3137, 3141, 3145, 3146, 3148, 3149, 3151, 3154, 3156,
  3157, 3158, 3160, 3162, 3163, 3166, 3167, 3174,
  // node-28
  3176, 3177, 3178, 3179, 3180, 3182, 3184, 3187, 3189, 3191, 3192, 3195, 3198,
  3199, 3200, 3203, 3204, 3207, 3210, 3212, 3214, 3215, 3216, 3217, 3219, 3223,
  3228, 3233, 3234, 3238, 3239, 3242, 3244, 3253, 3255, 3259, 3260, 3261, 3263,
  3264, 3266, 3268, 3271, 3272, 3273, 3276, 3277, 3285, 3286, 3292, 3294, 3296,
  3300,
]);

const cards = [];
let idx = 0;
const emit = (arr, node) => {
  for (const [target, english, tags, grammar] of arr) {
    const n = 3051 + idx;
    const tagList = tags === 'general' ? ['general'] : ['general', tags];
    const card = {
      id: `ko-${n}`,
      target,
      english,
      audio: `ko-ko-${n}.mp3`,
      tags: tagList,
      grammarNode: node,
      priority: n,
    };
    if (grammar && KEEP.has(n)) card.grammar = grammar;
    cards.push(card);
    idx++;
  }
};
emit(node27, 'node-27');
emit(node28, 'node-28');

// Second pass: add topical family/work tags so each lands near ~25%.
const addTag = (ids, tag) => {
  const s = new Set(ids);
  for (const c of cards) {
    const n = +c.id.slice(3);
    if (s.has(n) && !c.tags.includes(tag)) c.tags.push(tag);
  }
};
addTag([
  // node-27: dorm / host family / roommate / personal life abroad
  3105, 3106, 3107, 3122, 3134, 3136, 3143, 3163,
  // node-28: life, health, home, generation, society-personal topics
  3237, 3238, 3241, 3242, 3244, 3245, 3246, 3247, 3248, 3249, 3250, 3251, 3252,
  3253, 3256, 3257, 3258, 3229, 3230, 3231, 3232, 3234, 3235, 3239, 3240, 3243,
  3254, 3255, 3296, 3297, 3298,
], 'family');
addTag([
  3181, 3182, 3184, 3185, 3186, 3187, 3193, 3202, 3203, 3204, 3207, 3210,
], 'work');

console.log('node27:', node27.length, 'node28:', node28.length, 'total:', cards.length);
fs.writeFileSync(__dirname + '/wave4-ko-cards-D.json', JSON.stringify(cards, null, 1) + '\n');
