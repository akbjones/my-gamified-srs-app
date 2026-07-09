/**
 * Generator + validator for Greek pilot slice D (el-0226..el-0300, node-04).
 * Emits scripts/tmp/el-cards-D.json and scripts/tmp/el-dict-D.json.
 */
const fs = require('fs');
const path = require('path');

// ── engine replica (mirrors src/data/conjugation/el.ts) ──────────────
const normalizeGreek = (t) => t.toLowerCase().replace(/ς/g, 'σ');
const stripAccents = (t) => t.normalize('NFD').replace(/[̀-ͅ]/g, '').normalize('NFC');

const IRREGULARS = {
  'είμαι': ['είμαι', 'είσαι', 'είναι', 'είμαστε', 'είστε', 'είναι'],
  'έχω': ['έχω', 'έχεις', 'έχει', 'έχουμε', 'έχετε', 'έχουν'],
  'πάω': ['πάω', 'πας', 'πάει', 'πάμε', 'πάτε', 'πάνε'],
  'λέω': ['λέω', 'λες', 'λέει', 'λέμε', 'λέτε', 'λένε'],
  'τρώω': ['τρώω', 'τρως', 'τρώει', 'τρώμε', 'τρώτε', 'τρώνε'],
  'ακούω': ['ακούω', 'ακούς', 'ακούει', 'ακούμε', 'ακούτε', 'ακούνε'],
};

function conjugate(lemma) {
  if (!lemma) return null;
  const w = lemma.toLowerCase().trim();
  if (IRREGULARS[w]) return { infinitive: w, forms: [...IRREGULARS[w]] };
  if (w.endsWith('άω')) {
    const s = w.slice(0, -2);
    return { infinitive: w, forms: [`${s}άω`, `${s}άς`, `${s}άει`, `${s}άμε`, `${s}άτε`, `${s}άνε`] };
  }
  if (w.endsWith('ω')) {
    const s = w.slice(0, -1);
    return { infinitive: w, forms: [`${s}ω`, `${s}εις`, `${s}ει`, `${s}ουμε`, `${s}ετε`, `${s}ουν`] };
  }
  if (w.endsWith('ομαι')) {
    const s = w.slice(0, -4);
    return { infinitive: w, forms: [`${s}ομαι`, `${s}εσαι`, `${s}εται`, `${s}όμαστε`, `${s}εστε`, `${s}ονται`] };
  }
  return null;
}

let REVERSE = null;
function buildReverse() {
  const m = new Map();
  for (const lemma of Object.keys(IRREGULARS)) {
    const t = conjugate(lemma);
    for (const f of t.forms) {
      const key = normalizeGreek(f);
      if (!m.has(key)) m.set(key, lemma);
      const bare = stripAccents(key);
      if (!m.has(bare)) m.set(bare, lemma);
    }
  }
  return m;
}

const ENDINGS = [
  ['όμαστε', 'ομαι'], ['ουμε', 'ω'], ['ετε', 'ω'], ['ουν', 'ω'], ['ουνε', 'ω'],
  ['εις', 'ω'], ['ει', 'ω'],
  ['άμε', 'άω'], ['άτε', 'άω'], ['άνε', 'άω'], ['άς', 'άω'], ['άει', 'άω'],
  ['εσαι', 'ομαι'], ['εται', 'ομαι'], ['εστε', 'ομαι'], ['ονται', 'ομαι'],
];

function findInfinitive(form) {
  if (!form) return null;
  const w = normalizeGreek(form.trim());
  if (!REVERSE) REVERSE = buildReverse();
  const hit = REVERSE.get(w) ?? REVERSE.get(stripAccents(w));
  if (hit) return hit;
  if (conjugate(w)) return w;
  for (const [ending, repl] of ENDINGS) {
    const e = normalizeGreek(ending);
    if (w.endsWith(e) && w.length > e.length + 1) {
      const cand = w.slice(0, -e.length) + repl;
      if (conjugate(cand)) return cand;
    }
  }
  return null;
}

