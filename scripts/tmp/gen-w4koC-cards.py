# -*- coding: utf-8 -*-
import json

# Each entry: [target, english, tags(without 'general'), tip]
# 'general' is prepended to every card automatically.
N25 = [
# ── 우정 friendship (2801-2825) ──
["우리는 십 년 된 친구예요.", "We've been friends for ten years.", ["family"], "된 (doen) before a time word = of that length: 십 년 된 = of ten years."],
["저는 친한 친구가 많지 않아요.", "I don't have many close friends.", [], "많지 않아요 (manchi anayo) = 'not many' — long negation with 안 is also fine: 안 많아요."],
["진짜 친구는 어려울 때 옆에 있어요.", "A true friend is there in hard times.", [], "-(으)ㄹ 때 (-l ttae) = 'when': 어려울 때 = when it's hard."],
["제일 친한 친구가 다음 달에 이사를 가요.", "My best friend is moving away next month.", [], ""],
["친구랑 사소한 일로 다퉜어요.", "I quarreled with a friend over something trivial.", [], "-(으)로 (-ro) here = 'over/because of': 일로 = over a matter."],
["오랜만에 옛 친구를 만났어요.", "I met an old friend after a long time.", ["travel"], "오랜만에 (oraenmane) = after a long time — a fixed set phrase."],
["그 친구는 항상 제 이야기를 잘 들어요.", "That friend always listens to me well.", [], ""],
["친구가 힘들어할 때 옆에서 위로해 줬어요.", "I comforted my friend when they were struggling.", ["family"], "3rd-person feelings take -어하다: 친구가 힘들어해요 (himdeureohaeyo), not 힘들어요."],
["우정도 노력이 필요해요.", "Friendship needs effort too.", [], "-도 (-do) = 'too/even': 우정도 = friendship too."],
["저는 새 친구를 쉽게 못 사귀어요.", "I don't make new friends easily.", [], "못 (mot) before a verb = 'can't': 못 사귀어요 = can't befriend."],
["새 회사에서 좋은 동료를 친구로 사귀었어요.", "I made a good colleague into a friend at my new company.", ["work"], ""],
["우리는 취미가 비슷해서 금방 친해졌어요.", "We got close quickly because our hobbies are similar.", [], "-아/어서 (-aseo/-eoseo) = 'so/because': 비슷해서 = because they're similar."],
["저는 친구의 비밀을 끝까지 지켜 줬어요.", "I kept my friend's secret to the end.", [], "-아/어 주다 (-a/eo juda) = do a favor for someone: 지켜 줬어요 = kept (it) for them."],
["그는 친구들을 정말 잘 챙겨요.", "He really takes good care of his friends.", [], ""],
["우리는 서로 뭐든지 다 말해요.", "We tell each other everything.", [], "뭐든지 (mwodeunji) = 'anything/everything' — 뭐 + 든지."],
["친구랑 밤새 수다를 떨었어요.", "I chatted with a friend all night.", [], "수다를 떨다 (suda-reul tteolda) = to chatter — a fixed expression."],
["저는 그 친구를 정말 믿어요.", "I really trust that friend.", [], ""],
["저는 멀리 사는 친구가 많이 그리워요.", "I really miss my friend who lives far away.", ["travel"], "I-feelings stay plain: 저는 그리워요 (geuriwoyo). For others use 그리워해요."],
["친구가 제 생일을 기억해 줬어요.", "My friend remembered my birthday.", [], ""],
["친구 사이에도 예의가 중요해요.", "Manners matter even between friends.", [], "-에도 (-edo) = 'even in/at': 사이에도 = even between (them)."],
["제 친구는 제 좋은 성적을 부러워해요.", "My friend envies my good grades.", ["work"], "Others envying = 부러워해요 (bureowohaeyo); for yourself say 부러워요."],
["그 친구랑은 말이 정말 잘 통해요.", "I click really well with that friend.", [], "말이 통하다 (mari tonghada) = to click / communicate well."],
["친구가 갑자기 연락을 끊어서 서운했어요.", "I was hurt when my friend suddenly cut off contact.", [], ""],
["어릴 때 친구가 제일 편해요.", "Childhood friends are the most comfortable.", ["family"], "제일 (jeil) = 'the most' — same as 가장."],
["좋은 친구를 만나서 정말 다행이에요.", "I'm so glad I met a good friend.", [], "다행이에요 (dahaengieyo) = 'what a relief / I'm glad' — a set phrase."],

# ── 연애 dating/romance (2826-2850) ──
["두 사람이 요즘 사귀는 것 같아요.", "Those two seem to be dating these days.", [], "-는 것 같아요 (-neun geot gatayo) = 'it seems that': a soft guess."],
["저는 그 사람한테 첫눈에 반했어요.", "I fell for that person at first sight.", [], "첫눈에 반하다 (cheonnune banhada) = to fall in love at first sight."],
["우리는 지난달부터 사귀기 시작했어요.", "We started dating last month.", [], "-기 시작하다 (-gi sijakhada) = 'start doing': 사귀기 시작했어요."],
["그는 그녀를 정말 많이 좋아해요.", "He likes her a lot.", [], "좋아하다 (joahada) is a verb, so 3rd person is fine: 좋아해요."],
["첫 데이트 때 너무 긴장됐어요.", "I was so nervous on the first date.", ["travel"], "긴장되다 (ginjangdoeda) = to get nervous — past: 긴장됐어요."],
["남자친구가 저한테 꽃을 선물해 줬어요.", "My boyfriend gave me flowers.", [], ""],
["여자친구랑 매일 밤 통화해요.", "I talk on the phone with my girlfriend every night.", [], "통화하다 (tonghwahada) = to talk on the phone (vs 전화하다 = to call)."],
["우리는 다음 주에 백일이에요.", "It's our 100-day anniversary next week.", [], "백일 (baegil) = the 100-day mark couples celebrate."],
["그 사람 생각이 자꾸 나요.", "I keep thinking about that person.", [], "생각이 나다 (saenggagi nada) = 'come to mind'; 자꾸 = repeatedly."],
["저는 아직 마음을 고백하지 못했어요.", "I haven't confessed my feelings yet.", [], "-지 못하다 (-ji mothada) = long form of 'can't': 고백하지 못했어요."],
["친구가 저를 소개팅에 데려갔어요.", "A friend took me to a blind date.", [], "소개팅 (sogaeting) = a set-up blind date."],
["두 사람은 성격이 아주 잘 맞아요.", "The two are very well-matched in personality.", [], "성격이 맞다 (seonggyeogi matda) = personalities match."],
["그는 여자친구를 정말 아껴요.", "He really cherishes his girlfriend.", [], ""],
["우리는 작은 일로 자주 싸워요.", "We often fight over little things.", [], ""],
["오래 사귀면 편해지는 것 같아요.", "I think you get comfortable after dating a long time.", [], "-(으)면 (-myeon) = 'if/when': 사귀면 = if you date."],
["그녀는 남자친구를 많이 그리워해요.", "She misses her boyfriend a lot.", [], "She (3rd person) misses = 그리워해요, not 그리워요."],
["저는 연애보다 일이 더 중요해요.", "Work matters more to me than dating.", ["work"], "-보다 (-boda) = 'than': 연애보다 = than dating."],
["우리는 손을 잡고 공원을 걸었어요.", "We walked in the park holding hands.", ["travel"], "-고 (-go) links actions: 잡고 걸었어요 = held (hands) and walked."],
["그 사람이 저한테 관심이 있는 것 같아요.", "That person seems interested in me.", [], "관심이 있다 (gwansimi itda) = to be interested."],
["헤어진 후에 한동안 많이 힘들었어요.", "I struggled a lot for a while after we broke up.", [], "-(으)ㄴ 후에 (-n hue) = 'after': 헤어진 후에 = after breaking up."],
["저는 다시 좋은 사람을 만나고 싶어요.", "I want to meet a good person again.", [], "-고 싶다 (-go sipda) = 'want to': 만나고 싶어요."],
["남자친구가 저를 집까지 데려다줬어요.", "My boyfriend walked me home.", ["travel"], "-까지 (-kkaji) = 'as far as/to': 집까지 = all the way home."],
["우리는 기념일마다 같이 사진을 찍어요.", "We take photos together on every anniversary.", [], "-마다 (-mada) = 'every': 기념일마다 = on every anniversary."],
["그는 아직 고백할 용기가 없어요.", "He still doesn't have the courage to confess.", [], ""],
["짝사랑은 정말 외로운 것 같아요.", "One-sided love seems really lonely.", [], "짝사랑 (jjaksarang) = a one-sided crush."],

# ── 가족 갈등 family conflict (2851-2875) ──
["저는 요즘 아버지와 자주 부딪쳐요.", "I clash with my father often these days.", ["family"], "부딪치다 (budichida) = to clash/bump — used for conflicts too."],
["동생이 제 옷을 말없이 가져갔어요.", "My sibling took my clothes without asking.", ["family"], "말없이 (mareobsi) = 'without a word' — 말 + 없이."],
["부모님은 제 진로를 반대하세요.", "My parents oppose my career path.", ["family", "work"], "Elders as subject take -세요: 부모님은 반대하세요 (bandaehaseyo)."],
["형이랑 사소한 일로 말다툼했어요.", "I argued with my older brother over something trivial.", ["family"], "말다툼하다 (maldatumhada) = to have a verbal argument."],
["어머니께서 제 성적 때문에 화가 나셨어요.", "My mother got angry about my grades.", ["family"], "께서 (kkeseo) is the honorific subject marker; verb adds -시-: 나셨어요."],
["저는 부모님과 생각이 많이 달라요.", "I think very differently from my parents.", ["family"], "생각이 다르다 (saenggagi dareuda) = to think differently."],
["누나가 저한테 잔소리를 많이 해요.", "My older sister nags me a lot.", ["family"], "잔소리 (jansori) = nagging; 잔소리하다 = to nag."],
["동생은 항상 저한테만 화를 내요.", "My sibling always gets angry only at me.", ["family"], "-한테만 (-hantero + 만) = 'only at': 저한테만 = only at me."],
["아버지는 제 친구들을 좋아하지 않으세요.", "My father doesn't like my friends.", ["family"], "Honorific negation: 좋아하지 않으세요 (joahaji aneuseyo)."],
["가족끼리도 가끔 오해가 생겨요.", "Misunderstandings sometimes arise even among family.", ["family"], "-끼리 (-kkiri) = 'among (a group)': 가족끼리 = among family."],
["저는 부모님께 솔직하게 말하기가 어려워요.", "It's hard for me to speak honestly to my parents.", ["family"], "께 (kke) = honorific 'to': 부모님께 = to (my) parents."],
["형은 제 이야기를 잘 안 들어요.", "My older brother doesn't really listen to me.", ["family"], "안 (an) before a verb = short negation: 안 들어요 = doesn't listen."],
["명절만 되면 가족들이 자주 다퉈요.", "Whenever the holidays come, the family often quarrels.", ["family"], "-만 되면 (-man doemyeon) = 'whenever it becomes': 명절만 되면."],
["부모님은 제가 늦게 들어오면 걱정하세요.", "My parents worry when I come home late.", ["family"], "Elders subject → 걱정하세요 (geokjeonghaseyo), not 걱정해요."],
["동생과 방을 같이 써서 좀 불편해요.", "It's a bit uncomfortable sharing a room with my sibling.", ["family"], ""],
["저는 가끔 그냥 집을 나가고 싶어요.", "Sometimes I just want to leave home.", ["family"], ""],
["아버지는 제 결정을 잘 이해하지 못하세요.", "My father doesn't quite understand my decision.", ["family"], "Honorific can't: 이해하지 못하세요 (ihaehaji mothaseyo)."],
["우리 가족은 대화가 좀 부족한 것 같아요.", "I think our family lacks communication a bit.", ["family"], "-(으)ㄴ 것 같아요 hedges a judgment: 부족한 것 같아요."],
["어머니와 저는 취향이 너무 달라요.", "My mother and I have very different tastes.", ["family"], "취향 (chwihyang) = taste/preference."],
["형은 항상 부모님 편만 들어요.", "My older brother always takes our parents' side.", ["family"], "편을 들다 (pyeoneul deulda) = to take someone's side."],
["저는 화가 나도 최대한 참으려고 해요.", "Even when I'm angry, I try my best to hold it in.", ["family"], "-(으)려고 하다 (-ryeogo hada) = 'try/intend to': 참으려고 해요."],
["동생이 약속을 또 어겨서 실망했어요.", "I was disappointed my sibling broke a promise again.", ["family"], "약속을 어기다 (yaksogeul eogida) = to break a promise."],
["부모님의 기대가 가끔 좀 부담스러워요.", "My parents' expectations sometimes feel a bit burdensome.", ["family"], "부담스럽다 (budamseureopda) = to feel like a burden/pressure."],
["가족한테 상처 주는 말을 하고 후회했어요.", "I regretted saying hurtful words to my family.", ["family"], "상처를 주다 (sangcheoreul juda) = to hurt (someone's) feelings."],
["서로 목소리를 높이면 대화가 안 돼요.", "If we raise our voices, we can't talk.", ["family"], "안 되다 (an doeda) = 'doesn't work/won't do': 대화가 안 돼요."],

# ── 화해 reconciliation (2876-2900) ──
["어제 동생과 드디어 화해했어요.", "Yesterday I finally made up with my sibling.", ["family"], "화해하다 (hwaehaehada) = to make up / reconcile."],
["이번에는 제가 먼저 사과할게요.", "This time I'll apologize first.", ["family"], "-(으)ㄹ게요 (-lgeyo) = a promise/commitment: 사과할게요 = I'll apologize."],
["다시는 그런 말을 하지 않을게요.", "I won't say things like that again.", ["family"], "다시는 ... -지 않을게요 = 'I promise not to ... again'."],
["우리는 오랜 오해를 드디어 풀었어요.", "We finally cleared up a long misunderstanding.", ["family"], "오해를 풀다 (ohae-reul pulda) = to clear up a misunderstanding."],
["아버지께 죄송하다고 말씀드렸어요.", "I told my father I was sorry.", ["family"], "말씀드리다 (malsseumdeurida) = humbly 'tell' an elder."],
["형이 저한테 먼저 손을 내밀었어요.", "My older brother reached out to me first.", ["family"], "손을 내밀다 (soneul naemilda) = to reach out / offer a hand."],
["진심으로 사과하면 마음이 풀려요.", "If you apologize sincerely, feelings ease.", [], "진심으로 (jinsimeuro) = sincerely; 마음이 풀리다 = feelings ease."],
["저는 친구와 다시 예전처럼 지내요.", "I get along with my friend like before again.", [], "-처럼 (-cheoreom) = 'like/as': 예전처럼 = like before."],
["우리 이제 그만 싸우고 화해해요.", "Let's stop fighting and make up now.", ["family"], "-아/어요 can be a suggestion: 화해해요 = let's make up."],
["어머니가 제 마음을 이해해 주셨어요.", "My mother understood my feelings.", ["family"], "-아/어 주시다 = do a favor (honored): 이해해 주셨어요."],
["시간이 지나니까 서운함이 사라졌어요.", "As time passed, the hurt disappeared.", [], "-(으)니까 (-nikka) = 'as/since': 지나니까 = as (time) passed."],
["제가 다 잘못했어요, 정말 미안해요.", "It was all my fault, I'm really sorry.", [], "잘못하다 (jalmothada) = to do wrong / be at fault."],
["앞으로 더 잘할게요.", "I'll do better from now on.", ["family"], "-(으)ㄹ게요 promises effort: 잘할게요 = I'll do well."],
["우리는 서로 안고 사과했어요.", "We hugged and apologized to each other.", ["family"], "안다 (anda) = to hug; 안고 = hug-and(then)."],
["화해한 후에 마음이 한결 편해졌어요.", "After making up, I felt much more at ease.", ["family"], "한결 (hangyeol) = noticeably more; 편해지다 = to become at ease."],
["형과 오랜 갈등이 드디어 풀렸어요.", "A long conflict with my brother finally resolved.", ["family"], "갈등 (galdeung) = conflict; 풀리다 = to get resolved."],
["제가 오늘 저녁에 친구에게 먼저 연락할게요.", "I'll be the one to contact my friend this evening.", [], "-에게 (-ege) = 'to (a person)', same as -한테."],
["부모님이 제 사과를 흔쾌히 받아 주셨어요.", "My parents readily accepted my apology.", ["family"], "받아 주다 (bada juda) = to accept (as a favor); 흔쾌히 = gladly."],
["솔직하게 이야기하니까 오해가 풀렸어요.", "Talking honestly cleared up the misunderstanding.", ["family"], ""],
["우리는 얼마 뒤에 다시 사이가 좋아졌어요.", "We got along well again a while later.", [], "사이가 좋다 (saiga jota) = to be on good terms."],
["서로 조금씩 양보하기로 했어요.", "We decided to each give in a little.", ["family"], "-기로 하다 (-giro hada) = 'decide to': 양보하기로 했어요."],
["다음부터는 절대 화내지 않을게요.", "I promise I'll never get angry from next time.", ["family"], "화내다 (hwanaeda) = to get angry (at someone)."],
["동생이 눈물을 흘리며 진심으로 사과했어요.", "My sibling apologized sincerely, in tears.", ["family"], "눈물을 흘리다 (nunmureul heullida) = to shed tears."],
["진심이 서로 통해서 우리는 화해했어요.", "Our sincerity got through and we made up.", ["family"], ""],
["오해가 다 풀리니까 정말 후련해요.", "I feel so relieved now the misunderstanding is cleared.", [], "후련하다 (huryeonhada) = to feel relieved/refreshed (I-feeling)."],

# ── 결혼/청첩장 marriage/wedding invitation (2901-2925) ──
["다음 달에 사촌 언니가 결혼해요.", "My cousin gets married next month.", ["family"], "사촌 (sachon) = cousin; 언니 = older sister (female speaker)."],
["어제 친구의 청첩장을 받았어요.", "I received my friend's wedding invitation yesterday.", [], "청첩장 (cheongcheopjang) = a wedding invitation card."],
["결혼식은 이번 주 토요일 오후 두 시예요.", "The wedding is this Saturday at 2 p.m.", [], "두 시 (du si) = two o'clock; native numbers count the hour."],
["두 사람이 드디어 지난주에 약혼했어요.", "The two finally got engaged last week.", [], "약혼하다 (yakonhada) = to get engaged."],
["저는 친구의 결혼식에 꼭 갈 거예요.", "I'll definitely go to my friend's wedding.", [], "-(으)ㄹ 거예요 (-l geoyeyo) = future/plan: 갈 거예요 = will go."],
["신부가 정말 아름다웠어요.", "The bride was truly beautiful.", [], "아름답다 describes looks, so no -어하다: 신부가 아름다웠어요."],
["신랑이 많이 긴장한 것 같았어요.", "The groom seemed very nervous.", [], "-(으)ㄴ 것 같다 for a past guess: 긴장한 것 같았어요."],
["축의금은 봉투에 넣어서 내요.", "You put the cash gift in an envelope to give.", [], "축의금 (chuguigeum) = congratulatory cash gift."],
["결혼식이 끝난 후에 피로연이 있어요.", "There's a reception after the wedding.", [], "피로연 (piroyeon) = a wedding reception/banquet."],
["부모님께서 두 사람의 결혼을 축하해 주셨어요.", "My parents congratulated the couple's marriage.", ["family"], "께서 + -셨어요 keeps the honor on the elders as subject."],
["저는 아직 결혼 생각이 전혀 없어요.", "I have no thoughts of marriage at all yet.", ["family"], "전혀 (jeonhyeo) = '(not) at all', pairs with a negative."],
["청첩장에 예식장 주소가 적혀 있어요.", "The venue address is written on the invitation.", [], "-어 있다 (-eo itda) = a resulting state: 적혀 있어요 = is written."],
["우리는 작고 조용한 결혼식을 하고 싶어요.", "We want a small, quiet wedding.", [], ""],
["신혼여행은 제주도로 가기로 했어요.", "They decided to go to Jeju for the honeymoon.", ["travel"], "신혼여행 (sinhonyeohaeng) = honeymoon; -(으)로 = direction 'to'."],
["결혼 준비는 생각보다 훨씬 힘들어요.", "Wedding preparation is much harder than expected.", [], "생각보다 (saenggakboda) = 'than (I) thought'; 훨씬 = far more."],
["많은 하객들이 신랑 신부를 축하했어요.", "Many guests congratulated the bride and groom.", [], "하객 (hagaek) = a wedding guest."],
["언니가 저한테 부케를 던져 줬어요.", "My sister threw me the bouquet.", ["family"], "부케 (buke) = bouquet; 던지다 = to throw."],
["두 사람은 결혼반지를 함께 골랐어요.", "The two chose their wedding rings together.", [], "고르다 (goreuda) is 르-irregular: 골라요, past 골랐어요."],
["주례 선생님의 말씀이 정말 감동적이었어요.", "The officiant's words were really moving.", [], "말씀 (malsseum) = honored 'words/speech' of an elder."],
["결혼식에 뭘 입을지 아직 못 정했어요.", "I haven't decided what to wear to the wedding.", [], "-(으)ㄹ지 (-lji) = 'what/whether to': 입을지 = what to wear."],
["두 분이 오래오래 행복하시길 바라요.", "I hope the two live happily for a long time.", ["family"], "-시길 바라요 = 'I hope (you, honored) ...': 행복하시길 바라요."],
["친구가 청첩장을 직접 만들어서 보냈어요.", "My friend made the invitations themselves and sent them.", [], "직접 (jikjeop) = 'in person / oneself'."],
["신랑 신부가 결혼사진을 앨범으로 만들었어요.", "The couple made their wedding photos into an album.", [], "-(으)로 (-ro) = 'into': 앨범으로 = into an album."],
["저는 친구 결혼식에서 축가를 불렀어요.", "I sang a congratulatory song at my friend's wedding.", [], "축가 (chukga) = a celebratory song; 부르다 → 불렀어요."],
["두 사람의 앞날을 진심으로 축복해요.", "I sincerely bless the couple's future.", [], "앞날 (amnal) = the future/days ahead; 축복하다 = to bless."],
]

