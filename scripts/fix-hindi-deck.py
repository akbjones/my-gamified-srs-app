#!/usr/bin/env python3
"""Fix Hindi deck: religious cards, template duplicates, code-switching, gender bugs."""

import json
import re
from collections import defaultdict

DECK_PATH = "src/data/hindi/deck.json"

with open(DECK_PATH) as f:
    deck = json.load(f)

by_id = {c["id"]: c for c in deck}

# ============================================================
# CATEGORY 1: Religious/mantra cards to replace
# These are prayers, mantras, or assume religious participation.
# Cultural mentions of festivals/temples in everyday context are kept.
# ============================================================

religious_replacements = {
    # node-01: Greetings with mantras/religious invocations
    "hi-4307": {
        "target": "नमस्ते दोस्तों, कैसे हैं आप सब?",
        "english": "Hello friends, how are you all?"
    },
    "hi-4320": {
        "target": "अरे भाई, आज बाज़ार चलोगे?",
        "english": "Hey brother, will you go to the market today?"
    },
    "hi-4325": {
        "target": "नमस्ते आंटी, सब ठीक है ना?",
        "english": "Hello Aunty, everything is fine right?"
    },
    "hi-4326": {
        "target": "आज मौसम बहुत अच्छा है, बाहर चलें?",
        "english": "The weather is very nice today, shall we go out?"
    },
    # node-01: Jai Hind (patriotic greeting - borderline but replacing mantra-like usage)
    "hi-3338": {
        "target": "सुप्रभात! आज का दिन अच्छा रहे।",
        "english": "Good morning! May today be a good day."
    },
    "hi-4572": {
        "target": "नमस्ते अमित भाई, सब कुशल?",
        "english": "Hello brother Amit, all well?"
    },
    # node-01: Ram Ram greeting - common but religiously rooted
    "hi-3337": {
        "target": "अरे भाई, बड़े दिनों बाद दिखे।",
        "english": "Hey brother, seen after a long time."
    },
    # node-02: Religious practice cards
    "hi-0176": {
        "target": "मेरा मेहनती बेटा रोज़ सुबह-शाम पढ़ाई करता है।",
        "english": "My hardworking son studies every morning and evening."
    },
    "hi-0186": {
        "target": "वह लगन से हर संध्या बग़ीचे में पौधों को पानी देती है।",
        "english": "She waters the plants in the garden with dedication every evening."
    },
    "hi-0201": {
        "target": "वह नियम से हर रविवार को बाज़ार जाती है।",
        "english": "She goes to the market regularly every Sunday."
    },
    "hi-0217": {
        "target": "मैं नियम से हर सुबह व्यायाम और योग करता हूँ।",
        "english": "I do exercise and yoga regularly every morning."
    },
    "hi-0221": {
        "target": "वह अनुशासन से हर सोमवार को बिना मिठाई खाती है।",
        "english": "She avoids sweets every Monday with discipline."
    },
    "hi-4339": {
        "target": "माँ रोज़ सुबह चाय बनाती है।",
        "english": "Mother makes tea every morning."
    },
    # node-05: Worship at temple
    "hi-0491": {
        "target": "मंगलवार और शुक्रवार को बाज़ार में विशेष छूट मिलती है।",
        "english": "Special discounts are available at the market on Tuesdays and Fridays."
    },
    # node-09: Worship with conch
    "hi-0892": {
        "target": "ढोल बजाकर समारोह शुरू किया गया।",
        "english": "The ceremony was started by playing the drum."
    },
    # node-09: Meditation/bhajan at ashram
    "hi-0908": {
        "target": "आश्रम में योग और ध्यान होता है।",
        "english": "Yoga and meditation take place at the ashram."
    },
    # node-10: Worship plate items
    "hi-0985": {
        "target": "सजावट की थाली में फूल और मोमबत्ती रखी।",
        "english": "Flowers and candles were kept in the decoration plate."
    },
    # node-18: Fire ritual
    "hi-1730": {
        "target": "चूल्हे में लकड़ी और कोयले की आग जलाई गई।",
        "english": "Fire of wood and coal was lit in the stove."
    },
    # node-18: Brass lamps in worship
    "hi-1717": {
        "target": "पीतल के बर्तन रसोई में इस्तेमाल होते हैं।",
        "english": "Brass utensils are used in the kitchen."
    },
    # node-19: Chhath Puja offerings
    "hi-1862": {
        "target": "मकर संक्रांति पर तिल-गुड़ बाँटा जाता है।",
        "english": "Sesame and jaggery are distributed on Makar Sankranti."
    },
    # node-20: Flowers in worship
    "hi-1971": {
        "target": "गेंदे के फूल सजावट में इस्तेमाल होते हैं।",
        "english": "Marigold flowers are used in decoration."
    },
    # node-21: Navratri fasting
    "hi-2030": {
        "target": "परीक्षा के दौरान नौ दिन तक ख़ूब पढ़ाई की जाती है।",
        "english": "During exams, studying is done extensively for nine days."
    },
    # node-21: Krishna devotion poetry
    "hi-2073": {
        "target": "रसखान ने प्रकृति पर सुंदर कविताएँ लिखीं।",
        "english": "Raskhan wrote beautiful poems on nature."
    },
    # node-22: Shankar's damru (religious symbol)
    "hi-2133": {
        "target": "तबले की थाप संगीत की पहचान है।",
        "english": "The beat of the tabla is the identity of music."
    },
    # node-23: Chhath Puja offering
    "hi-2160": {
        "target": "लिट्टी-चोखा बिहार का प्रसिद्ध व्यंजन है।",
        "english": "Litti-chokha is a famous dish of Bihar."
    },
    # node-23: Fire pit oblation
    "hi-2188": {
        "target": "रसोइये ने तंदूर में रोटी सेंकी।",
        "english": "The cook baked bread in the tandoor."
    },
    # node-24: Idol in sanctum
    "hi-2313": {
        "target": "संग्रहालय के मुख्य कक्ष में प्रतिमा रखी है।",
        "english": "The statue is kept in the main hall of the museum."
    },
    # node-25: Hanuman Chalisa
    "hi-2336": {
        "target": "अख़बार की सुर्ख़ियाँ मंगलवार को पढ़ी जाती हैं।",
        "english": "Newspaper headlines are read on Tuesdays."
    },
    # node-25: Havan fragrance
    "hi-2352": {
        "target": "खाना पकने की सुगंध पूरे घर में फैल गई।",
        "english": "The aroma of cooking spread throughout the house."
    },
    # node-27: Durga Puja
    "hi-2574": {
        "target": "कोलकाता का विक्टोरिया मेमोरियल एक भव्य इमारत है।",
        "english": "Kolkata's Victoria Memorial is a grand building."
    },
    # node-28: Aarti at Ganga ghats
    "hi-2684": {
        "target": "गंगा के घाट पर शाम का दृश्य अद्भुत था।",
        "english": "The evening scene at the Ganga ghats was wonderful."
    },
    # node-28: Goddess Saraswati idol
    "hi-2701": {
        "target": "वीणा बजाते हुए संगीतकार की तस्वीर प्रसिद्ध है।",
        "english": "The picture of the musician playing the veena is famous."
    },
    # node-28: Temple idols carved from stone
    "hi-2682": {
        "target": "पत्थर तराशकर सुंदर मूर्तियाँ बनाई गईं।",
        "english": "Beautiful statues were made by carving stone."
    },
    # node-29: Jai Shri Krishna greeting in Braj
    "hi-2836": {
        "target": "नमस्ते कहकर ब्रज में लोग मिलते हैं।",
        "english": "People in Braj meet saying Namaste."
    },
    # node-31: Khichdi offering at temple
    "hi-3046": {
        "target": "खिचड़ी का भोग शादी में परोसा जाता है।",
        "english": "Khichdi is served at the wedding feast."
    },
    # node-32: Meera Bai's bhajans
    "hi-3061": {
        "target": "मीरा बाई के गीत आज भी गाए जाते हैं।",
        "english": "Meera Bai's songs are sung even today."
    },
    # node-32: Charanamrit
    "hi-3072": {
        "target": "शरबत मेहमानों को बाँटा जाता है।",
        "english": "Sherbet is distributed to guests."
    },
    # node-34: Navratri worship
    "hi-4284": {
        "target": "नवरात्रि में नौ दिन तक गरबा खेला जाता है।",
        "english": "During Navratri, Garba is played for nine days."
    },
    # node-34: Durga Puja in Bengal
    "hi-4568": {
        "target": "दिवाली बंगाल में बड़ी धूमधाम से मनाई जाती है।",
        "english": "Diwali is celebrated with great pomp in Bengal."
    },
    # node-34: Ganesh Chaturthi idol
    "hi-4564": {
        "target": "गणतंत्र दिवस पर तिरंगा फहराया जाता है।",
        "english": "The tricolor flag is hoisted on Republic Day."
    },
    # node-34: Janmashtami tableaux
    "hi-4569": {
        "target": "स्वतंत्रता दिवस पर स्कूलों में झाँकी सजाई जाती है।",
        "english": "On Independence Day, tableaux are decorated in schools."
    },
    # node-34: Ganpati Bappa Morya chant
    "hi-4820": {
        "target": "गणतंत्र दिवस पर भारत माता की जय की जयकार होती है।",
        "english": "On Republic Day, the chant of 'Bharat Mata ki Jai' is heard."
    },
    # node-35: Aarti plate items
    "hi-3232": {
        "target": "सजावट की थाली में दीया, फूल और चावल रखते हैं।",
        "english": "A lamp, flowers, and rice grains are kept in the decoration plate."
    },
    # node-16: Hymn singing at temple (2 cards)
    "hi-4505": {
        "target": "संगीत की महफ़िल हर शाम सभागार में होती थी।",
        "english": "Music gatherings used to happen in the hall every evening."
    },
    "hi-4883": {
        "target": "गाँव के चौपाल पर हर शाम कहानियाँ सुनाई जाती थीं।",
        "english": "Stories used to be told every evening at the village meeting place."
    },
    # node-08: Bhajan while playing harmonium
    "hi-0781": {
        "target": "हारमोनियम बजाते हुए गाना गाया।",
        "english": "Sang a song while playing the harmonium."
    },
}

