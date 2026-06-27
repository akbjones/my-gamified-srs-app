/**
 * Batch 5 — long-tail register sweep across full deck (0-3170).
 *
 * 4 parallel agents proposed ~98 rewrites. After review, drop:
 *  - No-op cards where proposed text == original (hi-1967, hi-2046, hi-2207,
 *    hi-2219, hi-2226, hi-2710, hi-2386 chunk-3 version, hi-3110)
 *  - "Improvements" that move sideways (वैश्वीकरण→भूमंडलीकरण in hi-2969;
 *    झड़ना→गिरना in hi-2371)
 *  - Cultural-concept replacements (संस्कार in hi-2261 — keep, per the
 *    cultural-preservation rule from batch 1 review)
 *  - hi-2657 gender — proposal kept original's masc verb on Shobha; original
 *    is unchanged from a register angle anyway. Skip.
 *
 * Net: ~60 real changes.
 */
const fs = require('fs');
const path = require('path');

const DECK = path.resolve(__dirname, '..', 'src', 'data', 'hindi', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK, 'utf8'));

const BATCH = [
  // Chunk 0-792
  { id: 'hi-0148', target: 'मुझे बताओ कि असली दिक़्क़त क्या है।', english: 'Tell me what the real problem is.' },
  { id: 'hi-0199', target: 'मुझे हर दिन कुछ नई और काम की बातें सीखना है।', english: 'I want to learn new and useful things every day.' },
  { id: 'hi-0272', target: 'पीले फूल बगीचे को सुंदर बनाते हैं।', english: 'Yellow flowers make the garden beautiful.' },
  { id: 'hi-0285', target: 'माँ का प्यार बेशकीमती है।', english: "A mother's affection is priceless." },
  { id: 'hi-0586', target: 'मैं हर दिन कुछ नया सीखता हूँ।', english: 'I learn something new every day.' },
  { id: 'hi-0791', target: 'मेरी बड़ी बहन ने मेरी हर दिक़्क़त में साथ दिया है।', english: 'My elder sister has supported me in every problem.' },

  // Chunk 793-1584
  { id: 'hi-0817', target: 'अठारहवीं सदी में मुग़ल राज्य कमज़ोर हुआ।', english: 'The Mughal empire weakened in the eighteenth century.' },
  { id: 'hi-0855', target: 'चौसर भारत का पुराना बोर्ड खेल है।', english: "Chausar is India's ancient board game." },
  { id: 'hi-0858', target: 'गुड़ी पड़वा महाराष्ट्र का नया साल है।', english: "Gudi Padwa is Maharashtra's New Year." },
  { id: 'hi-0894', target: 'मैं पिछले पाँच सालों से यहाँ रह रहा हूँ।', english: 'I have been living here for the last five years.' },
  { id: 'hi-0904', target: 'जैसे-जैसे शहर बढ़ता जा रहा है, वैसे-वैसे पर्यावरण की दिक़्क़तें भी गंभीर होती जा रही हैं।', english: 'As the city keeps growing, environmental problems are also becoming serious.' },
  { id: 'hi-0936', target: 'याक तिब्बत और लद्दाख में मिलता है।', english: 'The yak is found in Tibet and Ladakh.' },
  { id: 'hi-0972', target: 'हमें इस दिक़्क़त का हल ढूँढ़ना चाहिए।', english: 'We should find a solution to this problem.' },
  { id: 'hi-1053', target: 'कस्तूरी मृग हिमालय में मिलता है।', english: 'The musk deer is found in the Himalayas.' },
  { id: 'hi-1056', target: 'बारिश का पानी बचाने से ज़मीन का पानी बढ़ता है।', english: 'Rainwater harvesting increases groundwater level.' },
  { id: 'hi-1221', target: 'इस साल फ़रवरी में उनतीस दिन थे।', english: 'This year February had twenty-nine days.' },

  // Chunk 1585-2376
  { id: 'hi-1652', target: 'पहले दवाइयाँ जड़ी-बूटियों से बनाई जाती थीं।', english: 'Earlier medicines were made from herbs.' },
  { id: 'hi-1653', target: 'पहले सड़कें कच्ची होती थीं।', english: 'Earlier the roads were unpaved.' },
  { id: 'hi-1659', target: "कंचनजंगा भारत की तीसरी सबसे ऊँची चोटी है।", english: "Kanchenjunga is India's third highest peak." },
  { id: 'hi-1662', target: 'पहले बैलगाड़ी से सामान ढोते थे।', english: 'Earlier they transported goods by bullock cart.' },
  { id: 'hi-1671', target: 'पहले कम घरों में टेलीफ़ोन होता था।', english: 'Earlier, few homes had telephones.' },
  { id: 'hi-1674', target: 'बचपन में हम आम के पेड़ पर चढ़ते थे।', english: 'In childhood, we used to climb mango trees.' },
  { id: 'hi-1689', target: 'बड़ी नदी शहर के पास से बहती है।', english: 'The big river flows near the city.' },
  { id: 'hi-1711', target: 'नदी पुल के नीचे से बहती है।', english: 'The river flows under the bridge.' },
  { id: 'hi-1727', target: 'खेतों के बीच से एक पतली नदी बहती है।', english: 'A narrow river flows between the fields.' },
  { id: 'hi-1733', target: 'संधि के बाद दोनों देशों में शांति हो गई।', english: 'Peace came between both countries after the treaty.' },
  { id: 'hi-1744', target: 'झंडोत्तोलन के बाद राष्ट्रगान गाया गया।', english: 'The national anthem was sung after the flag hoisting.' },
  { id: 'hi-1753', target: 'हमने मेहमानों के लिए ख़ास पंजाबी खाना तैयार किया।', english: 'We specially prepared Punjabi food for the guests.' },
  { id: 'hi-1955', target: 'बारिश के मौसम में मेंढक बोलने लगते हैं।', english: 'Frogs start croaking in the rainy season.' },
  { id: 'hi-1958', target: 'मकर संक्रांति पर तिल-गुड़ बाँटते हैं।', english: 'Sesame and jaggery are distributed on Makar Sankranti.' },
  { id: 'hi-2015', target: 'इक्यावन साल की उम्र में उन्होंने सन्यास ले लिया।', english: 'He took renunciation at the age of fifty-one.' },
  { id: 'hi-2127', target: 'मेहमान का स्वागत करना भारतीय परंपरा है।', english: 'Welcoming guests is an Indian tradition.' },
  { id: 'hi-2169', target: 'इस गाँव को आदर्श गाँव कहते हैं।', english: 'This village is called an ideal village.' },
  { id: 'hi-2172', target: 'राग भैरव को सुबह का राग माना जाता है।', english: 'Raag Bhairav is considered a morning raga.' },
  { id: 'hi-2176', target: 'पुरस्कार समारोह अगले हफ़्ते होगा।', english: 'The award ceremony will be held next week.' },
  { id: 'hi-2179', target: 'यह गाना सारे देश में सुना जाता है।', english: 'This song is heard throughout the country.' },
  { id: 'hi-2185', target: 'रेशमी धागे से ज़रदोज़ी का काम करते हैं।', english: 'They do zardozi work with silk thread.' },
  { id: 'hi-2186', target: 'इस इलाके में चावल की खेती होती है।', english: 'Rice is farmed in this area.' },
  { id: 'hi-2188', target: 'गंगा को भारत की सबसे पवित्र नदी मानते हैं।', english: "Ganga is considered India's holiest river." },
  { id: 'hi-2190', target: 'हमारे परिवार में बुज़ुर्गों का सम्मान करते हैं।', english: 'We respect elders in our family.' },
  { id: 'hi-2192', target: 'दामाद जी को परिवार में सम्मान दिया जाता है।', english: 'The son-in-law is respected in the family.' },
  { id: 'hi-2193', target: 'इस स्कूल में हिंदी और अंग्रेज़ी दोनों पढ़ाते हैं।', english: 'Both Hindi and English are taught in this school.' },
  { id: 'hi-2195', target: 'परिवार में हर किसी की बात सुनते हैं।', english: "Everyone's opinion is heard in the family." },
  { id: 'hi-2196', target: 'सभी यात्रियों को बताया जाता है कि ट्रेन देरी से आएगी।', english: 'All passengers are told that the train will arrive late.' },
  { id: 'hi-2206', target: 'त्योहार पर स्कूल बंद होते हैं।', english: 'Schools are closed on festivals.' },
  { id: 'hi-2214', target: 'राशन कार्ड के ज़रिए अनाज बाँटते हैं।', english: 'Grain is distributed through ration cards.' },
  { id: 'hi-2216', target: 'तिलक लगाना शुभ अवसर पर करते हैं।', english: 'Tilak is applied on auspicious occasions.' },
  { id: 'hi-2217', target: 'भेड़ की ऊन कतरकर धागा बनाते हैं।', english: "Thread is made by shearing sheep's wool." },
  { id: 'hi-2223', target: 'खराद पर लकड़ी को गोल आकार देते हैं।', english: 'Wood is shaped round on the lathe.' },
  { id: 'hi-2370', target: 'चुकंदर का रस खून बढ़ाने में मदद करता है।', english: 'Beetroot juice helps boost blood.' },

  // Chunk 2377-3170
  { id: 'hi-2386', target: 'तमाशा महाराष्ट्र का एक लोकनृत्य नाटक है।', english: 'Tamasha is a folk dance drama from Maharashtra.' },
  { id: 'hi-2409', target: 'वंदना ने न सिर्फ़ परीक्षा पास की बल्कि पहला नंबर भी पाया।', english: 'Vandana not only passed the exam but also got first place.' },
  { id: 'hi-2410', target: 'तनवी ने न सिर्फ़ परीक्षा पास की बल्कि पहला नंबर भी पाया।', english: 'Tanvi not only passed the exam but also got first place.' },
  { id: 'hi-2461', target: 'भले ही शिमला दूर है, फिर भी हम वहाँ ज़रूर जाएँगे क्योंकि उसकी खूबसूरती लाजवाब है।', english: 'Even though Shimla is far, we will definitely go there because its beauty is amazing.' },
  { id: 'hi-2477', target: 'विधानसभा में विपक्ष ने सरकार से सवाल पूछे।', english: 'The opposition asked the government questions in the assembly.' },
  { id: 'hi-2481', target: 'दीपक ने अपने भाषण में राष्ट्रीय एकता की बात की।', english: 'Deepak talked about national unity in his speech.' },
  { id: 'hi-2488', target: 'घाघरा-चोली राजस्थान की परंपरागत पोशाक है।', english: 'Ghagra-choli is the traditional dress of Rajasthan.' },
  { id: 'hi-2493', target: 'मेरे पिताजी सरकारी दफ़्तर में काम करते हैं।', english: 'My father works in a government office.' },
  { id: 'hi-2522', target: 'अमृतसर का स्वर्ण मंदिर शानदार वास्तुकला का एक नमूना है।', english: "Amritsar's Golden Temple is an example of magnificent architecture." },
  { id: 'hi-2579', target: 'सब्र रखने से मुश्किल भी आसान हो जाती है।', english: 'With patience, even difficulty becomes easy.' },
  { id: 'hi-2593', target: 'भपंग राजस्थान का एक वाद्य यंत्र है।', english: 'Bhapang is a musical instrument from Rajasthan.' },
  { id: 'hi-2610', target: 'ताजमहल संगमरमर से बना एक शानदार स्मारक है।', english: 'The Taj Mahal is a magnificent monument made of marble.' },
  { id: 'hi-2651', target: 'गंगा के घाट पर शाम का दृश्य बहुत खूबसूरत था।', english: 'The evening scene at the Ganga ghats was very beautiful.' },
  { id: 'hi-2716', target: 'शपथ ग्रहण समारोह में मंत्रियों ने शपथ ली।', english: 'Ministers took oath at the swearing-in ceremony.' },
  { id: 'hi-2718', target: 'घुड़सवारी सीखने में सब्र और अभ्यास लगता है।', english: 'Learning horse riding requires patience and practice.' },
  { id: 'hi-2738', target: 'बाजे-गाजे के साथ जुलूस निकला।', english: 'A procession went out with musical instruments.' },
  { id: 'hi-2788', target: 'प्रकाश और रोशनी दोनों का अर्थ एक ही है।', english: 'Prakash and roshni both mean the same thing.' },
  { id: 'hi-2822', target: 'शासन और हुकूमत दोनों शब्द सरकार के लिए हैं।', english: 'Both shasan and hukumat are words for government.' },
  { id: 'hi-2865', target: 'अजंता की गुफ़ाओं में भित्ति चित्रण बहुत खूबसूरत है।', english: 'The mural painting in the Ajanta caves is very beautiful.' },
  { id: 'hi-2881', target: 'साहित्य समाज का आईना होता है।', english: 'Literature is the mirror of society.' },
  { id: 'hi-2886', target: 'इस क्षेत्र की लोक कलाएँ बहुत अच्छी हैं।', english: 'The folk arts of this region are very good.' },
  { id: 'hi-2892', target: 'अलगोज़ा राजस्थान का एक दोहरा बाँसुरी वाद्य है।', english: 'Algoza is a double flute instrument from Rajasthan.' },
  { id: 'hi-2897', target: 'गोटा-पत्ती का काम राजस्थानी पोशाक पर होता है।', english: 'Gota-patti work is done on Rajasthani attire.' },
  { id: 'hi-2905', target: 'कबीर ने दोहों में समाज सुधार का संदेश दिया।', english: 'Kabir gave a message of social reform through couplets.' },
  { id: 'hi-2910', target: 'चाँदनी में नहाती हुई नदी बहुत सुंदर लग रही थी।', english: 'The river bathed in moonlight looked very beautiful.' },
  { id: 'hi-2918', target: 'गरीबी एक ऐसी दिक़्क़त है जिसका हल शिक्षा से ही संभव है।', english: 'Poverty is a problem whose solution is possible only through education.' },
  { id: 'hi-2937', target: 'अनीता ने अपने भाषण में राष्ट्रीय एकता की बात की।', english: 'Anita talked about national unity in her speech.' },
  { id: 'hi-2943', target: 'हर नागरिक का फ़र्ज़ है कि वह अपने देश की सेवा करे।', english: 'Every citizen has a duty to serve his country.' },
  { id: 'hi-2967', target: 'दार्शनिक सोच में तर्कशास्त्र का स्थान सबसे ऊँचा है।', english: 'Logic has the highest place in philosophical thinking.' },
  { id: 'hi-2992', target: 'समाजशास्त्र में सामाजिक स्तरीकरण एक मुख्य विषय है।', english: 'Social stratification is a main topic in sociology.' },
  { id: 'hi-3032', target: 'गुड़ी पड़वा मराठी नववर्ष का त्योहार है।', english: 'Gudi Padwa is the Marathi New Year festival.' },
  { id: 'hi-3053', target: 'गुड़ी पड़वा पर महाराष्ट्र में नए साल की शुरुआत होती है।', english: 'On Gudi Padwa, the new year begins in Maharashtra.' },
  { id: 'hi-3059', target: 'कोलकाता में लोग दीवाली का जश्न बहुत धूमधाम से मनाते हैं।', english: 'In Kolkata, people celebrate Diwali with great fanfare.' },
  { id: 'hi-3081', target: 'लोग उगादि आंध्र प्रदेश और कर्नाटक में मनाते हैं।', english: 'People celebrate Ugadi in Andhra Pradesh and Karnataka.' },
  { id: 'hi-3096', target: 'इस दिक़्क़त का हल निकालना ज़रूरी है।', english: 'Finding a solution to this problem is necessary.' },
  { id: 'hi-3145', target: 'लाख की चूड़ियाँ राजस्थान की खासियत हैं।', english: 'Lac bangles are a specialty of Rajasthan.' },
];

const byId = new Map(deck.map(c => [c.id, c]));
let applied = 0, missing = 0, noop = 0;
const diffs = [];
for (const p of BATCH) {
  const card = byId.get(p.id);
  if (!card) { console.warn(`MISSING: ${p.id}`); missing++; continue; }
  if (card.target === p.target && card.english === p.english) {
    console.log(`NOOP:    ${p.id}  (proposed text identical to original)`);
    noop++;
    continue;
  }
  diffs.push({ id: p.id, oldT: card.target, newT: p.target });
  card.target = p.target;
  card.english = p.english;
  applied++;
}
fs.writeFileSync(DECK, JSON.stringify(deck, null, 2) + '\n');
console.log(`\nApplied ${applied}/${BATCH.length}  (missing ${missing}, noop ${noop})`);
