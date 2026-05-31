#!/usr/bin/env python3
"""Fill Hindi deck nodes to target counts (112 for nodes 1-25, 113 for nodes 26-35)."""

import json
import random

random.seed(42)

DECK_PATH = "src/data/hindi/deck.json"

# New sentences per node. Format: (hindi, english, grammar_tip_or_empty)
# ~30% should have grammar tips. Sentences aim for 6+ Hindi words.

NEW_SENTENCES = {
    "node-02": [
        # Present habitual — need 1
        ("हम हर रविवार को पार्क में टहलने जाते हैं।",
         "We go for a walk in the park every Sunday.", ""),
    ],
    "node-03": [
        # Adjectives / होना expressions — need 10
        ("यह फूल बहुत सुंदर और खुशबूदार है।",
         "This flower is very beautiful and fragrant.",
         "खुशबूदार = fragrant. The -दार suffix forms adjectives: ज़िम्मेदार (responsible), ईमानदार (honest)."),
        ("आज का मौसम काफ़ी सुहावना लग रहा है।",
         "Today's weather seems quite pleasant.", ""),
        ("उसका चेहरा बहुत उदास और थका हुआ दिख रहा था।",
         "His face was looking very sad and tired.", ""),
        ("यह किताब पढ़ने में बहुत दिलचस्प और ज्ञानवर्धक है।",
         "This book is very interesting and informative to read.",
         "ज्ञानवर्धक = informative/knowledge-enhancing. Sanskrit compound: ज्ञान (knowledge) + वर्धक (enhancing)."),
        ("बच्चे आज बहुत शरारती और चंचल हैं।",
         "The children are very naughty and restless today.", ""),
        ("मेरी दादी बहुत दयालु और समझदार महिला हैं।",
         "My grandmother is a very kind and wise woman.", ""),
        ("रास्ता लंबा और काफ़ी ऊबड़-खाबड़ था।",
         "The path was long and quite bumpy.",
         "ऊबड़-खाबड़ = bumpy/uneven. Echo words with changed vowels are common: उलटा-पुलटा, भागम-भाग."),
        ("यह समस्या बेहद जटिल और उलझी हुई है।",
         "This problem is extremely complex and tangled.", ""),
        ("आज का खाना बहुत स्वादिष्ट और पौष्टिक बना है।",
         "Today's food has turned out very tasty and nutritious.", ""),
        ("कमरे का माहौल बहुत शांत और आरामदायक था।",
         "The atmosphere of the room was very calm and comfortable.", ""),
    ],
    "node-04": [
        # Gender / oblique case — need 7
        ("बड़े पेड़ की छाया में बच्चे खेल रहे थे।",
         "The children were playing in the shade of the big tree.",
         "पेड़ is masculine but doesn't end in -ा, so it stays unchanged in oblique: पेड़ की छाया."),
        ("छोटी लड़की ने लाल गुब्बारा ख़रीदा।",
         "The little girl bought a red balloon.", ""),
        ("काले कुत्ते ने सफ़ेद बिल्ली का पीछा किया।",
         "The black dog chased the white cat.",
         "काला → काले (oblique masc. -ा → -े): काले कुत्ते ने. सफ़ेद doesn't change (no -ा ending)."),
        ("पुरानी दुकान के सामने एक बड़ा पेड़ खड़ा है।",
         "A big tree stands in front of the old shop.", ""),
        ("नीली साड़ी पहनी हुई औरत मेरी मौसी है।",
         "The woman wearing the blue saree is my aunt.", ""),
        ("भूखे बच्चों को गर्म खिचड़ी दी गई।",
         "The hungry children were given hot khichdi.",
         "भूखा → भूखे (oblique plural masc.): भूखे बच्चों को. Feminine doesn't change: भूखी लड़कियों को."),
        ("ऊँचे पहाड़ों पर बर्फ़ की सफ़ेद चादर बिछी थी।",
         "A white sheet of snow was spread on the tall mountains.", ""),
    ],
    "node-05": [
        # Numbers / time / age — need 10
        ("इस शहर की आबादी लगभग पचास लाख है।",
         "The population of this city is approximately fifty lakh.",
         "लाख = 100,000 and करोड़ = 10,000,000 are used in South Asian numbering instead of million/billion."),
        ("परीक्षा सुबह साढ़े दस बजे से शुरू होगी।",
         "The exam will start from half past ten in the morning.", ""),
        ("दादाजी की उम्र अस्सी साल से ऊपर है।",
         "Grandfather's age is above eighty years.", ""),
        ("हमने कल रात ग्यारह बजे खाना खाया।",
         "We ate dinner at eleven o'clock last night.", ""),
        ("इस इमारत में कुल बत्तीस मंज़िलें हैं।",
         "There are a total of thirty-two floors in this building.",
         "बत्तीस = 32. Hindi numbers 21-99 are single words: इक्कीस (21), बाईस (22), तेईस (23)..."),
        ("बच्चे ने आज अपना पाँचवाँ जन्मदिन मनाया।",
         "The child celebrated his fifth birthday today.", ""),
        ("ट्रेन ठीक पौने चार बजे प्लेटफ़ॉर्म पर आई।",
         "The train arrived at the platform at exactly quarter to four.",
         "पौने = quarter to. पौने चार = 3:45, पौने पाँच = 4:45. Always subtract 15 minutes."),
        ("हमारे गाँव में लगभग तीन सौ परिवार रहते हैं।",
         "Approximately three hundred families live in our village.", ""),
        ("सवा दो बजे तक सारा काम ख़त्म कर दो।",
         "Finish all the work by quarter past two.", ""),
        ("उसने सात दिनों में पूरी किताब पढ़ डाली।",
         "He read the entire book in seven days.",
         "पढ़ डालना = read through completely. डालना as compound verb adds sense of completeness/finality."),
    ],
    "node-18": [
        # Complex sentences / relative clauses — need 2
        ("चूँकि बारिश बहुत तेज़ थी, इसलिए हम घर पर ही रुके।",
         "Since the rain was very heavy, we stayed at home.",
         "चूँकि...इसलिए = since...therefore. Formal alternative to क्योंकि...इसलिए."),
        ("जैसे ही शिक्षक कक्षा में आए, सब शांत हो गए।",
         "As soon as the teacher entered the class, everyone became quiet.", ""),
    ],
    "node-23": [
        # Ergative ने construction / past transitive — need 10
        ("रीना ने अपनी माँ के लिए खाना बनाया।",
         "Reena cooked food for her mother.",
         "ने + transitive past: verb agrees with object. खाना (m.) → बनाया (m.). If object were रोटी (f.) → बनाई."),
        ("बच्चों ने मिलकर पूरा कमरा साफ़ किया।",
         "The children cleaned the entire room together.", ""),
        ("उसने बड़ी मेहनत से यह परीक्षा पास की।",
         "He passed this exam with great effort.", ""),
        ("दादाजी ने हमें एक पुरानी कहानी सुनाई।",
         "Grandfather told us an old story.",
         "सुनाई (f.) agrees with कहानी (f.), not with दादाजी. The ने construction always makes verb agree with object."),
        ("माँ ने बच्चों के लिए गर्म दूध तैयार किया।",
         "Mother prepared warm milk for the children.", ""),
        ("पुलिस ने चोर को रात में ही पकड़ लिया।",
         "The police caught the thief at night itself.", ""),
        ("किसान ने सुबह-सुबह अपने खेत में बीज बोए।",
         "The farmer sowed seeds in his field early morning.",
         "बीज (m. pl.) → बोए (m. pl.). With plural objects, verb takes plural form in ने construction."),
        ("उसने मुझसे कोई बात नहीं कही।",
         "He did not say anything to me.", ""),
        ("शिक्षिका ने सभी छात्रों की कॉपियाँ जाँची।",
         "The teacher checked all the students' notebooks.", ""),
        ("हमने पिछले साल दिल्ली से जयपुर तक गाड़ी चलाई।",
         "We drove from Delhi to Jaipur last year.",
         "गाड़ी चलाई: चलाई (f.) agrees with गाड़ी (f.). Even though हमने is the agent, verb matches the object gender."),
    ],
    "node-26": [
        # Perso-Arabic vocabulary — need 1
        ("उन्होंने इस मामले में बहुत एहतियात से फ़ैसला किया।",
         "They made the decision very cautiously in this matter.", ""),
    ],
    "node-27": [
        # Reported speech — need 1
        ("उसने बताया कि वह अगले महीने विदेश जाएगा।",
         "He told that he would go abroad next month.",
         "Reported speech: direct तुम → indirect वह. Future tense retained: जाएगा stays जाएगा."),
    ],
    "node-28": [
        # Idioms — need 2
        ("जब से नौकरी मिली है, उसके दिन फिर गए हैं।",
         "Since he got the job, his fortunes have turned around.",
         "दिन फिरना = fortunes turning around. फिरना literally means 'to turn/revolve'."),
        ("उसने अपनी ज़िद पर अड़कर सबको परेशान कर दिया।",
         "He troubled everyone by stubbornly sticking to his demand.", ""),
    ],
    "node-29": [
        # Formal vs informal register — need 1
        ("कृपया अपना परिचय विस्तार से दीजिए।",
         "Please give your introduction in detail.", ""),
    ],
    "node-30": [
        # Sanskrit/Persian/English loanwords — need 1
        ("आधुनिक तकनीक ने संचार को बहुत आसान बना दिया है।",
         "Modern technology has made communication very easy.",
         "आधुनिक (modern) and संचार (communication) are Sanskrit-origin. तकनीक is Arabic-origin via Urdu."),
    ],
    "node-31": [
        # Conditionals — need 1
        ("अगर तुम समय पर नहीं पहुँचे तो गाड़ी छूट जाएगी।",
         "If you don't arrive on time, the train will be missed.", ""),
    ],
    "node-32": [
        # Literary Hindi — need 1
        ("साहित्य समाज का दर्पण होता है और जीवन की सच्चाई दिखाता है।",
         "Literature is the mirror of society and shows the truth of life.",
         "दर्पण = mirror (Sanskrit). Everyday Hindi uses आईना (Persian-origin). Literary register prefers Sanskrit words."),
    ],
    "node-33": [
        # Academic Hindi — need 1
        ("इस शोध प्रबंध में पर्यावरण प्रदूषण का विस्तृत विश्लेषण किया गया है।",
         "A detailed analysis of environmental pollution has been done in this research thesis.", ""),
    ],
    "node-34": [
        # Cultural values / proverbs — need 1
        ("जहाँ चाह वहाँ राह — यह कहावत हमें हमेशा प्रेरित करती है।",
         "Where there is a will, there is a way — this proverb always inspires us.",
         "जहाँ चाह वहाँ राह is one of Hindi's most well-known proverbs about determination and persistence."),
    ],
    "node-35": [
        # Colloquial / spoken Hindi — need 1
        ("अरे यार, इतनी देर से क्यों आए, सब लोग तुम्हारा इंतज़ार कर रहे थे।",
         "Hey buddy, why did you come so late, everyone was waiting for you.",
         "यार = buddy/dude. Very common in colloquial Hindi. अरे is an interjection expressing surprise or mild annoyance."),
    ],
}


