#!/usr/bin/env node
/**
 * enrich-grammar-tips-it.cjs
 *
 * Adds grammar tips to Italian cards that lack them, targeting 30%+ coverage.
 * Uses pattern-matching on the target sentence to generate contextual tips
 * specific to each grammar node's teaching focus.
 *
 * Run: node scripts/enrich-grammar-tips-it.cjs [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'italian', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

// ── Grammar tip generators per node ──────────────────────────────
// Each returns a tip string or null if no pattern matches

const TIP_GENERATORS = {
  // A1 ─────────────────────────────────────────────────────────────
  'node-01': (t, e) => {
    // Presente indicativo regolare
    if (/\b(parl|mangi|cammin|lavor|gioc|cucin|studi|guard|ascolt|cant|ball|compra|prepar|viaggi|visit|abita?|am|arriv|pass|cerc|port|tratt|pens)(?:o|i|a|iamo|ate|ano)\b/.test(t))
      return 'Regular -are verb in presente indicativo: the endings -o, -i, -a, -iamo, -ate, -ano replace the infinitive -are.';
    if (/\b(legg|scriv|prend|vend|chiud|corr|ved|mett|perd|viv|cred|ric?ev|conosc|piov)(?:o|i|e|iamo|ete|ono)\b/.test(t))
      return 'Regular -ere verb in presente indicativo: the endings -o, -i, -e, -iamo, -ete, -ono replace the infinitive -ere.';
    if (/\b(dorm|part|sent|apr|serv|vest|segu|offr)(?:o|i|e|iamo|ite|ono)\b/.test(t))
      return 'Regular -ire verb in presente: -o, -i, -e, -iamo, -ite, -ono. Some -ire verbs insert -isc- (capisco, finisco).';
    if (/\b(cap|fin|prefer|sped|costru|pul|un|garant|fer)isc(?:o|i|e|ono)\b/.test(t))
      return 'This -ire verb adds -isc- before the ending (capisco, finisco, preferisco). This is common for many -ire verbs.';
    return null;
  },

  'node-02': (t, e) => {
    // Verbi irregolari al presente
    if (/\b(sono|sei|siamo|siete)\b/.test(t))
      return 'Essere (to be) is irregular: sono, sei, è, siamo, siete, sono. One of the most important Italian verbs.';
    if (/\b(ho|hai|ha|abbiamo|avete|hanno)\b/.test(t))
      return 'Avere (to have) is irregular: ho, hai, ha, abbiamo, avete, hanno. Also used as an auxiliary in compound tenses.';
    if (/\b(vado|vai|va|andiamo|vanno)\b/.test(t))
      return 'Andare (to go) is irregular: vado, vai, va, andiamo, andate, vanno. Note the "v" root in several forms.';
    if (/\b(faccio|fai|fa|facciamo|fanno)\b/.test(t))
      return 'Fare (to do/make) is irregular: faccio, fai, fa, facciamo, fate, fanno. From Latin "facere".';
    if (/\b(dico|dice|dicono|dici)\b/.test(t))
      return 'Dire (to say) is irregular: dico, dici, dice, diciamo, dite, dicono. From Latin "dicere".';
    if (/\b(vengo|viene|vengono|vieni)\b/.test(t))
      return 'Venire (to come) is irregular: vengo, vieni, viene, veniamo, venite, vengono.';
    if (/\b(so|sai|sa|sappiamo|sanno)\b/.test(t) && /\bsa(?:i|ppiamo|nno)?\b/.test(t))
      return 'Sapere (to know facts) is irregular: so, sai, sa, sappiamo, sapete, sanno. Compare with conoscere (to know people/places).';
    if (/\b(esco|esci|esce|escono)\b/.test(t))
      return 'Uscire (to go out) is irregular: esco, esci, esce, usciamo, uscite, escono. Note the "esc-" stem in some forms.';
    if (/\b(posso|puoi|possono|possiamo)\b/.test(t))
      return 'Potere (can/to be able) is irregular: posso, puoi, può, possiamo, potete, possono. A modal verb.';
    if (/\b(devo|deve|devono|dobbiamo)\b/.test(t))
      return 'Dovere (must/to have to) is irregular: devo, devi, deve, dobbiamo, dovete, devono. A modal verb.';
    if (/\b(voglio|vuoi|vuole|vogliono|vogliamo)\b/.test(t))
      return 'Volere (to want) is irregular: voglio, vuoi, vuole, vogliamo, volete, vogliono. A modal verb.';
    return null;
  },

  'node-03': (t, e) => {
    // Essere vs stare
    if (/\bsta(?:i|nno|ndo)?\b/.test(t) && /\b\w+ando\b/.test(t))
      return '"Stare + gerundio" forms the Italian progressive: "sto parlando" (I am speaking right now).';
    if (/\bsta(?:i|nno)?\b/.test(t) && /\b(bene|male|meglio|peggio|tranquill|attent|zitt)\b/.test(t))
      return '"Stare" describes temporary states and conditions: "sta bene" (is well), "sta attento" (is paying attention).';
    if (/\bè\b/.test(t) && /\b(la capitale|famoso|famosa|interessante|importante|bello|bella|grande|piccolo|buono|nuovo|vecchio|primo|ultimo|migliore|peggiore)\b/.test(t))
      return '"Essere" describes inherent qualities and facts: "Roma è la capitale." Identity, characteristics, and permanent states use essere.';
    if (/\b(è|sono|sei|siamo|siete)\b/.test(t) && /\b(in ritardo|a casa|in Italia|al lavoro|in ufficio|a scuola|in vacanza|in centro)\b/.test(t))
      return '"Essere" with locations describes where someone/something is. "Sono a casa" = I am at home.';
    if (/\b(è|sono)\b/.test(t) && /\b(il|la|un|una|l')\b/.test(t) && t.split(/\s+/).length <= 8)
      return '"Essere" identifies and describes: it links the subject to a quality, identity, or location.';
    return null;
  },

  'node-04': (t, e) => {
    // Domande e interrogativi
    if (/\?/.test(t) && /\b(chi|che|cosa|quale|quali|quanto|quanti|quanta|quante|dove|quando|come|perché)\b/i.test(t)) {
      const match = t.match(/\b(chi|che cosa|cosa|quale|quali|quanto|quanti|dove|quando|come|perché)\b/i);
      if (match) {
        const word = match[1].toLowerCase();
        const meanings = {
          'chi': 'Chi = who. Used for people.',
          'che cosa': 'Che cosa = what. "Cosa" alone is informal.',
          'cosa': 'Cosa = what (informal). More formal: "che cosa".',
          'quale': 'Quale = which/what. Drops -e before "è": qual è.',
          'quali': 'Quali = which (plural). Used with plural nouns.',
          'quanto': 'Quanto/a/i/e = how much/many. Agrees in gender and number.',
          'quanti': 'Quanti/e = how many. Agrees in gender and number with the noun.',
          'dove': 'Dove = where. "Di dove sei?" = Where are you from?',
          'quando': 'Quando = when. "Da quando?" = Since when?',
          'come': 'Come = how. "Come stai?" = How are you? Also means "like/as".',
          'perché': 'Perché = why/because. Used for both questions and answers.',
        };
        return meanings[word] || `Question word "${word}" introduces the question.`;
      }
    }
    if (/\?/.test(t) && !/\b(chi|che|cosa|quale|dove|quando|come|perché)\b/i.test(t))
      return 'Yes/no questions in Italian use rising intonation — no word order change needed. The verb stays in the same position.';
    return null;
  },

  'node-05': (t, e) => {
    // Articoli, genere e accordo
    if (/\bl'/.test(t))
      return 'L\' is the elided article (il/la → l\') before a vowel: l\'uomo, l\'amica. Gender is hidden by elision.';
    if (/\blo\s+(st|sc|sp|sb|sl|sm|sn|sr|sv|z|gn|ps|pn|x)\w+/.test(t))
      return '"Lo" is used before masculine nouns starting with s+consonant, z, gn, ps, x: lo studente, lo zaino.';
    if (/\bgli\s+\w+/.test(t) && /\bgli\s+(st|sc|sp|z|gn|ps|uo)/.test(t))
      return '"Gli" is the plural of "lo": gli studenti, gli zaini. Used before s+consonant, z, gn, ps, vowels.';
    if (/\b(un|uno|una|un')\s+\w+/.test(t)) {
      if (/\buno\s+/.test(t)) return '"Uno" is the indefinite article for masculine nouns before s+consonant, z, gn, ps.';
      if (/\bun'\w+/.test(t)) return '"Un\'" (with apostrophe) is only for feminine nouns starting with a vowel: un\'amica.';
      return 'Italian indefinite articles: un (m), uno (m before s+cons/z), una (f), un\' (f before vowel).';
    }
    if (/\b(il|la|i|le)\s+\w+/.test(t))
      return 'Definite articles agree in gender and number: il (m.sg), la (f.sg), i (m.pl), le (f.pl), l\' (before vowel).';
    return null;
  },

  'node-06': (t, e) => {
    // Piacere e verbi simili
    if (/\bpiac(?:e|ciono|eva|evano|erà|erebbe)\b/.test(t))
      return 'Piacere literally means "to be pleasing": "Mi piace il caffè" = Coffee is pleasing to me. Subject comes after.';
    if (/\b(mi|ti|gli|le|ci|vi)\s+(?:piace|piacciono|interessa|interessano|manca|mancano|serve|servono)\b/.test(t))
      return 'Like piacere, verbs like interessare, mancare, servire use indirect object pronouns: "Mi manca" = I miss (it).';
    if (/\bpiacciono\b/.test(t))
      return 'Piacciono (plural): used when what is liked is plural. "Mi piacciono i gatti" = I like cats.';
    return null;
  },

  'node-07': (t, e) => {
    // Descrizioni e aggettivi
    if (/\b\w+(?:issim[oaie])\b/.test(t))
      return 'The -issimo/-issima suffix is the absolute superlative: bellissimo = very beautiful, grandissimo = very big.';
    if (/\b(più|meno)\s+\w+\s+di\b/.test(t))
      return 'Comparative: più/meno + adjective + di. "Più alto di me" = taller than me. Use "che" before prepositions.';
    if (/\b(più|meno)\s+\w+\s+che\b/.test(t))
      return '"Più/meno + adj + che" is used before prepositions, infinitives, or when comparing two qualities of the same subject.';
    if (/\b(bello|bella|belli|belle|bel|bei|begli|bell')\b/.test(t))
      return 'Bello follows the pattern of definite articles when before a noun: bel ragazzo, bell\'uomo, bei fiori, begli occhi.';
    if (/\b(buon[oa]?|cattiv[oa]|grand[e]|piccol[oa])\b/.test(t))
      return 'Most adjectives follow the noun in Italian, but common ones like buono, bello, grande, piccolo often precede it.';
    if (/\b(alt[oa]|bass[oa]|lung[oa]|cort[oa]|larg[oa]|strett[oa])\b/.test(t))
      return 'Physical description adjectives agree in gender/number with the noun they describe and usually follow it.';
    if (/\b(quant[eoai]|molt[eoai]|poc[aohi]|tropp[aoie]|tant[aoie])\b/.test(t))
      return 'Quantity adjectives (molto, poco, troppo, tanto, quanto) agree in gender and number with the noun.';
    if (/\b(c'è|ci sono)\b/.test(t))
      return 'C\'è = there is (singular), ci sono = there are (plural). "Ci" is a locative pronoun meaning "there".';
    return null;
  },

  'node-08': (t, e) => {
    // Espressioni comuni (greetings, basic phrases)
    if (/^(ciao|buongiorno|buonasera|buonanotte|arrivederci|addio|salve)\b/i.test(t))
      return 'Common Italian greeting. Ciao is informal (hello/bye), Buongiorno is formal (good morning/day), Arrivederci is formal goodbye.';
    if (/^(grazie|prego|per favore|scusi|scusa|mi scusi|mi dispiace)\b/i.test(t))
      return 'Essential courtesy expression. Grazie (thanks), Prego (you\'re welcome), Scusa/Scusi (sorry, informal/formal).';
    if (/^(sì|no|forse|certo|esatto|giusto|va bene|d'accordo)\b/i.test(t))
      return 'Basic response word. "Va bene" (ok), "D\'accordo" (agreed), "Certo" (of course).';
    if (/\b(come stai|come sta|come va|tutto bene)\b/i.test(t))
      return 'Common greeting question. "Come stai?" (informal) / "Come sta?" (formal) = How are you?';
    if (/\b(mi chiamo|il mio nome è|piacere)\b/i.test(t))
      return 'Self-introduction: "Mi chiamo..." (My name is...), "Piacere" (Nice to meet you).';
    if (/\b(per favore|per piacere|per cortesia)\b/.test(t))
      return 'Ways to say "please": per favore (standard), per piacere (softer), per cortesia (very formal).';
    if (/\b(c'è|ci sono)\b/.test(t))
      return 'C\'è = there is (singular), ci sono = there are (plural). "Ci" is a locative pronoun meaning "there".';
    if (/\b(ecco)\b/.test(t))
      return 'Ecco = here is/are, there you go. Used to present or point out something: "Ecco il libro!"';
    if (/\b(magari)\b/.test(t))
      return 'Magari = maybe/perhaps/I wish. Very common in spoken Italian for hopes or uncertainty.';
    if (/\b(comunque)\b/.test(t))
      return 'Comunque = anyway/however. Very versatile word used in both formal and informal speech.';
    if (/\b(invece)\b/.test(t))
      return 'Invece = instead/on the other hand. Used for contrast: "Io studio, lui invece dorme."';
    if (/\bce la f(?:accio|ai|a|acciamo|ate|anno)\b/.test(t))
      return '"Farcela" = to manage/cope. "Ce la faccio" = I can manage it. The "ce" + "la" are fixed pronouns.';
    // Catch remaining short phrases as common expressions
    if (t.split(/\s+/).length <= 4)
      return 'Common Italian expression used in everyday conversation. These set phrases should be memorized as whole units.';
    return null;
  },

  // A2 ─────────────────────────────────────────────────────────────
  'node-09': (t, e) => {
    // Passato prossimo
    if (/\b(ho|hai|ha|abbiamo|avete|hanno)\s+\w+[at]o\b/.test(t))
      return 'Passato prossimo with avere: ho + past participle (-ato for -are verbs, -uto for -ere, -ito for -ire).';
    if (/\b(sono|sei|è|siamo|siete)\s+\w+[at][oaie]\b/.test(t))
      return 'Passato prossimo with essere: the past participle agrees in gender/number with the subject. Sono andata (f).';
    if (/\b(sono|è)\s+(andat|venut|partit|arrivat|tornat|stat|nat|mort|entrat|uscit)/.test(t))
      return 'Verbs of motion/state use essere in passato prossimo: sono andato, è venuta, siamo partiti.';
    return null;
  },

  'node-10': (t, e) => {
    // Imperfetto
    if (/\b\w+av[ao]\b/.test(t) && /\b(quando|mentre|sempre|spesso|ogni|da bambino|da piccol)\b/i.test(t))
      return 'Imperfetto for habitual past actions: "Quando ero piccolo, giocavo sempre" — repeated actions in the past.';
    if (/\b(ero|eri|era|eravamo|erano)\b/.test(t))
      return 'Essere in imperfetto: ero, eri, era, eravamo, eravate, erano. Used for states, descriptions, and ongoing conditions.';
    if (/\b\w+av[ao]\b/.test(t) && /\bmentre\b/.test(t))
      return 'Imperfetto with "mentre" describes background actions: "Mentre camminavo..." — ongoing action interrupted.';
    return null;
  },

  'node-11': (t, e) => {
    // Congiuntivo presente
    if (/\b(credo|penso|spero|voglio|dubito|temo|preferisco|sembra|bisogna|occorre|pare|suppongo|immagino)\s+che\b/.test(t))
      return 'The subjunctive (congiuntivo) is triggered after expressions of opinion, wish, doubt, or emotion + "che".';
    if (/\b(sia|abbia|faccia|vada|stia|dica|possa|debba|sappia|venga)\b/.test(t))
      return 'Common irregular subjunctive forms: sia (essere), abbia (avere), faccia (fare), vada (andare), stia (stare).';
    if (/\bnonostante\b/.test(t))
      return '"Nonostante + congiuntivo" = despite/although. Always takes the subjunctive mood.';
    if (/\baffinché\b/.test(t) || /\bperché\b.*\bcongiuntivo\b/i.test(e))
      return '"Affinché + congiuntivo" = so that/in order that. Purpose clauses always use subjunctive.';
    if (/\b(prima che|senza che|a meno che|purché|a condizione che|a patto che)\b/.test(t))
      return 'These conjunctions always trigger the subjunctive: prima che, senza che, a meno che, purché, a patto che.';
    return null;
  },

  'node-12': (t, e) => {
    // Imperativo
    if (/^(?:Non\s+)?[A-Z][a-z]+(?:a|i|iamo|ate|ino|ete|ano)!/.test(t))
      return 'The imperative (imperativo) gives commands or instructions. Informal "tu" forms often match the present tense.';
    if (/\bnon\s+\w+(?:are|ere|ire)\b/.test(t))
      return 'Negative informal imperative uses "non + infinitive": "Non parlare!" (Don\'t speak!). Different from positive form.';
    if (/\b(dimmi|dammi|fammi|vacci|dillo|fallo|dacci)\b/.test(t))
      return 'When pronouns attach to monosyllabic imperatives (da\', di\', fa\', va\'), the consonant doubles: dammi, dimmi, fammi.';
    return null;
  },

  'node-13': (t, e) => {
    // Verbi riflessivi — broader matching
    if (/\b(mi|ti|si|ci|vi)\s+\w+(?:o|i|a|e|iamo|ate|ono|ete|isco|isci|isce|iscono)\b/.test(t) && !/\b(mi|ti|ci|vi)\s+(piace|piacciono|sembra|serve|manca|interessa|ha)\b/.test(t))
      return 'Reflexive verb: the pronoun (mi, ti, si, ci, vi) shows the action reflects back on the subject.';
    if (/\bsi\s+\w+ano\b/.test(t))
      return 'Reciprocal reflexives describe mutual actions: "Si amano" (They love each other). Uses plural forms.';
    if (/\b(mi sono|ti sei|si è|ci siamo|si sono)\b/.test(t))
      return 'Reflexive verbs use "essere" in compound tenses, and the participle agrees: "Mi sono alzata" (f).';
    if (/\b\w+arsi\b|\b\w+ersi\b|\b\w+irsi\b/.test(t))
      return 'Reflexive infinitive (-arsi, -ersi, -irsi): "Devo alzarmi" — the pronoun attaches to the infinitive end.';
    return null;
  },

  'node-14': (t, e) => {
    // Per vs da / Preposizioni
    if (/\bper\b/.test(t) && /\b(per\s+\w+are|per\s+sempre|per\s+favore|per\s+me|per\s+questo)\b/.test(t))
      return '"Per" = for/in order to. Used for purpose (per studiare), duration (per due ore), and destination (per Roma).';
    if (/\bda\b/.test(t) && /\b(da\s+\d+|da\s+quando|da\s+piccol|da\s+solo|dal\s+|dalla\s+|dall')\b/.test(t))
      return '"Da" = from/since/at someone\'s place. "Da tre anni" (for three years), "dal dottore" (at the doctor\'s).';
    if (/\b(di|del|dello|della|dell'|dei|degli|delle)\b/.test(t))
      return 'Preposition "di" contracts with articles: di+il=del, di+lo=dello, di+la=della, di+i=dei, di+gli=degli, di+le=delle.';
    if (/\b(al|allo|alla|all'|ai|agli|alle)\b/.test(t))
      return 'Preposition "a" contracts with articles: a+il=al, a+lo=allo, a+la=alla, a+i=ai, a+gli=agli, a+le=alle.';
    return null;
  },

  // B1 ─────────────────────────────────────────────────────────────
  'node-15': (t, e) => {
    // Pronomi oggetto
    if (/\b(lo|la|li|le)\s+\w+(?:o|a|e|i|iamo|ate|ono|ete|isco|isci|isce|iscono)\b/.test(t))
      return 'Direct object pronouns (lo, la, li, le) go before the conjugated verb: "Lo vedo" (I see him/it).';
    if (/\b(mi|ti|gli|le|ci|vi)\s+(piace|ha detto|ha chiesto|sembra|serve|manca|interessa)\b/.test(t))
      return 'Indirect object pronouns (mi, ti, gli, le, ci, vi, gli) go before the verb: "Gli ho detto" (I told him).';
    if (/\b(me lo|me la|te lo|te la|glielo|gliela|ce lo|ce la|ve lo|ve la)\b/.test(t))
      return 'Combined pronouns: indirect + direct. "Me lo" = it to me, "glielo" = it to him/her. Indirect comes first.';
    return null;
  },

  'node-16': (t, e) => {
    // Mixed subjunctive usage (actual content is congiuntivo-heavy)
    if (/\b(voglio|vuole|voleva|vorrei)\s+che\b/.test(t))
      return '"Volere che" + congiuntivo: expressing a wish about someone else\'s action. The subjunctive is mandatory.';
    if (/\b(sebbene|benché|malgrado|nonostante)\b/.test(t))
      return 'Concessive conjunctions (sebbene, benché, malgrado, nonostante) always require the subjunctive mood.';
    if (/\b(qualunque|qualsiasi|chiunque|ovunque|dovunque|comunque)\b/.test(t))
      return 'Indefinite pronouns/adjectives (qualunque, chiunque, ovunque) take the subjunctive in formal usage.';
    if (/\bè\s+(meglio|importante|necessario|possibile|impossibile|giusto|sbagliato|bene|male|ora|tempo)\s+che\b/.test(t))
      return '"È + adjective + che" triggers subjunctive: "È importante che tu venga" — impersonal evaluation + che.';
    if (/\b(prima che|senza che|a meno che|purché|affinché|a patto che|a condizione che)\b/.test(t))
      return 'These conjunctions always trigger the subjunctive: prima che (before), senza che (without), a meno che (unless).';
    if (/\b(credo|penso|spero|dubito|temo|sembra|pare|immagino|suppongo)\s+che\b/.test(t))
      return 'Verbs of opinion, hope, doubt, or perception + "che" require the subjunctive mood.';
    if (/\bche\b/.test(t) && /\b(sia|abbia|faccia|vada|stia|dica|possa|debba|sappia|venga|mangino|restiate|vengano|parlino|capiscano|finiscano)\b/.test(t))
      return 'The subjunctive form appears after "che" — triggered by the main clause expressing opinion, wish, doubt, or necessity.';
    return null;
  },

  'node-17': (t, e) => {
    // Condizionale
    if (/\b\w+rebbe\b/.test(t) || /\b\w+remmo\b/.test(t) || /\b\w+rei\b/.test(t))
      return 'Condizionale presente: -rei, -resti, -rebbe, -remmo, -reste, -rebbero. Expresses wishes, polite requests, hypotheticals.';
    if (/\b(vorrei|sarei|avrei|potrei|dovrei|farei|andrei|verrei|berrei|rimarrei)\b/.test(t))
      return 'Irregular conditional forms: vorrei (volere), sarei (essere), avrei (avere), potrei (potere), farei (fare).';
    if (/\bse\s+\w+ssi\b/.test(t) && /\b\w+rebbe\b/.test(t))
      return 'Hypothetical "se" clause: "Se avessi tempo, viaggerei" — imperfect subjunctive + conditional.';
    return null;
  },

  'node-18': (t, e) => {
    // Condizionale (actual content is condizionale, not futuro)
    if (/\b(dovr(?:ei|esti|ebbe|emmo|este|ebbero))\b/.test(t))
      return 'Dovere in condizionale (dovresti = you should). Used for polite suggestions and obligations.';
    if (/\b(potr(?:ei|esti|ebbe|emmo|este|ebbero))\b/.test(t))
      return 'Potere in condizionale (potresti = you could). Used for polite requests and possibilities.';
    if (/\b(vorr(?:ei|esti|ebbe|emmo|este|ebbero))\b/.test(t))
      return 'Volere in condizionale (vorrei = I would like). Very common for polite requests.';
    if (/\b(sar(?:ei|esti|ebbe|emmo|este|ebbero))\b/.test(t))
      return 'Essere in condizionale (sarebbe = it would be). Irregular stem: sar-.';
    if (/\b(avr(?:ei|esti|ebbe|emmo|este|ebbero))\b/.test(t))
      return 'Avere in condizionale (avrei = I would have). Irregular stem: avr-.';
    if (/\b(far(?:ei|esti|ebbe|emmo|este|ebbero))\b/.test(t))
      return 'Fare in condizionale (farei = I would do). Irregular stem: far-.';
    if (/\b(andr(?:ei|esti|ebbe|emmo|este|ebbero))\b/.test(t))
      return 'Andare in condizionale (andrei = I would go). Irregular stem: andr-.';
    if (/\b\w+r(?:ei|esti|ebbe|emmo|este|ebbero)\b/.test(t))
      return 'Condizionale presente: infinitive stem + -ei, -esti, -ebbe, -emmo, -este, -ebbero. Expresses wishes and polite requests.';
    return null;
  },

  'node-19': (t, e) => {
    // Futuro semplice (actual content is future tense)
    if (/\b\w+erò\b/.test(t))
      return 'Futuro semplice, first person: -erò. "Viaggerò" = I will travel. Regular -are verbs: parl-erò.';
    if (/\b\w+erai\b/.test(t))
      return 'Futuro semplice, second person: -erai. Future tense for plans and predictions.';
    if (/\b\w+erà\b/.test(t))
      return 'Futuro semplice, third person: -erà. "Arriverà" = He/she will arrive.';
    if (/\b\w+eremo\b/.test(t))
      return 'Futuro semplice, first person plural: -eremo. "Viaggeremo" = We will travel.';
    if (/\b\w+eranno\b/.test(t))
      return 'Futuro semplice, third person plural: -eranno. "Arriveranno" = They will arrive.';
    if (/\b(sarà|avrà|farà|andrà|verrà|potrà|dovrà|vorrà|rimarrà|terrà|berranno|vedranno)\b/.test(t))
      return 'Irregular future stem: some common verbs contract their stem in the future (essere→sar-, avere→avr-, fare→far-).';
    if (/\b(tra|fra)\s+(due|tre|poco|qualche|un)\b/.test(t))
      return '"Tra/Fra + time" indicates when something will happen. Both "tra" and "fra" mean "in" for future time.';
    if (/\b(prossim[oa]|domani|stasera|domattina)\b/.test(t) && /\b\w+er[àò]\b/.test(t))
      return 'Future tense with time markers: prossimo/a (next), domani (tomorrow), stasera (tonight).';
    return null;
  },

  'node-20': (t, e) => {
    // Pronomi relativi (actual content is relative pronouns + "che")
    if (/\bche\b/.test(t) && /\b(il|la|i|le|un|una|l')\s+\w+\s+che\b/.test(t))
      return '"Che" as relative pronoun: connects a noun to a describing clause. "Il libro che leggo" = The book that I read.';
    if (/\bcui\b/.test(t))
      return '"Cui" is used after prepositions in relative clauses: "con cui" (with whom), "in cui" (in which), "di cui" (of which).';
    if (/\b(il quale|la quale|i quali|le quali)\b/.test(t))
      return '"Il quale/la quale" are formal alternatives to "che/cui" — they agree in gender/number and clarify ambiguity.';
    if (/\bciò che\b/.test(t) || /\bquello che\b/.test(t))
      return '"Ciò che" / "quello che" = what/that which. Used when there is no specific antecedent.';
    if (/\bche\b/.test(t) && t.split(/\s+/).length >= 5)
      return '"Che" connects clauses: it can function as a relative pronoun (who/which/that) or conjunction (that).';
    return null;
  },

  // B2 ─────────────────────────────────────────────────────────────
  'node-21': (t, e) => {
    // Trapassato prossimo (actual content: past perfect and sequencing)
    if (/\b(avevo|avevi|aveva|avevamo|avevano)\s+\w+[at]o\b/.test(t))
      return 'Trapassato prossimo with avere: avevo + participio passato. Describes an action completed before another past event.';
    if (/\b(ero|eri|era|eravamo|erano)\s+\w+[at][oaie]\b/.test(t))
      return 'Trapassato prossimo with essere: ero + participio (agrees in gender/number). "Era già partita."';
    if (/\b(dopo che|quando|appena)\b/.test(t) && /\b(avevano|aveva|avevo|erano|era|ero)\b/.test(t))
      return '"Dopo che / quando / appena" + trapassato prossimo marks the earlier of two past events.';
    if (/\b(avranno|avrà|sarà|saranno)\s+\w+[at][oaie]?\b/.test(t))
      return 'Futuro anteriore: avrà/sarà + participio. "Avranno mangiato" = They will have eaten. Also used for speculation.';
    if (/\bmai\b/.test(t) && /\b(aveva|erano|avevano|era)\b/.test(t))
      return '"Non + trapassato + mai" = had never done something. Emphasizes that the action had never occurred before.';
    if (/\bgiàb/.test(t) && /\b(aveva|avevano|era|erano)\b/.test(t))
      return '"Già + trapassato" emphasizes the action was already completed: "Avevano già cenato."';
    return null;
  },

  'node-22': (t, e) => {
    // Periodo ipotetico / Si clauses
    if (/\bse\s+\w+ssi\b/.test(t) && /\b\w+rebbe\b/.test(t))
      return 'Second conditional (possibility): Se + congiuntivo imperfetto, condizionale presente. "Se avessi tempo, viaggerei."';
    if (/\bse\s+\w+ssi\s+\w+[ao]to\b/.test(t) || /\bse\s+avessi\s+\w+[ao]to\b/.test(t))
      return 'Third conditional (impossible): Se + congiuntivo trapassato, condizionale passato. "Se avessi saputo, sarei venuto."';
    if (/\bse\s+(potessi|volessi|dovessi|fossi|avessi)\b/.test(t))
      return '"Se" + congiuntivo imperfetto expresses hypothetical/unlikely conditions. The main clause uses the conditional.';
    return null;
  },

  'node-23': (t, e) => {
    // Passivo e impersonale
    if (/\b(viene|vengono|è stato|è stata|sono stati|sono state)\s+\w+[at][oaie]\b/.test(t))
      return 'Passive voice: essere/venire + past participle. "Il libro è stato scritto" (The book was written).';
    if (/\bsi\s+\w+(?:a|e|ano|ono)\b/.test(t) && !/\b(mi|ti|ci|vi)\b/.test(t))
      return '"Si" impersonal/passive: "Si mangia bene qui" (One eats well here / You eat well here). Very common in Italian.';
    return null;
  },

  'node-24': (t, e) => {
    // Connettori avanzati
    if (/\b(tuttavia|ciononostante|nondimeno|eppure|peraltro|bensì|anzi)\b/.test(t))
      return 'Formal contrastive connector. These elevate register: tuttavia (however), anzi (on the contrary), bensì (but rather).';
    if (/\b(di conseguenza|pertanto|dunque|perciò|quindi|per cui)\b/.test(t))
      return 'Causal/consequential connector: introduces a result or conclusion from the preceding statement.';
    if (/\b(in quanto|dato che|poiché|siccome|visto che|dal momento che)\b/.test(t))
      return 'Causal connector: introduces the reason. "Poiché" and "dal momento che" are more formal than "perché".';
    return null;
  },

  'node-25': (t, e) => {
    // Perifrasi verbali
    if (/\bstare per\b/.test(t))
      return '"Stare per + infinitive" = to be about to. "Sto per uscire" = I\'m about to go out.';
    if (/\b(continuare|smettere|cominciare|iniziare|finire)\s+(?:a|di)\s+\w+(?:are|ere|ire)\b/.test(t))
      return 'Verb + a/di + infinitive: continuare a (continue to), smettere di (stop), cominciare a (begin to). The preposition is fixed.';
    if (/\b(riuscire a|provare a|cercare di|decidere di|promettre di)\b/.test(t))
      return 'Some verbs take a fixed preposition before an infinitive: riuscire a, cercare di, decidere di. Must be memorized.';
    return null;
  },

  'node-26': (t, e) => {
    // Congiuntivo passato e trapassato
    if (/\b(abbia|abbiano)\s+\w+[at]o\b/.test(t))
      return 'Congiuntivo passato: abbia/sia + participio. "Credo che abbia finito" — past subjunctive for completed actions.';
    if (/\b(sia|siano)\s+\w+[at][oaie]\b/.test(t) && !/\b(è|sono)\s/.test(t))
      return 'Congiuntivo passato with essere: "Penso che sia arrivato" — participle agrees with subject.';
    if (/\b(avesse|avessero)\s+\w+[at]o\b/.test(t))
      return 'Congiuntivo trapassato: avessi/fossi + participio. "Se avesse saputo..." — for past unreal conditions.';
    return null;
  },

  // C1 ─────────────────────────────────────────────────────────────
  'node-27': (t, e) => {
    // Discorso indiretto avanzato
    if (/\b(disse|esclamò|rispose|aggiunse|suggerì|raccomandò|ordinò)\s+(?:che|di)\b/.test(t))
      return 'Literary reported speech uses passato remoto as reporting verb: disse che, rispose che. More formal register.';
    return null;
  },

  'node-28': (t, e) => {
    // Sfumature del congiuntivo
    if (/\bcome se\b/.test(t))
      return '"Come se" (as if) always takes congiuntivo imperfetto or trapassato: "Parla come se sapesse tutto."';
    if (/\bchiunque\b/.test(t))
      return '"Chiunque" (whoever) takes the subjunctive: "Chiunque venga, sarà il benvenuto."';
    if (/\b(qualunque|qualsiasi)\b/.test(t))
      return '"Qualunque/qualsiasi" (whatever/whichever) + subjunctive expresses indifference to the choice.';
    if (/\b(ovunque|dovunque)\b/.test(t))
      return '"Ovunque/dovunque" (wherever) takes the subjunctive: "Ovunque tu vada, ti seguirò."';
    return null;
  },

  'node-29': (t, e) => {
    // Registro e stile formale
    if (/\bLei\b/.test(t) && /\b(vuole|desidera|preferisce|potrebbe|vorrebbe)\b/.test(t))
      return 'Formal "Lei" (You, formal) uses third-person singular verb forms: "Lei desidera un caffè?"';
    return null;
  },

  'node-30': (t, e) => {
    // Espressioni idiomatiche
    if (/\bnon (?:vedo|vede|vedeva|vedrà) l'ora\b/.test(t))
      return '"Non vedere l\'ora di" = can\'t wait to. Literally "not seeing the hour of". Very common idiom.';
    if (/\bin bocca al lupo\b/.test(t))
      return '"In bocca al lupo" = good luck (lit. "into the wolf\'s mouth"). Reply: "Crepi!" (May it die!).';
    if (/\bavere\s+\w+\s+in\s+mente\b/.test(t) || /\btenere\s+in\s+mente\b/.test(t))
      return '"Avere/tenere in mente" = to have in mind, to keep in mind. Common idiomatic expression.';
    return null;
  },

  'node-31': (t, e) => {
    // Sintassi complessa
    if (/\b(pur|pur\s+\w+ando|pur\s+\w+endo)\b/.test(t))
      return '"Pur + gerundio" = although/even though: "Pur essendo stanco, ha continuato." Concessive construction.';
    if (/\b(non solo|non soltanto)\b.*\bma\s+anche\b/.test(t))
      return '"Non solo... ma anche" = not only... but also. Correlative conjunction for emphasis.';
    return null;
  },

  // C2 ─────────────────────────────────────────────────────────────
  'node-32': (t, e) => {
    // Advanced congiuntivo and mixed mood usage (actual content)
    if (/\bche\b/.test(t) && /\b(sia|abbia|faccia|vada|stia|dica|possa|debba)\b/.test(t))
      return 'Subjunctive after "che": the congiuntivo expresses uncertainty, opinion, wish, or evaluation.';
    if (/\b(a meno che|purché|affinché|prima che|senza che|a patto che)\b/.test(t))
      return 'These conjunctions always trigger the subjunctive: a meno che (unless), prima che (before), senza che (without).';
    if (/\b(il più|la più|i più|le più)\s+\w+\s+che\b/.test(t))
      return 'Superlative relative + "che" takes subjunctive: "È il libro più bello che io abbia letto."';
    if (/\b(penso|credo|spero|voglio|dubito|temo|immagino)\s+che\b/.test(t))
      return 'Verbs of opinion/wish/doubt + "che" require the congiuntivo. This is one of Italian\'s signature features.';
    if (/\b(bisogna|occorre|è necessario|è importante|è meglio)\s+che\b/.test(t))
      return 'Impersonal necessity + "che" triggers the subjunctive: "Bisogna che tu studi."';
    return null;
  },

  'node-33': (t, e) => {
    // More congiuntivo and complex subjunctive (actual content)
    if (/\b(a meno che|purché|affinché|prima che|senza che)\b/.test(t))
      return 'Conjunction requiring congiuntivo: these subordinating conjunctions always trigger the subjunctive mood.';
    if (/\b(credo|penso|spero|dubito|immagino|suppongo|temo)\s+che\b/.test(t))
      return 'Verbs of mental state + "che" trigger the subjunctive to express subjective assessment or uncertainty.';
    if (/\b(bisogna|occorre|è necessario|è bene|è ora|è tempo)\s+che\b/.test(t))
      return 'Impersonal expression of necessity + "che" always requires the subjunctive mood.';
    if (/\bprima che\b/.test(t))
      return '"Prima che" (before) + congiuntivo: "Prima che me ne vada..." — temporal subordination requires subjunctive.';
    if (/\bche\b/.test(t) && /\b(sia|abbia|venga|vada|faccia|possa|debba|sappia|voglia|capiscano|studino)\b/.test(t))
      return 'The subjunctive form in this sentence signals that the main clause expresses opinion, wish, necessity, or doubt.';
    return null;
  },

  'node-34': (t, e) => {
    // Imperativo (actual content is commands/instructions)
    if (/^(?:non\s+)?\w+[aei]!/i.test(t) || /\b!\s*$/.test(t))
      return 'Imperative mood (imperativo): used for commands, instructions, and requests. Exclamation mark signals a directive.';
    if (/^(?:prenda|prendi|prendiamo|prendete)\b/i.test(t))
      return 'Imperativo of "prendere": prendi (tu), prenda (Lei formal), prendiamo (noi), prendete (voi).';
    if (/^(?:ricorda|ricordami|ricordati)\b/i.test(t))
      return 'Imperativo with pronouns: "Ricordami di..." — pronouns attach to the end of affirmative commands.';
    if (/^(?:assaggia|assaggiate|servi|servite|prepara|preparate)\b/i.test(t))
      return 'Imperative for instructions: commonly used in recipes, directions, and everyday requests.';
    if (/\b(figurati|macché|magari|mica|mah|boh)\b/.test(t))
      return 'Colloquial Italian expressions: figurati (don\'t mention it), macché (no way), magari (I wish), mica (not at all).';
    if (/^[A-Z]/.test(t) && t.split(/\s+/).length <= 8)
      return 'Imperative or directive expression: used in everyday Italian for commands, suggestions, or instructions.';
    return null;
  },

  'node-35': (t, e) => {
    // Padronanza avanzata
    if (/\bchecché\b/.test(t))
      return '"Checché" + subjunctive = whatever/regardless of. Very literary: "Checché se ne dica..." (Whatever they say...).';
    if (/\ba prescindere da\b/.test(t))
      return '"A prescindere da" = regardless of. Can be followed by a noun or "ciò che" + subjunctive clause.';
    return null;
  },
};

// ── Run enrichment ───────────────────────────────────────────────

const TARGET_PCT = 0.30; // 30% coverage target
let totalAdded = 0;
const nodeReport = [];

for (const node of Object.keys(TIP_GENERATORS).sort()) {
  const generator = TIP_GENERATORS[node];
  const nodeCards = deck.filter(c => c.grammarNode === node);
  const withTips = nodeCards.filter(c => c.grammar && c.grammar.trim().length > 0);
  const currentPct = withTips.length / nodeCards.length;

  // How many tips do we need?
  const target = Math.ceil(nodeCards.length * TARGET_PCT);
  const needed = target - withTips.length;

  if (needed <= 0) {
    nodeReport.push({ node, total: nodeCards.length, before: withTips.length, added: 0, after: withTips.length });
    continue;
  }

  // Try to generate tips for cards without them
  const candidates = nodeCards.filter(c => !c.grammar || c.grammar.trim() === '');
  let added = 0;

  for (const card of candidates) {
    if (added >= needed) break;
    const tip = generator(card.target.toLowerCase(), card.english.toLowerCase());
    if (tip) {
      if (!DRY_RUN) {
        card.grammar = tip;
      }
      added++;
    }
  }

  totalAdded += added;
  nodeReport.push({ node, total: nodeCards.length, before: withTips.length, added, after: withTips.length + added });
}

// ── Report ───────────────────────────────────────────────────────

console.log('=== GRAMMAR TIP ENRICHMENT ===');
console.log(`Target: ${(TARGET_PCT * 100).toFixed(0)}% coverage\n`);
console.log('Node     | Total | Before | Added | After  | Coverage');
console.log('---------|-------|--------|-------|--------|--------');
for (const r of nodeReport) {
  const pct = (r.after / r.total * 100).toFixed(0);
  const status = r.after === 0 ? ' ✗' : parseInt(pct) < 30 ? ' ⚠' : ' ✓';
  console.log(`${r.node.padEnd(9)}| ${String(r.total).padStart(5)} | ${String(r.before).padStart(6)} | ${String(r.added).padStart(5)} | ${String(r.after).padStart(6)} | ${pct.padStart(4)}%${status}`);
}

const totalCards = deck.length;
const totalWithTips = deck.filter(c => c.grammar && c.grammar.trim().length > 0).length;
console.log(`\nTotal: ${totalWithTips}/${totalCards} (${(totalWithTips / totalCards * 100).toFixed(1)}%)`);
console.log(`Added: ${totalAdded} new tips`);

if (!DRY_RUN) {
  fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
  console.log('Saved to deck.json');
} else {
  console.log('(dry run — no changes)');
}
