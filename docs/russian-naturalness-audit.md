# Russian Deck — Naturalness Audit

**Source:** three native-perspective read-throughs (beginner / intermediate / advanced bands).
**Coverage:** ru-0002 … ru-3299 — **3,102 cards read** (beginner 896, intermediate 1,020, advanced 1,186). The deck is **3,174 cards** (max id ru-3366, not the 3,933 the readers assumed); only **66 cards (ru-3300 … ru-3366) went unread** — essentially full coverage.

| Band | Slice | Cards read | Naturalness (1–5) | Est. unnatural |
|------|-------|-----------:|:-----------------:|:--------------:|
| Beginner | ru-0002 … ru-1050 | 896 | 4 | ~15% |
| Intermediate | ru-1051 … ru-2100 | 1,020 | 4 | ~15% |
| Advanced | ru-2101 … ru-3299 | 1,186 | 5 | ~15% |

---

## 1. Executive Summary

The Russian deck is **grammatically sound but noticeably textbook-y**, with roughly **15% of cards reading as machine-generated or stiff** across every band. The core sentences parse correctly; what gives them away is *word choice and word order calqued from the English gloss*, plus a **near-total absence of the small spoken-Russian particles** (же, ведь, ну, вот, -то, -ка, да) that make dialogue sound alive. In the entire 896-card beginner band, же appears 0 times, ведь 0, ну 0, вот 1, -то 1 — every greeting, question and mini-dialogue therefore reads flat.

**Is it worse early or late? The *rate* is flat (~15% everywhere), but the *failure mode shifts*:**

- **Early cards (beginner)** are the most consistently *flat and template-driven*. A handful of frames are reused ~10 times each with blindly-swapped slots: `X стоит на углу` (×10), `X выглядит прекрасно` (×10), `X очень важна для меня` (×10), `помогает другу в <random place>` (×13). Many pairings are semantically broken (*красивый друг*, *умный дом* = a smart-home appliance "standing on a corner", washing dishes *in a museum*).
- **Middle cards (intermediate)** are the **worst band for word-order calques**. The aspect drills at ru-1250…1490 systematically wedge an adverb *between the verb and its object* (`купил сразу ужин`, `написала быстро работу`) — a literal echo of English order and the single strongest machine tell. ~10% of the band also fronts a bare frequency adverb before a plain-noun subject (`Часто журналист поёт…`).
- **Late cards (advanced)** are on average the *most* natural (many are genuinely fine, and the colloquial cards use particles well) — hence the 5/5 rating — **but they carry two concentrated blocks of grammar-drill artifacts**: a participle block (ru-2636…2900) full of bare participle-subject sentences (`Падающий снег красивый`, `Высохшая река печальна`), and a passive block (ru-2879…3067) full of English-style reflexive passives with an instrumental agent (`Мусор убирается дворниками`, `Музей посещается туристами`).

**Bottom line:** this is not a broken deck — ~85% of cards are usable. But the unnatural minority is *systematic and pattern-shaped*, which is good news for a fix pass: most bad cards belong to a dozen identifiable frames that can be found and rewritten in batches rather than one by one.

---

## 2. Top Recurring Patterns (ranked by prevalence)

### P1 — Missing colloquial particles / softeners *(systemic, band-wide)*
Dialogue, questions and reproaches carry none of же / ведь / ну / вот / -то / -ка / да. Grammatically clean but emotionally flat; the biggest single reason the deck "sounds like a textbook." Heaviest in beginner/intermediate; advanced dialogue cards mostly escape it.
- ru-0050 · `Откуда ты знаешь мой адрес?` → **`А откуда ты знаешь мой адрес?`**
- ru-0070 · `Зачем ты купил столько хлеба?` → **`Зачем же ты столько хлеба накупил?`**
- ru-2367 · `Я хочу, но не могу.` → **`Да хочу я, но не могу.`**

### P2 — Combinatorial slot-fill: [time/freq] + profession + verb + object + **random location** *(all bands, ~5–10%)*
The clearest machine tell. A generic actor does a generic action in an arbitrary, non-collocating place. `помогает другу` frame alone recurs 13× in the beginner band, mostly with an absurd locative.
- ru-0839 · `Продавец иногда моет посуду в музее.` → **`Продавец иногда моет посуду дома.`**
- ru-0800 · `Иногда бабушка смотрит фильм в горах.` → **`Иногда бабушка вечером смотрит фильм.`**
- ru-1451 · `Часто журналист поёт песню в библиотеке.` → **`Журналист часто поёт в библиотеке.`**

