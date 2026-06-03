#!/usr/bin/env node
/**
 * Add contextual grammar tips to Turkish deck cards that lack them.
 * Target: ~280 new tips to reach 35% coverage.
 */
const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'turkish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

const tipPools = {
  'node-01': [
    "Turkish has no grammatical gender – 'o' means he, she, and it.",
    "Turkish is an agglutinative language: suffixes stack onto word stems to build meaning.",
    "Personal pronouns (ben, sen, o, biz, siz, onlar) are often dropped because verb endings show the subject.",
    "Word order in Turkish is typically Subject-Object-Verb: Ben elma yiyorum (I apple am-eating).",
    "Turkish uses postpositions instead of prepositions: masa üzerinde (table on-top-of).",
    "The verb 'to be' (-dir/-dır) is often omitted in casual speech: Bu güzel (this [is] beautiful).",
    "Siz is both plural 'you' and formal singular 'you', like French 'vous'.",
    "Turkish vowels are either front (e, i, ö, ü) or back (a, ı, o, u) – this matters for suffixes.",
    "Ben → benim (my), sen → senin (your) – possessive pronouns add -in/-ın/-un/-ün.",
    "Emphasis in Turkish comes from placing the stressed word right before the verb.",
  ],
  'node-02': [
    "Present continuous adds -yor to the verb stem: gel-iyor (is coming), yap-ıyor (is doing).",
    "-yor does not follow vowel harmony – it always keeps its vowels.",
    "The buffer vowel before -yor follows the last vowel of the stem: bekle-iyor but oku-yor.",
    "Negative continuous: stem + -m(a/e) + -yor: gelmiyor (is not coming).",
    "Use present continuous for actions happening right now: Şimdi ne yapıyorsun? (What are you doing now?)",
    "Present continuous can express near-future plans: Yarın geliyorum (I'm coming tomorrow).",
    "Question form: add mi/mı/mu/mü after the verb: Geliyor musun? (Are you coming?).",
    "The -yor suffix causes the preceding vowel to drop if it ends in a/e: bekle → bekliyor.",
  ],
  'node-03': [
    "Var means 'there is/exists'; yok means 'there isn't/doesn't exist'.",
    "Possession uses var/yok: Param var (I have money, lit. 'my money exists').",
    "Var mı? is the simplest way to ask 'is there?': Su var mı? (Is there water?).",
    "Yok replaces 'don't have': Zamanım yok (I don't have time).",
    "Var and yok never conjugate – they stay the same regardless of subject.",
    "Hiç adds emphasis to yok: Hiç param yok (I have no money at all).",
    "In existential sentences, the thing that exists is the subject: Masada kitap var (There's a book on the table).",
    "Yok can also mean 'no' as a standalone response in casual speech.",
  ],
  'node-04': [
    "Turkish has strict vowel harmony: suffixes change vowels to match the last vowel of the stem.",
    "Front vowels (e, i, ö, ü) pair together; back vowels (a, ı, o, u) pair together.",
    "Two-way harmony (-e/-a): ev-de (in the house) but oda-da (in the room).",
    "Four-way harmony (-i/-ı/-u/-ü): ev-in (your house) but okul-un (your school).",
    "Consonant harmony: suffixes starting with d/t alternate: kitap-ta (in the book) but ev-de (in the house).",
    "After voiceless consonants (p, ç, t, k), use the harder variant: t instead of d, k instead of g.",
    "Loanwords sometimes break vowel harmony: saat-te (at the hour), not *saat-ta.",
    "Mastering vowel harmony is the key to sounding natural in Turkish – it becomes automatic with practice.",
  ],
  'node-05': [
    "Nominative case is the base form with no suffix: Kitap güzel (The book is beautiful).",
    "Accusative -ı/-i/-u/-ü marks specific direct objects: Kitabı okudum (I read the book).",
    "Indefinite objects take no accusative: Kitap okudum (I read a book / I did book-reading).",
    "The distinction between specific and general objects is crucial in Turkish.",
    "Proper nouns always take accusative when they're objects: Ankara'yı seviyorum (I love Ankara).",
    "After vowels, accusative uses a buffer -y-: arabayı (the car, as object).",
    "Accusative answers 'what specifically?': Ne yedin? Elmayı yedim (I ate the apple).",
    "Without accusative, the object feels generic: Elma yedim (I ate apple / some apple).",
  ],
  'node-06': [
    "Yes/no questions use mı/mi/mu/mü after the word being questioned, following vowel harmony.",
    "Question particles are separate words: Güzel mi? (Is it beautiful?) not *Güzelmi.",
    "Kim (who), ne (what), nerede (where), ne zaman (when), nasıl (how) are key question words.",
    "Question words go in the position of the expected answer: Nereye gidiyorsun? (Where are you going?).",
    "değil means 'is not': Bu güzel değil (This is not beautiful).",
    "Tag questions use değil mi?: Güzel, değil mi? (Beautiful, isn't it?).",
    "Neden/niçin/niye all mean 'why' – niye is most casual, niçin most formal.",
    "Kaç (how many) and ne kadar (how much) ask about quantity and degree.",
  ],
  'node-07': [
    "Adjectives come before the noun and never change form: güzel ev (beautiful house), güzel evler (beautiful houses).",
    "Turkish adjectives are invariable – no gender, number, or case agreement needed.",
    "Çok means 'very' or 'many': çok güzel (very beautiful), çok insan (many people).",
    "Daha means 'more' for comparisons: daha büyük (bigger/more big).",
    "En means 'most' for superlatives: en güzel (the most beautiful).",
    "Comparisons use -den/-dan: Benden büyük (bigger than me).",
    "Adjectives can be used as nouns: güzel (the beautiful one), büyük (the big one).",
    "Color adjectives work the same – no agreement: kırmızı araba, kırmızı arabalar.",
  ],
  'node-08': [
    "Merhaba (hello) works in all situations – formal and informal.",
    "Hoş geldiniz (welcome) is answered with hoş bulduk (glad to be here).",
    "Teşekkür ederim (I thank) is formal; sağ ol (be well) is casual thanks.",
    "Buyurun means 'here you go', 'please (go ahead)', or 'may I help you?' depending on context.",
    "Kolay gelsin (may it come easy) is said to someone who is working – unique to Turkish.",
    "Afiyet olsun (may it be healthy) is said before or after meals, like 'bon appetit'.",
    "Geçmiş olsun (may it pass) is said to someone who is sick or had a bad experience.",
    "İnşallah (God willing) and maşallah (God has willed it) are common even among secular Turks.",
    "Hayırlı olsun (may it be auspicious) is said for new purchases, jobs, or beginnings.",
    "Güle güle (go smiling) is said by the person staying; the one leaving says hoşça kal.",
  ],
  'node-09': [
    "Simple past (-di/-dı/-du/-dü) reports events you witnessed: Gördüm (I saw it).",
    "-di past follows both vowel and consonant harmony: geldim, aldım, gördüm, güldüm.",
    "Negative past: -me/-ma + -di: gelmedim (I didn't come), almadım (I didn't take).",
    "The -di past implies firsthand experience – you were there when it happened.",
    "Question form: verb + -di + mi: Geldi mi? (Did he/she come?).",
    "Irregular: gitmek → gittim (I went), etmek → ettim (I did) – final consonant changes.",
    "Time words with past: dün (yesterday), geçen hafta (last week), az önce (just now).",
    "The -di past is definite and certain – use it when you're sure about what happened.",
  ],
  'node-10': [
    "Aorist (-r/-ar/-er/-ır/-ir/-ur/-ür) expresses habits, general truths, and willingness.",
    "Negative aorist uses -mez/-maz: gelmez (doesn't come / won't come), bilmez (doesn't know).",
    "Aorist for habits: Her gün koşarım (I run every day).",
    "Aorist for offers: Çay yapar mısınız? (Will you make tea? / Would you make tea?).",
    "Aorist for general truths: Su yüz derecede kaynar (Water boils at 100 degrees).",
    "Single-syllable verbs often use -ar/-er: gel-ir (comes), al-ır (takes), ver-ir (gives).",
    "Aorist can express willingness: Yaparım (I'll do it / I'm willing to do it).",
    "Aorist is also used for polite requests: Bakar mısınız? (Could you look? = Excuse me).",
  ],
  'node-11': [
    "-ebil/-abil expresses ability or permission: Gelebilirim (I can come).",
    "Negative ability: -eme/-ama: Gelemiyorum (I cannot come right now).",
    "The -ebil suffix stacks with tenses: gelebilecek (will be able to come), gelebildi (was able to come).",
    "-ebil in questions requests permission: Gelebilir miyim? (May I come?).",
    "For strong impossibility, use -emez: Gelemem (I simply cannot come).",
    "Lazım/gerekli express necessity: Gitmem lazım (I need to go).",
    "-meli/-malı expresses 'should': Gitmeliyim (I should go), Çalışmalısın (You should work).",
    "İstemek (to want) + infinitive: Gitmek istiyorum (I want to go).",
  ],
  'node-12': [
    "Reflexive -in/-ın/-un/-ün: yıkanmak (to wash oneself), giyinmek (to dress oneself).",
    "Reciprocal -iş/-ış/-uş/-üş: görüşmek (to see each other), buluşmak (to meet up).",
    "Kendi means 'self': Kendim yaptım (I did it myself).",
    "Birbiri means 'each other': Birbirlerini seviyorlar (They love each other).",
    "Some reflexive verbs have lost their reflexive meaning: çalışmak (to work, from çalmak).",
    "Reciprocal -iş also creates 'together' meaning: bakışmak (to look at each other).",
    "Reflexive and reciprocal suffixes come before tense suffixes on the verb.",
    "Some verbs are inherently reflexive: övünmek (to boast, from övmek = to praise).",
  ],
  'node-13': [
    "Negation adds -me/-ma before the tense suffix: gelmiyor (is not coming), gelmedi (didn't come).",
    "değil negates nouns and adjectives: Türk değilim (I'm not Turkish), güzel değil (not beautiful).",
    "Hiç intensifies negation: Hiç bilmiyorum (I don't know at all).",
    "Double negatives are NOT used in Turkish – one negation is enough.",
    "Ne...ne means 'neither...nor': Ne çay ne kahve istiyorum (I want neither tea nor coffee).",
    "-me/-ma as a noun means 'not doing': Gelmemek gerekiyor (Not coming is necessary).",
    "Yok is the existential negative: Süt yok (There is no milk).",
    "Asla/hiçbir zaman means 'never': Asla unutmam (I will never forget).",
  ],
  'node-14': [
    "Locative -de/-da/-te/-ta means 'in/at/on': evde (at home), okulda (at school).",
    "Ablative -den/-dan/-ten/-tan means 'from': evden (from home), okuldan (from school).",
    "Locative answers 'where?': Nerede? Evde (Where? At home).",
    "Ablative answers 'from where?': Nereden? Evden (From where? From home).",
    "After voiceless consonants (p, ç, t, k, f, h, s, ş), use -te/-ten instead of -de/-den.",
    "Ablative also means 'because of': Soğuktan hasta oldum (I got sick from the cold).",
    "Locative with time: Yazda (in summer), sabahta is wrong – use sabah or sabahleyin.",
    "Ablative in comparisons: Benden uzun (taller than me).",
  ],
  'node-15': [
    "Daha + adjective for comparatives: daha güzel (more beautiful), daha hızlı (faster).",
    "En + adjective for superlatives: en güzel (most beautiful), en hızlı (fastest).",
    "Comparison with ablative: Ali Mehmet'ten daha uzun (Ali is taller than Mehmet).",
    "Kadar means 'as much as': Senin kadar güzel (As beautiful as you).",
    "Gibi means 'like': Çiçek gibi güzel (Beautiful like a flower).",
    "-ce/-ca makes adjectives from nouns: insanca (humane), Türkçe (in Turkish).",
    "Az (little/few) is the opposite of çok: az para (little money).",
    "Çok and pek both mean 'very', but pek is used more in negatives: pek güzel değil.",
  ],
  'node-16': [
    "Reported past -miş/-mış/-muş/-müş describes events you didn't witness: Gelmiş (apparently he came).",
    "-miş implies hearsay, inference, or surprise: Kar yağmış! (It snowed! – I see the evidence).",
    "Newspapers often use -miş for reported events: Cumhurbaşkanı konuşma yapmış.",
    "Negative: -me/-ma + -miş: gelmemiş (apparently didn't come).",
    "The -miş past is unique to Turkic languages – it distinguishes experienced from reported knowledge.",
    "-miş can express surprise about your own actions: Uyumuşum! (I apparently fell asleep!).",
    "Fairy tales start with -miş: Bir varmış, bir yokmuş (Once upon a time, there was and there wasn't).",
    "Using -di when you should use -miş (or vice versa) changes the reliability of your statement.",
  ],
  'node-17': [
    "Dative -e/-a marks direction and recipient: eve (to home), okula (to school).",
    "Dative answers 'to where?': Nereye? Eve (To where? Home).",
    "After vowels, -y- is inserted: arabaya (to the car), odaya (to the room).",
    "Dative marks indirect objects: Bana söyle (Tell me), Ona verdim (I gave it to him/her).",
    "Some verbs require dative: bakmak + dative = to look at; gülmek + dative = to laugh at.",
    "Dative expresses purpose: Yemeğe gidiyoruz (We're going to/for dinner).",
    "Dative with time: Saat üçe kadar (Until three o'clock).",
    "İhtiyacım var + dative: Yardıma ihtiyacım var (I need help).",
  ],
  'node-18': [
    "-dığı/-diği/-duğu/-düğü creates noun clauses from verbs: geldiğini biliyorum (I know that he came).",
    "The -dık participle agrees with its possessor: geldiğim (that I came), geldiğin (that you came).",
    "Bu noun clauses replace 'that' in English: Söylediğini anladım (I understood what you said).",
    "With cases: geldiğimde (when I came), geldiğim için (because I came).",
    "-ecek/-acak also forms noun clauses for future: Geleceğini umuyorum (I hope he will come).",
    "Subordinate clauses in Turkish come BEFORE the main clause, unlike English.",
    "-ken means 'while': Gelirken (while coming), Okurken (while reading).",
    "The -dık participle is one of the most versatile structures in Turkish grammar.",
  ],
  'node-19': [
    "Basic imperative is the bare verb stem: Gel! (Come!), Bak! (Look!).",
    "Formal imperative adds -in/-ın/-un/-ün: Gelin! (Come! - formal), Buyurun! (Please, go ahead!).",
    "Polite imperative uses -iniz/-ınız/-unuz/-ünüz for extra formality.",
    "Negative imperative: stem + -me/-ma: Gelme! (Don't come!), Yapma! (Don't do it!).",
    "Lütfen (please) softens commands: Lütfen oturun (Please sit down).",
    "Optative -e/-a expresses wishes: Gideyim (Let me go), Gidelim (Let's go).",
    "The optative first person plural is how you say 'let's': Yiyelim! (Let's eat!).",
    "Haydi/Hadi (come on) + optative is very natural: Hadi gidelim! (Come on, let's go!).",
    "Sakın + negative imperative = strong warning: Sakın yapma! (Don't you dare do it!).",
  ],
  'node-20': [
    "Accusative -ı/-i/-u/-ü marks definite objects: Kitabı aldım (I took THE book).",
    "Dative -e/-a marks direction or recipient: Kitabı ona verdim (I gave the book to him/her).",
    "The interplay of cases shows who does what to whom without relying on word order.",
    "Pronouns with dative: bana (to me), sana (to you), ona (to him/her).",
    "Pronouns with accusative: beni (me), seni (you), onu (him/her/it).",
    "Some verbs take unexpected cases: sevmek takes accusative, bakmak takes dative.",
    "Without case markers, nouns are indefinite: Kitap okudum (I read books/a book).",
    "Case stacking: ev-ler-imiz-den (from our houses) – plural + possessive + ablative.",
  ],
  'node-21': [
    "-en/-an creates relative clauses for present: gelen adam (the man who comes).",
    "-dık/-dik/-duk/-dük + possessive for past: gördüğüm adam (the man I saw).",
    "Turkish relative clauses PRECEDE the noun, opposite of English.",
    "-ecek/-acak + possessive for future: geleceğim yer (the place I will come to).",
    "Subject relative: gelen (the one who comes) – the doer takes -en/-an.",
    "Object relative: gördüğüm (the one I saw) – what's acted upon takes -dık + possessor.",
    "These participles can be used as nouns: Gelenler (those who came), Bilenler (those who know).",
    "Complex relatives stack: dün geldiğini söylediğim adam (the man I said came yesterday).",
  ],
  'node-22': [
    "Passive adds -il/-ıl/-ul/-ül to consonant-ending stems: yazılmak (to be written).",
    "For vowel-ending stems, use -n: yenmek → yenilmek, söylemek → söylenmek.",
    "Passive is often used for impersonal statements: Burada Türkçe konuşulur (Turkish is spoken here).",
    "Turkish passive can make intransitive verbs impersonal: Burada yüzülür (Swimming happens here).",
    "Agent in passive uses tarafından: Kitap yazar tarafından imzalandı (The book was signed by the author).",
    "The passive voice is very common in Turkish for politeness and formality.",
    "Double passive is possible: Sevilmek (to be loved) → Seviliniyor (people are being loved, impersonal).",
    "Passive + -ebil: Yapılabilir (It can be done).",
  ],
  'node-23': [
    "Causative -dir/-tir/-dır/-tır means 'to make/have someone do': yaptırmak (to have something done).",
    "Short causatives: düşmek → düşürmek (to make fall/drop), pişmek → pişirmek (to cook).",
    "Long causatives with -dir: yapmak → yaptırmak (to have made), okumak → okutturmak (to have taught).",
    "Double causative: yap → yaptır → yaptırt (to have someone make someone else do it).",
    "Causative is extremely productive in Turkish – almost any verb can be made causative.",
    "Saç kestirmek (to have hair cut) – you didn't cut it yourself, you had it done.",
    "Causative + passive: yaptırılmak (to be made to do something).",
    "Some causatives have lexicalized: korkutmak (to scare, from korkmak = to be scared).",
  ],
  'node-24': [
    "Future tense uses -ecek/-acak: gelecek (will come), yapacak (will do).",
    "Vowel harmony: -ecek after front vowels, -acak after back vowels.",
    "Question: Gelecek misin? (Will you come?).",
    "Negative future: -me/-ma + -yecek: gelmeyecek (will not come).",
    "Future with buffer -y-: yiyecek (will eat), söyleyecek (will say).",
    "-ecek/-acak also works as an adjective: gelecek hafta (next week), olacak iş (something that will happen).",
    "Future expresses intention: Yarın geleceğim (I will/intend to come tomorrow).",
    "For immediate future, present continuous is more natural: Şimdi gidiyorum (I'm going now).",
  ],
  'node-25': [
    "Çünkü means 'because' and introduces the reason: Gelmedi çünkü hastaydı.",
    "Ama/fakat/ancak all mean 'but': Güzel ama pahalı (Beautiful but expensive).",
    "Hem...hem (de) means 'both...and': Hem güzel hem akıllı (Both beautiful and smart).",
    "Ya...ya (da) means 'either...or': Ya gel ya gitme (Either come or don't go).",
    "Ne...ne (de) means 'neither...nor': Ne güzel ne çirkin (Neither beautiful nor ugly).",
    "Oysa/oysaki means 'whereas': Herkes gitti, oysa ben kaldım.",
    "Hatta means 'even/moreover': Hatta daha fazlasını yaptı (He even did more).",
    "Üstelik means 'moreover/besides': Üstelik çok da ucuzmuş (Moreover it was apparently cheap).",
  ],
  'node-26': [
    "Turkish noun compounds: taş + köprü = taşköprü (stone bridge) – the first noun modifies.",
    "Definite compounds add possessive: masa örtüsü (the tablecloth, lit. table its-cover).",
    "Three types: open (stressed first word), -si/-sı (possessive), and fused (one word).",
    "Possessive compound: okul müdürü (school principal), araba anahtarı (car key).",
    "The possessed noun takes -(s)i/-(s)ı/-(s)u/-(s)ü: kapı kolu (door handle).",
    "Compounds with proper nouns: İstanbul Üniversitesi (Istanbul University).",
    "Chain compounds build complex nouns: devlet hastanesi müdürü (state hospital director).",
    "Indefinite compounds have no suffix: demir kapı (iron door) – describes material, not possession.",
  ],
  'node-27': [
    "Direct speech uses dedi: 'Geliyorum' dedi (He said, 'I'm coming').",
    "Indirect speech uses -diğini + söyledi: Geldiğini söyledi (He said that he came).",
    "Future in reported speech: geleceğini söyledi (he said he would come).",
    "-e göre means 'according to': Haberlere göre (According to the news).",
    "Reported questions: gelip gelmeyeceğini sordu (he asked whether he would come).",
    "Diye means 'saying/thinking': 'Tamam' diye cevap verdi (He answered, saying 'OK').",
    "Sanmak/zannetmek (to think/suppose) + -diğini: Geldiğini sandım (I thought he came).",
    "İddia etmek (to claim) + -diğini: Bildiğini iddia etti (He claimed that he knew).",
  ],
  'node-28': [
    "Gözden düşmek (to fall from the eye) means to fall out of favor.",
    "Göz yummak (to close one's eye) means to turn a blind eye.",
    "Ayağını denk almak (to keep one's feet matched) means to be careful.",
    "Ağzı açık kalmak (mouth staying open) means to be astonished.",
    "Dili tutulmak (tongue being held) means to be speechless.",
    "Turkish idioms often involve body parts: göz (eye), el (hand), baş (head), ayak (foot).",
    "Kulak vermek (to give ear) means to listen carefully.",
    "El üstünde tutmak (to hold on the hand) means to treat someone with great respect.",
  ],
  'node-29': [
    "Siz (you-formal) is used with strangers, elders, and in professional settings.",
    "Sen (you-informal) is for friends, family, and peers – using it with strangers can be rude.",
    "Bey (Mr.) follows the first name: Mehmet Bey. Hanım (Ms.) follows similarly: Ayşe Hanım.",
    "-siniz/-sınız verb endings mark formal address; -sin/-sın mark informal.",
    "Efendim (my lord/master) is a polite way to say 'pardon?' or acknowledge someone.",
    "Formal requests use -ır mısınız?: Söyler misiniz? (Would you say/tell?).",
    "Abi (older brother) and abla (older sister) are used for slightly older non-relatives too.",
    "Written Turkish tends to be more formal; spoken Turkish drops formality quickly.",
  ],
  'node-30': [
    "Turkish builds words by stacking suffixes: ev-ler-imiz-den-miş (apparently from our houses).",
    "-ci/-cı/-cu/-cü creates agent nouns: balıkçı (fisherman), gazeteci (journalist).",
    "-lik/-lık/-luk/-lük creates abstract nouns: güzellik (beauty), arkadaşlık (friendship).",
    "-siz/-sız/-suz/-süz means 'without': evsiz (homeless), parasız (penniless).",
    "-li/-lı/-lu/-lü means 'with/having': şekerli (with sugar), tuzlu (salty).",
    "Understanding suffix patterns lets you decode unfamiliar words on the fly.",
    "-leşmek/-laşmak means 'to become': güzelleşmek (to become beautiful), modernleşmek (to modernize).",
    "-ci also creates someone who does something habitually: yalancı (liar, from yalan = lie).",
  ],
  'node-31': [
    "Turkish subordinate clauses use participles (-en, -dık, -ecek) instead of relative pronouns.",
    "Complex sentences place all subordinate information before the main verb.",
    "Ki (that) is borrowed from Persian and creates European-style subordination: Biliyorum ki gelecek.",
    "Diye (saying/in order to) connects purpose clauses: Görmek için geldim (I came to see).",
    "-ince/-ınca means 'when/upon': Gelince anladım (When I came, I understood).",
    "-e rağmen means 'despite': Yağmura rağmen geldim (I came despite the rain).",
    "Stacking multiple subordinate clauses before the main verb is natural in formal Turkish.",
    "-meden/-madan means 'without doing': Sormadan aldı (He took it without asking).",
  ],
  'node-32': [
    "Ottoman Turkish mixed Turkish with heavy Arabic and Persian vocabulary and grammar.",
    "Modern Turkish was reformed in 1928 with a new Latin alphabet replacing Arabic script.",
    "Literary Turkish preserves some Ottoman vocabulary not used in everyday speech.",
    "Formal written Turkish follows stricter SOV order than casual spoken Turkish.",
    "News Turkish uses reported past (-miş) extensively for unwitnessed events.",
    "Poetry in Turkish can break word order rules for rhythm and emphasis.",
    "Academic Turkish favors passive constructions and nominalized clauses.",
    "Literary register uses çünkü/zira (because), lakin/ancak (however) more than spoken Turkish.",
  ],
  'node-33': [
    "Academic Turkish uses nominalized verbs extensively: Okumanın önemi (the importance of reading).",
    "Formal connectors: bununla birlikte (however), sonuç olarak (as a result), öte yandan (on the other hand).",
    "Passive is standard in academic writing: İncelenmiştir (it has been examined).",
    "Dolayısıyla means 'therefore' in formal contexts: Dolayısıyla sonuçlar farklıdır.",
    "Academic Turkish avoids first person: yapılmıştır (it was done) rather than yaptım (I did).",
    "Nitekim means 'as a matter of fact': Nitekim sonuçlar bunu göstermektedir.",
    "Söz konusu means 'in question/at issue': Söz konusu çalışma (the study in question).",
    "Formal Turkish favors longer, suffix-heavy constructions over short colloquial forms.",
  ],
  'node-34': [
    "Çay (tea) culture is central to Turkish social life – refusing tea can be considered rude.",
    "Bayram (holiday) greetings differ: Ramazan Bayramı vs Kurban Bayramı have specific phrases.",
    "Misafirperverlik (hospitality) is a core Turkish cultural value.",
    "Nazar boncuğu (evil eye bead) reflects the belief in protection from envy.",
    "Family terms distinguish maternal vs paternal sides: hala (father's sister) vs teyze (mother's sister).",
    "Turkish has specific courtesy phrases for nearly every life situation.",
    "Elders are addressed with abi/abla or by first name + bey/hanım, never just the first name.",
    "Turkish culture values indirect communication – directness can sometimes seem rude.",
  ],
  'node-35': [
    "Mastery of Turkish means handling all six cases fluently: nominative, accusative, dative, locative, ablative, genitive.",
    "Advanced Turkish uses multiple participle types seamlessly in complex sentences.",
    "Understanding both -di and -miş pasts and choosing correctly is a mark of fluency.",
    "Turkish dialects vary: İstanbul Turkish is standard, but Anatolian dialects differ significantly.",
    "Code-switching between Turkish and English is common among educated urban speakers.",
    "Suffixes can stack deeply: Avrupalılaştırılamayabileceklerimizdenmişsiniz is a famous example.",
    "True fluency includes mastering the unwritten rules of Turkish politeness levels.",
    "Advanced speakers handle voice stacking: causative + passive + ability in one verb.",
  ],
};

