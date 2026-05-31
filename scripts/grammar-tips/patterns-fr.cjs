/** French grammar-tip patterns */
module.exports = [

  // ── Avoir for sensations + age ──
  {
    id: 'fr-avoir-sensation',
    priority: 100,
    match: t => /\b(j'?ai|tu\s+as|il\s+a|elle\s+a|nous\s+avons|vous\s+avez|ils\s+ont|elles\s+ont)\s+(faim|soif|chaud|froid|sommeil|peur|raison|tort|honte|de\s+la\s+chance|ans?)\b/i.test(t),
    tips: [
      "French says 'I have hunger' (`j'ai faim`), not 'I am hungry'. Same with `j'ai soif`, `j'ai froid`, `j'ai peur`, `j'ai 30 ans`. Sensations and age use `avoir`, not `être`.",
      "Watch these: faim, soif, chaud, froid, sommeil, peur, raison, tort, honte, de la chance. All take `avoir`. Saying `je suis faim` would mean you ARE hunger.",
      "Age uses `avoir`: `j'ai 25 ans` = literally 'I have 25 years'. Direct translation from English would be wrong.",
    ],
  },

  // ── Passé composé (avoir/être + p.p.) ──
  {
    id: 'fr-passe-etre',
    priority: 95,
    match: t => /\b(suis|es|est|sommes|êtes|sont)\s+(all[ée]e?s?|venu[es]?|parti[es]?|arrivé[es]?|rentré[es]?|né[es]?|mort[es]?|tombé[es]?|monté[es]?|descendu[es]?|resté[es]?|devenu[es]?)\b/i.test(t),
    tips: [
      "Past tense with movement/state verbs uses `être`: `je suis allé(e)` (I went). The participle agrees with the subject in gender/number: -e for feminine, -s for plural, -es for both.",
      "The DR & MRS VANDERTRAMP verbs (devenir, revenir, mourir, retourner, sortir, venir, aller, naître, descendre, entrer, rentrer, tomber, retourner, arriver, monter, partir) all take `être`. The rest take `avoir`.",
      "With `être`, agreement matters: a woman writes `je suis allée`, men `je suis allé`. Plural feminine `nous sommes allées`. Sounds the same; spelling changes.",
    ],
  },
  {
    id: 'fr-passe-avoir',
    priority: 80,
    match: t => /\b(j'?ai|tu\s+as|il\s+a|elle\s+a|on\s+a|nous\s+avons|vous\s+avez|ils\s+ont|elles\s+ont)\s+\w+(é|i|u|is|it)\b/i.test(t),
    tips: [
      "Passé composé = `avoir/être` + past participle. Most verbs use `avoir`: `j'ai mangé`, `il a vu`, `nous avons fini`. No agreement on the participle (usually).",
      "Regular endings: -er → -é, -ir → -i, -re → -u. Irregular ones (fait, dit, pris, lu, vu, eu, été) need memorising.",
      "Past participle agrees with a direct object only when that object COMES BEFORE the verb. `J'ai mangé la pomme` (no agreement) vs `la pomme que j'ai mangée` (e added). Easy to miss in speech.",
    ],
  },

  // ── Negation ne...pas ──
  {
    id: 'fr-negation',
    priority: 70,
    match: t => /\bne\s+\w+\s+(pas|jamais|plus|rien|personne|aucun|aucune|nulle\s+part)\b/i.test(t),
    tips: [
      "French negation wraps the verb: `je ne sais pas`. In speech the `ne` often drops (`je sais pas`) but it stays in writing. `Pas` alone after the verb is colloquial.",
      "Other negative pairs: `ne...jamais` (never), `ne...plus` (no longer), `ne...rien` (nothing), `ne...personne` (no one). Always TWO parts around the verb.",
      "After a negation, the article switches: `j'ai un chien` → `je n'ai pas de chien`. The `un/une/des` becomes `de`. Very easy to forget for English speakers.",
    ],
  },

  // ── Reflexive verbs ──
  {
    id: 'fr-reflexive',
    priority: 85,
    match: t => /\b(je\s+me|tu\s+te|il\s+se|elle\s+se|on\s+se|nous\s+nous|vous\s+vous|ils\s+se|elles\s+se|me|te|se|nous|vous)\s+(lave|lave[srz]?|lèvent?|lèves?|appelle|appelles?|appellent?|réveille|couche|prépare|brosse|habille|repose|amuse|ennuie)\b/i.test(t),
    tips: [
      "Reflexive verbs use a pronoun (me/te/se/nous/vous/se) before the verb. `Je m'appelle` = 'I call myself' = 'My name is'. The pronoun must match the subject.",
      "Reflexives in past tense ALWAYS take `être`, not `avoir`: `je me suis lavé(e)`. And the participle agrees with the subject (or the preceding direct object).",
      "Not always reflexive in English: `se souvenir` = to remember, `se dépêcher` = to hurry. If the dictionary form starts with `se`, you need a matching pronoun.",
    ],
  },

  // ── Subjunctive triggers ──
  {
    id: 'fr-subjunctive-trigger',
    priority: 100,
    match: t => /\b(je\s+veux|tu\s+veux|il\s+veut|elle\s+veut|nous\s+voulons|vous\s+voulez|ils\s+veulent|j'aimerais|il\s+faut|pour\s+que|bien\s+que|avant\s+que|jusqu'à\s+ce\s+que)\s+que?\b/i.test(t),
    tips: [
      "After expressions of will/necessity/emotion + `que`, French switches to subjunctive. `Je veux que tu viennes` (not viens) = 'I want you to come'.",
      "Trigger phrases: `il faut que`, `je veux que`, `bien que`, `pour que`, `avant que`. Subjonctif endings: -e/-es/-e/-ions/-iez/-ent for most. Drop the -e on irregular verbs to find the stem.",
      "If the main clause is a wish, doubt, fear, or judgment, the `que` clause goes subjunctive. The action is hypothetical, even if it sounds factual.",
    ],
  },

  // ── Pronoms COD (le/la/les) ──
  {
    id: 'fr-pronom-cod',
    priority: 65,
    match: t => /(^|\s)(le|la|l'|les)\s+(vois|voit|voient|prends|prend|prenons|prenez|prennent|connais|connaît|connaissons|aime|aimons|aiment|achète|achète|achetons)\b/i.test(t),
    tips: [
      "Direct object pronouns (le/la/les) sit BEFORE the verb: `je le vois` (I see him/it), not `je vois le`. Before vowels they elide: `je l'aime`.",
      "`le` = m, `la` = f, `les` = pl. Match the gender/number of what they replace. In compound tenses, this pronoun also triggers participle agreement.",
    ],
  },

  // ── Vouloir / Pouvoir / Devoir + infinitive ──
  {
    id: 'fr-modal-infinitive',
    priority: 80,
    match: t => /\b(je\s+veux|tu\s+veux|il\s+veut|nous\s+voulons|vous\s+voulez|ils\s+veulent|peux|peut|pouvons|pouvez|peuvent|dois|doit|devons|devez|doivent)\s+\w+(er|ir|re|oir)\b/i.test(t),
    tips: [
      "Modal verbs (vouloir, pouvoir, devoir) take the infinitive directly: `je veux manger`, `il peut aider`, `nous devons partir`. No preposition between them.",
      "Don't say `je veux à manger` — the preposition is wrong. Modal verb + bare infinitive. End of story.",
    ],
  },

  // ── Y (locative) ──
  {
    id: 'fr-y-pronoun',
    priority: 75,
    match: t => /\b(j'y|tu\s+y|il\s+y|elle\s+y|on\s+y|nous\s+y|vous\s+y|ils\s+y|y\s+va|y\s+sont|y\s+vais|y\s+suis)\b/i.test(t),
    tips: [
      "`y` = 'there' or 'to it' — replaces a place or `à + thing`. `Tu vas au cinéma? Oui, j'y vais` (Yes, I'm going there). Saves you repeating the location.",
      "`y` always sits before the verb: `j'y pense` (I think about it), `j'y vais` (I'm going there). Glued tight; never floats free.",
    ],
  },

  // ── En (replaces "de + thing") ──
  {
    id: 'fr-en-pronoun',
    priority: 75,
    match: t => /\b(j'en|tu\s+en|il\s+en|on\s+en|nous\s+en|vous\s+en|ils\s+en|en\s+veux|en\s+ai|en\s+veulent)\b/i.test(t),
    tips: [
      "`en` = 'of it / of them / some' — replaces `de + noun` or a quantity. `Tu veux du café? Oui, j'en veux` (Yes, I want some).",
      "After numbers and `beaucoup/peu/assez`, `en` is required: `j'en ai trois` (I have three [of them]). English drops the 'of them'; French keeps `en`.",
    ],
  },

  // ── Articles partitifs (du/de la/des) ──
  {
    id: 'fr-partitif',
    priority: 70,
    match: t => /\b(du|de\s+la|de\s+l'|des)\s+\w+\b/i.test(t) && /\b(mange|mangeons|mangent|bois|boit|buvons|boivent|veux|voulez|achète|achetons|prends|prend)\b/i.test(t),
    tips: [
      "Partitive articles `du/de la/des` = 'some' (unspecified quantity). `Je mange du pain` = 'I eat some bread'. English often drops 'some'; French keeps the article.",
      "After negation, all partitives collapse to `de`: `je mange du pain` → `je ne mange pas de pain`. Watch out — easy to miss when speaking quickly.",
    ],
  },

  // ── Tu vs Vous ──
  {
    id: 'fr-tu-vous-formal',
    priority: 70,
    match: t => /\bvous\s+(êtes|avez|pouvez|voulez|venez|allez|prenez|aimez)\b/i.test(t),
    tips: [
      "`vous` is both 'you (plural)' AND 'you (formal singular)'. Context decides. With strangers, in business, or with older people → vous. With friends, family, kids → tu.",
      "Vouvoyer = use `vous`. Tutoyer = use `tu`. Wrong tu can be rude; wrong vous is just safe. When unsure, start formal and let them say `on peut se tutoyer`.",
    ],
  },

  // ── Il y a ──
  {
    id: 'fr-il-y-a',
    priority: 80,
    match: t => /\bil\s+y\s+a\b/i.test(t),
    tips: [
      "`il y a` = 'there is / there are' — singular AND plural. `Il y a une pomme`, `il y a trois pommes`. The form doesn't change. Past: `il y avait`.",
      "Don't confuse `il y a` (there is) with `il a` (he has) or `il a y` (doesn't exist). The `y` is mandatory.",
    ],
  },

  // ── Conditional (si + imperfect → conditional) ──
  {
    id: 'fr-conditional-hypothetical',
    priority: 90,
    match: t => /\bsi\s+\w+(ais|ait|aient|ions|iez)\b/i.test(t) || /\b(j'?aimerais|tu\s+aimerais|on\s+aimerait|voudrais|voudrait|pourrait|pourrais|devrait|devrais)\b/i.test(t),
    tips: [
      "Conditional `-rais/-rait/-rions/-riez/-raient` = 'would'. `J'aimerais` = 'I would like' (polite). `Je voudrais un café` is way more polite than `je veux un café`.",
      "Hypothetical structure: `si + imparfait → conditionnel`. `Si j'avais le temps, je voyagerais` = 'If I had time, I would travel'. Same shape as English second conditional.",
    ],
  },

  // ── Faire (causative + idioms) ──
  {
    id: 'fr-faire-weather',
    priority: 95,
    match: t => /\bil\s+fait\s+(beau|mauvais|chaud|froid|frais|du\s+soleil|du\s+vent|du\s+brouillard)\b/i.test(t),
    tips: [
      "French says 'it makes' for weather: `il fait beau` (the weather's nice), `il fait froid`. Same pattern with `du soleil`, `du vent`. English uses 'be' or 'is sunny/windy'.",
      "Wrong: `il est froid` would mean 'he is cold' (about a person). For weather, always `il fait`.",
    ],
  },

  // ── J' vs Je (elision) ──
  {
    id: 'fr-elision',
    priority: 40,
    match: t => /\bj'(ai|aime|écoute|étudie|habite|essaie|adore|attends|écris)\b/i.test(t),
    tips: [
      "`je` becomes `j'` before a vowel or silent h: `j'aime`, `j'habite`. Mandatory elision — saying `je aime` is wrong.",
      "Other elisions to watch: `ne` → `n'`, `me` → `m'`, `te` → `t'`, `se` → `s'`, `le/la` → `l'`, `de` → `d'`, `que` → `qu'`. Vowel collision = elision.",
    ],
  },

  // ── On (informal we / impersonal one) ──
  {
    id: 'fr-on-pronoun',
    priority: 60,
    match: t => /\bon\s+(est|a|va|peut|doit|veut|fait|parle|dit|mange|sait|voit)\b/i.test(t),
    tips: [
      "`on` is the all-purpose informal 'we' in spoken French: `on va au cinéma` = 'we're going to the movies' (not `nous`). Verbs conjugate as 3rd singular even though it means 'we'.",
      "`on` also = English 'one' or 'they' (impersonal): `on dit que...` = 'they say that...'. Two meanings, one word. Context decides.",
    ],
  },

  // ── Subjunctive after il faut que ──
  {
    id: 'fr-il-faut-subjunctive',
    priority: 100,
    match: t => /\bil\s+faut\s+que\b/i.test(t),
    tips: [
      "`il faut que` (you must / it's necessary that) ALWAYS triggers subjunctive: `il faut que tu viennes` (not viens). The necessity is real; the action is still hypothetical.",
      "Short form `il faut + infinitive` avoids the subjunctive entirely: `il faut venir` = 'one must come'. Easier when the subject is general.",
    ],
  },

  // ── Aller + infinitive (futur proche) ──
  {
    id: 'fr-aller-futur',
    priority: 85,
    match: t => /\b(je\s+vais|tu\s+vas|il\s+va|elle\s+va|on\s+va|nous\s+allons|vous\s+allez|ils\s+vont|elles\s+vont)\s+\w+(er|ir|re|oir)\b/i.test(t),
    tips: [
      "`aller + infinitive` = the everyday future, like English 'going to': `je vais manger` = 'I'm going to eat'. Way more common in speech than the textbook future tense (`je mangerai`).",
      "Three parts: form of `aller`, then directly the infinitive. No `à` or `de` between them.",
    ],
  },

];
