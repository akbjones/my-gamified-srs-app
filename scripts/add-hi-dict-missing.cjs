#!/usr/bin/env node
// Add 197 missing Hindi dictionary entries to src/data/dictionary/hi.ts
// Inserts them alphabetically merged into the existing dictionary object.

const fs = require('fs');
const path = require('path');

const HI_DICT_PATH = path.join(__dirname, '..', 'src', 'data', 'dictionary', 'hi.ts');

// New entries — Devanagari key → entry object literal (without surrounding braces).
// Each value is the inner contents (without trailing comma); we format the final line below.
const newEntries = {
  'H₂O':           { en: 'H2O / water', ipa: 'eːtʃ tuː oʊ', pos: 'n' },
  'acting':        { en: 'acting (English borrowing)', ipa: 'æktɪŋ', pos: 'n' },
  'classical':     { en: 'classical (English borrowing)', ipa: 'klæsɪkəl', pos: 'adj' },
  'अक्ल':          { en: 'wisdom; intelligence; sense', ipa: 'əkl', pos: 'n' },
  'अनुमान':        { en: 'estimate; guess; assumption', ipa: 'ənʊmaːn', pos: 'n' },
  'अफ़सर':         { en: 'officer', ipa: 'əfsər', pos: 'n' },
  'अमीर':          { en: 'rich; wealthy', ipa: 'əmiːr', pos: 'adj' },
  'आइडिया':        { en: 'idea', ipa: 'aːɪɖɪjaː', pos: 'n' },
  'आईना':          { en: 'mirror', ipa: 'aːiːnaː', pos: 'n' },
  'आदेश':          { en: 'order; command; directive', ipa: 'aːdeːʃ', pos: 'n' },
  'आर्टिकल':       { en: 'article', ipa: 'aːrʈɪkəl', pos: 'n' },
  'इंटरव्यू':      { en: 'interview', ipa: 'ɪnʈərʋjuː', pos: 'n' },
  'इंडस्ट्री':     { en: 'industry', ipa: 'ɪnɖəsʈriː', pos: 'n' },
  'इलाके':         { en: 'areas; regions; localities', ipa: 'ɪlaːkeː', pos: 'n' },
  'उगाते':         { en: 'they grow / are growing', ipa: 'ʊɡaːteː', pos: 'v', lemma: 'उगाना' },
  'उठाएगी':        { en: 'she will lift / raise', ipa: 'ʊʈʰaːeːɡiː', pos: 'v', lemma: 'उठाना' },
  'एड':            { en: 'ad; advertisement', ipa: 'eːɖ', pos: 'n' },
  'एडिटर':         { en: 'editor', ipa: 'eːɖɪʈər', pos: 'n' },
  'एनवायरनमेंट':   { en: 'environment', ipa: 'eːnʋaːjərənmeːnʈ', pos: 'n' },
  'एस्ट्रॉनमर':    { en: 'astronomer', ipa: 'eːsʈrɒnəmər', pos: 'n' },
  'ऑफिस':          { en: 'office', ipa: 'ɒfɪs', pos: 'n' },
  'ऑब्ज़र्वेशन':   { en: 'observation', ipa: 'ɒbzərʋeːʃən', pos: 'n' },
  'कंक्रीट':       { en: 'concrete', ipa: 'kənkriːʈ', pos: 'n' },
  'कदम':           { en: 'step; footstep; pace', ipa: 'kədəm', pos: 'n' },
  'कमांडर':        { en: 'commander', ipa: 'kəmaːnɖər', pos: 'n' },
  'करीब':          { en: 'near; close to; approximately', ipa: 'kəriːb', pos: 'adv' },
  'क़ीमत':         { en: 'price; cost; value', ipa: 'qiːmət', pos: 'n' },
  'काफ़िला':       { en: 'caravan; convoy', ipa: 'kaːfɪlaː', pos: 'n' },
  'कामयाब':        { en: 'successful', ipa: 'kaːmjaːb', pos: 'adj' },
  'कारोबार':       { en: 'business; trade', ipa: 'kaːroːbaːr', pos: 'n' },
  'कास्टिंग':      { en: 'casting (film)', ipa: 'kaːsʈɪŋ', pos: 'n' },
  'किताबों':       { en: 'books (oblique pl)', ipa: 'kɪtaːboːn', pos: 'n' },
  'किसका':         { en: 'whose', ipa: 'kɪskaː', pos: 'pron' },
  'कॉन्फ़्रेंस':   { en: 'conference', ipa: 'kɒnfreːns', pos: 'n' },
  'कोर्स':         { en: 'course', ipa: 'koːrs', pos: 'n' },
  'क्रम':          { en: 'order; sequence; series', ipa: 'krəm', pos: 'n' },
  'क्लास':         { en: 'class', ipa: 'klaːs', pos: 'n' },
  'क्वालिटेटिव':   { en: 'qualitative', ipa: 'kʋaːlɪʈeːʈɪʋ', pos: 'adj' },
  'ख़ास':          { en: 'special; particular', ipa: 'kʰaːs', pos: 'adj' },
  'खासियत':        { en: 'specialty; characteristic; feature', ipa: 'kʰaːsɪjət', pos: 'n' },
  'खिल':           { en: 'bloom; blossom (stem)', ipa: 'kʰɪl', pos: 'v', lemma: 'खिलना' },
  'खून':           { en: 'blood', ipa: 'kʰuːn', pos: 'n' },
  'खूबसूरती':      { en: 'beauty', ipa: 'kʰuːbsuːrtiː', pos: 'n' },
  'गाड़ियों':      { en: 'vehicles; cars (oblique pl)', ipa: 'ɡaːɽɪjoːn', pos: 'n' },
  'गुज़रकर':       { en: 'passing through; having passed', ipa: 'ɡʊzərkər', pos: 'v', lemma: 'गुज़रना' },
  'गैरकानूनी':     { en: 'illegal; unlawful', ipa: 'ɡæːrkaːnuːniː', pos: 'adj' },
  'ग्रीनहाउस':     { en: 'greenhouse', ipa: 'ɡriːnhaːʊs', pos: 'n' },
  'घने':           { en: 'dense; thick', ipa: 'ɡʰəneː', pos: 'adj' },
  'घूस':           { en: 'bribe', ipa: 'ɡʰuːs', pos: 'n' },
  'चमकाते':        { en: 'they shine / polish', ipa: 'tʃəmkaːteː', pos: 'v', lemma: 'चमकाना' },
  'चलन':           { en: 'trend; custom; circulation', ipa: 'tʃələn', pos: 'n' },
  'चवालीस':        { en: 'forty four', ipa: 'tʃəʋaːliːs', pos: 'num' },
  'चीज़ों':        { en: 'things (oblique pl)', ipa: 'tʃiːzoːn', pos: 'n' },
  'छपवाई':         { en: 'got printed (caused to be printed)', ipa: 'tʃʰəpʋaːiː', pos: 'v', lemma: 'छपवाना' },
  'छान':           { en: 'sift; strain (stem)', ipa: 'tʃʰaːn', pos: 'v', lemma: 'छानना' },
  'जज':            { en: 'judge', ipa: 'dʒədʒ', pos: 'n' },
  'जला':           { en: 'burned; lit (m.sg)', ipa: 'dʒəlaː', pos: 'v', lemma: 'जलना' },
  'जश्न':          { en: 'celebration; festivity', ipa: 'dʒəʃn', pos: 'n' },
  'जाऊँ':          { en: 'I should go / let me go', ipa: 'dʒaːũː', pos: 'v', lemma: 'जाना' },
  'जिलाधिकारी':    { en: 'district magistrate; district officer', ipa: 'dʒɪlaːdʰɪkaːriː', pos: 'n' },
  'टाइल':          { en: 'tile', ipa: 'ʈaːɪl', pos: 'n' },
  'टीचर':          { en: 'teacher', ipa: 'ʈiːtʃər', pos: 'n' },
  'टूरिस्ट':       { en: 'tourist', ipa: 'ʈuːrɪsʈ', pos: 'n' },
  'टेलीफोन':       { en: 'telephone', ipa: 'ʈeːliːfoːn', pos: 'n' },
  'टैक्स':         { en: 'tax', ipa: 'ʈæks', pos: 'n' },
  'टॉप':           { en: 'top', ipa: 'ʈɒp', pos: 'n' },
  'टॉयलेट':        { en: 'toilet', ipa: 'ʈɒjleːʈ', pos: 'n' },
  'ट्रैफिक':       { en: 'traffic', ipa: 'ʈræfɪk', pos: 'n' },
  'डस्टबिन':       { en: 'dustbin; trash can', ipa: 'ɖəsʈbɪn', pos: 'n' },
  'डिक्शनरी':      { en: 'dictionary', ipa: 'ɖɪkʃənəriː', pos: 'n' },
  'डिपार्टमेंट':   { en: 'department', ipa: 'ɖɪpaːrʈmeːnʈ', pos: 'n' },
  'डेंटिस्ट':      { en: 'dentist', ipa: 'ɖeːnʈɪsʈ', pos: 'n' },
  'डेटा':          { en: 'data', ipa: 'ɖeːʈaː', pos: 'n' },
  'डेडलाइन':       { en: 'deadline', ipa: 'ɖeːɖlaːɪn', pos: 'n' },
  'ढूँढा':         { en: 'searched; looked for (m.sg)', ipa: 'ɖʰũːɖʰaː', pos: 'v', lemma: 'ढूँढना' },
  'तरीके':         { en: 'ways; methods', ipa: 'təriːkeː', pos: 'n' },
  'ताँगे':         { en: 'horse carts (tongas)', ipa: 'tãːɡeː', pos: 'n' },
  'तीसरी':         { en: 'third (f)', ipa: 'tiːsriː', pos: 'adj' },
  'तुकबंदी':       { en: 'rhyming; doggerel', ipa: 'tʊkbəndiː', pos: 'n' },
  'थकावट':         { en: 'tiredness; exhaustion; fatigue', ipa: 'tʰəkaːʋəʈ', pos: 'n' },
  'दस्तावेज़ों':   { en: 'documents (oblique pl)', ipa: 'dəstaːʋeːzoːn', pos: 'n' },
  'दांत':          { en: 'tooth; teeth', ipa: 'daːnt', pos: 'n' },
  'दिक़्क़त':      { en: 'difficulty; trouble; problem', ipa: 'dɪqqət', pos: 'n' },
  'दिक़्क़तें':    { en: 'difficulties; troubles', ipa: 'dɪqqəteːn', pos: 'n' },
  'धारणा':         { en: 'concept; notion; assumption', ipa: 'dʰaːrəɳaː', pos: 'n' },
  'न':             { en: 'not; nor; no', ipa: 'nə', pos: 'conj' },
  'नतीजा':         { en: 'result; outcome; consequence', ipa: 'nətiːdʒaː', pos: 'n' },
  'नहाती':         { en: 'bathes / is bathing (f)', ipa: 'nəhaːtiː', pos: 'v', lemma: 'नहाना' },
  'नाशुक्र':       { en: 'ungrateful', ipa: 'naːʃʊkr', pos: 'adj' },
  'निकाल':         { en: 'take out; remove (stem)', ipa: 'nɪkaːl', pos: 'v', lemma: 'निकालना' },
  'नेशनल':         { en: 'national', ipa: 'neːʃənəl', pos: 'adj' },
  'परंपरागत':      { en: 'traditional', ipa: 'pərəmpəraːɡət', pos: 'adj' },
  'परखने':         { en: 'to test; to examine (oblique inf)', ipa: 'pərəkʰneː', pos: 'v', lemma: 'परखना' },
  'परछाई':         { en: 'shadow; reflection', ipa: 'pərtʃʰaːiː', pos: 'n' },
  'परिंदा':        { en: 'bird', ipa: 'pərɪndaː', pos: 'n' },
  'परिंदे':        { en: 'birds', ipa: 'pərɪndeː', pos: 'n' },
  'पहचानी':        { en: 'recognized (f)', ipa: 'pəhtʃaːniː', pos: 'v', lemma: 'पहचानना' },
  'पाने':          { en: 'to get; to obtain (oblique inf)', ipa: 'paːneː', pos: 'v', lemma: 'पाना' },
  'पीसते':         { en: 'they grind / are grinding', ipa: 'piːsteː', pos: 'v', lemma: 'पीसना' },
  'पुतली':         { en: 'puppet; doll; pupil (of eye)', ipa: 'pʊtliː', pos: 'n' },
  'पुरातत्ववेत्ताओं': { en: 'archaeologists (oblique pl)', ipa: 'pʊraːtətʋəʋeːttaːoːn', pos: 'n' },
  'पेंटर':         { en: 'painter', ipa: 'peːnʈər', pos: 'n' },
  'प्रिंसिपल':     { en: 'principal', ipa: 'prɪnsɪpəl', pos: 'n' },
  'प्रेशर':        { en: 'pressure', ipa: 'preːʃər', pos: 'n' },
  'प्रोग्राम':     { en: 'program', ipa: 'proːɡraːm', pos: 'n' },
  'प्रोजेक्ट':     { en: 'project', ipa: 'proːdʒeːkʈ', pos: 'n' },
  'प्लेटफॉर्म':    { en: 'platform', ipa: 'pleːʈfɒrm', pos: 'n' },
  'फर्ज़':         { en: 'duty; obligation', ipa: 'fərz', pos: 'n' },
  'फ़र्स्ट':       { en: 'first', ipa: 'fərsʈ', pos: 'adj' },
  'फ़ोटोग्राफ़र':  { en: 'photographer', ipa: 'foːʈoːɡraːfər', pos: 'n' },
  'फिल्म':         { en: 'film; movie', ipa: 'fɪlm', pos: 'n' },
  'फैकल्टी':       { en: 'faculty', ipa: 'fækəlʈiː', pos: 'n' },
  'फैमिली':        { en: 'family', ipa: 'fæmɪliː', pos: 'n' },
  'फॉसिल':         { en: 'fossil', ipa: 'fɒsɪl', pos: 'n' },
  'बँटी':          { en: 'was divided / distributed (f)', ipa: 'bə̃ʈiː', pos: 'v', lemma: 'बँटना' },
  'बंगले':         { en: 'bungalows', ipa: 'bəŋɡleː', pos: 'n' },
  'बचाना':         { en: 'to save; to protect; to rescue', ipa: 'bətʃaːnaː', pos: 'v', lemma: 'बचाना' },
  'बचाने':         { en: 'to save (oblique inf)', ipa: 'bətʃaːneː', pos: 'v', lemma: 'बचाना' },
  'बजाना':         { en: 'to play (an instrument); to sound', ipa: 'bədʒaːnaː', pos: 'v', lemma: 'बजाना' },
  'बताऊँ':         { en: 'I should tell / let me tell', ipa: 'bətaːũː', pos: 'v', lemma: 'बताना' },
  'बत्तियाँ':      { en: 'lights; lamps', ipa: 'bəttɪjãː', pos: 'n' },
  'बनवाया':        { en: 'had built; got made (m.sg)', ipa: 'bənʋaːjaː', pos: 'v', lemma: 'बनवाना' },
  'बनाएगी':        { en: 'she will make / build', ipa: 'bənaːeːɡiː', pos: 'v', lemma: 'बनाना' },
  'बहना':          { en: 'to flow; sister', ipa: 'bəhnaː', pos: 'v', lemma: 'बहना' },
  'बहादुर':        { en: 'brave; courageous', ipa: 'bəhaːdʊr', pos: 'adj' },
  'बाँध':          { en: 'dam; tie (stem)', ipa: 'bãːdʰ', pos: 'n' },
  'बार्टर':        { en: 'barter', ipa: 'baːrʈər', pos: 'n' },
  'बालियाँ':       { en: 'earrings', ipa: 'baːlɪjãː', pos: 'n' },
  'बिक्री':        { en: 'sale; selling', ipa: 'bɪkriː', pos: 'n' },
  'बिताई':         { en: 'spent (time) (f)', ipa: 'bɪtaːiː', pos: 'v', lemma: 'बिताना' },
  'बिबलियोग्राफी': { en: 'bibliography', ipa: 'bɪblɪjoːɡraːfiː', pos: 'n' },
  'बीमारी':        { en: 'illness; disease; sickness', ipa: 'biːmaːriː', pos: 'n' },
  'बीवी':          { en: 'wife', ipa: 'biːʋiː', pos: 'n' },
  'बुनियादी':      { en: 'basic; fundamental', ipa: 'bʊnɪjaːdiː', pos: 'adj' },
  'बेइज़्ज़ती':    { en: 'insult; humiliation; disrespect', ipa: 'beːɪzzətiː', pos: 'n' },
  'बेशकीमती':      { en: 'priceless; invaluable', ipa: 'beːʃkiːmtiː', pos: 'adj' },
  'बैकग्राउंड':    { en: 'background', ipa: 'bækɡraːʊnɖ', pos: 'n' },
  'बॉक्स':         { en: 'box', ipa: 'bɒks', pos: 'n' },
  'बॉस':           { en: 'boss', ipa: 'bɒs', pos: 'n' },
  'बोया':          { en: 'sowed; planted (m.sg)', ipa: 'boːjaː', pos: 'v', lemma: 'बोना' },
  'ब्लड':          { en: 'blood', ipa: 'bləɖ', pos: 'n' },
  'भरोसेमंद':      { en: 'trustworthy; reliable', ipa: 'bʰəroːseːmənd', pos: 'adj' },
  'महंगाई':        { en: 'inflation; high prices', ipa: 'məhəŋɡaːiː', pos: 'n' },
  'मानते':         { en: 'they accept / believe / agree', ipa: 'maːnteː', pos: 'v', lemma: 'मानना' },
  'मापते':         { en: 'they measure', ipa: 'maːpteː', pos: 'v', lemma: 'मापना' },
  'माफ़':          { en: 'forgiven; pardoned', ipa: 'maːf', pos: 'adj' },
  'मालिक':         { en: 'owner; master; boss', ipa: 'maːlɪk', pos: 'n' },
  'मिज़ाज़':       { en: 'mood; temperament; nature', ipa: 'mɪzaːz', pos: 'n' },
  'मूवी':          { en: 'movie', ipa: 'muːʋiː', pos: 'n' },
  'मैनेजर':        { en: 'manager', ipa: 'mæneːdʒər', pos: 'n' },
  'यूनिवर्सिटी':   { en: 'university', ipa: 'juːnɪʋərsɪʈiː', pos: 'n' },
  'योजनाओं':       { en: 'plans; schemes (oblique pl)', ipa: 'joːdʒənaːoːn', pos: 'n' },
  'रबाब':          { en: 'rabab (string instrument)', ipa: 'rəbaːb', pos: 'n' },
  'रवैये':         { en: 'attitudes; approaches', ipa: 'rəʋæjeː', pos: 'n' },
  'राज़':          { en: 'secret', ipa: 'raːz', pos: 'n' },
  'राज्य':         { en: 'state; kingdom; province', ipa: 'raːdʒj', pos: 'n' },
  'रिसर्च':        { en: 'research', ipa: 'rɪsərtʃ', pos: 'n' },
  'रिसर्चर':       { en: 'researcher', ipa: 'rɪsərtʃər', pos: 'n' },
  'लंदन':          { en: 'London', ipa: 'ləndən', pos: 'n' },
  'लक्ष्य':        { en: 'goal; target; aim', ipa: 'ləkʂj', pos: 'n' },
  'लगने':          { en: 'to feel; to seem (oblique inf)', ipa: 'ləɡneː', pos: 'v', lemma: 'लगना' },
  'लजीज':          { en: 'delicious; tasty', ipa: 'ləzɪːz', pos: 'adj' },
  'लाइब्रेरी':     { en: 'library', ipa: 'laːɪbreːriː', pos: 'n' },
  'लीजिए':         { en: 'please take (polite imperative)', ipa: 'liːdʒɪeː', pos: 'v', lemma: 'लेना' },
  'लेटर':          { en: 'letter', ipa: 'leːʈər', pos: 'n' },
  'लैब':           { en: 'lab; laboratory', ipa: 'læb', pos: 'n' },
  'वीकेंड':        { en: 'weekend', ipa: 'ʋiːkeːnɖ', pos: 'n' },
  'वेबसाइट':       { en: 'website', ipa: 'ʋeːbsaːɪʈ', pos: 'n' },
  'वोट':           { en: 'vote', ipa: 'ʋoːʈ', pos: 'n' },
  'शिल्प':         { en: 'craft; art; handicraft', ipa: 'ʃɪlp', pos: 'n' },
  'शेफ़':          { en: 'chef', ipa: 'ʃeːf', pos: 'n' },
  'शौहर':          { en: 'husband', ipa: 'ʃəuhər', pos: 'n' },
  'सच्चाई':        { en: 'truth; honesty', ipa: 'səttʃaːiː', pos: 'n' },
  'सबूत':          { en: 'evidence; proof', ipa: 'səbuːt', pos: 'n' },
  'सर्टिफिकेट':    { en: 'certificate', ipa: 'sərʈɪfɪkeːʈ', pos: 'n' },
  'साज़':          { en: 'instrument (musical); equipment', ipa: 'saːz', pos: 'n' },
  'साथी':          { en: 'companion; partner; friend', ipa: 'saːtʰiː', pos: 'n' },
  'सालों':         { en: 'years (oblique pl)', ipa: 'saːloːn', pos: 'n' },
  'सिंगर':         { en: 'singer', ipa: 'sɪŋɡər', pos: 'n' },
  'सिक्का':        { en: 'coin', ipa: 'sɪkkaː', pos: 'n' },
  'सिलेबस':        { en: 'syllabus', ipa: 'sɪleːbəs', pos: 'n' },
  'सेहतमंद':       { en: 'healthy', ipa: 'seːhətmənd', pos: 'adj' },
  'सोचने':         { en: 'to think (oblique inf)', ipa: 'soːtʃneː', pos: 'v', lemma: 'सोचना' },
  'स्कीम':         { en: 'scheme; plan', ipa: 'skiːm', pos: 'n' },
  'स्टडी':         { en: 'study', ipa: 'sʈəɖiː', pos: 'n' },
  'स्टाइल':        { en: 'style', ipa: 'sʈaːɪl', pos: 'n' },
  'स्टूडेंट':      { en: 'student', ipa: 'sʈuːɖeːnʈ', pos: 'n' },
  'स्टूडेंट्स':    { en: 'students', ipa: 'sʈuːɖeːnʈs', pos: 'n' },
  'स्टेज':         { en: 'stage', ipa: 'sʈeːdʒ', pos: 'n' },
  'स्पीकर':        { en: 'speaker', ipa: 'spiːkər', pos: 'n' },
  'हाथों':         { en: 'hands (oblique pl)', ipa: 'haːtʰoːn', pos: 'n' },
  'हालात':         { en: 'circumstances; conditions; situation', ipa: 'haːlaːt', pos: 'n' },
  'हासिल':         { en: 'achieved; obtained; acquired', ipa: 'haːsɪl', pos: 'adj' },
  'हियरिंग':       { en: 'hearing', ipa: 'hɪjərɪŋ', pos: 'n' },
  'हिस्सों':       { en: 'parts; portions (oblique pl)', ipa: 'hɪssoːn', pos: 'n' },
  'हुनर':          { en: 'skill; talent; craft', ipa: 'hʊnər', pos: 'n' },
  'हेडलाइन':       { en: 'headline', ipa: 'heːɖlaːɪn', pos: 'n' },
};