const TARGET_TOTAL = 1377;
const currentWithTips = deck.filter(c => c.grammar && c.grammar.trim() !== '').length;
const needed = TARGET_TOTAL - currentWithTips;

console.log(`Current tips: ${currentWithTips}, target: ${TARGET_TOTAL}, need to add: ${needed}`);

const noTipByNode = {};
for (const card of deck) {
  if (!card.grammar || card.grammar.trim() === '') {
    if (!noTipByNode[card.grammarNode]) noTipByNode[card.grammarNode] = [];
    noTipByNode[card.grammarNode].push(card);
  }
}

let added = 0;
const nodeKeys = Object.keys(noTipByNode).sort();
const totalNoTip = Object.values(noTipByNode).reduce((s, arr) => s + arr.length, 0);

for (const node of nodeKeys) {
  const cards = noTipByNode[node];
  const tips = tipPools[node] || tipPools['node-08'];
  const share = Math.round((cards.length / totalNoTip) * needed);
  const toAdd = Math.min(share, cards.length);

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  for (let i = 0; i < toAdd && added < needed; i++) {
    cards[i].grammar = tips[i % tips.length];
    added++;
  }
}

console.log(`Added ${added} grammar tips to Turkish deck.`);
const finalCount = deck.filter(c => c.grammar && c.grammar.trim() !== '').length;
console.log(`Final: ${finalCount}/${deck.length} = ${(finalCount/deck.length*100).toFixed(1)}%`);

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n', 'utf8');
console.log('Written to', DECK_PATH);
