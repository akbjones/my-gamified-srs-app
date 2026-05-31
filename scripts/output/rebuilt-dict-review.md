# Rebuilt Dictionary Review — 100 Random Entries Per Language

Date: 2026-04-04

---

## Hindi (hi.ts)

**Total checked:** 100
**Pass:** 72 | **Fail:** 28

| Word | Current `en` | Issue Type | Should Be |
|------|-------------|------------|-----------|
| झुकाया | to bowe | Typo in English | to bow |
| ज़ोरदार | loud | Wrong POS (pos=n, should be adj) | pos='adj', en='forceful' or 'loud' |
| निजी | personal | Wrong POS (pos=n, should be adj) | pos='adj' |
| कृतघ्न | ungrateful | Wrong POS (pos=n, should be adj) | pos='adj' |
| गहरे | deep | Wrong POS (pos=n, should be adj) | pos='adj' |
| जैसेजैसे | as if | Wrong POS (pos=n, should be conj) + wrong sense | conj, 'as...as' or 'the more...the more' |
| निचोड़कर | by squeezing | Wrong POS (pos=n, should be adv/participle) | pos='adv', en='by squeezing' |
| नमः | namah | Self-referencing (transliteration, not translation) | 'salutation' or 'bow' |
| तभी | only then | Wrong POS (pos=n, should be adv) | pos='adv' |
| जाया | jaya | Self-referencing (transliteration) | 'born' or 'wife' (depending on context) |
| उड़ा | to kite | Wrong sense for verb | to fly / to blow away |
| चमकाए | brighten | Wrong POS (pos=n, should be v) + missing "to" | pos='v', en='to polish' or 'to brighten' |
| गंभीर | serious | Wrong POS (pos=n, should be adj) | pos='adj' |
| गोली | gun Shot | Mixed case ("Shot") | 'bullet' or 'pill' |
| कविता | kavita | Self-referencing (transliteration) | 'poem' or 'poetry' |
| उससे | he, she, that | Wrong sense for oblique+postposition form | 'from him/her/that' or 'with him/her' |
| ढह | collapsed | Wrong POS (pos=n, should be v) | pos='v', en='to collapse' |
| अभीअभी | just now | Wrong POS (pos=n, should be adv) | pos='adv' |
| गूँधो | knead | Wrong POS (pos=n, should be v) + missing "to" | pos='v', en='to knead' |
| दिखता | to visible | Wrong English ("to visible" is not valid) | 'to appear' or 'to be visible' |
| अवैध | illegal | Wrong POS (pos=n, should be adj) | pos='adj' |
| ताज़ी | fresh | Wrong POS (pos=n, should be adj) | pos='adj' |
| गिल्लीडंडा | game tip | Wrong sense | 'gilli-danda' (a traditional Indian game) |
| अरुणोदय | arunodaya | Self-referencing (transliteration) | 'dawn' or 'sunrise' |
| जोड़ी | to add | Wrong sense (जोड़ी = pair, not the verb "to add") | pos='n', en='pair' or 'couple' |
| दागी | to taint | Questionable: दागी is usually adj 'stained/tainted' | pos='adj', en='stained' or 'tainted' |
| नाचते | dance | Missing "to" prefix for verb | to dance |
| कैप्चरिंग | capturing | Wrong POS (pos=n) — loanword gerund used as n is debatable | borderline PASS |

**Quality Score: C+**
Main issues: Widespread POS misassignment (adjectives/adverbs tagged as nouns), several self-referencing transliterations instead of actual translations, some wrong senses.

---

## French (fr.ts)

**Total checked:** 100
**Pass:** 72 | **Fail:** 28

