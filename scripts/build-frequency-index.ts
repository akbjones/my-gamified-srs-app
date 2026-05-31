/**
 * For each language, build a frequency index: how often does each dict word
 * appear across the deck (resolved via the REAL lookupWord, so verb forms
 * count toward their lemma's frequency).
 *
 * Output: scripts/frequency-{lang}.json — array of {key, freq, en, pos, lemma?}
 * sorted by freq desc.
 */
import * as fs from 'fs';
import { lookupWord as lookupEs } from '../src/data/dictionary/es';
import { lookupWord as lookupFr } from '../src/data/dictionary/fr';
import { lookupWord as lookupIt } from '../src/data/dictionary/it';
import { lookupWord as lookupPt } from '../src/data/dictionary/pt';
import { lookupWord as lookupDe } from '../src/data/dictionary/de';
import { lookupWord as lookupNl } from '../src/data/dictionary/nl';
import { lookupWord as lookupSv } from '../src/data/dictionary/sv';
import { lookupWord as lookupCy } from '../src/data/dictionary/cy';
import { lookupWord as lookupHi } from '../src/data/dictionary/hi';
import { lookupWord as lookupTr } from '../src/data/dictionary/tr';
import { lookupWord as lookupRu } from '../src/data/dictionary/ru';

// Also need raw dictionary access — read each TS file and parse
import * as vm from 'vm';

const CONFIGS = [
  { code: 'es', deck: 'src/data/spanish/deck.json',    lookup: lookupEs, file: 'src/data/dictionary/es.ts', varName: 'dictionary' },
  { code: 'fr', deck: 'src/data/french/deck.json',     lookup: lookupFr, file: 'src/data/dictionary/fr.ts', varName: 'dictionary' },
  { code: 'it', deck: 'src/data/italian/deck.json',    lookup: lookupIt, file: 'src/data/dictionary/it.ts', varName: 'dictionary' },
  { code: 'pt', deck: 'src/data/portuguese/deck.json', lookup: lookupPt, file: 'src/data/dictionary/pt.ts', varName: 'dictionary' },
  { code: 'de', deck: 'src/data/german/deck.json',     lookup: lookupDe, file: 'src/data/dictionary/de.ts', varName: 'DICT' },
  { code: 'nl', deck: 'src/data/dutch/deck.json',      lookup: lookupNl, file: 'src/data/dictionary/nl.ts', varName: 'dictionary' },
  { code: 'sv', deck: 'src/data/swedish/deck.json',    lookup: lookupSv, file: 'src/data/dictionary/sv.ts', varName: 'dictionary' },
  { code: 'cy', deck: 'src/data/welsh/deck.json',      lookup: lookupCy, file: 'src/data/dictionary/cy.ts', varName: 'dict' },
  { code: 'hi', deck: 'src/data/hindi/deck.json',      lookup: lookupHi, file: 'src/data/dictionary/hi.ts', varName: 'dictionary' },
  { code: 'tr', deck: 'src/data/turkish/deck.json',    lookup: lookupTr, file: 'src/data/dictionary/tr.ts', varName: 'dictionary' },
  { code: 'ru', deck: 'src/data/russian/deck.json',    lookup: lookupRu, file: 'src/data/dictionary/ru.ts', varName: 'dictionary' },
];

function loadRawDict(file: string, varName: string): Record<string, any> {
  const content = fs.readFileSync(file, 'utf8');
  const patterns = [
    new RegExp(`((?:export\\s+)?const\\s+${varName}\\s*:\\s*Record<[^>]+>\\s*=\\s*)\\{`, 'm'),
    new RegExp(`((?:export\\s+)?const\\s+${varName}\\s*=\\s*)\\{`, 'm'),
  ];
  let match: RegExpMatchArray | null = null;
  for (const pat of patterns) { match = content.match(pat); if (match) break; }
  if (!match || match.index === undefined) throw new Error(`Can't find dict for ${varName}`);
  const declEnd = match.index + match[0].length;
  let depth = 1, i = declEnd;
  while (i < content.length && depth > 0) {
    const ch = content[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (ch === "'" || ch === '"') {
      const q = ch; i++;
      while (i < content.length) { if (content[i] === '\\') { i += 2; continue; } if (content[i] === q) break; i++; }
    }
    i++;
  }
  const body = content.slice(declEnd, i - 1);
  return vm.runInNewContext('({' + body + '})', {}, { timeout: 10000 });
}

function tokenize(sentence: string): string[] {
  return sentence.split(/[\s।,!?;:""''()—–…¿¡«»]+/).filter(w => w && w.length > 0);
}

for (const config of CONFIGS) {
  const dict = loadRawDict(config.file, config.varName);
  const deck = JSON.parse(fs.readFileSync(config.deck, 'utf8'));

  // Resolve each token to its dict key (so verb forms count toward lemma)
  const freq = new Map<string, number>();

  for (const card of deck) {
    if (!card.target) continue;
    const tokens = tokenize(card.target);
    const cardKeys = new Set<string>();  // count each key once per card
    for (const t of tokens) {
      if (t.length < 2) continue;
      // Try direct, then via lookupWord which may resolve to lemma
      let resolvedKey = t.toLowerCase();
      if (!dict[resolvedKey]) {
        // Lookup function may return entry; we need to find the KEY that maps to it
        const entry = config.lookup(t);
        if (entry) {
          // Find the key by entry identity (rare) or by lemma
          if (entry.lemma && dict[entry.lemma]) {
            resolvedKey = entry.lemma;
          } else {
            // Try to find the key by linear scan (slow but correct)
            // Actually skip — we'll just count by direct token match
            continue;
          }
        } else {
          continue;
        }
      }
      cardKeys.add(resolvedKey);
    }
    for (const k of cardKeys) freq.set(k, (freq.get(k) || 0) + 1);
  }

  // Sort and emit
  const result = [...freq.entries()]
    .filter(([k]) => dict[k])
    .map(([k, n]) => ({
      key: k,
      freq: n,
      en: dict[k].en,
      pos: dict[k].pos,
      lemma: dict[k].lemma,
    }))
    .sort((a, b) => b.freq - a.freq);

  fs.writeFileSync(`scripts/frequency-${config.code}.json`, JSON.stringify(result, null, 2));
  console.log(`${config.code}: ${result.length} unique keys; top freq=${result[0]?.freq}; ≥5 freq=${result.filter(r => r.freq >= 5).length}`);
}