N26 = [
# ── K-pop/콘서트 (2926-2950) ──
["저는 케이팝을 정말 좋아해요.", "I really like K-pop.", [], "케이팝 (keipap) = K-pop, written as a loanword in hangul."],
["다음 주에 좋아하는 가수의 콘서트에 가요.", "I'm going to my favorite singer's concert next week.", ["travel"], "좋아하는 (joahaneun) = 'that (I) like' — verb + -는 modifies a noun."],
["콘서트 표가 십 분 만에 다 매진됐어요.", "The concert tickets all sold out in ten minutes.", ["travel"], "매진되다 (maejindoeda) = to sell out; -만에 = 'within/in just'."],
["저는 응원봉을 흔들면서 노래를 따라 불렀어요.", "I sang along waving my light stick.", [], "-(으)면서 (-myeonseo) = 'while': 흔들면서 = while waving."],
["그 아이돌 그룹은 전 세계에서 유명해요.", "That idol group is famous all over the world.", [], "전 세계 (jeon segye) = the whole world."],
["저는 이 노래 가사를 벌써 다 외웠어요.", "I've already memorized all the lyrics to this song.", [], "가사 (gasa) = lyrics; 외우다 = to memorize."],
["콘서트장 분위기가 정말 뜨거웠어요.", "The atmosphere at the concert was really electric.", ["travel"], "분위기 (bunwigi) = atmosphere/mood."],
["팬들이 한 목소리로 가수 이름을 외쳤어요.", "The fans shouted the singer's name in one voice.", [], "한 목소리로 (han moksoriro) = in one voice; 외치다 = to shout."],
["저는 최애 멤버의 사진을 열심히 모아요.", "I diligently collect photos of my favorite member.", [], "최애 (choeae) = one's absolute favorite (slang, 최고 + 애)."],
["새 앨범이 나오자마자 바로 샀어요.", "I bought the new album as soon as it came out.", [], "-자마자 (-jamaja) = 'as soon as': 나오자마자 = as soon as it came out."],
["그 가수는 춤과 노래를 둘 다 잘해요.", "That singer is good at both dancing and singing.", [], "둘 다 (dul da) = 'both'; -와/과 = 'and': 춤과 노래."],
["콘서트에서 앙코르를 세 곡이나 했어요.", "They did as many as three encore songs.", ["travel"], "-이나 (-ina) = 'as many as (surprisingly)': 세 곡이나."],
["무대 조명이 정말 화려했어요.", "The stage lighting was really dazzling.", [], "화려하다 (hwaryeohada) = to be splendid/dazzling."],
["저는 그 가수의 공식 팬클럽에 가입했어요.", "I joined that singer's official fan club.", [], "가입하다 (gaiphada) = to sign up / join."],
["표를 못 구해서 콘서트를 생중계로 봤어요.", "I couldn't get a ticket, so I watched the concert live-streamed.", [], "생중계 (saengjunggye) = a live broadcast/stream."],
["그 그룹의 신곡이 음원 차트 일 위를 했어요.", "That group's new song hit number one on the charts.", ["work"], "신곡 (singok) = a new song; 일 위 = first place."],
["콘서트가 끝나고도 한참 여운이 남았어요.", "The feeling lingered long after the concert ended.", ["travel"], "여운이 남다 (yeouni namda) = the afterglow lingers."],
["저는 데뷔 때부터 그들을 계속 응원했어요.", "I've supported them ever since their debut.", [], "-부터 (-buteo) = 'from/since': 데뷔 때부터 = since debut."],
["표를 끝내 못 구해서 정말 아쉬웠어요.", "I ended up not getting a ticket, so I was really disappointed.", [], "I-feeling stays plain: 저는 아쉬웠어요 (aswiwosseoyo)."],
["친구가 사인회에 같이 가자고 했어요.", "A friend suggested we go to a signing event together.", [], "-자고 하다 (-jago hada) = report a suggestion: 가자고 했어요."],
["그 아이돌은 팬들을 정말 소중하게 생각해요.", "That idol truly treasures the fans.", [], "소중하게 (sojunghage) = preciously; 생각하다 here = to regard."],
["저는 그 콘서트 영상을 몇 번이나 다시 봤어요.", "I rewatched that concert video several times.", [], "몇 번이나 (myeot beonina) = 'so many times', with emphatic -이나."],
["무대 위의 그 가수가 정말 멋있었어요.", "That singer on stage was really cool.", [], "위 (wi) = 'top/on'; -의 links nouns: 무대 위의 = on the stage."],
["저는 노래방에서 케이팝을 자주 불러요.", "I often sing K-pop at the karaoke room.", [], "노래방 (noraebang) = a karaoke room (song + room)."],
["열성 팬들이 가수를 위해 기부도 해요.", "Devoted fans even donate for their singer.", [], "-을/를 위해 (-eul wihae) = 'for (the sake of)': 가수를 위해."],

# ── 영화/드라마 (2951-2975) ──
["어제 친구랑 극장에 영화를 보러 갔어요.", "Yesterday I went to the cinema with a friend to see a movie.", ["travel"], "-(으)러 가다 (-reo gada) = 'go in order to': 보러 갔어요."],
["그 영화는 결말이 정말 슬펐어요.", "That movie's ending was really sad.", [], "결말 (gyeolmal) = ending; here 슬프다 describes the ending itself."],
["저는 한국 드라마를 보면서 한국어를 배워요.", "I learn Korean by watching Korean dramas.", [], "-(으)면서 (-myeonseo) = 'while': 보면서 = while watching."],
["이 드라마는 매주 금요일 밤에 방송해요.", "This drama airs every Friday night.", [], "방송하다 (bangsonghada) = to broadcast/air."],
["주인공 배우의 연기가 정말 훌륭했어요.", "The lead actor's acting was excellent.", ["work"], "주인공 (juingong) = protagonist; 연기 = acting."],
["그 영화는 실화를 바탕으로 만들었어요.", "That movie was based on a true story.", [], "-을 바탕으로 (-eul batangeuro) = 'based on': 실화를 바탕으로."],
["다음 회가 너무 궁금해서 잠이 안 와요.", "I'm so curious about the next episode I can't sleep.", ["family"], "궁금하다 (gunggeumhada) = to be curious (I-feeling)."],
["저는 무서운 영화를 잘 못 봐요.", "I can't really watch scary movies.", ["family"], "무서운 (museoun) = 'scary' — 무섭다's noun-modifying form."],
["이 드라마는 요즘 젊은 사람들한테 인기가 많아요.", "This drama is very popular with young people these days.", [], "인기가 많다 (ingiga manta) = to be popular; -한테 = 'with/among'."],
["영화관에서 팝콘을 사서 먹었어요.", "I bought popcorn at the cinema and ate it.", ["travel"], "-아/어서 links order: 사서 먹었어요 = bought (it) and ate."],
["그 배우는 이 작품으로 큰 상을 받았어요.", "That actor won a big award for this work.", ["work"], "작품 (jakpum) = a (creative) work; 상을 받다 = to win an award."],
["저는 주말에 그 드라마를 밤새 몰아서 봤어요.", "I binge-watched that drama all night on the weekend.", ["family"], "몰아서 보다 (maraseo boda) = to binge-watch."],
["저는 감동적인 영화를 보면 자주 울어요.", "I often cry when I watch moving movies.", ["family"], "감동적인 (gamdongjeogin) = moving/touching (noun-modifying)."],
["이 영화의 배경 음악이 정말 아름다워요.", "This movie's background music is really beautiful.", [], "배경 음악 (baegyeong eumak) = background music/score."],
["저는 그 드라마의 마지막 회를 놓쳤어요.", "I missed the last episode of that drama.", ["family"], "놓치다 (nochida) = to miss (catch); 마지막 회 = last episode."],
["남동생은 액션 영화를 제일 좋아해요.", "My little brother likes action movies the best.", ["family"], "남동생 (namdongsaeng) = younger brother (male sibling)."],
["영화가 시작하기 전에 광고가 너무 많아요.", "There are too many ads before the movie starts.", [], "-기 전에 (-gi jeone) = 'before': 시작하기 전에."],
["저는 자막 없이 드라마를 이해하고 싶어요.", "I want to understand dramas without subtitles.", [], "자막 (jamak) = subtitles; 없이 = 'without'."],
["그 영화는 상영 시간이 두 시간이 넘어요.", "That movie's running time is over two hours.", [], "넘다 (neomda) = to exceed: 두 시간이 넘어요."],
["저는 주말마다 집에서 넷플릭스를 봐요.", "I watch Netflix at home every weekend.", ["family"], ""],
["이 장면이 이 영화의 명장면이에요.", "This scene is the highlight of this movie.", [], "장면 (jangmyeon) = scene; 명장면 = a famous/best scene."],
["배우가 인터뷰에서 촬영 뒷이야기를 했어요.", "The actor shared behind-the-scenes stories in an interview.", ["work"], "촬영 (chwaryeong) = filming/shooting."],
["그 인기 드라마는 소설을 원작으로 해요.", "That popular drama is based on a novel.", [], "-을 원작으로 하다 = 'be based on (an original work)'."],
["저는 예고편만 보고도 눈물이 났어요.", "I teared up just from the trailer.", [], "예고편 (yegopyeon) = a trailer/preview; -고도 = 'even after'."],
["친구가 이 영화를 꼭 보라고 추천했어요.", "A friend recommended I definitely see this movie.", [], "-(으)라고 하다 = report a command: 보라고 했어요 = told (me) to watch."],

# ── 미술관/전시 (2976-3000) ──
["저는 주말에 미술관에 전시를 보러 갔어요.", "On the weekend I went to the art museum to see an exhibition.", ["travel"], "미술관 (misulgwan) = art museum; 전시 = exhibition."],
["이 그림은 백 년도 더 전에 그린 거예요.", "This painting was painted over a hundred years ago.", [], "-(으)ㄴ 거예요 nominalizes: 그린 거예요 = it's one (that was) painted."],
["그 전시회는 입장료가 무료였어요.", "That exhibition's admission was free.", ["travel"], "입장료 (ipjangnyo) = admission fee; 무료 = free of charge."],
["저는 이 화가의 작품을 아주 좋아해요.", "I really like this painter's works.", [], "화가 (hwaga) = painter; 작품 = work(s) of art."],
["미술관 안에서는 사진을 찍으면 안 돼요.", "You must not take photos inside the museum.", ["travel"], "-(으)면 안 되다 = 'must not': 찍으면 안 돼요 = mustn't photograph."],
["이 조각상은 실제로 보니까 훨씬 더 웅장해요.", "This sculpture is far more grand in person.", ["travel"], "실제로 (siljero) = in reality/person; 조각상 = a statue."],
["그 전시는 다음 달까지만 열려요.", "That exhibition is only open until next month.", ["travel"], "-까지만 (-kkajiman) = 'only until': 다음 달까지만."],
["해설사가 그림 하나하나를 자세히 설명해 줬어요.", "The docent explained each painting in detail.", [], "해설사 (haeseolsa) = a guide/docent; 자세히 = in detail."],
["저는 이 작품의 색이 정말 마음에 들어요.", "I really like the colors of this work.", [], "마음에 들다 (maeume deulda) = to be to one's liking."],
["저는 미술관에서 엽서를 기념품으로 샀어요.", "I bought a postcard as a souvenir at the museum.", ["travel"], "기념품 (ginyeompum) = a souvenir; -(으)로 = 'as'."],
["다행히 이 전시는 사진 촬영이 가능해요.", "Luckily, photography is allowed at this exhibition.", ["travel"], "가능하다 (ganeunghada) = to be possible/allowed."],
["그 화가는 주로 조용한 시골 풍경을 그려요.", "That painter mainly paints quiet rural landscapes.", [], "주로 (juro) = mainly; 풍경 = scenery/landscape."],
["저는 추상화보다 풍경화를 훨씬 더 좋아해요.", "I prefer landscape paintings much more than abstract ones.", [], "-보다 (-boda) = 'than': 추상화보다 = than abstract art."],
["주말이라서 전시장이 사람들로 붐볐어요.", "Being the weekend, the exhibition hall was crowded.", ["travel"], "-(으)로 here = 'with': 사람들로 붐볐어요 = crowded with people."],
["저는 이 작품 앞에서 한참 동안 서 있었어요.", "I stood in front of this work for a long while.", ["travel"], "-어 있다 for a state: 서 있었어요 = was standing."],
["그 미술관은 매주 월요일에 문을 닫아요.", "That museum is closed every Monday.", ["travel"], "문을 닫다 (muneul datda) = to close (be closed)."],
["아이들을 위한 체험 전시도 따로 있어요.", "There's also a separate hands-on exhibition for children.", ["family"], "체험 (cheheom) = hands-on experience; 따로 = separately."],
["저는 미술관에서 도록을 한 권 샀어요.", "I bought a catalog at the museum.", ["travel"], "도록 (dorok) = an art catalog; 한 권 = one (book) volume."],
["이 그림은 사진으로 볼 때보다 훨씬 커요.", "This painting is much bigger than in photos.", [], "-(으)ㄹ 때보다 = 'than when': 볼 때보다 = than when seen."],
["유명한 그림 앞에는 사람들 줄이 아주 길었어요.", "The line in front of the famous painting was very long.", ["travel"], "줄이 길다 (juri gilda) = the line is long."],
["그 특별 전시는 예약을 해야 볼 수 있어요.", "You can only see that special exhibition with a reservation.", ["travel"], "-아/어야 ... -(으)ㄹ 수 있다 = 'can only ... if': 해야 볼 수 있어요."],
["저는 아직 현대 미술을 잘 이해하지 못해요.", "I still don't quite understand modern art.", [], "현대 미술 (hyeondae misul) = modern/contemporary art."],
["우리는 미술관 안 카페에서 잠깐 쉬었어요.", "We rested for a bit at the cafe inside the museum.", ["travel"], "잠깐 (jamkkan) = for a moment; 쉬다 = to rest."],
["이 젊은 작가는 아주 어린 나이에 유명해졌어요.", "This young artist became famous at a very young age.", ["work"], "-아/어지다 = 'become': 유명해졌어요 = became famous."],
["전시를 다 보고 나니까 새 영감이 떠올랐어요.", "After seeing the whole exhibition, new inspiration came to me.", [], "-고 나니까 = 'after doing': 보고 나니까 = after seeing."],

# ── 책 books/reading (3001-3025) ──
["저는 한 달에 책을 두 권씩 읽어요.", "I read two books a month.", [], "-씩 (-ssik) = 'each/apiece': 두 권씩 = two (books) each (time)."],
["이 소설은 끝까지 손에서 놓을 수가 없었어요.", "I couldn't put this novel down until the end.", [], "손에서 놓다 (sonaeseo nota) = to put down / let go of."],
["요즘 무슨 책을 읽고 있어요?", "What book are you reading these days?", [], "-고 있다 (-go itda) = ongoing action: 읽고 있어요 = am reading."],
["저는 이 작가의 담담한 문체가 정말 좋아요.", "I really like this author's calm writing style.", ["work"], "문체 (munche) = writing style; 담담하다 = calm/plain."],
["저는 자기 전에 항상 책을 조금 읽어요.", "I always read a bit before I sleep.", ["family"], "자기 전에 (jagi jeone) = before sleeping — 자다 + -기 전에."],
["그 책은 요즘 베스트셀러라서 다 팔렸어요.", "That book is a current bestseller, so it's all sold out.", ["work"], "-(이)라서 (-raseo) = 'since it is': 베스트셀러라서."],
["저는 어제 도서관에서 책을 세 권 빌렸어요.", "I borrowed three books from the library yesterday.", [], "빌리다 (billida) = to borrow; 세 권 = three volumes."],
["저는 이 시집을 친구에게 생일 선물로 줬어요.", "I gave this poetry book to a friend as a birthday gift.", [], "시집 (sijip) = a poetry collection; -(으)로 = 'as'."],
["저는 전자책보다 종이책이 훨씬 좋아요.", "I much prefer paper books to e-books.", [], "종이책 (jongichaek) = paper book; 전자책 = e-book."],
["이 책의 마지막 문장이 오래 기억에 남아요.", "The last sentence of this book stays with me.", [], "기억에 남다 (gieoge namda) = to stay in memory."],
["저는 독서 모임에서 매달 책을 한 권씩 읽어요.", "At my book club we read one book each month.", ["work"], "독서 모임 (dokseo moim) = a reading/book club."],
["그 소설은 인기가 많아서 영화로도 만들어졌어요.", "That novel was so popular it was even made into a movie.", [], "-아/어지다 (passive): 만들어졌어요 = got made."],
["저는 어려운 책은 보통 두 번씩 읽어요.", "I usually read difficult books twice.", [], "보통 (botong) = usually; 두 번 = twice."],
["이 책을 읽고 나서 생각이 많이 바뀌었어요.", "After reading this book, my thinking changed a lot.", [], "-고 나서 (-go naseo) = 'after (doing)': 읽고 나서 = after reading."],
["저는 여러 장르 중에서 추리 소설을 제일 좋아해요.", "Of all genres, I like mystery novels the best.", [], "-중에서 (-jungeseo) = 'among': 장르 중에서 = among genres."],
["저는 주말에 서점에서 신간을 한참 구경했어요.", "On the weekend I browsed new releases at the bookstore for a while.", ["travel"], "신간 (singan) = a newly published book; 구경하다 = to browse."],
["저는 작가의 사인이 담긴 책을 한 권 샀어요.", "I bought a book with the author's autograph.", [], "-이 담기다 (-i damgida) = to be contained in: 사인이 담긴 책."],
["이 외국 소설은 번역이 아주 잘 됐어요.", "This foreign novel was translated very well.", [], "번역 (beonyeok) = translation; 잘 되다 = to turn out well."],
["저는 책을 읽으면서 중요한 곳에 밑줄을 그어요.", "I underline important parts while reading.", [], "밑줄을 긋다 (mitjureul geutda) = to underline; 긋다 → 그어요."],
["그 에세이는 짧지만 여운이 아주 길어요.", "That essay is short but its resonance is very long.", [], "-지만 (-jiman) = 'but': 짧지만 = (it's) short but."],
["저는 아이에게 매일 밤 동화책을 읽어 줘요.", "I read a fairy tale to my child every night.", ["family"], "동화책 (donghwachaek) = a storybook; -아/어 주다 = read for."],
["이 그림책의 삽화가 정말 예뻐요.", "The illustrations in this picture book are really pretty.", ["family"], "삽화 (saphwa) = an illustration; 그림책 = a picture book."],
["저는 다 읽은 책을 친구에게 자주 빌려줘요.", "I often lend books I've finished to friends.", [], "빌려주다 (billyeojuda) = to lend (vs 빌리다 = to borrow)."],
["저는 그 작가의 새 책을 손꼽아 기다려요.", "I'm eagerly awaiting that author's new book.", [], "손꼽아 기다리다 (sonkkoba gidarida) = to eagerly await."],
["좋은 책 한 권이 사람의 마음을 바꿔요.", "One good book changes a person's heart.", [], "바꾸다 (bakkuda) = to change (something): 바꿔요."],

# ── 전통 예술 판소리/사물놀이 (3026-3050) ──
["저는 어제 처음으로 판소리 공연을 봤어요.", "Yesterday I saw a pansori performance for the first time.", ["travel"], "판소리 (pansori) = traditional Korean sung storytelling."],
["판소리는 한 사람이 북장단에 맞춰 노래해요.", "In pansori, one person sings to a drum beat.", [], "-에 맞춰 (-e matchwo) = 'in time with': 북장단에 맞춰."],
["사물놀이는 네 가지 전통 악기로 연주해요.", "Samulnori is played with four traditional instruments.", [], "사물놀이 (samulnori) = a four-instrument percussion genre."],
["꽹과리 소리가 정말 우렁차고 힘찼어요.", "The kkwaenggwari sound was really loud and powerful.", [], "꽹과리 (kkwaenggwari) = a small handheld gong."],
["저는 전통 음악을 제대로 배워 보고 싶어요.", "I want to properly try learning traditional music.", [], "-아/어 보다 (-a/eo boda) = 'try doing': 배워 보고 싶어요."],
["공연장에서 관객들이 신나서 추임새를 넣었어요.", "The audience enthusiastically added chuimsae calls.", ["travel"], "추임새 (chuimsae) = the audience's shouted encouragement."],
["사물놀이 장단이 뒤로 갈수록 점점 빨라졌어요.", "The samulnori rhythm got faster and faster toward the end.", [], "-(으)ㄹ수록 (-lsurok) = 'the more': 갈수록 = the more it goes."],
["할머니께서 판소리를 아주 좋아하세요.", "My grandmother really loves pansori.", ["family"], "Elder subject → 좋아하세요 (joahaseyo), the honorific present."],
["그 소리꾼의 목소리가 정말 힘이 있었어요.", "That singer's voice was really powerful.", [], "소리꾼 (sorikkun) = a pansori singer; 힘이 있다 = to be powerful."],
["저는 장구를 조금 칠 줄 알아요.", "I can play the janggu a little.", [], "-(으)ㄹ 줄 알다 = 'know how to': 칠 줄 알아요 = can play."],
["전통 공연은 외국인 관광객들에게도 인기가 많아요.", "Traditional performances are popular with foreign tourists too.", ["travel"], "-에게도 (-egedo) = 'to ... too': 관광객들에게도."],
["저는 탈춤을 보면서 저도 모르게 크게 웃었어요.", "I laughed out loud without realizing while watching the mask dance.", [], "탈춤 (talchum) = a traditional masked dance."],
["부채춤은 동작 하나하나가 정말 우아해요.", "Every movement of the fan dance is really elegant.", [], "부채춤 (buchaechum) = fan dance; 우아하다 = to be elegant."],
["명절에는 마을에서 사물놀이 공연을 자주 해요.", "During the holidays the village often holds samulnori shows.", ["family"], "명절 (myeongjeol) = a traditional holiday."],
["저는 국악 공연을 미리 온라인으로 예매했어요.", "I booked the Korean-music performance online in advance.", ["travel"], "국악 (gugak) = traditional Korean music; 예매하다 = to book."],
["판소리 한 마당은 보통 몇 시간이나 걸려요.", "One full pansori piece usually takes several hours.", [], "마당 (madang) = one full act/piece of pansori."],
["판소리에서 북 치는 사람을 고수라고 불러요.", "In pansori, the drummer is called a gosu.", [], "-(이)라고 부르다 = 'call (it) X': 고수라고 불러요."],
["전통 악기 소리가 신기하게 마음을 편하게 해 줘요.", "The sound of traditional instruments strangely calms the heart.", [], "편하게 하다 (pyeonhage hada) = to make (one) at ease."],
["저는 어릴 때 몇 년 동안 가야금을 배웠어요.", "I learned gayageum for a few years as a child.", ["family"], "가야금 (gayageum) = a 12-string zither; 동안 = for (a duration)."],
["공연이 끝나자 관객들이 다 같이 박수를 쳤어요.", "When the performance ended, the whole audience clapped.", ["travel"], "-자 (-ja) = 'as soon as': 끝나자 = the moment it ended."],
["사물놀이는 원래 시골의 농악에서 시작됐어요.", "Samulnori originally started from rural farmers' music.", [], "원래 (wollae) = originally; 농악 = farmers' percussion music."],
["그 공연은 전통과 현대를 멋지게 함께 보여 줬어요.", "That show wonderfully brought together tradition and modernity.", [], "함께 (hamkke) = together; 보여 주다 = to show."],
["저는 판소리 사설을 이해하기가 조금 어려웠어요.", "I found the pansori narration a bit hard to understand.", [], "사설 (saseol) = the spoken narration parts of pansori."],
["요즘 젊은 예술가들이 국악을 새롭게 바꿔요.", "These days young artists are reinventing Korean music.", ["work"], "새롭게 (saeropge) = anew/freshly; 예술가 = an artist."],
["전통 예술을 지키는 일은 정말 소중해요.", "Preserving traditional art is truly precious.", [], "지키다 (jikida) = to protect/preserve; 소중하다 = precious."],
]