// ── cards: [target, english, extraTags[], grammar?] ──────────────────
const CARDS = [
  // Eating & drinking (226–240)
  ['Τρώω ψωμί με τυρί.', 'I eat bread with cheese.', [],
    'τρώω (eat) is irregular: τρως, τρώει, τρώμε — Τρώει ψωμί (He eats bread).'],
  ['Πίνω νερό κάθε μέρα.', 'I drink water every day.', [],
    'Verbs in -ω change endings by person: πίνω = I drink, πίνεις = you drink.'],
  ['Το πρωί πίνω καφέ.', 'In the morning I drink coffee.', []],
  ['Εσύ τρως κρέας;', 'Do you eat meat?', []],
  ['Δεν τρώω ψάρι.', "I don't eat fish.", []],
  ['Πίνουμε τσάι το απόγευμα.', 'We drink tea in the afternoon.', [],
    "The 'we' ending for -ω verbs is -ουμε: πίνουμε = we drink."],
  ['Το παιδί τρώει ένα μήλο.', 'The child eats an apple.', ['family']],
  ['Τρώμε μαζί το βράδυ.', 'We eat together in the evening.', ['family']],
  ['Πεινάω πολύ τώρα.', 'I am very hungry now.', [],
    'Hunger is a verb in Greek: Πεινάω πολύ = I am very hungry.'],
  ['Διψάει το μωρό;', 'Is the baby thirsty?', ['family']],
  ['Η σαλάτα έχει ντομάτα και ελιές.', 'The salad has tomato and olives.', []],
  ['Το τυρί εδώ είναι πολύ καλό.', 'The cheese here is very good.', []],
  ['Πίνεις κρασί με το φαγητό;', 'Do you drink wine with the food?', []],
  ['Τρώνε σουβλάκι στην πλατεία.', 'They eat souvlaki in the square.', ['travel']],
  ['Το πρωινό είναι έτοιμο.', 'Breakfast is ready.', ['family']],
  // Ordering (241–252)
  ['Έναν καφέ, παρακαλώ.', 'One coffee, please.', ['travel'],
    "Ordering uses the 'asking-for' form: ένας καφές → Έναν καφέ, παρακαλώ (One coffee, please)."],
  ['Μία μπύρα, παρακαλώ.', 'One beer, please.', ['travel']],
  ['Ένα τσάι με λεμόνι, παρακαλώ.', 'One tea with lemon, please.', ['travel']],
  ['Τον λογαριασμό, παρακαλώ.', 'The bill, please.', ['travel'],
    'Name what you want in its ordering form: ο λογαριασμός → Τον λογαριασμό, παρακαλώ.'],
  ['Θέλω μία χωριάτικη σαλάτα.', 'I want a Greek salad.', ['travel']],
  ['Έχετε μενού στα αγγλικά;', 'Do you have a menu in English?', ['travel'],
    'σε + τα joins into στα: στα αγγλικά (in English).'],
  ['Τι θέλετε, παρακαλώ;', 'What do you want, please?', ['travel']],
  ['Ένα νερό και δύο καφέδες, παρακαλώ.', 'One water and two coffees, please.', ['travel']],
  ['Ο καφές εδώ είναι πολύ ακριβός.', 'The coffee here is very expensive.', ['travel']],
  ['Θέλουμε ένα τραπέζι για τέσσερα άτομα.', 'We want a table for four people.', ['travel']],
  ['Μία πορτοκαλάδα για το παιδί, παρακαλώ.', 'One orangeade for the child, please.', ['travel', 'family']],
  ['Το φαγητό είναι πολύ νόστιμο, ευχαριστώ.', 'The food is very tasty, thank you.', ['travel']],
  // Going places (253–264)
  ['Πάω στην αγορά το πρωί.', 'I go to the market in the morning.', [],
    "σε joins with 'the': σε + την → στην. Πάω στην αγορά (I go to the market)."],
  ['Πάμε στην ταβέρνα απόψε;', 'Are we going to the taverna tonight?', ['travel']],
  ['Πας στη δουλειά με το λεωφορείο;', 'Do you go to work by bus?', ['work'],
    'Before many sounds την loses its ν: στη δουλειά (to work), not στην.'],
  ['Πάει στο σχολείο με τα πόδια.', 'He goes to school on foot.', ['family']],
  ['Πάμε μαζί στο σινεμά.', 'We are going to the cinema together.', []],
  ['Το απόγευμα πάω στον φούρνο.', 'In the afternoon I go to the bakery.', [],
    'With masculine words: σε + τον → στον. Πάω στον φούρνο (I go to the bakery).'],
  ['Πάνε στην παραλία κάθε Σάββατο.', 'They go to the beach every Saturday.', ['travel'],
    'πάω (go) is irregular: πάμε, πάτε, πάνε — Πάνε στην παραλία (They go to the beach).'],
  ['Η τράπεζα είναι δίπλα στο ξενοδοχείο.', 'The bank is next to the hotel.', ['travel']],
  ['Πώς πάτε στο κέντρο;', 'How do you go to the center?', ['travel']],
  ['Έρχομαι στο σπίτι σου το βράδυ.', 'I am coming to your house in the evening.', ['family'],
    'Some verbs end in -ομαι: έρχομαι = I come, ερχόμαστε = we come.'],
  ['Ερχόμαστε από την Αθήνα.', 'We come from Athens.', ['travel']],
  ['Το μαγαζί είναι κοντά στην πλατεία.', 'The shop is near the square.', ['travel']],
  // Daily routine (265–282)
  ['Ξυπνάω στις εφτά κάθε μέρα.', 'I wake up at seven every day.', [],
    'Clock times use στις: Ξυπνάω στις εφτά (I wake up at seven).'],
  ['Δουλεύω από το σπίτι σήμερα.', 'I am working from home today.', ['work']],
  ['Δουλεύεις το Σάββατο;', 'Do you work on Saturday?', ['work']],
  ['Μιλάω με τη μητέρα μου κάθε βράδυ.', 'I speak with my mother every evening.', ['family'],
    'Verbs in -άω: μιλάω = I speak, μιλάς = you speak, μιλάει = he speaks.'],
  ['Αγοράζω φρούτα από την αγορά.', 'I buy fruit from the market.', []],
  ['Μαγειρεύω μακαρόνια για τα παιδιά.', 'I cook pasta for the children.', ['family']],
  ['Η γιαγιά μαγειρεύει πολύ καλά.', 'Grandma cooks very well.', ['family']],
  ['Ψωνίζουμε μαζί την Παρασκευή.', 'We shop together on Friday.', [],
    "Days take 'the' for 'on': την Παρασκευή = on Friday."],
  ['Διαβάζω εφημερίδα με τον καφέ μου.', 'I read a newspaper with my coffee.', []],
  ['Ακούω μουσική όταν μαγειρεύω.', 'I listen to music when I cook.', []],
  ['Ο άντρας μου φτιάχνει το πρωινό.', 'My husband makes breakfast.', ['family']],
  ['Δουλεύει σε ένα γραφείο στο κέντρο.', 'She works in an office in the center.', ['work']],
  ['Μιλάμε για τη δουλειά στο μεσημεριανό.', 'We talk about work at lunch.', ['work']],
  ['Αγοράζεις ψωμί από τον φούρνο;', 'Do you buy bread from the bakery?', []],
  ['Το βράδυ βλέπουμε τηλεόραση.', 'In the evening we watch television.', ['family']],
  ['Τελειώνω τη δουλειά στις έξι.', 'I finish work at six.', ['work']],
  ['Μετά το φαγητό πίνω έναν καφέ.', 'After the meal I drink a coffee.', []],
  ['Κάθε Κυριακή τρώμε με τη γιαγιά.', 'Every Sunday we eat with grandma.', ['family']],
  // θα + present plans (283–292)
  ['Θα πάω αύριο στην τράπεζα.', 'I will go to the bank tomorrow.', [],
    'θα before the verb makes the future: Θα πάω αύριο (I will go tomorrow).'],
  ['Θα μαγειρεύω εγώ αυτή την εβδομάδα.', 'I will be cooking this week.', ['family']],
  ['Θα δουλεύω από το σπίτι την Τρίτη.', 'I will be working from home on Tuesday.', ['work']],
  ['Από τώρα θα ψωνίζουμε στην αγορά.', 'From now on we will shop at the market.', []],
  ['Θα τρώμε έξω κάθε Παρασκευή.', 'We will eat out every Friday.', []],
  ['Θα πάμε στην Ελλάδα το καλοκαίρι.', 'We will go to Greece in the summer.', ['travel']],
  ['Θα πίνουμε καφέ μαζί κάθε πρωί.', 'We will drink coffee together every morning.', []],
  ['Δεν θα δουλεύω την Πέμπτη.', 'I will not be working on Thursday.', ['work'],
    "For 'will not', δεν comes before θα: Δεν θα δουλεύω (I will not be working)."],
  ['Θα μιλάω ελληνικά κάθε μέρα.', 'I will speak Greek every day.', []],
  ['Θα είμαι στο σπίτι το απόγευμα.', 'I will be at home in the afternoon.', [],
    'θα works with είμαι too: Θα είμαι στο σπίτι (I will be at home).'],
  // Likes: μου αρέσει + noun (293–300)
  ['Μου αρέσει ο ελληνικός καφές.', 'I like Greek coffee.', [],
    'Liking is a fixed pattern: μου αρέσει + thing. Μου αρέσει ο καφές (I like coffee).'],
  ['Μου αρέσει πολύ το τυρί.', 'I like cheese a lot.', []],
  ['Σου αρέσει η ελληνική μουσική;', 'Do you like Greek music?', [],
    'Swap the first word for who likes: Σου αρέσει η μουσική; (Do you like music?)'],
  ['Δεν μου αρέσει το ψάρι.', "I don't like fish.", [],
    "δεν comes first in dislikes: Δεν μου αρέσει το ψάρι (I don't like fish)."],
  ['Μας αρέσει η θάλασσα το καλοκαίρι.', 'We like the sea in the summer.', ['travel']],
  ['Του αρέσει το σουβλάκι με πίτα.', 'He likes souvlaki with pita.', []],
  ['Της αρέσει να μαγειρεύει για όλους.', 'She likes to cook for everyone.', ['family'],
    'μου αρέσει να + verb = liking to do something: Της αρέσει να μαγειρεύει (She likes to cook).'],
  ['Μου αρέσει να διαβάζω το βράδυ.', 'I like to read in the evening.', []],
];