# ============================================================
# CATEGORY 2: Template duplicates - keep 1, replace rest
# For each template group, keep the first card and replace extras
# ============================================================

def normalize_for_template(text):
    names = ['Amit', 'Anita', 'Asha', 'Vijay', 'Rahul', 'Priya', 'Neha', 'Sita', 'Pooja',
             'Radha', 'Ravi', 'Mohan', 'Sohan', 'Nisha', 'Geeta', 'Meena', 'Seema', 'Rohan',
             'Anjali', 'Sunita', 'Rita', 'Kavita', 'Madhavi', 'Vandana', 'Aarti', 'Lakshmi',
             'Sanjay', 'Ajay', 'Suresh', 'Ramesh', 'Mahesh', 'Dinesh', 'Mukesh', 'Rajesh',
             'Vivek', 'Arun', 'Varun', 'Kiran', 'Deepa', 'Reema', 'Sapna', 'Rekha',
             'Kumar', 'Sharma', 'Gupta', 'Singh', 'Verma', 'Mishra', 'Pandey',
             'Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bangalore', 'Jaipur', 'Lucknow',
             'Patna', 'Bhopal', 'Pune', 'Hyderabad', 'Ahmedabad', 'Chandigarh', 'Ranchi',
             'Varanasi', 'Nagpur', 'Dehradun', 'Shimla', 'Agra', 'Kanpur', 'Indore',
             'Goa', 'Kochi', 'Mysore', 'Udaipur', 'Jodhpur', 'Amritsar', 'Darjeeling',
             'Shobha', 'Jyoti', 'Divya', 'Hari', 'Pankaj', 'Swati', 'Ruby', 'Gaurav',
             'Kamal', 'Gopal', 'Pradeep', 'Ashish', 'Sushma', 'Manish', 'Rani']
    text = text.strip()
    for name in sorted(names, key=len, reverse=True):
        text = text.replace(name, 'NAME')
    return text