const tokenCount = Object.keys(newEntries).length;
if (tokenCount !== 197) {
  console.error(`Expected 197 entries, got ${tokenCount}`);
  process.exit(1);
}

// Format one entry line in the same style as existing entries.
// Use single quotes around the key (no key contains an apostrophe — verified by inspection).
function formatEntry(key, val) {
  const parts = [`en: '${val.en.replace(/'/g, "\\'")}'`, `ipa: '${val.ipa}'`, `pos: '${val.pos}'`];
  if (val.lemma) parts.push(`lemma: '${val.lemma}'`);
  // Sanity: keys shouldn't contain a single quote in this batch
  if (key.includes("'")) {
    return `  "${key}": { ${parts.join(', ')} },`;
  }
  return `  '${key}': { ${parts.join(', ')} },`;
}

// Read the file
const src = fs.readFileSync(HI_DICT_PATH, 'utf8');

// Locate the dictionary object: `const dictionary: Record<string, DictEntry> = ... { ... };`
// We'll match the opening brace of the literal and find its matching close.
const declRegex = /const\s+dictionary\s*:\s*Record<string,\s*DictEntry>\s*=\s*/;
const declMatch = declRegex.exec(src);
if (!declMatch) {
  console.error('Could not find `const dictionary: Record<string, DictEntry> =` declaration.');
  process.exit(1);
}