// ── dictionary (keys σ-normalized + lowercase + accented) ────────────
const DICT = {
  // articles, particles, prepositions, pronouns
  'ο': { en: 'the (masculine)', ipa: 'o', pos: 'det' },
  'η': { en: 'the (feminine)', ipa: 'i', pos: 'det' },
  'το': { en: 'the (neuter)', ipa: 'to', pos: 'det' },
  'τα': { en: 'the (neuter plural)', ipa: 'ta', pos: 'det' },
  'τον': { en: 'the (masculine, ordering/object form)', ipa: 'ton', pos: 'det' },
  'την': { en: 'the (feminine, ordering/object form)', ipa: 'tin', pos: 'det' },
  'τη': { en: 'the (feminine object form, ν dropped)', ipa: 'ti', pos: 'det' },
  'και': { en: 'and', ipa: 'ce', pos: 'conj' },
  'με': { en: 'with', ipa: 'me', pos: 'prep' },
  'σε': { en: 'in; to; at', ipa: 'se', pos: 'prep' },
  'στο': { en: 'to the; at the (neuter)', ipa: 'sto', pos: 'prep' },
  'στη': { en: 'to the; at the (feminine)', ipa: 'sti', pos: 'prep' },
  'στην': { en: 'to the; at the (feminine)', ipa: 'stin', pos: 'prep' },
  'στον': { en: 'to the; at the (masculine)', ipa: 'ston', pos: 'prep' },
  'στα': { en: 'in the; to the (neuter plural)', ipa: 'sta', pos: 'prep' },
  'στισ': { en: 'at (clock times); to the (feminine plural)', ipa: 'stis', pos: 'prep' },
  'για': { en: 'for; about', ipa: 'ʝa', pos: 'prep' },
  'από': { en: 'from', ipa: 'aˈpo', pos: 'prep' },
  'μετά': { en: 'after', ipa: 'meˈta', pos: 'prep' },
  'δεν': { en: 'not (with verbs)', ipa: 'ðen', pos: 'part' },
  'θα': { en: 'will (future marker)', ipa: 'θa', pos: 'part' },
  'να': { en: 'to (links two verbs)', ipa: 'na', pos: 'part' },
  'τι': { en: 'what', ipa: 'ti', pos: 'pron' },
  'πώσ': { en: 'how', ipa: 'pos', pos: 'adv' },
  'εγώ': { en: 'I', ipa: 'eˈɣo', pos: 'pron' },
  'εσύ': { en: 'you (singular)', ipa: 'eˈsi', pos: 'pron' },
  'αυτή': { en: 'she; this (feminine)', ipa: 'afˈti', pos: 'pron' },
  'μου': { en: 'my; to me', ipa: 'mu', pos: 'pron' },
  'σου': { en: 'your; to you', ipa: 'su', pos: 'pron' },
  'μασ': { en: 'our; to us', ipa: 'mas', pos: 'pron' },
  'του': { en: 'his; to him', ipa: 'tu', pos: 'pron' },
  'τησ': { en: 'her; to her', ipa: 'tis', pos: 'pron' },
  'όλουσ': { en: 'everyone (object form)', ipa: 'ˈolus', pos: 'pron' },
  'κάθε': { en: 'every', ipa: 'ˈkaθe', pos: 'det' },
  'όταν': { en: 'when', ipa: 'ˈotan', pos: 'conj' },
  // numbers
  'ένα': { en: 'one; a (neuter)', ipa: 'ˈena', pos: 'num' },
  'ένασ': { en: 'one; a (masculine)', ipa: 'ˈenas', pos: 'num' },
  'έναν': { en: 'one; a (masculine, ordering/object form)', ipa: 'ˈenan', pos: 'num' },
  'μία': { en: 'one; a (feminine)', ipa: 'ˈmia', pos: 'num' },
  'δύο': { en: 'two', ipa: 'ˈðio', pos: 'num' },
  'τέσσερα': { en: 'four', ipa: 'ˈtesera', pos: 'num' },
  'έξι': { en: 'six', ipa: 'ˈeksi', pos: 'num' },
  'εφτά': { en: 'seven', ipa: 'efˈta', pos: 'num' },
  // adverbs
  'εδώ': { en: 'here', ipa: 'eˈðo', pos: 'adv' },
  'πολύ': { en: 'very; a lot', ipa: 'poˈli', pos: 'adv' },
  'τώρα': { en: 'now', ipa: 'ˈtora', pos: 'adv' },
  'μαζί': { en: 'together', ipa: 'maˈzi', pos: 'adv' },
  'σήμερα': { en: 'today', ipa: 'ˈsimera', pos: 'adv' },
  'αύριο': { en: 'tomorrow', ipa: 'ˈavrio', pos: 'adv' },
  'απόψε': { en: 'tonight', ipa: 'aˈpopse', pos: 'adv' },
  'κοντά': { en: 'near', ipa: 'koˈnda', pos: 'adv' },
  'δίπλα': { en: 'next to', ipa: 'ˈðipla', pos: 'adv' },
  'έξω': { en: 'out; outside', ipa: 'ˈekso', pos: 'adv' },
  'καλά': { en: 'well', ipa: 'kaˈla', pos: 'adv' },
  // interjections
  'παρακαλώ': { en: 'please', ipa: 'parakaˈlo', pos: 'interj' },
  'ευχαριστώ': { en: 'thank you', ipa: 'efxariˈsto', pos: 'interj' },
  // adjectives
  'καλό': { en: 'good (neuter)', ipa: 'kaˈlo', pos: 'adj' },
  'έτοιμο': { en: 'ready (neuter)', ipa: 'ˈetimo', pos: 'adj' },
  'νόστιμο': { en: 'tasty (neuter)', ipa: 'ˈnostimo', pos: 'adj' },
  'ακριβόσ': { en: 'expensive', ipa: 'akriˈvos', pos: 'adj' },
  'χωριάτικη': { en: 'village-style; Greek (of a salad)', ipa: 'xoˈrʝatici', pos: 'adj' },
  'ελληνικόσ': { en: 'Greek (masculine)', ipa: 'eliniˈkos', pos: 'adj' },
  'ελληνική': { en: 'Greek (feminine)', ipa: 'eliniˈci', pos: 'adj' },
  // food & drink nouns
  'ψωμί': { en: 'bread', ipa: 'psoˈmi', pos: 'n' },
  'τυρί': { en: 'cheese', ipa: 'tiˈri', pos: 'n' },
  'νερό': { en: 'water', ipa: 'neˈro', pos: 'n' },
  'καφέσ': { en: 'coffee', ipa: 'kaˈfes', pos: 'n' },
  'καφέ': { en: 'coffee (ordering/object form)', ipa: 'kaˈfe', pos: 'n' },
  'καφέδεσ': { en: 'coffees', ipa: 'kaˈfeðes', pos: 'n' },
  'κρέασ': { en: 'meat', ipa: 'ˈkreas', pos: 'n' },
  'ψάρι': { en: 'fish', ipa: 'ˈpsari', pos: 'n' },
  'τσάι': { en: 'tea', ipa: 'ˈtsai', pos: 'n' },
  'μήλο': { en: 'apple', ipa: 'ˈmilo', pos: 'n' },
  'σαλάτα': { en: 'salad', ipa: 'saˈlata', pos: 'n' },
  'ντομάτα': { en: 'tomato', ipa: 'doˈmata', pos: 'n' },
  'ελιέσ': { en: 'olives', ipa: 'eˈʎes', pos: 'n' },
  'κρασί': { en: 'wine', ipa: 'kraˈsi', pos: 'n' },
  'φαγητό': { en: 'food; meal', ipa: 'faʝiˈto', pos: 'n' },
  'σουβλάκι': { en: 'souvlaki', ipa: 'suˈvlaci', pos: 'n' },
  'πρωινό': { en: 'breakfast', ipa: 'proiˈno', pos: 'n' },
  'μεσημεριανό': { en: 'lunch', ipa: 'mesimerʝaˈno', pos: 'n' },
  'μπύρα': { en: 'beer', ipa: 'ˈbira', pos: 'n' },
  'λεμόνι': { en: 'lemon', ipa: 'leˈmoni', pos: 'n' },
  'πορτοκαλάδα': { en: 'orangeade', ipa: 'portokaˈlaða', pos: 'n' },
  'φρούτα': { en: 'fruit (plural)', ipa: 'ˈfruta', pos: 'n' },
  'μακαρόνια': { en: 'pasta; spaghetti', ipa: 'makaˈroɲa', pos: 'n' },
  'πίτα': { en: 'pita (bread)', ipa: 'ˈpita', pos: 'n' },
  // ordering / places nouns
  'λογαριασμόσ': { en: 'bill; account', ipa: 'loɣarʝaˈzmos', pos: 'n' },
  'λογαριασμό': { en: 'bill (ordering/object form)', ipa: 'loɣarʝaˈzmo', pos: 'n' },
  'μενού': { en: 'menu', ipa: 'meˈnu', pos: 'n' },
  'αγγλικά': { en: 'English (language)', ipa: 'aŋgliˈka', pos: 'n' },
  'ελληνικά': { en: 'Greek (language)', ipa: 'eliniˈka', pos: 'n' },
  'τραπέζι': { en: 'table', ipa: 'traˈpezi', pos: 'n' },
  'άτομα': { en: 'people; persons', ipa: 'ˈatoma', pos: 'n' },
  'αγορά': { en: 'market', ipa: 'aɣoˈra', pos: 'n' },
  'ταβέρνα': { en: 'taverna', ipa: 'taˈverna', pos: 'n' },
  'πλατεία': { en: 'square (in a town)', ipa: 'plaˈtia', pos: 'n' },
  'λεωφορείο': { en: 'bus', ipa: 'leofoˈrio', pos: 'n' },
  'σχολείο': { en: 'school', ipa: 'sxoˈlio', pos: 'n' },
  'σινεμά': { en: 'cinema', ipa: 'sineˈma', pos: 'n' },
  'φούρνο': { en: 'bakery; oven (object form)', ipa: 'ˈfurno', pos: 'n' },
  'παραλία': { en: 'beach', ipa: 'paraˈlia', pos: 'n' },
  'τράπεζα': { en: 'bank', ipa: 'ˈtrapeza', pos: 'n' },
  'ξενοδοχείο': { en: 'hotel', ipa: 'ksenoðoˈçio', pos: 'n' },
  'κέντρο': { en: 'center (of town)', ipa: 'ˈcendro', pos: 'n' },
  'σπίτι': { en: 'house; home', ipa: 'ˈspiti', pos: 'n' },
  'μαγαζί': { en: 'shop', ipa: 'maɣaˈzi', pos: 'n' },
  'γραφείο': { en: 'office; desk', ipa: 'ɣraˈfio', pos: 'n' },
  'αθήνα': { en: 'Athens', ipa: 'aˈθina', pos: 'n' },
  'ελλάδα': { en: 'Greece', ipa: 'eˈlaða', pos: 'n' },
  'θάλασσα': { en: 'sea', ipa: 'ˈθalasa', pos: 'n' },
  // people & time nouns
  'παιδί': { en: 'child', ipa: 'peˈði', pos: 'n' },
  'παιδιά': { en: 'children', ipa: 'peˈðʝa', pos: 'n' },
  'μωρό': { en: 'baby', ipa: 'moˈro', pos: 'n' },
  'μητέρα': { en: 'mother', ipa: 'miˈtera', pos: 'n' },
  'γιαγιά': { en: 'grandma', ipa: 'ʝaˈʝa', pos: 'n' },
  'άντρασ': { en: 'man; husband', ipa: 'ˈandras', pos: 'n' },
  'μέρα': { en: 'day', ipa: 'ˈmera', pos: 'n' },
  'πρωί': { en: 'morning', ipa: 'proˈi', pos: 'n' },
  'απόγευμα': { en: 'afternoon', ipa: 'aˈpoʝevma', pos: 'n' },
  'βράδυ': { en: 'evening', ipa: 'ˈvraði', pos: 'n' },
  'εβδομάδα': { en: 'week', ipa: 'evðoˈmaða', pos: 'n' },
  'καλοκαίρι': { en: 'summer', ipa: 'kaloˈceri', pos: 'n' },
  'δουλειά': { en: 'work; job', ipa: 'ðuˈʎa', pos: 'n' },
  'εφημερίδα': { en: 'newspaper', ipa: 'efimeˈriða', pos: 'n' },
  'μουσική': { en: 'music', ipa: 'musiˈci', pos: 'n' },
  'τηλεόραση': { en: 'television', ipa: 'tileˈorasi', pos: 'n' },
  'πόδια': { en: 'feet', ipa: 'ˈpoðʝa', pos: 'n' },
  'σάββατο': { en: 'Saturday', ipa: 'ˈsavato', pos: 'n' },
  'κυριακή': { en: 'Sunday', ipa: 'cirʝaˈci', pos: 'n' },
  'τρίτη': { en: 'Tuesday', ipa: 'ˈtriti', pos: 'n' },
  'πέμπτη': { en: 'Thursday', ipa: 'ˈpempti', pos: 'n' },
  'παρασκευή': { en: 'Friday', ipa: 'parasceˈvi', pos: 'n' },
  // verbs — citation forms
  'είμαι': { en: 'to be (I am)', ipa: 'ˈime', pos: 'v' },
  'έχω': { en: 'to have (I have)', ipa: 'ˈexo', pos: 'v' },
  'πάω': { en: 'to go (I go)', ipa: 'ˈpao', pos: 'v' },
  'τρώω': { en: 'to eat (I eat)', ipa: 'ˈtroo', pos: 'v' },
  'ακούω': { en: 'to hear; to listen', ipa: 'aˈkuo', pos: 'v' },
  'πίνω': { en: 'to drink', ipa: 'ˈpino', pos: 'v' },
  'θέλω': { en: 'to want', ipa: 'ˈθelo', pos: 'v' },
  'πεινάω': { en: 'to be hungry', ipa: 'piˈnao', pos: 'v' },
  'διψάω': { en: 'to be thirsty', ipa: 'ðiˈpsao', pos: 'v' },
  'έρχομαι': { en: 'to come', ipa: 'ˈerxome', pos: 'v' },
  'ξυπνάω': { en: 'to wake up', ipa: 'ksipˈnao', pos: 'v' },
  'δουλεύω': { en: 'to work', ipa: 'ðuˈlevo', pos: 'v' },
  'μιλάω': { en: 'to speak', ipa: 'miˈlao', pos: 'v' },
  'αγοράζω': { en: 'to buy', ipa: 'aɣoˈrazo', pos: 'v' },
  'μαγειρεύω': { en: 'to cook', ipa: 'maʝiˈrevo', pos: 'v' },
  'ψωνίζω': { en: 'to shop', ipa: 'psoˈnizo', pos: 'v' },
  'διαβάζω': { en: 'to read', ipa: 'ðʝaˈvazo', pos: 'v' },
  'φτιάχνω': { en: 'to make; to fix', ipa: 'ˈftʝaxno', pos: 'v' },
  'βλέπω': { en: 'to see; to watch', ipa: 'ˈvlepo', pos: 'v' },
  'τελειώνω': { en: 'to finish', ipa: 'teˈʎono', pos: 'v' },
  'αρέσω': { en: 'to be pleasing (μου αρέσει = I like)', ipa: 'aˈreso', pos: 'v' },
  // verbs — conjugated forms
  'τρωσ': { en: 'you eat', ipa: 'tros', pos: 'v', lemma: 'τρώω' },
  'τρώει': { en: 'he/she/it eats', ipa: 'ˈtroi', pos: 'v', lemma: 'τρώω' },
  'τρώμε': { en: 'we eat', ipa: 'ˈtrome', pos: 'v', lemma: 'τρώω' },
  'τρώνε': { en: 'they eat', ipa: 'ˈtrone', pos: 'v', lemma: 'τρώω' },
  'πίνεισ': { en: 'you drink', ipa: 'ˈpinis', pos: 'v', lemma: 'πίνω' },
  'πίνουμε': { en: 'we drink', ipa: 'ˈpinume', pos: 'v', lemma: 'πίνω' },
  'διψάει': { en: 'he/she/it is thirsty', ipa: 'ðiˈpsai', pos: 'v', lemma: 'διψάω' },
  'έχει': { en: 'he/she/it has', ipa: 'ˈeçi', pos: 'v', lemma: 'έχω' },
  'έχετε': { en: 'you (plural) have', ipa: 'ˈeçete', pos: 'v', lemma: 'έχω' },
  'είναι': { en: 'is; are', ipa: 'ˈine', pos: 'v', lemma: 'είμαι' },
  'θέλετε': { en: 'you (plural) want', ipa: 'ˈθelete', pos: 'v', lemma: 'θέλω' },
  'θέλουμε': { en: 'we want', ipa: 'ˈθelume', pos: 'v', lemma: 'θέλω' },
  'πασ': { en: 'you go', ipa: 'pas', pos: 'v', lemma: 'πάω' },
  'πάει': { en: 'he/she/it goes', ipa: 'ˈpai', pos: 'v', lemma: 'πάω' },
  'πάμε': { en: 'we go', ipa: 'ˈpame', pos: 'v', lemma: 'πάω' },
  'πάτε': { en: 'you (plural) go', ipa: 'ˈpate', pos: 'v', lemma: 'πάω' },
  'πάνε': { en: 'they go', ipa: 'ˈpane', pos: 'v', lemma: 'πάω' },
  'ερχόμαστε': { en: 'we come', ipa: 'erˈxomaste', pos: 'v', lemma: 'έρχομαι' },
  'δουλεύεισ': { en: 'you work', ipa: 'ðuˈlevis', pos: 'v', lemma: 'δουλεύω' },
  'δουλεύει': { en: 'he/she works', ipa: 'ðuˈlevi', pos: 'v', lemma: 'δουλεύω' },
  'μιλάσ': { en: 'you speak', ipa: 'miˈlas', pos: 'v', lemma: 'μιλάω' },
  'μιλάει': { en: 'he/she speaks', ipa: 'miˈlai', pos: 'v', lemma: 'μιλάω' },
  'μιλάμε': { en: 'we speak; we talk', ipa: 'miˈlame', pos: 'v', lemma: 'μιλάω' },
  'αγοράζεισ': { en: 'you buy', ipa: 'aɣoˈrazis', pos: 'v', lemma: 'αγοράζω' },
  'μαγειρεύει': { en: 'he/she cooks', ipa: 'maʝiˈrevi', pos: 'v', lemma: 'μαγειρεύω' },
  'ψωνίζουμε': { en: 'we shop', ipa: 'psoˈnizume', pos: 'v', lemma: 'ψωνίζω' },
  'φτιάχνει': { en: 'he/she makes', ipa: 'ˈftʝaxni', pos: 'v', lemma: 'φτιάχνω' },
  'βλέπουμε': { en: 'we see; we watch', ipa: 'ˈvlepume', pos: 'v', lemma: 'βλέπω' },
  'αρέσει': { en: 'is pleasing (μου αρέσει = I like)', ipa: 'aˈresi', pos: 'v', lemma: 'αρέσω' },
};