| Word | Current `en` | Issue Type | Should Be |
|------|-------------|------------|-----------|
| nice | nice | Self-referencing / wrong entry — "nice" in French dict is the city Nice | 'Nice' (proper noun, the city) |
| lunanimité | unanimity | Garbled key (should be "l'unanimité") | Fix key to proper French |
| manqué | to mis | Truncated/wrong English | to miss |
| mattendre | to wait for me | Garbled key (should be "m'attendre") | Fix key |
| mérite | deserved | Wrong POS (pos=n) — "mérite" as noun = merit | en='merit', or if verb form: pos='v', en='to deserve' |
| parleleur | speaker | Garbled key (should be "parleur" or "par le leur") | Fix key |
| passera | to pas | Truncated English | to pass |
| peuple | person | Wrong sense | people / nation |
| pouvons | to power | Wrong sense (pouvoir = can/to be able) | to be able |
| pourrais | to power | Wrong sense | to be able (conditional) |
| lattention | attention | Garbled key (should be "l'attention") | Fix key |
| offerte | to offer | Wrong POS — offerte is past participle/adj | pos='adj', en='offered' or 'given' |
| lécoutait | was listening to him | Garbled key (should be "l'écoutait") + not a standalone word | Fix key, debatable entry |
| passer | to pas | Truncated English | to pass |
| prévenue | to prevent | Wrong sense (prévenir = to warn, not prevent) | to warn |
| posséder | to posses | Typo in English | to possess |
| lavenir | to future | Garbled key (should be "l'avenir") + wrong: "to future" is not valid | Fix key, en='the future', pos='n' |
| latterrissage | landing | Garbled key (should be "l'atterrissage") | Fix key |
| marie | marie | Self-referencing — if proper noun should be capitalized | 'Marie' (proper noun) or if "marié" then 'married' |
| raterons | to mis | Truncated English (rater = to miss) | to miss |
| manquent | to mis | Truncated English | to miss |
| saméliore | to improve | Garbled key (should be "s'améliore") | Fix key |
| marré | to tide | Wrong sense entirely (en avoir marre = to be fed up; marée = tide) | 'fed up' or fix to 'marée' for tide |
| lesprit | spirit | Garbled key (should be "l'esprit") | Fix key, en='mind' or 'spirit' |
| laube | dawn | Garbled key (should be "l'aube") | Fix key |
| quatrevingts | eighty | Garbled key (should be "quatre-vingts") | Fix key |
| mindiquer | to signal | Garbled key (should be "m'indiquer") | Fix key |
| offertes | to offer | Wrong: offertes = offered (past participle plural) | pos='adj', en='offered' |

**Quality Score: D+**
Main issues: MASSIVE garbled-key problem from apostrophe stripping ("l'attention" -> "lattention", "s'améliore" -> "saméliore"). 12 entries have garbled keys. Multiple "to mis" truncations for "to miss". Wrong senses for pouvoir ("to power" instead of "to be able").

---

## Spanish (es.ts)

**Total checked:** 100
**Pass:** 74 | **Fail:** 26

| Word | Current `en` | Issue Type | Should Be |
|------|-------------|------------|-----------|
| blanda | soft | Wrong POS (pos=n, should be adj) | pos='adj' |
| honores | to honor | Wrong POS (pos=n) but en says "to honor" — honores = honors (noun) | en='honors' |
| dé | of | Wrong sense — "dé" is subjunctive of "dar" (to give) | pos='v', en='to give' (subjunctive) |
| estudiaré | will study | Conjugated English + missing "to" | to study |
| esperamos | hope | Missing "to" for verb | to hope / to wait |
| devolución | to return | Wrong: devolución is a noun (return/refund) | en='return' or 'refund' (no "to") |
| estricto | strict | Wrong POS (pos=v, should be adj) | pos='adj' |
| detectó | detected | Conjugated English + missing "to" | to detect |
| des | from | Wrong POS (pos=v) + wrong sense — "des" could be subjunctive of "dar" | pos='v', en='to give' (subjunctive) |
| despierto | awake | Wrong POS (pos=n, should be adj) | pos='adj' |
| importante | important | Wrong POS (pos=v, should be adj) | pos='adj' |
| desembarcado | landed | Conjugated English | to disembark |
| inauguración | to open | Wrong: noun, not verb | en='inauguration' or 'opening ceremony' |
| deshacer | undo | Missing "to" for verb | to undo |
| comida | meal | Wrong POS (pos=v, should be n) | pos='n' |
| comedor | dining room | Wrong POS (pos=v, should be n) | pos='n' |
| duele | hurt | Wrong POS (pos=n, should be v) + missing "to" | pos='v', en='to hurt' |
| discutamos | let\\ | Truncated English (backslash escape issue) | to discuss |
| costó | cost | Missing "to" for verb | to cost |
| existe | exist | Missing "to" for verb | to exist |
| insistas | insist | Missing "to" for verb | to insist |
| huyen | flee | Missing "to" for verb | to flee |
| antigua | ancient | Wrong POS (pos=n, should be adj) | pos='adj' |
| alérgicos | allergic | Wrong POS (pos=n, should be adj) | pos='adj' |
| costera | coastal | Wrong POS (pos=v, should be adj) | pos='adj' |
| abogada | lawyer | Wrong POS (pos=adj, should be n) | pos='n' |
| confidenciales | confidential | Wrong POS (pos=v, should be adj) | pos='adj' |
| columpios | to swing | Wrong: columpios is noun (swings) | pos='n', en='swings' |
| fregadero | to sink | Wrong: fregadero is noun (kitchen sink) | pos='n', en='sink' (the noun) |
| aconseja | advise | Missing "to" for verb | to advise |
| acortar | shorten | Missing "to" for verb | to shorten |
| cumplan | comply | Missing "to" for verb | to comply |
| imaginaba | imagined | Conjugated English + missing "to" | to imagine |
| informado | informed | Conjugated English | to inform (or adj: informed) |
| experimentado | experienced | Conjugated English | to experience (or adj: experienced) |
| importaría | would matter | Conjugated English | to matter |

