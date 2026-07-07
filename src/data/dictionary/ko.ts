/**
 * Korean dictionary — Stage-1 scaffold (seed entries only).
 *
 * Korean is the first language where whitespace tokenization is not
 * enough for lookup: particles attach to nouns (학교에서 = school+LOC).
 * lookupWord strips particle suffixes (longest first) and retries —
 * the Korean analogue of Turkish case-suffix stripping.
 */
import { findInfinitive } from '../conjugation/ko';

export interface DictEntry {
  en: string;
  ipa: string;
  pos?: string;
  /** Dictionary form (-다) whose table opens when this token is tapped. */
  lemma?: string;
}

const DICT: Record<string, DictEntry> = {
  // Pronouns & function words
  '저': { en: 'I (humble)', ipa: 'tɕʌ', pos: 'pron' },
  '나': { en: 'I (plain)', ipa: 'na', pos: 'pron' },
  '우리': { en: 'we; our', ipa: 'uɾi', pos: 'pron' },
  '이': { en: 'this', ipa: 'i', pos: 'det' },
  '그': { en: 'that; he', ipa: 'kɯ', pos: 'det' },
  '저것': { en: 'that thing (far)', ipa: 'tɕʌgʌt̚', pos: 'pron' },
  '네': { en: 'yes', ipa: 'ne', pos: 'interj' },
  '아니요': { en: 'no', ipa: 'anijo', pos: 'interj' },
  '안': { en: 'not (before verb)', ipa: 'an', pos: 'adv' },
  '뭐': { en: 'what', ipa: 'mwʌ', pos: 'pron' },
  '어디': { en: 'where', ipa: 'ʌdi', pos: 'pron' },
  '언제': { en: 'when', ipa: 'ʌndʑe', pos: 'adv' },
  '누구': { en: 'who', ipa: 'nugu', pos: 'pron' },

  // Seed verbs/adjectives (dictionary form)
  '가다': { en: 'to go', ipa: 'kada', pos: 'v' },
  '오다': { en: 'to come', ipa: 'oda', pos: 'v' },
  '보다': { en: 'to see; to watch', ipa: 'poda', pos: 'v' },
  '먹다': { en: 'to eat', ipa: 'mʌk̚t͈a', pos: 'v' },
  '마시다': { en: 'to drink', ipa: 'maɕida', pos: 'v' },
  '하다': { en: 'to do', ipa: 'hada', pos: 'v' },
  '공부하다': { en: 'to study', ipa: 'koŋbuhada', pos: 'v' },
  '일하다': { en: 'to work', ipa: 'iɾhada', pos: 'v' },
  '말하다': { en: 'to speak', ipa: 'maɾhada', pos: 'v' },
  '좋아하다': { en: 'to like', ipa: 'tɕoahada', pos: 'v' },
  '살다': { en: 'to live', ipa: 'salda', pos: 'v' },
  '알다': { en: 'to know', ipa: 'alda', pos: 'v' },
  '모르다': { en: 'to not know', ipa: 'moɾɯda', pos: 'v' },
  '배우다': { en: 'to learn', ipa: 'pɛuda', pos: 'v' },
  '듣다': { en: 'to listen; to hear', ipa: 'tɯt̚t͈a', pos: 'v' },
  '읽다': { en: 'to read', ipa: 'ik̚t͈a', pos: 'v' },
  '있다': { en: 'to exist; to have', ipa: 'it̚t͈a', pos: 'v' },
  '없다': { en: 'to not exist; to not have', ipa: 'ʌp̚t͈a', pos: 'v' },

  // Seed nouns
  '물': { en: 'water', ipa: 'mul', pos: 'n' },
  '밥': { en: 'cooked rice; meal', ipa: 'pap̚', pos: 'n' },
  '집': { en: 'house; home', ipa: 'tɕip̚', pos: 'n' },
  '학교': { en: 'school', ipa: 'hak̚k͈jo', pos: 'n' },
  '친구': { en: 'friend', ipa: 'tɕʰingu', pos: 'n' },
  '오늘': { en: 'today', ipa: 'onɯl', pos: 'n' },
  '내일': { en: 'tomorrow', ipa: 'nɛil', pos: 'n' },
  '커피': { en: 'coffee', ipa: 'kʰʌpʰi', pos: 'n' },
  '한국어': { en: 'Korean language', ipa: 'hangugʌ', pos: 'n' },
  '안녕하세요': { en: 'hello (polite)', ipa: 'annjʌŋhasejo', pos: 'phrase' },
  '감사합니다': { en: 'thank you (formal)', ipa: 'kamsahamnida', pos: 'phrase' },
};

// Noun particles, longest first. Stripping order matters: 에서 before 에.
const PARTICLES = [
  '에서는', '에서도', '한테서', '으로는', '까지는',
  '에서', '에게', '한테', '부터', '까지', '처럼', '보다', '마다',
  '은', '는', '이', '가', '을', '를', '에', '도', '만', '와', '과', '랑', '의', '로'
];

export function lookupWord(word: string): DictEntry | null {
  if (!word) return null;
  const w = word.trim().replace(/[^가-힣]/g, '');
  if (!w) return null;
  if (DICT[w]) return DICT[w];

  // Conjugated verb form → dictionary-form entry (가요 → 가다)
  const lemma = findInfinitive(w);
  if (lemma && DICT[lemma]) {
    const e = DICT[lemma];
    return { ...e, lemma: e.lemma ?? lemma };
  }

  // Particle stripping on nouns (학교에서 → 학교), longest first
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