templates = defaultdict(list)
for card in deck:
    norm = normalize_for_template(card['english'])
    templates[norm].append(card)

# Replacement sentences per node for template duplicates
# These are unique, everyday Hindi sentences at the correct grammar level
template_replacements = {
    "node-01": [
        ("मैं रोज़ सुबह दूध पीता हूँ।", "I drink milk every morning."),
        ("हमारे पड़ोसी बहुत अच्छे हैं।", "Our neighbors are very nice."),
        ("मेरी बहन डॉक्टर है।", "My sister is a doctor."),
        ("यह किताब बहुत रोचक है।", "This book is very interesting."),
        ("आज सब्ज़ी मंडी बंद है।", "The vegetable market is closed today."),
        ("बच्चे बग़ीचे में खेल रहे हैं।", "Children are playing in the garden."),
        ("मेरे पिताजी सरकारी दफ़्तर में काम करते हैं।", "My father works in a government office."),
        ("हम लोग ट्रेन से सफ़र करते हैं।", "We travel by train."),
        ("घर के पास एक अच्छी दुकान है।", "There is a good shop near the house."),
        ("मेरा भाई इंजीनियर बनना चाहता है।", "My brother wants to become an engineer."),
    ],
    "node-02": [
        ("किसान हर मौसम में अलग फ़सल बोते हैं।", "Farmers sow different crops every season."),
        ("बच्चे स्कूल से आकर होमवर्क करते हैं।", "Children do homework after coming from school."),
        ("हमारी गाय रोज़ दस लीटर दूध देती है।", "Our cow gives ten liters of milk every day."),
        ("दादाजी अख़बार पढ़ते हुए चाय पीते हैं।", "Grandfather drinks tea while reading the newspaper."),
        ("मौसी हर महीने हमारे घर आती हैं।", "Aunt comes to our house every month."),
    ],
    "node-08": [
        ("अरे वाह, तुमने तो कमाल कर दिया!", "Wow, you did an amazing job!"),
        ("ज़रा सुनो, एक अच्छी ख़बर है।", "Just listen, there is good news."),
        ("देखो, बारिश होने वाली है।", "Look, it's about to rain."),
        ("अच्छा, तो तुम भी वहाँ जा रहे हो?", "Oh, so you are also going there?"),
        ("बताओ, इतने दिन कहाँ थे?", "Tell me, where have you been for so long?"),
        ("चलो, कुछ खाने चलते हैं।", "Come, let's go eat something."),
        ("सुनो, कल की योजना क्या है?", "Listen, what is the plan for tomorrow?"),
        ("वाह, यह तो बढ़िया ख़बर है!", "Wow, this is great news!"),
        ("ठहरो, मैं भी चलता हूँ।", "Wait, I'll also come along."),
        ("अरे, मुझे तो पता ही नहीं था!", "Oh, I had no idea!"),
    ],
    "node-09": [
        ("रसोइये ने आज बहुत स्वादिष्ट खाना बनाया।", "The cook made very delicious food today."),
        ("बच्चों ने पार्क में ख़ूब मस्ती की।", "The children had a lot of fun in the park."),
        ("दुकानदार ने सामान जल्दी भेज दिया।", "The shopkeeper sent the goods quickly."),
        ("किसान ने इस बार गेहूँ की अच्छी फ़सल काटी।", "The farmer harvested a good wheat crop this time."),
        ("पड़ोसन ने हमें खाने पर बुलाया।", "The neighbor invited us for dinner."),
        ("मज़दूरों ने सड़क का काम समय पर पूरा किया।", "The workers completed the road work on time."),
        ("ड्राइवर ने गाड़ी बहुत सावधानी से चलाई।", "The driver drove the car very carefully."),
        ("दर्ज़ी ने कपड़े समय पर सिल दिए।", "The tailor stitched the clothes on time."),
        ("नाई ने बाल बहुत अच्छे से काटे।", "The barber cut the hair very nicely."),
        ("अध्यापक ने कठिन विषय आसानी से समझाया।", "The teacher explained the difficult topic easily."),
        ("डाकिए ने सुबह-सुबह चिट्ठी दी।", "The postman gave the letter early in the morning."),
        ("माली ने बग़ीचे में नए पौधे लगाए।", "The gardener planted new saplings in the garden."),
    ],
    "node-10": [
        ("बाज़ार में आज भीड़ बहुत ज़्यादा है।", "The crowd in the market is very large today."),
        ("बच्चे छत पर पतंग उड़ा रहे हैं।", "Children are flying kites on the terrace."),
        ("नानी कहानी सुना रही हैं।", "Grandmother is telling a story."),
        ("किसान खेत में हल चला रहा है।", "The farmer is plowing the field."),
        ("ताऊजी आँगन में कुर्सी पर बैठे अख़बार पढ़ रहे हैं।", "Uncle is sitting on a chair in the courtyard reading the newspaper."),
        ("सड़क पर गाड़ियाँ तेज़ी से दौड़ रही हैं।", "Cars are running fast on the road."),
        ("बारिश में बच्चे काग़ज़ की नाव बना रहे हैं।", "Children are making paper boats in the rain."),
        ("चाचाजी बाज़ार से सब्ज़ी ला रहे हैं।", "Uncle is bringing vegetables from the market."),
    ],
    "node-11": [
        ("मुझे आज बैंक जाना चाहिए।", "I should go to the bank today."),
        ("हमें जल्दी सोना चाहिए।", "We should sleep early."),
        ("तुम्हें ज़्यादा पानी पीना चाहिए।", "You should drink more water."),
        ("बच्चों को बाहर खेलना चाहिए।", "Children should play outside."),
        ("हमें बड़ों की बात माननी चाहिए।", "We should listen to our elders."),
        ("तुम्हें अपना काम ख़ुद करना चाहिए।", "You should do your own work yourself."),
    ],
    "node-13": [
        ("किसी को यह बात अच्छी नहीं लगी।", "Nobody liked this thing."),
        ("उसे गर्मी का मौसम बिलकुल पसंद नहीं।", "She doesn't like the summer season at all."),
        ("बच्चों को कड़वी दवाई पसंद नहीं आई।", "The children didn't like the bitter medicine."),
        ("मुझे रात को देर से जागना पसंद नहीं।", "I don't like staying up late at night."),
        ("उन्हें शोर-शराबा बिलकुल पसंद नहीं।", "They don't like noise at all."),
    ],
    "node-15": [
        ("आम अंगूर से मीठा होता है।", "Mango is sweeter than grapes."),
        ("सर्दी गर्मी से ज़्यादा सुहानी होती है।", "Winter is more pleasant than summer."),
        ("ट्रेन बस से तेज़ चलती है।", "The train runs faster than the bus."),
        ("दूध चाय से ज़्यादा फ़ायदेमंद है।", "Milk is more beneficial than tea."),
        ("पहाड़ मैदान से ठंडे होते हैं।", "Mountains are cooler than plains."),
        ("लोहा ताँबे से सस्ता होता है।", "Iron is cheaper than copper."),
        ("गंगा यमुना से लंबी नदी है।", "Ganga is a longer river than Yamuna."),
        ("सोना चाँदी से महँगा होता है।", "Gold is costlier than silver."),
        ("ऊँट घोड़े से ज़्यादा भार ढो सकता है।", "A camel can carry more weight than a horse."),
        ("हाथी शेर से भारी होता है।", "An elephant is heavier than a lion."),
        ("बाँस लकड़ी से ज़्यादा लचीला होता है।", "Bamboo is more flexible than wood."),
        ("नींबू संतरे से ज़्यादा खट्टा होता है।", "Lemon is more sour than orange."),
        ("रेशम ऊन से ज़्यादा मुलायम होता है।", "Silk is softer than wool."),
        ("गाजर मूली से ज़्यादा मीठी होती है।", "Carrot is sweeter than radish."),
        ("चीता तेंदुए से ज़्यादा तेज़ दौड़ता है।", "The cheetah runs faster than the leopard."),
        ("दूध दही से ज़्यादा पतला होता है।", "Milk is thinner than curd."),
        ("कपास रेशम से ज़्यादा टिकाऊ होती है।", "Cotton is more durable than silk."),
        ("अदरक लहसुन से ज़्यादा तीखा होता है।", "Ginger is spicier than garlic."),
        ("नदी तालाब से ज़्यादा गहरी होती है।", "A river is deeper than a pond."),
        ("चावल गेहूँ से जल्दी पकता है।", "Rice cooks faster than wheat."),
    ],
    "node-16": [
        ("पहले गाँवों में बिजली नहीं होती थी।", "Earlier, villages did not have electricity."),
        ("बचपन में हम पतंग उड़ाया करते थे।", "In childhood, we used to fly kites."),
        ("पहले लोग कुएँ से पानी भरते थे।", "Earlier people used to draw water from wells."),
        ("बचपन में दादी कहानियाँ सुनाती थीं।", "In childhood, grandmother used to tell stories."),
        ("पहले सड़कें कच्ची हुआ करती थीं।", "Earlier the roads used to be unpaved."),
        ("बचपन में हम नदी में नहाया करते थे।", "In childhood, we used to bathe in the river."),
        ("पहले टेलीफ़ोन बहुत कम घरों में होता था।", "Earlier, very few homes had telephones."),
        ("बचपन में ताऊजी साइकिल से दफ़्तर जाते थे।", "In childhood, uncle used to go to office by bicycle."),
        ("पहले लोग चिट्ठी लिखकर बात करते थे।", "Earlier people used to communicate by writing letters."),
        ("बचपन में गर्मी की छुट्टी में नानी के घर जाते थे।", "In childhood, we used to go to grandma's house in summer vacation."),
        ("पहले बैलगाड़ी से सामान ढोया जाता था।", "Earlier goods were transported by bullock cart."),
        ("बचपन में हम गुल्ली-डंडा खेला करते थे।", "In childhood, we used to play gilli-danda."),
        ("पहले दवाइयाँ जड़ी-बूटियों से बनती थीं।", "Earlier medicines were made from herbs."),
        ("बचपन में आम के पेड़ पर चढ़ते थे।", "In childhood, we used to climb mango trees."),
        ("पहले रात को लालटेन जलाई जाती थी।", "Earlier, lanterns were lit at night."),
    ],
    "node-17": [
        ("स्टेशन जाने के लिए कौन सा रास्ता लूँ?", "Which route should I take to go to the station?"),
        ("बस अड्डे तक पैदल कितना समय लगता है?", "How much time does it take to walk to the bus stand?"),
        ("रेलवे स्टेशन कितनी दूर है?", "How far is the railway station?"),
        ("यहाँ से हवाई अड्डा कैसे जाएँ?", "How do we get to the airport from here?"),
        ("अगली बस कितने बजे आएगी?", "At what time will the next bus come?"),
        ("टिकट कहाँ से मिलेगा?", "Where can I get the ticket?"),
        ("क्या यहाँ से ऑटो मिलेगा?", "Will I get an auto from here?"),
        ("सबसे नज़दीकी अस्पताल कौन सा है?", "Which is the nearest hospital?"),
        ("पोस्ट ऑफ़िस किस गली में है?", "In which lane is the post office?"),
        ("बाज़ार यहाँ से कितनी दूर है?", "How far is the market from here?"),
        ("इस रास्ते से जाने में कम समय लगता है।", "Going by this route takes less time."),
        ("नदी के उस पार गाँव है।", "There is a village on the other side of the river."),
        ("पुल पार करके सीधे चले जाइए।", "Cross the bridge and go straight."),
        ("चौराहे पर बाएँ मुड़ जाइए।", "Turn left at the crossing."),
    ],
    "node-18": [
        ("अगर बारिश हुई तो फ़सल अच्छी होगी।", "If it rains, the crop will be good."),
        ("अगर तबीयत ठीक रही तो कल दफ़्तर जाऊँगा।", "If health remains fine, I will go to office tomorrow."),
        ("अगर ट्रेन समय पर आई तो हम शाम तक पहुँच जाएँगे।", "If the train comes on time, we will reach by evening."),
        ("अगर बिजली आ गई तो पंखा चला लेंगे।", "If the electricity comes, we will turn on the fan."),
        ("अगर रास्ते में भीड़ न हो तो जल्दी पहुँचेंगे।", "If there is no crowd on the way, we will reach early."),
        ("अगर परीक्षा में अच्छे अंक आए तो पार्टी करेंगे।", "If good marks come in the exam, we will have a party."),
        ("अगर दुकान खुली मिली तो सामान ले आएँगे।", "If the shop is open, we will bring the goods."),
        ("अगर मौसम साफ़ रहा तो तारे दिखेंगे।", "If the weather stays clear, stars will be visible."),
    ],
    "node-21": [
        ("जो मेहनत करता है वही सफल होता है।", "The one who works hard is the one who succeeds."),
        ("जिस दिन बारिश हुई, उस दिन स्कूल बंद था।", "The day it rained, school was closed that day."),
        ("जो किताब मैंने कल ख़रीदी, वह बहुत अच्छी है।", "The book I bought yesterday is very good."),
        ("जिस रास्ते से हम आए, वह बंद हो गया।", "The route we came from has been closed."),
        ("जो फल पक गए, उन्हें तोड़ लो।", "Pick the fruits that have ripened."),
        ("जिस कमरे में हम बैठे थे, वहाँ बहुत गर्मी थी।", "The room where we were sitting was very hot."),
        ("जो काम कल करना था, वह आज हो गया।", "The work that was to be done tomorrow got done today."),
        ("जिस गाँव में नानी रहती हैं, वहाँ नदी बहती है।", "A river flows in the village where grandmother lives."),
        ("जो बच्चा अभी रो रहा था, अब हँस रहा है।", "The child who was crying just now is laughing now."),
        ("जिस पेड़ के नीचे हम बैठे थे, वह बहुत पुराना था।", "The tree under which we were sitting was very old."),
    ],
    "node-23": [
        ("रसोइये ने एक ही बार में सबका खाना परोस दिया।", "The cook served everyone's food in one go."),
        ("मज़दूरों ने मिलकर भारी पत्थर उठाया।", "The workers together lifted the heavy stone."),
        ("दुकानदार ने सारा हिसाब एक काग़ज़ पर लिख दिया।", "The shopkeeper wrote down the entire account on a piece of paper."),
        ("किसान ने बैलों को चारा खिलाया।", "The farmer fed fodder to the oxen."),
        ("डॉक्टर ने मरीज़ को दवाई दी।", "The doctor gave medicine to the patient."),
    ],
    "node-24": [
        ("अगले हफ़्ते तक मकान की मरम्मत हो जाएगी।", "The house repair will be done by next week."),
        ("कल शाम तक रिपोर्ट तैयार हो जाएगी।", "The report will be ready by tomorrow evening."),
        ("अगले महीने नई दुकान खुलेगी।", "A new shop will open next month."),
        ("अगली गर्मी में हम पहाड़ों पर जाएँगे।", "We will go to the mountains next summer."),
        ("दो दिन में सड़क का काम पूरा हो जाएगा।", "The road work will be completed in two days."),
        ("अगले साल नई फ़सल और अच्छी होगी।", "Next year the new crop will be even better."),
        ("सोमवार तक सारा सामान पहुँच जाएगा।", "All the goods will arrive by Monday."),
        ("परसों तक बारिश रुक जाएगी।", "The rain will stop by the day after tomorrow."),
        ("इस बार ज़रूर अच्छे नंबर आएँगे।", "This time good marks will definitely come."),
        ("अगले हफ़्ते मेहमान आ रहे हैं।", "Guests are coming next week."),
        ("कल तक दवाई का असर दिखने लगेगा।", "The effect of the medicine will start showing by tomorrow."),
        ("शनिवार तक छुट्टी रहेगी।", "There will be holiday till Saturday."),
        ("अगले हफ़्ते रिश्तेदार मिलने आएँगे।", "Relatives will come to visit next week."),
        ("परसों तक मौसम साफ़ हो जाएगा।", "The weather will clear up by the day after tomorrow."),
        ("दो-तीन दिन में बुख़ार उतर जाएगा।", "The fever will come down in two-three days."),
    ],
    "node-27": [
        ("उसने पूछा कि क्या शाम को चाय पिएँगे।", "She asked whether we would have tea in the evening."),
        ("माँ ने पूछा कि बच्चे कहाँ गए।", "Mother asked where the children went."),
        ("पिताजी ने पूछा कि ट्रेन कितने बजे है।", "Father asked what time the train is."),
        ("दुकानदार ने पूछा कि और कुछ चाहिए क्या।", "The shopkeeper asked whether anything else is needed."),
        ("अध्यापक ने पूछा कि होमवर्क किसने किया।", "The teacher asked who did the homework."),
        ("डॉक्टर ने पूछा कि तबीयत कैसी है।", "The doctor asked how the health is."),
    ],
    "node-28": [
        ("उसने कठिन परिस्थिति में भी हिम्मत नहीं हारी।", "She did not lose courage even in difficult circumstances."),
        ("किसान ने सूखे में भी फ़सल बचा ली।", "The farmer saved the crop even during the drought."),
        ("बच्चे ने अँधेरे में भी डर नहीं दिखाया।", "The child showed no fear even in the dark."),
        ("बुढ़ापे में भी उनका उत्साह कम नहीं हुआ।", "Even in old age, their enthusiasm did not diminish."),
        ("गरीबी में भी उन्होंने पढ़ाई जारी रखी।", "Even in poverty, they continued their studies."),
    ],
    "node-29": [
        ("बचपन के दोस्त अब भी याद आते हैं।", "Childhood friends are still remembered."),
        ("स्कूल के दिन सबसे अच्छे दिन थे।", "School days were the best days."),
        ("पुरानी यादें मन को सुकून देती हैं।", "Old memories give peace to the heart."),
    ],
    "node-30": [
        ("यह शहर अपनी मिठाइयों के लिए मशहूर है।", "This city is famous for its sweets."),
        ("यह इलाक़ा चाय की खेती के लिए जाना जाता है।", "This area is known for tea cultivation."),
        ("यह क्षेत्र बुनाई कला के लिए प्रसिद्ध है।", "This region is famous for weaving art."),
        ("यह गाँव अपने मेले के लिए जाना जाता है।", "This village is known for its fair."),
        ("यह जगह अपने ऐतिहासिक क़िलों के लिए प्रसिद्ध है।", "This place is famous for its historical forts."),
        ("यह शहर कपड़ा उद्योग का केंद्र है।", "This city is the center of the textile industry."),
    ],
    "node-31": [
        ("खाना खाते समय अचानक बिजली चली गई।", "While eating, the electricity suddenly went off."),
        ("पढ़ते समय अचानक दरवाज़े की घंटी बजी।", "While studying, the doorbell suddenly rang."),
        ("सोते समय अचानक तेज़ आवाज़ आई।", "While sleeping, a loud noise suddenly came."),
        ("काम करते समय अचानक बारिश शुरू हो गई।", "While working, it suddenly started raining."),
        ("चलते समय अचानक पैर फिसल गया।", "While walking, the foot suddenly slipped."),
    ],
    "node-32": [
        ("इस शहर की बुनकरी कला पूरे देश में मशहूर है।", "This city's weaving art is famous across the country."),
        ("यहाँ की मिट्टी के बर्तन बहुत सुंदर होते हैं।", "The earthen pots from here are very beautiful."),
        ("इस क्षेत्र की लोक कलाएँ अद्भुत हैं।", "The folk arts of this region are wonderful."),
        ("यहाँ का हस्तशिल्प दूर-दूर तक प्रसिद्ध है।", "The handicraft from here is famous far and wide."),
        ("इस गाँव की चित्रकला शैली अनोखी है।", "The painting style of this village is unique."),
        ("यहाँ की काठ की नक्काशी बेजोड़ है।", "The wood carving from here is unmatched."),
        ("इस शहर का साहित्यिक इतिहास समृद्ध है।", "The literary history of this city is rich."),
        ("यहाँ की संगीत परंपरा सदियों पुरानी है।", "The music tradition here is centuries old."),
        ("इस क्षेत्र की कढ़ाई कला विश्व प्रसिद्ध है।", "The embroidery art of this region is world-famous."),
        ("यहाँ के लोक नृत्य बहुत लोकप्रिय हैं।", "The folk dances from here are very popular."),
    ],
    "node-34": [
        ("दिवाली पर घरों को दीयों से सजाया जाता है।", "On Diwali, houses are decorated with lamps."),
        ("होली पर लोग एक-दूसरे को रंग लगाते हैं।", "On Holi, people apply colors to each other."),
        ("मकर संक्रांति पर पतंग उड़ाने की परंपरा है।", "There is a tradition of flying kites on Makar Sankranti."),
        ("लोहड़ी पर आग जलाकर रेवड़ी बाँटी जाती है।", "On Lohri, fire is lit and rewri is distributed."),
        ("बैसाखी पर किसान नई फ़सल की ख़ुशी मनाते हैं।", "On Baisakhi, farmers celebrate the new harvest."),
        ("ओणम पर केरल में फूलों की रंगोली बनाई जाती है।", "On Onam, flower rangoli is made in Kerala."),
        ("पोंगल पर तमिलनाडु में चावल का व्यंजन बनाया जाता है।", "On Pongal, a rice dish is made in Tamil Nadu."),
        ("बिहू पर असम में लोक नृत्य किया जाता है।", "On Bihu, folk dance is performed in Assam."),
        ("गणतंत्र दिवस पर दिल्ली में परेड होती है।", "On Republic Day, a parade takes place in Delhi."),
        ("स्वतंत्रता दिवस पर लाल क़िले पर ध्वजारोहण होता है।", "On Independence Day, flag hoisting takes place at the Red Fort."),
        ("ईद पर मिलकर सेवइयाँ खाई जाती हैं।", "On Eid, vermicelli is eaten together."),
        ("क्रिसमस पर बच्चे सांता का इंतज़ार करते हैं।", "On Christmas, children wait for Santa."),
        ("गुड़ी पड़वा पर महाराष्ट्र में नए साल की शुरुआत होती है।", "On Gudi Padwa, the new year begins in Maharashtra."),
        ("छठ पर बिहार में नदी के किनारे मेला लगता है।", "On Chhath, a fair is held by the riverside in Bihar."),
        ("भारत में हर मौसम का अपना त्योहार होता है।", "In India, every season has its own festival."),
        ("त्योहारों पर बाज़ारों में रौनक़ बढ़ जाती है।", "On festivals, the markets become lively."),
    ],
    "node-35": [
        ("दरअसल, यह काम इतना आसान नहीं है।", "Actually, this work is not so easy."),
        ("इस विषय से जुड़ी जानकारी यहाँ मिल जाएगी।", "Information related to this topic can be found here."),
        ("उसने औपचारिक रूप से अपना इस्तीफ़ा दे दिया है।", "She has formally given her resignation."),
        ("यह मामला दोनों पक्षों से संबंधित है।", "This matter is related to both parties."),
        ("अगर कोई ज़रूरत हो तो संपर्क कर लेना।", "If there is any need, then get in touch."),
        ("इस बारे में विस्तार से बात करनी होगी।", "This matter will need to be discussed in detail."),
        ("हक़ीक़त में यह बात बिलकुल सही है।", "In reality, this thing is absolutely correct."),
        ("यह मुद्दा सबसे पहले हल करना होगा।", "This issue will need to be resolved first."),
        ("इस काम के लिए अनुभव ज़रूरी है।", "Experience is necessary for this work."),
        ("सच कहूँ तो मुझे इस बात की उम्मीद नहीं थी।", "Honestly, I didn't expect this."),
        ("वास्तव में, यह योजना बहुत कारगर है।", "In fact, this plan is very effective."),
        ("इस परियोजना से जुड़े सभी लोगों को सूचित करो।", "Inform all the people related to this project."),
        ("उन्होंने विधिवत रूप से अपना पद छोड़ दिया।", "She formally left her position."),
        ("यह प्रश्न दोनों विषयों से संबंधित है।", "This question is related to both subjects."),
        ("ज़रूरत पड़ने पर मुझसे बात कर लेना।", "Talk to me when the need arises."),
        ("असल में बात कुछ और ही थी।", "Actually, the matter was something else entirely."),
        ("इस समस्या का हल निकालना ज़रूरी है।", "Finding a solution to this problem is necessary."),
        ("यह नियम सब पर लागू होता है।", "This rule applies to everyone."),
        ("कहने को तो बात छोटी है, पर असर बड़ा है।", "The matter seems small to say, but the impact is big."),
        ("इस विवाद में दोनों पक्षों की बात सुनी जाएगी।", "In this dispute, both sides will be heard."),
        ("दरअसल, इस मामले में और जाँच की ज़रूरत है।", "Actually, more investigation is needed in this matter."),
        ("यह फ़ैसला सबकी सहमति से लिया गया।", "This decision was taken with everyone's agreement."),
        ("इस योजना से जुड़ी हर बात लिखी हुई है।", "Everything related to this plan is written down."),
        ("सरकार ने आधिकारिक तौर पर घोषणा की।", "The government officially made the announcement."),
        ("यह पहलू दोनों मुद्दों से जुड़ा हुआ है।", "This aspect is connected to both issues."),
        ("कोई भी परेशानी हो तो तुरंत बताना।", "If there is any problem, let us know immediately."),
        ("अगर सहायता चाहिए तो बेझिझक कहिए।", "If you need help, don't hesitate to ask."),
        ("वास्तव में यह बदलाव बहुत ज़रूरी था।", "In reality, this change was very necessary."),
        ("इस निर्णय से सम्बंधित दस्तावेज़ तैयार हैं।", "Documents related to this decision are ready."),
        ("औपचारिक रूप से यह प्रस्ताव स्वीकार किया गया।", "This proposal was formally accepted."),
        ("दोनों टीमों ने मिलकर काम किया।", "Both teams worked together."),
        ("ज़रूरत पड़ी तो हम फिर से मिलेंगे।", "If the need arises, we will meet again."),
        ("सच पूछो तो यह काम मुश्किल है।", "To be honest, this work is difficult."),
        ("यह बात दोनों भाइयों से जुड़ी है।", "This matter is related to both brothers."),
    ],
}