### P3 — Adverb split from its verb/object (English word order) *(intermediate ~3–4%, concentrated ru-1250–1490; scattered elsewhere)*
Neutral Russian never wedges an adverb between verb and direct object, and puts manner adverbs *before* the verb. The deck mirrors the English gloss order instead.
- ru-1255 · `Он купил сразу ужин.` → **`Он сразу купил ужин.`**
- ru-1381 · `Она написала быстро работу.` → **`Она быстро написала работу.`**
- ru-2242 · `Моя мама готовит вкусно.` → **`Моя мама вкусно готовит.`**

### P4 — Fronted frequency/time adverb before a bare-noun subject *(intermediate ~10%)*
Neutral order is *Subject + часто/редко/иногда/всегда + Verb*. Fronting the bare adverb before a plain noun subject is marked and reads as drill output.
- ru-1452 · `Редко медсестра смотрит фильм в больнице.` → **`Медсестра редко смотрит фильмы на работе.`**
- ru-1517 · `Всегда папа учит язык в горах.` → **`Папа всегда учит язык дома.`**
- ru-1183 · `Редко сестра рисует картину в парке.` → **`Сестра редко рисует в парке.`**

### P5 — Adjective-swap description templates with non-collocations *(beginner ~30 cards)*
Frames `X выглядит прекрасно` / `X стоит на углу` / `X важна для меня` accept any adjective+noun regardless of sense, and use verbs the noun can't take (утро/письмо can't «выглядеть», парк can't «стоит»).
- ru-0543 · `Красивый друг стоит на углу.` → **`На углу стоит мой друг.`**
- ru-0921 · `Умный дом стоит на углу.` → **`На углу стоит красивый дом.`**
- ru-0528 · `Красивое письмо выглядит прекрасно.` → **`Какое красивое письмо!`**

### P6 — Participle-as-subject grammar drills *(advanced, ~8–10% of the ru-2636–2900 block)*
A bare причастие as subject + a flat/personified predicate. Reads as an isolated conjugation exercise, not an utterance.
- ru-2640 · `Падающий снег красивый.` → **`Как красиво падает снег!`**
- ru-2833 · `Высохшая река печальна.` → **`Река высохла, и смотреть на неё грустно.`**
- ru-2595 · `Одетый ребёнок был готов идти в школу` → **`Ребёнок оделся и был готов идти в школу.`**

### P7 — Reflexive -ся passive with an explicit instrumental agent *(advanced, common in ru-2879–3067)*
Direct calque of the English passive; natives strongly prefer the active for these verbs.
- ru-2973 · `Мусор убирается с улиц каждое утро дворниками.` → **`Мусор с улиц каждое утро убирают дворники.`**
- ru-3027 · `Музей посещается тысячами туристов каждый год.` → **`Музей каждый год посещают тысячи туристов.`**
- ru-3040 · `Ежегодный концерт организуется школой и посещается сотнями родителей.` → **`Каждый год школа устраивает концерт, на который приходят сотни родителей.`**

### P8 — Aspect-pair demos: resolved object pronoun retained, no failed-result framing *(intermediate)*
"Did X but didn't finish" is written with a redundant его/её and a bald `не [perfective]`. Natives drop the pronoun and mark the failed result with `так и не` + a до-perfective.
- ru-1197 · `Я читал эту книгу, но не прочитал её.` → **`Я читал эту книгу, но так и не дочитал.`**
- ru-1560 · `Он учил стихотворение, но не выучил его.` → **`Он учил стихотворение, но так и не выучил.`**
- ru-1325 · `Она писала письмо весь вечер, но не написала его.` → **`Она весь вечер писала письмо, но так и не дописала.`**

### P9 — Present tense with a future adverb for a one-off action *(intermediate ~1%, advanced scattered)*
Завтра/Скоро + present is fine only for timetabled events; for one-off chores natives use the perfective future.
- ru-1178 · `Завтра бабушка смотрит фильм дома.` → **`Завтра бабушка будет смотреть фильм дома.`**
- ru-1231 · `Скоро полицейский помогает другу в аэропорту.` → **`Скоро полицейский поможет другу в аэропорту.`**
- ru-2409 · `Библиотекарь будет мыть посуду дома завтра.` → **`Завтра библиотекарь помоет дома посуду.`**

