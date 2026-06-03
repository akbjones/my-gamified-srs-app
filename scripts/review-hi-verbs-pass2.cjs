#!/usr/bin/env node
/**
 * Hindi dictionary review – PASS 2
 * Deep manual review of all remaining issues after pass 1.
 * Handles: nouns wrongly tagged as verbs, garbled translations,
 * wrong meanings, garbage semicolons, POS errors.
 */

const fs = require('fs');
const path = require('path');

const DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'hi.ts');
const OUTPUT_PATH = path.join(__dirname, 'output', 'hi-full-verb-review.json');

const src = fs.readFileSync(DICT_PATH, 'utf8');

// ─── Parse ──────────────────────────────────────────────────────────────────
const entries = [];
const lineRegex = /^\s*['"]([^'"]+)['"]\s*:\s*\{([^}]+)\}/gm;
let m;
while ((m = lineRegex.exec(src)) !== null) {
  const en = m[2].match(/en:\s*'((?:[^'\\]|\\.)*)'/)?.[1]?.replace(/\\'/g, "'") || '';
  const pos = m[2].match(/pos:\s*'((?:[^'\\]|\\.)*)'/)?.[1] || '';
  const ipa = m[2].match(/ipa:\s*'((?:[^'\\]|\\.)*)'/)?.[1] || '';
  const lemma = m[2].match(/lemma:\s*'((?:[^'\\]|\\.)*)'/)?.[1] || undefined;
  entries.push({ key: m[1], en, pos, ipa, lemma });
}
console.log(`Total entries parsed: ${entries.length}`);

// ══════════════════════════════════════════════════════════════════════════════
// ─── COMPREHENSIVE HINDI FIXES (manually reviewed) ──────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
// Each key: the Hindi word. Value: { en, pos, [lemma] }
// Only entries that NEED fixing are listed.