# Track which cards need template replacement
template_fix_ids = set()
template_fix_map = {}
replacement_counters = defaultdict(int)

for norm, cards in templates.items():
    if len(cards) < 2 or len(norm) < 20:
        continue
    # Keep the first card, replace the rest
    for card in cards[1:]:
        cid = card["id"]
        # Skip if already handled by religious replacement
        if cid in religious_replacements:
            continue
        node = card["grammarNode"]
        template_fix_ids.add(cid)
        template_fix_map[cid] = node

# ============================================================
# CATEGORY 3: Code-switching fixes
# Replace English words in Hindi target with proper Hindi
# ============================================================

code_switch_fixes = {}
for card in deck:
    target = card.get("target", "")
    english_words = re.findall(r'[a-zA-Z]{3,}', target)
    if english_words:
        cid = card["id"]
        # Skip if already in religious or template fix
        if cid in religious_replacements or cid in template_fix_ids:
            continue
        code_switch_fixes[cid] = card

# All code-switching cards are in node-35 and are template duplicates
# They use: actually, contact, matter, related, formally, resignation
# We'll replace the Hindi target with proper Hindi equivalents

code_switch_replacements = {}
for cid, card in code_switch_fixes.items():
    target = card["target"]
    english = card["english"]

    # Fix the Hindi text by replacing English words with Hindi equivalents
    fixed_target = target
    fixed_target = fixed_target.replace("actually", "वाक़ई")
    fixed_target = fixed_target.replace("contact", "संपर्क")
    fixed_target = fixed_target.replace("matter", "मामला")
    fixed_target = fixed_target.replace("related", "संबंधित")
    fixed_target = fixed_target.replace("formally", "औपचारिक रूप से")
    fixed_target = fixed_target.replace("resignation", "इस्तीफ़ा")

    code_switch_replacements[cid] = {
        "target": fixed_target,
        "english": english,  # Keep English the same
    }