### P10 — Two unrelated clauses stitched with contrastive «а» *(advanced ~5–8%)*
`а` should contrast comparable subjects; here it forces together two random template clauses.
- ru-3122 · `Художник рисует картину в мастерской, а спортсмен бегает по утрам.` → **`Пока художник рисует в мастерской, спортсмен бегает в парке.`**
- ru-3210 · `Продавец каждый день ездит на работу на метро, а бабушка готовит обед.` → **`Продавец каждый день ездит на работу на метро, а его жена — на машине.`**

### P11 — Fixed-collocation / idiom slips & English calques *(scattered, all bands, low but conspicuous)*
Wrong verb/noun in a fixed phrase; idioms translated word-for-word; сегодня calqued onto greetings; redundant time-stacking and pleonasm.
- ru-2250 · `Всё, что блестит, – не золото.` → **`Не всё то золото, что блестит.`** (real proverb)
- ru-1732 · `Вот причина, почему я так думаю.` → **`Вот почему я так думаю.`**
- ru-0170 · `Я довёл работу до конца.` → **`Я довёл дело до конца.`**

### P12 — Redundant coreferential subject pronoun *(a handful, beginner + advanced)*
One of the few genuine pro-drop contexts in Russian — the second same-subject pronoun should drop.
- ru-1037 · `Пока он ждал поезд, он читал книгу.` → **`Пока он ждал поезд, читал книгу.`**

---

## 3. Consolidated Example Bank

Deduped across the three readers (id ranges do not overlap, so every flagged card is listed once). `Pn` links each card to the pattern above.

