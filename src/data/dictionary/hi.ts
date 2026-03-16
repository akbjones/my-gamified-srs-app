import type { DictEntry } from './es';
import { findInfinitive } from '../conjugation/hi';

// ── Hindi Dictionary ────────────────────────────────────────
// Keys are in Devanagari script (lowercase not applicable for Hindi).
// Each entry: { en: 'English translation', ipa: 'IPA pronunciation', pos: 'part of speech' }
const dictionary: Record<string, DictEntry> = {
  // ── Common verbs (infinitives) ─────────────────────────────
  'होना': { en: 'to be', ipa: '/hoːnaː/', pos: 'v' },
  'करना': { en: 'to do', ipa: '/kərnaː/', pos: 'v' },
  'जाना': { en: 'to go', ipa: '/dʒaːnaː/', pos: 'v' },
  'आना': { en: 'to come', ipa: '/aːnaː/', pos: 'v' },
  'देना': { en: 'to give', ipa: '/deːnaː/', pos: 'v' },
  'लेना': { en: 'to take', ipa: '/leːnaː/', pos: 'v' },
  'कहना': { en: 'to say', ipa: '/kəhnaː/', pos: 'v' },
  'देखना': { en: 'to see', ipa: '/deːkʰnaː/', pos: 'v' },
  'सुनना': { en: 'to listen', ipa: '/sʊnnaː/', pos: 'v' },
  'खाना': { en: 'to eat', ipa: '/kʰaːnaː/', pos: 'v' },
  'पीना': { en: 'to drink', ipa: '/piːnaː/', pos: 'v' },
  'पढ़ना': { en: 'to read/study', ipa: '/pəɽʰnaː/', pos: 'v' },
  'लिखना': { en: 'to write', ipa: '/lɪkʰnaː/', pos: 'v' },
  'बोलना': { en: 'to speak', ipa: '/boːlnaː/', pos: 'v' },
  'समझना': { en: 'to understand', ipa: '/səmədʒʰnaː/', pos: 'v' },
  'सोचना': { en: 'to think', ipa: '/soːtʃnaː/', pos: 'v' },
  'जानना': { en: 'to know', ipa: '/dʒaːnnaː/', pos: 'v' },
  'चाहना': { en: 'to want', ipa: '/tʃaːhnaː/', pos: 'v' },
  'रहना': { en: 'to stay/live', ipa: '/rəhnaː/', pos: 'v' },
  'चलना': { en: 'to walk/move', ipa: '/tʃəlnaː/', pos: 'v' },
  'बैठना': { en: 'to sit', ipa: '/bɛːʈʰnaː/', pos: 'v' },
  'उठना': { en: 'to get up', ipa: '/ʊʈʰnaː/', pos: 'v' },
  'सोना': { en: 'to sleep', ipa: '/soːnaː/', pos: 'v' },
  'रोना': { en: 'to cry', ipa: '/roːnaː/', pos: 'v' },
  'हँसना': { en: 'to laugh', ipa: '/hə̃snaː/', pos: 'v' },
  'खेलना': { en: 'to play', ipa: '/kʰeːlnaː/', pos: 'v' },
  'सीखना': { en: 'to learn', ipa: '/siːkʰnaː/', pos: 'v' },
  'सिखाना': { en: 'to teach', ipa: '/sɪkʰaːnaː/', pos: 'v' },
  'बनाना': { en: 'to make', ipa: '/bənaːnaː/', pos: 'v' },
  'रखना': { en: 'to keep/put', ipa: '/rəkʰnaː/', pos: 'v' },
  'मिलना': { en: 'to meet/be found', ipa: '/mɪlnaː/', pos: 'v' },
  'लाना': { en: 'to bring', ipa: '/laːnaː/', pos: 'v' },
  'भेजना': { en: 'to send', ipa: '/bʰeːdʒnaː/', pos: 'v' },
  'बताना': { en: 'to tell', ipa: '/bətaːnaː/', pos: 'v' },
  'दौड़ना': { en: 'to run', ipa: '/dɔːɽnaː/', pos: 'v' },
  'तैरना': { en: 'to swim', ipa: '/tɛːrnaː/', pos: 'v' },
  'गाना': { en: 'to sing', ipa: '/ɡaːnaː/', pos: 'v' },
  'नाचना': { en: 'to dance', ipa: '/naːtʃnaː/', pos: 'v' },
  'धोना': { en: 'to wash', ipa: '/dʰoːnaː/', pos: 'v' },
  'पकड़ना': { en: 'to catch', ipa: '/pəkəɽnaː/', pos: 'v' },
  'छोड़ना': { en: 'to leave/let go', ipa: '/tʃʰoːɽnaː/', pos: 'v' },
  'तोड़ना': { en: 'to break', ipa: '/toːɽnaː/', pos: 'v' },
  'जोड़ना': { en: 'to add/join', ipa: '/dʒoːɽnaː/', pos: 'v' },
  'खोलना': { en: 'to open', ipa: '/kʰoːlnaː/', pos: 'v' },
  'बंद करना': { en: 'to close', ipa: '/bənd kərnaː/', pos: 'v' },
  'मारना': { en: 'to hit/kill', ipa: '/maːrnaː/', pos: 'v' },
  'पहनना': { en: 'to wear', ipa: '/pəhənnaː/', pos: 'v' },
  'उतारना': { en: 'to take off/remove', ipa: '/ʊtaːrnaː/', pos: 'v' },
  'गिरना': { en: 'to fall', ipa: '/ɡɪrnaː/', pos: 'v' },
  'रुकना': { en: 'to stop', ipa: '/rʊknaː/', pos: 'v' },
  'मरना': { en: 'to die', ipa: '/mərnaː/', pos: 'v' },
  'जीना': { en: 'to live', ipa: '/dʒiːnaː/', pos: 'v' },
  'हारना': { en: 'to lose', ipa: '/haːrnaː/', pos: 'v' },
  'जीतना': { en: 'to win', ipa: '/dʒiːtnaː/', pos: 'v' },
  'पहुँचना': { en: 'to arrive/reach', ipa: '/pəhʊ̃tʃnaː/', pos: 'v' },
  'निकलना': { en: 'to come out', ipa: '/nɪkəlnaː/', pos: 'v' },
  'बनना': { en: 'to become', ipa: '/bənnaː/', pos: 'v' },
  'मानना': { en: 'to agree/believe', ipa: '/maːnnaː/', pos: 'v' },
  'पूछना': { en: 'to ask', ipa: '/puːtʃʰnaː/', pos: 'v' },
  'बदलना': { en: 'to change', ipa: '/bədəlnaː/', pos: 'v' },
  'काटना': { en: 'to cut', ipa: '/kaːʈnaː/', pos: 'v' },
  'ढूँढना': { en: 'to search/find', ipa: '/ɖʰuːnɖʰnaː/', pos: 'v' },
  'शुरू करना': { en: 'to start', ipa: '/ʃʊruː kərnaː/', pos: 'v' },
  'ख़त्म करना': { en: 'to finish', ipa: '/xətəm kərnaː/', pos: 'v' },
  'मदद करना': { en: 'to help', ipa: '/mədəd kərnaː/', pos: 'v' },
  'इंतज़ार करना': { en: 'to wait', ipa: '/ɪntəzaːr kərnaː/', pos: 'v' },
  'कोशिश करना': { en: 'to try', ipa: '/koːʃɪʃ kərnaː/', pos: 'v' },
  'याद करना': { en: 'to remember', ipa: '/jaːd kərnaː/', pos: 'v' },
  'भूलना': { en: 'to forget', ipa: '/bʰuːlnaː/', pos: 'v' },
  'पसंद करना': { en: 'to like', ipa: '/pəsənd kərnaː/', pos: 'v' },
  'प्यार करना': { en: 'to love', ipa: '/pjaːr kərnaː/', pos: 'v' },

  // ── Common verb forms ──────────────────────────────────────
  'है': { en: 'is', ipa: '/hɛː/', pos: 'v' },
  'हैं': { en: 'are', ipa: '/hɛ̃ː/', pos: 'v' },
  'हूँ': { en: 'am', ipa: '/hũː/', pos: 'v' },
  'हो': { en: 'are (familiar)', ipa: '/hoː/', pos: 'v' },
  'था': { en: 'was (m.)', ipa: '/tʰaː/', pos: 'v' },
  'थी': { en: 'was (f.)', ipa: '/tʰiː/', pos: 'v' },
  'थे': { en: 'were', ipa: '/tʰeː/', pos: 'v' },
  'थीं': { en: 'were (f.)', ipa: '/tʰĩː/', pos: 'v' },
  'हुआ': { en: 'happened/became (m.)', ipa: '/hʊaː/', pos: 'v' },
  'हुई': { en: 'happened/became (f.)', ipa: '/hʊiː/', pos: 'v' },
  'हुए': { en: 'happened/became (pl.)', ipa: '/hʊeː/', pos: 'v' },
  'किया': { en: 'did (m.)', ipa: '/kɪjaː/', pos: 'v' },
  'गया': { en: 'went (m.)', ipa: '/ɡəjaː/', pos: 'v' },
  'गई': { en: 'went (f.)', ipa: '/ɡəiː/', pos: 'v' },
  'गए': { en: 'went (pl.)', ipa: '/ɡəeː/', pos: 'v' },
  'आया': { en: 'came (m.)', ipa: '/aːjaː/', pos: 'v' },
  'आई': { en: 'came (f.)', ipa: '/aːiː/', pos: 'v' },
  'आए': { en: 'came (pl.)', ipa: '/aːeː/', pos: 'v' },
  'दिया': { en: 'gave (m.)', ipa: '/dɪjaː/', pos: 'v' },
  'लिया': { en: 'took (m.)', ipa: '/lɪjaː/', pos: 'v' },
  'कहा': { en: 'said', ipa: '/kəhaː/', pos: 'v' },

  // ── Pronouns ───────────────────────────────────────────────
  'मैं': { en: 'I', ipa: '/mɛ̃ː/', pos: 'pron' },
  'तू': { en: 'you (informal)', ipa: '/tuː/', pos: 'pron' },
  'तुम': { en: 'you (familiar)', ipa: '/tʊm/', pos: 'pron' },
  'आप': { en: 'you (formal)', ipa: '/aːp/', pos: 'pron' },
  'वह': { en: 'he/she/that', ipa: '/vəh/', pos: 'pron' },
  'यह': { en: 'this/he/she', ipa: '/jəh/', pos: 'pron' },
  'हम': { en: 'we', ipa: '/həm/', pos: 'pron' },
  'वे': { en: 'they (those)', ipa: '/veː/', pos: 'pron' },
  'ये': { en: 'they (these)', ipa: '/jeː/', pos: 'pron' },
  'कौन': { en: 'who', ipa: '/kɔːn/', pos: 'pron' },
  'क्या': { en: 'what', ipa: '/kjaː/', pos: 'pron' },
  'कोई': { en: 'someone/anyone', ipa: '/koːiː/', pos: 'pron' },
  'कुछ': { en: 'something/some', ipa: '/kʊtʃʰ/', pos: 'pron' },
  'सब': { en: 'all/everyone', ipa: '/səb/', pos: 'pron' },
  'ख़ुद': { en: 'self/oneself', ipa: '/xʊd/', pos: 'pron' },
  'अपना': { en: 'own/one\'s own', ipa: '/əpnaː/', pos: 'pron' },
  'अपनी': { en: 'own (f.)', ipa: '/əpniː/', pos: 'pron' },
  'अपने': { en: 'own (pl./obl.)', ipa: '/əpneː/', pos: 'pron' },

  // ── Postpositions & particles ──────────────────────────────
  'में': { en: 'in/inside', ipa: '/mẽː/', pos: 'postp' },
  'पर': { en: 'on/at', ipa: '/pər/', pos: 'postp' },
  'को': { en: 'to/for', ipa: '/koː/', pos: 'postp' },
  'से': { en: 'from/with/by', ipa: '/seː/', pos: 'postp' },
  'का': { en: 'of (m.)', ipa: '/kaː/', pos: 'postp' },
  'की': { en: 'of (f.)', ipa: '/kiː/', pos: 'postp' },
  'के': { en: 'of (obl./pl.)', ipa: '/keː/', pos: 'postp' },
  'ने': { en: 'ergative marker', ipa: '/neː/', pos: 'postp' },
  'तक': { en: 'until/up to', ipa: '/tək/', pos: 'postp' },
  'साथ': { en: 'with/together', ipa: '/saːtʰ/', pos: 'postp' },
  'लिए': { en: 'for (purpose)', ipa: '/lɪeː/', pos: 'postp' },
  'बारे': { en: 'about', ipa: '/baːreː/', pos: 'postp' },
  'बाद': { en: 'after', ipa: '/baːd/', pos: 'postp' },
  'पहले': { en: 'before/first', ipa: '/pəhleː/', pos: 'adv' },
  'बीच': { en: 'between/middle', ipa: '/biːtʃ/', pos: 'n' },
  'द्वारा': { en: 'by means of', ipa: '/dvaːraː/', pos: 'postp' },

  // ── Conjunctions ───────────────────────────────────────────
  'और': { en: 'and', ipa: '/ɔːr/', pos: 'conj' },
  'या': { en: 'or', ipa: '/jaː/', pos: 'conj' },
  'लेकिन': { en: 'but', ipa: '/leːkɪn/', pos: 'conj' },
  'मगर': { en: 'but/however', ipa: '/məɡər/', pos: 'conj' },
  'कि': { en: 'that (conjunction)', ipa: '/kɪ/', pos: 'conj' },
  'क्योंकि': { en: 'because', ipa: '/kjõːkɪ/', pos: 'conj' },
  'जब': { en: 'when', ipa: '/dʒəb/', pos: 'conj' },
  'तब': { en: 'then', ipa: '/təb/', pos: 'adv' },
  'अगर': { en: 'if', ipa: '/əɡər/', pos: 'conj' },
  'तो': { en: 'then/so', ipa: '/toː/', pos: 'part' },
  'इसलिए': { en: 'therefore', ipa: '/ɪslɪeː/', pos: 'conj' },
  'ताकि': { en: 'so that', ipa: '/taːkɪ/', pos: 'conj' },
  'हालाँकि': { en: 'although', ipa: '/haːlaːnkɪ/', pos: 'conj' },
  'जबकि': { en: 'whereas/while', ipa: '/dʒəbkɪ/', pos: 'conj' },
  'चूँकि': { en: 'since/because', ipa: '/tʃũːkɪ/', pos: 'conj' },

  // ── Common nouns ───────────────────────────────────────────
  'आदमी': { en: 'man', ipa: '/aːdmiː/', pos: 'n' },
  'औरत': { en: 'woman', ipa: '/ɔːrət/', pos: 'n' },
  'लड़का': { en: 'boy', ipa: '/ləɽkaː/', pos: 'n' },
  'लड़की': { en: 'girl', ipa: '/ləɽkiː/', pos: 'n' },
  'बच्चा': { en: 'child (m.)', ipa: '/bətʃtʃaː/', pos: 'n' },
  'बच्चे': { en: 'children', ipa: '/bətʃtʃeː/', pos: 'n' },
  'लोग': { en: 'people', ipa: '/loːɡ/', pos: 'n' },
  'दोस्त': { en: 'friend', ipa: '/doːst/', pos: 'n' },
  'परिवार': { en: 'family', ipa: '/pərɪvaːr/', pos: 'n' },
  'माँ': { en: 'mother', ipa: '/maː̃/', pos: 'n' },
  'पिता': { en: 'father', ipa: '/pɪtaː/', pos: 'n' },
  'भाई': { en: 'brother', ipa: '/bʰaːiː/', pos: 'n' },
  'बहन': { en: 'sister', ipa: '/bəhən/', pos: 'n' },
  'बेटा': { en: 'son', ipa: '/beːʈaː/', pos: 'n' },
  'बेटी': { en: 'daughter', ipa: '/beːʈiː/', pos: 'n' },
  'पति': { en: 'husband', ipa: '/pətɪ/', pos: 'n' },
  'पत्नी': { en: 'wife', ipa: '/pətniː/', pos: 'n' },
  'दादा': { en: 'paternal grandfather', ipa: '/daːdaː/', pos: 'n' },
  'दादी': { en: 'paternal grandmother', ipa: '/daːdiː/', pos: 'n' },
  'नाना': { en: 'maternal grandfather', ipa: '/naːnaː/', pos: 'n' },
  'नानी': { en: 'maternal grandmother', ipa: '/naːniː/', pos: 'n' },
  'चाचा': { en: 'father\'s brother', ipa: '/tʃaːtʃaː/', pos: 'n' },
  'मामा': { en: 'mother\'s brother', ipa: '/maːmaː/', pos: 'n' },
  'घर': { en: 'house/home', ipa: '/ɡʰər/', pos: 'n' },
  'कमरा': { en: 'room', ipa: '/kəmraː/', pos: 'n' },
  'दरवाज़ा': { en: 'door', ipa: '/dərvaːzaː/', pos: 'n' },
  'खिड़की': { en: 'window', ipa: '/kʰɪɽkiː/', pos: 'n' },
  'रसोई': { en: 'kitchen', ipa: '/rəsoːiː/', pos: 'n' },
  'बगीचा': { en: 'garden', ipa: '/bəɡiːtʃaː/', pos: 'n' },
  'सड़क': { en: 'road/street', ipa: '/səɽək/', pos: 'n' },
  'शहर': { en: 'city', ipa: '/ʃəhər/', pos: 'n' },
  'गाँव': { en: 'village', ipa: '/ɡaːʋ̃/', pos: 'n' },
  'देश': { en: 'country', ipa: '/deːʃ/', pos: 'n' },
  'दुनिया': { en: 'world', ipa: '/dʊnɪjaː/', pos: 'n' },
  'पानी': { en: 'water', ipa: '/paːniː/', pos: 'n' },
  // 'खाना' already defined as verb 'to eat' — also means 'food' as noun
  'चाय': { en: 'tea', ipa: '/tʃaːj/', pos: 'n' },
  'दूध': { en: 'milk', ipa: '/duːdʰ/', pos: 'n' },
  'रोटी': { en: 'bread/chapati', ipa: '/roːʈiː/', pos: 'n' },
  'चावल': { en: 'rice', ipa: '/tʃaːvəl/', pos: 'n' },
  'सब्ज़ी': { en: 'vegetable', ipa: '/səbziː/', pos: 'n' },
  'फल': { en: 'fruit', ipa: '/pʰəl/', pos: 'n' },
  'दुकान': { en: 'shop', ipa: '/dʊkaːn/', pos: 'n' },
  'बाज़ार': { en: 'market', ipa: '/baːzaːr/', pos: 'n' },
  'स्कूल': { en: 'school', ipa: '/skuːl/', pos: 'n' },
  'किताब': { en: 'book', ipa: '/kɪtaːb/', pos: 'n' },
  'काम': { en: 'work', ipa: '/kaːm/', pos: 'n' },
  'पैसा': { en: 'money', ipa: '/pɛːsaː/', pos: 'n' },
  'समय': { en: 'time', ipa: '/səməj/', pos: 'n' },
  'दिन': { en: 'day', ipa: '/dɪn/', pos: 'n' },
  'रात': { en: 'night', ipa: '/raːt/', pos: 'n' },
  'सुबह': { en: 'morning', ipa: '/sʊbəh/', pos: 'n' },
  'शाम': { en: 'evening', ipa: '/ʃaːm/', pos: 'n' },
  'साल': { en: 'year', ipa: '/saːl/', pos: 'n' },
  'महीना': { en: 'month', ipa: '/məhiːnaː/', pos: 'n' },
  'हफ़्ता': { en: 'week', ipa: '/həftaː/', pos: 'n' },
  'ज़िंदगी': { en: 'life', ipa: '/zɪndəɡiː/', pos: 'n' },
  'मौत': { en: 'death', ipa: '/mɔːt/', pos: 'n' },
  'तरह': { en: 'kind/type/way', ipa: '/tərəh/', pos: 'n' },
  'बात': { en: 'thing/matter/talk', ipa: '/baːt/', pos: 'n' },
  'जगह': { en: 'place', ipa: '/dʒəɡəh/', pos: 'n' },
  'नाम': { en: 'name', ipa: '/naːm/', pos: 'n' },
  'सवाल': { en: 'question', ipa: '/səvaːl/', pos: 'n' },
  'जवाब': { en: 'answer', ipa: '/dʒəvaːb/', pos: 'n' },
  'मौसम': { en: 'weather/season', ipa: '/mɔːsəm/', pos: 'n' },
  'गर्मी': { en: 'heat/summer', ipa: '/ɡərmiː/', pos: 'n' },
  'सर्दी': { en: 'cold/winter', ipa: '/sərdiː/', pos: 'n' },
  'बारिश': { en: 'rain', ipa: '/baːrɪʃ/', pos: 'n' },
  'हवा': { en: 'air/wind', ipa: '/həvaː/', pos: 'n' },
  'धूप': { en: 'sunshine', ipa: '/dʰuːp/', pos: 'n' },

  // ── Common adjectives ──────────────────────────────────────
  'बड़ा': { en: 'big (m.)', ipa: '/bəɽaː/', pos: 'adj' },
  'बड़ी': { en: 'big (f.)', ipa: '/bəɽiː/', pos: 'adj' },
  'बड़े': { en: 'big (pl./obl.)', ipa: '/bəɽeː/', pos: 'adj' },
  'छोटा': { en: 'small (m.)', ipa: '/tʃʰoːʈaː/', pos: 'adj' },
  'छोटी': { en: 'small (f.)', ipa: '/tʃʰoːʈiː/', pos: 'adj' },
  'अच्छा': { en: 'good (m.)', ipa: '/ətʃtʃʰaː/', pos: 'adj' },
  'अच्छी': { en: 'good (f.)', ipa: '/ətʃtʃʰiː/', pos: 'adj' },
  'बुरा': { en: 'bad (m.)', ipa: '/bʊraː/', pos: 'adj' },
  'नया': { en: 'new (m.)', ipa: '/nəjaː/', pos: 'adj' },
  'नई': { en: 'new (f.)', ipa: '/nəiː/', pos: 'adj' },
  'पुराना': { en: 'old (thing, m.)', ipa: '/pʊraːnaː/', pos: 'adj' },
  'सुंदर': { en: 'beautiful', ipa: '/sʊndər/', pos: 'adj' },
  'ख़ूबसूरत': { en: 'beautiful/handsome', ipa: '/xːuːbsuːrət/', pos: 'adj' },
  'ज़रूरी': { en: 'necessary/important', ipa: '/zəruːriː/', pos: 'adj' },
  'मुश्किल': { en: 'difficult', ipa: '/mʊʃkɪl/', pos: 'adj' },
  'आसान': { en: 'easy', ipa: '/aːsaːn/', pos: 'adj' },
  'ख़ुश': { en: 'happy', ipa: '/xʊʃ/', pos: 'adj' },
  'उदास': { en: 'sad', ipa: '/ʊdaːs/', pos: 'adj' },
  'गरम': { en: 'hot', ipa: '/ɡərəm/', pos: 'adj' },
  'ठंडा': { en: 'cold (m.)', ipa: '/ʈʰənɖaː/', pos: 'adj' },
  'लंबा': { en: 'tall/long (m.)', ipa: '/ləmbaː/', pos: 'adj' },
  'मोटा': { en: 'fat/thick (m.)', ipa: '/moːʈaː/', pos: 'adj' },
  'पतला': { en: 'thin (m.)', ipa: '/pətlaː/', pos: 'adj' },
  'सफ़ेद': { en: 'white', ipa: '/səfeːd/', pos: 'adj' },
  'काला': { en: 'black (m.)', ipa: '/kaːlaː/', pos: 'adj' },
  'लाल': { en: 'red', ipa: '/laːl/', pos: 'adj' },
  'हरा': { en: 'green (m.)', ipa: '/həraː/', pos: 'adj' },
  'नीला': { en: 'blue (m.)', ipa: '/niːlaː/', pos: 'adj' },
  'पीला': { en: 'yellow (m.)', ipa: '/piːlaː/', pos: 'adj' },
  'सही': { en: 'correct/right', ipa: '/səhiː/', pos: 'adj' },
  'ग़लत': { en: 'wrong/incorrect', ipa: '/ɣələt/', pos: 'adj' },
  'तैयार': { en: 'ready', ipa: '/tɛːjaːr/', pos: 'adj' },
  'मशहूर': { en: 'famous', ipa: '/məʃhuːr/', pos: 'adj' },

  // ── Common adverbs ─────────────────────────────────────────
  'बहुत': { en: 'very/much', ipa: '/bəhʊt/', pos: 'adv' },
  'भी': { en: 'also/too', ipa: '/bʰiː/', pos: 'part' },
  'ही': { en: 'only/emphasis', ipa: '/hiː/', pos: 'part' },
  'सिर्फ़': { en: 'only', ipa: '/sɪrf/', pos: 'adv' },
  'अभी': { en: 'right now', ipa: '/əbʰiː/', pos: 'adv' },
  'अब': { en: 'now', ipa: '/əb/', pos: 'adv' },
  'कभी': { en: 'ever/sometimes', ipa: '/kəbʰiː/', pos: 'adv' },
  'हमेशा': { en: 'always', ipa: '/həmeːʃaː/', pos: 'adv' },
  'कभी-कभी': { en: 'sometimes', ipa: '/kəbʰiː kəbʰiː/', pos: 'adv' },
  'फिर': { en: 'then/again', ipa: '/pʰɪr/', pos: 'adv' },
  'यहाँ': { en: 'here', ipa: '/jəhaː̃/', pos: 'adv' },
  'वहाँ': { en: 'there', ipa: '/vəhaː̃/', pos: 'adv' },
  'कहाँ': { en: 'where', ipa: '/kəhaː̃/', pos: 'adv' },
  'कब': { en: 'when', ipa: '/kəb/', pos: 'adv' },
  'कैसे': { en: 'how', ipa: '/kɛːseː/', pos: 'adv' },
  'क्यों': { en: 'why', ipa: '/kjõː/', pos: 'adv' },
  'ज़्यादा': { en: 'more', ipa: '/zjaːdaː/', pos: 'adv' },
  'कम': { en: 'less', ipa: '/kəm/', pos: 'adv' },
  'जल्दी': { en: 'quickly/soon', ipa: '/dʒəldiː/', pos: 'adv' },
  'धीरे': { en: 'slowly', ipa: '/dʰiːreː/', pos: 'adv' },
  'आज': { en: 'today', ipa: '/aːdʒ/', pos: 'adv' },
  'कल': { en: 'yesterday/tomorrow', ipa: '/kəl/', pos: 'adv' },
  'परसों': { en: 'day before/after yesterday/tomorrow', ipa: '/pərsoː̃/', pos: 'adv' },
  'रोज़': { en: 'daily/every day', ipa: '/roːz/', pos: 'adv' },
  'शायद': { en: 'maybe/perhaps', ipa: '/ʃaːjəd/', pos: 'adv' },
  'ज़रूर': { en: 'certainly/definitely', ipa: '/zəruːr/', pos: 'adv' },
  'बिल्कुल': { en: 'absolutely/completely', ipa: '/bɪlkʊl/', pos: 'adv' },
  'अचानक': { en: 'suddenly', ipa: '/ətʃaːnək/', pos: 'adv' },
  'सीधे': { en: 'straight', ipa: '/siːdʰeː/', pos: 'adv' },
  'ऊपर': { en: 'up/above', ipa: '/uːpər/', pos: 'adv' },
  'नीचे': { en: 'down/below', ipa: '/niːtʃeː/', pos: 'adv' },
  'अंदर': { en: 'inside', ipa: '/əndər/', pos: 'adv' },
  'बाहर': { en: 'outside', ipa: '/baːhər/', pos: 'adv' },
  'दाएँ': { en: 'right (direction)', ipa: '/daːẽː/', pos: 'adv' },
  'बाएँ': { en: 'left (direction)', ipa: '/baːẽː/', pos: 'adv' },

  // ── Negation ───────────────────────────────────────────────
  'नहीं': { en: 'no/not', ipa: '/nəhĩː/', pos: 'adv' },
  'न': { en: 'not (formal)', ipa: '/nə/', pos: 'part' },
  'मत': { en: 'don\'t (command)', ipa: '/mət/', pos: 'part' },
  'हाँ': { en: 'yes', ipa: '/haː̃/', pos: 'part' },
  'जी': { en: 'yes (respectful)/sir', ipa: '/dʒiː/', pos: 'part' },

  // ── Numbers ────────────────────────────────────────────────
  'एक': { en: 'one', ipa: '/eːk/', pos: 'num' },
  'दो': { en: 'two', ipa: '/doː/', pos: 'num' },
  'तीन': { en: 'three', ipa: '/tiːn/', pos: 'num' },
  'चार': { en: 'four', ipa: '/tʃaːr/', pos: 'num' },
  'पाँच': { en: 'five', ipa: '/paːtʃ̃/', pos: 'num' },
  'छह': { en: 'six', ipa: '/tʃʰəh/', pos: 'num' },
  'सात': { en: 'seven', ipa: '/saːt/', pos: 'num' },
  'आठ': { en: 'eight', ipa: '/aːʈʰ/', pos: 'num' },
  'नौ': { en: 'nine', ipa: '/nɔː/', pos: 'num' },
  'दस': { en: 'ten', ipa: '/dəs/', pos: 'num' },
  'सौ': { en: 'hundred', ipa: '/sɔː/', pos: 'num' },
  'हज़ार': { en: 'thousand', ipa: '/həzaːr/', pos: 'num' },
  'लाख': { en: 'hundred thousand', ipa: '/laːkʰ/', pos: 'num' },
  'करोड़': { en: 'ten million', ipa: '/kəroːɽ/', pos: 'num' },
  'पहला': { en: 'first (m.)', ipa: '/pəhlaː/', pos: 'adj' },
  'दूसरा': { en: 'second/other (m.)', ipa: '/duːsraː/', pos: 'adj' },
  'तीसरा': { en: 'third (m.)', ipa: '/tiːsraː/', pos: 'adj' },

  // ── Common expressions/greetings ───────────────────────────
  'नमस्ते': { en: 'hello/namaste', ipa: '/nəməsteː/', pos: 'intj' },
  'शुक्रिया': { en: 'thank you', ipa: '/ʃʊkrɪjaː/', pos: 'intj' },
  'धन्यवाद': { en: 'thank you (formal)', ipa: '/dʰənjəvaːd/', pos: 'intj' },
  'माफ़ी': { en: 'sorry/forgiveness', ipa: '/maːfiː/', pos: 'n' },
  'अलविदा': { en: 'goodbye', ipa: '/əlvɪdaː/', pos: 'intj' },
  'ठीक': { en: 'fine/OK', ipa: '/ʈʰiːk/', pos: 'adj' },
  // 'अच्छा' already defined in adjectives section
  // 'बस' — dual meaning: bus (noun) and enough/just (adverb)

  // ── Body & health ──────────────────────────────────────────
  'सिर': { en: 'head', ipa: '/sɪr/', pos: 'n' },
  'आँख': { en: 'eye', ipa: '/aːnkʰ/', pos: 'n' },
  'कान': { en: 'ear', ipa: '/kaːn/', pos: 'n' },
  'नाक': { en: 'nose', ipa: '/naːk/', pos: 'n' },
  'मुँह': { en: 'mouth', ipa: '/mũːh/', pos: 'n' },
  'हाथ': { en: 'hand', ipa: '/haːtʰ/', pos: 'n' },
  'पैर': { en: 'foot/leg', ipa: '/pɛːr/', pos: 'n' },
  'दिल': { en: 'heart', ipa: '/dɪl/', pos: 'n' },
  'बीमार': { en: 'sick/ill', ipa: '/biːmaːr/', pos: 'adj' },
  'दवाई': { en: 'medicine', ipa: '/dəvaːiː/', pos: 'n' },
  'डॉक्टर': { en: 'doctor', ipa: '/ɖɒkʈər/', pos: 'n' },
  'अस्पताल': { en: 'hospital', ipa: '/əspətaːl/', pos: 'n' },

  // ── Transport & places ─────────────────────────────────────
  'गाड़ी': { en: 'car/vehicle', ipa: '/ɡaːɽiː/', pos: 'n' },
  // 'बस' already defined — dual meaning: bus/enough
  'ट्रेन': { en: 'train', ipa: '/ʈreːn/', pos: 'n' },
  'हवाई जहाज़': { en: 'airplane', ipa: '/həvaːiː dʒəhaːz/', pos: 'n' },
  'स्टेशन': { en: 'station', ipa: '/sʈeːʃən/', pos: 'n' },
  'होटल': { en: 'hotel', ipa: '/hoːʈəl/', pos: 'n' },
  'रेस्टोरेंट': { en: 'restaurant', ipa: '/reːsʈoːrenʈ/', pos: 'n' },
  'मंदिर': { en: 'temple', ipa: '/məndɪr/', pos: 'n' },
  'मस्जिद': { en: 'mosque', ipa: '/məsdʒɪd/', pos: 'n' },
  'चर्च': { en: 'church', ipa: '/tʃərtʃ/', pos: 'n' },

  // ── Time words ─────────────────────────────────────────────
  'घंटा': { en: 'hour', ipa: '/ɡʰənʈaː/', pos: 'n' },
  'मिनट': { en: 'minute', ipa: '/mɪnəʈ/', pos: 'n' },
  'बजे': { en: "o'clock", ipa: '/bədʒeː/', pos: 'n' },
  'सोमवार': { en: 'Monday', ipa: '/soːmvaːr/', pos: 'n' },
  'मंगलवार': { en: 'Tuesday', ipa: '/məŋɡəlvaːr/', pos: 'n' },
  'बुधवार': { en: 'Wednesday', ipa: '/bʊdʰvaːr/', pos: 'n' },
  'गुरुवार': { en: 'Thursday', ipa: '/ɡʊrʊvaːr/', pos: 'n' },
  'शुक्रवार': { en: 'Friday', ipa: '/ʃʊkrəvaːr/', pos: 'n' },
  'शनिवार': { en: 'Saturday', ipa: '/ʃənɪvaːr/', pos: 'n' },
  'रविवार': { en: 'Sunday', ipa: '/rəvɪvaːr/', pos: 'n' },

  // ── Education & work ───────────────────────────────────────
  'विद्यार्थी': { en: 'student', ipa: '/vɪdjaːrtʰiː/', pos: 'n' },
  'शिक्षक': { en: 'teacher', ipa: '/ʃɪkʃək/', pos: 'n' },
  'दफ़्तर': { en: 'office', ipa: '/dəftər/', pos: 'n' },
  'नौकरी': { en: 'job', ipa: '/nɔːkriː/', pos: 'n' },
  'कंपनी': { en: 'company', ipa: '/kəmpəniː/', pos: 'n' },
  'बैठक': { en: 'meeting', ipa: '/bɛːʈʰək/', pos: 'n' },
  'परीक्षा': { en: 'exam', ipa: '/pəriːkʃaː/', pos: 'n' },

  // ── Abstract nouns ─────────────────────────────────────────
  'प्यार': { en: 'love', ipa: '/pjaːr/', pos: 'n' },
  'ख़ुशी': { en: 'happiness', ipa: '/xʊʃiː/', pos: 'n' },
  'दुख': { en: 'sorrow/pain', ipa: '/dʊkʰ/', pos: 'n' },
  'उम्मीद': { en: 'hope', ipa: '/ʊmmiːd/', pos: 'n' },
  'डर': { en: 'fear', ipa: '/ɖər/', pos: 'n' },
  'ग़ुस्सा': { en: 'anger', ipa: '/ɣʊssaː/', pos: 'n' },
  'सपना': { en: 'dream', ipa: '/səpnaː/', pos: 'n' },
  'सच': { en: 'truth', ipa: '/sətʃ/', pos: 'n' },
  'झूठ': { en: 'lie', ipa: '/dʒʰuːʈʰ/', pos: 'n' },
  'विश्वास': { en: 'trust/belief', ipa: '/vɪʃvaːs/', pos: 'n' },
  'सफलता': { en: 'success', ipa: '/səpʰəltaː/', pos: 'n' },
  'असफलता': { en: 'failure', ipa: '/əsəpʰəltaː/', pos: 'n' },
  'अनुभव': { en: 'experience', ipa: '/ənʊbʰəv/', pos: 'n' },
  'सोच': { en: 'thinking/thought', ipa: '/soːtʃ/', pos: 'n' },
  'समस्या': { en: 'problem', ipa: '/səməsjaː/', pos: 'n' },
  'हल': { en: 'solution', ipa: '/həl/', pos: 'n' },
  'फ़ैसला': { en: 'decision', ipa: '/fɛːslaː/', pos: 'n' },
};

