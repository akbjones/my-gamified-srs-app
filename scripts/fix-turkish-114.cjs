#!/usr/bin/env node
/**
 * Fix 114 broken Turkish deck cards — replace target & english fields
 * with natural, grammatically correct Turkish sentences.
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'turkish', 'deck.json');

const replacements = {
  // ── node-01: Greetings & introductions (A1, present tense -yor) ──
  'tr-0050': {
    target: 'Merhaba, ben mühendisim, İzmir\'de çalışıyorum.',
    english: 'Hello, I am an engineer, I work in Izmir.'
  },
  'tr-0058': {
    target: 'İyi akşamlar, sizi tanıdığıma çok sevindim.',
    english: 'Good evening, I am very glad to have met you.'
  },
  'tr-0168': {
    target: 'Hoş geldiniz, buyurun içeri geçin lütfen.',
    english: 'Welcome, please come inside.'
  },

  // ── node-02: Present continuous -yor (A1) ──
  'tr-0269': {
    target: 'Biz her gün yeni kelimeler öğreniyoruz.',
    english: 'We learn new words every day.'
  },
  'tr-0301': {
    target: 'O dikkatle bir mektup yazıyor.',
    english: 'He/She is carefully writing a letter.'
  },

  // ── node-05: Numbers, time & dates (A1) ──
  'tr-0686': {
    target: 'Eczane saat dokuzda açılıyor, öğleden sonra üçte kapanıyor.',
    english: 'The pharmacy opens at nine o\'clock and closes at three in the afternoon.'
  },

  // ── node-06: Food, drink & ordering / dative-locative (A1) ──
  'tr-0719': {
    target: 'Bazen akşam yemeğinde çorba içmek ister misin?',
    english: 'Do you sometimes want to have soup for dinner?'
  },
  'tr-0720': {
    target: 'Boş zamanlarımda satranç oynamaktan hoşlanırım.',
    english: 'I enjoy playing chess in my free time.'
  },
  'tr-0727': {
    target: 'Her gün gazete okur musun yoksa internetten mi takip edersin?',
    english: 'Do you read the newspaper every day or follow news online?'
  },
  'tr-0739': {
    target: 'Bu restoranda ne sıklıkla yemek yersiniz?',
    english: 'How often do you eat at this restaurant?'
  },
  'tr-0742': {
    target: 'Çocuklar derste öğretmeni dikkatle dinliyor mu?',
    english: 'Are the children listening to the teacher carefully in class?'
  },
  'tr-0745': {
    target: 'Şu anda markete gidiyor musun, ekmek alır mısın?',
    english: 'Are you going to the store right now, can you get bread?'
  },
  'tr-0747': {
    target: 'Bu konuyu şimdi daha iyi anlıyor musunuz?',
    english: 'Do you understand this topic better now?'
  },
  'tr-0756': {
    target: 'Şu anda ofiste mi çalışıyorsunuz yoksa evden mi?',
    english: 'Are you working at the office right now or from home?'
  },
  'tr-0759': {
    target: 'Bu yoldan her zaman eve gider misin?',
    english: 'Do you always go home by this road?'
  },
  'tr-0761': {
    target: 'Kütüphanede hangi kitapları okumayı seviyorsun?',
    english: 'Which books do you like reading at the library?'
  },

  // ── node-07: Family & relationships / adjectives (A1) ──
  'tr-0771': {
    target: 'Gün batımında büyükannem bahçede çiçek suluyor.',
    english: 'At sunset my grandmother is watering flowers in the garden.'
  },
  'tr-0773': {
    target: 'Başkan yüzme havuzunda basın toplantısı yapıyor.',
    english: 'The president is holding a press conference at the swimming pool.'
  },
  'tr-0774': {
    target: 'Sabahleyin eczacı bankada sıra bekliyor.',
    english: 'In the morning the pharmacist is waiting in line at the bank.'
  },
  'tr-0775': {
    target: 'Turistler stadyumda hediyelik eşya satın alıyor.',
    english: 'The tourists are buying souvenirs at the stadium.'
  },
  'tr-0779': {
    target: 'Fotoğrafçı koyda sessizce manzara fotoğrafı çekiyor.',
    english: 'The photographer is quietly taking landscape photos at the bay.'
  },
  'tr-0791': {
    target: 'Kışın fırıncı taze ekmekleri sabah erken satıyor.',
    english: 'In winter the baker sells fresh bread early in the morning.'
  },
  'tr-0806': {
    target: 'Gece annem sinemada komedi filmi izliyor.',
    english: 'At night my mother is watching a comedy film at the cinema.'
  },
  'tr-0809': {
    target: 'Arkadaşlar sokakta neşeyle gülüyorlar.',
    english: 'The friends are laughing cheerfully on the street.'
  },
  'tr-0811': {
    target: 'Balıkçı her sabah göl kenarında sabırla balık tutuyor.',
    english: 'The fisherman patiently catches fish by the lake every morning.'
  },
  'tr-0829': {
    target: 'Her sabah pilot kahvaltıda ailesiyle konuşuyor.',
    english: 'Every morning the pilot talks with his family at breakfast.'
  },
  'tr-0848': {
    target: 'Müdür hastanede rapor imzalıyor.',
    english: 'The director is signing a report at the hospital.'
  },
  'tr-0849': {
    target: 'Bu akşam kardeşim havaalanında beni bekliyor.',
    english: 'This evening my sibling is waiting for me at the airport.'
  },
  'tr-0850': {
    target: 'Başkan kilisede tarihi bir konuşma yapıyor.',
    english: 'The president is giving a historic speech at the church.'
  },
  'tr-0852': {
    target: 'Kaptan stadyumda takımını coşkuyla destekliyor.',
    english: 'The captain is enthusiastically supporting his team at the stadium.'
  },
  'tr-0855': {
    target: 'Babaannem ormanda aceleyle mantar topluyor.',
    english: 'My grandmother is hurriedly picking mushrooms in the forest.'
  },
  'tr-0859': {
    target: 'Bu sabah şoför manavdan taze meyve alıyor.',
    english: 'This morning the driver is buying fresh fruit from the greengrocer.'
  },

  // ── node-08: Common expressions (A1) ──
  'tr-0874': {
    target: 'Çiftçi taze sebzeleri pazarda sattı.',
    english: 'The farmer sold fresh vegetables at the market.'
  },
  'tr-0880': {
    target: 'Nane ile limon bir arada güzel olur.',
    english: 'Mint and lemon go well together.'
  },
  'tr-0908': {
    target: 'Yoğurt ile salatalık bir arada güzel olur.',
    english: 'Yogurt and cucumber go well together.'
  },
  'tr-0931': {
    target: 'Arkadaşlar romanı plajda bitirdi.',
    english: 'The friends finished the novel at the beach.'
  },
  'tr-0966': {
    target: 'Kaptan hikâyeyi çarşıda oturarak anlattı.',
    english: 'The captain told the story while sitting at the bazaar.'
  },
  'tr-0971': {
    target: 'Kavun ile beyaz peynir bir arada güzel olur.',
    english: 'Melon and white cheese go well together.'
  },
  'tr-1013': {
    target: 'Başkan konuşmasını tiyatroda bitirdi.',
    english: 'The president finished his speech at the theater.'
  },

  // ── node-09: Simple past -di/-dı (A2) ──
  'tr-1015': {
    target: 'Komşular gün batımında bahçede oturdu.',
    english: 'The neighbors sat in the garden at sunset.'
  },
  'tr-1017': {
    target: 'Pilot sık sık bankaya uğradı.',
    english: 'The pilot often stopped by the bank.'
  },
  'tr-1030': {
    target: 'Tamirci öğleden sonra arabanın motorunu onardı.',
    english: 'The mechanic repaired the car\'s engine in the afternoon.'
  },
  'tr-1041': {
    target: 'Psikolog gün batımında bankaya para yatırdı.',
    english: 'The psychologist deposited money at the bank at sunset.'
  },
  'tr-1051': {
    target: 'Şoför yakında arabayı tamir etti.',
    english: 'The driver repaired the car recently.'
  },
  'tr-1068': {
    target: 'Pilot her sabah hastaneye gitti.',
    english: 'The pilot went to the hospital every morning.'
  },
  'tr-1125': {
    target: 'Fatma hafta içi bankaya para gönderdi.',
    english: 'Fatma sent money to the bank on weekdays.'
  },
  'tr-1146': {
    target: 'Ressam geçen ay hastaneye büyük bir tablo bağışladı.',
    english: 'The painter donated a large painting to the hospital last month.'
  },
  'tr-1158': {
    target: 'Diş hekimi sabahleyin bankaya gitti.',
    english: 'The dentist went to the bank in the morning.'
  },
  'tr-1163': {
    target: 'Ben bu akşam restorana gittim.',
    english: 'I went to the restaurant this evening.'
  },
  'tr-1165': {
    target: 'Eczacı restorana reçeteyi bıraktı.',
    english: 'The pharmacist left the prescription at the restaurant.'
  },
  'tr-1191': {
    target: 'Veteriner geçen yıl hastanede çalıştı.',
    english: 'The vet worked at the hospital last year.'
  },
  'tr-1196': {
    target: 'Arkeolog dün restoranda makale yazdı.',
    english: 'The archaeologist wrote an article at the restaurant yesterday.'
  },
  'tr-1200': {
    target: 'Fotoğrafçı hafta içi hastanede fotoğraf çekti.',
    english: 'The photographer took photos at the hospital on weekdays.'
  },
  'tr-1202': {
    target: 'Ressam yazın havaalanında tablo sergiledi.',
    english: 'The painter exhibited paintings at the airport in summer.'
  },

  // ── node-11: Modal suffixes -ebil/-abil (A2) ──
  'tr-1363': {
    target: 'Psikolog parkta yavaşça yürüyebilir.',
    english: 'The psychologist can walk slowly in the park.'
  },
  'tr-1366': {
    target: 'Veteriner bankadan kredi alabilir.',
    english: 'The vet can get a loan from the bank.'
  },
  'tr-1378': {
    target: 'Müdür müzede toplantı yapabilir.',
    english: 'The director can hold a meeting at the museum.'
  },
  'tr-1406': {
    target: 'Kimyager laboratuvarda yeni bir bileşik keşfedebilir.',
    english: 'The chemist can discover a new compound in the laboratory.'
  },
  'tr-1409': {
    target: 'Müdür hastaneden rapor isteyebilir.',
    english: 'The director can request a report from the hospital.'
  },
  'tr-1421': {
    target: 'Babaannem müzede rehberlik yapabilir.',
    english: 'My grandmother can give guided tours at the museum.'
  },
  'tr-1425': {
    target: 'O istasyondan tren biletini alabilir.',
    english: 'He/She can buy the train ticket from the station.'
  },
  'tr-1429': {
    target: 'Şoför bankadan para çekebilir.',
    english: 'The driver can withdraw money from the bank.'
  },
  'tr-1466': {
    target: 'Sen otelden erken ayrılabilirsin.',
    english: 'You can leave the hotel early.'
  },
  'tr-1469': {
    target: 'Sen hastaneden ilaç alabilirsin.',
    english: 'You can get medicine from the hospital.'
  },
  'tr-1485': {
    target: 'Hasan okuldan erken çıkabilir.',
    english: 'Hasan can leave school early.'
  },
  'tr-1511': {
    target: 'Çiftçi müzede sergi gezebilir.',
    english: 'The farmer can visit the exhibition at the museum.'
  },

  // ── node-13: Negation -me/-ma (A2) ──
  'tr-1661': {
    target: 'Fotoğrafçı her pazar çarşıda çalışmıyor.',
    english: 'The photographer does not work at the bazaar every Sunday.'
  },

  // ── node-15: Adjectives & comparisons (A2) ──
  'tr-1728': {
    target: 'Müdür spor salonunda hızlı adımlarla yürüyor.',
    english: 'The director walks with quick steps at the gym.'
  },
  'tr-1736': {
    target: 'Kardeşim postaneden mutlu bir şekilde çıkıyor.',
    english: 'My sibling is coming out of the post office happily.'
  },
  'tr-1740': {
    target: 'Bu sabah arkadaşlar stadyumda sessizce maç izliyor.',
    english: 'This morning the friends are quietly watching the match at the stadium.'
  },
  'tr-1753': {
    target: 'Biz stadyumda heyecanla koşuyoruz.',
    english: 'We are running excitedly at the stadium.'
  },
  'tr-1756': {
    target: 'Fırıncı parkta neşeyle koşuyor.',
    english: 'The baker is running cheerfully in the park.'
  },
  'tr-1765': {
    target: 'Bayramda terzi sokakta sessizce dikiş dikiyor.',
    english: 'During the holiday the tailor is quietly sewing on the street.'
  },
  'tr-1771': {
    target: 'Terzi şaşkınlıkla güzel kumaşa bakıyor.',
    english: 'The tailor is looking at the beautiful fabric in amazement.'
  },
  'tr-1772': {
    target: 'Hafta sonu veteriner göl kenarında üzgün bir şekilde oturuyor.',
    english: 'On weekends the vet sits sadly by the lake.'
  },
  'tr-1799': {
    target: 'Her pazar annem havaalanının çevresinde tempolu yürüyor.',
    english: 'Every Sunday my mother walks briskly around the airport.'
  },
  'tr-1801': {
    target: 'Çiftçi manavda sabırla müşteri bekliyor.',
    english: 'The farmer is patiently waiting for customers at the greengrocer.'
  },
  'tr-1805': {
    target: 'Bazen eczacı parkta huzurlu bir şekilde kitap okuyor.',
    english: 'Sometimes the pharmacist reads a book peacefully in the park.'
  },
  'tr-1806': {
    target: 'Sabahleyin onlar eczanede dikkatle ilaçları inceliyor.',
    english: 'In the morning they carefully examine the medicines at the pharmacy.'
  },
  'tr-1810': {
    target: 'Babam tiyatroda hüzünlü bir oyun izliyor.',
    english: 'My father is watching a sad play at the theater.'
  },
  'tr-1821': {
    target: 'Gece balıkçı kilisede sessizce dua ediyor.',
    english: 'At night the fisherman prays quietly at the church.'
  },
  'tr-1825': {
    target: 'Hafta içi kaptan pazarda neşeyle alışveriş yapıyor.',
    english: 'On weekdays the captain shops cheerfully at the market.'
  },
  'tr-1827': {
    target: 'Gelecek hafta siz kütüphanede dikkatle araştırma yapacaksınız.',
    english: 'Next week you will do research carefully in the library.'
  },
  'tr-1829': {
    target: 'Hafta sonu babam istasyonda neşeyle arkadaşlarını karşılıyor.',
    english: 'On weekends my father cheerfully greets his friends at the station.'
  },
  'tr-1835': {
    target: 'Garson postanede sabırla kargo bekliyor.',
    english: 'The waiter is patiently waiting for a parcel at the post office.'
  },
  'tr-1846': {
    target: 'Yarın annem mutfakta özenle pasta yapıyor.',
    english: 'Tomorrow my mother is carefully making a cake in the kitchen.'
  },
  'tr-1860': {
    target: 'Kaptan bankada ciddi bir şekilde hesaplarını kontrol ediyor.',
    english: 'The captain is seriously checking his accounts at the bank.'
  },
  'tr-1869': {
    target: 'Hafta sonu babam müzede ilgiyle tabloları inceliyor.',
    english: 'On weekends my father examines the paintings with interest at the museum.'
  },
  'tr-1877': {
    target: 'Yazın sen çarşıda hızlıca alışveriş yapıyorsun.',
    english: 'In summer you shop quickly at the bazaar.'
  },
  'tr-1879': {
    target: 'Bu sabah öğretmen stadyumda dikkatle öğrencileri izliyor.',
    english: 'This morning the teacher is carefully watching the students at the stadium.'
  },
  'tr-1889': {
    target: 'Gün batımında hemşire otelde sabırla hasta bekliyor.',
    english: 'At sunset the nurse is patiently waiting for a patient at the hotel.'
  },
  'tr-1891': {
    target: 'Hafta içi veteriner alışveriş merkezinde dikkatle ilaç arıyor.',
    english: 'On weekdays the vet is carefully looking for medicine at the shopping mall.'
  },
  'tr-1896': {
    target: 'Bayramda garson stadyumda neşeyle çay servisi yapıyor.',
    english: 'During the holiday the waiter cheerfully serves tea at the stadium.'
  },
  'tr-1897': {
    target: 'Akşamüstü gazeteci pazarda heyecanla haber topluyor.',
    english: 'In the late afternoon the journalist excitedly gathers news at the market.'
  },
  'tr-1904': {
    target: 'Sabahleyin dedem konser salonunda keyifle müzik dinliyor.',
    english: 'In the morning my grandfather enjoyably listens to music at the concert hall.'
  },
  'tr-1908': {
    target: 'Bu sabah anneanne alışveriş merkezinde dikkatle fiyatları karşılaştırıyor.',
    english: 'This morning my grandmother is carefully comparing prices at the shopping mall.'
  },
  'tr-1909': {
    target: 'Hafta sonu kaptan postanede sabırla sıra bekliyor.',
    english: 'On weekends the captain patiently waits in line at the post office.'
  },
  'tr-1915': {
    target: 'Hafta sonu doktor stadyumda dikkatle maç izliyor.',
    english: 'On weekends the doctor carefully watches the match at the stadium.'
  },
  'tr-1922': {
    target: 'Bu sabah kasap köprüde balıkçılarla sohbet ediyor.',
    english: 'This morning the butcher is chatting with fishermen on the bridge.'
  },

  // ── node-16: Reported past -miş/-mış (B1) ──
  'tr-1923': {
    target: 'Turistler yarın için küçük bir otel bulmuş.',
    english: 'The tourists have apparently found a small hotel for tomorrow.'
  },
  'tr-1947': {
    target: 'İstiyorum ki hayat daha kolay olsun.',
    english: 'I want life to be easier.'
  },
  'tr-2095': {
    target: 'İstiyorum ki şehirde ulaşım daha hızlı olsun.',
    english: 'I want transportation in the city to be faster.'
  },

  // ── node-17: Directions & transport (B1) ──
  'tr-2172': {
    target: 'Diş hekimi öğleden sonra tiyatroya taksiyle gitti.',
    english: 'The dentist went to the theater by taxi in the afternoon.'
  },

  // ── node-18: Subordinate clauses (B1) ──
  'tr-2301': {
    target: 'Diş hekimi havaalanına vardığında uçak çoktan kalkmıştı.',
    english: 'When the dentist arrived at the airport, the plane had already taken off.'
  },

  // ── node-22: Passive voice (B2) ──
  'tr-2689': {
    target: 'Alışveriş merkezinde yeni açılan kitapçı herkes tarafından beğenildi.',
    english: 'The newly opened bookstore at the shopping mall was liked by everyone.'
  },

  // ── node-23: Causative (B2) ──
  'tr-2799': {
    target: 'Matbaa icat edilmemiş olsaydı, bilginin yayılması yüzyıllar sürerdi.',
    english: 'If the printing press had not been invented, the spread of knowledge would have taken centuries.'
  },

  // ── node-24: Future tense (B2) ──
  'tr-2938': {
    target: 'Otelde yarın sabah büyük bir toplantı düzenlenecek.',
    english: 'A large meeting will be organized at the hotel tomorrow morning.'
  },
  'tr-2963': {
    target: 'Berber bu sabah konser salonunda saçları kesecek.',
    english: 'The barber will cut hair at the concert hall this morning.'
  },

  // ── node-25: Advanced connectors (B2) ──
  'tr-3028': {
    target: 'Aşçı hem yemek hazırladı hem de masaları düzenledi.',
    english: 'The chef both prepared the food and arranged the tables.'
  },

  // ── node-26: Noun compounds (B2) ──
  'tr-3125': {
    target: 'Müzisyen hafta içi bankada konser programını okudu.',
    english: 'The musician read the concert program at the bank on weekdays.'
  },
  'tr-3144': {
    target: 'Yengeç suyun altında yiyecek bulmaya çalıştı.',
    english: 'The crab tried to find food underwater.'
  },

  // ── node-27: Reported speech (B2) ──
  'tr-3231': {
    target: 'Şef yeni projenin başarılı olduğunu söyledi.',
    english: 'The boss said that the new project was successful.'
  },

  // ── node-32: Literary Turkish (C1/C2) ──
  'tr-3614': {
    target: 'Ali hafta sonu spor salonunda yoğun bir antrenman yaptığını anlattı.',
    english: 'Ali described having an intense workout at the gym on the weekend.'
  },

  // ── node-34: Cultural fluency (C1/C2) ──
  'tr-3784': {
    target: 'Mühendis gün batımında havaalanında nostaljik bir hikâye anlattı.',
    english: 'The engineer told a nostalgic story at the airport at sunset.'
  }
};

// ── Run ──
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

let fixed = 0;
const missing = [];

for (const card of deck) {
  if (replacements[card.id]) {
    card.target = replacements[card.id].target;
    card.english = replacements[card.id].english;
    fixed++;
  }
}

// Check for IDs that weren't found
for (const id of Object.keys(replacements)) {
  if (!deck.find(c => c.id === id)) {
    missing.push(id);
  }
}

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n', 'utf8');

console.log(`Fixed ${fixed}/${Object.keys(replacements).length} cards.`);
if (missing.length) {
  console.log(`WARNING: ${missing.length} IDs not found in deck: ${missing.join(', ')}`);
}