allrows = N25 + N26
assert len(N25) == 125, len(N25)
assert len(N26) == 125, len(N26)

# ── context-aware tagging (keyword-driven, appropriate to these topics) ──
FAMILY = ['부모님','어머니','아버지','형','동생','누나','언니','가족','할머니','할아버지','사촌',
          '남동생','결혼','청첩장','신랑','신부','하객','부케','약혼','신혼','아이','명절','자식']
TRAVEL = ['콘서트','극장','영화관','미술관','전시','공연','여행','서점','관광객','노래방','데이트',
          '이사','나들이','관광','공원','사인회']
WORK   = ['회사','동료','진로','직장','연기','배우','작품','신곡','차트','촬영','인터뷰','방송',
          '작가','문체','예술가','데뷔','상을','소리꾼','화가','주인공']

def tags_for(target, base):
    t = set(['general']) | set(base)
    if any(k in target for k in FAMILY): t.add('family')
    if any(k in target for k in TRAVEL): t.add('travel')
    if any(k in target for k in WORK):   t.add('work')
    # keep a stable order
    order = ['general','travel','work','family']
    return [x for x in order if x in t]

# ── tip selection: keep the hard-rule tips + a spread, target ~40% ──
P1_MARK = ['3rd-person','3rd person','-어하다','Elder','elder','honorif','honored','Honorif',
           '께서','-세요','-셨','-(으)ㄹ게요','promise','commit','것 같아요','seems','guess',
           'can only','must not']