// ── Verb form resolution ─────────────────────────────────────
// Hindi verb forms: stem + suffixes for tense/gender/number
const VERB_SUFFIX_PATTERNS: { suffix: string; replace: string }[] = [
  // Present habitual
  { suffix: 'ता', replace: 'ना' },
  { suffix: 'ती', replace: 'ना' },
  { suffix: 'ते', replace: 'ना' },
  // Continuous
  { suffix: 'रहा', replace: 'ना' },
  { suffix: 'रही', replace: 'ना' },
  { suffix: 'रहे', replace: 'ना' },
  // Past
  { suffix: 'या', replace: 'ना' },
  { suffix: 'ई', replace: 'ना' },
  // Future
  { suffix: 'ऊँगा', replace: 'ना' },
  { suffix: 'ऊँगी', replace: 'ना' },
  { suffix: 'एगा', replace: 'ना' },
  { suffix: 'एगी', replace: 'ना' },
  { suffix: 'एँगे', replace: 'ना' },
  { suffix: 'एँगी', replace: 'ना' },
  { suffix: 'ओगे', replace: 'ना' },
  { suffix: 'ओगी', replace: 'ना' },
  // Subjunctive
  { suffix: 'ऊँ', replace: 'ना' },
  { suffix: 'एँ', replace: 'ना' },
  // Imperative
  { suffix: 'ओ', replace: 'ना' },
  { suffix: 'इए', replace: 'ना' },
  { suffix: 'इएगा', replace: 'ना' },
];

