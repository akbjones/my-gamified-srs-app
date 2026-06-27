/**
 * Batch 4 — 125 rewrites from targeted middle-deck sweep (1057-2112).
 * The earlier batch-3 agents on this range mostly returned empty; this
 * pass with more directive prompting and "you will find more" framing
 * surfaced the genuinely-missed cards.
 */
const fs = require('fs');
const path = require('path');

const DECK = path.resolve(__dirname, '..', 'src', 'data', 'hindi', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK, 'utf8'));

const BATCH = [
  // 1057-1320
  {id:'hi-1061',target:'भाला फेंक प्रतियोगिता में नीरज ने सोना जीता।',english:'Neeraj won gold in the javelin throw competition.'},
  {id:'hi-1172',target:'कोलकाता में एक नई सड़क बन रही है।',english:'A new road is being built in Kolkata.'},
  {id:'hi-1178',target:'शहीदों को श्रद्धांजलि दी गई।',english:'Tribute was paid to the martyrs.'},
  {id:'hi-1189',target:'दीपावली पर घरों में दीये जलाते हैं।',english:'People light lamps in homes on Diwali.'},
  {id:'hi-1191',target:'रबाब अफ़ग़ानिस्तान और भारत में बजता है।',english:'The rabab is played in Afghanistan and India.'},
  {id:'hi-1217',target:'मेरे फूफाजी सेना में अफ़सर हैं।',english:'My uncle is an officer in the army.'},
  {id:'hi-1240',target:'बैसाखी पंजाब में फ़सल कटाई का त्योहार है।',english:"Baisakhi is Punjab's harvest festival."},
  {id:'hi-1241',target:'अस्पताल में भर्ती होने के लिए कागज़ात ले आओ।',english:'Bring the documents for hospital admission.'},
  {id:'hi-1248',target:'देवदार का पेड़ हिमालय में पाया जाता है।',english:'The deodar tree is found in the Himalayas.'},
  {id:'hi-1261',target:'मेरा बड़ा बेटा इस साल बारहवीं में है।',english:'My elder son is in twelfth grade this year.'},
  {id:'hi-1263',target:'हमारे घर में जन्मदिन बड़ी धूमधाम से मनाते हैं।',english:'We celebrate birthdays with great fanfare at our house.'},
  {id:'hi-1270',target:'छलनी से आटा छान लो।',english:'Sift the flour through the sieve.'},
  {id:'hi-1271',target:'चोट पर मरहम लगा और पट्टी बाँध दो।',english:'Apply ointment on the wound and tie a bandage.'},
  {id:'hi-1273',target:'रामलीला दशहरे से पहले होती है।',english:'The Ramlila performance happens before Dussehra.'},
  {id:'hi-1274',target:'मेथी के बीज पाचन में मदद करते हैं।',english:'Fenugreek seeds help with digestion.'},
  {id:'hi-1279',target:'रँगाई-छपाई की कला जयपुर में मशहूर है।',english:'The art of dyeing and printing is famous in Jaipur.'},
  {id:'hi-1282',target:'रेशम के कीड़े कोकून से रेशा बनाते हैं।',english:'Silkworms make silk from cocoons.'},
  {id:'hi-1283',target:'हींग डालने से तड़का खुशबूदार हो जाता है।',english:'Adding asafoetida to the tempering makes it fragrant.'},
  {id:'hi-1284',target:'चूल्हे की राख से बर्तन चमकाते थे।',english:'Utensils used to be polished with stove ash.'},
  {id:'hi-1286',target:'गाँधीजी के लिए चरखा बहुत अहम था।',english:'The spinning wheel was very important to Gandhi.'},
  {id:'hi-1288',target:'ताख पर रखी मूर्ति धूल से ढकी थी।',english:'The statue on the shelf was covered with dust.'},
  {id:'hi-1289',target:'व्यंग्य से हम समाज पर बातें कहते हैं।',english:'Through satire we comment on society.'},
  {id:'hi-1291',target:'यह पुराना शहर इतिहास से भरा है।',english:'This old city is full of history.'},
  {id:'hi-1292',target:'कुम्हार के चाक पर मटका बन रहा था।',english:"A pot was taking shape on the potter's wheel."},
  {id:'hi-1293',target:'चूल्हे पर रखी केतली से भाप निकल रही थी।',english:'Steam was coming out of the kettle on the stove.'},
  {id:'hi-1294',target:'बिरयानी में केसर और मेवे डालने से स्वाद बढ़ता है।',english:"Adding saffron and dried fruits enhances biryani's flavor."},
  {id:'hi-1295',target:'तोतला बच्चा अलग ही प्यारा बोलता है।',english:'The lisping child talks adorably.'},
  {id:'hi-1306',target:'दादाजी हमें बचपन की बातें सुनाते हैं।',english:'Grandfather tells us childhood stories.'},
  {id:'hi-1308',target:'घी में भुने मखाने बहुत स्वादिष्ट होते हैं।',english:'Fox nuts roasted in ghee are delicious.'},
  {id:'hi-1315',target:'पड़ोसी से अच्छा व्यवहार रखना अच्छी बात है।',english:'Being kind to neighbors is a good thing.'},
  {id:'hi-1318',target:'कश्मीरी कहवा खुशबूदार और स्वादिष्ट होता है।',english:'Kashmiri kahwa is fragrant and delicious.'},
  {id:'hi-1319',target:'सुबह का नाश्ता दिन का सबसे ज़रूरी खाना होता है।',english:'Morning breakfast is the most important meal of the day.'},
  // 1321-1584
  {id:'hi-1365',target:'दुनिया में रेशम से ज़्यादा कपास उगाई जाती है।',english:'More cotton is grown in the world than silk.'},
  {id:'hi-1372',target:'प्रिया भोपाल की सबसे लंबी औरत है।',english:'Priya is the tallest woman in Bhopal.'},
  {id:'hi-1386',target:'तुलसी पुदीने से ज़्यादा दवाई वाला पौधा है।',english:'Basil is a more medicinal plant than mint.'},
  {id:'hi-1387',target:'बैंगन आलू से कम पसंदीदा सब्ज़ी है।',english:'Eggplant is a less popular vegetable than potato.'},
  {id:'hi-1394',target:'गणित छठी कक्षा से मुश्किल हो जाता है।',english:'Math becomes difficult from sixth grade.'},
  {id:'hi-1395',target:'हमारे फैमिली प्रोग्राम में सब रिश्तेदार आते हैं।',english:'All relatives come to our family functions.'},
  {id:'hi-1398',target:'चिल्का झील ओडिशा की मुख्य टूरिस्ट जगह है।',english:"Chilka Lake is Odisha's main tourist place."},
  {id:'hi-1402',target:'नारियल पानी नींबू पानी से ज़्यादा सेहतमंद है।',english:'Coconut water is healthier than lemonade.'},
  {id:'hi-1403',target:'आजकल आप किस इलाके में काम करते हैं?',english:'Which area do you work in these days?'},
  {id:'hi-1422',target:'आप वेबसाइट पर जानकारी सुरक्षित तरीक़े से भेजते हो।',english:'You send information securely over the website.'},
  {id:'hi-1427',target:'मेरे शौहर और मेरे भाई में गहरी दोस्ती है।',english:'My husband and my brother have a deep friendship.'},
  {id:'hi-1432',target:'मेरी ज़िंदगी में माँ की जगह सबसे ऊपर है।',english:'My mother holds the highest place in my life.'},
  {id:'hi-1444',target:'करोड़ों लोग हर साल इस धार्मिक जगह पर आते हैं।',english:'Crores of people come to this pilgrimage site every year.'},
  {id:'hi-1469',target:'तुलसी धनिये से ज़्यादा दवाई वाली होती है।',english:'Basil has more medicinal properties than coriander.'},
  {id:'hi-1473',target:'चाँदी सोने से हल्की धातु है।',english:'Silver is a lighter metal than gold.'},
  {id:'hi-1474',target:'संस्कृत हिंदी से पुरानी भाषा है।',english:'Sanskrit is an older language than Hindi.'},
  {id:'hi-1482',target:'हवामहल की खिड़कियाँ छत्तीस हिस्सों में बँटी हैं।',english:'The windows of Hawa Mahal are divided into 36 sections.'},
  {id:'hi-1490',target:'पचीसी में आप गोटियाँ चलाकर खेलते हो।',english:'In pachisi you play by moving pieces.'},
  {id:'hi-1494',target:'चमेली गुलाब से ज़्यादा खुशबूदार होती है।',english:'Jasmine is more fragrant than rose.'},
  {id:'hi-1502',target:'गुलाब कमल जितना खुशबूदार नहीं होता।',english:'A rose is not as fragrant as a lotus.'},
  {id:'hi-1507',target:'चंदन की लकड़ी सबसे खुशबूदार होती है।',english:'Sandalwood is the most fragrant wood.'},
  {id:'hi-1511',target:'सागौन की लकड़ी सबसे टिकाऊ होती है।',english:'Teak is the most durable wood.'},
  {id:'hi-1514',target:'कोयल की आवाज़ कौए से मीठी होती है।',english:"The cuckoo's voice is sweeter than the crow's."},
  {id:'hi-1601',target:'तालाब के किनारे हंसों का झुंड था।',english:'There was a flock of swans by the pond.'},
  {id:'hi-1626',target:'शाम को रेडियो पर विविध भारती सुनते थे।',english:'In the evening we used to listen to Vividh Bharati on the radio.'},
  {id:'hi-1627',target:'ग्रीनहाउस में लोग साल भर सब्ज़ियाँ उगाते हैं।',english:'In a greenhouse people grow vegetables year-round.'},
  // 1585-1848
  {id:'hi-1637',target:'दिवाली पर बाज़ार में तेल के दीये जलते थे।',english:'On Diwali, oil lamps used to burn in the market.'},
  {id:'hi-1640',target:'खलिहान में फ़सल को बैलों से पीसते थे।',english:'They used to thresh crops with bullocks on the threshing floor.'},
  {id:'hi-1642',target:'पापा शाम को बालकनी में बैठकर चाय पीते थे।',english:'Papa used to sit in the balcony in the evening and drink tea.'},
  {id:'hi-1643',target:'जब हम छोटे थे, तो मिट्टी में खेलते थे।',english:'When we were small, we used to play in the mud.'},
  {id:'hi-1644',target:'शादियों में माला की रस्म बड़ी धूमधाम से होती थी।',english:'The garland ceremony at weddings used to happen with great fanfare.'},
  {id:'hi-1661',target:'प्रदर्शनी में हाथों के काम की चीज़ें रखी गईं।',english:'Handcrafted items were displayed at the exhibition.'},
  {id:'hi-1668',target:'बहादुर पर्वतारोही ने चोटी पर झंडा लगाया।',english:'The brave mountaineer planted a flag on the summit.'},
  {id:'hi-1672',target:'लोहड़ी पर लोग अलाव जलाकर गीत गाते हैं।',english:'People light a bonfire and sing songs on Lohri.'},
  {id:'hi-1676',target:'हस्तशिल्प मेले में कारीगरों ने अपना काम दिखाया।',english:'Craftsmen displayed their work at the handicraft fair.'},
  {id:'hi-1678',target:'त्योहार पर दीये जलाकर पूरे आँगन को सजाते थे।',english:'On festivals we used to light lamps and decorate the whole courtyard.'},
  {id:'hi-1695',target:'पुरानी मस्जिद शहर के बीच में है।',english:'The old mosque is in the middle of the city.'},
  {id:'hi-1697',target:'साफ़ पानी सेहत के लिए बहुत ज़रूरी है।',english:'Clean water is very important for health.'},
  {id:'hi-1708',target:'रात को हल्का खाना खाना सेहत के लिए अच्छा है।',english:'Eating a light dinner is good for health.'},
  {id:'hi-1737',target:'ताज़े नारियल की चटनी इडली के साथ स्वादिष्ट लगती है।',english:'Fresh coconut chutney tastes great with idli.'},
  {id:'hi-1747',target:'शहर के बाहर एक पुराना क़िला है।',english:'There is an old fort outside the city.'},
  {id:'hi-1748',target:'दरवाज़े से गुज़रकर हवेली के अंदर गए।',english:'They walked through the gateway into the mansion.'},
  {id:'hi-1749',target:'आँवले का अचार सेहत के लिए बहुत अच्छा है।',english:'Gooseberry pickle is very good for health.'},
  {id:'hi-1755',target:'आधी रात में सन्नाटा छाया रहता है।',english:'Silence settles in at midnight.'},
  {id:'hi-1757',target:'अगर तबीयत ठीक रही तो कल ऑफिस जाऊँगा।',english:"If I feel well, I'll go to the office tomorrow."},
  {id:'hi-1787',target:'संतूर की मीठी आवाज़ दिल को छू गई।',english:'The sweet sound of the santoor touched the heart.'},
  {id:'hi-1791',target:'अच्छे स्वभाव वाला आदमी सबको पसंद आता है।',english:'A person with a kind nature is liked by everyone.'},
  {id:'hi-1792',target:'काफ़िला आगे बढ़ता गया, थकावट की परवाह किए बिना।',english:'The caravan kept moving forward, regardless of fatigue.'},
  {id:'hi-1798',target:'कुल्हड़ में चाय की चुस्की लेना शानदार लगता है।',english:'Sipping tea from a clay cup feels wonderful.'},
  {id:'hi-1800',target:'आम का पेड़ भारत का राष्ट्रीय पेड़ नहीं है, बरगद है।',english:"The mango tree is not India's national tree; the banyan is."},
  {id:'hi-1802',target:'गतका पंजाब का लड़ाई का खेल है।',english:"Gatka is Punjab's martial art."},
  {id:'hi-1884',target:'बैंक में खाता खोलने के लिए पहचान का सबूत चाहिए।',english:'You need proof of identity to open a bank account.'},
  {id:'hi-1888',target:'मनोज दूर के रिश्तेदार से मिलने गया।',english:'Manoj went to meet a distant relative.'},
  {id:'hi-1906',target:'यह चिट्ठी पोस्ट ऑफिस में जमा कर दो।',english:'Submit this letter at the post office.'},
  {id:'hi-1907',target:'बहू जी, अंदर आइए और बैठिए।',english:'Daughter-in-law, please come inside and sit down.'},
  // 1849-2112
  {id:'hi-1917',target:'अनुवाद में मूल भाव बनाए रखना मुश्किल है।',english:'Keeping the original meaning in translation is difficult.'},
  {id:'hi-1927',target:'मेरी बहन का स्वभाव बहुत नरम और प्यारा है।',english:"My sister's nature is very gentle and sweet."},
  {id:'hi-1936',target:'होटल मालिक ने मुसाफ़िरों को ठहराया।',english:'The hotel owner put up the travelers.'},
  {id:'hi-1941',target:'मुश्किल में घबराओ मत, हिम्मत रखो।',english:"Don't panic in difficulty, keep up courage."},
  {id:'hi-1947',target:'गुलेल से पत्थर मारकर परिंदे भगाए।',english:'They scared away the birds with a slingshot.'},
  {id:'hi-1953',target:'कलारिपयट्टु केरल की पुरानी युद्ध कला है।',english:"Kalaripayattu is Kerala's ancient martial art."},
  {id:'hi-1954',target:'अंजलि, ज़रा टीवी की आवाज़ कम करो।',english:'Anjali, please turn down the TV volume.'},
  {id:'hi-1956',target:'पुरातत्ववेत्ताओं ने खंडहर से पुराने सिक्के खोजे।',english:'Archaeologists discovered old coins from the ruins.'},
  {id:'hi-1961',target:'शीशम की लकड़ी फ़र्नीचर के लिए बहुत अच्छी है।',english:'Rosewood is excellent for furniture.'},
  {id:'hi-1983',target:'अभ्यास से मुश्किल काम भी आसान हो जाता है।',english:'Practice makes even difficult work easy.'},
  {id:'hi-2003',target:'ताँगे का मालिक घोड़े की लगाम खींचता है।',english:"The tonga driver pulled the horse's reins."},
  {id:'hi-2013',target:'क्या तुम्हारी सेहत अब पहले से बेहतर है?',english:'Is your health better now than before?'},
  {id:'hi-2019',target:'उत्तर भारत में लोग कचालू की सब्ज़ी खाते हैं।',english:'People in north India eat colocasia curry.'},
  {id:'hi-2044',target:'तौलिये से मुँह पोंछकर खाना शुरू किया।',english:'He wiped his face with the towel and started eating.'},
  {id:'hi-2048',target:'खजुराहो के मंदिर शिल्प कला के शानदार उदाहरण हैं।',english:'The Khajuraho temples are excellent examples of craftsmanship.'},
  {id:'hi-2056',target:'जंग लगने से लोहा कमज़ोर हो जाता है।',english:'Iron becomes weak from rusting.'},
  {id:'hi-2060',target:'जो छात्र मेहनत करता है, वह कामयाब होता है।',english:'A student who works hard succeeds.'},
  {id:'hi-2062',target:'जो मूवी अनीता ने सुझाई, वह बहुत अच्छी थी।',english:'The movie Anita suggested was really good.'},
  {id:'hi-2063',target:'जो मूवी प्रिया ने सुझाई, वह बहुत अच्छी थी।',english:'The movie Priya suggested was really good.'},
  {id:'hi-2095',target:'ढोल बजाते हुए बच्चे कदम मिलाकर चल रहे थे।',english:'Children were marching while playing drums.'},
  {id:'hi-2102',target:'जो सड़क लखनऊ जाती है, वह बंद है।',english:'The road that goes to Lucknow is closed.'},
  {id:'hi-2104',target:'जो परिंदा सबसे ऊँचा उड़ता है, वह बाज़ है।',english:'The bird that flies highest is the eagle.'},
  {id:'hi-2116',target:'जब भी कविता आती है, सब खुश हो जाते हैं।',english:'Whenever Kavita comes, everyone is happy.'},
  {id:'hi-2118',target:'परीक्षा के दिनों में नौ दिन तक छात्र ख़ूब पढ़ते हैं।',english:'Students study a lot for nine days during exams.'},
  {id:'hi-2140',target:'यहाँ लोग हिंदी बोलते हैं।',english:'People speak Hindi here.'},
  {id:'hi-2145',target:'इस गाँव में किसान चावल उगाते हैं।',english:'In this village, farmers grow rice.'},
  {id:'hi-2147',target:'पूरे देश में लोग यह गीत गाते हैं।',english:'People sing this song all over the country.'},
  {id:'hi-2156',target:'कचरे को छाँटकर फिर से इस्तेमाल करते हैं।',english:'Garbage is sorted and reused.'},
  {id:'hi-2168',target:'अगले हफ़्ते परीक्षा के नतीजे आ जाएँगे।',english:'Exam results will come out next week.'},
  {id:'hi-2170',target:'शाम तक चुनाव के नतीजे आ जाएँगे।',english:'Election results will come out by evening.'},
  {id:'hi-2173',target:'अगले महीने से नए नियम लागू होंगे।',english:'New rules will come into effect from next month.'},
  {id:'hi-2178',target:'गोबर के उपले सुखाकर लोग ईंधन बनाते हैं।',english:'People make fuel by drying cow-dung cakes.'},
  {id:'hi-2180',target:'स्कूल में नई लैब बनाई जा रही है।',english:'A new lab is being built at the school.'},
  {id:'hi-2182',target:'नीलकंठ परिंदा दशहरे पर शुभ माना जाता है।',english:'The Indian roller bird is considered auspicious on Dussehra.'},
  {id:'hi-2183',target:'इस दवाई को खाना खाने के बाद लो।',english:'Take this medicine after meals.'},
  {id:'hi-2184',target:'हर साल लोग इस मेले का आयोजन करते हैं।',english:'People organize this fair every year.'},
];

const byId = new Map(deck.map(c => [c.id, c]));
let applied = 0, missing = 0;
for (const p of BATCH) {
  const card = byId.get(p.id);
  if (!card) { console.warn(`MISSING: ${p.id}`); missing++; continue; }
  card.target = p.target;
  card.english = p.english;
  applied++;
}
fs.writeFileSync(DECK, JSON.stringify(deck, null, 2) + '\n');
console.log(`Applied ${applied}/${BATCH.length}  (missing: ${missing})`);
