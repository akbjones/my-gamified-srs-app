#!/usr/bin/env node
/**
 * reassign-hindi-nodes.cjs
 *
 * Strategy:
 * 1. The 6 renamed theme nodes (01, 05, 06, 07, 12, 17) had thematic content
 *    that now needs grammar-based reassignment.
 * 2. The other 29 nodes already have grammar-appropriate cards – keep those.
 * 3. Score cards from ALL nodes, but only force-reassign the 6 renamed nodes.
 *    For the other 29, only move a card if it scores drastically better elsewhere.
 * 4. After initial pass, rebalance to ensure 80–200 cards per node.
 *
 * Renamed nodes:
 *   01: "Greetings"       → "Personal pronouns & present habitual (-ता/-ती)"
 *   05: "Numbers"         → "Numerals & oblique case"
 *   06: "Food"            → "Accusative/dative (को construction)"
 *   07: "Family"          → "Adjective agreement (gender/number)"
 *   12: "Daily routine"   → "Reflexive verbs (अपना/खुद)"
 *   17: "Directions"      → "Compound postpositions (के ऊपर/के नीचे)"
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'hindi', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));
const originalDeck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

// The 6 nodes that changed meaning
const RENAMED_NODES = new Set(['node-01', 'node-05', 'node-06', 'node-07', 'node-12', 'node-17']);

// ── Helpers ──────────────────────────────────────────────────────────────

function words(text) {
  return text.replace(/[.,!?;:'"()\-––…«»""''।]/g, ' ').split(/\s+/).filter(Boolean);
}

function countWords(text, re) {
  return words(text).filter(w => re.test(w)).length;
}

// ── Scoring ──────────────────────────────────────────────────────────────

function scoreCard(card) {
  const t = card.target || '';
  const e = card.english || '';
  const g = (card.grammar || '').toLowerCase();
  const tw = words(t);
  const el = e.toLowerCase();

  const scores = {};
  for (let i = 1; i <= 35; i++) {
    scores[`node-${String(i).padStart(2, '0')}`] = 0;
  }
  const s = (n, pts) => { scores[n] += pts; };

  // ═══════════════════════════════════════════════════════════════════════
  // GRAMMAR TIP – strongest signal (20 pts)
  // ═══════════════════════════════════════════════════════════════════════
  if (g) {
    if (/\bpronoun|present\s+habitual/.test(g) && !/continuous|perfect/.test(g)) s('node-01', 20);
    if (/present\s+habitual|ता\s*\/\s*ती|ता है|ती है/.test(g)) s('node-01', 18);
    if (/present\s+tense/.test(g) && !/continuous|perfect|past/.test(g)) s('node-02', 18);
    if (/\bhonaa\b|\bkarnaa\b|\bहोना\b|\bकरना\b|to be vs|है vs/.test(g)) s('node-03', 20);
    if (/\bgender\b|\bpostposition/.test(g) && !/compound/.test(g)) s('node-04', 20);
    if (/\bnumeral|\boblique|number.*case|counting/.test(g)) s('node-05', 20);
    if (/\baccusative|\bdative|\bको\b/.test(g)) s('node-06', 20);
    if (/\badjective.*agreement|\bgender.*number.*adjective|विशेषण/.test(g)) s('node-07', 20);
    if (/\badjective|\bdescription/.test(g) && !/compar|superlat/.test(g)) s('node-07', 12);
    if (/common\s+(express|phrase)|everyday|greeting|farewell/.test(g)) s('node-08', 18);
    if (/simple\s+past|past\s+tense(?!.*habitual)/.test(g)) s('node-09', 20);
    if (/present\s+continuous|रहा|रही|रहे/.test(g)) s('node-10', 20);
    if (/modal|सकता|सकती|चाहिए|पड़ता/.test(g)) s('node-11', 20);
    if (/reflexive|अपना|अपनी|खुद/.test(g)) s('node-12', 20);
    if (/negat|नहीं|मत\b/.test(g)) s('node-13', 20);
    if (/postposition|में\b|पर\b|को\b|से\b/.test(g) && !/compound/.test(g)) s('node-14', 15);
    if (/compar|superlat|ज़्यादा|सबसे/.test(g)) s('node-15', 20);
    if (/past\s+habitual|ता था|ती थी/.test(g)) s('node-16', 20);
    if (/compound\s+postposition|के ऊपर|के नीचे|के सामने|के पीछे|के बाहर|के अंदर/.test(g)) s('node-17', 20);
    if (/subordinat|clause|कि\b|जो\b|जब\b/.test(g)) s('node-18', 20);
    if (/imperative|command|कीजिए|करो/.test(g)) s('node-19', 20);
    if (/compound\s+verb|सहायक\s+क्रिया/.test(g)) s('node-20', 20);
    if (/relative\s+clause|जो.*वो/.test(g)) s('node-21', 20);
    if (/passive|कर्मवाच्य|जाता है|जाती है|गया|गई/.test(g)) s('node-22', 20);
    if (/ergative|ने\s+construction|ने\b/.test(g)) s('node-23', 20);
    if (/future|गा\b|गी\b|गे\b/.test(g)) s('node-24', 20);
    if (/connector|conjunction|linking/.test(g)) s('node-25', 20);
    if (/conjunct\s+verb|noun.*करना|noun.*होना/.test(g)) s('node-26', 20);
    if (/reported\s+speech|indirect\s+speech|कहा\s+कि/.test(g)) s('node-27', 20);
    if (/\bidiom|मुहावर/.test(g)) s('node-28', 20);
    if (/register|formal|informal|आप.*तुम/.test(g)) s('node-29', 18);
    if (/sanskrit|persian|उर्दू|संस्कृत|तत्सम|तद्भव/.test(g)) s('node-30', 20);
    if (/complex\s+sentence/.test(g)) s('node-31', 18);
    if (/literary|archaic|written|साहित्यिक/.test(g)) s('node-32', 18);
    if (/academic|scientific|research|शोध/.test(g)) s('node-33', 18);
    if (/cultur|tradition|custom|संस्कृति|परंपरा/.test(g)) s('node-34', 18);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // HINDI MORPHOLOGY – Devanagari markers (10–12 pts max per feature)
  // ═══════════════════════════════════════════════════════════════════════

  // ── Present habitual: -ता/-ती/-ते + है/हैं/हूँ ──
  const habPresent = tw.filter(w => /ता$|ती$|ते$/.test(w)).length;
  const hasHai = tw.some(w => /^(है|हैं|हूँ)$/.test(w));
  // Only score as present habitual if we have both the participle and auxiliary
  if (habPresent > 0 && hasHai && !tw.some(w => /^(था|थी|थे|थीं)$/.test(w))) {
    s('node-01', 4 + Math.min(habPresent, 2) * 2);
    s('node-02', 4 + Math.min(habPresent, 2) * 2);
  }

  // ── Present continuous: रहा/रही/रहे + है/हैं/हूँ ──
  const contCount = tw.filter(w => /^(रहा|रही|रहे)$/.test(w)).length;
  if (contCount > 0 && hasHai) {
    s('node-10', 6 + Math.min(contCount, 2) * 3);
  }

  // ── Simple past: -आ/-ई/-ए/-ईं (verb endings) ──
  // Check for ने construction too (ergative = simple past for transitive)
  const hasNe = tw.some(w => /^ने$/.test(w));
  if (hasNe) {
    s('node-09', 6);
    s('node-23', 8); // ergative
  }
  // Past forms: गया/गई/गए, किया/कहा/दिया/लिया etc.
  const pastForms = tw.filter(w => /^(गया|गई|गए|गईं|किया|कहा|दिया|लिया|हुआ|हुई|हुए|हुईं|आया|आई|आए|पहुँचा|बैठा|चला|रहा|खाया|पिया|सुना|देखा|पढ़ा|लिखा|बोला|रोया|सोया|भागा|जागा|मिला|बना|बनी)$/.test(w)).length;
  if (pastForms > 0 && !tw.some(w => /^(था|थी|थे|रहा|रही|रहे)$/.test(w))) {
    s('node-09', 3 + Math.min(pastForms, 2) * 2);
  }

  // ── Past habitual: -ता/-ती/-ते + था/थी/थे ──
  const hasTha = tw.some(w => /^(था|थी|थे|थीं)$/.test(w));
  if (habPresent > 0 && hasTha) {
    s('node-16', 8 + Math.min(habPresent, 2) * 2);
  }

  // ── Future: -गा/-गी/-गे ──
  const futCount = tw.filter(w => /गा$|गी$|गे$|गीं$/.test(w)).length;
  if (futCount > 0) {
    s('node-24', 6 + Math.min(futCount, 2) * 3);
  }

  // ── Subjunctive: -ए/-ें ──
  // (hard to detect reliably – skip for low-confidence)

  // ── Imperative: bare stem or -ओ/-इए ──
  if (t.endsWith('!') || t.endsWith('।')) {
    const impForms = tw.filter(w => /ओ$|इए$|इये$|ीजिए$|ीजिये$/.test(w)).length;
    if (impForms > 0) s('node-19', 6 + Math.min(impForms, 2) * 3);
  }
  if (/^(करो|जाओ|बैठो|खाओ|पियो|सुनो|देखो|बोलो|चलो|रुको|बताओ|लाओ|दो|लो|आओ|पढ़ो|लिखो)\b/.test(t)) {
    s('node-19', 5);
  }
  // Formal imperative -इए/-इये
  if (tw.some(w => /कीजिए|बताइए|दीजिए|लीजिए|बैठिए|आइए|जाइए|सुनिए|देखिए|पढ़िए|लिखिए/.test(w))) {
    s('node-19', 7);
    s('node-29', 4); // also formal register
  }

  // ── Case/postposition markers ──

  // को (accusative/dative)
  const koCount = tw.filter(w => /^को$/.test(w)).length;
  if (koCount > 0) {
    s('node-06', 5 + Math.min(koCount, 2) * 3);
    s('node-14', 2);
  }
  // मुझको, उसको, etc.
  if (tw.some(w => /को$/.test(w) && w.length > 2)) {
    s('node-06', 4);
  }

  // का/की/के (genitive/possession)
  const genCount = tw.filter(w => /^(का|की|के)$/.test(w)).length;
  if (genCount > 0) s('node-04', 2 + Math.min(genCount, 2) * 2);

  // मेरा/मेरी/मेरे, तेरा, उसका, etc (possessive pronouns)
  const possPron = tw.filter(w => /^(मेरा|मेरी|मेरे|तेरा|तेरी|तेरे|उसका|उसकी|उसके|हमारा|हमारी|हमारे|तुम्हारा|तुम्हारी|तुम्हारे|उनका|उनकी|उनके|इसका|इसकी|इसके|अपना|अपनी|अपने)$/.test(w)).length;
  if (possPron > 0) s('node-04', 2);

  // में (locative)
  if (tw.some(w => /^में$/.test(w))) s('node-14', 4);

  // पर (locative on)
  if (tw.some(w => /^पर$/.test(w))) s('node-14', 3);

  // से (instrumental/ablative)
  const seCount = tw.filter(w => /^से$/.test(w)).length;
  if (seCount > 0) {
    s('node-14', 3);
    // X से ज़्यादा/कम/बड़ा = comparative
    if (tw.some(w => /^(ज़्यादा|ज्यादा|कम|बड़ा|बड़ी|छोटा|छोटी|अच्छा|अच्छी|बेहतर)$/.test(w))) {
      s('node-15', 6);
    }
  }

  // तक (limit)
  if (tw.some(w => /^तक$/.test(w))) s('node-14', 3);

  // ── Compound postpositions: के ऊपर, के नीचे, etc. ──
  const compPost = /के\s+(ऊपर|नीचे|सामने|पीछे|बाहर|अंदर|बीच|पास|साथ|बारे|लिए|बाद|पहले|कारण|बजाय|अलावा|बावजूद|द्वारा|माध्यम|ज़रिए|विपरीत|अनुसार|तहत)/;
  if (compPost.test(t)) {
    s('node-17', 10);
  }
  // की ओर, की तरफ़, की वजह
  if (/की\s+(ओर|तरफ़|तरफ|वजह|जगह)/.test(t)) {
    s('node-17', 8);
  }

  // ── Negation ──
  if (tw.some(w => /^नहीं$/.test(w))) s('node-13', 6);
  if (tw.some(w => /^मत$/.test(w))) { s('node-13', 6); s('node-19', 3); }
  if (tw.some(w => /^न$/.test(w)) && tw.length > 3) s('node-13', 3);

  // ── Modal: सकता/सकती, चाहिए, पड़ता/पड़ती ──
  if (tw.some(w => /^(सकता|सकती|सकते|सकूँ|सकें)$/.test(w))) s('node-11', 8);
  if (tw.some(w => /^चाहिए$/.test(w))) s('node-11', 10);
  if (tw.some(w => /^(पड़ता|पड़ती|पड़ते|पड़ेगा|पड़ेगी)$/.test(w))) s('node-11', 8);

  // ── Compound verbs: verb + auxiliary (कर देना, चल पड़ना, लिख लेना) ──
  // Detect: two verb-like words adjacent
  const compVerbAux = /^(देना|लेना|डालना|जाना|पड़ना|उठना|बैठना|आना|रखना|चुकना)$/;
  const compVerbConj = tw.filter(w => /^(दिया|दी|दिए|लिया|ली|लिए|डाला|डाली|गया|गई|पड़ा|पड़ी|उठा|उठी|बैठा|बैठी|रखा|रखी|चुका|चुकी|चुके)$/.test(w)).length;
  if (compVerbConj > 0) s('node-20', 4 + Math.min(compVerbConj, 2) * 2);

  // ── Conjunct verbs: noun + करना/होना (मदद करना, शुरू होना) ──
  // Hard to detect precisely – look for common patterns
  const conjunctPatterns = /(मदद|शुरू|बंद|इस्तेमाल|कोशिश|इंतज़ार|पसंद|नफ़रत|प्यार|यकीन|भरोसा|ज़रूरत|तैयार|साफ़|काम|बात|सवाल|जवाब|फ़ैसला|ख़्याल|इरादा|मंज़ूरी|शिकायत)\s+(करना|करता|करती|करते|किया|की|किए|करें|करो|कीजिए|होना|होता|होती|होते|हुआ|हुई)/;
  if (conjunctPatterns.test(t)) s('node-26', 8);

  // ── Passive: जाना auxiliary ──
  if (/जाता\s+है|जाती\s+है|जाते\s+हैं|जाता\s+था|जाती\s+थी/.test(t) && tw.length > 4) {
    // Only if it looks like passive, not literal "goes"
    s('node-22', 4);
  }
  if (/किया\s+जाता|बनाया\s+जाता|दिया\s+जाता|कहा\s+जाता|माना\s+जाता|लिखा\s+जाता|पढ़ा\s+जाता|खाया\s+जाता|किया\s+गया|बनाया\s+गया|दिया\s+गया/.test(t)) {
    s('node-22', 10);
  }

  // ── Relative: जो...वो ──
  if (tw.some(w => /^(जो|जिसे|जिसको|जिसने|जिसका|जिसकी|जिसके|जिन्हें|जिनका)$/.test(w))) {
    s('node-21', 8);
  }
  if (tw.some(w => /^(वो|वह|वे|उसने|उन्होंने)$/.test(w)) && tw.some(w => /^जो$/.test(w))) {
    s('node-21', 5);
  }

  // ── Reported speech: कहा कि, बताया कि ──
  if (/कहा\s+कि|बताया\s+कि|सोचा\s+कि|पूछा\s+कि|बोला\s+कि|लिखा\s+कि|सुना\s+कि/.test(t)) {
    s('node-27', 10);
  }
  if (tw.some(w => /^कि$/.test(w))) {
    s('node-18', 4); // subordinate clause marker
    s('node-27', 3);
  }

  // ── Comparative: से + adjective, ज़्यादा, सबसे ──
  if (tw.some(w => /^(ज़्यादा|ज्यादा)$/.test(w))) s('node-15', 7);
  if (tw.some(w => /^सबसे$/.test(w))) s('node-15', 8);

  // ── Reflexive: अपना/अपनी/अपने, खुद ──
  if (tw.some(w => /^(अपना|अपनी|अपने|अपनों)$/.test(w))) s('node-12', 10);
  if (tw.some(w => /^(खुद|स्वयं)$/.test(w))) s('node-12', 10);

  // ── Honorific levels: तू/तुम/आप forms ──
  if (tw.some(w => /^(तू|तुझे|तुझको|तेरा|तेरी)$/.test(w))) s('node-29', 5);
  if (tw.some(w => /^(आप|आपको|आपका|आपकी|आपके|आपने)$/.test(w))) s('node-29', 2);

  // ── Personal pronouns (for node-01) ──
  const prons = tw.filter(w => /^(मैं|तू|तुम|आप|वह|वो|यह|ये|हम|वे|मुझे|मुझको|तुझे|उसे|उसको|हमें|तुम्हें|उन्हें|मैंने|उसने|हमने|तुमने|उन्होंने|इसने)$/.test(w)).length;
  if (prons >= 2) s('node-01', 4);
  else if (prons >= 1) s('node-01', 2);

  // ── Numbers/numerals ──
  const numWords = tw.filter(w => /^(एक|दो|तीन|चार|पाँच|छह|छ:|सात|आठ|नौ|दस|ग्यारह|बारह|तेरह|चौदह|पंद्रह|सोलह|सत्रह|अठारह|उन्नीस|बीस|तीस|चालीस|पचास|साठ|सत्तर|अस्सी|नब्बे|सौ|हज़ार|लाख|करोड़|पहला|पहली|दूसरा|दूसरी|तीसरा|चौथा|पाँचवाँ|आधा|डेढ़|ढाई|सवा|पौने)$/.test(w)).length;
  if (numWords > 0) s('node-05', 4 + Math.min(numWords, 2) * 2);

  // Time words
  if (tw.some(w => /^(बजे|घंटा|घंटे|मिनट|सुबह|शाम|दोपहर|रात|बज|बजकर)$/.test(w))) {
    s('node-05', 4);
  }

  // ── Adjective detection ──
  const ADJ_RE = /^(बड़ा|बड़ी|बड़े|छोटा|छोटी|छोटे|अच्छा|अच्छी|अच्छे|बुरा|बुरी|बुरे|नया|नई|नए|पुराना|पुरानी|पुराने|लंबा|लंबी|लंबे|ऊँचा|ऊँची|ऊँचे|गहरा|गहरी|गहरे|चौड़ा|चौड़ी|सुंदर|खूबसूरत|गर्म|ठंडा|ठंडी|मोटा|मोटी|पतला|पतली|भारी|हल्का|हल्की|मीठा|मीठी|कड़वा|कड़वी|खट्टा|खट्टी|तीखा|तीखी|नरम|सख़्त|मुलायम|कठोर|साफ़|गंदा|गंदी|सफ़ेद|काला|काली|लाल|हरा|हरी|पीला|पीली|नीला|नीली|तेज़|धीमा|धीमी|मज़बूत|कमज़ोर|अमीर|ग़रीब|ख़ुश|उदास|शांत|सीधा|सीधी|गोल|चपटा)$/;
  const adjCount = tw.filter(w => ADJ_RE.test(w)).length;
  if (adjCount >= 2) {
    s('node-07', 6);
    s('node-15', 2);
  } else if (adjCount >= 1) {
    s('node-07', 3);
  }

  // ── Connectors ──
  const CONN_RE = /^(हालाँकि|लेकिन|परंतु|किंतु|इसलिए|इसीलिए|फिर\sभी|बल्कि|जबकि|यद्यपि|तथापि|अतः|अतएव|चूँकि|क्योंकि|ताकि|वरना|नहीं\sतो|अन्यथा|साथ\sही|इसके\sअलावा|दूसरी\sओर|एक\sतरफ़)$/;
  if (tw.some(w => CONN_RE.test(w))) s('node-25', 8);
  if (/हालाँकि|इसलिए|इसीलिए|बल्कि|जबकि|यद्यपि|तथापि|क्योंकि|ताकि|वरना|अतः/.test(t)) s('node-25', 6);

  // ── Subordinate clause markers ──
  if (tw.some(w => /^(जब|जहाँ|जैसे|जितना|जिधर|ज्यों)$/.test(w))) s('node-18', 5);
  if (/जब\s+तक|जब\s+से|जहाँ\s+तक/.test(t)) s('node-18', 7);

  // ── Formal register ──
  if (tw.some(w => /^(श्रीमान|श्रीमती|महोदय|महोदया|कृपया|अनुग्रह|सादर|विनम्र)$/.test(w))) s('node-29', 6);

  // ── Academic/literary ──
  if (tw.some(w => /^(शोध|अनुसंधान|विश्लेषण|परिकल्पना|सिद्धांत|प्रमाण|निष्कर्ष|तर्क|प्रयोग|सांख्यिकी|समीक्षा|अध्ययन)$/.test(w))) s('node-33', 7);
  if (tw.some(w => /^(काव्य|कविता|साहित्य|रचना|गद्य|पद्य|छंद|रस|अलंकार)$/.test(w))) s('node-32', 7);

  // ── Cultural ──
  if (tw.some(w => /^(दीपावली|दिवाली|होली|दशहरा|रक्षाबंधन|ईद|नवरात्रि|बैसाखी|पोंगल|ओणम|लोहड़ी|छठ|गणेश|दुर्गा|मंदिर|मस्जिद|गुरुद्वारा|पूजा|आरती|प्रसाद|रीति|रिवाज|परंपरा|संस्कृति|त्योहार|उत्सव|मेला)$/.test(w))) s('node-34', 6);

  // ── Idioms (body parts in figurative sense) ──
  if (tw.some(w => /^(आँख|नाक|कान|हाथ|पैर|सिर|मुँह|दिल|जी|जान|ज़बान|गला|पीठ|पेट|उँगली|होंठ)$/.test(w)) && tw.length <= 8) s('node-28', 3);

  // ═══════════════════════════════════════════════════════════════════════
  // ENGLISH-SIDE (light)
  // ═══════════════════════════════════════════════════════════════════════
  if (el) {
    if (/\b(will|going to|shall)\b/.test(el) && !/would/.test(el)) s('node-24', 2);
    if (/\b(can|could|must|should|may|might|able to)\b/.test(el)) s('node-11', 2);
    if (/\bthan\b/.test(el)) s('node-15', 3);
    if (/\bmost\b/.test(el) && /\b(the most|most \w+)\b/.test(el)) s('node-15', 3);
    if (/\b(said that|told me|mentioned|claimed|stated)\b/.test(el)) s('node-27', 3);
    if (e.endsWith('?')) s('node-04', 1); // question, light signal
    if (/\b(himself|herself|itself|themselves|myself|yourself|own)\b/.test(el)) s('node-12', 3);
    if (/\bused to\b/.test(el)) s('node-16', 5);
    if (/\b(is|are|am)\s+\w+ing\b/.test(el)) s('node-10', 2);
    if (/\b(was|were)\s+\w+ing\b/.test(el)) s('node-10', 1);
    if (/\b(above|below|behind|in front of|beside|inside|outside|between|near|next to)\b/.test(el)) s('node-17', 3);
    if (/\b(every|each|always|usually|often|never|sometimes)\b/.test(el)) s('node-01', 2);
    if (/\bdon't\b|\bdoesn't\b|\bnot\b|\bnever\b/.test(el)) s('node-13', 2);
    if (/\bwas\s+(made|done|built|written|given|told|sent|seen|heard)\b/.test(el)) s('node-22', 3);
    if (/\b(who|which|that)\b/.test(el) && el.includes(',')) s('node-21', 2);
  }

  // Short expressions bias
  if (tw.length <= 3) s('node-08', 4);

  return scores;
}

// ── Assignment logic ─────────────────────────────────────────────────────

function getBestNode(scores) {
  let best = 'node-08';
  let bestScore = -1;
  for (const [node, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = node;
    }
  }
  return { node: best, score: bestScore };
}

// ── Phase 1: Score and assign ────────────────────────────────────────────

const originalDist = {};
deck.forEach(c => { originalDist[c.grammarNode] = (originalDist[c.grammarNode] || 0) + 1; });

let phase1Changes = 0;
const sampleChanges = [];

// Pre-compute all scores
const allScores = deck.map(c => scoreCard(c));

deck.forEach((card, i) => {
  const scores = allScores[i];
  const { node: bestNode, score: bestScore } = getBestNode(scores);
  const origNode = card.grammarNode;
  const origScore = scores[origNode] || 0;

  if (RENAMED_NODES.has(origNode)) {
    // Card is in a renamed node – MUST reassign based on grammar
    if (bestScore > 0) {
      if (bestNode !== origNode) {
        if (sampleChanges.length < 50) {
          sampleChanges.push({
            id: card.id, target: card.target.substring(0, 60),
            english: card.english.substring(0, 50),
            old: origNode, new: bestNode, score: bestScore,
          });
        }
        card.grammarNode = bestNode;
        phase1Changes++;
      }
    } else {
      // No strong signal – keep in original (now grammar-named) node
    }
  } else {
    // Card is in an unchanged grammar node – only move if MUCH better elsewhere
    // and original score is weak (< 3)
    if (origScore < 3 && bestScore >= origScore + 12 && bestNode !== origNode) {
      if (sampleChanges.length < 50) {
        sampleChanges.push({
          id: card.id, target: card.target.substring(0, 60),
          english: card.english.substring(0, 50),
          old: origNode, new: bestNode, score: bestScore,
        });
      }
      card.grammarNode = bestNode;
      phase1Changes++;
    }
  }
});

const afterPhase1 = {};
deck.forEach(c => { afterPhase1[c.grammarNode] = (afterPhase1[c.grammarNode] || 0) + 1; });

// ── Phase 2: Rebalance (80–200 cards) ────────────────────────────────────

const MIN_CARDS = 80;
const MAX_CARDS = 200;
let rebalanceMoves = 0;

function getDist() {
  const d = {};
  deck.forEach(c => { d[c.grammarNode] = (d[c.grammarNode] || 0) + 1; });
  for (let i = 1; i <= 35; i++) {
    const id = `node-${String(i).padStart(2, '0')}`;
    if (!d[id]) d[id] = 0;
  }
  return d;
}

// CEFR tiers for each node
const nodeTier = {};
for (let i = 1; i <= 8; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'A1';
for (let i = 9; i <= 15; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'A2';
for (let i = 16; i <= 21; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'B1';
for (let i = 22; i <= 27; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'B2';
for (let i = 28; i <= 31; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'C1';
for (let i = 32; i <= 35; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'C2';

for (let round = 0; round < 20; round++) {
  let moved = 0;
  const dist = getDist();

  // Fix overflow
  for (let n = 1; n <= 35; n++) {
    const nodeId = `node-${String(n).padStart(2, '0')}`;
    if (dist[nodeId] <= MAX_CARDS) continue;

    const indices = [];
    deck.forEach((c, i) => { if (c.grammarNode === nodeId) indices.push(i); });
    // Sort by score for this node ascending (weakest first)
    indices.sort((a, b) => allScores[a][nodeId] - allScores[b][nodeId]);

    const excess = dist[nodeId] - MAX_CARDS;
    let cnt = 0;
    for (const idx of indices) {
      if (cnt >= excess) break;
      // Find best alt under MAX
      let bestAlt = null, bestAltScore = -1;
      for (const [an, as] of Object.entries(allScores[idx])) {
        if (an === nodeId) continue;
        if (dist[an] >= MAX_CARDS) continue;
        if (as > bestAltScore) { bestAltScore = as; bestAlt = an; }
      }
      if (bestAlt) {
        dist[nodeId]--;
        dist[bestAlt]++;
        deck[idx].grammarNode = bestAlt;
        cnt++;
        moved++;
        rebalanceMoves++;
      }
    }
  }

  // Fix underflow
  for (let n = 1; n <= 35; n++) {
    const nodeId = `node-${String(n).padStart(2, '0')}`;
    if (dist[nodeId] >= MIN_CARDS) continue;

    const needed = MIN_CARDS - dist[nodeId];
    const tier = nodeTier[nodeId];

    // Pass 1: candidates with score > 0 for this node
    const scored = [];
    deck.forEach((c, i) => {
      if (c.grammarNode === nodeId) return;
      if (dist[c.grammarNode] <= MIN_CARDS) return;
      if (allScores[i][nodeId] > 0) {
        scored.push({ idx: i, score: allScores[i][nodeId], srcNode: c.grammarNode });
      }
    });
    scored.sort((a, b) => b.score - a.score);

    let filled = 0;
    for (const c of scored) {
      if (filled >= needed) break;
      if (dist[c.srcNode] <= MIN_CARDS) continue;
      dist[c.srcNode]--;
      dist[nodeId]++;
      deck[c.idx].grammarNode = nodeId;
      filled++;
      moved++;
      rebalanceMoves++;
    }

    // Pass 2: if still under, pull from same-tier overflowing nodes
    if (filled < needed) {
      const sameTierOverflow = [];
      deck.forEach((c, i) => {
        if (c.grammarNode === nodeId) return;
        if (dist[c.grammarNode] <= 110) return;
        const srcTier = nodeTier[c.grammarNode];
        const tierDist = Math.abs('A1A2B1B2C1C2'.indexOf(tier) - 'A1A2B1B2C1C2'.indexOf(srcTier));
        if (tierDist <= 4) {
          sameTierOverflow.push({
            idx: i,
            srcScore: allScores[i][c.grammarNode],
            srcNode: c.grammarNode,
            tierDist,
          });
        }
      });
      sameTierOverflow.sort((a, b) => a.tierDist - b.tierDist || a.srcScore - b.srcScore);

      for (const c of sameTierOverflow) {
        if (filled >= needed) break;
        if (dist[c.srcNode] <= 110) continue;
        dist[c.srcNode]--;
        dist[nodeId]++;
        deck[c.idx].grammarNode = nodeId;
        filled++;
        moved++;
        rebalanceMoves++;
      }
    }
  }

  if (moved === 0) break;
}

// ── Stats ────────────────────────────────────────────────────────────────

const finalDist = getDist();

let totalChanged = 0;
deck.forEach((c, i) => {
  if (c.grammarNode !== originalDeck[i].grammarNode) totalChanged++;
});

const nodeNames = {
  'node-01': 'Personal pronouns & present habitual',
  'node-02': 'Present habitual tense',
  'node-03': 'Honaa vs karnaa',
  'node-04': 'Gender & postpositions',
  'node-05': 'Numerals & oblique case',
  'node-06': 'Accusative/dative (को)',
  'node-07': 'Adjective agreement',
  'node-08': 'Common expressions',
  'node-09': 'Simple past tense',
  'node-10': 'Present continuous',
  'node-11': 'Modal verbs',
  'node-12': 'Reflexive verbs (अपना/खुद)',
  'node-13': 'Negation (नहीं/मत/न)',
  'node-14': 'Postpositions (में/पर/को/से)',
  'node-15': 'Adjective comparison',
  'node-16': 'Past habitual tense',
  'node-17': 'Compound postpositions',
  'node-18': 'Subordinate clauses',
  'node-19': 'Imperative',
  'node-20': 'Compound verbs',
  'node-21': 'Relative clauses (जो...वो)',
  'node-22': 'Passive voice',
  'node-23': 'Ergative case (ने)',
  'node-24': 'Future tense',
  'node-25': 'Advanced connectors',
  'node-26': 'Conjunct verbs (N + करना)',
  'node-27': 'Reported speech',
  'node-28': 'Idiomatic expressions',
  'node-29': 'Formal vs informal',
  'node-30': 'Sanskritized vs Persianized',
  'node-31': 'Complex sentences',
  'node-32': 'Literary Hindi',
  'node-33': 'Academic discourse',
  'node-34': 'Cultural fluency',
  'node-35': 'Advanced mastery',
};

console.log('=== HINDI GRAMMAR NODE REASSIGNMENT ===\n');
console.log('Cards per node (BEFORE → phase1 → FINAL):');
console.log('-'.repeat(90));

for (let i = 1; i <= 35; i++) {
  const id = `node-${String(i).padStart(2, '0')}`;
  const before = originalDist[id] || 0;
  const mid = afterPhase1[id] || 0;
  const after = finalDist[id] || 0;
  const delta = after - before;
  const deltaStr = delta > 0 ? `+${delta}` : delta === 0 ? '  0' : `${delta}`;
  const bar = '#'.repeat(Math.round(after / 5));
  const renamed = RENAMED_NODES.has(id) ? ' *' : '';
  const warn = after < MIN_CARDS ? ' LOW' : after > MAX_CARDS ? ' HIGH' : '';
  console.log(`  ${id} ${String(before).padStart(3)} → ${String(mid).padStart(3)} → ${String(after).padStart(3)} (${deltaStr.padStart(4)}) ${bar}${warn}${renamed}  ${nodeNames[id]}`);
}

console.log('-'.repeat(90));
console.log(`Total cards: ${deck.length}`);
console.log(`Phase 1 changes: ${phase1Changes}`);
console.log(`Phase 2 rebalance moves: ${rebalanceMoves}`);
console.log(`Total changed from original: ${totalChanged}`);
console.log(`Distribution: ${Math.min(...Object.values(finalDist))} – ${Math.max(...Object.values(finalDist))}`);
console.log(`* = renamed node`);

console.log('\n=== SAMPLE REASSIGNMENTS ===\n');
sampleChanges.slice(0, 25).forEach(ch => {
  console.log(`  ${ch.id}: ${ch.old} → ${ch.new} (score=${ch.score})`);
  console.log(`    HI: ${ch.target}`);
  console.log(`    EN: ${ch.english}`);
  console.log();
});

// Write
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log(`\nUpdated deck written to ${DECK_PATH}`);