# ============================================================
# CATEGORY 4: Gender pronoun fixes
# ============================================================

gender_fixes = {
    "hi-2230": {"english": "Anjali bought flowers for her mother."},
    "hi-2384": {"english": "Shobha's effort was successful, that is her hard work paid off."},
    "hi-2499": {"english": "Jyoti acted on her decision."},
    "hi-2687": {"english": "Jyoti realized her mistake and her eyes were opened."},
    "hi-2704": {"english": "Jyoti is the apple of her parents' eyes."},
    "hi-2728": {"english": "Divya bowed her head before her teacher."},
    "hi-2756": {"english": "Neha established her superiority in this work."},
    "hi-2772": {"english": "Jyoti established her superiority in this work."},
    "hi-3099": {"english": "Anjali emphasized national unity in her speech."},
    "hi-3129": {"english": "Neha presented a new hypothesis in her research."},
    "hi-3282": {"english": "Shobha has formally given her resignation."},
    "hi-3283": {"english": "Jyoti has formally given her resignation."},
    "hi-3324": {"english": "Divya has formally given her resignation."},
    # Also fix the target for the resignation ones (Hindi gendered too)
}

# ============================================================
# Apply all fixes
# ============================================================

stats = {
    "religious_replaced": 0,
    "template_replaced": 0,
    "code_switch_fixed": 0,
    "gender_fixed": 0,
}

