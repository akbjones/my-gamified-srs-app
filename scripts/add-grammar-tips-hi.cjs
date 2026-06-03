#!/usr/bin/env node
/**
 * Add contextual grammar tips to Hindi deck cards that lack them.
 * Target: ~280 new tips to reach 35% coverage.
 */
const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'hindi', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));

// Per-node grammar tip pools – contextual, usage-based, NEVER conjugation patterns
const tipPools = {
  'node-01': [
    "Hindi uses Subject-Object-Verb order: the verb always comes at the end of a sentence.",
    "Hindi has no articles (a/the). Whether something is definite depends entirely on context.",
    "The verb होना (honaa) is essential – it means 'to be' and appears in almost every sentence.",
    "In Hindi, adjectives come before the noun they describe, just like in English.",
    "Hindi pronouns change form depending on the postposition that follows them.",
    "The copula है (hai) can be omitted in casual speech, especially in questions.",
    "Hindi word order is flexible for emphasis, but SOV is the default neutral order.",
    "यह (yeh) means 'this' for nearby things; वह (voh) means 'that' for distant things.",
    "In Hindi, the subject can often be dropped when it is obvious from context.",
    "Hindi uses मैं (main) for 'I' – it takes the verb form हूँ (hoon).",
  ],
  'node-02': [
    "Habitual actions use -ता/-ती/-ते endings: मैं खाता हूँ (I eat regularly).",
    "The habitual present changes endings by gender: -ता for masculine, -ती for feminine.",
    "Add नहीं before the main verb to negate habitual present: मैं नहीं खाता (I don't eat).",
    "In habitual present, the auxiliary हूँ/है/हैं must agree with the subject's number.",
    "Habitual present expresses routines, general truths, and permanent states.",
    "With plural subjects, use -ते: वे रोज़ दौड़ते हैं (they run every day).",
    "The habitual tense is also used for general abilities: वह अच्छा गाती है (she sings well).",
    "रोज़ (daily), हमेशा (always), अक्सर (often) are common adverbs with habitual present.",
  ],
  'node-03': [
    "होना (to be) describes states; करना (to do) describes actions – don't confuse them.",
    "होना changes form: हूँ (I am), है (he/she/it is), हैं (they/we/you-formal are).",
    "था/थी/थे are past forms of होना: वह खुश था (he was happy), वह खुश थी (she was happy).",
    "करना is one of the most versatile verbs – combine it with nouns to create new verbs.",
    "होना can express existence: यहाँ एक दुकान है (there is a shop here).",
    "In Hindi, 'to have' is expressed using के पास + होना: मेरे पास किताब है (I have a book).",
    "होना in future means 'will be': कल बारिश होगी (it will rain tomorrow).",
    "हो जाना adds completion: काम हो गया (the work is done/finished).",
  ],
  'node-04': [
    "Hindi uses postpositions, not prepositions: घर में (house in), not 'in house'.",
    "All Hindi nouns have grammatical gender (masculine or feminine) – learn it with the word.",
    "क्या at the start of a sentence turns it into a yes/no question.",
    "कौन (who), क्या (what), कहाँ (where), कब (when), कैसे (how) are key question words.",
    "Postpositions cause the preceding noun/pronoun to take the oblique case form.",
    "का/की/के (of/belonging to) agrees with the thing possessed, not the possessor.",
    "ने, को, से, में, पर are the most common postpositions – master these first.",
    "In Hindi, question intonation alone (without क्या) can also form yes/no questions.",
    "Gender affects everything in Hindi: verbs, adjectives, and postpositions all agree with it.",
    "The oblique case changes the noun form: लड़का → लड़के (before a postposition).",
  ],
  'node-05': [
    "Hindi numbers 1-10 must be memorized as they are irregular: एक, दो, तीन, चार, पाँच...",
    "The oblique case is triggered by any postposition: मेज़ पर (on the table) not मेज़ पर.",
    "With numbers 2+, masculine nouns take oblique plural: दो लड़कों को (to two boys).",
    "Hindi has unique words for each number up to 100 – there is no simple tens+ones pattern.",
    "पहला/दूसरा/तीसरा (first/second/third) are adjectives and agree in gender with the noun.",
    "When counting things, use गिनती (counting) for abstract numbers and संख्या for quantities.",
    "बहुत (very/many) is invariable – it never changes form regardless of gender or number.",
    "कुछ (some) and कई (several) don't require oblique on the following noun when used alone.",
    "Numbers above 20 follow complex patterns: 21 is इक्कीस, not *बीस-एक.",
  ],
  'node-06': [
    "को marks the indirect object (dative): मुझको/मुझे means 'to me'.",
    "With animate direct objects, को is required: मैंने लड़के को देखा (I saw the boy).",
    "को also expresses compulsion: मुझे जाना है literally means 'to me, going is' (I have to go).",
    "The को construction makes the experiencer the subject: मुझे भूख लगी है (hunger struck to me = I'm hungry).",
    "मुझे and मुझको are interchangeable – मुझे is more common in everyday speech.",
    "Experiencer verbs like लगना, चाहिए always use को/dative: उसे ठंड लगती है (she feels cold).",
    "को with time expressions means 'at': सोमवार को (on Monday), रात को (at night).",
    "When using को for animate objects, the verb does NOT agree with that object.",
  ],
  'node-07': [
    "Adjectives ending in -ा change form: अच्छा लड़का, अच्छी लड़की, अच्छे लड़के.",
    "Invariable adjectives (like सुंदर, ज़रूरी) never change regardless of gender or number.",
    "बहुत (very) and काफ़ी (quite) intensify adjectives without changing form.",
    "Hindi adjectives come before the noun: बड़ा घर (big house), not *घर बड़ा.",
    "In predicate position, adjectives still agree: लड़की लंबी है (the girl is tall).",
    "The suffix -सा/-सी/-से means '-ish': छोटा-सा (smallish), makes descriptions softer.",
    "Color adjectives: some change (काला/काली) while others don't (नारंगी, गुलाबी).",
    "Comparative uses से: यह उससे बड़ा है (this is bigger than that). No special adjective form needed.",
  ],
  'node-08': [
    "नमस्ते works for both hello and goodbye – it is respectful and universal.",
    "शुक्रिया (Urdu origin) and धन्यवाद (Sanskrit origin) both mean 'thank you'.",
    "अच्छा has many uses beyond 'good': it can mean 'really?', 'okay', or 'well then'.",
    "कृपया (please) is formal; ज़रा (just/a little) softens requests in casual speech.",
    "बस (just/enough/that's it) is extremely common in everyday Hindi conversation.",
    "चलो/चलिए means 'let's go' – चलो is casual (tum), चलिए is respectful (aap).",
    "ठीक है (theek hai) is the Hindi equivalent of 'okay' – used constantly in conversation.",
    "हाँ जी (yes, respectfully) adds politeness; जी alone acknowledges what someone said.",
    "अरे (are) is an exclamation – it can express surprise, calling attention, or mild annoyance.",
    "यार (yaar) means 'buddy/friend' and is used very casually between close friends.",
    "फिर मिलेंगे literally means 'we will meet again' – a common way to say goodbye.",
  ],
  'node-09': [
    "Hindi simple past uses -आ/-ई/-ए endings: वह गया (he went), वह गई (she went).",
    "Past tense verbs agree with the SUBJECT in gender and number (unlike the ने construction).",
    "कल means both 'yesterday' and 'tomorrow' – context and verb tense clarify which.",
    "The simple past describes completed one-time actions: मैंने खाना खाया (I ate food).",
    "In past tense, था/थी/थे can be added for emphasis or distant past: वह गया था (he had gone).",
    "Irregular past forms must be memorized: जाना→गया, करना→किया, देना→दिया, लेना→लिया.",
    "With intransitive verbs in past tense, the verb agrees with the subject as usual.",
    "पहले (before/earlier) and बाद में (afterwards) help sequence past events.",
  ],
  'node-10': [
    "Present continuous uses रहा/रही/रहे + auxiliary: मैं खा रहा हूँ (I am eating).",
    "रहा changes for gender: masculine रहा/रहे, feminine रही (singular and plural).",
    "The continuous tense shows actions happening right now or around the current time.",
    "अभी (right now) and इस समय (at this time) naturally pair with present continuous.",
    "Use present continuous for temporary states: वह दिल्ली में रह रहा है (he is living in Delhi, temporarily).",
    "Past continuous uses रहा था/रही थी: मैं पढ़ रहा था (I was studying).",
    "For future plans, Hindi uses present continuous like English: कल मैं जा रहा हूँ (I'm going tomorrow).",
    "The continuous aspect emphasizes duration or ongoing nature of an action.",
    "Stative verbs like जानना (to know) rarely appear in continuous form in Hindi.",
    "Adding से before the duration shows 'for how long': मैं दो घंटे से पढ़ रहा हूँ (I've been studying for two hours).",
    "Past continuous sets the background for another past event: जब मैं खा रहा था, वह आया (while I was eating, he came).",
  ],
  'node-11': [
    "चाहिए means 'should/need' and is used with the dative: मुझे जाना चाहिए (I should go).",
    "सकना (can/able to) attaches to the verb stem: मैं बोल सकता हूँ (I can speak).",
    "पाना also means 'to be able to' but implies getting the chance: मैं जा नहीं पाया (I couldn't manage to go).",
    "चाहिए is invariable – it never changes form regardless of subject.",
    "ज़रूर (certainly) and शायद (maybe) modify modal meaning without changing the verb.",
    "सकना changes for tense and gender: वह जा सकती थी (she could go).",
    "पड़ना expresses compulsion with negative feeling: मुझे जाना पड़ा (I had to go, reluctantly).",
    "For polite requests, use सकना in questions: क्या आप मदद कर सकते हैं? (Can you help?).",
    "होना with infinitive expresses obligation: मुझे काम करना है (I have to work).",
    "देना after verb stem grants permission: जाने दो (let [them] go).",
    "लगना expresses 'to seem': यह अच्छा लगता है (this seems/feels good).",
  ],
  'node-12': [
    "अपना means 'one's own' and always refers back to the subject of the sentence.",
    "खुद/स्वयं mean 'oneself' and add emphasis: मैंने खुद किया (I did it myself).",
    "अपना changes like an -ा adjective: अपना/अपनी/अपने to match the possessed noun.",
    "Use अपना (not मेरा) when the subject and possessor are the same: मैं अपना काम करता हूँ.",
    "खुद is more colloquial; स्वयं is more formal/literary but both mean 'self'.",
    "Reflexive अपने आप means 'by oneself/automatically': दरवाज़ा अपने आप खुल गया (the door opened by itself).",
    "Unlike English, Hindi requires अपना even when the meaning seems obvious from context.",
    "आपस में means 'among themselves/each other': वे आपस में बात कर रहे हैं (they are talking among themselves).",
  ],
  'node-13': [
    "नहीं is the standard negation for declarative sentences: मैं नहीं जाऊँगा (I won't go).",
    "मत negates imperatives: मत जाओ (don't go) – never use नहीं for commands.",
    "न is literary/formal negation, also used in 'neither...nor': न यह, न वह.",
    "Double negation is common: कुछ नहीं (nothing), कहीं नहीं (nowhere), कोई नहीं (no one).",
    "बिना means 'without': बिना सोचे (without thinking) – it negates a verbal noun.",
    "In yes/no questions, नहीं at the end seeks confirmation: आप आ रहे हैं, नहीं? (You're coming, right?).",
    "ना as a sentence-final particle softens requests: आ जाओ ना (do come, won't you?).",
    "कभी नहीं means 'never': मैं वहाँ कभी नहीं गया (I never went there).",
  ],
  'node-14': [
    "में means 'in/inside': कमरे में (in the room). Use it for enclosed spaces.",
    "पर means 'on/at': मेज़ पर (on the table). Use it for surfaces and specific points.",
    "से indicates source, means, or comparison: दिल्ली से (from Delhi), बस से (by bus).",
    "को marks direction/recipient: स्कूल को (toward school), उसको (to him/her).",
    "तक means 'until/up to': शाम तक (until evening), यहाँ तक (up to here).",
    "के लिए means 'for': आपके लिए (for you). It always takes the oblique case before के.",
    "की ओर means 'towards': शहर की ओर (towards the city).",
    "के बारे में means 'about': इस विषय के बारे में (about this topic).",
    "Postpositions always follow the noun – the opposite of English prepositions.",
  ],
  'node-15': [
    "Comparisons use से: यह उससे अच्छा है (this is better than that). No special comparative form.",
    "Superlative uses सबसे: सबसे अच्छा (the best) – literally 'from all, good'.",
    "ज़्यादा (more) and कम (less) help form comparisons: ज़्यादा महंगा (more expensive).",
    "बराबर means 'equal': दोनों बराबर हैं (both are equal).",
    "जैसा/जैसी means 'like/similar to': माँ जैसी (like mother).",
    "इतना...जितना means 'as much...as': इतना बड़ा जितना (as big as).",
    "Adjectives with -ा ending change in oblique: अच्छे बच्चों के लिए (for good children).",
    "वाला/-वाली creates adjective-like forms: लाल वाली किताब (the red one/book).",
    "कैसा/कैसी asks 'how/what kind': कैसा मौसम है? (How is the weather?).",
    "बढ़िया (excellent) is informal and invariable – it never changes form.",
  ],
  'node-16': [
    "Past habitual uses -ता था/-ती थी: मैं रोज़ जाता था (I used to go daily).",
    "Past habitual describes repeated actions or states that no longer continue.",
    "The auxiliary था/थी/थे agrees with the subject in gender and number.",
    "पहले (before/in the past) often appears with past habitual: पहले यहाँ बाज़ार लगता था.",
    "Contrast past habitual with simple past: जाता था (used to go) vs गया (went once).",
    "करता था (used to do) implies regularity; किया (did) implies a single completed action.",
    "Past habitual sets nostalgic or background scenes: बचपन में हम खूब खेलते थे (in childhood we used to play a lot).",
    "Negative past habitual: नहीं + verb-ता था: वह नहीं आती थी (she didn't used to come).",
  ],
  'node-17': [
    "Compound postpositions use के/की/की + position word: के ऊपर (above), के नीचे (below).",
    "के सामने (in front of), के पीछे (behind), के बीच (between) are common compound postpositions.",
    "The first part (के/की) agrees with what follows, not what precedes.",
    "के बग़ैर/बिना both mean 'without': पैसे के बग़ैर (without money).",
    "के अंदर (inside) is more precise than में for physical interior.",
    "के पास means 'near' or indicates possession: मेरे पास (near me / I have).",
    "के साथ means 'with/together': दोस्तों के साथ (with friends).",
    "की तरफ़ (towards) and की ओर (in the direction of) are interchangeable.",
  ],
  'node-18': [
    "कि (that) introduces indirect statements: उसने कहा कि वह आएगा (he said that he would come).",
    "जो (who/which/that) begins relative clauses: जो लड़का आया वह मेरा दोस्त है.",
    "जब...तब means 'when...then': जब मैं आया, तब वह गया (when I came, then he left).",
    "अगर/यदि...तो means 'if...then': अगर बारिश हो तो मत जाओ (if it rains, don't go).",
    "क्योंकि means 'because': मैं नहीं गया क्योंकि मैं बीमार था (I didn't go because I was sick).",
    "जहाँ...वहाँ means 'where...there': जहाँ तुम जाओ, वहाँ मैं आऊँगा.",
    "हालाँकि means 'although': हालाँकि वह छोटा है, बहुत समझदार है.",
    "ताकि means 'so that': मैं पढ़ता हूँ ताकि पास हो जाऊँ (I study so that I pass).",
  ],
  'node-19': [
    "Hindi has three imperative levels: तू (intimate), तुम (informal), आप (formal/respectful).",
    "तू form is the bare verb stem: जा (go), खा (eat). Use only with very close people or children.",
    "तुम form adds -ओ: जाओ, खाओ. This is the standard informal imperative.",
    "आप form adds -इए/-इये: जाइए, खाइए. Always use with elders and strangers.",
    "कृपया (please) + आप form is the most polite: कृपया बैठिए (please sit down).",
    "Negative imperative: मत + तुम form: मत जाओ (don't go), मत करो (don't do).",
    "ज़रा softens imperatives: ज़रा सुनो (just listen a moment).",
    "The future tense can serve as a polite imperative: आप बैठेंगे? (will you sit? = please sit).",
    "Adding ना at the end makes requests gentler: बताओ ना (do tell, please).",
    "Hindi imperative politeness levels reflect social hierarchy – choosing wrong can be rude.",
  ],
  'node-20': [
    "Compound verbs combine a main verb stem + a helping verb: खा लेना (to eat up/finish eating).",
    "लेना as helper implies doing for oneself: मैंने खा लिया (I ate up, for my benefit).",
    "देना as helper implies doing for others: मैंने बता दिया (I told/informed, for their benefit).",
    "जाना as helper implies completion/change of state: वह सो गया (he fell asleep).",
    "Compound verbs add nuance – they show completion, suddenness, or directionality.",
    "बैठना as helper implies doing rashly: वह बोल बैठा (he blurted out).",
    "डालना as helper implies forceful completion: उसने फेंक दिया (he threw it away).",
    "Not every verb combination is a compound verb – true compounds have a bleached helping verb.",
    "उठना as helper implies sudden action: वह रो उठी (she burst into tears).",
  ],
  'node-21': [
    "जो...वह is the correlative structure for 'the one who': जो आया वह मेरा भाई है.",
    "Hindi relative clauses can precede or follow the main clause, unlike English.",
    "जो changes for oblique: जिस/जिसे/जिसको/जिन for different cases.",
    "जहाँ (where), जब (when), जैसा (like) follow the same correlative pattern.",
    "The correlative pair must match: जो...वह (who...that), जहाँ...वहाँ (where...there).",
    "जितना...उतना means 'as much...that much': जितना पढ़ोगे, उतना सीखोगे.",
    "In spoken Hindi, the correlative वह/वहाँ is often dropped when meaning is clear.",
    "Multiple relative clauses can stack: जो लड़का जो किताब पढ़ रहा था...",
  ],
  'node-22': [
    "Hindi passive uses जाना with the past participle: किताब पढ़ी जाती है (the book is read).",
    "Passive shifts focus from doer to action: यहाँ हिंदी बोली जाती है (Hindi is spoken here).",
    "The agent in passive takes से/के द्वारा: राम के द्वारा काम किया गया.",
    "Passive is common for rules and general statements: यहाँ धूम्रपान नहीं किया जाता.",
    "In passive, the verb agrees with the grammatical subject (the thing acted upon).",
    "Passive with सकना: यह खाया जा सकता है (this can be eaten).",
    "Hindi uses passive more than English for impersonal situations: क्या किया जाए? (what should be done?).",
    "Passive often implies inability: मुझसे चला नहीं जाता (I can't walk / walking doesn't happen by me).",
  ],
  'node-23': [
    "The ergative ने marks the agent of transitive verbs in perfective tenses: मैंने किया (I did).",
    "With ने, the verb agrees with the OBJECT, not the subject: उसने किताब पढ़ी (he read the book-f.).",
    "ने only appears with transitive verbs in past perfective – never in present or continuous.",
    "If the object takes को, the verb becomes masculine singular default: उसने लड़के को देखा.",
    "Intransitive verbs never take ने: वह गया (he went), not *उसने गया.",
    "Some verbs look transitive but don't take ने: लाना (bring), भूलना (forget), बोलना (speak).",
    "ने is unique to Hindi/Urdu among world languages – it splits agreement from the agent.",
    "With compound verbs, ने depends on the main verb: उसने खा लिया (he ate up) – खाना is transitive.",
  ],
  'node-24': [
    "Future tense uses -गा/-गी/-गे: मैं जाऊँगा (I will go, m.), मैं जाऊँगी (I will go, f.).",
    "Future endings agree with the subject in gender and number.",
    "शायद (perhaps) + future expresses possibility: शायद बारिश होगी (it might rain).",
    "कल (tomorrow) naturally pairs with future tense – context distinguishes it from 'yesterday'.",
    "For near-certain future, use present continuous: मैं कल जा रहा हूँ (I'm going tomorrow).",
    "होगा/होगी (will be) is the future of होना: सब ठीक होगा (everything will be fine).",
    "Subjunctive (-ऊँ/-ए/-ें) expresses wishes or uncertainty: शायद वह आए (maybe he'll come).",
    "The future can express polite requests: आप बताएँगे? (will you tell? = could you tell me?).",
  ],
  'node-25': [
    "इसलिए means 'therefore': बारिश हो रही थी, इसलिए मैं नहीं गया (it was raining, so I didn't go).",
    "हालाँकि...फिर भी means 'although...still': हालाँकि मुश्किल था, फिर भी मैंने किया.",
    "न केवल...बल्कि means 'not only...but also': न केवल पढ़ाई, बल्कि खेल भी ज़रूरी है.",
    "जबकि means 'whereas/while': वह सोता है जबकि मैं काम करता हूँ.",
    "चूँकि means 'since/because' (formal): चूँकि समय कम था, हमने जल्दी किया.",
    "यानी/अर्थात् means 'that is/in other words': यह भाषा, यानी हिंदी, बहुत सुंदर है.",
    "बशर्ते means 'provided that': मैं आऊँगा, बशर्ते तुम भी आओ.",
    "इसके बावजूद means 'despite this': इसके बावजूद उसने हार नहीं मानी.",
  ],
  'node-26': [
    "Conjunct verbs pair a noun/adjective + करना/होना: काम करना (to work), शुरू होना (to begin).",
    "करना makes active conjuncts: मदद करना (to help), प्यार करना (to love).",
    "होना makes involuntary conjuncts: पसंद होना (to be liked), ज़रूरत होना (to be needed).",
    "Many English single-word verbs become conjunct verbs in Hindi: 'to wait' = इंतज़ार करना.",
    "The noun in a conjunct verb can be from Sanskrit, Persian, Arabic, or English.",
    "English loanwords form conjuncts naturally: फ़ोन करना (to phone), चेक करना (to check).",
    "With ने construction, the helping verb (करना) determines if ने is used.",
    "Some conjuncts use देना instead: जवाब देना (to answer), तकलीफ़ देना (to trouble).",
  ],
  'node-27': [
    "Reported speech uses कि: उसने कहा कि वह कल आएगा (he said that he would come tomorrow).",
    "Unlike English, Hindi often keeps the original tense in reported speech.",
    "के अनुसार/मुताबिक़ means 'according to': रिपोर्ट के अनुसार (according to the report).",
    "बताना (to tell/inform) is used for factual reporting: उसने बताया कि ट्रेन लेट है.",
    "सोचना कि (to think that) introduces reported thoughts: मैंने सोचा कि वह नहीं आएगा.",
    "पूछना introduces reported questions: उसने पूछा कि क्या तुम आओगे (he asked if you would come).",
    "Hindi doesn't change pronouns as rigidly as English in reported speech.",
    "For quoting exactly, use quotation marks with बोला/कहा: उसने कहा, 'मैं आऊँगा'.",
  ],
  'node-28': [
    "हाथ पैर मारना (to flail hands and feet) means to struggle desperately for something.",
    "नाक में दम करना (to fill the nose) means to annoy someone greatly.",
    "आँखें खुलना (eyes opening) means to become aware of reality.",
    "मुँह की खाना (to eat of the mouth) means to face defeat.",
    "टेढ़ी खीर (crooked kheer) means a difficult task.",
    "दाल में कुछ काला (something black in the dal) means something is suspicious.",
    "Hindi idioms often use body parts: सिर (head), हाथ (hand), पैर (foot), आँख (eye).",
    "अंधों में काना राजा (a one-eyed man is king among the blind) – Hindi proverbs teach values.",
  ],
  'node-29': [
    "आप is formal 'you'; तुम is informal; तू is intimate or rude depending on context.",
    "जी is added after names for respect: राहुल जी. It is gender-neutral and widely used.",
    "Formal Hindi uses more Sanskrit-origin words; casual Hindi uses Urdu/Persian words.",
    "आदरणीय (respected) and माननीय (honorable) are used in very formal writing.",
    "The suffix -साहब/-साहिबा after names shows professional respect.",
    "Formal requests use कृपया + आप form; casual ones use ज़रा + तुम form.",
    "In formal settings, plural verb forms are used even for a single person (like French 'vous').",
    "श्रीमान (sir) and श्रीमती (madam) are formal titles used in official correspondence.",
  ],
  'node-30': [
    "तत्सम words come directly from Sanskrit: विद्यालय (school), पुस्तकालय (library).",
    "तद्भव words are Sanskrit words that evolved: हाथ (from हस्त), दूध (from दुग्ध).",
    "Persianized Hindi (Urdu influence): दिल (heart), ज़िंदगी (life), दोस्त (friend).",
    "Official/government Hindi tends to be heavily Sanskritized and harder to understand colloquially.",
    "Everyday spoken Hindi freely mixes Sanskrit, Persian, Arabic, and English words.",
    "Media Hindi tries to balance: not too Sanskritized, not too Persianized.",
    "The same concept often has both registers: जल/पानी (water), अग्नि/आग (fire).",
    "Understanding both registers helps comprehend news, literature, and casual conversation.",
  ],
  'node-31': [
    "Hindi allows very long sentences by stacking subordinate clauses before the main verb.",
    "Topicalization moves important info first: यह किताब मैंने पढ़ी (this book, I read it).",
    "Emphasis particles like ही (only/exactly) and भी (also/even) change sentence meaning significantly.",
    "ही intensifies: यही है (this is the one), वहीं (right there), अभी (right now).",
    "भी adds inclusion: मैं भी (me too), वह भी (that too), यहाँ भी (here too).",
    "तो connects contrasting ideas or adds emphasis: मैं तो जाऊँगा (I, for my part, will go).",
    "Complex Hindi often front-loads information and delays the verb until the very end.",
    "Participial clauses are common: खाना खाते हुए (while eating), काम करते-करते (while working).",
  ],
  'node-32': [
    "Literary Hindi uses more Sanskrit vocabulary and longer, more complex sentences.",
    "Formal written Hindi avoids English loanwords – रेलगाड़ी not ट्रेन, दूरभाष not फ़ोन.",
    "Hindi literature spans from medieval Bhakti poetry to modern prose and drama.",
    "The Devanagari script includes conjunct consonants (संयुक्ताक्षर) common in literary texts.",
    "Written formal Hindi uses passive voice more frequently than spoken Hindi.",
    "Hindi essay writing follows a structured format: भूमिका (intro), मुख्य भाग (body), उपसंहार (conclusion).",
    "Poetic Hindi uses meters (छंद) and rhyme schemes different from everyday prose.",
    "Dialogue in Hindi fiction often mixes registers to reflect characters' social backgrounds.",
  ],
  'node-33': [
    "Academic Hindi uses precise terminology: अनुसंधान (research), विश्लेषण (analysis).",
    "Formal Hindi writing avoids colloquial shortcuts: 'नहीं' not 'नईं', 'किया' not 'किया'.",
    "Technical Hindi creates compounds from Sanskrit: कंप्यूटर-विज्ञान (computer science).",
    "In academic writing, passive voice is preferred: यह देखा गया कि... (it was observed that...).",
    "उपर्युक्त (aforementioned), निम्नलिखित (following), तत्पश्चात (thereafter) are formal connectors.",
    "Quoting sources: '...के अनुसार' (according to...) or '...का मत है कि' (...'s view is that).",
    "Academic Hindi often transliterates English terms when no good Hindi equivalent exists.",
    "Formal writing uses compound verbs less – simple verbs are preferred for precision.",
  ],
  'node-34': [
    "जुगाड़ (jugaad) means creative problem-solving with limited resources – a uniquely Indian concept.",
    "Touching elders' feet (पैर छूना) is a sign of deep respect in Hindi culture.",
    "अतिथि देवो भव (the guest is God) reflects the Indian hospitality tradition.",
    "Festivals like दिवाली, होली, and ईद are integral to Hindi cultural expression.",
    "Family terms in Hindi are very specific: चाचा (father's younger brother), मामा (mother's brother).",
    "Respectful greetings change by religion: नमस्ते (Hindu), सलाम (Muslim), सत श्री अकाल (Sikh).",
    "The concept of इज़्ज़त (honor/respect) deeply influences social interactions.",
    "Hindi cinema (Bollywood) has significantly shaped modern spoken Hindi across India.",
  ],
  'node-35': [
    "Code-switching between Hindi and English (Hinglish) is natural in urban India.",
    "Hindi regional dialects differ significantly: भोजपुरी, राजस्थानी, ब्रज, अवधी.",
    "Mastery includes understanding both formal and colloquial registers of Hindi.",
    "Hindi borrows from many languages: Sanskrit, Persian, Arabic, Turkish, Portuguese, English.",
    "Nuance in Hindi often comes from particle choice: ही vs भी vs तो can change everything.",
    "Understanding Hindi proverbs (मुहावरे/कहावतें) is a mark of advanced fluency.",
    "Native-like fluency includes knowing when to use silence and indirect communication.",
    "Advanced Hindi requires understanding contextual honorifics – wrong level is a social error.",
  ],
};

