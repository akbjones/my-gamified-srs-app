/**
 * Batch 3 — 60 additional rewrites discovered by fresh strict-rule agents
 * working on chunks not fully covered by batches 1-2. Most are from the
 * academic/research-essay block (2641-3170) and early-deck high-formal
 * adjectives (0-528).
 */
const fs = require('fs');
const path = require('path');

const DECK = path.resolve(__dirname, '..', 'src', 'data', 'hindi', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK, 'utf8'));

const BATCH = [
  // Chunk A: 0-528
  {id: 'hi-0026', target: 'शहद चीनी से सेहत के लिए बेहतर होता है।', english: 'Honey is healthier than sugar.'},
  {id: 'hi-0037', target: 'क्या आपको कोई सेहत संबंधी परेशानी है?', english: 'Do you have any health-related problem?'},
  {id: 'hi-0094', target: 'मेरे दादाजी सुबह-सवेरे टहलने जाते हैं।', english: 'My grandfather goes for a walk early in the morning.'},
  {id: 'hi-0097', target: 'मेरा बेटा रोज़ सुबह-शाम पढ़ाई करता है।', english: 'My son studies every morning and evening.'},
  {id: 'hi-0105', target: 'क्या तुम्हारे पिताजी अभी भी नौकरी करते हैं?', english: 'Does your father still work?'},
  {id: 'hi-0109', target: 'मेरा छोटा भाई हमेशा सबको हँसाता रहता है।', english: 'My little brother always makes everyone laugh.'},
  {id: 'hi-0186', target: 'मुझे हिंदी बोलने में अभी थोड़ी मुश्किल होती है।', english: 'I still have a little difficulty speaking Hindi.'},
  {id: 'hi-0200', target: 'वह पूरी कक्षा में सबसे तेज़ और होशियार छात्र है।', english: 'He is the sharpest and smartest student in the whole class.'},
  {id: 'hi-0223', target: 'वह बहुत धीरज से हर मुश्किल का सामना करता है।', english: 'He faces every difficulty with great patience.'},
  {id: 'hi-0288', target: 'मेरी छोटी बहन की आवाज़ बहुत मीठी है।', english: "My younger sister's voice is very sweet."},
  {id: 'hi-0318', target: 'मेरी बेटी की गुलाबी फ़्रॉक बहुत सुंदर है।', english: "My daughter's pink frock is very pretty."},
  {id: 'hi-0350', target: 'सत्तर प्रतिशत छात्र पास हुए।', english: 'Seventy percent of the students passed.'},
  {id: 'hi-0407', target: 'इस किताब की क़ीमत तीन सौ रुपये है।', english: 'The price of this book is three hundred rupees.'},
  {id: 'hi-0409', target: 'अस्सी प्रतिशत छात्र इस परीक्षा में पास हुए।', english: 'Eighty percent of students passed this exam.'},
  {id: 'hi-0434', target: 'एक साल में तीन सौ पैंसठ दिन होते हैं।', english: 'There are three hundred sixty-five days in a year.'},
  // Chunk E: 2113-2640
  {id: 'hi-2239', target: 'मेरी बीवी ने नई रेसिपी से बहुत लजीज पास्ता बनाया।', english: 'My wife made delicious pasta from a new recipe.'},
  {id: 'hi-2347', target: 'सरकार नई स्कीम लागू करेगी।', english: 'The government will roll out a new scheme.'},
  {id: 'hi-2408', target: 'क्योंकि बजट कम था, इसलिए छोटा घर चुना।', english: 'Because the budget was tight, we chose a small house.'},
  {id: 'hi-2439', target: 'क्योंकि पूजा अनुभवी है, इसलिए उसे यह काम दिया गया।', english: 'Because Pooja is experienced, she was given this work.'},
  {id: 'hi-2440', target: 'क्योंकि अमित अनुभवी है, इसलिए उसे यह काम दिया गया।', english: 'Because Amit is experienced, he was given this work.'},
  {id: 'hi-2441', target: 'क्योंकि नीता अनुभवी है, इसलिए उसे यह काम दिया गया।', english: 'Because Neeta is experienced, she was given this work.'},
  {id: 'hi-2442', target: 'क्योंकि मनीष अनुभवी है, इसलिए उसे यह काम दिया गया।', english: 'Because Manish is experienced, he was given this work.'},
  {id: 'hi-2458', target: 'क्योंकि बिजली कटी हुई थी, बच्चे मोमबत्ती की रोशनी में पढ़ रहे थे।', english: 'Because the power was out, the children were studying by candlelight.'},
  {id: 'hi-2597', target: 'दिव्या के हिसाब से यह योजना कामयाब होगी।', english: 'According to Divya, this plan will succeed.'},
  // Chunk F: 2641-3170 (academic/research block)
  {id: 'hi-2895', target: 'पुरानी किताबों में बहुत से राज़ छिपे होते हैं।', english: 'Many mysteries are hidden in old texts.'},
  {id: 'hi-2902', target: 'मीरा बाई के गीत आज भी लोग गाते हैं।', english: "People still sing Meera Bai's songs today."},
  {id: 'hi-2907', target: 'साफ़ पानी में चाँद की परछाई चमक रही थी।', english: 'The reflection of the moon was shimmering in the clear water.'},
  {id: 'hi-2908', target: 'चाँद की ठंडी किरणें तालाब पर पड़ रही थीं।', english: 'The cool rays of the moon were falling on the pond.'},
  {id: 'hi-2911', target: 'तालाब में कमल के फूल खिल रहे थे और बहुत खूबसूरत लग रहे थे।', english: 'Lotus flowers were blooming beautifully in the pond.'},
  {id: 'hi-2916', target: 'हवा के झोंकों से पेड़ों की शाखाएँ झूम रही थीं।', english: 'The branches of the trees were swaying in the gusts of wind.'},
  {id: 'hi-2934', target: 'लखनऊ की पुरानी संस्कृति बहुत अमीर और गौरवशाली है।', english: 'The old culture of Lucknow is rich and glorious.'},
  {id: 'hi-2949', target: 'नियम और अमल में फ़र्क़ समझो।', english: 'Understand the difference between theory and practice.'},
  {id: 'hi-2951', target: 'रिसर्च का तरीक़ा वैज्ञानिक होना चाहिए।', english: 'The research method should be scientific.'},
  {id: 'hi-2956', target: 'भाषा विज्ञान में ध्वनि-विज्ञान की स्टडी बुनियादी है।', english: 'The study of phonology is fundamental in linguistics.'},
  {id: 'hi-2957', target: 'छात्रों ने लाइब्रेरी में रिसर्च का सामान ढूँढा।', english: 'The students searched for research material in the library.'},
  {id: 'hi-2958', target: 'अनुमान की जाँच प्रयोग से की गई।', english: 'The hypothesis was tested through experiment.'},
  {id: 'hi-2959', target: 'ढाल और तलवार से लड़ाई पुराने ज़माने की थी।', english: 'Shield and sword combat belonged to old times.'},
  {id: 'hi-2963', target: 'रिसर्चर ने रिसर्च में नतीजा पेश किया।', english: 'The researcher presented the conclusion in the research.'},
  {id: 'hi-2964', target: 'संभावना का नियम आँकड़ों की बुनियादी धारणा है।', english: 'Probability theory is a fundamental concept of statistics.'},
  {id: 'hi-2968', target: 'ग्राहक के रवैये की स्टडी बिक्री में ज़रूरी है।', english: 'The study of consumer behavior is essential in sales.'},
  {id: 'hi-2973', target: 'आबादी के आँकड़े नीति बनाने में मदद करते हैं।', english: 'Demographic data helps in making policy.'},
  {id: 'hi-2975', target: 'रिसर्च के निष्कर्ष का सारांश छोटा और साफ़ होना चाहिए।', english: 'The research conclusion summary should be brief and clear.'},
  {id: 'hi-2977', target: 'रीता ने अपनी रिसर्च में नया अनुमान पेश किया।', english: 'Rita presented a new hypothesis in her research.'},
  {id: 'hi-2978', target: 'सुरेश ने अपनी रिसर्च में नया अनुमान पेश किया।', english: 'Suresh presented a new hypothesis in his research.'},
  {id: 'hi-2980', target: 'इस नियम की पुष्टि प्रयोग के डेटा से होती है।', english: 'This theory is confirmed by experimental data.'},
  {id: 'hi-2983', target: 'इस स्टडी के हिसाब से शिक्षा का स्तर बढ़ रहा है।', english: 'According to this study, the level of education is rising.'},
  {id: 'hi-2987', target: 'शायद इस समस्या का हल नई तकनीक से हो सकता है।', english: 'Perhaps the solution to this problem can come through new technology.'},
  {id: 'hi-2989', target: 'भूगोल में जलवायु परिवर्तन का असर गहन स्टडी का विषय है।', english: 'The impact of climate change is a subject of deep study in geography.'},
  {id: 'hi-2990', target: 'तुलनात्मक स्टडी में दो या अधिक चीज़ों की तुलना की जाती है।', english: 'In a comparative study, two or more variables are compared.'},
  {id: 'hi-2994', target: 'भाषा सीखने का नियम भाषा विज्ञान का मुख्य विषय है।', english: 'Language acquisition theory is a major topic in linguistics.'},
  {id: 'hi-3001', target: 'रिसर्च में पूर्वाग्रह से बचना रिसर्चर की ज़िम्मेदारी है।', english: "Avoiding bias in research is the researcher's responsibility."},
  {id: 'hi-3003', target: 'साहित्य की समीक्षा में अलग-अलग सोच का विश्लेषण ज़रूरी है।', english: 'Analyzing different perspectives is essential in literary review.'},
  {id: 'hi-3004', target: 'क्वालिटेटिव रिसर्च में इंटरव्यू और ऑब्ज़र्वेशन मुख्य तरीके हैं।', english: 'Interviews and observation are the main methods in qualitative research.'},
  {id: 'hi-3005', target: 'तुलनात्मक साहित्य में अनुवाद की स्टडी एक नया क्षेत्र है।', english: 'Translation studies is an emerging field in comparative literature.'},
  {id: 'hi-3007', target: 'मनोविज्ञान में प्रयोग करके परखने का तरीक़ा सबसे भरोसेमंद माना जाता है।', english: 'In psychology, the experimental method is considered the most reliable.'},
  {id: 'hi-3009', target: 'ऐतिहासिक दस्तावेज़ों से पुरानी सभ्यताओं के बारे में पता चलता है।', english: 'Historical records tell us about ancient civilizations.'},
  {id: 'hi-3010', target: 'अनुमान की जाँच प्रयोग करके करना ठीक है।', english: 'It is best to test a hypothesis through experiment.'},
  {id: 'hi-3012', target: 'सामाजिक विज्ञान में सवाल-जवाब के ज़रिए डेटा इकट्ठा किया जाता है।', english: 'In social science, data is collected through questionnaires.'},
  {id: 'hi-3013', target: 'स्कूल की रिसर्च में डेटा की सच्चाई पक्की करना ज़रूरी है।', english: 'In educational research, ensuring the accuracy of data is essential.'},
  {id: 'hi-3157', target: 'ताँबे के सिक्के पुराने ज़माने से चलन में हैं।', english: 'Copper coins have been in use since ancient times.'},
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