for card in deck:
    cid = card["id"]

    # 1. Religious replacements (highest priority)
    if cid in religious_replacements:
        repl = religious_replacements[cid]
        card["target"] = repl["target"]
        card["english"] = repl["english"]
        stats["religious_replaced"] += 1
        continue

    # 2. Code-switching fixes (before template, as some overlap)
    if cid in code_switch_replacements:
        repl = code_switch_replacements[cid]
        card["target"] = repl["target"]
        card["english"] = repl["english"]
        stats["code_switch_fixed"] += 1
        # Still might need template replacement below

    # 3. Template duplicate replacements
    if cid in template_fix_ids:
        node = template_fix_map[cid]
        if node in template_replacements:
            idx = replacement_counters[node]
            repls = template_replacements[node]
            if idx < len(repls):
                hi_text, en_text = repls[idx]
                card["target"] = hi_text
                card["english"] = en_text
                replacement_counters[node] += 1
                stats["template_replaced"] += 1
            else:
                # Not enough replacements for this node, skip
                pass
        # else: no replacements available for this node

    # 4. Gender pronoun fixes
    if cid in gender_fixes:
        fix = gender_fixes[cid]
        if "english" in fix:
            card["english"] = fix["english"]
        if "target" in fix:
            card["target"] = fix["target"]
        stats["gender_fixed"] += 1

