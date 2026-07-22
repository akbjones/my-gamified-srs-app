/**
 * Japanese dictionary — Stage-1 scaffold (seed entries only; P2 fills to
 * ~550 for the 300-card starter, 100% tap coverage by lint).
 *
 * Conventions (Korean precedent):
 * - `ipa` carries Hepburn rōmaji, not IPA — same as ko.ts.
 * - Keys are surface tokens exactly as cards write them: kanji surface
 *   where the card writes kanji (学生), kana keys added for words that
 *   appear kana-only in the seq 1-50 band (がくせい). Both key to the
 *   same data.
 * - No inter-word spacing in Japanese: cards are pre-tokenized
 *   (card.tokens), so lookups get clean tokens. The particle-stripping
 *   fallback serves free text (Intl.Segmenter output, audit CLI).
 */
import { findInfinitive } from '../conjugation/ja';

export interface DictEntry {
  en: string;
  ipa: string;
  pos?: string;
  /** Dictionary form whose table opens when this token is tapped. */
  lemma?: string;
}

const DICT: Record<string, DictEntry> = {
  // ── pronouns & people ──────────────────────────────────────────
  '私': { en: 'I; me', ipa: 'watashi', pos: 'pron' },
  'わたし': { en: 'I; me', ipa: 'watashi', pos: 'pron' },
  '学生': { en: 'student', ipa: 'gakusei', pos: 'n' },
  'がくせい': { en: 'student', ipa: 'gakusei', pos: 'n' },
  '先生': { en: 'teacher', ipa: 'sensei', pos: 'n' },
  'せんせい': { en: 'teacher', ipa: 'sensei', pos: 'n' },
  '人': { en: 'person', ipa: 'hito', pos: 'n' },
  '日本': { en: 'Japan', ipa: 'nihon', pos: 'n' },
  '日本人': { en: 'Japanese person', ipa: 'nihonjin', pos: 'n' },
  '日本語': { en: 'Japanese language', ipa: 'nihongo', pos: 'n' },
  'にほんご': { en: 'Japanese language', ipa: 'nihongo', pos: 'n' },
  '友だち': { en: 'friend', ipa: 'tomodachi', pos: 'n' },
  'ともだち': { en: 'friend', ipa: 'tomodachi', pos: 'n' },
  // ── everyday nouns ─────────────────────────────────────────────
  '水': { en: 'water', ipa: 'mizu', pos: 'n' },
  'みず': { en: 'water', ipa: 'mizu', pos: 'n' },
  'パン': { en: 'bread', ipa: 'pan', pos: 'n' },
  'コーヒー': { en: 'coffee', ipa: 'koohii', pos: 'n' },
  '本': { en: 'book', ipa: 'hon', pos: 'n' },
  'ほん': { en: 'book', ipa: 'hon', pos: 'n' },
  '猫': { en: 'cat', ipa: 'neko', pos: 'n' },
  'ねこ': { en: 'cat', ipa: 'neko', pos: 'n' },
  '犬': { en: 'dog', ipa: 'inu', pos: 'n' },
  'いぬ': { en: 'dog', ipa: 'inu', pos: 'n' },
  '学校': { en: 'school', ipa: 'gakkou', pos: 'n' },
  'がっこう': { en: 'school', ipa: 'gakkou', pos: 'n' },
  '電車': { en: 'train', ipa: 'densha', pos: 'n' },
  'でんしゃ': { en: 'train', ipa: 'densha', pos: 'n' },
  '今日': { en: 'today', ipa: 'kyou', pos: 'n' },
  'きょう': { en: 'today', ipa: 'kyou', pos: 'n' },
  '明日': { en: 'tomorrow', ipa: 'ashita', pos: 'n' },
  'あした': { en: 'tomorrow', ipa: 'ashita', pos: 'n' },
  '昨日': { en: 'yesterday', ipa: 'kinou', pos: 'n' },
  'きのう': { en: 'yesterday', ipa: 'kinou', pos: 'n' },
  '町': { en: 'town', ipa: 'machi', pos: 'n' },
  // ── demonstratives & question words ────────────────────────────
  'これ': { en: 'this (thing here)', ipa: 'kore', pos: 'pron' },
  'それ': { en: 'that (thing near you)', ipa: 'sore', pos: 'pron' },
  'あれ': { en: 'that (thing over there)', ipa: 'are', pos: 'pron' },
  '何': { en: 'what', ipa: 'nani / nan', pos: 'pron' },
  'なん': { en: 'what', ipa: 'nan', pos: 'pron', lemma: '何' },
  'なに': { en: 'what', ipa: 'nani', pos: 'pron', lemma: '何' },
  // ── particles (their own tappable tokens by design) ────────────
  'は': { en: 'topic marker ("as for ...")', ipa: 'wa', pos: 'part' },
  'が': { en: 'subject marker', ipa: 'ga', pos: 'part' },
  'を': { en: 'object marker', ipa: 'o', pos: 'part' },
  'に': { en: 'to; at (direction, time, place of existence)', ipa: 'ni', pos: 'part' },
  'で': { en: 'at; by (place of action, means)', ipa: 'de', pos: 'part' },
  'へ': { en: 'toward', ipa: 'e', pos: 'part' },
  'と': { en: 'and; with', ipa: 'to', pos: 'part' },
  'も': { en: 'also; too', ipa: 'mo', pos: 'part' },
  'の': { en: 'of; ’s (linking/possessive)', ipa: 'no', pos: 'part' },
  'か': { en: 'question marker', ipa: 'ka', pos: 'part' },
  'ね': { en: 'isn’t it? (seeking agreement)', ipa: 'ne', pos: 'part' },
  'よ': { en: 'you know (adding emphasis/news)', ipa: 'yo', pos: 'part' },
  // ── copula & set phrases ───────────────────────────────────────
  'です': { en: 'is; am; are (polite)', ipa: 'desu', pos: 'v', lemma: 'です' },
  'こんにちは': { en: 'hello; good afternoon', ipa: 'konnichiwa', pos: 'phrase' },
  'おはようございます': { en: 'good morning (polite)', ipa: 'ohayou gozaimasu', pos: 'phrase' },
  'ありがとうございます': { en: 'thank you (polite)', ipa: 'arigatou gozaimasu', pos: 'phrase' },
  'すみません': { en: 'excuse me; I’m sorry', ipa: 'sumimasen', pos: 'phrase' },
  'はい': { en: 'yes', ipa: 'hai', pos: 'intj' },
  'いいえ': { en: 'no', ipa: 'iie', pos: 'intj' },
  'そう': { en: 'so; that way (そうです = that’s right)', ipa: 'sou', pos: 'adv' },
  // ── verbs (dictionary-form headwords; taps on conjugated forms
  //    resolve via findInfinitive) ─────────────────────────────────
  '行く': { en: 'to go', ipa: 'iku', pos: 'v', lemma: '行く' },
  'いく': { en: 'to go', ipa: 'iku', pos: 'v', lemma: '行く' },
  '来る': { en: 'to come', ipa: 'kuru', pos: 'v', lemma: '来る' },
  'する': { en: 'to do', ipa: 'suru', pos: 'v', lemma: 'する' },
  '食べる': { en: 'to eat', ipa: 'taberu', pos: 'v', lemma: '食べる' },
  'たべる': { en: 'to eat', ipa: 'taberu', pos: 'v', lemma: '食べる' },
  '飲む': { en: 'to drink', ipa: 'nomu', pos: 'v', lemma: '飲む' },
  'のむ': { en: 'to drink', ipa: 'nomu', pos: 'v', lemma: '飲む' },
  '見る': { en: 'to see; to watch', ipa: 'miru', pos: 'v', lemma: '見る' },
  'みる': { en: 'to see; to watch', ipa: 'miru', pos: 'v', lemma: '見る' },
  'ある': { en: 'to exist; there is (things)', ipa: 'aru', pos: 'v', lemma: 'ある' },
  'いる': { en: 'to exist; there is (people, animals)', ipa: 'iru', pos: 'v', lemma: 'いる' },
  '勉強する': { en: 'to study', ipa: 'benkyou suru', pos: 'v', lemma: '勉強する' },
  // ── adjectives ─────────────────────────────────────────────────
  '高い': { en: 'expensive; tall', ipa: 'takai', pos: 'adj', lemma: '高い' },
  'たかい': { en: 'expensive; tall', ipa: 'takai', pos: 'adj', lemma: '高い' },
  'おいしい': { en: 'delicious', ipa: 'oishii', pos: 'adj', lemma: 'おいしい' },
  '静か': { en: 'quiet (na-adjective)', ipa: 'shizuka', pos: 'adj' },
  'しずか': { en: 'quiet (na-adjective)', ipa: 'shizuka', pos: 'adj', lemma: '静か' },
};