// ── build cards ──────────────────────────────────────────────────────
const START = 226;
if (CARDS.length !== 75) throw new Error(`Expected 75 cards, got ${CARDS.length}`);

const cards = CARDS.map(([target, english, extraTags, grammar], i) => {
  const n = START + i;
  const id = `el-${String(n).padStart(4, '0')}`;
  const card = {
    id,
    target,
    english,
    audio: `el-${id}.mp3`,
    tags: ['general', ...extraTags],
    grammarNode: 'node-04',
    priority: n,
  };
  if (grammar) card.grammar = grammar;
  return card;
});

// ── validation ───────────────────────────────────────────────────────
const errors = [];
const warn = [];

// ids sequential/unique
cards.forEach((c, i) => {
  const expect = `el-${String(START + i).padStart(4, '0')}`;
  if (c.id !== expect) errors.push(`id mismatch at index ${i}: ${c.id} != ${expect}`);
  if (c.priority !== START + i) errors.push(`priority mismatch on ${c.id}`);
});

// unique sentences
const seen = new Set();
for (const c of cards) {
  if (seen.has(c.target)) errors.push(`duplicate sentence: ${c.target}`);
  seen.add(c.target);
}

// word count 3–10
for (const c of cards) {
  const wc = c.target.replace(/[;,.!·—?]/g, '').trim().split(/\s+/).length;
  if (wc < 3 || wc > 10) errors.push(`word count ${wc} out of band on ${c.id}: ${c.target}`);
}

