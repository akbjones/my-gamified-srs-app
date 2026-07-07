# Egyptian Arabic — Gate-0 voice test (ar-EG, Edge TTS)

Fallback test after ar-LB FAILED Gate-0 (2026-07-07: "all very much MSA
sounding" — Layla and Rami read Lebanese text like newsreaders).

Egyptian is the most likely dialect to have real dialect prosody in a
TTS voice (largest media corpus). Same protocol: does Salma read
*Egyptian-written* text like a Cairene, or like MSA with typos?

Open: `open scripts/tmp/ar-eg-samples/`  (spacebar = Quick Look play)

| File | Text | Meaning |
|---|---|---|
| salma-01 | إزيك؟ عامل إيه؟ | How are you? How's it going? |
| salma-02 | عايز أروح البيت دلوقتي. | I want to go home now. |
| salma-03 | بشرب قهوة مع صحابي. | I'm drinking coffee with my friends. |
| salma-04 | مفيش مشكلة، بكرة نتكلم. | No problem, we'll talk tomorrow. |
| salma-05 | رايح فين؟ استنى شوية! | Where are you going? Wait a bit! |
| salma-06 | الأكل ده حلو أوي. | This food is really tasty. |
| salma-07 | مش عارف أعمل إيه. | I don't know what to do. |
| salma-08 | عندك وقت بكرة الصبح؟ | Do you have time tomorrow morning? |
| salma-09 | يلا نروح البحر. | Let's go to the sea. |
| salma-10 | الجو جميل أوي النهارده! | The weather is so nice today! |
| shakir-02 / shakir-03 | (same as 02/03) | male voice alternative |
| salma-msa-control | أريد أن أذهب إلى البيت الآن. | MSA contrast |

Listen for:
1. دلوقتي = "dilwaʔti"? ج in جميل = hard "g" (gamil, Cairene) or MSA "j"?
2. ق as glottal stop: دلوقتي/قهوة → "ʔ" not "q"?
3. إزيك flowing as "izzayyak", النهارده as "innaharda"?

Verdict options: Salma ✓ / prefer Shakir / neither → dialect audio is
not viable on Edge; options become (a) ship MSA only for now,
(b) evaluate a paid dialect-capable TTS (e.g. ElevenLabs) as a new
provider, (c) re-plan.