| ID | Flagged quote | Why it's unnatural | Natural rewrite | Pat. |
|----|---------------|--------------------|-----------------|:----:|
| ru-0009 | Я говорю по-русски хорошо. | Adverb-final calque of "speak Russian well"; manner adverb goes pre-verb. | Я хорошо говорю по-русски. | P3 |
| ru-0016 | Я знаю русский язык. | Textbook-full; speech drops язык. | Я знаю русский. | P11 |
| ru-0048 | Нигде не продают свежий хлеб. | Rigid SVO; native topicalizes the known object. | Свежий хлеб нигде не продают. | P3 |
| ru-0050 | Откуда ты знаешь мой адрес? | Flat; a surprised native fronts а / adds -то/же. | А откуда ты знаешь мой адрес? | P1 |
| ru-0070 | Зачем ты купил столько хлеба? | Neutral SVO reads textbook; object should front + же. | Зачем же ты столько хлеба накупил? | P1 |
| ru-0072 | Расскажи мне то, что ты знаешь. | Heavy correlative то, что + bare imperative = drill; -ка softens. | Расскажи-ка мне, что знаешь. | P1 |
| ru-0159 | Птицы поют красиво весной. | Adverb-after-verb + dangling time adverb; calqued. | Весной птицы красиво поют. | P3 |
| ru-0170 | Я довёл работу до конца. | Idiom довести до конца collocates with дело. | Я довёл дело до конца. | P11 |
| ru-0246 | Тихое здание выглядит прекрасно. | Odd collocation; buildings "looking wonderful" is stiff. | Какое красивое здание! | P5 |
| ru-0310 | Мальчик танцует вальс перед сном. | Waltzing right before bed; вальс slotted into a bedtime frame. | Мальчик читает книгу перед сном. | P2 |
| ru-0353 | Привет всем, я новый сотрудник в вашей команде. | Wrong order (Всем привет) + "on your team" calque. | Всем привет! Я ваш новый коллега. | P11 |
| ru-0376 | Здравствуйте, как ваши дела сегодня? | Redundant сегодня calque + stiff как ваши дела. | Здравствуйте, как поживаете? | P11 |
| ru-0453 | Тихое утро выглядит прекрасно. | утро can't «выглядеть»; pure template. | Какое тихое, прекрасное утро! | P5 |
| ru-0490 | Мальчик всегда помогает другу в театре. | Habitual helping "in the theatre" = absurd filler locative. | Мальчик всегда помогает другу. | P2 |
| ru-0528 | Красивое письмо выглядит прекрасно. | Tautological + письмо can't «выглядит прекрасно». | Какое красивое письмо! | P5 |
| ru-0541 | Большой парк стоит на углу. | парк does not «стоит»; that verb wants buildings/objects. | На углу большой парк. | P5 |
| ru-0543 | Красивый друг стоит на углу. | "красивый друг" is a non-collocation; bald slot-fill. | На углу стоит мой друг. | P5 |
| ru-0549 | Привет, как у тебя дела сегодня? | сегодня = "today" calque; native softens with ну/а. | Привет, ну как ты? | P11 |
| ru-0552 | Большая песня очень важна для меня. | "большая песня" is not a collocation; blind slot-fill. | Эта песня очень важна для меня. | P5 |
| ru-0555 | Тихая семья очень важна для меня. | "тихая семья" is an odd pairing; frame accepts any adjective. | Семья очень важна для меня. | P5 |
| ru-0579 | Мы прочитали наконец задачу. | Wrong collocation (задачу решают) + misplaced наконец. | Мы наконец решили задачу. | P11 |
| ru-0654 | Привет, рад тебя видеть сегодня! | сегодня calque tacked onto a greeting Russian omits. | Привет, рад тебя видеть! | P11 |
| ru-0800 | Иногда бабушка смотрит фильм в горах. | "watches a movie in the mountains" — random slot. | Иногда бабушка вечером смотрит фильм. | P2 |
| ru-0804 | Друг всегда помогает другу в библиотеке. | Vague machine-speak + nonsense "in a library" locative. | Друзья всегда помогают друг другу. | P2 |
| ru-0839 | Продавец иногда моет посуду в музее. | Washing dishes in a museum makes no sense; random slot. | Продавец иногда моет посуду дома. | P2 |
| ru-0921 | Умный дом стоит на углу. | "умный дом" = smart-home (IoT) "standing on a corner." | На углу стоит красивый дом. | P5 |
| ru-0954 | Дети смеются громко. | Sentence-final громко mirrors English; front the adverb. | Дети громко смеются. | P3 |
| ru-0965 | Хорошая сегодня погода, правда? | Bookish tag правда? + fronted adjective; casual = да?. | Хорошая погода сегодня, да? | P1 |
| ru-1037 | Пока он ждал поезд, он читал книгу. | Redundant second coreferential он. | Пока он ждал поезд, читал книгу. | P12 |
| ru-1116 | Часто художник бегает утром на вокзале. | Fronted Часто + implausible "runs at the train station." | Художник часто бегает по утрам в парке. | P4 |
| ru-1178 | Завтра бабушка смотрит фильм дома. | Present tense with Завтра for a one-off leisure act. | Завтра бабушка будет смотреть фильм дома. | P9 |
| ru-1183 | Редко сестра рисует картину в парке. | Sentence-initial Редко + bare subject is drill-like. | Сестра редко рисует в парке. | P4 |
| ru-1197 | Я читал эту книгу, но не прочитал её. | Redundant её; lacks completive так и не. | Я читал эту книгу, но так и не дочитал. | P8 |
| ru-1231 | Скоро полицейский помогает другу в аэропорту. | Present with Скоро for a single future event. | Скоро полицейский поможет другу в аэропорту. | P9 |
| ru-1254 | Она покупала часто ужин. | Frequency adverb часто splits verb from object. | Она часто покупала ужин. | P3 |
| ru-1255 | Он купил сразу ужин. | сразу wedged between verb and object (English echo). | Он сразу купил ужин. | P3 |
| ru-1278 | Мы закрыли наконец письмо. | наконец jammed after verb + закрыть письмо wrong verb. | Мы наконец запечатали письмо. | P3 |
| ru-1285 | Они показали утром дом. | Time adverb утром wedged between verb and object. | Утром они показали дом. | P3 |
| ru-1294 | Я помню о нашем разговоре. | помнить о = "bear in mind"; "remember the conversation" = acc. | Я помню наш разговор. | P11 |
| ru-1301 | Скоро учитель стирает одежду дома. | Скоро + present for an upcoming chore. | Скоро учитель постирает дома. | P9 |
| ru-1325 | Она писала письмо весь вечер, но не написала его. | Retained его + flat не написала. | Она весь вечер писала письмо, но так и не дописала. | P8 |
| ru-1327 | Они покупали долго ужин. | долго wedged between verb and object. | Они долго покупали ужин. | P3 |
| ru-1381 | Она написала быстро работу. | быстро stuck between verb and object — drill order. | Она быстро написала работу. | P3 |
| ru-1388 | Он сделал сразу упражнение. | сразу belongs before the verb. | Он сразу сделал упражнение. | P3 |
| ru-1405 | Он показал сразу дом. | V + сразу + OBJECT calque of "showed immediately a house." | Он сразу показал дом. | P3 |
| ru-1410 | Он нашёл сразу упражнение. | Adverb wedged after verb. | Он сразу нашёл упражнение. | P3 |
| ru-1425 | Знаете ли вы этого человека? | ли yes/no inversion is literary/formal for casual speech. | Вы знаете этого человека? | P11 |
| ru-1437 | Я делал каждый день упражнение. | каждый день between verb and object. | Я каждый день делал упражнение. | P3 |
| ru-1451 | Часто журналист поёт песню в библиотеке. | Fronted Часто + implausible + redundant поёт песню. | Журналист часто поёт в библиотеке. | P4 |
| ru-1452 | Редко медсестра смотрит фильм в больнице. | Fronted Редко + random "movie at the hospital." | Медсестра редко смотрит фильмы на работе. | P4 |
| ru-1474 | Друг помогает другу сейчас. | друг…другу collides with fixed друг другу ("each other"). | Сосед сейчас помогает приятелю. | P2 |
| ru-1486 | Он объяснял весь день правило. | весь день wedged after the verb. | Он весь день объяснял правило. | P3 |
| ru-1517 | Всегда папа учит язык в горах. | Всегда-first is unidiomatic + nonsensical filler. | Папа всегда учит язык дома. | P4 |
| ru-1519 | Иногда писатель танцует вальс в парке. | Иногда-first before subject = template output. | Писатель иногда танцует вальс. | P4 |
| ru-1549 | Мы делали уборку, но не сделали её до конца. | Retained её + flat не сделали до конца. | Мы убирались, но так и не доделали до конца. | P8 |
| ru-1560 | Он учил стихотворение, но не выучил его. | Bare но не выучил его = grammar-demo; drop его + так и не. | Он учил стихотворение, но так и не выучил. | P8 |
| ru-1640 | Далеко ли отсюда до центра? | ли-question is bookish for casual travel talk. | До центра далеко? | P11 |
| ru-1732 | Вот причина, почему я так думаю. | "причина, почему" is a word-for-word calque. | Вот почему я так думаю. | P11 |
| ru-2189 | Вместо чая я хочу кофе. | Fronted "Вместо чая" calques English; use не…а. | Я хочу не чай, а кофе. | P11 |
| ru-2242 | Моя мама готовит вкусно. | Adverb-after-verb mirrors "cooks deliciously." | Моя мама вкусно готовит. | P3 |
| ru-2250 | Всё, что блестит, – не золото. | Calque of "All that glitters is not gold." | Не всё то золото, что блестит. | P11 |
| ru-2341 | Вечером учитель рисует картину в студии. | Combinatorial template; piled рисует картину в студии. | По вечерам учитель рисует у себя дома. | P2 |
| ru-2359 | Он ест и читает. | Isolated two-verb drill for и, not a real utterance. | Он ест и читает одновременно. | P6 |
| ru-2367 | Я хочу, но не могу. | Flat/textbook; contrastive speech drops pronoun + да/-то. | Да хочу я, но не могу. | P1 |
| ru-2409 | Библиотекарь будет мыть посуду дома завтра. | Imperfective future for a one-off + adverbial pile-up. | Завтра библиотекарь помоет дома посуду. | P9 |
| ru-2478 | Писатель слушает музыку в магазине. | Auto-generated profession+verb+location filler. | Писатель слушает музыку, когда работает. | P2 |
| ru-2483 | завтра утром в девять часов | Triple-marked time is redundant. | завтра в девять утра | P11 |
| ru-2588 | Почему ты не ответил на моё сообщение? | Bare reproach; real one reorders and/or adds же/-то. | Ты почему на моё сообщение не ответил? | P1 |
| ru-2595 | Одетый ребёнок был готов идти в школу | "Одетый ребёнок" as subject = participle drill. | Ребёнок оделся и был готов идти в школу. | P6 |
| ru-2640 | Падающий снег красивый. | Bare participle-as-subject + flat predicate. | Как красиво падает снег! | P6 |
| ru-2646 | Время летит очень быстро. | Pleonasm (летит already = rushes) + calqued order. | Время очень быстро летит. | P11 |
| ru-2833 | Высохшая река печальна. | Participle drill + forced personification. | Река высохла, и смотреть на неё грустно. | P6 |
| ru-2841 | Медсестра бегала утром на прошлой неделе. | Imperfective habitual clashes with bounded "last week." | На прошлой неделе медсестра каждое утро бегала. | P9 |
| ru-2895 | Созревшие плоды падают. | Bookish/botanical; everyday = спелые яблоки/фрукты. | Спелые яблоки падают на землю. | P6 |
| ru-2927 | Сосед слушал музыку на прошлой неделе. | Contentless template filler. | На прошлой неделе сосед весь вечер слушал музыку. | P2 |
| ru-2939 | Новый мост будет построен через эту реку к лету. | Stilted passive + "через эту реку" ambiguous; active is cleaner. | К лету через эту реку построят новый мост. | P7 |
| ru-2948 | Художник всегда слушает музыку. | Generic slot-filled scene with no communicative purpose. | Художник всегда слушает музыку, когда работает. | P2 |
| ru-2973 | Мусор убирается с улиц каждое утро дворниками. | Reflexive -ся passive + instrumental agent = English calque. | Мусор с улиц каждое утро убирают дворники. | P7 |
| ru-3027 | Музей посещается тысячами туристов каждый год. | Stilted reflexive passive; everyday = active with agent-subject. | Музей каждый год посещают тысячи туристов. | P7 |
| ru-3040 | Ежегодный концерт организуется школой и посещается сотнями родителей. | Double passive-with-agent = bureaucratic boilerplate. | Каждый год школа устраивает концерт, на который приходят сотни родителей. | P7 |
| ru-3122 | Художник рисует картину в мастерской, а спортсмен бегает по утрам. | Contrastive а joins two unrelated template clauses. | Пока художник рисует в мастерской, спортсмен бегает в парке. | P10 |
| ru-3170 | давно не видел вас в городе | Clitic pronoun вас should sit before the verb. | Как поживаете? Давно вас не видел в городе. | P3 |
| ru-3210 | Продавец каждый день ездит на работу на метро, а бабушка готовит обед. | Two unconnected filler clauses forced together by а. | Продавец каждый день ездит на работу на метро, а его жена — на машине. | P10 |