const FIXES = {
  // ── NOUNS wrongly tagged as pos=v with "to " ─────────────────
  'ईंधन': { en: 'fuel', pos: 'n' },
  'इस्तेमाल': { en: 'use', pos: 'n' },
  'उपयोग': { en: 'use; usage', pos: 'n' },
  'उत्साहवर्धक': { en: 'encouraging', pos: 'adj' },
  'कसरत': { en: 'exercise', pos: 'n' },
  'कार्रवाई': { en: 'action; proceedings', pos: 'n' },
  'कीटनाशक': { en: 'insecticide; pesticide', pos: 'n' },
  'कैप्चरिंग': { en: 'capturing', pos: 'n' },
  'कोशिश': { en: 'effort; attempt', pos: 'n' },
  'खंडहर': { en: 'ruins', pos: 'n' },
  'खंडहरों': { en: 'ruins', pos: 'n' },
  'ख़तरा': { en: 'danger; risk', pos: 'n' },
  'ख़रीदारी': { en: 'shopping', pos: 'n' },
  'खाँसी': { en: 'cough', pos: 'n' },
  'खुदाई': { en: 'excavation; digging', pos: 'n' },
  'गंभीरता': { en: 'seriousness; gravity', pos: 'n' },
  'गंध': { en: 'smell; odor', pos: 'n' },
  'गायन': { en: 'singing', pos: 'n' },
  'गोह': { en: 'monitor lizard', pos: 'n' },
  'गौरैया': { en: 'sparrow', pos: 'n' },
  'घोंसला': { en: 'nest', pos: 'n' },
  'घोंसलों': { en: 'nests', pos: 'n' },
  'चतुराई': { en: 'cleverness', pos: 'n' },
  'चर्चा': { en: 'discussion', pos: 'n' },
  'छपाई': { en: 'printing', pos: 'n' },
  'छाया': { en: 'shade; shadow', pos: 'n' },
  'ज़रूरत': { en: 'need; necessity', pos: 'n' },
  'जलधारा': { en: 'stream', pos: 'n' },
  'तपस्या': { en: 'penance; austerity', pos: 'n' },
  'ताज़गी': { en: 'freshness', pos: 'n' },
  'तारीफ़': { en: 'praise; compliment', pos: 'n' },
  'ताला': { en: 'lock', pos: 'n' },
  'तिरंगा': { en: 'tricolor; Indian flag', pos: 'n' },
  'तैराकी': { en: 'swimming', pos: 'n' },
  'त्याग': { en: 'sacrifice; renunciation', pos: 'n' },
  'दिखावा': { en: 'show off; pretense', pos: 'n' },
  'दुभाषिया': { en: 'interpreter', pos: 'n' },
  'धागा': { en: 'thread', pos: 'n' },
  'धागों': { en: 'threads', pos: 'n' },
  'धुआँ': { en: 'smoke', pos: 'n' },
  'नज़ारा': { en: 'view; scenery', pos: 'n' },
  'नल': { en: 'tap; faucet', pos: 'n' },
  'नाटक': { en: 'drama; play', pos: 'n' },
  'निर्यात': { en: 'export', pos: 'n' },
  'नृत्य': { en: 'dance', pos: 'n' },
  'नोट': { en: 'note; banknote', pos: 'n' },
  'न्यायाधीश': { en: 'judge', pos: 'n' },
  'पंखा': { en: 'fan', pos: 'n' },
  'परिणाम': { en: 'result; outcome', pos: 'n' },
  'परिवर्तन': { en: 'change; transformation', pos: 'n' },
  'परेड': { en: 'parade', pos: 'n' },
  'पहरा': { en: 'guard; watch', pos: 'n' },
  'पहलवानी': { en: 'wrestling', pos: 'n' },
  'पालन': { en: 'compliance; upbringing', pos: 'n' },
  'पिन': { en: 'pin', pos: 'n' },
  'पूँछ': { en: 'tail', pos: 'n' },
  'प्रकाश': { en: 'light', pos: 'n' },
  'प्रवाह': { en: 'flow; current', pos: 'n' },
  'प्रश्नोत्तर': { en: 'question and answer', pos: 'n' },
  'प्रिया': { en: 'Priya', pos: 'n' },
  'प्रेम': { en: 'love', pos: 'n' },
  'फ़सल': { en: 'crop; harvest', pos: 'n' },
  'भाटा': { en: 'ebb; reflux', pos: 'n' },
  'भाप': { en: 'steam', pos: 'n' },
  'भारती': { en: 'Bharti', pos: 'n' },
  'भीख': { en: 'alms; begging', pos: 'n' },
  'भूमि': { en: 'land; ground', pos: 'n' },
  'मंच': { en: 'stage; platform', pos: 'n' },
  'मदद': { en: 'help', pos: 'n' },
  'मरम्मत': { en: 'repair', pos: 'n' },
  'मलेरिया': { en: 'malaria', pos: 'n' },
  'मसला': { en: 'issue; matter', pos: 'n' },
  'महसूस': { en: 'felt; feeling', pos: 'adj' },
  'महफ़िल': { en: 'gathering; assembly', pos: 'n' },
  'मामला': { en: 'matter; case', pos: 'n' },
  'मामले': { en: 'matters; cases', pos: 'n' },
  'मीटिंग': { en: 'meeting', pos: 'n' },
  'मुक्का': { en: 'punch; fist', pos: 'n' },
  'मुद्दा': { en: 'issue; point', pos: 'n' },
  'मुद्दों': { en: 'issues; points', pos: 'n' },
  'मोहब्बत': { en: 'love', pos: 'n' },
  'रक्षा': { en: 'defense; protection', pos: 'n' },
  'रद्द': { en: 'cancelled', pos: 'adj' },
  'राशन': { en: 'ration', pos: 'n' },
  'रिहाई': { en: 'release; freedom', pos: 'n' },
  'रुचि': { en: 'interest', pos: 'n' },
  'रेलगाड़ी': { en: 'train', pos: 'n' },
  'रोमांचक': { en: 'exciting; thrilling', pos: 'adj' },
  'लड़ाई': { en: 'battle; fight', pos: 'n' },
  'लेखन': { en: 'writing', pos: 'n' },
  'लट्टू': { en: 'spinning top', pos: 'n' },
  'लट्ठा': { en: 'log; beam', pos: 'n' },
  'लहंगे': { en: 'lehenga', pos: 'n' },
  'वकालतनामे': { en: 'power of attorney', pos: 'n' },
  'वापसी': { en: 'return', pos: 'n' },
  'व्यायाम': { en: 'exercise', pos: 'n' },
  'श्रवण': { en: 'hearing; listening', pos: 'n' },
  'संरक्षित': { en: 'protected; reserved', pos: 'adj' },
  'सन्नाटा': { en: 'silence', pos: 'n' },
  'सवारी': { en: 'ride; passenger', pos: 'n' },
  'सहन': { en: 'tolerance; endurance', pos: 'n' },
  'सहमत': { en: 'agreed', pos: 'adj' },
  'सहारा': { en: 'support', pos: 'n' },
  'सही': { en: 'correct; right', pos: 'adj' },
  'सूजन': { en: 'swelling', pos: 'n' },
  'स्टॉप': { en: 'stop', pos: 'n' },
  'स्तर': { en: 'level', pos: 'n' },
  'स्रोत': { en: 'source', pos: 'n' },
  'स्रोतों': { en: 'sources', pos: 'n' },
  'स्वच्छ': { en: 'clean; pure', pos: 'adj' },
  'हास्य': { en: 'humor; comedy', pos: 'n' },
  'होश': { en: 'consciousness; sense', pos: 'n' },
  'बर्दाश्त': { en: 'tolerance; endurance', pos: 'n' },
  'बर्बाद': { en: 'ruined; destroyed', pos: 'adj' },
  'बीज': { en: 'seed', pos: 'n' },
  'बुनकरी': { en: 'weaving', pos: 'n' },
  'बेझिझक': { en: 'without hesitation', pos: 'adv' },
  'पार्क': { en: 'park', pos: 'n' },
  'टीवी': { en: 'TV; television', pos: 'n' },
  'ट्रेन': { en: 'train', pos: 'n' },
  'ठूँठ': { en: 'stump', pos: 'n' },
  'डाकिया': { en: 'postman', pos: 'n' },
  'डोंगी': { en: 'canoe', pos: 'n' },
  'ढेरी': { en: 'heap; pile', pos: 'n' },
  'तंदूर': { en: 'tandoor; oven', pos: 'n' },
  'पट्टी': { en: 'strip; bandage', pos: 'n' },
  'टिप्पणियाँ': { en: 'comments; notes', pos: 'n' },
  'फिरकी': { en: 'spinning top; reel', pos: 'n' },
  'फ़ुटबॉल': { en: 'football; soccer', pos: 'n' },
  'बहादुरी': { en: 'bravery; valor', pos: 'n' },
  'सफ़ाई': { en: 'cleaning; cleanliness', pos: 'n' },
  'दायित्व': { en: 'responsibility; obligation', pos: 'n' },
  'चरखा': { en: 'spinning wheel', pos: 'n' },
  'चरखे': { en: 'spinning wheels', pos: 'n' },
  'चरणस्पर्श': { en: 'touching feet (greeting)', pos: 'n' },
  'विवरण': { en: 'description; details', pos: 'n' },
  'खिलाई': { en: 'fed', pos: 'v', lemma: 'खिलाना' },
  'पकौड़ों': { en: 'pakoras; fritters', pos: 'n' },
  'सबको': { en: 'everyone; to all', pos: 'pron' },
  'बिजली': { en: 'electricity', pos: 'n' },

  // ── ADJECTIVE wrongly tagged as v ───────────────────────────
  'मज़ाकिया': { en: 'funny; humorous', pos: 'adj' },
  'सुनहरे': { en: 'golden', pos: 'adj' },
  'सुनिश्चित': { en: 'ensured; certain', pos: 'adj' },
  'सूचित': { en: 'informed; notified', pos: 'adj' },
  'दोहरा': { en: 'double; dual', pos: 'adj' },
  'समुद्री': { en: 'marine; oceanic', pos: 'adj' },
  'विविध': { en: 'various; diverse', pos: 'adj' },

  // ── Verb forms with GARBLED translations ─────────────────────
  'उड़ा': { en: 'to fly', pos: 'v', lemma: 'उड़ना' },
  'उड़ाते': { en: 'to fly', pos: 'v', lemma: 'उड़ाना' },
  'उड़ाने': { en: 'to fly', pos: 'v', lemma: 'उड़ाना' },
  'उतारकर': { en: 'to take off', pos: 'v', lemma: 'उतारना' },
  'उसी': { en: 'that very; the same', pos: 'pron' },
  'ओसारे': { en: 'porch; veranda', pos: 'n' },
  'कटाई': { en: 'harvesting; cutting', pos: 'n' },
  'कतरकर': { en: 'by cutting', pos: 'v', lemma: 'कतरना' },
  'कमी': { en: 'shortage; deficiency', pos: 'n' },
  'करनी': { en: 'to do', pos: 'v', lemma: 'करना' },
  'करीने': { en: 'neatly; methodically', pos: 'adv' },
  'कागज़ात': { en: 'papers; documents', pos: 'n' },
  'काटता': { en: 'to cut', pos: 'v', lemma: 'काटना' },
  'काटा': { en: 'to cut', pos: 'v', lemma: 'काटना' },
  'काटोगे': { en: 'to cut', pos: 'v', lemma: 'काटना' },
  'काम': { en: 'work; job', pos: 'n' },
  'किसी': { en: 'someone; any', pos: 'pron' },
  'कुल': { en: 'total; overall', pos: 'adj' },
  'कूटो': { en: 'to grind', pos: 'v', lemma: 'कूटना' },
  'ख़ड़ा': { en: 'standing', pos: 'adj' },
  'ख़याल': { en: 'thought; idea', pos: 'n' },
  'ख़रीदकर': { en: 'to buy', pos: 'v', lemma: 'ख़रीदना' },
  'ख़रीदी': { en: 'to buy', pos: 'v', lemma: 'ख़रीदना' },
  'ख़रीदे': { en: 'to buy', pos: 'v', lemma: 'ख़रीदना' },
  'खा': { en: 'to eat', pos: 'v', lemma: 'खाना' },
  'खुलती': { en: 'to open', pos: 'v', lemma: 'खुलना' },
  'खुला': { en: 'open', pos: 'adj' },
  'खुली': { en: 'open', pos: 'adj' },
  'खुले': { en: 'open', pos: 'adj' },
  'खुलेगा': { en: 'to open', pos: 'v', lemma: 'खुलना' },
  'खुलेगी': { en: 'to open', pos: 'v', lemma: 'खुलना' },
  'खेल': { en: 'game; sport', pos: 'n' },
  'खेलो': { en: 'to play', pos: 'v', lemma: 'खेलना' },
  'खींचता': { en: 'to pull; to drag', pos: 'v', lemma: 'खींचना' },
  'खींचना': { en: 'to pull; to drag', pos: 'v' },
  'खींची': { en: 'to pull', pos: 'v', lemma: 'खींचना' },
  'खींचीं': { en: 'to pull', pos: 'v', lemma: 'खींचना' },
  'गाई': { en: 'to sing', pos: 'v', lemma: 'गाना' },
  'गूँज': { en: 'echo; reverberation', pos: 'n' },
  'गूँजी': { en: 'to echo', pos: 'v', lemma: 'गूँजना' },
  'गुँजा': { en: 'to echo', pos: 'v', lemma: 'गूँजना' },
  'गुज़र': { en: 'to pass', pos: 'v', lemma: 'गुज़रना' },
  'गुठलियों': { en: 'kernels; seeds', pos: 'n' },
  'गुणा': { en: 'multiplication; times', pos: 'n' },
  'घंटे': { en: 'hours', pos: 'n' },
  'घुमाओ': { en: 'to rotate; to turn', pos: 'v', lemma: 'घुमाना' },
  'चकले': { en: 'rolling board', pos: 'n' },
  'चलने': { en: 'to walk; to go', pos: 'v', lemma: 'चलना' },
  'चाहता': { en: 'to want', pos: 'v', lemma: 'चाहना' },
  'चाहिए': { en: 'should; need', pos: 'v', lemma: 'चाहना' },
  'छिड़कने': { en: 'to sprinkle', pos: 'v', lemma: 'छिड़कना' },
  'जल्दबाज़ी': { en: 'haste; hurry', pos: 'n' },
  'जुड़े': { en: 'connected; joined', pos: 'adj' },
  'जोड़ों': { en: 'joints', pos: 'n' },
  'झड़': { en: 'to fall off; to shed', pos: 'v', lemma: 'झड़ना' },
  'झाड़कर': { en: 'to sweep; to dust off', pos: 'v', lemma: 'झाड़ना' },
  'झुकाई': { en: 'to bow; to tilt', pos: 'v', lemma: 'झुकाना' },
  'झुलाते': { en: 'to swing', pos: 'v', lemma: 'झुलाना' },
  'झूम': { en: 'to sway', pos: 'v', lemma: 'झूमना' },
  'टिमटिमा': { en: 'to twinkle; to flicker', pos: 'v', lemma: 'टिमटिमाना' },
  'टली': { en: 'to avert; to postpone', pos: 'v', lemma: 'टलना' },
  'ढाई': { en: 'two and a half', pos: 'num' },
  'तड़का': { en: 'tempering; tadka', pos: 'n' },
  'तरह': { en: 'kind; type', pos: 'n' },
  'तह': { en: 'fold; layer', pos: 'n' },
  'ताड़': { en: 'palm tree', pos: 'n' },
  'दवनी': { en: 'dawni', pos: 'n' },
  'दुहकर': { en: 'by milking', pos: 'v', lemma: 'दुहना' },
  'दो': { en: 'two; give', pos: 'num' },
  'दौड़ता': { en: 'to run', pos: 'v', lemma: 'दौड़ना' },
  'दौड़ते': { en: 'to run', pos: 'v', lemma: 'दौड़ना' },
  'दिख': { en: 'to appear; to be seen', pos: 'v', lemma: 'दिखना' },
  'दिखा': { en: 'to show', pos: 'v', lemma: 'दिखाना' },
  'दिलाते': { en: 'to provide; to cause', pos: 'v', lemma: 'दिलाना' },
  'नतीजे': { en: 'results; consequences', pos: 'n' },
  'नागा': { en: 'Naga', pos: 'n' },
  'नहाकर': { en: 'to bathe', pos: 'v', lemma: 'नहाना' },
  'नहाया': { en: 'to bathe', pos: 'v', lemma: 'नहाना' },
  'निकालते': { en: 'to remove; to extract', pos: 'v', lemma: 'निकालना' },
  'निकालना': { en: 'to remove; to extract', pos: 'v' },
  'निकाला': { en: 'to remove', pos: 'v', lemma: 'निकालना' },
  'निकाली': { en: 'to remove', pos: 'v', lemma: 'निकालना' },
  'निकालो': { en: 'to remove', pos: 'v', lemma: 'निकालना' },
  'निकालने': { en: 'to remove; to extract', pos: 'v', lemma: 'निकालना' },
  'निकाले': { en: 'to remove', pos: 'v', lemma: 'निकालना' },
  'निशाना': { en: 'target; aim', pos: 'n' },
  'बता': { en: 'to tell', pos: 'v', lemma: 'बताना' },
  'बना': { en: 'to make', pos: 'v', lemma: 'बनाना' },
  'मान': { en: 'to accept; to believe', pos: 'v', lemma: 'मानना' },
  'मानना': { en: 'to accept; to believe', pos: 'v' },
  'माननी': { en: 'to accept; to believe', pos: 'v', lemma: 'मानना' },
  'रचना': { en: 'composition; creation', pos: 'n' },
  'लगाओ': { en: 'to apply; to put', pos: 'v', lemma: 'लगाना' },
  'लगाता': { en: 'to apply; to put', pos: 'v', lemma: 'लगाना' },
  'लगाते': { en: 'to apply; to put', pos: 'v', lemma: 'लगाना' },
  'लगाना': { en: 'to apply; to put', pos: 'v' },
  'लगाया': { en: 'to apply; to put', pos: 'v', lemma: 'लगाना' },
  'पकड़': { en: 'grip; grasp', pos: 'n' },
  'पकड़ते': { en: 'to catch', pos: 'v', lemma: 'पकड़ना' },
  'पकड़ा': { en: 'to catch', pos: 'v', lemma: 'पकड़ना' },
  'पक': { en: 'to ripen; to cook', pos: 'v', lemma: 'पकना' },
  'पड़': { en: 'to fall; to lie', pos: 'v', lemma: 'पड़ना' },
  'पड़ने': { en: 'to fall; to have to', pos: 'v', lemma: 'पड़ना' },
  'पड़ा': { en: 'to have to', pos: 'v', lemma: 'पड़ना' },
  'पड़ी': { en: 'to have to', pos: 'v', lemma: 'पड़ना' },
  'पड़ेगा': { en: 'will have to', pos: 'v', lemma: 'पड़ना' },
  'पड़ेगी': { en: 'will have to', pos: 'v', lemma: 'पड़ना' },
  'पढ़': { en: 'to read', pos: 'v', lemma: 'पढ़ना' },
  'पढ़े': { en: 'to read', pos: 'v', lemma: 'पढ़ना' },
  'परिस्थिति': { en: 'situation; circumstance', pos: 'n' },
  'पत्तियों': { en: 'leaves', pos: 'n' },
  'पत्ते': { en: 'leaves', pos: 'n' },
  'पहनाई': { en: 'to dress someone', pos: 'v', lemma: 'पहनाना' },
  'पहुँच': { en: 'reach; access', pos: 'n' },
  'पहुँचकर': { en: 'to reach', pos: 'v', lemma: 'पहुँचना' },
  'पहुँचने': { en: 'to reach', pos: 'v', lemma: 'पहुँचना' },
  'पाया': { en: 'to find; to get', pos: 'v', lemma: 'पाना' },
  'पी': { en: 'to drink', pos: 'v', lemma: 'पीना' },
  'पीजिए': { en: 'please drink', pos: 'v', lemma: 'पीना' },
  'पैदल': { en: 'on foot', pos: 'adv' },
  'फ़ायदा': { en: 'advantage; benefit', pos: 'n' },
  'फ़ैसला': { en: 'decision', pos: 'n' },
  'फैलाकर': { en: 'to spread', pos: 'v', lemma: 'फैलाना' },
  'फैलती': { en: 'to spread', pos: 'v', lemma: 'फैलना' },
  'बढ़ती': { en: 'to increase; to grow', pos: 'v', lemma: 'बढ़ना' },
  'बढ़ते': { en: 'to increase; to grow', pos: 'v', lemma: 'बढ़ना' },
  'बट्टे': { en: 'discount; loss', pos: 'n' },
  'बशर्ते': { en: 'provided that', pos: 'conj' },
  'बजाता': { en: 'to play (instrument)', pos: 'v', lemma: 'बजाना' },
  'बजा': { en: 'to ring; to play', pos: 'v', lemma: 'बजाना' },
  'बेलकर': { en: 'to roll (dough)', pos: 'v', lemma: 'बेलना' },
  'बेलो': { en: 'to roll (dough)', pos: 'v', lemma: 'बेलना' },
  'बैठकर': { en: 'to sit', pos: 'v', lemma: 'बैठना' },
  'भगाया': { en: 'to chase away', pos: 'v', lemma: 'भगाना' },
  'भटकते': { en: 'to wander', pos: 'v', lemma: 'भटकना' },
  'भरिए': { en: 'to fill', pos: 'v', lemma: 'भरना' },
  'भाटा': { en: 'ebb; low tide', pos: 'n' },
  'भेड़': { en: 'sheep', pos: 'n' },
  'डिब्बों': { en: 'boxes; compartments', pos: 'n' },
  'डूबा': { en: 'drowned; submerged', pos: 'adj' },
  'लँगड़ाकर': { en: 'by limping', pos: 'v', lemma: 'लँगड़ाना' },
  'लगता': { en: 'to seem; to feel', pos: 'v', lemma: 'लगना' },
  'लगते': { en: 'to seem; to feel', pos: 'v', lemma: 'लगना' },
  'लगाकर': { en: 'to apply; by putting', pos: 'v', lemma: 'लगाना' },
  'लगाने': { en: 'to apply; to put', pos: 'v', lemma: 'लगाना' },
  'लगेगा': { en: 'to seem; to feel', pos: 'v', lemma: 'लगना' },
  'लटकाई': { en: 'to hang', pos: 'v', lemma: 'लटकाना' },
  'लटके': { en: 'to hang', pos: 'v', lemma: 'लटकना' },
  'ला': { en: 'to bring', pos: 'v', lemma: 'लाना' },
  'लाऊँगा': { en: 'to bring', pos: 'v', lemma: 'लाना' },
  'लाओ': { en: 'to bring', pos: 'v', lemma: 'लाना' },
  'लाया': { en: 'to bring', pos: 'v', lemma: 'लाना' },
  'लेकर': { en: 'to take; carrying', pos: 'v', lemma: 'लेना' },
  'लोटपोट': { en: 'rolling (with laughter)', pos: 'adj' },
  'लोटे': { en: 'lota (water vessel)', pos: 'n' },
  'वज़न': { en: 'weight', pos: 'n' },
  'वर्ग': { en: 'class; category', pos: 'n' },
  'शुद्ध': { en: 'pure; clean', pos: 'adj' },
  'संस्कारों': { en: 'rituals; values', pos: 'n' },
  'मिनट': { en: 'minute', pos: 'n' },
  'मिल': { en: 'mill; factory', pos: 'n' },
  'मिलकर': { en: 'together', pos: 'adv' },
  'मिलने': { en: 'to meet', pos: 'v', lemma: 'मिलना' },
  'मुहरें': { en: 'seals; stamps', pos: 'n' },
  'मौसम': { en: 'weather; season', pos: 'n' },
  'यंत्र': { en: 'machine; instrument', pos: 'n' },
  'रसीले': { en: 'juicy; succulent', pos: 'adj' },
  'रसोइए': { en: 'cook; chef', pos: 'n' },
  'रसोइया': { en: 'cook; chef', pos: 'n' },
  'रसोइये': { en: 'cook; chef', pos: 'n' },
  'सत': { en: 'essence; truth', pos: 'n' },
  'समझ': { en: 'understanding', pos: 'n' },
  'सराही': { en: 'to appreciate', pos: 'v', lemma: 'सराहना' },
  'सोने': { en: 'to sleep; gold', pos: 'v', lemma: 'सोना' },
  'सुनाया': { en: 'to narrate; to tell', pos: 'v', lemma: 'सुनाना' },
  'सेंक': { en: 'to warm; to bake', pos: 'v', lemma: 'सेंकना' },
  'सेंको': { en: 'to bake; to roast', pos: 'v', lemma: 'सेंकना' },
  'हारी': { en: 'to lose', pos: 'v', lemma: 'हारना' },
  'मसाला': { en: 'spice; masala', pos: 'n' },
  'डाल': { en: 'to pour; to put', pos: 'v', lemma: 'डालना' },
  'मज़ा': { en: 'fun; enjoyment', pos: 'n' },
  'फिसलने': { en: 'to slip; to slide', pos: 'v', lemma: 'फिसलना' },
  'चबाने': { en: 'to chew', pos: 'v', lemma: 'चबाना' },
  'तलकर': { en: 'to fry; by frying', pos: 'v', lemma: 'तलना' },
  'भूनकर': { en: 'to roast; by roasting', pos: 'v', lemma: 'भूनना' },
  'धोकर': { en: 'to wash; after washing', pos: 'v', lemma: 'धोना' },
  'बूँदें': { en: 'drops', pos: 'n' },
  'जलाई': { en: 'to light; to burn', pos: 'v', lemma: 'जलाना' },
  'मापा': { en: 'to measure', pos: 'v', lemma: 'मापना' },
  'खींचकर': { en: 'to pull; by pulling', pos: 'v', lemma: 'खींचना' },
  'काटने': { en: 'to cut', pos: 'v', lemma: 'काटना' },
  'टहलते': { en: 'to stroll; to walk', pos: 'v', lemma: 'टहलना' },

  // ── More garbage/wrong entries found in full scan ───────────
  'आयात': { en: 'import', pos: 'n' },
  'पक्षों': { en: 'sides; parties', pos: 'n' },
  'माँगा': { en: 'to ask for; to demand', pos: 'v', lemma: 'माँगना' },
  'माँगी': { en: 'to ask for', pos: 'v', lemma: 'माँगना' },
};