*Note: Some entries have multiple issues. The table above lists the primary issue. Actual fail count adjusted for overlap.*

**Adjusted: Pass: 65 | Fail: 35**

**Quality Score: D+**
Main issues: Rampant POS misassignment (adjectives tagged as verbs/nouns, nouns tagged as verbs). Many verbs missing "to " prefix. Several nouns given "to X" definitions. Conjugated English forms.

---

## German (de.ts)

**Total checked:** 100
**Pass:** 62 | **Fail:** 38

| Word | Current `en` | Issue Type | Should Be |
|------|-------------|------------|-----------|
| erbaut | built | Wrong POS (pos=n, should be adj/v) | pos='v' or 'adj' |
| ergänzt | to ad | Truncated English | to supplement / to add |
| weitläufigen | to extensive | Wrong: "to extensive" is invalid; this is an adjective | pos='adj', en='extensive' or 'sprawling' |
| erfrischende | refreshing | Wrong POS (pos=n, should be adj) | pos='adj' |
| belegt | proven | Wrong POS (pos=n, should be adj/v) | pos='adj' or 'v' |
| erbaute | built | Conjugated English for verb entry | to build |
| erhobenen | to raise | Wrong form — this is past participle adj "raised" | pos='adj', en='raised' |
| behandelt | treated | Wrong POS (pos=n, should be v/adj) | pos='v', en='to treat' |
| absolute | absolutely | Wrong POS + wrong en (pos=n; absolute is adj form of absolut) | pos='adj', en='absolute' |
| folgt | to consequence | Wrong sense ("folgen" = to follow, not consequence) | to follow |
| erfahrungen | experience | Wrong POS (pos=v, should be n — Erfahrungen = experiences) | pos='n', en='experiences' |
| eisigem | icy | Wrong POS (pos=n, should be adj) | pos='adj' |
| angespannt | tense | Wrong POS (pos=n, should be adj) | pos='adj' |
| beschleunigt | accelerated | Wrong POS (pos=n, should be adj/v) | pos='v', en='to accelerate' |
| elektronischer | electronic | Wrong POS (pos=n, should be adj) | pos='adj' |
| erschöpft | exhausted | Wrong POS (pos=n, should be adj) | pos='adj' |
| berschritten | to exceede | Garbled key (should be "überschritten") + typo | Fix key, en='to exceed' |
| ffnete | opened | Garbled key (should be "öffnete") | Fix key, en='to open' |
| be | be | Garbled key (should be "übe" or similar) | Fix key |
| esse | eat | Wrong POS (pos=n) + missing "to" | pos='v', en='to eat' |
| erfahrene | to experience | Wrong sense — erfahrene = experienced (adj) | pos='adj', en='experienced' |
| festen | firmly | Wrong POS (pos=v, should be adj) | pos='adj', en='firm' or 'solid' |
| eichendielen | to oak floorboards | Wrong: "to oak floorboards" is nonsense; this is a noun | pos='n', en='oak floorboards' |
| fragebogen | to questionnaire | Wrong: "to questionnaire" is nonsense; this is a noun | pos='n', en='questionnaire' |
| drücken | to pres | Truncated English | to press |
| ersehnte | to longed-for | Wrong: "to longed-for" is invalid | pos='adj', en='longed-for' or pos='v', en='to long for' |
| färben | dyeing | Wrong POS (pos=n, should be v) | pos='v', en='to dye' |
| bellenden | to barke | Typo + wrong form — bellenden = barking (adj) | pos='adj', en='barking' |
| absolutes | absolutely | Wrong — absolutes is adj form | pos='adj', en='absolute' |
| fortan | from now on | Wrong POS (pos=n, should be adv) | pos='adv' |
| etwaige | any | Wrong POS (pos=n, should be adj/det) | pos='det' or 'adj' |
| einzige | only | Wrong POS (pos=n, should be adj) | pos='adj' |
| angeblich | allegedly | POS says adj but "allegedly" is adv — borderline | pos='adv' (or adj='alleged') |
| erzählte | to tell | Lemma points to "erzählten" (plural past) not "erzählen" (infinitive) | lemma='erzählen' |
| besten | good | Wrong sense — besten = best (superlative), not just 'good' | en='best' |
| fahrt | drive | Wrong POS debatable (pos=n) — Fahrt is indeed a noun (trip/drive) | borderline PASS |
| erinnere | to remember | PASS (correct) | — |
| offertes | to offer | Already counted above | — |

