You are authoring a pilot slice of the KOREAN deck for LangLab.
Working directory: /Users/antoinevj/Documents/GitHub/my-gamified-srs-app/.claude/worktrees/awesome-jones

READ FIRST:
- docs/korean-register-policy.md + docs/korean-register-offenders.json (offenders must NOT appear; the register control is STRUCTURAL: every modeled sentence ends in 해요체)
- src/data/conjugation/ko.ts — the engine's CURRENT capability defines what verb forms you may use:
  * ONLY 해요체 present forms (-요) derived from -다 dictionary forms; NO past (-았/었어요), NO future (-ㄹ 거예요), NO 합니다체 except the two fixed phrases 감사합니다 / 안녕하세요-class greetings (pos "phrase" in dict)
  * IRREGULARS + KNOWN_VERBS in the file, plus any new -다 form whose 해요체 the engine derives correctly (X하다 compounds always work; regular vowel/consonant stems work; NEW ㅂ/ㄷ/르/ㅡ-irregular verbs need their exact 해요체 listed in your verbs output so we can seed IRREGULARS)
- src/data/dictionary/ko.ts — noun particles are stripped by lookup (은/는/이/가/을/를/에/에서/도/만/와/과/랑/의/로/부터/까지/처럼/한테/에게...). Your dict needs BASE nouns and verb FORMS, not particle-attached surfaces.

CARD FORMAT — JSON array, fields exactly: id ("ko-NNNN"), target, english, audio ("ko-" + id + ".mp3" i.e. "ko-ko-0001.mp3"), tags (array, "general" on EVERY card), grammarNode, priority (= card number), grammar (optional tip).

HARD RULES:
1. Natural everyday Korean at 해요체, Q1 band 2–8 words (Korean packs more per word); 100% unique sentences; subjects dropped where natural (as Korean does).
2. Sequential ids in your range; priority = card number.
3. tags: general 100%; travel/work/family sprinkled (~40-60% of applicable).
4. Grammar tips on ~30%: ≤120 chars, ONE rule, one worked example WITH romanization in parens (Korean is a non-Latin script: 학교에 가요 (hakgyo-e gayo)). No jargon.
5. English glosses translate exactly (politeness level noted only when contrastive).
6. NO offenders: no 당신/너/야, no 금일/명일/본인; 저 for I; name+씨 or subject-drop instead of "you".
7. Every verb: 해요체 present only, engine-derivable. Copula: N이에요 (consonant-final) / N예요 (vowel-final) — write the correct one; both resolve to 이다... IMPORTANT: for vowel-final nouns use 예요 and include '예요' in your dict with lemma '이다'.

DICT OUTPUT — every content token (base nouns, verb forms as they appear, adverbs, question words) → {"en","ipa","pos"} with "lemma":"<dictionary form -다>" on conjugated verb forms, and each dictionary form as its own entry. SHORT pos codes: v, n, adj, adv, pron, prep, conj, num, part, interj, det, phrase. IPA: revised-romanization-informed IPA is fine (ɕ, tɕ, ŋ, ʌ, ɯ etc.).

VERBS OUTPUT — JSON array of NEW -다 dictionary forms you used that are NOT in KNOWN_VERBS in src/data/conjugation/ko.ts; for any irregular-class verb (ㅂ/ㄷ/르/ㅡ/ㄹ-drop), give ["form", "exact 해요체"] pairs instead of bare strings.

Validate before finishing (script it, using the REAL engine via npx tsx): parse JSONs; ids sequential/unique; every verb token resolves via findInfinitive or its dict lemma AND haeyo(lemma) === the form used; every content token resolves via the real lookupWord (import it) after your dict entries are considered. Report counts. Do NOT touch any other files.