// ─── Apply fixes ──────────────────────────────────────────────────────────────
const fixes = [];
const issueCounts = {
  'to-prefix-on-non-verb': 0,
  'bad-verb-form': 0,
  'garbage-semicolon': 0,
  'wrong-meaning': 0,
  'wrong-pos': 0,
};

for (const e of entries) {
  const fix = FIXES[e.key];
  if (!fix) continue;

  // Check if anything actually changes
  const enChanged = fix.en !== e.en;
  const posChanged = fix.pos !== e.pos;
  const lemmaChanged = fix.lemma !== undefined && fix.lemma !== e.lemma;

  if (!enChanged && !posChanged && !lemmaChanged) continue;

  // Classify issue type
  let issueType;
  if (e.en.startsWith('to ') && fix.pos !== 'v') {
    issueType = 'to-prefix-on-non-verb';
  } else if (e.en.includes(';') && fix.en !== e.en) {
    issueType = 'garbage-semicolon';
  } else if (e.en.startsWith('to ') && fix.en.startsWith('to ') && fix.en !== e.en) {
    issueType = 'bad-verb-form';
  } else if (posChanged && !enChanged) {
    issueType = 'wrong-pos';
  } else {
    issueType = 'wrong-meaning';
  }

  const note = `Hindi review pass 2`;
  fixes.push({
    key: e.key,
    issueType,
    note,
    old: { en: e.en, pos: e.pos },
    new: { en: fix.en, pos: fix.pos, lemma: fix.lemma || null },
  });

  if (issueCounts[issueType] !== undefined) issueCounts[issueType]++;
}