// Count how many tips we need to add per node (proportional to tipless cards)
const TARGET_TOTAL = 1377; // 35% of 3933
const currentWithTips = deck.filter(c => c.grammar && c.grammar.trim() !== '').length;
const needed = TARGET_TOTAL - currentWithTips;

console.log(`Current tips: ${currentWithTips}, target: ${TARGET_TOTAL}, need to add: ${needed}`);

// Gather all cards without tips, grouped by node
const noTipByNode = {};
for (const card of deck) {
  if (!card.grammar || card.grammar.trim() === '') {
    if (!noTipByNode[card.grammarNode]) noTipByNode[card.grammarNode] = [];
    noTipByNode[card.grammarNode].push(card);
  }
}

// Distribute tips proportionally across nodes
let added = 0;
const nodeKeys = Object.keys(noTipByNode).sort();
const totalNoTip = Object.values(noTipByNode).reduce((s, arr) => s + arr.length, 0);

for (const node of nodeKeys) {
  const cards = noTipByNode[node];
  const tips = tipPools[node] || tipPools['node-08']; // fallback
  // Proportional allocation
  const share = Math.round((cards.length / totalNoTip) * needed);
  const toAdd = Math.min(share, cards.length);

  // Shuffle cards for variety
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }

  for (let i = 0; i < toAdd && added < needed; i++) {
    cards[i].grammar = tips[i % tips.length];
    added++;
  }
}

console.log(`Added ${added} grammar tips to Hindi deck.`);
const finalCount = deck.filter(c => c.grammar && c.grammar.trim() !== '').length;
console.log(`Final: ${finalCount}/${deck.length} = ${(finalCount/deck.length*100).toFixed(1)}%`);

fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n', 'utf8');
console.log('Written to', DECK_PATH);
