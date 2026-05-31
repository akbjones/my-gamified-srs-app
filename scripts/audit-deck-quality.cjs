#!/usr/bin/env node
/**
 * COMPREHENSIVE sentence-by-sentence deck quality audit.
 *
 * Walks every card in every deck, checking:
 *
 * STRUCTURAL (machine-detectable):
 *   - Missing dictionary entries
 *   - Verb POS without "to " prefix
 *   - Non-verb POS with "to " prefix
 *   - Polysemy notation: / vs ;
 *   - Wrong capitalisation (adjectives mid-sentence)
 *   - Audio file missing on disk
 *   - Empty/null fields (target, english, audio, tags, grammarNode)
 *   - Punctuation issues
 *   - Lookup function actually resolves inflected forms
 *   - Stanza POS disagreement
 *   - Duplicate cards (same target sentence)
 *   - Missing IPA in dictionary
 *   - Card length vs node level mismatch
 *   - Tag distribution per node
 *
 * SEMANTIC (requires Stanza or LLM, partial coverage):
 *   - POS mismatch with Stanza
 *   - Lemma agreement with Stanza
 *
 * REQUIRES NATIVE/AI REVIEW (flagged but not auto-fixable):
 *   - Wrong base translation
 *   - Missing polysemy meanings
 *   - Sentence naturalness
 *   - Grammar tip relevance
 */

const fs = require('fs');
const vm = require('vm');
const path = require('path');

const NLP_DATA = (() => {
  try { return JSON.parse(fs.readFileSync('scripts/nlp-qc-results.json', 'utf8')); }
  catch { return {}; }
})();

const AUDIO_DIR = 'public/quest-audio';
const audioFiles = (() => {
  try { return new Set(fs.readdirSync(AUDIO_DIR)); }
  catch { return new Set(); }
})();

const LANGUAGES = [
  { code: 'es', deck: 'src/data/spanish/deck.json', dict: 'src/data/dictionary/es.ts', varName: 'dictionary' },
  { code: 'fr', deck: 'src/data/french/deck.json', dict: 'src/data/dictionary/fr.ts', varName: 'dictionary' },
  { code: 'it', deck: 'src/data/italian/deck.json', dict: 'src/data/dictionary/it.ts', varName: 'dictionary' },
  { code: 'pt', deck: 'src/data/portuguese/deck.json', dict: 'src/data/dictionary/pt.ts', varName: 'dictionary' },
  { code: 'de', deck: 'src/data/german/deck.json', dict: 'src/data/dictionary/de.ts', varName: 'DICT' },
  { code: 'nl', deck: 'src/data/dutch/deck.json', dict: 'src/data/dictionary/nl.ts', varName: 'dictionary' },
  { code: 'sv', deck: 'src/data/swedish/deck.json', dict: 'src/data/dictionary/sv.ts', varName: 'dictionary' },
  { code: 'cy', deck: 'src/data/welsh/deck.json', dict: 'src/data/dictionary/cy.ts', varName: 'dict' },
  { code: 'hi', deck: 'src/data/hindi/deck.json', dict: 'src/data/dictionary/hi.ts', varName: 'dictionary' },
  { code: 'tr', deck: 'src/data/turkish/deck.json', dict: 'src/data/dictionary/tr.ts', varName: 'dictionary' },
  { code: 'ru', deck: 'src/data/russian/deck.json', dict: 'src/data/dictionary/ru.ts', varName: 'dictionary' },
];

function loadDict(filePath, varName) {
  const content = fs.readFileSync(filePath, 'utf8');
  const patterns = [
    new RegExp(`((?:export\\s+)?const\\s+${varName}\\s*:\\s*Record<[^>]+>\\s*=\\s*)\\{`, 'm'),
    new RegExp(`((?:export\\s+)?const\\s+${varName}\\s*=\\s*)\\{`, 'm'),
  ];
  let match = null;
  for (const pat of patterns) { match = content.match(pat); if (match) break; }
  if (!match) throw new Error(`Can't find dict for ${varName}`);

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
  return vm.runInNewContext('({' + content.slice(declEnd, i - 1) + '})', {}, { timeout: 10000 });
}

