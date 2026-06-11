#!/usr/bin/env python3
"""Fix 15 word-salad cards in Welsh deck node-25."""

import json

DECK_PATH = "src/data/welsh/deck.json"

REPLACEMENTS = {
    2593: {
        "english": "Owain explained that he had cooked dinner before Sian arrived home from work.",
        "target": "Esboniodd Owain ei fod wedi coginio swper cyn i Siân gyrraedd adref o'r gwaith.",
    },
    2594: {
        "english": "Elin said that she broke her glasses while she was running in the park.",
        "target": "Dywedodd Elin ei bod wedi torri ei sbectol tra oedd hi'n rhedeg yn y parc.",
    },
    2595: {
        "english": "Rhys lost his wallet somewhere in the hospital when he visited his grandmother.",
        "target": "Collodd Rhys ei waled yn rhywle yn yr ysbyty pan aeth i weld ei fam-gu.",
    },
    2596: {
        "english": "Cerys told us that the community centre on the mountain road had finally opened.",
        "target": "Dywedodd Cerys wrthon ni fod y ganolfan gymunedol ar y ffordd mynydd wedi agor o'r diwedd.",
    },
    2597: {
        "english": "Gethin got a new job on the farm after he finished his course at college.",
        "target": "Cafodd Gethin swydd newydd ar y fferm ar ôl iddo orffen ei gwrs yn y coleg.",
    },
    2599: {
        "english": "Iolo lost track of time while he was reading a book under the oak tree in the garden.",
        "target": "Collodd Iolo olwg ar yr amser tra oedd e'n darllen llyfr o dan y dderwen yn yr ardd.",
    },
    2600: {
        "english": "Angharad built a stone wall around the field so that the sheep would not escape.",
        "target": "Adeiladodd Angharad wal gerrig o gwmpas y cae fel na fyddai'r defaid yn dianc.",
    },
    2604: {
        "english": "Lowri discovered a beautiful waterfall on the mountain when she went hiking last weekend.",
        "target": "Darganfyddodd Lowri raeadr hardd ar y mynydd pan aeth hi i gerdded y penwythnos diwethaf.",
    },
    2605: {
        "english": "Gareth said that he had built the shelves himself although it took him all afternoon.",
        "target": "Dywedodd Gareth ei fod wedi adeiladu'r silffoedd ei hun er iddo gymryd y prynhawn i gyd.",
    },
    2606: {
        "english": "Catrin found fresh mushrooms and herbs in the market before she cooked supper in the kitchen.",
        "target": "Ffeindiodd Catrin fadarch a pherlysiau ffres yn y farchnad cyn iddi goginio swper yn y gegin.",
    },
    2607: {
        "english": "Emyr lost his job at the factory, but he found a better one within a month.",
        "target": "Collodd Emyr ei swydd yn y ffatri, ond ffeindiodd un well o fewn mis.",
    },
    2608: {
        "english": "Sioned noticed that the office was unusually quiet because everyone had left early on Friday.",
        "target": "Sylwodd Sioned fod y swyddfa'n anarferol o dawel oherwydd bod pawb wedi gadael yn gynnar ddydd Gwener.",
    },
    2609: {
        "english": "Dewi found an old coin on the beach which he thought might be very valuable.",
        "target": "Ffeindiodd Dewi hen ddarn arian ar y traeth yr oedd yn meddwl y gallai fod yn werthfawr iawn.",
    },
    2611: {
        "english": "Aled cooked a meal for the whole family even though he had never tried the recipe before.",
        "target": "Coginiondd Aled bryd o fwyd i'r teulu i gyd er nad oedd erioed wedi trio'r rysáit o'r blaen.",
    },
    2615: {
        "english": "Gwenllian told the teacher that she had lost her homework on the way to school.",
        "target": "Dywedodd Gwenllian wrth yr athrawes ei bod wedi colli ei gwaith cartref ar y ffordd i'r ysgol.",
    },
}

with open(DECK_PATH, "r", encoding="utf-8") as f:
    deck = json.load(f)

replaced = 0
for card in deck:
    cid = card.get("id")
    if cid in REPLACEMENTS:
        card["english"] = REPLACEMENTS[cid]["english"]
        card["target"] = REPLACEMENTS[cid]["target"]
        replaced += 1
        print(f"  Fixed id {cid}: {card['english'][:60]}...")

print(f"\nReplaced {replaced}/{len(REPLACEMENTS)} cards.")

with open(DECK_PATH, "w", encoding="utf-8") as f:
    json.dump(deck, f, indent=2, ensure_ascii=False)
    f.write("\n")

print("Wrote", DECK_PATH)
