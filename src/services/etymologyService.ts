/** Etymology lookup service.
 *
 *  Hard contract: only returns entries with `verified: true`. Entries
 *  pending review never reach the UI even if they're present in the data
 *  files. The QC script (scripts/etymology/qc.cjs) is the gatekeeper that
 *  decides which entries earn that flag.
 */

import { EtymologyEntry } from '../data/etymology/types';
import { SPANISH_ETYMOLOGY } from '../data/etymology/es';
import { ITALIAN_ETYMOLOGY } from '../data/etymology/it';
import { FRENCH_ETYMOLOGY } from '../data/etymology/fr';
import { PORTUGUESE_ETYMOLOGY } from '../data/etymology/pt';
import { HINDI_ETYMOLOGY } from '../data/etymology/hi';
import { RUSSIAN_ETYMOLOGY } from '../data/etymology/ru';
import { Language } from '../types';

const TABLES: Partial<Record<Language, Record<string, EtymologyEntry>>> = {
  spanish: SPANISH_ETYMOLOGY,
  italian: ITALIAN_ETYMOLOGY,
  french: FRENCH_ETYMOLOGY,
  portuguese: PORTUGUESE_ETYMOLOGY,
  hindi: HINDI_ETYMOLOGY,
  russian: RUSSIAN_ETYMOLOGY,
};

/** Normalize a word for lookup: strip punctuation, lowercase, keep
 *  diacritics (because Spanish "álgebra" / "ojalá" need them). */
function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?;:""«»()'"]/g, '')
    .trim();
}

/** Look up the etymology for a word in the given language. Returns null
 *  when no verified entry exists. */
export function lookupEtymology(word: string, lang: Language): EtymologyEntry | null {
  const table = TABLES[lang];
  if (!table) return null;

  const key = normalize(word);
  if (!key) return null;

  const entry = table[key];
  if (!entry || !entry.verified) return null;

  return entry;
}

/** True if a word has a known etymology in the given language. Cheap helper
 *  for hint badges / availability checks. */
export function hasEtymology(word: string, lang: Language): boolean {
  return lookupEtymology(word, lang) !== null;
}

/** Diagnostics — counts verified entries per language. */
export function getEtymologyStats(): Partial<Record<Language, number>> {
  const out: Partial<Record<Language, number>> = {};
  for (const [lang, table] of Object.entries(TABLES) as [Language, Record<string, EtymologyEntry>][]) {
    out[lang] = Object.values(table).filter(e => e.verified).length;
  }
  return out;
}