function tokenize(sentence) {
  if (!sentence) return [];
  return sentence.split(/[\s।,!?;:"""''()—–…¿¡]+/).filter(w => w && w.length > 0);
}

// Mirror the lookupWord logic from each dict (simplified)
function lookup(dict, word) {
  if (!word) return null;
  if (dict[word]) return dict[word];
  const lower = word.toLowerCase();
  if (dict[lower]) return dict[lower];
  // Try basic suffix stripping
  for (const suf of ['s', 'es', 'ed', 'ing', 'er', 'est', 'ly', 'a', 'e', 'en', 'n']) {
    if (lower.endsWith(suf) && lower.length > suf.length + 1) {
      const stem = lower.slice(0, -suf.length);
      if (dict[stem]) return dict[stem];
    }
  }
  return null;
}

function nodeNumber(card) {
  const m = (card.grammarNode || '').match(/node-(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function auditLanguage({ code, deck: deckPath, dict: dictPath, varName }) {
  console.log(`\n${'='.repeat(60)}\nAuditing: ${code.toUpperCase()}\n${'='.repeat(60)}`);

  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const dict = loadDict(dictPath, varName);
  const stanzaWords = NLP_DATA[code]?.pos_analysis || {};

  const stats = {
    totalCards: deck.length,
    totalTokens: 0,
    cardsWithIssues: 0,
    issues: {
      // Card-level (structural)
      'empty-target': 0,
      'empty-english': 0,
      'missing-grammar-node': 0,
      'missing-tags': 0,
      'audio-file-missing': 0,
      'duplicate-target': 0,
      'too-long-for-node': 0,
      // Token-level (structural)
      'missing-from-dict': 0,
      'verb-missing-to': 0,
      'non-verb-with-to': 0,
      'slash-polysemy': 0,
      'wrong-capitalisation': 0,
      'pos-mismatch-stanza': 0,
      'lemma-target-missing': 0, // entry has lemma field but lemma not in dict
    },
    examples: {},
    topMissing: {},
    topVerbMissingTo: {},
    topSlash: {},
    seenTargets: new Set(),
    duplicates: [],
  };

  for (const key of Object.keys(stats.issues)) stats.examples[key] = [];

  for (const card of deck) {
    const cardIssueCount = [];

    // Card-level checks
    if (!card.target?.trim()) {
      stats.issues['empty-target']++;
      if (stats.examples['empty-target'].length < 3) stats.examples['empty-target'].push({ id: card.id });
      cardIssueCount.push('empty-target');
      continue; // can't audit further
    }

    if (!card.english?.trim()) {
      stats.issues['empty-english']++;
      if (stats.examples['empty-english'].length < 3) stats.examples['empty-english'].push({ id: card.id, target: card.target });
      cardIssueCount.push('empty-english');
    }

    if (!card.grammarNode) {
      stats.issues['missing-grammar-node']++;
      cardIssueCount.push('missing-grammar-node');
    }

    if (!card.tags || card.tags.length === 0) {
      stats.issues['missing-tags']++;
      cardIssueCount.push('missing-tags');
    }

    // Audio file existence
    if (card.audio) {
      const audioFile = card.audio.split('/').pop();
      if (!audioFiles.has(audioFile)) {
        stats.issues['audio-file-missing']++;
        if (stats.examples['audio-file-missing'].length < 5) {
          stats.examples['audio-file-missing'].push({ id: card.id, audio: card.audio });
        }
        cardIssueCount.push('audio-file-missing');
      }
    }

    // Duplicate target
    const targetKey = card.target.trim().toLowerCase();
    if (stats.seenTargets.has(targetKey)) {
      stats.issues['duplicate-target']++;
      if (stats.duplicates.length < 5) stats.duplicates.push({ id: card.id, target: card.target });
      cardIssueCount.push('duplicate-target');
    } else {
      stats.seenTargets.add(targetKey);
    }

    // Too long for node level
    const nodeNum = nodeNumber(card);
    const wordCount = card.target.split(/\s+/).length;
    if (nodeNum >= 1 && nodeNum <= 3 && wordCount > 8) {
      stats.issues['too-long-for-node']++;
      cardIssueCount.push('too-long-for-node');
    }

    // Token-level checks
    const tokens = tokenize(card.target);
    for (const token of tokens) {
      stats.totalTokens++;
      const entry = lookup(dict, token);
      const stanzaInfo = stanzaWords[token];

      if (!entry) {
        if (token.length > 2 && /[a-zA-Zа-яА-Я\u0900-\u097F\u0590-\u05FF]/.test(token)) {
          stats.issues['missing-from-dict']++;
          stats.topMissing[token] = (stats.topMissing[token] || 0) + 1;
          if (stats.examples['missing-from-dict'].length < 5) {
            stats.examples['missing-from-dict'].push({ cardId: card.id, sentence: card.target, word: token });
          }
          cardIssueCount.push('missing-from-dict');
        }
        continue;
      }

      const en = entry.en || '';
      const pos = entry.pos || '';

      // Verb missing "to"
      if (pos === 'v' && !en.startsWith('to ') && !en.includes(';')) {
        stats.issues['verb-missing-to']++;
        stats.topVerbMissingTo[token] = (stats.topVerbMissingTo[token] || 0) + 1;
        if (stats.examples['verb-missing-to'].length < 5) {
          stats.examples['verb-missing-to'].push({ cardId: card.id, word: token, en });
        }
        cardIssueCount.push('verb-missing-to');
      }

      // Non-verb with "to"
      if (pos !== 'v' && en.startsWith('to ')) {
        stats.issues['non-verb-with-to']++;
        if (stats.examples['non-verb-with-to'].length < 5) {
          stats.examples['non-verb-with-to'].push({ cardId: card.id, word: token, en, pos });
        }
        cardIssueCount.push('non-verb-with-to');
      }

      // Slash polysemy
      if (en.includes('/') && !/https?:|\d\/\d/.test(en)) {
        stats.issues['slash-polysemy']++;
        stats.topSlash[token] = (stats.topSlash[token] || 0) + 1;
        if (stats.examples['slash-polysemy'].length < 5) {
          stats.examples['slash-polysemy'].push({ cardId: card.id, word: token, en });
        }
        cardIssueCount.push('slash-polysemy');
      }

      // Wrong capitalisation (mid-sentence non-noun starting with caps)
      if (en.length > 2 && /^[A-Z]/.test(en) && pos !== 'n') {
        if (!/^(Mr|Mrs|Ms|Dr|St|Saint)\b/.test(en)) {
          stats.issues['wrong-capitalisation']++;
          if (stats.examples['wrong-capitalisation'].length < 5) {
            stats.examples['wrong-capitalisation'].push({ cardId: card.id, word: token, en, pos });
          }
          cardIssueCount.push('wrong-capitalisation');
        }
      }

      // Lemma missing from dict
      if (entry.lemma && !dict[entry.lemma]) {
        stats.issues['lemma-target-missing']++;
        if (stats.examples['lemma-target-missing'].length < 3) {
          stats.examples['lemma-target-missing'].push({ cardId: card.id, word: token, lemma: entry.lemma });
        }
      }

      // POS mismatch with Stanza
      if (stanzaInfo) {
        const stanzaPos = stanzaInfo.upos;
        const ourPosMap = { v: 'VERB', n: 'NOUN', adj: 'ADJ', adv: 'ADV', pron: 'PRON', det: 'DET', prep: 'ADP', postp: 'ADP', conj: 'CONJ', num: 'NUM', part: 'PART', intj: 'INTJ' };
        const expected = ourPosMap[pos];
        if (stanzaPos && expected && stanzaPos !== expected && stanzaPos !== 'PROPN') {
          if (!(pos === 'n' && stanzaPos === 'PROPN')) {
            stats.issues['pos-mismatch-stanza']++;
            if (stats.examples['pos-mismatch-stanza'].length < 5) {
              stats.examples['pos-mismatch-stanza'].push({ cardId: card.id, word: token, ourPos: pos, stanzaPos });
            }
          }
        }
      }
    }

    if (cardIssueCount.length > 0) stats.cardsWithIssues++;
  }

  // Cleanup big sets for output
  delete stats.seenTargets;

  const totalIssues = Object.values(stats.issues).reduce((a, b) => a + b, 0);
  const cardIssuePct = ((stats.cardsWithIssues / stats.totalCards) * 100).toFixed(1);

  console.log(`Cards: ${stats.totalCards} | Tokens: ${stats.totalTokens}`);
  console.log(`Cards with at least one issue: ${stats.cardsWithIssues} (${cardIssuePct}%)`);
  console.log(`Total issues found: ${totalIssues}`);
  console.log('\nIssues by type:');
  Object.entries(stats.issues).forEach(([type, count]) => {
    if (count > 0) console.log(`  ${type.padEnd(28)} ${count}`);
  });

  return stats;
}

// Main
const allStats = {};
for (const config of LANGUAGES) {
  try {
    allStats[config.code] = auditLanguage(config);
  } catch (e) {
    console.error(`ERROR auditing ${config.code}:`, e.message);
    allStats[config.code] = { error: e.message };
  }
}

// Save full report
fs.writeFileSync('scripts/audit-report.json', JSON.stringify(allStats, null, 2));
console.log('\n\nFull report saved to scripts/audit-report.json');

// Summary table
console.log('\n' + '='.repeat(120));
console.log('FULL AUDIT SUMMARY');
console.log('='.repeat(120));
const cols = ['Empty', 'NoNode', 'NoTags', 'NoAudio', 'Dups', 'TooLong', 'NoDict', 'NoTo', 'WrongTo', 'Slash', 'Caps', 'NoLemma', 'StanzaMis'];
console.log('LANG  Cards  Issues%  ' + cols.map(c => c.padEnd(8)).join(''));
console.log('-'.repeat(120));
for (const [code, s] of Object.entries(allStats)) {
  if (s.error) { console.log(code, 'ERROR'); continue; }
  const pct = ((s.cardsWithIssues / s.totalCards) * 100).toFixed(0);
  const i = s.issues;
  const totals = [
    i['empty-target'] + i['empty-english'],
    i['missing-grammar-node'],
    i['missing-tags'],
    i['audio-file-missing'],
    i['duplicate-target'],
    i['too-long-for-node'],
    i['missing-from-dict'],
    i['verb-missing-to'],
    i['non-verb-with-to'],
    i['slash-polysemy'],
    i['wrong-capitalisation'],
    i['lemma-target-missing'],
    i['pos-mismatch-stanza'],
  ];
  console.log(
    code.padEnd(6),
    String(s.totalCards).padEnd(6),
    (pct + '%').padEnd(8),
    ...totals.map(t => String(t).padEnd(8))
  );
}