---

## 4. Proposed Rewrite Rubric

Concrete, Russian-specific rules for the fix pass. Roughly ordered from highest-impact to polish.

**Word order**
1. **Never split a verb from its direct object with an adverb.** Move сразу / быстро / наконец / долго and manner adverbs (хорошо, красиво, вкусно, громко) to **before the verb**: `сразу купил ужин`, `хорошо говорю`, `вкусно готовит` — *not* `купил сразу ужин`, `готовит вкусно`.
2. **Front time adverbs** (утром, весь день, каждый день) to the clause start, not between V and O.
3. **Frequency adverbs sit *after* the subject:** `Subject + часто/редко/иногда/всегда + Verb`. Do **not** open with a bare adverb before a plain-noun subject (`Часто журналист…` → `Журналист часто…`); reserve fronting for marked/emphatic cards.
4. **Clitic pronouns go before the verb:** `давно вас не видел`, not `давно не видел вас`.

**Word choice / collocation**
5. **Every adjective must actually collocate with its noun.** Ban красивый друг, умный дом (=IoT), большая песня, тихая семья, тихое здание. Verbs must fit: parks/mornings/letters don't «стоят»/«выглядят».
6. **The location slot must be plausible.** Drop or replace random locatives — no washing dishes *в музее*, watching films *в горах*, dancing a waltz *на вокзале*. If no natural place exists, delete the phrase or use дома / на работе / вечером.
7. **Respect fixed collocations & idioms:** довести **дело** до конца (not работу); **решить** задачу (not прочитать); знаю русский (drop язык); помню **разговор** (accusative, not помню о); **Всем привет** (not Привет всем); use the real proverb **Не всё то золото, что блестит**.
8. **Kill English calques:** delete сегодня tacked onto greetings; `причина, почему` → `почему`; `Вместо чая я хочу…` → `не чай, а…`; compress triple time-marking (`завтра в девять утра`, not `завтра утром в девять часов`); remove pleonasm (`время быстро летит`).

