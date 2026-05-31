# AI Card-Level Audit Report

Generated: 2026-04-26T18:25:12.888Z

## ES (541 issues)

- **High**: 34
- **Medium**: 271
- **Low**: 236

### High-severity samples

- **es-0089** (WRONG_TRANSLATION): Spanish is third-person 'He/She arrives' not imperative 'Arrive'; should be 'He arrives two hours early' or 'She arrives two hours early'
- **es-0432** (WRONG_TRANSLATION): 'A las nueve menos diez' means 'at ten minutes to nine' (8:50), not '10 to 9'
- **es-0630** (WRONG_REGISTER): "coja" is formal imperative (usted); translation should reflect formality: "Don't take a taxi without a meter" reads informal. Better: "Don't take a taxi that doesn't have a meter" or preserve formality with "Do not take"
- **es-0976** (WRONG_TRANSLATION): 'Paso' = 'I spend' present tense, but sentence structure suggests 'I spent' or habitual; context unclear—likely past or conditional needed
- **es-1049** (WRONG_TRANSLATION): 'Está lloviendo mucho, lleva paraguas' — second clause is imperative (tú). Translation missing imperative force: should be 'It's raining a lot, take an umbrella' (correct) but reads as statement. Actually translation is correct; no issue.
- **es-1287** (WRONG_TRANSLATION): "puso los puntos sobre las íes" means to settle something definitively/clarify points; translation "set things straight" misses the idiom's meaning of laying out facts clearly
- **es-1243** (WRONG_TRANSLATION): 'por la leche' = 'for the milk' (reason/purpose), not 'to the supermarket for the milk'; English missing explicit 'for'
- **es-1353** (WRONG_TRANSLATION): Se me fue el santo al cielo is an idiom meaning 'I had a complete mental lapse/forgot utterly' — not just about missing an appointment. Translation misses the idiomatic strength.
- **es-1410** (WRONG_TRANSLATION): 'Se me fue el santo al cielo' is an idiomatic Spanish phrase meaning 'my mind went blank' or 'I spaced out'—not literal 'it completely slipped my mind'; the translation misses the colloquial tone
- **es-1656** (WRONG_TRANSLATION): In Spanish, 'suena a chino' means 'sounds like Chinese'; the English idiom 'sounds like Greek' is the correct equivalent, but the translation should acknowledge this is an idiom adaptation, not a literal error

## FR (627 issues)

- **High**: 73
- **Medium**: 330
- **Low**: 224

### High-severity samples

- **fr-0365** (WRONG_TRANSLATION): 'Je suis' means 'I follow' but 'suis' is present tense of suivre; translation is correct but the word order in French is oddly formal. However, the actual English is accurate.
- **fr-0373** (WRONG_TRANSLATION): 'Il me suffit d'une heure' means 'An hour is enough for me' or 'One hour suffices for me', not 'One hour is enough for me' - the subject is 'une heure', not 'il'. Better: 'An hour is enough for me'
- **fr-0598** (WRONG_TRANSLATION): payante means 'paid; requires payment', not 'not free' — the English should be 'The entrance requires payment' or 'costs money'
- **fr-0818** (WRONG_TRANSLATION): French text has typo 'il y à' (should be 'il y a'); English translation is correct but source is malformed
- **fr-0894** (WRONG_TRANSLATION): French is 'J'ai téléphone' (present perfect), but accent missing on past participle—should be 'J'ai téléphoné'. English translation correct, but card source has typo
- **fr-0917** (WRONG_TRANSLATION): garé is misspelled; should be 'gare' (train station), not 'garé' (parked)
- **fr-0925** (WRONG_TRANSLATION): voyagé is misspelled; should be 'voyage' (trip), not 'voyagé' (traveled)
- **fr-1060** (WRONG_TRANSLATION): porté is misspelled in source; should be 'porte' (door). As written, 'porté' (carried) doesn't make sense. Assuming typo: sentence is correct but source has error
- **fr-1139** (WRONG_TRANSLATION): French says 'il y à trois ans' (malformed); should be 'il y a trois ans' (there is/are). English 'three years ago' is correct translation but French text has typo/error
- **fr-1189** (WRONG_TRANSLATION): French text has spelling error 'porté' (should be 'porte'), but translation is correct for intended meaning

## IT (526 issues)

- **High**: 46
- **Medium**: 294
- **Low**: 186

### High-severity samples

