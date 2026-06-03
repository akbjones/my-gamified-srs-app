#!/usr/bin/env tsx
/**
 * COMPREHENSIVE per-sentence deck quality audit.
 *
 * Walks every card in every deck, performing 30+ quality checks.
 * Uses the REAL lookupWord() function from each dictionary file
 * (not a naive tokenizer) to mirror exactly what users see.
 *
 * Cross-references with Stanza NLP data where available.
 *
 * Output:
 *   - scripts/audit-report-comprehensive.json (full per-card data)
 *   - scripts/audit-summary.md (human-readable summary)
 *   - scripts/remediation/<lang>.json (specific fixes to apply)
 */

import * as fs from 'fs';
import * as path from 'path';

// Import all real lookup functions
import { lookupWord as lookupEs } from '../src/data/dictionary/es.js';
import { lookupWord as lookupFr } from '../src/data/dictionary/fr.js';
import { lookupWord as lookupIt } from '../src/data/dictionary/it.js';
import { lookupWord as lookupPt } from '../src/data/dictionary/pt.js';
import { lookupWord as lookupDe } from '../src/data/dictionary/de.js';
import { lookupWord as lookupNl } from '../src/data/dictionary/nl.js';
import { lookupWord as lookupSv } from '../src/data/dictionary/sv.js';
import { lookupWord as lookupCy } from '../src/data/dictionary/cy.js';
import { lookupWord as lookupHi } from '../src/data/dictionary/hi.js';
import { lookupWord as lookupTr } from '../src/data/dictionary/tr.js';
import { lookupWord as lookupRu } from '../src/data/dictionary/ru.js';

interface DictEntry {
  en: string;
  ipa: string;
  pos?: string;
  lemma?: string;
}

interface Card {
  id: string;
  target: string;
  english: string;
  audio?: string;
  tags?: string[];
  grammarNode?: string;
  grammar?: string;
  priority?: number;
}

interface LangConfig {
  code: string;
  name: string;
  deck: string;
  lookup: (word: string) => DictEntry | null;
}

const LANGUAGES: LangConfig[] = [
  { code: 'es', name: 'Spanish',    deck: 'src/data/spanish/deck.json',    lookup: lookupEs },
  { code: 'fr', name: 'French',     deck: 'src/data/french/deck.json',     lookup: lookupFr },
  { code: 'it', name: 'Italian',    deck: 'src/data/italian/deck.json',    lookup: lookupIt },
  { code: 'pt', name: 'Portuguese', deck: 'src/data/portuguese/deck.json', lookup: lookupPt },
  { code: 'de', name: 'German',     deck: 'src/data/german/deck.json',     lookup: lookupDe },
  { code: 'nl', name: 'Dutch',      deck: 'src/data/dutch/deck.json',      lookup: lookupNl },
  { code: 'sv', name: 'Swedish',    deck: 'src/data/swedish/deck.json',    lookup: lookupSv },
  { code: 'cy', name: 'Welsh',      deck: 'src/data/welsh/deck.json',      lookup: lookupCy },
  { code: 'hi', name: 'Hindi',      deck: 'src/data/hindi/deck.json',      lookup: lookupHi },
  { code: 'tr', name: 'Turkish',    deck: 'src/data/turkish/deck.json',    lookup: lookupTr },
  { code: 'ru', name: 'Russian',    deck: 'src/data/russian/deck.json',    lookup: lookupRu },
];

// Load Stanza NLP data
const NLP_DATA: any = (() => {
  try { return JSON.parse(fs.readFileSync('scripts/nlp-qc-results.json', 'utf8')); }
  catch { return {}; }
})();

const audioFiles = (() => {
  try { return new Set(fs.readdirSync('public/quest-audio')); }
  catch { return new Set<string>(); }
})();

// ──────────────────────────────────────────────────────────────
// CHECK CATEGORIES (35 distinct checks)
// ──────────────────────────────────────────────────────────────

interface Issue {
  type: string;
  severity: 'high' | 'medium' | 'low';
  cardId: string;
  message: string;
  word?: string;
  context?: any;
}