def main():
    with open(DECK_PATH, "r", encoding="utf-8") as f:
        deck = json.load(f)

    existing_targets = {c["target"] for c in deck}
    next_id = len(deck) + 1  # IDs are sequential hi-NNNN

    # Count per node
    from collections import Counter
    node_counts = Counter(c["grammarNode"] for c in deck)

    tag_options = [
        ["general", "travel"],
        ["general", "work"],
        ["general", "family"],
        ["general", "travel", "work"],
        ["general", "travel", "family"],
        ["general", "work", "family"],
        ["general", "travel", "work", "family"],
        ["general"],
    ]

    added = 0
    skipped = 0

    for node, sentences in sorted(NEW_SENTENCES.items()):
        for target_hi, english, grammar in sentences:
            if target_hi in existing_targets:
                print(f"  SKIP duplicate: {target_hi[:40]}...")
                skipped += 1
                continue

            card_id = f"hi-{next_id:04d}"
            card = {
                "id": card_id,
                "target": target_hi,
                "english": english,
                "audio": f"hi/{card_id}.mp3",
                "grammar": grammar,
                "tags": random.choice(tag_options),
                "grammarNode": node,
            }
            deck.append(card)
            existing_targets.add(target_hi)
            next_id += 1
            added += 1

    # Write back
    with open(DECK_PATH, "w", encoding="utf-8") as f:
        json.dump(deck, f, ensure_ascii=False, indent=2)
        f.write("\n")

    # Print stats
    node_counts_final = Counter(c["grammarNode"] for c in deck)
    print(f"\n=== Hindi Deck Fill Results ===")
    print(f"Cards added: {added}")
    print(f"Cards skipped (duplicate): {skipped}")
    print(f"Total cards: {len(deck)}")
    print(f"\nNode distribution:")
    for n in range(1, 36):
        node = f"node-{n:02d}"
        target = 113 if n >= 26 else 112
        count = node_counts_final.get(node, 0)
        status = "OK" if count >= target else f"SHORT by {target - count}"
        print(f"  {node}: {count:>4} cards (target {target}) — {status}")

    # Grammar tip stats
    tips = sum(1 for c in deck if c.get("grammar"))
    print(f"\nGrammar tips: {tips}/{len(deck)} ({100*tips/len(deck):.1f}%)")

    # Avg words per sentence
    import re
    word_counts = [len(c["target"].split()) for c in deck]
    print(f"Avg words/sentence: {sum(word_counts)/len(word_counts):.1f}")

    # Unique targets check
    all_targets = [c["target"] for c in deck]
    print(f"Unique targets: {len(set(all_targets))}/{len(all_targets)}")


if __name__ == "__main__":
    main()