- **it-0162** (WRONG_TRANSLATION): impersonal 'ne ha' = 'Do you have' is wrong subject shift; should be 'Have you got any bigger ones?' or 'Are there bigger ones?'
- **it-0221** (WRONG_TRANSLATION): "Permetto che usciate presto" means "I allow that you leave early" or "I'm allowing you to leave early"; translation misses the subjunctive nuance of permitted action
- **it-0491** (WRONG_TRANSLATION): gomma = rubber; eraser is 'gomma per cancellare' but gomma alone means rubber (material)
- **it-0564** (WRONG_TRANSLATION): 'Quando è la prossima fermata?' is 'When is the next stop?' but should clarify this asks for timing, not identification – better: 'What is the next stop?' or 'Where is the next stop?'
- **it-0621** (WRONG_TRANSLATION): sentence fragment incomplete; original is incomplete ('Una mela al giorno' = 'An apple a day' but needs completion like 'keeps the doctor away')
- **it-0647** (WRONG_TRANSLATION): amaro typically means bitter for liquids but syrup is rarely described as bitter; more likely sour or acrid
- **it-0832** (WRONG_TRANSLATION): "Io ho fame" translates to "I am hungry" (literally "I have hunger"), not "I'm hungry" presented as a statement about current state. The English is correct but the Italian idiom needs explanation: fame/sete/sonno/caldo use avere, not essere.
- **it-0833** (WRONG_TRANSLATION): Same issue: "Tu hai sete" uses avere idiomatically for "You are thirsty," not a direct object possession.
- **it-0834** (WRONG_TRANSLATION): "Lui ha sonno" idiomatically means "He is sleepy," using avere not essere for this state.
- **it-0835** (WRONG_TRANSLATION): "Noi abbiamo caldo" idiomatically means "We are hot," using avere not essere.

## PT (631 issues)

- **High**: 47
- **Medium**: 314
- **Low**: 270

### High-severity samples

- **pt-0055** (WRONG_TRANSLATION): 'He's missed on the team' is ungrammatical English. Should be: 'He is missed on the team' or 'The team misses him'. 'Fazer falta' = to be missed.
- **pt-0760** (UNNATURAL): 'less bad' is grammatically incorrect English; should be 'not as bad' or 'better'
- **pt-0791** (WRONG_TRANSLATION): "Tá ligado?" is colloquial slang meaning "You get me?" or "You following me?", not "You know what I mean?"
- **pt-1237** (WRONG_TRANSLATION): 'Ela deu certo' means 'She worked out' or 'She was successful/things went well for her', not 'did well at' — the verb is reflexive 'dar certo' (to succeed), not 'dar bem em'
- **pt-1477** (WRONG_TRANSLATION): Imperfect 'dançava' = habitual past; English 'was dancing' suggests continuous action at that moment. Should be 'Everyone used to dance when the music stopped' or clarify the context
- **pt-1549** (WRONG_TRANSLATION): "cobrou o dinheiro que emprestei" means 'he charged/collected the money I lent', but English says 'asked me to pay back the money I lent'—logic is reversed. Should be 'He charged me for the money I borrowed' or similar
- **pt-1591** (WRONG_TRANSLATION): "se acordou com" means "woke up because of" not "woke up with"; should be "He woke up because of the alarm" or "The alarm woke him up"
- **pt-1755** (WRONG_TRANSLATION): 'A gente nos comprometeu' is reflexive; should be 'We committed ourselves to helping' or 'We undertook to help'
- **pt-1797** (WRONG_TRANSLATION): "A gente nos adaptou" is reflexive but the English drops the reflexive sense; should be "We adapted ourselves to the new life" or "We adjusted to the new life"
- **pt-2036** (WRONG_TRANSLATION): 'A gente nos conheceu' is contradictory (a gente = we, nos = us); should be 'We met each other in the bank line' or 'We met in the bank line'

## DE (600 issues)

- **High**: 44
- **Medium**: 277
- **Low**: 279

### High-severity samples