function cleanWord(word: string): string {
  // Remove punctuation common in Hindi text
  return word
    .replace(/[।,!?;:"""''()—–\-…]/g, '')
    .trim();
}

export function lookupWord(word: string): DictEntry | null {
  const clean = cleanWord(word).trim();
  if (!clean) return null;

  // Direct lookup
  if (dictionary[clean]) return dictionary[clean];

  // Try with Devanagari variations (nuqta, chandrabindu, etc.)
  const withoutNuqta = clean.replace(/[़]/g, '');
  if (withoutNuqta !== clean && dictionary[withoutNuqta]) return dictionary[withoutNuqta];

  // Try verb form resolution using suffix patterns
  for (const { suffix } of VERB_SUFFIX_PATTERNS) {
    if (clean.endsWith(suffix)) {
      const stem = clean.slice(0, -suffix.length);
      if (stem.length > 0) {
        const infinitive = stem + 'ना';
        if (dictionary[infinitive]) return dictionary[infinitive];
      }
    }
  }

  // Try using the conjugation engine's reverse lookup
  const inf = findInfinitive(clean);
  if (inf && dictionary[inf]) return dictionary[inf];

  // Try multi-word compound verbs: "मदद करना" → check "मदद" alone
  const parts = clean.split(/\s+/);
  if (parts.length > 1) {
    for (const part of parts) {
      if (dictionary[part]) return dictionary[part];
    }
  }

  // Try removing common postposition clitics
  const postpositions = ['में', 'पर', 'को', 'से', 'का', 'की', 'के', 'ने'];
  for (const pp of postpositions) {
    if (clean.endsWith(pp) && clean.length > pp.length) {
      const base = clean.slice(0, -pp.length).trim();
      if (base && dictionary[base]) return dictionary[base];
    }
  }

  return null;
}

export default dictionary;
