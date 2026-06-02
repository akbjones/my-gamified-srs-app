import { EtymologyEntry } from './types';

/** Russian etymology seed — 10 verified entries.
 *  Cross-checked against Wiktionary (ru+en), Vasmer's Russian Etymological
 *  Dictionary, and Etymonline (for English cognate origins). */
export const RUSSIAN_ETYMOLOGY: Record<string, EtymologyEntry> = {
  'мать': {
    word: 'мать',
    origin: 'Slavic mati',
    cognates: ['mother', 'maternal'],
    note: 'Same ancient root as English "mother", Latin mater, Sanskrit mātṛ.',
    verified: true,
    sources: ['wiktionary', 'vasmer'],
  },
  'сердце': {
    word: 'сердце',
    origin: 'Slavic sьrdьce',
    cognates: ['heart', 'cordial'],
    note: 'Same ancient root as English "heart" and Latin cor (hence "cordial").',
    verified: true,
    sources: ['wiktionary', 'vasmer'],
  },
  'ночь': {
    word: 'ночь',
    origin: 'Slavic noktь',
    cognates: ['night', 'nocturnal'],
    note: 'Same ancient root as English "night", Latin nox (hence "nocturnal"), German Nacht.',
    verified: true,
    sources: ['wiktionary', 'vasmer'],
  },
  'новый': {
    word: 'новый',
    origin: 'Slavic novъ',
    cognates: ['new', 'novel', 'innovate'],
    note: 'Same ancient root as English "new", Latin novus (hence "novel", "innovate").',
    verified: true,
    sources: ['wiktionary', 'vasmer'],
  },
  'три': {
    word: 'три',
    origin: 'Slavic tri',
    cognates: ['three', 'trio'],
    note: 'Same ancient root as English "three", Sanskrit trī, Latin tres.',
    verified: true,
    sources: ['wiktionary', 'vasmer'],
  },
  'море': {
    word: 'море',
    origin: 'Slavic morje',
    cognates: ['marine', 'maritime'],
    note: 'Same ancient root as Latin mare (English "marine", "maritime").',
    verified: true,
    sources: ['wiktionary', 'vasmer'],
  },
  'дом': {
    word: 'дом',
    origin: 'Slavic domъ',
    cognates: ['domicile', 'domestic', 'dome'],
    note: 'Same ancient root as Latin domus (English "domicile", "domestic", "dome").',
    verified: true,
    sources: ['wiktionary', 'vasmer'],
  },
  'молоко': {
    word: 'молоко',
    origin: 'Slavic melko',
    cognates: ['milk'],
    note: 'Same ancient Indo-European root as English "milk" and German Milch.',
    verified: true,
    sources: ['wiktionary', 'vasmer'],
  },
  'знать': {
    word: 'знать',
    origin: 'Slavic znati',
    cognates: ['know', 'gnosis', 'diagnose'],
    note: 'Same ancient root as English "know" and Greek gignōskein (hence "diagnose").',
    verified: true,
    sources: ['wiktionary', 'vasmer'],
  },
  'снег': {
    word: 'снег',
    origin: 'Slavic sněgъ',
    cognates: ['snow'],
    note: 'Same ancient root as English "snow", German Schnee, Latin nix.',
    verified: true,
    sources: ['wiktionary', 'vasmer'],
  },
};
