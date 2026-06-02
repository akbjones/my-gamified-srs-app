import { EtymologyEntry } from './types';

/** Turkish etymology seed — 10 verified entries.
 *  Turkish is non-Indo-European (Turkic family), so direct cognates
 *  with English are rare. The interesting layer here is loanwords —
 *  Turkish absorbed Arabic and Persian through the Ottoman era, then
 *  underwent a massive 1930s language reform under Atatürk that coined
 *  thousands of new Turkic-rooted replacements.
 *  Sources: Wiktionary (tr+en), Etymonline. */
export const TURKISH_ETYMOLOGY: Record<string, EtymologyEntry> = {
  'kitap': {
    word: 'kitap',
    origin: 'Arabic kitāb',
    cognates: [],
    note: 'Arabic for "book" — same root spread to Persian ketāb, Hindi किताब, and Swahili kitabu.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'kahve': {
    word: 'kahve',
    origin: 'Arabic qahwa',
    cognates: ['coffee', 'café'],
    note: 'Ottoman Turkish carried Arabic qahwa to Europe — Italian caffè, then French café and English "coffee".',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'şeker': {
    word: 'şeker',
    origin: 'Persian shakar, ult. Sanskrit śarkarā',
    cognates: ['sugar'],
    note: 'Same chain as Spanish azúcar — Sanskrit → Persian → Arabic → European trade routes brought sugar westward.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'okul': {
    word: 'okul',
    origin: 'Turkish reform coinage',
    cognates: [],
    note: 'Coined during the 1930s Atatürk language reform from Turkic root "oku-" (to read), replacing Arabic mektep.',
    verified: true,
    sources: ['wiktionary'],
  },
  'öğretmen': {
    word: 'öğretmen',
    origin: 'Turkish reform coinage',
    cognates: [],
    note: 'Coined during the 1930s reform from the Turkic root "öğret-" (to teach), replacing Arabic muallim.',
    verified: true,
    sources: ['wiktionary'],
  },
  'müzik': {
    word: 'müzik',
    origin: 'French musique',
    cognates: ['music'],
    note: 'Borrowed from French during the Tanzimat reforms of the 1800s — same Greek-Latin root as English "music".',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'yoğurt': {
    word: 'yoğurt',
    origin: 'Turkish yoğurmak',
    cognates: ['yogurt', 'yoghurt'],
    note: 'From the Turkish verb yoğurmak ("to knead, to thicken") — entered English directly in the 17th century.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'çay': {
    word: 'çay',
    origin: 'Mandarin chá via Persian',
    cognates: ['chai'],
    note: 'Followed the Silk Road through Persia. English "tea" came via the Min dialect (te) by sea — same plant, two routes.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'dünya': {
    word: 'dünya',
    origin: 'Arabic dunyā',
    cognates: [],
    note: 'Arabic dunyā means "lower world" — borrowed across the Islamic world (Persian, Hindi दुनिया, Swahili dunia).',
    verified: true,
    sources: ['wiktionary'],
  },
  'masa': {
    word: 'masa',
    origin: 'Greek mâza via Italian',
    cognates: [],
    note: 'Came via Mediterranean trade — same root as Italian massa and English "mass" (lump or quantity).',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
};