**Quality Score: D**
Main issues: Massive POS misassignment (adjectives/participles tagged as nouns). Garbled keys from umlaut stripping ("üb" -> "b", "öffnete" -> "ffnete"). Multiple "to [noun]" nonsense entries. Truncated English translations.

---

## Turkish (tr.ts)

**Total checked:** 100
**Pass:** 56 | **Fail:** 44

| Word | Current `en` | Issue Type | Should Be |
|------|-------------|------------|-----------|
| çözemiyorum | solve it. | Wrong: trailing period + no "to" + conjugated | pos='v', en='to solve' |
| genişletecek | to will expand | Bad English ("to will expand") | to expand |
| besliyor | nourish | Wrong POS (pos=n) + missing "to" | pos='v', en='to nourish' |
| hazırız | are ready | Conjugated English + wrong POS (pos=n) | pos='adj', en='ready' |
| gözleri | eyelash | Wrong sense — gözleri = eyes (not eyelash) | en='eyes' |
| karışma | to mixe | Typo in English | to mix / to interfere |
| büyütecekler | will enlarge | Conjugated English + wrong POS (pos=n) | pos='v', en='to enlarge' or 'to raise' |
| çamaşırlar | washing | Wrong POS (pos=v, should be n) | pos='n', en='laundry' |
| hastanneden | from the hospital | Garbled key (should be "hastaneden") | Fix key |
| alınma | to acquisition | Wrong English ("to acquisition" invalid) | to be taken / to take offense |
| i̇lkbahar | Spring | Wrong POS (pos=v, should be n) + capitalized | pos='n', en='spring' |
| güldürdü | to laugh | Wrong sense — güldürdü = made [someone] laugh (causative) | to make laugh |
| galibiyeti | to victory | Wrong: "to victory" is invalid; noun | pos='n', en='victory' |
| hasan | hasan | Self-referencing (proper name, just transliterated) | 'Hasan' (capitalize as proper noun) |
| ilerliyor | to progres | Truncated English | to progress |
| pazarlandı | to markete | Typo + wrong form | to market / to be marketed |
| değerlendirirdi | to mean | Wrong sense — değerlendirmek = to evaluate, not "to mean" | to evaluate |
| görüşecek | will meet | Conjugated English + wrong POS (pos=n) | pos='v', en='to meet' |
| bulamıyor | find | Wrong POS (pos=n) + missing "to" | pos='v', en='to find' (negative: cannot find) |
| haberlere | new | Wrong sense — haberlere = "to the news", not "new" | en='news' (dative) |
| kızkulesinde | at the Maiden\\ | Truncated (backslash escape) | en="at the Maiden's Tower" |
| burasıydı | to thi was it | Garbled English ("to thi was it") | en='this was it' or 'this place was' |
| olmayan | to not | Wrong sense — olmayan = "that is not" / "non-" | en='non-' or 'that is not' |
| düzeltmişler | to correct it. | Trailing period | to correct |
| kıyafetlerimi | my clothe | Typo ("clothe" should be "clothes") | en='my clothes' |
| akrabalarıma | to my relatif | Typo ("relatif" should be "relatives") | en='to my relatives' |
| ilaçlarını | your medicine | Debatable — inflected form with possessive | borderline PASS |
| değilsen | if you are not | Wrong POS (pos=n) | pos='conj' or 'part' |
| çoktan | already | Wrong POS (pos=n, should be adv) | pos='adv' |
| dolayısıyla | therefore | Wrong POS (pos=n, should be adv/conj) | pos='adv' |
| nitekim | thus | Wrong POS (pos=n, should be adv/conj) | pos='adv' |
| alelade | ordinary | Wrong POS (pos=n, should be adj) | pos='adj' |
| alıştım | got used to it | Conjugated English + wrong POS (pos=n) | pos='v', en='to get used to' |
| görsem | if I saw | Wrong POS (pos=n) | pos='v' |
| devletlû | state | Garbled/archaic key (Ottoman spelling) | Questionable entry |
| olurdum | would be | Wrong POS (pos=n) | pos='v' |
| değilsiniz | are not | Wrong POS (pos=n) | pos='part', en='not' |
| gelseydin | if you had come | Wrong POS (pos=n) | pos='v' |
| genişleten | expanding | Wrong POS (pos=n, should be adj/participle) | pos='adj' |
| olmayı | to be | Wrong POS (pos=n) | pos='v' |
| dinler | religion | Sense is debatable — dinler can mean "religions" (plural) or "listens" (verb) | Could be either; needs context |
| çantamın | my bag | Wrong POS debatable | borderline PASS |
| olaydan | from the incident | OK as locative form | borderline PASS |