- **de-0178** (WRONG_TRANSLATION): Kitchen closes at 22:00 (ten p.m.), not 'ten' (which is 10 a.m.)
- **de-0148** (WRONG_TRANSLATION): German says 'um neunzehn Uhr' (at 7 p.m./19:00), but translation says 'at seven' which is ambiguous (7 a.m. or p.m.); should be 'at seven p.m.' or 'at 7 p.m.'
- **de-0219** (WRONG_TRANSLATION): 'um halb acht' = at half past seven is correct, but 'halb acht' is 7:30, not 7:30 PM. The translation should specify '7:30 p.m.' or 'half past seven in the evening' to match the bedtime context.
- **de-0377** (WRONG_TRANSLATION): neunzehn Uhr (19:00) is 7 PM, not 7 o'clock in general context; should specify '7 p.m.' or '19:00'
- **de-0384** (WRONG_TRANSLATION): halb acht means 7:30 (half before eight), not 'half past seven'; should be 'at half past seven' or 'at 7:30'
- **de-0393** (WRONG_REGISTER): 'echt abgefahren' is very casual/slang; English 'really wild' approximates but 'really cool' or 'really fun' might be more natural for describing a shop
- **de-0501** (WRONG_TRANSLATION): original phrase 'hat das Heft in der Hand und bestimmt, wohin die Reise geht' is an idiom meaning 'she calls the shots/is in control'; translation only captures partial meaning and loses 'has the reins in hand' sense
- **de-0567** (WRONG_TRANSLATION): German has typo 'verbessern' (not standard); assuming 'verbessern' intended as 'to improve', but English should say 'improve' not 'improve his German'—actually the English is correct. The German word itself is misspelled: should be 'verbessern' (correct form) or likely 'sich verbessern' (to improve oneself). Card has a typo.
- **de-0567** (WRONG_TRANSLATION): Typo in German: 'verbessern' is not a standard verb form. Should be 'verbessern' (but this doesn't exist either). Likely intended: 'sein Deutsch verbessern' is non-standard phrasing; should be 'sein Deutsch verbessert' or 'sein Deutsch besser machen' or similar.
- **de-0572** (WRONG_TRANSLATION): Optiker is an optometrist/optician who sells glasses, not a jeweler. Polishing diamonds is not their work.

## NL (685 issues)

- **High**: 63
- **Medium**: 323
- **Low**: 299

### High-severity samples

- **nl-0053** (WRONG_TRANSLATION): Dutch time expression 'tien over half vier' = 10 minutes past 3:30 = 3:40, not 'twenty to four' (3:40)
- **nl-0249** (WRONG_TRANSLATION): Dutch 'tien voor half drie' = 2:20 PM (20 minutes before 2:30), not 2:20 PM as stated. Translation says 'twenty past two' which is 2:20, but source means 2:20 PM which happens to align, yet the phrasing 'ten to two thirty' is clearer. Actually: 'tien voor half drie' = 14:20 (2:20 PM). Translation is correct but awkwardly phrased; should be 'at twenty minutes past two' or 'at ten to half three'.
- **nl-0582** (WRONG_TRANSLATION): 'He has butter on his head and doesn't dare say anything' is literal but misses the idiomatic meaning. This is a Dutch figure of speech meaning someone is guilty/has done wrong but says nothing. Translation should capture the idiom or be flagged as requiring cultural context
- **nl-0421** (WRONG_TRANSLATION): half zeven = half past six is incorrect; half zeven = 6:30 in Dutch (half means 'half way to'), but English translation should be 'half past six' which is 6:30—actually correct. However, Dutch 'half zeven' = 6:30, not 'half past six' in standard English phrasing. The issue is the translation is backwards: Dutch counts down, so 'half zeven' = 6:30 but expressed as 'half to seven' in English. Translation should be 'half past six' but this is imprecise.
- **nl-0433** (WRONG_TRANSLATION): 'van de kaart zijn' means 'to be out of touch' or 'to be disoriented', not 'exhausted'
- **nl-0894** (WRONG_TRANSLATION): "voorstellen" with "aan" means to introduce someone TO someone; "stel de vergadering voor" doesn't align—should be "I introduce the new team member to the meeting" or more naturally "I introduce the new team member to the team" if context differs
- **nl-0904** (WRONG_TRANSLATION): "Even buurten" does not mean "Just popping in to say hi". Likely "Hoe is het hier?" alone, or the Dutch phrase is unclear/colloquial.
- **nl-0857** (WRONG_TRANSLATION): Dutch text has spelling error 'wachtten' (should be 'wachtten' or 'wachten'); but more critically: 'waited' is past tense and correct, translation is sound—however flag the source typo
- **nl-1108** (UNNATURAL): Word order unnatural; should be 'Indeed, it is a beautiful book' or 'It is indeed a beautiful book'
- **nl-1206** (WRONG_TRANSLATION): 'after hours' suggests time duration; should be 'after lasting for hours' or 'after several hours'

## SV (876 issues)

- **High**: 335
- **Medium**: 387
- **Low**: 154

### High-severity samples

- **sv-0093** (WRONG_TRANSLATION): ställer väckarklockan means 'sets the alarm clock' (for time), not a physical location action; the sentence is nonsensical—she wouldn't set an alarm clock in a park
- **sv-0412** (WRONG_TRANSLATION): en kvart = a quarter (of an hour), not literally 'a quarter' without context; should be 'It takes a quarter of an hour' or 'It takes fifteen minutes'
- **sv-0301** (UNNATURAL): English phrasing 'right now probably' is awkward; Swedish 'just nu nog' suggests hesitant timing, better: 'Shouldn't we wait just now?' or 'Shouldn't we wait a bit longer?'
- **sv-0325** (UNNATURAL): English phrasing 'in the evening probably' is unnatural; 'nog' suggests polite query; better: 'Do you have a children's menu in the evening?' or 'Do you have children's portions available in the evening?'
- **sv-0326** (UNNATURAL): 'I suppose' at sentence end is awkward; Swedish 'väl' signals polite uncertainty; better: 'Do you have a vegan option available right now?'
- **sv-0327** (UNNATURAL): 'from here right now I suppose' is awkward; 'just nu väl' is redundant/unclear; better: 'Are there bike paths around here?' or 'Are there bike paths available?'
- **sv-0443** (WRONG_TRANSLATION): 'Yet' placement is confusing; 'No one has complained in the park yet' or restructure needed
- **sv-0444** (UNNATURAL): 'now' at end is contradictory with 'during the week'; likely 'must be locked during the week going forward' or time phrase misplaced
- **sv-0466** (WRONG_TRANSLATION): Swedish doesn't match English; 'Tack detsamma, när jag hörde...' doesn't mean 'Thanks, same to you, when...'. Should be something like 'Thanks, I said the same when I heard the good news today' or this is a garbled sentence
- **sv-0469** (WRONG_TRANSLATION): 'Akta dig' means 'watch out/be careful' (warning), not 'I understand'. Translation completely misrepresents the Swedish meaning

## CY (523 issues)

- **High**: 149
- **Medium**: 251
- **Low**: 123

### High-severity samples

- **cy-0013** (WRONG_TRANSLATION): 'glaear' means mild/temperate weather; should be 'It's mild today' not 'It's mild today'—but the translation IS correct. Actually reviewing: this is correct.
- **cy-0044** (WRONG_TRANSLATION): Welsh has typo 'ymddiheurο' (with Greek omicron); should be 'ymddiheur'; translation itself is correct
- **cy-0260** (WRONG_TRANSLATION): Welsh present tense 'yn gweithio' means 'is working'; 'has been working for a century' would require a perfect aspect not present in the Welsh
- **cy-0265** (WRONG_TRANSLATION): Welsh sentence structure lists languages but the English translation 'There's Welsh, Irish...' misrepresents the content; appears to be a fragment or lists without a main clause equivalent
- **cy-0281** (WRONG_TRANSLATION): Welsh asks about 'carw egnïol neu anobaith' (energetic deer or despair) which is nonsensical; English translation 'Do you have energetic deer or despair?' accurately reflects the Welsh but the Welsh itself appears corrupted or error-containing
- **cy-0283** (WRONG_TRANSLATION): Welsh 'talent troellog a phenelin' (winding talent and elbow) is nonsensical; English 'cooked winding talent and elbow' accurately reflects corrupted Welsh
- **cy-0364** (WRONG_TRANSLATION): Welsh sentence is nonsensical (cooking a wasp and blanket); translation masks the semantic gibberish
- **cy-0384** (WRONG_TRANSLATION): Welsh sentence is nonsensical (cooking an accountant and swan); translation masks the semantic gibberish
- **cy-0138** (WRONG_TRANSLATION): Welsh uses preterite 'Coginiáis i' which is simple past; translation should be 'I cooked' not present context, but spelling 'Coginiáis' is non-standard (should be 'Coginiasais i')
- **cy-0147** (WRONG_TRANSLATION): Welsh 'Caria 'mlaen' is informal imperative; English should be 'Carry on' (informal) not formal. Also 'rwyt ti'n gwella' = 'you're improving' is accurate

## HI (862 issues)

- **High**: 150
- **Medium**: 420
- **Low**: 292

### High-severity samples

- **hi-0045** (WRONG_TRANSLATION): नीता is feminine name; should be 'writes' not 'writes' - but gender mismatch: 'she' expected not 'her', and verb conjugation implies male subject 'लिखता' not 'लिखती'
- **hi-0283** (WRONG_TRANSLATION): साढ़े तीन सौ = three hundred and fifty (350), not 'three hundred and fifty pages' phrasing; should be 'This book has three hundred and fifty pages'
- **hi-0381** (WRONG_TRANSLATION): मौसाजी = father's sister's husband (paternal aunt's husband), not maternal aunt's husband
- **hi-0306** (WRONG_TRANSLATION): जेठानी is 'elder brother's wife' not 'eldest daughter-in-law'; 'बड़ी बहू' means 'elder daughter-in-law' but sentence structure is confusing in English
- **hi-0325** (WRONG_TRANSLATION): भौंरे means 'bumblebees', not generic 'bees'
- **hi-0443** (WRONG_TRANSLATION): 'सवा लाख' means 'one and a quarter lakh' (125,000), not 'one lakh twenty-five thousand' which is the same but phrased as if it's 'one lakh and twenty-five thousand'
- **hi-0517** (WRONG_TRANSLATION): बिना मिठाई खाती है = 'eats without sweets' or 'avoids eating sweets', not 'avoids sweets with discipline'
- **hi-0627** (WRONG_TRANSLATION): "पायलागूँ" appears to be "पैर लागूँ" (to bow/touch feet); current translation misses the action and formality
- **hi-0596** (WRONG_TRANSLATION): 'Greetings, how are you?' misses the formal Urdu register; should be 'Salutations, how are you?' or 'My respects, how is your health?' (मिज़ाज = temperament/health, शरीफ़ = noble/honorable)
- **hi-0636** (CARD_DUPLICATE): Identical sentence structure to hi-0637, hi-0638, hi-0639, hi-0641, hi-0642 with only names changed

## TR (974 issues)

- **High**: 650
- **Medium**: 247
- **Low**: 77

### High-severity samples

- **tr-0098** (WRONG_TRANSLATION): Turkish proverb 'Ağzı olan konuşuyor' literally means 'everyone talks' (literally: 'whoever has a mouth speaks'), not 'Everyone's talking'. The translation misses the proverbial meaning entirely.
- **tr-0007** (WRONG_TRANSLATION): 'Rica ederim' means 'you're welcome' only as a response to thanks; in this context with 'bu benim görevim' it means 'Please, it's my duty' or 'I'm happy to help, it's my duty'
- **tr-0141** (WRONG_TRANSLATION): Turkish is grammatically broken (cannot negate -yor form with negative suffix this way); unclear meaning in source
- **tr-0142** (WRONG_TRANSLATION): Turkish is grammatically malformed; unclear what action is intended
- **tr-0143** (WRONG_TRANSLATION): Turkish mixes incompatible negation; 'gelmiyor' (don't come) doesn't fit context 'in the kitchen'
- **tr-0149** (WRONG_TRANSLATION): 'Mektup öğreniyor' doesn't mean learning a letter; likely source error or garbled Turkish
- **tr-0223** (WRONG_TRANSLATION): English is ungrammatical; Turkish means 'saw an expensive umbrella' not 'came expensive an umbrella'
- **tr-0236** (WRONG_TRANSLATION): English translation uses wrong words ('kanyon', 'ksifon'); should match Turkish ('ağ', 'şapka')
- **tr-0237** (WRONG_TRANSLATION): English translation uses wrong words ('hologram', 'jeoloji'); should match Turkish ('dere', 'bordo')
- **tr-0181** (WRONG_TRANSLATION): ağlıyorum = am crying; 'these days' suggests habitual action but needs present tense context

## RU (767 issues)

- **High**: 285
- **Medium**: 322
- **Low**: 160

### High-severity samples

- **ru-0008** (WRONG_TRANSLATION): свою means 'my own' not 'their'; should be 'I love my family'
- **ru-0155** (UNNATURAL): скоро (soon) with present tense is awkward; should be 'is about to wash' or use future tense
- **ru-0177** (WRONG_TRANSLATION): не читала (past perfective) = 'did not read' or 'has not read' (one-time action); current translation obscures the aspect
- **ru-0181** (WRONG_TRANSLATION): скоро means 'soon' but doesn't fit with present tense работает; needs 'will work soon' or sentence restructuring
- **ru-0189** (WRONG_TRANSLATION): обед means 'lunch'; 'cooks lunch at school after lunch' is contradictory; should be 'cooks lunch at school' or specify different meal
- **ru-0246** (WRONG_TRANSLATION): тихое = quiet; building cannot be quiet in this context without extra meaning
- **ru-0247** (UNNATURAL): скоро (soon) modifies action oddly; should be "will soon sing" or rephrase
- **ru-0254** (WRONG_TRANSLATION): маленькое утро = small morning is nonsensical; утро cannot be "small"
- **ru-0320** (WRONG_TRANSLATION): "девяти до девяти" (9 to 9) is nonsensical. Should be "from 9am to 9pm" or clarify the hours intended.
- **ru-0329** (WRONG_TRANSLATION): "рисует картину в магазине скоро" (paints a picture in the store soon) is semantically odd. Likely error in source sentence construction or missing context.

