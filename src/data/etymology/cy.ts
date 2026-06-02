import { EtymologyEntry } from './types';

/** Welsh etymology seed — 10 verified entries.
 *  Cross-checked against Wiktionary (cy+en) and Etymonline.
 *  Welsh is Brittonic Celtic — distant cousin of English through the
 *  Indo-European family, but with fewer direct cognates than Germanic
 *  or Romance languages. Several Welsh words have entered English directly. */
export const WELSH_ETYMOLOGY: Record<string, EtymologyEntry> = {
  'mam': {
    word: 'mam',
    origin: 'Brittonic Celtic',
    cognates: ['mother', 'maternal'],
    note: 'Same ancient Indo-European root as English "mother", Latin mater, Sanskrit mātṛ.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'tad': {
    word: 'tad',
    origin: 'Brittonic Celtic',
    cognates: ['father', 'paternal'],
    note: 'Same ancient root as Latin pater and English "father" — universal Indo-European parent-word.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'brawd': {
    word: 'brawd',
    origin: 'Brittonic Celtic',
    cognates: ['brother', 'fraternal'],
    note: 'Same ancient root as English "brother", Sanskrit bhrātṛ, Latin frater.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'llyfr': {
    word: 'llyfr',
    origin: 'Latin liber',
    cognates: ['library', 'libretto'],
    note: 'Borrowed from Latin during Roman rule of Britain — same source as Spanish libro, Italian libro.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'cath': {
    word: 'cath',
    origin: 'Latin catta',
    cognates: ['cat'],
    note: 'Borrowed from Latin catta during Roman times — same source as English "cat" and most European words.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'corgi': {
    word: 'corgi',
    origin: 'Welsh cor + ci',
    cognates: ['corgi'],
    note: 'Literally "dwarf dog" (cor = dwarf, ci = dog) — entered English directly as the breed name.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'bardd': {
    word: 'bardd',
    origin: 'Celtic bardos',
    cognates: ['bard'],
    note: 'Romans borrowed the Celtic word for "poet-singer" — English "bard" comes via Latin bardus.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'afon': {
    word: 'afon',
    origin: 'Brittonic Celtic',
    cognates: [],
    note: 'Preserved in English river names like Avon — multiple English rivers literally named "river" in old Celtic.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'nos': {
    word: 'nos',
    origin: 'Brittonic Celtic',
    cognates: ['nocturnal'],
    note: 'Same ancient root as Latin nox and English "nocturnal", "equinox" — old Indo-European night-word.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
  'mynydd': {
    word: 'mynydd',
    origin: 'Brittonic Celtic',
    cognates: ['mount', 'mountain'],
    note: 'Same ancient root as Latin mons (English "mount", "mountain") — a "rising up" of land.',
    verified: true,
    sources: ['wiktionary', 'etymonline'],
  },
};