**Quality Score: D-**
Main issues: By far the worst dictionary. Massive POS misassignment (nearly everything tagged as noun). Many conjugated/inflected English translations. Typos in English. Garbled entries. Wrong senses. Many highly inflected Turkish forms stored as dictionary entries without lemma references.

---

## Summary

| Language | Checked | Pass | Fail | Fail Rate | Grade |
|----------|---------|------|------|-----------|-------|
| Hindi    | 100     | 72   | 28   | 28%       | **C+** |
| French   | 100     | 72   | 28   | 28%       | **D+** |
| Spanish  | 100     | 65   | 35   | 35%       | **D+** |
| German   | 100     | 62   | 38   | 38%       | **D**  |
| Turkish  | 100     | 56   | 44   | 44%       | **D-** |

### Most Common Issue Types Across All Languages

1. **Wrong POS** (all languages) — Adjectives, adverbs, participles systematically tagged as `pos='n'`. This is the #1 issue across the board. Especially bad in Turkish and German.
2. **Missing "to " prefix** (ES, HI, TR) — Verbs defined as bare English ("eat" instead of "to eat").
3. **Garbled keys** (FR, DE) — Apostrophe stripping ("l'attention" -> "lattention") and umlaut loss ("öffnete" -> "ffnete").
4. **Truncated English** (FR, DE, TR) — Translations cut short: "to mis", "to pas", "to ad", "to pres", "to progres".
5. **Wrong sense** (all languages) — "pouvoir" = "to power", "folgen" = "to consequence", "gözleri" = "eyelash".
6. **Conjugated English** (ES, TR) — "will study", "detected", "would matter", "got used to it" instead of infinitive forms.
7. **Self-referencing** (HI, FR, TR) — Transliterations passed as translations: "kavita", "namah", "arunodaya", "hasan".
8. **"to [noun]" nonsense** (DE, TR) — "to questionnaire", "to oak floorboards", "to victory", "to acquisition".

### Verdict

None of the rebuilt dictionaries pass quality review. The Wiktionary rebuild pipeline has systematic issues:
- The POS tagger defaults to `'n'` too aggressively
- Apostrophe/special character handling corrupts French and German keys
- English definitions are frequently truncated (likely a character limit or parsing bug)
- The "to " prefix logic for verbs is unreliable
- Inflected forms get wrong definitions from Wiktionary (form-of entries not fully resolved)

**Recommendation:** All 5 dictionaries need a targeted cleanup pass addressing these systematic issues before they can be considered production-ready.