def tip_score(tip):
    if not tip: return -1
    if any(m in tip for m in P1_MARK): return 2
    if '=' in tip: return 1   # vocab/idiom gloss
    return 0

# per-node selection so tips are spread across both nodes (~50 each = 40%)
KEEP = set()
for lo, hi, quota in [(0, 125, 50), (125, 250, 50)]:
    scored = [(tip_score(allrows[i][3]), i) for i in range(lo, hi)]
    p1 = [i for s, i in scored if s >= 2]
    for i in p1[:quota]:
        KEEP.add(i)
    if len(p1) < quota:
        rest = sorted([(s, i) for s, i in scored if 0 <= s <= 1], key=lambda x: (-x[0], x[1]))
        for s, i in rest:
            if sum(1 for k in KEEP if lo <= k < hi) >= quota:
                break
            KEEP.add(i)

cards = []
for i, (target, english, tags, tip) in enumerate(allrows):
    num = 2801 + i
    node = "node-25" if i < 125 else "node-26"
    card = {
        "id": f"ko-{num:04d}",
        "target": target,
        "english": english,
        "audio": f"ko-ko-{num:04d}.mp3",
        "tags": tags_for(target, tags),
        "grammarNode": node,
        "priority": num,
    }
    if tip and i in KEEP:
        card["grammar"] = tip
    cards.append(card)

out = "/Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones/scripts/tmp/wave4-ko-cards-C.json"
with open(out, "w", encoding="utf-8") as f:
    json.dump(cards, f, ensure_ascii=False, indent=1)

# quick stats
from collections import Counter
tagc = Counter()
for c in cards:
    for t in c["tags"]:
        tagc[t]+=1
tips = sum(1 for c in cards if "grammar" in c)
# tip length check
toolong = [(c["id"], len(c["grammar"])) for c in cards if "grammar" in c and len(c["grammar"])>120]
print("cards", len(cards))
print("tags", dict(tagc), "-> travel%%=%.0f work%%=%.0f family%%=%.0f" % (100*tagc['travel']/250,100*tagc['work']/250,100*tagc['family']/250))
print("tips", tips, "(%.0f%%)" % (100*tips/250))
print("tips >120 chars:", toolong)