**Grammar / aspect / voice**
9. **One-off future actions take the perfective future**, not present and not будет + imperfective, when cued by Завтра/Скоро: `Завтра помоет посуду`. Present-for-future only for genuinely timetabled events.
10. **Failed-completion sentences:** drop the resolved object pronoun (его/её) and mark the failed result lexically with **`так и не` + до-perfective**: `читал, но так и не дочитал` (not `…но не прочитал её`).
11. **Prefer the active over the reflexive -ся passive** whenever an agent is named: `убирают дворники` (not `убирается дворниками`); `посещают туристы` (not `посещается туристами`).
12. **Turn participle-as-subject drills into finite-verb utterances or exclamations:** `Падающий снег красивый` → `Как красиво падает снег!`; use everyday nouns (спелые яблоки, not созревшие плоды).
13. **Drop a coreferential subject pronoun** in the second clause of a same-subject sentence: `Пока он ждал поезд, читал книгу`.

**Register / liveliness**
14. **Add exactly one softener where a native would** — but only one per utterance, and only where it fits the tone: же (reproach/insistence), ведь (shared knowledge), ну (opener), вот (presentational), -то (topic), -ка (softens imperatives), да? (small-talk tag). Do not sprinkle particles onto neutral declaratives.
15. **Avoid bookish devices in casual cards:** replace ли yes/no inversion with plain question intonation (`Вы знаете…?`), and heavy correlatives (`то, что`) with plain `что`.
16. **Don't stitch two unrelated clauses with «а».** Either contrast comparable subjects (`он — на метро, а жена — на машине`) or subordinate one clause (`Пока…`).