# Write fixed deck
with open(DECK_PATH, "w") as f:
    json.dump(deck, f, ensure_ascii=False, indent=2)
    f.write("\n")

print("=== FIX SUMMARY ===")
print(f"Religious/mantra cards replaced: {stats['religious_replaced']}")
print(f"Template duplicates replaced:    {stats['template_replaced']}")
print(f"Code-switching cards fixed:      {stats['code_switch_fixed']}")
print(f"Gender pronoun cards fixed:      {stats['gender_fixed']}")
print(f"TOTAL cards modified:            {sum(stats.values())}")
print()

# Show remaining template duplicate count
templates2 = defaultdict(list)
for card in deck:
    norm = normalize_for_template(card["english"])
    templates2[norm].append(card)
remaining_dups = sum(len(v) - 1 for v in templates2.values() if len(v) >= 2 and len(list(templates2.keys())[0]) >= 20)

# More accurate count
remaining = 0
for norm, cards in templates2.items():
    if len(cards) >= 3 and len(norm) >= 20:
        remaining += len(cards) - 1
        print(f"  Still duplicated ({len(cards)}x): {norm[:70]}")

print(f"\nRemaining template groups with 3+ cards: see above")

# Verify no code-switching remains
code_remain = 0
for card in deck:
    eng_words = re.findall(r'[a-zA-Z]{3,}', card.get("target", ""))
    if eng_words:
        code_remain += 1
print(f"Remaining code-switching cards: {code_remain}")