// Find the opening `{` after the declaration.
const openIdx = src.indexOf('{', declMatch.index + declMatch[0].length);
if (openIdx < 0) {
  console.error('Could not find opening `{` of dictionary literal.');
  process.exit(1);
}

// Walk to the matching closing brace, accounting for nested braces and string literals.
function findMatchingBrace(text, startIdx) {
  let depth = 0;
  let i = startIdx;
  const len = text.length;
  while (i < len) {
    const ch = text[i];
    if (ch === '/' && text[i + 1] === '/') {
      // line comment
      const nl = text.indexOf('\n', i);
      i = nl < 0 ? len : nl + 1;
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      const end = text.indexOf('*/', i + 2);
      i = end < 0 ? len : end + 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      // skip string literal
      const quote = ch;
      i++;
      while (i < len) {
        if (text[i] === '\\') { i += 2; continue; }
        if (text[i] === quote) { i++; break; }
        i++;
      }
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return i;
    }
    i++;
  }
  return -1;
}

const closeIdx = findMatchingBrace(src, openIdx);
if (closeIdx < 0) {
  console.error('Could not find closing `}` of dictionary literal.');
  process.exit(1);
}

// Extract the body between { and }
const head = src.slice(0, openIdx + 1);
const body = src.slice(openIdx + 1, closeIdx);
const tail = src.slice(closeIdx); // starts with `}`