console.log(`\nTotal fixes (pass 2): ${fixes.length}`);
console.log('By issue type:');
for (const [type, count] of Object.entries(issueCounts)) {
  if (count > 0) console.log(`  ${type}: ${count}`);
}

// ─── Merge with pass 1 fixes ──────────────────────────────────────────────────
let existingFixes = [];
if (fs.existsSync(OUTPUT_PATH)) {
  existingFixes = JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf8'));
}
const existingKeys = new Set(existingFixes.map(f => f.key));
const newFixes = fixes.filter(f => !existingKeys.has(f.key));
const allFixes = [...existingFixes, ...newFixes];

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(allFixes, null, 2));
console.log(`\nMerged: ${existingFixes.length} existing + ${newFixes.length} new = ${allFixes.length} total`);
console.log(`Wrote to ${OUTPUT_PATH}`);

// ─── Apply to hi.ts ───────────────────────────────────────────────────────────
let patched = fs.readFileSync(DICT_PATH, 'utf8');
let applied = 0;

for (const fix of fixes) {
  const key = fix.key;
  const oldEn = fix.old.en.replace(/'/g, "\\'");
  const newEn = fix.new.en.replace(/'/g, "\\'");
  const oldPos = fix.old.pos;
  const newPos = fix.new.pos;

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Replace en value
  const enPattern = new RegExp(
    `(['"]${escapedKey}['"]\\s*:\\s*\\{[^}]*?)en:\\s*'${oldEn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`,
  );

  let newPatched = patched.replace(enPattern, `$1en: '${newEn}'`);

  // Replace pos if different
  if (oldPos !== newPos) {
    const posPattern = new RegExp(
      `(['"]${escapedKey}['"]\\s*:\\s*\\{[^}]*?)pos:\\s*'${oldPos}'`,
    );
    newPatched = newPatched.replace(posPattern, `$1pos: '${newPos}'`);
  }

  // Add lemma if specified and not already present
  if (fix.new.lemma) {
    const lemmaExistPattern = new RegExp(
      `['"]${escapedKey}['"]\\s*:\\s*\\{[^}]*lemma:`
    );
    if (!lemmaExistPattern.test(newPatched)) {
      // Add lemma before the closing brace
      const addLemmaPattern = new RegExp(
        `(['"]${escapedKey}['"]\\s*:\\s*\\{[^}]*pos:\\s*'[^']*')(\\s*\\})`,
      );
      newPatched = newPatched.replace(addLemmaPattern, `$1, lemma: '${fix.new.lemma}'$2`);
    }
  }

  if (newPatched !== patched) {
    patched = newPatched;
    applied++;
  }
}

if (applied > 0) {
  fs.writeFileSync(DICT_PATH, patched);
  console.log(`Applied ${applied} fixes to ${DICT_PATH}`);
} else {
  console.log('No additional fixes applied.');
}
