import { EtymologyEntry } from './types';

/** Swedish etymology seed — 10 verified entries.
 *  Swedish is North Germanic — same family as English with rich
 *  shared vocabulary, plus some words Swedish exported back to English.
 *  Sources: Wiktionary (sv+en), Etymonline. */
export const SWEDISH_ETYMOLOGY: Record<string, EtymologyEntry> = {
  'blod': {
    word: 'blod',
    origin: 'Germanic blōþą',
    cognates: ['blood'],
    note: 'Same Germanic root as English "blood" — Viking-era Swedes and Anglo-Saxons would have understood each other here.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'vatten': {
    word: 'vatten',
    origin: 'Germanic watōr',
    cognates: ['water'],
    note: 'Same Germanic root as English "water" — Latin used aqua, so the word splits at the Roman border.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'hus': {
    word: 'hus',
    origin: 'Germanic hūsą',
    cognates: ['house'],
    note: 'Same Germanic root as English "house" — almost identical pronunciation in Old Norse.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'bok': {
    word: 'bok',
    origin: 'Germanic bōk',
    cognates: ['book', 'beech'],
    note: 'Originally meant "beech tree" — early Germanic peoples carved runes onto beech wood for writing.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'dag': {
    word: 'dag',
    origin: 'Germanic dagaz',
    cognates: ['day'],
    note: 'Same Germanic root as English "day" — preserved almost identically across all North Germanic languages.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'natt': {
    word: 'natt',
    origin: 'Germanic nahts',
    cognates: ['night', 'nocturnal'],
    note: 'Same ancient root as English "night", Latin nox, German Nacht — one of the oldest shared Indo-European words.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'fika': {
    word: 'fika',
    origin: 'Swedish slang reversal of "kaffi" (coffee)',
    cognates: ['fika'],
    note: 'Coined as back-slang for kaffi in the 1900s — now means the Swedish coffee-break ritual, entering English directly.',
    verified: true,
    sources: ['wiktionary'],
  },
  'ombudsman': {
    word: 'ombudsman',
    origin: 'Swedish ombud + man',
    cognates: ['ombudsman'],
    note: 'Literally "commission-man" — Sweden created the parliamentary office in 1809, English borrowed the word in 1959.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'smörgåsbord': {
    word: 'smörgåsbord',
    origin: 'Swedish smörgås + bord',
    cognates: ['smorgasbord'],
    note: 'Literally "butter-goose table" — a buffet style. Entered English in the 1890s, now means any variety.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'fönster': {
    word: 'fönster',
    origin: 'Latin fenestra',
    cognates: ['defenestrate'],
    note: 'Borrowed from Latin during medieval times — same root as English "defenestrate" (to throw out a window).',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
};
