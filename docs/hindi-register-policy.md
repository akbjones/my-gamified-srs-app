# Hindi register policy

## Why this exists

Hindi has two registers in everyday use that this deck has been mixing up:

1. **Sanskrit-derived formal Hindi** (शुद्ध/तत्सम) — taught in school textbooks, used in news headlines, government forms, and formal letters. Speakers in normal conversation almost never use it.
2. **Hinglish / urban spoken Hindi** — heavily code-mixed with English for modern concepts, with naturalized Persian/Arabic borrowings for older everyday concepts. This is what speakers actually use in offices, homes, and on the street in Delhi/Mumbai/Bangalore.

The deck currently teaches register #1 for ~32% of cards covering everyday concepts (toilet, teacher, train, office, weekend). A learner who masters those cards and arrives in India will sound textbook and won't recognise what they hear back. This policy is the rulebook for deciding which register a card should use.

## The core rule

**Default to whatever an urban Hindi speaker would actually say in casual conversation with a friend.** That's the target register. Only deviate when:
- The card is explicitly teaching formal register (a designated formal-Hindi unit, government form, news headline, etc.)
- The concept genuinely has no everyday equivalent
- The traditional Hindi word IS the everyday word (family, body, weather, food at home, cultural/religious)

## When to default to English borrowings

These domains use English code-switched vocabulary by default. The Sanskrit alternatives feel archaic to a native speaker.

| Domain | Use | Not |
|---|---|---|
| Modern tech | फोन, कंप्यूटर, इंटरनेट, ईमेल, मैसेज, ऐप, वाई-फाई | दूरभाष, संगणक, अंतरजाल |
| Modern transport | ट्रेन, बस, टैक्सी, फ्लाइट, स्टेशन, ट्रैफिक | रेलगाड़ी, वायुयान, यातायात |
| Modern workplace | ऑफिस, मीटिंग, प्रोजेक्ट, मैनेजर, टीम, ईमेल, अपडेट | कार्यालय, बैठक, परियोजना, प्रबंधक |
| Modern education | स्कूल, कॉलेज, टीचर, स्टूडेंट, क्लास, होमवर्क | विद्यालय, महाविद्यालय, अध्यापक, विद्यार्थी (in spoken contexts) |
| Public places (modern) | टॉयलेट, बाथरूम, अस्पताल, बैंक, रेस्तरां | शौचालय, चिकित्सालय, मुद्रालय, भोजनालय |
| Modern scheduling | वीकेंड, टाइम, छुट्टी, अपॉइंटमेंट | सप्ताहांत, अवकाश, नियुक्ति |
| Modern action verbs | अपडेट करना, शेयर करना, मैनेज करना, बुक करना, कैंसल करना | अद्यतन करना, साझा करना, प्रबंधन करना, आरक्षित करना |

## When to keep pure Hindi

These domains are NOT code-switched. The Hindi word is the natural and only choice in casual speech.

- **Family** — माँ, पिताजी, बहन, भाई, बेटा, बेटी, दादी, चाचा, मामी, etc.
- **Body parts** — सिर, हाथ, पैर, आँख, कान, दिल
- **Weather / nature** — बारिश, धूप, हवा, बादल, पहाड़, नदी, पेड़, फूल
- **Time of day** — सुबह, दोपहर, शाम, रात
- **Colours** — लाल, हरा, नीला, पीला
- **Basic emotions** — खुश, उदास, गुस्सा, डर, प्यार
- **Home cooking** — रोटी, चावल, सब्ज़ी, दाल, चाय, पानी, खाना
- **Cultural / religious** — दिवाली, होली, ईद, पूजा, मंदिर, मस्जिद, गुरुद्वारा, नमस्ते
- **Core everyday verbs** — जाना, आना, खाना, पीना, सोना, उठना, बैठना, देखना, सुनना, बोलना, करना, होना

## The verb pattern: English noun + करना

This is the everyday Hindi pattern for modern actions and the single biggest gap in the current deck.

- ❌ अध्ययन करना → ✅ पढ़ाई करना / स्टडी करना
- ❌ प्रबंधन करना → ✅ मैनेज करना
- ❌ साझा करना → ✅ शेयर करना
- ❌ अद्यतन करना → ✅ अपडेट करना
- ❌ आरक्षित करना → ✅ बुक करना (for trains/hotels in speech)
- ❌ रद्द करना → ⚖️ कैंसल करना (both acceptable; cancel slightly more common in offices)
- ❌ अग्रेषित करना → ✅ फॉरवर्ड करना
- ❌ क्रय करना → ✅ खरीदना (pure Hindi everyday verb)
- ❌ विक्रय करना → ✅ बेचना
- ❌ भ्रमण करना → ✅ घूमना
- ❌ वार्तालाप करना → ✅ बात करना / बातचीत करना
- ❌ प्रयास करना → ✅ कोशिश करना
- ❌ आरंभ करना → ✅ शुरू करना
- ❌ अंत करना → ✅ खत्म करना

These English-noun + करना patterns are **not slang**. They are the standard register in urban office, home, and casual conversation across India. Books like `India: A Million Mutinies Now` and contemporary novels written in Hinglish are full of them. We are teaching learners to talk to people, not to recite government forms.

## Contextual exceptions

Some cards SHOULD stay in formal register. Don't flag them, don't swap them:

- Cards labelled or grouped as "formal letter writing"
- Cards labelled or grouped as "news headlines"  
- Cards labelled or grouped as "government / official signage"
- Cards in a designated `formal-hindi` unit
- Cards explicitly teaching the contrast between formal and casual

If we add such a unit in the future, mark cards with `register: 'formal'` in the deck and the classifier will skip them.

## How this gets enforced

1. **`docs/hindi-register-offenders.json`** holds the canonical list of formal → preferred word swaps. New cards are scanned against it.
2. **`scripts/audit-hi-register.cjs`** scores every card by formal-word hits and produces a ranked list.
3. **The classifier runs once per deck expansion.** Cards above a threshold are surfaced for review.
4. **Audio regen is delta-only.** When a card target sentence changes, audio for that card is regenerated; nothing else.

## Open questions to revisit

- Should we add a formal-Hindi unit (~50 cards) so the formal vocabulary isn't lost entirely? Useful for learners who want to read newspapers / sign government forms.
- Does the same code-switching pattern apply to spoken Tamil/Bengali/etc., and should we audit those decks if/when we add them?
- Where does Urdu vocabulary sit on this spectrum? Many "casual Hindi" words (आराम, ख्वाहिश, मुहब्बत, ज़िंदगी) are Persian/Arabic-derived and feel more natural than their Sanskrit equivalents in conversation. The current policy implicitly accepts them, but worth being explicit.
