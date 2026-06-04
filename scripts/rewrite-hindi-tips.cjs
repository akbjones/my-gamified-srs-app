#!/usr/bin/env node
/* Rewrite the 18 distinct Hindi grammar tips in node-01 (which also cover
 * node-02 since the same tips are reused there) into the new format:
 *
 *   – ≤120 chars
 *   – ONE rule per tip
 *   – Romanization in parens alongside Devanagari
 *   – One worked example
 *   – No grammar jargon ("postposition" → "position word", "auxiliary" → just is/are)
 */
const fs = require('fs');
const path = 'src/data/hindi/deck.json';
const deck = JSON.parse(fs.readFileSync(path, 'utf-8'));

const rewrites = new Map([
  [
    "Hindi sentences end with the auxiliary `है` (is) or `हैं` (are/respect). Word order: Subject – object – verb – auxiliary. `मैं हिंदी पढ़ता हूँ` literally = 'I Hindi learn-m am' = 'I learn Hindi'.",
    "Hindi ends sentences with है (hai = is) or हैं (hain = are/respect). Example: मेरी बहन डॉक्टर है (My sister is a doctor)."
  ],
  [
    "Hindi verbs agree with the SPEAKER's gender. Men say `मैं करता हूँ` (I do – m), women say `मैं करती हूँ` (I do – f). English verbs don't gender; Hindi does – every present-tense sentence.",
    "Verbs change with the SPEAKER's gender. Men: मैं करता हूँ (main karta hun). Women: मैं करती हूँ (main karti hun). The -ता/-ती ending switches."
  ],
  [
    "Endings to memorise: -ता (m sg), -ती (f sg), -ते (m pl OR respect). Same root, three endings. `जाता` (he goes), `जाती` (she goes), `जाते` (they go / you-respect go).",
    "Three present endings: -ता (m sg), -ती (f sg), -ते (m plural / respect). जाता / जाती / जाते = he goes / she goes / they go."
  ],
  [
    "Easy mistake: a woman saying `मैं करता हूँ` sounds wrong to a native. Match the participle to YOUR gender as the speaker – every time, no exceptions.",
    "Common mistake: a woman saying मैं करता हूँ sounds wrong. Always match the ending to YOUR own gender as the speaker."
  ],
  [
    "When in doubt with formal/plural: use `-ते`. `आप क्या करते हैं?` = 'What do you do?' (respectful, plural-shaped). The plural-style ending doubles as the polite form.",
    "For polite आप or plural, use -ते: आप क्या करते हैं? (aap kya karte hain = What do you do?). Plural ending also signals respect."
  ],
  [
    "Even in third person, the verb tracks the subject's gender: `राम जाता है` (Ram goes – m), `सीता जाती है` (Sita goes – f). Hindi puts gender everywhere English hides it.",
    "Third-person verbs still mark gender: राम जाता है (Ram goes, m) vs सीता जाती है (Sita goes, f). Subject's gender drives the ending."
  ],
  [
    "Auxiliary placement is non-negotiable: it's always the LAST word. English puts 'is/are' between subject and rest; Hindi shoves it to the end. Watch for `है/हैं/हूँ/हो` as the tell.",
    "है/हैं/हूँ/हो always sits at the END of the sentence in Hindi. Not in the middle like English is/are."
  ],
  [
    "Don't skip the auxiliary – `मैं डॉक्टर` alone isn't a sentence; you need `हूँ` at the end: `मैं डॉक्टर हूँ` (I am a doctor). The auxiliary carries 'is/am/are'.",
    "Never drop है/हैं/हूँ. मैं डॉक्टर is not a sentence – you need मैं डॉक्टर हूँ (main doctor hun = I am a doctor)."
  ],
  [
    "Hindi puts position words AFTER the noun. `घर में` literally = 'house in' = 'in the house'. Flip the English order in your head: noun first, position word second.",
    "Hindi position words come AFTER the noun. घर में (ghar mein) = 'house in' = 'in the house'. Flip the English order."
  ],
  [
    "Common postpositions: `में` (in), `पर` (on), `से` (from/by), `को` (to), `तक` (until/up to). Each forces the noun before it into 'oblique' form (vowel changes).",
    "Common position words: में (in), पर (on), से (from), को (to), तक (until). Each makes the noun before it change form slightly."
  ],
  [
    "Six present-tense auxiliaries: हूँ (I am), है (he/she/it is), हैं (we/they/you-respect are), हो (you-informal are). Pick the one matching the subject's person and respect level.",
    "Pick auxiliary by subject: मैं → हूँ (main hun), वह/यह → है (hai), हम/वे/आप → हैं (hain), तुम → हो (ho)."
  ],
  [
    "Compound postpositions chain `के`: `के लिए` (for), `के पास` (near), `के साथ` (with), `के बारे में` (about). Memorise as fixed phrases – they're everywhere.",
    "के + word = common compounds. के लिए (ke liye = for), के पास (ke paas = near), के साथ (ke saath = with). Learn each as one chunk."
  ],
  [
    "After a postposition, the noun shifts case: `लड़का` (boy) → `लड़के को` (to the boy). The -ा becomes -े because of the following postposition. Sneaky shift.",
    "Before a position word, a -ा masculine noun shifts to -े. लड़का (ladka = boy) → लड़के को (ladke ko = to the boy)."
  ],
  [
    "Two-word concept becomes three in Hindi: `for the boy` = `लड़के के लिए` – three pieces. English squishes 'for' onto a single word; Hindi spreads it.",
    "'For the boy' needs THREE Hindi words: लड़के के लिए (ladke ke liye). Owner + linker के + relation word लिए."
  ],
  [
    "Greetings to know: `नमस्ते` (formal hi/bye), `अलविदा` (formal goodbye), `अंकल / आंटी` (address older relatives or unrelated adults).",
    "Greetings: नमस्ते (namaste = hello/bye, formal), अलविदा (alvida = goodbye). Older adults: अंकल (uncle), आंटी (aunty)."
  ],
  [
    "Family terms: `भाई` (brother), `बहन` (sister), `माँ / मम्मी` (mother), `पिता / पापा` (father), `चाचा / मामा / फूफा` (different uncles).",
    "Family basics: भाई (bhai = brother), बहन (behen = sister), माँ (maa = mother), पिता (pita = father). Hindi has many uncle words by side."
  ],
  [
    "Days/time markers: `आज` (today), `कल` (yesterday OR tomorrow – context decides), `अभी` (now), `फिर` (then/again). `कल` is the funny one.",
    "Time words: आज (aaj = today), कल (kal = yesterday OR tomorrow, context tells you), अभी (abhi = now), फिर (phir = then/again)."
  ],
  [
    "Questions: `क्या` (what / yes-no marker), `कौन` (who), `कब` (when), `कहाँ` (where), `क्यों` (why), `कैसे` (how). All start with क-.",
    "Question words all start with क-: क्या (kya = what), कौन (kaun = who), कब (kab = when), कहाँ (kahaan = where), क्यों (kyon = why), कैसे (kaise = how)."
  ],
]);

let replaced = 0;
let unmatched = new Map();
for (const card of deck) {
  if (!card.grammar) continue;
  if (rewrites.has(card.grammar)) {
    card.grammar = rewrites.get(card.grammar);
    replaced++;
  } else if (card.grammarNode === 'node-01' || card.grammarNode === 'node-02') {
    unmatched.set(card.grammar, (unmatched.get(card.grammar) || 0) + 1);
  }
}

fs.writeFileSync(path, JSON.stringify(deck, null, 2));
console.log('Tips replaced:', replaced);
if (unmatched.size > 0) {
  console.log('Unmatched tips still in node-01/02:');
  for (const [t, n] of unmatched) console.log('  ('+n+'x) '+t.slice(0, 80));
}