// Parse existing entries from the body, line-by-line.
// Pattern: optional whitespace, key (in quotes), colon, object literal, comma, possible trailing comment.
// Keys can be single- or double-quoted.
const entryLineRegex = /^(\s*)(['"])((?:\\.|(?!\2).)+)\2\s*:\s*\{[^\n]*\},?\s*(?:\/\/[^\n]*)?\s*$/;

const bodyLines = body.split('\n');
// Build list of { key, line, originalIndex } for sorting/insertion.
const existing = [];
const nonEntryPrefix = []; // any leading non-entry lines (blank/comments) before first entry
const nonEntrySuffix = []; // trailing lines after last entry (before closing brace)

let firstEntrySeen = false;
let lastEntryIdx = -1;
for (let i = 0; i < bodyLines.length; i++) {
  const line = bodyLines[i];
  const m = entryLineRegex.exec(line);
  if (m) {
    existing.push({ key: m[3], line });
    firstEntrySeen = true;
    lastEntryIdx = i;
  } else if (!firstEntrySeen) {
    nonEntryPrefix.push(line);
  }
}
// Anything after lastEntryIdx is suffix
for (let i = lastEntryIdx + 1; i < bodyLines.length; i++) {
  nonEntrySuffix.push(bodyLines[i]);
}

// Add new entries to the list (only if not already present)
const existingKeys = new Set(existing.map(e => e.key));
let added = 0;
let skipped = 0;
for (const [key, val] of Object.entries(newEntries)) {
  if (existingKeys.has(key)) {
    console.warn(`Skipping (already present): ${key}`);
    skipped++;
    continue;
  }
  existing.push({ key, line: formatEntry(key, val) });
  added++;
}

// Sort entries by key using Hindi-aware locale comparison
existing.sort((a, b) => a.key.localeCompare(b.key, 'hi'));

const newBody = [
  ...nonEntryPrefix,
  ...existing.map(e => e.line),
  ...nonEntrySuffix,
].join('\n');

const newSrc = head + newBody + tail;

fs.writeFileSync(HI_DICT_PATH, newSrc, 'utf8');

console.log(`Added ${added} new entries (${skipped} skipped as duplicates) to ${HI_DICT_PATH}`);
console.log(`Total entries now: ${existing.length}`);