// Particles that glue onto free-text chunks, longest first (compound
// combinations before their parts: では before で and は).
const PARTICLES = [
  'からは', 'までは', 'では', 'には', 'へは', 'とは', 'とも',
  'から', 'まで', 'より',
  'は', 'が', 'を', 'に', 'で', 'へ', 'と', 'も', 'の', 'ね', 'よ', 'か',
];

// Fullwidth/ASCII punctuation only — NEVER strip ー (chōonpu, part of
// words like コーヒー) or 々 (iteration mark).
const PUNCT = /[\s。、！？「」『』（）()!?.,…・〜]/g;

export function lookupWord(word: string): DictEntry | null {
  if (!word) return null;
  const raw = word.trim();
  if (DICT[raw]) return DICT[raw];
  const w = raw.replace(PUNCT, '');
  if (!w) return null;
  if (DICT[w]) return DICT[w];

  // Conjugated form → dictionary-form entry (食べました → 食べる)
  const lemma = findInfinitive(w);
  if (lemma && DICT[lemma]) {
    const e = DICT[lemma];
    return { ...e, lemma: e.lemma ?? lemma };
  }

  // Particle stripping for free-text chunks (学校では → 学校)
  for (const p of PARTICLES) {
    if (w.endsWith(p) && w.length > p.length) {
      const base = w.slice(0, -p.length);
      if (DICT[base]) return DICT[base];
      const lem = findInfinitive(base);
      if (lem && DICT[lem]) {
        const e = DICT[lem];
        return { ...e, lemma: e.lemma ?? lem };
      }
    }
  }
  return null;
}
