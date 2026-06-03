#!/usr/bin/env node
/**
 * Add grammar tips to Hindi deck cards that are missing them.
 * Tips are contextual – they relate to grammar, vocabulary, or cultural context
 * visible in the card's target sentence.
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'hindi', 'deck.json');

const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
const cards = Array.isArray(deck) ? deck : Object.values(deck);

// ── Pattern-based tip generators ──────────────────────────────────────────
// Each function checks if the card's target/english match a pattern and returns a tip or null.

function tipForPostpositions(t, e) {
  if (t.includes(' में ') && !t.includes('में से'))
    return 'में = in/inside – a postposition that follows the noun: घर में (in the house).';
  if (t.includes(' पर ') && !e.toLowerCase().includes('but'))
    return 'पर = on/at – a postposition: मेज़ पर (on the table), स्टेशन पर (at the station).';
  if (/ से /.test(t) && (e.includes('from') || e.includes('since') || e.includes('with') || e.includes('than'))) {
    if (e.includes('than')) return 'से after a noun means "than" in comparisons: मुझसे बड़ा = bigger than me.';
    if (e.includes('since') || e.includes(' for ')) return 'से can mark the starting point in time: सुबह से = since morning.';
    return 'से = from/by/with – a versatile postposition marking source, instrument, or comparison.';
  }
  if (/ के लिए/.test(t) || / के लिये/.test(t))
    return 'के लिए = for (purpose/benefit). It is a compound postposition that follows the noun.';
  if (/ की ओर/.test(t))
    return 'की ओर = towards – a compound postposition: स्कूल की ओर (towards school).';
  if (/ के बारे में/.test(t))
    return 'के बारे में = about – a compound postposition: इस के बारे में (about this).';
  if (/ के साथ/.test(t))
    return 'के साथ = with (accompaniment): दोस्तों के साथ = with friends.';
  if (/ के बाद/.test(t))
    return 'के बाद = after: खाने के बाद = after eating.';
  if (/ के पहले/.test(t) || / से पहले/.test(t))
    return 'से पहले = before: सोने से पहले = before sleeping.';
  if (/ तक /.test(t) || / तक$/.test(t.trim()))
    return 'तक = until/up to – marks a limit in time or space: शाम तक = until evening.';
  if (/ के बीच/.test(t))
    return 'के बीच = between/among: दोनों के बीच = between the two.';
  if (/ के ऊपर/.test(t))
    return 'के ऊपर = above/on top of – a compound postposition.';
  if (/ के नीचे/.test(t))
    return 'के नीचे = below/under – a compound postposition.';
  if (/ के पास/.test(t))
    return 'के पास = near/have – also used for possession: मेरे पास किताब है (I have a book).';
  if (/ के बिना/.test(t) || /बिना /.test(t))
    return 'बिना = without. It can precede or follow the noun: बिना पानी / पानी के बिना.';
  return null;
}

function tipForNe(t, e) {
  // Must match ने as a standalone postposition, not inside words like कितने, महीने
  if (/(?:^|[\s।,])ने\s/.test(t) || /ने\s/.test(t) && / ने /.test(t)) {
    // Verify it's actually the ergative ने (standalone word)
    const words = t.split(/[\s।,]+/);
    if (!words.includes('ने')) return null;
    if (e.includes('had ') || e.includes(' had'))
      return 'ने marks the agent in perfective transitive sentences. The verb agrees with the object, not the subject.';
    return 'ने is the ergative marker – used with transitive verbs in past tense. The verb agrees with the object\'s gender/number.';
  }
  return null;
}

function tipForKo(t, e) {
  if (/ को /.test(t)) {
    if (e.includes('have to') || e.includes('must') || e.includes('need'))
      return 'को with a subject + infinitive expresses obligation: मुझको जाना है = I have to go.';
    if (e.includes(' to ') && (e.includes('tell') || e.includes('give') || e.includes('show') || e.includes('teach')))
      return 'को marks the indirect object (recipient): बच्चे को = to the child.';
    return 'को marks the direct object when it is specific/animate, or the indirect object (dative).';
  }
  return null;
}

function tipForTense(t, e) {
  // Present continuous
  if (/ रहा है/.test(t) || / रही है/.test(t) || / रहे हैं/.test(t) || / रहा हूँ/.test(t) || / रही हूँ/.test(t)) {
    if (/ रहा हूँ/.test(t)) return 'रहा हूँ = present continuous for masculine "I". Feminine: रही हूँ.';
    if (/ रही हूँ/.test(t)) return 'रही हूँ = present continuous for feminine "I". Masculine: रहा हूँ.';
    if (/ रहा है/.test(t)) return 'रहा है = present continuous for masculine singular third person.';
    if (/ रही है/.test(t)) return 'रही है = present continuous for feminine singular. The auxiliary agrees with subject gender.';
    if (/ रहे हैं/.test(t)) return 'रहे हैं = present continuous for plural or respectful subjects.';
  }
  // Past habitual
  if (/ करता था/.test(t) || / करती थी/.test(t) || / करते थे/.test(t) ||
      / जाता था/.test(t) || / जाती थी/.test(t) || / जाते थे/.test(t) ||
      /ता था/.test(t) || /ती थी/.test(t) || /ते थे/.test(t)) {
    return 'The -ता था/-ती थी/-ते थे form expresses past habitual – "used to do."';
  }
  // Future
  if (/ेगा/.test(t) || /ेगी/.test(t) || /ेंगे/.test(t) || /ूँगा/.test(t) || /ूँगी/.test(t)) {
    if (/ूँगा/.test(t)) return '-ऊँगा/-ऊँगी = future "I will." Gender of speaker determines the ending.';
    if (/ूँगी/.test(t)) return '-ऊँगी = future "I will" (feminine speaker). Masculine: -ऊँगा.';
    if (/ेंगे/.test(t)) return '-एँगे/-एँगी = future plural/respectful. The ending agrees with subject gender and number.';
    return 'Hindi future tense adds -एगा (m.)/-एगी (f.) to the verb stem.';
  }
  // Imperative
  if (/िए/.test(t) || /ीजिए/.test(t) || /ीजिये/.test(t)) {
    if (t.includes('कृपया') || t.includes('कृप्या'))
      return 'कृपया + verb-इए is the polite imperative: कृपया बैठिए = please sit.';
    if (/आइए/.test(t) || /आइये/.test(t))
      return 'आइए = please come – the polite imperative of आना.';
    return 'The -इए/-इये ending is the respectful imperative, used with आप.';
  }
  if (/ो$/.test(t.trim()) && e.toLowerCase().match(/^(come|go|sit|eat|tell|do|see|hear|take|bring)/))
    return 'The -ओ ending is the informal imperative (तुम level): जाओ, खाओ, बोलो.';
  return null;
}

function tipForWala(t, e) {
  if (/वाला/.test(t) || /वाली/.test(t) || /वाले/.test(t)) {
    return 'वाला/वाली/वाले turns nouns or verbs into "one who does/has": दूधवाला = milkman, जानेवाला = one who goes.';
  }
  return null;
}

function tipForNahiNa(t, e) {
  if (/ नहीं /.test(t) || / नहीं$/.test(t.trim())) {
    if (/ता नहीं/.test(t) || /ती नहीं/.test(t))
      return 'In habitual negative, नहीं comes before the auxiliary: वह नहीं जाता or जाता नहीं (less common).';
    return 'नहीं negates verbs. It usually comes right before the verb: मैं नहीं जाऊँगा (I won\'t go).';
  }
  if (/ न /.test(t) && (e.includes('neither') || e.includes('nor') || e.includes('don\'t') || e.includes('not')))
    return 'न is the literary/formal negative, often in pairs: न यह, न वह (neither this nor that).';
  if (/ मत /.test(t))
    return 'मत is the negative imperative – "don\'t": मत जाओ (don\'t go), मत करो (don\'t do it).';
  return null;
}

function tipForQuestion(t, e) {
  if (/^क्या /.test(t) && e.includes('?'))
    return 'क्या at the start of a sentence turns a statement into a yes/no question.';
  if (/कहाँ/.test(t))
    return 'कहाँ = where. Hindi question words stay in their normal position, unlike English inversion.';
  if (/कब /.test(t) || /कब\?/.test(t))
    return 'कब = when. Question words in Hindi stay in situ – no word-order change needed.';
  if (/कैसे /.test(t) || /कैसा /.test(t) || /कैसी /.test(t))
    return 'कैसा/कैसी/कैसे = how/what kind – agrees with the noun\'s gender and number.';
  if (/कौन /.test(t) || /किसने/.test(t))
    return 'कौन = who (direct), किसने = who (ergative, with ने in past tense).';
  if (/कितन/.test(t))
    return 'कितना/कितनी/कितने = how much/many – agrees with the noun\'s gender and number.';
  if (/क्यों/.test(t))
    return 'क्यों = why. Like other question words, it stays in its natural position in the sentence.';
  return null;
}

function tipForCompound(t, e) {
  if (/ सकत/.test(t))
    return 'सकना = can/be able to. It follows the main verb stem: जा सकता हूँ = I can go.';
  if (/ चुक/.test(t))
    return 'चुकना = to have already done: खा चुका = has already eaten. Emphasizes completion.';
  if (/ लगा/.test(t) && (e.includes('start') || e.includes('began')))
    return 'लगना after a verb infinitive = to begin: बारिश होने लगी = it began to rain.';
  if (/ देता/.test(t) || / देती/.test(t) || / दिया/.test(t) || / दी /.test(t)) {
    if (e.includes('let') || e.includes('allow'))
      return 'देना as a compound verb implies doing for someone else\'s benefit: जाने दो = let (him) go.';
  }
  if (/ लेता/.test(t) || / लेती/.test(t) || / लिया/.test(t) || / ली /.test(t)) {
    if (/ ले लि/.test(t) || / ले ली/.test(t))
      return 'लेना as a compound verb implies doing for one\'s own benefit: मैंने ले लिया = I took (for myself).';
  }
  if (/ पड़/.test(t) && (e.includes('have to') || e.includes('had to')))
    return 'पड़ना expresses compulsion/necessity: मुझे जाना पड़ा = I had to go.';
  return null;
}

function tipForChahiye(t, e) {
  if (/चाहिए/.test(t) || /चाहिये/.test(t)) {
    if (e.includes('should') || e.includes('ought'))
      return 'चाहिए = should/ought to. The experiencer takes को: मुझे जाना चाहिए = I should go.';
    if (e.includes('want') || e.includes('need'))
      return 'चाहिए = is needed/wanted. को + noun + चाहिए: मुझे पानी चाहिए = I need water.';
    return 'चाहिए expresses "should" or "is needed." The subject takes को: मुझे चाहिए = I need.';
  }
  return null;
}

function tipForHona(t, e) {
  if (/ होता है/.test(t) || / होती है/.test(t) || / होते हैं/.test(t))
    return 'होता/होती/होते है = expresses general truths or habitual states – "tends to be" rather than "is right now."';
  if (/ हो जा/.test(t) || / हो गय/.test(t) || / हो गई/.test(t))
    return 'हो जाना = to become (change of state): ठीक हो गया = got better, बंद हो गया = got closed.';
  return null;
}

function tipForPossessive(t, e) {
  if (/^मेरा /.test(t) && !t.includes('मेरी') && !t.includes('मेरे'))
    return 'मेरा agrees with a masculine singular possessed noun: मेरा घर (my house).';
  if (/^मेरी /.test(t))
    return 'मेरी agrees with a feminine possessed noun: मेरी किताब (my book).';
  if (/^मेरे /.test(t))
    return 'मेरे agrees with masculine plural or oblique: मेरे दोस्त (my friends).';
  if (/ का /.test(t) && !/ का मौसम/.test(t) && !/ का खाना/.test(t)) {
    if (Math.random() < 0.5)
      return 'का/की/के = possession marker (like \'s). It agrees with the possessed noun: लड़के का घर, लड़के की किताब.';
  }
  if (/अपन/.test(t))
    return 'अपना/अपनी/अपने = reflexive possessive – always refers back to the subject: मैं अपना काम करता हूँ.';
  return null;
}

function tipForGender(t, e) {
  // Detect adjective agreement
  if (/बड़ा /.test(t))
    return 'बड़ा (big) is a -ा adjective: बड़ा (m. sg.), बड़ी (f.), बड़े (m. pl./oblique).';
  if (/छोटा /.test(t))
    return 'छोटा (small) changes with gender: छोटा लड़का (m.), छोटी लड़की (f.), छोटे बच्चे (pl.).';
  if (/अच्छा /.test(t) && !/ अच्छा लग/.test(t))
    return 'अच्छा = good. Like all -ा adjectives, it changes: अच्छा (m.), अच्छी (f.), अच्छे (m. pl./oblique).';
  if (/पुराना /.test(t) || /पुरानी /.test(t) || /पुराने /.test(t))
    return 'पुराना = old. A -ा adjective: पुराना (m.), पुरानी (f.), पुराने (m. pl.).';
  if (/नया /.test(t) || /नयी /.test(t) || /नई /.test(t) || /नए /.test(t))
    return 'नया = new: नया (m. sg.), नई/नयी (f.), नए (m. pl./oblique).';
  if (/लंबा /.test(t) || /लंबी /.test(t) || /लंबे /.test(t))
    return 'लंबा = long/tall: लंबा (m. sg.), लंबी (f.), लंबे (m. pl./oblique).';
  if (/सुंदर /.test(t))
    return 'सुंदर = beautiful. It does not change with gender – invariable adjectives stay the same.';
  return null;
}

function tipForHonorifics(t, e) {
  if (/ जी/.test(t) && !/ जीवन/.test(t) && !/ जीत/.test(t))
    return 'जी is a universal respect suffix added after names or titles: गुरुजी, भाईजी.';
  if (/आप /.test(t) && /तुम /.test(t))
    return 'Hindi has three "you" levels: तू (intimate), तुम (informal), आप (formal/respectful).';
  if (/आप /.test(t) && (e.includes('you') || e.includes('your')))
    return 'आप is the formal/respectful "you." Verbs with आप use plural conjugation.';
  return null;
}

function tipForCultural(t, e) {
  if (/दिवाली/.test(t) || /दीवाली/.test(t))
    return 'दिवाली/दीवाली = Festival of Lights, one of India\'s most important festivals.';
  if (/होली/.test(t) && e.toLowerCase().includes('holi'))
    return 'होली = Festival of Colors, celebrated in spring with colored powders and water.';
  if (/चाय/.test(t) && !/ चाय /.test(t))
    return 'चाय (f.) = tea – central to Indian social culture, often offered to guests as a welcome gesture.';
  if (/नमस्ते/.test(t))
    return 'नमस्ते comes from नमः (bow) + ते (to you). It serves as both greeting and farewell.';
  if (/प्रणाम/.test(t))
    return 'प्रणाम is a respectful greeting to elders, literally "I bow to you."';
  if (/रामायण/.test(t) || /महाभारत/.test(t))
    return 'रामायण and महाभारत are India\'s two great epics, foundational to Indian culture and values.';
  if (/गंगा/.test(t))
    return 'गंगा (f.) = the Ganges, considered sacred. गंगा जी is the respectful form.';
  if (/मंदिर/.test(t))
    return 'मंदिर (m.) = Hindu temple. The plural is मंदिर (same form).';
  if (/मस्जिद/.test(t))
    return 'मस्जिद (f.) = mosque – reflects India\'s religious diversity.';
  if (/गुरुद्वारा/.test(t))
    return 'गुरुद्वारा (m.) = Sikh temple, literally "door of the guru."';
  if (/पूजा/.test(t))
    return 'पूजा (f.) = worship/prayer ritual, an important part of Hindu daily life.';
  if (/योग/.test(t) || /योगा/.test(t))
    return 'योग (m.) = yoga, originating from ancient Indian practice meaning "union."';
  if (/आयुर्वेद/.test(t))
    return 'आयुर्वेद (m.) = Ayurveda, India\'s ancient system of medicine meaning "science of life."';
  return null;
}

function tipForVocabulary(t, e) {
  // Specific useful vocabulary explanations tied to what's in the sentence
  if (/ज़रूर/.test(t))
    return 'ज़रूर = certainly/definitely – an adverb that adds emphasis to a promise or assurance.';
  if (/शायद/.test(t))
    return 'शायद = maybe/perhaps. Unlike ज़रूर (certainly), it expresses doubt or possibility.';
  if (/इसलिए/.test(t) || /इसीलिए/.test(t))
    return 'इसलिए = therefore/that\'s why – connects a cause to its result.';
  if (/लेकिन/.test(t) || /मगर/.test(t) || /परंतु/.test(t) || /किंतु/.test(t)) {
    if (/परंतु/.test(t) || /किंतु/.test(t)) return 'परंतु/किंतु = but (formal/literary). Everyday Hindi uses लेकिन or मगर.';
    return 'लेकिन/मगर = but. लेकिन is more common; मगर is slightly more informal.';
  }
  if (/हालाँकि/.test(t))
    return 'हालाँकि = although/even though – introduces a concessive clause.';
  if (/इसके अलावा/.test(t) || /के अलावा/.test(t))
    return 'के अलावा = besides/apart from: इसके अलावा = apart from this.';
  if (/ख़ुश/.test(t) || /खुश/.test(t))
    return 'ख़ुश = happy (invariable adj.). ख़ुशी (f.) = happiness. The ख़ shows Urdu/Persian origin.';
  if (/ज़िंदगी/.test(t) || /ज़िन्दगी/.test(t))
    return 'ज़िंदगी (f.) = life – a Persian-origin word commonly used in everyday Hindi.';
  if (/दुनिया/.test(t))
    return 'दुनिया (f.) = world – Arabic origin, widely used in everyday Hindi alongside विश्व (Sanskrit).';
  if (/ख़्वाब/.test(t) || /ख़याल/.test(t) || /ख्वाब/.test(t) || /ख्याल/.test(t))
    return 'ख़्वाब/ख़याल are Persian-origin words common in Hindi: ख़्वाब = dream, ख़याल = thought/care.';
  return null;
}

function tipForOblique(t, e) {
  if (/लड़के /.test(t) && / में| पर| से| को| के/.test(t))
    return 'लड़के is the oblique form of लड़का – masculine -ा nouns change to -े before postpositions.';
  if (/बच्चों/.test(t))
    return 'बच्चों = children (oblique plural). Plural oblique adds -ओं: बच्चा → बच्चे → बच्चों.';
  if (/लोगों/.test(t))
    return 'लोगों = people (oblique plural). लोग → लोगों before postpositions.';
  if (/दोस्तों/.test(t))
    return 'दोस्तों = friends (oblique plural). The -ओं ending marks oblique plural before postpositions.';
  if (/घरों/.test(t))
    return 'घरों = houses (oblique plural). Oblique plural: -ा nouns → -ों: घर → घरों.';
  return null;
}

function tipForPassive(t, e) {
  if (/ जाता है$/.test(t.trim()) || / जाती है$/.test(t.trim()) || / जाते हैं$/.test(t.trim())) {
    if (e.includes('is ') && (e.includes('done') || e.includes('made') || e.includes('called') || e.includes('known') || e.includes('used') || e.includes('spoken') || e.includes('seen') || e.includes('found') || e.includes('considered')))
      return 'Hindi passive uses verb stem + जाना: किया जाता है = is done, कहा जाता है = is called/said.';
  }
  if (/ गया/.test(t) || / गयी/.test(t) || / गई/.test(t) || / गए/.test(t)) {
    if (e.includes('was ') && (e.includes('done') || e.includes('made') || e.includes('built') || e.includes('written') || e.includes('sent')))
      return 'Past passive: verb stem + गया/गई/गए. The participle agrees with the grammatical subject.';
  }
  return null;
}

function tipForConditional(t, e) {
  if (/अगर/.test(t) || /यदि/.test(t)) {
    if (/तो/.test(t))
      return 'अगर/यदि...तो = if...then. यदि is more formal; अगर is everyday Hindi.';
    return 'अगर/यदि = if. Often paired with तो (then) in the main clause.';
  }
  if (/जब /.test(t) && /तब/.test(t))
    return 'जब...तब = when...then. The pair frames time-based conditions.';
  if (/जब /.test(t) && /तो/.test(t))
    return 'जब...तो = when...then – used for temporal or conditional relationships.';
  if (/चाहे/.test(t))
    return 'चाहे = whether/no matter – introduces a concessive condition: चाहे जो हो = whatever happens.';
  return null;
}

function tipForCorrelative(t, e) {
  if (/जो /.test(t) && /वह /.test(t))
    return 'जो...वह = "the one who...that one" – Hindi uses correlative pairs instead of relative clauses.';
  if (/जो /.test(t) && /वो /.test(t))
    return 'जो...वो = "whoever/which...that" – a correlative pair. वो is the informal form of वह.';
  if (/जहाँ/.test(t) && /वहाँ/.test(t))
    return 'जहाँ...वहाँ = where...there – a correlative pair for location.';
  if (/जितना/.test(t) && /उतना/.test(t))
    return 'जितना...उतना = as much...that much – correlative pair for comparison.';
  if (/जैसा/.test(t) && /वैसा/.test(t))
    return 'जैसा...वैसा = as...so – correlative pair: जैसा करोगे, वैसा भरोगे (as you sow, so you reap).';
  return null;
}

function tipForNumbers(t, e) {
  if (/पहला /.test(t) || /पहली /.test(t) || /पहले /.test(t))
    return 'पहला = first. Ordinals in Hindi are adjectives: पहला (m.), पहली (f.), पहले (m. pl./oblique).';
  if (/दूसरा /.test(t) || /दूसरी /.test(t))
    return 'दूसरा = second/other. Like पहला, it inflects: दूसरा (m.), दूसरी (f.), दूसरे (m. pl.).';
  if (/तीसरा/.test(t) || /तीसरी/.test(t))
    return 'तीसरा = third. Hindi ordinals from "third" onward add -ा/-ी/-े to modified cardinal forms.';
  if (/सौ /.test(t))
    return 'सौ = 100. Hindi uses its own number system: सौ (100), हज़ार (1000), लाख (100,000).';
  if (/हज़ार/.test(t))
    return 'हज़ार = 1000. Indian numbering: हज़ार (1000), लाख (100,000), करोड़ (10,000,000).';
  if (/लाख/.test(t))
    return 'लाख = 100,000. The Indian number system groups digits differently from the Western system.';
  if (/करोड़/.test(t))
    return 'करोड़ = 10,000,000 (ten million). A fundamental unit in Indian numbering.';
  return null;
}

function tipForLagna(t, e) {
  if (/अच्छा लगता/.test(t) || /अच्छा लगती/.test(t) || /अच्छा लग/.test(t) || /पसंद /.test(t) || /अच्छी लग/.test(t)) {
    if (/पसंद/.test(t))
      return 'पसंद = liked. The experiencer takes को: मुझे चाय पसंद है = I like tea (lit: tea is liked to me).';
    return 'लगना expresses feelings/sensations with को: मुझे अच्छा लगता है = I like it (lit: it feels good to me).';
  }
  if (/डर लग/.test(t) || /भूख लग/.test(t) || /प्यास लग/.test(t) || /नींद आ/.test(t)) {
    if (/भूख/.test(t)) return 'भूख लगना = to feel hungry (lit: hunger strikes). The experiencer takes को: मुझे भूख लगी.';
    if (/प्यास/.test(t)) return 'प्यास लगना = to feel thirsty (lit: thirst strikes). Experiencer takes को.';
    if (/नींद/.test(t)) return 'नींद आना = to feel sleepy (lit: sleep comes). Experiencer takes को: मुझे नींद आ रही है.';
    return 'डर लगना = to feel afraid (lit: fear strikes). Experiencer takes को: मुझे डर लगता है.';
  }
  return null;
}

function tipForParticiple(t, e) {
  if (/हुआ /.test(t) || /हुई /.test(t) || /हुए /.test(t)) {
    if (/ रहा हुआ| बैठा हुआ| खड़ा हुआ| सोया हुआ| लिखा हुआ| बना हुआ| रखा हुआ/.test(t))
      return 'The past participle + हुआ/हुई/हुए emphasizes a resultant state: बैठा हुआ = seated (and still sitting).';
  }
  if (/कर /.test(t) && /ते हुए/.test(t))
    return 'The -ते हुए form = "while doing": हँसते हुए = while laughing, चलते हुए = while walking.';
  if (/करके/.test(t) || /जाकर/.test(t) || /खाकर/.test(t) || /आकर/.test(t) || /देकर/.test(t) || /लेकर/.test(t) || /बनाकर/.test(t) || /पढ़कर/.test(t)) {
    return 'Verb stem + कर/करके = "having done, then..." – chains sequential actions: खाकर सोया = ate then slept.';
  }
  return null;
}

function tipForBhi(t, e) {
  if (/ भी /.test(t)) {
    if (e.includes('also') || e.includes('too') || e.includes('even'))
      return 'भी = also/too/even. It follows the word it modifies: मैं भी = I also, वह भी = he/she too.';
  }
  if (/ ही /.test(t)) {
    if (e.includes('only') || e.includes('just') || e.includes('very'))
      return 'ही = only/just/exactly – an emphatic particle: यही = this very one, वहीं = right there.';
  }
  return null;
}

function tipForMisc(t, e) {
  if (/कि /.test(t))
    return 'कि = that (conjunction), introducing a subordinate clause: मुझे लगता है कि... = I think that...';
  if (/वाकई/.test(t) || /सचमुच/.test(t))
    return 'वाकई/सचमुच = really/truly – adverbs that add emphasis to a statement.';
  if (/ख़ैर/.test(t))
    return 'ख़ैर = anyway/well – a discourse marker used to change topic or wrap up.';
  if (/ज़रा/.test(t))
    return 'ज़रा = a little/just – softens requests: ज़रा सुनिए = just listen a moment.';
  if (/तो /.test(t) && !/ तो$/.test(t.trim()) && !/अगर/.test(t) && !/जब/.test(t)) {
    if (e.includes('then') || e.includes('so'))
      return 'तो = then/so – a versatile particle that can emphasize, contrast, or connect clauses.';
  }
  if (/ ही नहीं/.test(t) && / बल्कि/.test(t))
    return 'न केवल/सिर्फ़...बल्कि = not only...but also – a correlative conjunction pair.';
  if (/ या /.test(t) && e.includes(' or '))
    return 'या = or – the disjunctive conjunction: चाय या कॉफ़ी = tea or coffee.';
  if (/ और /.test(t) && e.includes(' and '))
    return 'और = and – the most common conjunction in Hindi, connecting words, phrases, or clauses.';
  return null;
}

// ── Main tip generator ──────────────────────────────────────────────────────
const generators = [
  tipForNe,
  tipForKo,
  tipForChahiye,
  tipForPostpositions,
  tipForTense,
  tipForQuestion,
  tipForConditional,
  tipForCorrelative,
  tipForCompound,
  tipForWala,
  tipForNahiNa,
  tipForHona,
  tipForPassive,
  tipForPossessive,
  tipForGender,
  tipForOblique,
  tipForParticiple,
  tipForLagna,
  tipForBhi,
  tipForHonorifics,
  tipForCultural,
  tipForNumbers,
  tipForVocabulary,
  tipForMisc,
];

function generateTip(card) {
  const t = card.target;
  const e = card.english;
  for (const gen of generators) {
    const tip = gen(t, e);
    if (tip) return tip;
  }
  return null;
}

// ── Apply tips ──────────────────────────────────────────────────────────────
// We need to add ~420+ tips. Process all cards without tips.
// To spread evenly, we calculate per-node targets.

const TARGET_PCT = 0.36; // aim slightly above 35% to have margin
const totalCards = cards.length;
const targetTips = Math.ceil(totalCards * TARGET_PCT);

// Count current tips per node
const nodeStats = {};
cards.forEach(c => {
  const n = c.grammarNode || 'unknown';
  if (!nodeStats[n]) nodeStats[n] = { total: 0, tips: 0, indices: [] };
  nodeStats[n].total++;
  const idx = cards.indexOf(c);
  if (c.grammar && c.grammar.trim()) {
    nodeStats[n].tips++;
  } else {
    nodeStats[n].indices.push(idx);
  }
});

let added = 0;
const currentTips = cards.filter(c => c.grammar && c.grammar.trim()).length;
const needed = targetTips - currentTips;

console.log(`Current tips: ${currentTips}/${totalCards} (${(currentTips/totalCards*100).toFixed(1)}%)`);
console.log(`Target: ${targetTips} (${(TARGET_PCT*100).toFixed(1)}%)`);
console.log(`Need to add: ${needed}`);

// First pass: try all pattern generators
const tippable = [];
for (const card of cards) {
  if (card.grammar && card.grammar.trim()) continue;
  const tip = generateTip(card);
  if (tip) {
    tippable.push({ card, tip });
  }
}

console.log(`Pattern-matchable cards: ${tippable.length}`);

// Spread evenly across nodes
// Calculate how many tips each node needs
const nodeTargets = {};
for (const [node, stats] of Object.entries(nodeStats)) {
  const nodeTarget = Math.ceil(stats.total * TARGET_PCT);
  nodeTargets[node] = Math.max(0, nodeTarget - stats.tips);
}

// Apply tips, prioritizing nodes that need the most
// Sort tippable by node need (descending)
tippable.sort((a, b) => {
  const nodeA = a.card.grammarNode || 'unknown';
  const nodeB = b.card.grammarNode || 'unknown';
  return (nodeTargets[nodeB] || 0) - (nodeTargets[nodeA] || 0);
});

for (const { card, tip } of tippable) {
  if (added >= needed + 50) break; // add a few extra for safety margin
  const node = card.grammarNode || 'unknown';
  if (nodeTargets[node] <= 0) continue;
  card.grammar = tip;
  nodeTargets[node]--;
  added++;
}

// If still short, add remaining without node limits
if (added < needed) {
  for (const { card, tip } of tippable) {
    if (added >= needed + 30) break;
    if (card.grammar && card.grammar.trim()) continue;
    card.grammar = tip;
    added++;
  }
}

const finalTips = cards.filter(c => c.grammar && c.grammar.trim()).length;
console.log(`\nAdded: ${added}`);
console.log(`Final tips: ${finalTips}/${totalCards} (${(finalTips/totalCards*100).toFixed(1)}%)`);

// Per-node final stats
console.log('\nPer-node final breakdown:');
const finalNodeStats = {};
cards.forEach(c => {
  const n = c.grammarNode || 'unknown';
  if (!finalNodeStats[n]) finalNodeStats[n] = { total: 0, tips: 0 };
  finalNodeStats[n].total++;
  if (c.grammar && c.grammar.trim()) finalNodeStats[n].tips++;
});
Object.keys(finalNodeStats).sort().forEach(n => {
  const d = finalNodeStats[n];
  console.log(`  ${n}: ${d.tips}/${d.total} = ${(d.tips/d.total*100).toFixed(0)}%`);
});

// Write back
// The deck is an array-like object with numeric keys
const output = Array.isArray(deck) ? cards : cards;
fs.writeFileSync(DECK_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
console.log('\nDeck written successfully.');
