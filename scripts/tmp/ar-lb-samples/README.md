# Lebanese Arabic — Gate-0 voice test (ar-LB, Edge TTS)

Listen to these before ANY Lebanese cards are authored. The question:
does ar-LB-LaylaNeural read *Lebanese-written* Arabic naturally, or does
it read it like stilted MSA? (Edge dialect voices are trained largely on
MSA-ish text — this is the go/no-go for the whole language.)

Open the files in Finder: `open scripts/tmp/ar-lb-samples/`

| File | Text | Meaning |
|---|---|---|
| layla-01 | كيفك؟ شو أخبارك؟ | How are you? What's your news? |
| layla-02 | بدي روح عالبيت هلق. | I want to go home now. |
| layla-03 | عم بشرب قهوة مع رفقاتي. | I'm drinking coffee with my friends. |
| layla-04 | ما في مشكلة، بكرا منحكي. | No problem, we'll talk tomorrow. |
| layla-05 | وين رايح؟ استنى شوي! | Where are you going? Wait a bit! |
| layla-06 | هالأكل طيب كتير. | This food is really tasty. |
| layla-07 | مش عارف شو بدي إعمل. | I don't know what I want to do. |
| layla-08 | في عندك وقت بكرا الصبح؟ | Do you have time tomorrow morning? |
| layla-09 | يلا نروح مشوار عالبحر. | Let's go on a trip to the sea. |
| layla-10 | شو هالطقس الحلو اليوم! | What lovely weather today! |
| rami-02 / rami-03 | (same as 02/03) | male voice alternative |
| layla-msa-control | أريد أن أذهب إلى البيت الآن. | "I want to go home now" in MSA — contrast |

What to listen for:
1. Does بدي come out "biddi" (Lebanese) or hyper-literate "badī"?
2. Does هلق sound like "hallaʔ"? Does عم بشرب flow as "ʕam bishrab"?
3. ة endings: Lebanese -é coloring vs MSA -a.
4. Overall: does it sound like a Beiruti speaking, or a newsreader
   forced to read text messages?

Verdict options: Layla ✓ / prefer Rami / neither → fall back to
Egyptian (ar-EG-SalmaNeural) or re-plan.