// tokenize targets → dict coverage
const tokenize = (s) => s.replace(/[;,.!·—?«»"'()]/g, ' ').trim().split(/\s+/).filter(Boolean);
const usedTokens = new Set();
for (const c of cards) {
  for (const tok of tokenize(c.target)) {
    const key = normalizeGreek(tok);
    usedTokens.add(key);
    if (!DICT[key]) errors.push(`missing dict key '${key}' (from '${tok}' in ${c.id})`);
  }
}

// dict keys must be σ-normalized + lowercase
for (const key of Object.keys(DICT)) {
  if (key !== normalizeGreek(key)) errors.push(`dict key not σ-normalized/lowercase: ${key}`);
}

// every dict verb resolves via findInfinitive or its lemma conjugates
for (const [key, entry] of Object.entries(DICT)) {
  if (entry.pos !== 'v') continue;
  const viaEngine = findInfinitive(key);
  const viaLemma = entry.lemma ? conjugate(entry.lemma) : conjugate(key);
  if (!viaEngine && !viaLemma) errors.push(`verb '${key}' unresolvable (no findInfinitive hit, no conjugatable lemma)`);
  if (entry.lemma && !conjugate(entry.lemma)) errors.push(`lemma '${entry.lemma}' of '${key}' not conjugatable`);
  if (entry.lemma && !DICT[normalizeGreek(entry.lemma)]) errors.push(`lemma '${entry.lemma}' of '${key}' missing its own dict entry`);
}

// IPA present everywhere
for (const [key, entry] of Object.entries(DICT)) {
  if (!entry.ipa || !entry.en) errors.push(`dict entry '${key}' missing en/ipa`);
}

// offenders (σ-normalized + accent-stripped whole-token match)
const OFFENDERS = ['δύναται','όστις','ούτως','ενταύθα','άπαντες','καθότι','πλην','ωσαύτως','τουτέστιν','ομιλώ','επιθυμώ','οικία','ύδωρ','ρε','μαλάκα']
  .map((w) => stripAccents(normalizeGreek(w)));
for (const c of cards) {
  for (const tok of tokenize(c.target)) {
    const bare = stripAccents(normalizeGreek(tok));
    if (OFFENDERS.includes(bare)) errors.push(`offender '${tok}' in ${c.id}`);
  }
}

// grammar tips ≤120 chars, count ~30%
let tips = 0;
for (const c of cards) {
  if (!c.grammar) continue;
  tips++;
  if (c.grammar.length > 120) errors.push(`tip too long (${c.grammar.length}) on ${c.id}`);
}

// tags: general on every card
for (const c of cards) {
  if (!c.tags.includes('general')) errors.push(`missing general tag on ${c.id}`);
}

// unused dict entries (allowed: lemma-only + tip-support entries) — informational
const lemmaTargets = new Set(Object.values(DICT).filter((e) => e.lemma).map((e) => normalizeGreek(e.lemma)));
const extra = Object.keys(DICT).filter((k) => !usedTokens.has(k) && !lemmaTargets.has(k));
if (extra.length) warn.push(`dict entries not in targets (tip-support/lemma): ${extra.join(', ')}`);

// ── report + write ───────────────────────────────────────────────────
if (errors.length) {
  console.error('VALIDATION FAILED:');
  errors.forEach((e) => console.error(' -', e));
  process.exit(1);
}

const outDir = path.join(__dirname);
fs.writeFileSync(path.join(outDir, 'el-cards-D.json'), JSON.stringify(cards, null, 2) + '\n');
fs.writeFileSync(path.join(outDir, 'el-dict-D.json'), JSON.stringify(DICT, null, 2) + '\n');

const tagCount = (t) => cards.filter((c) => c.tags.includes(t)).length;
console.log('OK: wrote el-cards-D.json and el-dict-D.json');
console.log(`cards: ${cards.length} (${cards[0].id}..${cards[cards.length - 1].id})`);
console.log(`dict entries: ${Object.keys(DICT).length}, unique target tokens: ${usedTokens.size}`);
console.log(`tips: ${tips} (${((tips / cards.length) * 100).toFixed(1)}%)`);
console.log(`tags — general: ${tagCount('general')}, travel: ${tagCount('travel')}, work: ${tagCount('work')}, family: ${tagCount('family')}`);
warn.forEach((w) => console.log('note:', w));