---

## 5. Recommended Scope

**Total in scope:** ~3,102 audited cards; each band ~15% unnatural → **≈ 450–470 flagged cards**. Split into two tiers:

- **Tier A — hard errors that must change (~8–10%, ≈ 250–300 cards).** Wrong collocations, broken adjective+noun pairs, random-location nonsense, adverb-split word order, wrong aspect/tense, reflexive-passive calques, participle-subject drills, idiom calques. These read as *wrong*, not merely stiff, and warrant a **heavy rewrite**.
- **Tier B — flatness / missing particles (~5–7%, ≈ 150–200 cards).** Grammatically fine dialogue/question cards that just lack a softener or use neutral-but-textbook order. A **light touch-up** (front an adverb, add one particle) — optional polish, high volume, low risk.

**Where the work concentrates (prioritize these):**

| Band | Est. cards to fix | Hot spots |
|------|:-----------------:|-----------|
| **Intermediate (ru-1051–2100)** — *worst band* | ~180–200 | Adverb-split aspect drills **ru-1250–1490**; fronted-frequency templates (~10% of band); aspect-pair pronoun retention; present-for-future |
| **Beginner (ru-0002–1050)** | ~130–150 | Reused frames `стоит на углу` ×10, `выглядит прекрасно` ×10, `важна для меня` ×10, `помогает другу` ×13; сегодня greetings; adverb order |
| **Advanced (ru-2101–3299)** | ~120–150 | Participle block **ru-2636–2900**; passive-with-agent block **ru-2879–3067**; contrastive-«а» stitching; scattered combinatorial filler |

**Recommendation: a *targeted heavy rewrite* of the ~250–300 Tier-A cards, not a full-deck rewrite.** ~85% of the deck is fine. Crucially, the bad cards cluster into ~12 identifiable frames and two grammar-feature blocks, so the fix is **semi-automatable**: locate each frame (fixed strings like `стоит на углу` / `выглядит прекрасно`, regex for adverb-between-verb-and-object, the -ся-passive block, the participle block), rewrite the *frame* once, and re-slot with sense-checked fillers. Then run an **optional Tier-B colloquial-polish pass** to sprinkle particles and fix word order on dialogue cards. Suggested order: **intermediate → beginner → advanced.**

**Coverage caveat:** this audit stopped at ru-3299; the deck's true max id is ru-3366, so only **66 cards (ru-3300 … ru-3366) were not read** — a small tail to spot-check against the same patterns during the fix pass.