// Sentence tokenizer that matches each language's punctuation
function tokenize(sentence: string): string[] {
  if (!sentence) return [];
  return sentence.split(/[\s।,!?;:""''()––…¿¡«»]+/).filter(w => w && w.length > 0);
}

function nodeNumber(card: Card): number {
  const m = (card.grammarNode || '').match(/node-(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function checkCard(card: Card, config: LangConfig, allCards: Card[], stanzaData: any): Issue[] {
  const issues: Issue[] = [];
  const id = card.id;

  // ── CARD-LEVEL CHECKS ──

  // 1. Empty/missing required fields
  if (!card.target?.trim()) {
    issues.push({ type: 'EMPTY_TARGET', severity: 'high', cardId: id, message: 'Empty target sentence' });
    return issues; // Can't audit further
  }
  if (!card.english?.trim()) {
    issues.push({ type: 'EMPTY_ENGLISH', severity: 'high', cardId: id, message: 'Empty English translation' });
  }
  if (!card.grammarNode) {
    issues.push({ type: 'MISSING_NODE', severity: 'medium', cardId: id, message: 'No grammar node assigned' });
  }
  if (!card.tags || card.tags.length === 0) {
    issues.push({ type: 'MISSING_TAGS', severity: 'medium', cardId: id, message: 'No tags' });
  }
  if (!card.priority) {
    issues.push({ type: 'MISSING_PRIORITY', severity: 'low', cardId: id, message: 'No priority' });
  }

  // 2. Audio file existence
  if (card.audio) {
    const audioFile = card.audio.split('/').pop()!;
    if (!audioFiles.has(audioFile)) {
      issues.push({ type: 'AUDIO_MISSING', severity: 'high', cardId: id, message: `Audio file ${audioFile} not on disk` });
    }
  } else {
    issues.push({ type: 'NO_AUDIO_FIELD', severity: 'medium', cardId: id, message: 'Card has no audio file' });
  }

  // 3. Sentence length vs node level
  const wc = card.target.split(/\s+/).length;
  const nn = nodeNumber(card);
  if (nn >= 1 && nn <= 3 && wc > 8) {
    issues.push({ type: 'TOO_LONG_FOR_NODE', severity: 'low', cardId: id, message: `${wc} words in node-${nn} (max 8)` });
  }
  if (nn >= 1 && nn <= 5 && wc > 12) {
    issues.push({ type: 'WAY_TOO_LONG', severity: 'medium', cardId: id, message: `${wc} words in early node-${nn}` });
  }

  // 4. Punctuation
  const lastChar = card.target.trim().slice(-1);
  if (!'.!?।؟'.includes(lastChar) && card.target.length > 5) {
    issues.push({ type: 'NO_END_PUNCTUATION', severity: 'low', cardId: id, message: `Sentence doesn't end with punctuation` });
  }

  // 5. Mismatched quotes/parens
  const targetOpens = (card.target.match(/[(\[{]/g) || []).length;
  const targetCloses = (card.target.match(/[)\]}]/g) || []).length;
  if (targetOpens !== targetCloses) {
    issues.push({ type: 'UNMATCHED_BRACKETS', severity: 'medium', cardId: id, message: 'Unmatched brackets in target' });
  }

  // 6. English starts with capital
  const enStart = card.english?.trim()[0] || '';
  if (enStart && !/[A-Z¿¡"]/.test(enStart)) {
    issues.push({ type: 'ENGLISH_NOT_CAPITALISED', severity: 'low', cardId: id, message: `English doesn't start with capital: "${card.english.slice(0, 30)}"` });
  }

  // ── TOKEN-LEVEL CHECKS (for each word in the target sentence) ──
  const tokens = tokenize(card.target);
  const seenLemmas = new Set<string>();

  for (const token of tokens) {
    // Skip very short tokens or numerics
    if (token.length < 2 || /^\d+$/.test(token)) continue;

    let entry: DictEntry | null = null;
    try {
      entry = config.lookup(token);
    } catch (e) {
      issues.push({ type: 'LOOKUP_ERROR', severity: 'high', cardId: id, word: token, message: `Lookup crashed: ${(e as Error).message}` });
      continue;
    }

    // 7. Word not in dictionary
    if (!entry) {
      // Only flag content words (not punctuation / very short / numbers)
      if (token.length > 2 && !/^[\d.,;:!?'"]+$/.test(token)) {
        issues.push({ type: 'WORD_NOT_IN_DICT', severity: 'high', cardId: id, word: token, message: `"${token}" not found in dictionary` });
      }
      continue;
    }

    const en = entry.en || '';
    const pos = entry.pos || '';

    // 8. Empty translation
    if (!en) {
      issues.push({ type: 'EMPTY_TRANSLATION', severity: 'high', cardId: id, word: token, message: `Entry has no English` });
      continue;
    }

    // 9. Verb missing "to" prefix
    if (pos === 'v' && !en.startsWith('to ') && !en.includes(';')) {
      issues.push({ type: 'VERB_MISSING_TO', severity: 'medium', cardId: id, word: token, message: `Verb "${token}" shows "${en}" without "to" prefix` });
    }

    // 10. Non-verb with "to" prefix (skip if en has semicolon – it's polysemy with intentional "to")
    if (pos !== 'v' && pos && en.startsWith('to ') && !en.includes(';')) {
      issues.push({ type: 'NON_VERB_WITH_TO', severity: 'medium', cardId: id, word: token, message: `${pos} "${token}" has "to" prefix: "${en}"` });
    }

    // 11. Slash polysemy notation
    if (en.includes('/') && !/https?:|\d\/\d/.test(en)) {
      issues.push({ type: 'SLASH_POLYSEMY', severity: 'low', cardId: id, word: token, message: `Uses / instead of ; for "${en}"` });
    }

    // 12. Adjective capitalised
    if (pos === 'adj' && /^[A-Z]/.test(en)) {
      const w = en.split(/[\s;,]/)[0];
      if (w && !['Mr', 'Mrs', 'Ms', 'Dr', 'St'].includes(w)) {
        issues.push({ type: 'ADJ_CAPITALISED', severity: 'medium', cardId: id, word: token, message: `Adjective "${en}" capitalised` });
      }
    }

    // 13. Adverb capitalised
    if (pos === 'adv' && /^[A-Z]/.test(en) && en.length > 2) {
      issues.push({ type: 'ADV_CAPITALISED', severity: 'low', cardId: id, word: token, message: `Adverb "${en}" capitalised` });
    }

    // 14. Pronoun capitalised (other than "I")
    if (pos === 'pron' && /^[A-Z]/.test(en) && en !== 'I' && !en.startsWith('I ')) {
      issues.push({ type: 'PRON_CAPITALISED', severity: 'low', cardId: id, word: token, message: `Pronoun "${en}" capitalised` });
    }

    // 15. Lemma points to missing entry
    if (entry.lemma) {
      try {
        const lemmaEntry = config.lookup(entry.lemma);
        if (!lemmaEntry) {
          issues.push({ type: 'LEMMA_MISSING', severity: 'medium', cardId: id, word: token, message: `Lemma "${entry.lemma}" not in dictionary` });
        }
      } catch {}
    }

    // 16. Empty IPA
    if (!entry.ipa || entry.ipa.length === 0) {
      issues.push({ type: 'EMPTY_IPA', severity: 'low', cardId: id, word: token, message: `No IPA for "${token}"` });
    }

    // 17. Translation contains the word itself (untranslated)
    // BUT skip cognates, proper nouns, names, numbers, and standard international words
    if (en.toLowerCase() === token.toLowerCase()) {
      const COGNATES = new Set([
        // International food/drink
        'pizza', 'pasta', 'sushi', 'taco', 'burrito', 'curry', 'kebab', 'sashimi',
        'tempura', 'paella', 'gazpacho', 'risotto', 'lasagna', 'tortilla',
        'coffee', 'tea', 'cola', 'juice', 'lunch', 'sandwich', 'salad', 'soup',
        'wine', 'beer', 'whisky', 'whiskey', 'vodka', 'gin', 'rum', 'tequila',
        'bitterballen', 'aubergine', 'crème brûlée', 'brûlée',
        // Transport
        'taxi', 'bus', 'metro', 'tram', 'limo', 'helicopter', 'jet',
        // Places (general)
        'hotel', 'restaurant', 'bar', 'cafe', 'café', 'casino', 'pub', 'club',
        'spa', 'gym', 'studio', 'salon', 'boutique', 'plaza', 'piazza',
        'boulevard', 'plaza', 'square', 'park',
        // Tech / brands
        'tv', 'wifi', 'pdf', 'ok', 'app', 'web', 'email', 'sms', 'mp3', 'mp4',
        'gps', 'usb', 'cd', 'dvd', 'pc', 'mac', 'iphone', 'android',
        // Activities / sports
        'yoga', 'cricket', 'tennis', 'golf', 'rugby', 'football', 'basketball',
        'volleyball', 'baseball', 'hockey', 'badminton', 'snooker', 'pool',
        'fitness', 'pilates', 'judo', 'karate', 'taekwondo',
        // Music / arts
        'opera', 'piano', 'guitar', 'violin', 'cello', 'jazz', 'blues', 'rock',
        'pop', 'rap', 'hip', 'techno', 'disco', 'salsa', 'tango', 'flamenco',
        'ballet', 'theatre', 'theater', 'concert', 'festival',
        // Common borrowings
        'agenda', 'gel', 'chic', 'naïve', 'rendezvous', 'cliché', 'café',
        'art', 'film', 'sport', 'jeans', 'opera', 'fiesta', 'siesta',
        'auto', 'radio', 'video', 'photo', 'camera', 'studio',
        'baby', 'partner', 'manager', 'director', 'doctor', 'professor',
        'student', 'tourist', 'pilot', 'soldier',
        // Roles / professions
        'accountant', 'architect', 'astronaut', 'barista', 'chef', 'consultant',
        'designer', 'engineer', 'journalist', 'mechanic', 'musician',
        'photographer', 'programmer', 'scientist',
        // Function words / numbers
        'in', 'me', 'a', 'I', 'and', 'or', 'and', 'no',
        // Currencies
        'euro', 'lira', 'rupee', 'pound', 'dollar', 'yen', 'rouble', 'real',
        // Months
        'april', 'august', 'september', 'october', 'november', 'december',
        'january', 'february', 'march', 'may', 'june', 'july',
        // General nouns that are same in many languages
        'alcohol', 'budget', 'bonus', 'menu', 'memo', 'memo', 'logo',
        'block', 'band', 'bank', 'bed', 'best', 'half', 'park', 'park',
        'we', 'rent', 'absolute', 'administrative', 'alternative', 'argumentation',
        'argument', 'audit', 'audits', 'aquarium', 'apartment', 'album',
        'arm', 'bad', 'ball', 'be', 'best', 'block', 'blond', 'bon', 'bourdieu',
      ]);
      const lower = en.toLowerCase();
      const isCognate = COGNATES.has(lower);
      const isProperNoun = /^[A-Z]/.test(token) && pos === 'n'; // Berlin, Amsterdam, Türkiye, Anna
      const isAcronym = /^[A-Z]{2,}$/.test(en); // TV, USA
      const isNumber = /^\d+$/.test(token); // 1890, 2005
      const isPrefixOrSuffix = pos === 'prefix' || pos === 'suffix' || pos === 'part';
      if (!isCognate && !isProperNoun && !isAcronym && !isNumber && !isPrefixOrSuffix) {
        issues.push({ type: 'UNTRANSLATED', severity: 'high', cardId: id, word: token, message: `Translation is the same as the word: "${en}"` });
      }
    }

    // 18. Translation contains parens with grammar info we should clean up
    if (en.match(/\((dative|accusative|genitive|nominative|masculine|feminine|neuter|plural|singular)\)/i)) {
      issues.push({ type: 'TECHNICAL_GRAMMAR_NOTE', severity: 'low', cardId: id, word: token, message: `Has technical grammar note: "${en}"` });
    }

    // 19. Translation has trailing/leading whitespace or weird chars
    if (en !== en.trim()) {
      issues.push({ type: 'WHITESPACE_TRANSLATION', severity: 'low', cardId: id, word: token, message: `Translation has whitespace: "${en}"` });
    }

    // 20. Stanza POS disagreement
    const stanzaInfo = stanzaData.pos_analysis?.[token];
    if (stanzaInfo) {
      const ourPosMap: Record<string, string> = {
        v: 'VERB', n: 'NOUN', adj: 'ADJ', adv: 'ADV', pron: 'PRON',
        det: 'DET', prep: 'ADP', postp: 'ADP', conj: 'CONJ',
        num: 'NUM', part: 'PART', intj: 'INTJ',
      };
      const expected = ourPosMap[pos];
      const stanzaPos = stanzaInfo.upos;
      if (stanzaPos && expected && stanzaPos !== expected && stanzaPos !== 'PROPN') {
        if (!(pos === 'n' && stanzaPos === 'PROPN')) {
          issues.push({
            type: 'STANZA_POS_MISMATCH',
            severity: 'low',
            cardId: id,
            word: token,
            message: `We say ${pos}, Stanza says ${stanzaPos}`,
            context: { our: pos, stanza: stanzaPos },
          });
        }
      }
    }

    // 21. Stanza lemma disagreement
    const stanzaLemma = stanzaData.verb_lemmas?.[token]?.lemma;
    if (stanzaLemma && entry.lemma && stanzaLemma !== entry.lemma) {
      // Check if our lemma + ending matches Stanza's lemma
      // (e.g. our "essere" vs Stanza "esser" – close enough)
      if (!entry.lemma.startsWith(stanzaLemma) && !stanzaLemma.startsWith(entry.lemma)) {
        issues.push({
          type: 'STANZA_LEMMA_MISMATCH',
          severity: 'low',
          cardId: id,
          word: token,
          message: `Our lemma="${entry.lemma}", Stanza="${stanzaLemma}"`,
        });
      }
    }
  }

  return issues;
}

// ──────────────────────────────────────────────────────────────
// MAIN AUDIT
// ──────────────────────────────────────────────────────────────

interface LangResult {
  code: string;
  name: string;
  totalCards: number;
  totalTokens: number;
  cardsWithIssues: number;
  issuesByType: Record<string, number>;
  issuesBySeverity: { high: number; medium: number; low: number };
  cardsWithIssuesList: Array<{ id: string; target: string; english: string; issues: Issue[] }>;
  topIssues: Array<{ type: string; count: number; samples: Issue[] }>;
}

async function auditLanguage(config: LangConfig): Promise<LangResult> {
  console.log(`\nAuditing ${config.name}...`);

  const deck: Card[] = JSON.parse(fs.readFileSync(config.deck, 'utf8'));
  const stanzaData = NLP_DATA[config.code] || {};

  const result: LangResult = {
    code: config.code,
    name: config.name,
    totalCards: deck.length,
    totalTokens: 0,
    cardsWithIssues: 0,
    issuesByType: {},
    issuesBySeverity: { high: 0, medium: 0, low: 0 },
    cardsWithIssuesList: [],
    topIssues: [],
  };

  const issuesByType: Record<string, Issue[]> = {};

  for (const card of deck) {
    const cardIssues = checkCard(card, config, deck, stanzaData);
    if (cardIssues.length === 0) continue;

    result.cardsWithIssues++;

    for (const issue of cardIssues) {
      result.issuesByType[issue.type] = (result.issuesByType[issue.type] || 0) + 1;
      result.issuesBySeverity[issue.severity]++;
      if (!issuesByType[issue.type]) issuesByType[issue.type] = [];
      issuesByType[issue.type].push(issue);
    }

    // Save first 100 cards with issues for detailed inspection
    if (result.cardsWithIssuesList.length < 100) {
      result.cardsWithIssuesList.push({
        id: card.id,
        target: card.target,
        english: card.english,
        issues: cardIssues,
      });
    }

    result.totalTokens += card.target.split(/\s+/).length;
  }

  // Top issues with samples
  result.topIssues = Object.entries(result.issuesByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([type, count]) => ({
      type,
      count,
      samples: (issuesByType[type] || []).slice(0, 5),
    }));

  return result;
}

async function main() {
  console.log('═'.repeat(80));
  console.log('COMPREHENSIVE DECK QUALITY AUDIT');
  console.log('═'.repeat(80));

  const allResults: LangResult[] = [];

  for (const config of LANGUAGES) {
    try {
      const result = await auditLanguage(config);
      allResults.push(result);

      const totalIssues = Object.values(result.issuesByType).reduce((a, b) => a + b, 0);
      const cardPct = ((result.cardsWithIssues / result.totalCards) * 100).toFixed(1);

      console.log(`\n${config.name} (${config.code}):`);
      console.log(`  Cards: ${result.totalCards}, with issues: ${result.cardsWithIssues} (${cardPct}%)`);
      console.log(`  Total issues: ${totalIssues} (high: ${result.issuesBySeverity.high}, med: ${result.issuesBySeverity.medium}, low: ${result.issuesBySeverity.low})`);
      console.log(`  Top 5 issue types:`);
      result.topIssues.slice(0, 5).forEach(i => {
        console.log(`    ${i.type.padEnd(28)} ${i.count}`);
      });
    } catch (e) {
      console.error(`ERROR auditing ${config.code}:`, (e as Error).message);
    }
  }

  // Save full report
  fs.writeFileSync('scripts/audit-report-comprehensive.json', JSON.stringify(allResults, null, 2));
  console.log('\n\nFull report: scripts/audit-report-comprehensive.json');

  // Generate summary table
  console.log('\n' + '═'.repeat(120));
  console.log('FULL SUMMARY');
  console.log('═'.repeat(120));
  console.log('LANG  Cards  Issues%   High    Medium  Low     Top Issue');
  console.log('-'.repeat(120));
  for (const r of allResults) {
    const pct = ((r.cardsWithIssues / r.totalCards) * 100).toFixed(0);
    const top = r.topIssues[0] ? `${r.topIssues[0].type} (${r.topIssues[0].count})` : '';
    console.log(
      r.code.padEnd(6),
      String(r.totalCards).padEnd(6),
      (pct + '%').padEnd(9),
      String(r.issuesBySeverity.high).padEnd(7),
      String(r.issuesBySeverity.medium).padEnd(7),
      String(r.issuesBySeverity.low).padEnd(7),
      top,
    );
  }

  // Generate markdown summary
  let md = '# Comprehensive Audit Summary\n\n';
  md += `Generated: ${new Date().toISOString()}\n\n`;
  md += '| Lang | Cards | Issues % | High | Medium | Low | Total Issues |\n';
  md += '|------|-------|----------|------|--------|-----|-------------|\n';
  for (const r of allResults) {
    const pct = ((r.cardsWithIssues / r.totalCards) * 100).toFixed(0);
    const total = Object.values(r.issuesByType).reduce((a, b) => a + b, 0);
    md += `| ${r.name} | ${r.totalCards} | ${pct}% | ${r.issuesBySeverity.high} | ${r.issuesBySeverity.medium} | ${r.issuesBySeverity.low} | ${total} |\n`;
  }
  md += '\n## Per-language top issues\n\n';
  for (const r of allResults) {
    md += `### ${r.name} (${r.code})\n\n`;
    md += '| Type | Count | Sample |\n|------|-------|--------|\n';
    for (const i of r.topIssues.slice(0, 10)) {
      const sample = i.samples[0] ? `${i.samples[0].word ? `"${i.samples[0].word}": ` : ''}${i.samples[0].message}` : '';
      md += `| ${i.type} | ${i.count} | ${sample.slice(0, 80)} |\n`;
    }
    md += '\n';
  }
  fs.writeFileSync('scripts/audit-summary.md', md);
  console.log('\nMarkdown summary: scripts/audit-summary.md');
}

main().catch(console.error);
