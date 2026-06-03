#!/usr/bin/env node
/**
 * Rebuild Dutch dictionary v3 – uses shared pipeline utilities.
 *
 * Steps:
 *  1. Dutch function word table (~150 entries, never sent to Google)
 *  2. Collect all words from deck, tokenize
 *  3. Google Translate non-function words via translateBatch() with truncation retry
 *  4. Post-process every result via postProcess() (all 18 rules)
 *  5. Remove bad lemma entries (lemma field points to non-existent base)
 *  6. Strict lemma copy: conjugated forms get lemma's definition
 *  7. Card-context validation: check definition against card English
 *  8. Apply to nl.ts, preserve IPA/lemma/pos + IRREGULAR_MAP + CONTRACTION_MAP + lookupWord
 *  9. 100-entry random review -> scripts/output/nl-v3-review.md
 *
 * NOTE: Dutch dict uses `const dictionary: Record<string, DictEntry>`.
 */

const fs = require('fs');
const path = require('path');
const { translateBatch, tokenize } = require('./rebuild-utils.cjs');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DECK_PATH = path.join(ROOT, 'src/data/dutch/deck.json');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/nl.ts');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

// ──────────────────────────────────────────────────────────────
// Step 1: Dutch function word table (~150 entries)
// ──────────────────────────────────────────────────────────────
const FUNCTION_WORDS = {
  // ── Articles ──
  'de': 'the (common)', 'het': 'the (neuter)', 'een': 'a, an',

  // ── Personal pronouns ──
  'ik': 'I', 'jij': 'you (informal)', 'je': 'you (informal)',
  'hij': 'he', 'zij': 'she, they', 'ze': 'she, they',
  'wij': 'we', 'we': 'we', 'jullie': 'you (plural)',
  'u': 'you (formal)',

  // ── Object / reflexive pronouns ──
  'mij': 'me', 'me': 'me', 'jou': 'you (obj.)',
  'hem': 'him', 'haar': 'her, their',
  'ons': 'us, our', 'hen': 'them (obj.)', 'hun': 'them, their',

  // ── Possessive pronouns ──
  'mijn': 'my', 'jouw': 'your (informal)',
  'zijn': 'his, its; to be', 'onze': 'our',

  // ── Interrogative pronouns ──
  'wie': 'who', 'wat': 'what', 'waar': 'where',
  'wanneer': 'when', 'hoe': 'how', 'waarom': 'why',
  'welk': 'which (neuter)', 'welke': 'which (common/pl.)',

  // ── Prepositions ──
  'in': 'in, into', 'op': 'on, at', 'aan': 'at, on, to',
  'met': 'with', 'van': 'of, from', 'voor': 'for, before',
  'naar': 'to, toward', 'uit': 'out, from',
  'bij': 'at, near, with', 'over': 'over, about',
  'om': 'around, at', 'door': 'through, by',
  'tegen': 'against', 'tussen': 'between',
  'onder': 'under, among', 'boven': 'above, upstairs',
  'achter': 'behind', 'naast': 'next to, beside',
  'langs': 'along, past', 'zonder': 'without',
  'tijdens': 'during', 'sinds': 'since', 'tot': 'until, to',

  // ── Conjunctions ──
  'en': 'and', 'of': 'or', 'maar': 'but',
  'want': 'because, for', 'dus': 'so, therefore',
  'als': 'if, when, as', 'dat': 'that',
  'toen': 'then, when', 'terwijl': 'while',
  'hoewel': 'although', 'omdat': 'because',
  'doordat': 'because, due to', 'zodat': 'so that',
  'voordat': 'before', 'nadat': 'after',

  // ── Adverbs ──
  'zeer': 'very', 'ook': 'also, too', 'al': 'already',
  'nog': 'still, yet', 'niet': 'not',
  'nooit': 'never', 'altijd': 'always', 'vaak': 'often',
  'hier': 'here', 'daar': 'there',
  'nu': 'now', 'dan': 'then',
  'goed': 'good, well', 'slecht': 'bad, badly',
  'meer': 'more', 'minder': 'less',
  'heel': 'very, whole', 'erg': 'very, bad',
  'wel': 'well, indeed', 'toch': 'yet, still, anyway',
  'graag': 'gladly, willingly',
  'misschien': 'maybe, perhaps',
  'eigenlijk': 'actually, really',
  'natuurlijk': 'naturally, of course',
  'zeker': 'certainly, sure',

  // ── Auxiliaries: zijn (to be) ──
  'ben': 'am', 'bent': 'are (you)', 'is': 'is',
  // 'zijn' already defined in possessives above
  'was': 'was', 'waren': 'were',

  // ── Auxiliaries: hebben (to have) ──
  'heb': 'have', 'hebt': 'have (you)', 'heeft': 'has',
  'hebben': 'to have', 'had': 'had', 'hadden': 'had (pl.)',

  // ── Auxiliaries: worden (to become) ──
  'word': 'become', 'wordt': 'become (you/he)',
  'worden': 'to become', 'werd': 'became', 'werden': 'became (pl.)',

  // ── Auxiliaries: zullen (shall/will) ──
  'zal': 'will, shall', 'zult': 'will (you)',
  'zullen': 'will, shall', 'zou': 'would', 'zouden': 'would (pl.)',

  // ── Modals: kunnen (can) ──
  'kan': 'can', 'kunt': 'can (you)', 'kunnen': 'to be able to',
  'kon': 'could', 'konden': 'could (pl.)',

  // ── Modals: mogen (may) ──
  'mag': 'may', 'mogen': 'to be allowed to', 'mocht': 'might, was allowed to',

  // ── Modals: moeten (must) ──
  'moet': 'must, have to', 'moeten': 'to have to', 'moest': 'had to',

  // ── Modals: willen (to want) ──
  'wil': 'want to', 'wilt': 'want to (you)',
  'willen': 'to want to', 'wilde': 'wanted to',
};

// ──────────────────────────────────────────────────────────────
// Step 2: Collect all words from the deck
// ──────────────────────────────────────────────────────────────
function collectDeckWords() {
  const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
  const wordFreq = new Map();
  const wordCards = new Map(); // word -> [{target, english}, ...]

  for (const card of deck) {
    const tokens = tokenize(card.target, 'dutch');
    for (const tok of tokens) {
      const w = tok.trim()
        .toLowerCase()
        .replace(/[''""«»\u200B\u200C\u200D\uFEFF]/g, '') // strip curly quotes, ZWJ
        .replace(/^[––\-]+|[––\-]+$/g, '')                  // strip leading/trailing dashes
        .trim();
      if (!w) continue;
      // Skip single-char tokens
      if (w.length < 2) continue;
      // Only keep Latin-script tokens (Dutch uses Latin + occasional diacritics)
      if (!/[a-zà-ÿëïöüé]/i.test(w)) continue;
      wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
      if (!wordCards.has(w)) wordCards.set(w, []);
      wordCards.get(w).push({ target: card.target, english: card.english });
    }
  }

  console.log(`Deck has ${deck.length} cards, ${wordFreq.size} unique tokens`);
  return { wordFreq, wordCards };
}

// ──────────────────────────────────────────────────────────────
// Parse existing dictionary for IPA / POS / lemma
// Dutch dict uses `const dictionary: Record<string, DictEntry> = {`
// ──────────────────────────────────────────────────────────────
function parseExistingDict() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const existing = {};

  // Match entries: 'key': { en: 'x', ipa: 'y', pos: 'z' },
  // or "key": { en: 'x', ipa: 'y', pos: 'z', lemma: 'w' },
  const entryRe = /^\s*(?:'([^']+)'|"([^"]+)"):\s*\{\s*en:\s*'([^']*)',\s*ipa:\s*'([^']*)',\s*pos:\s*'([^']*)'\s*(?:,\s*lemma:\s*'([^']*)')?\s*\}/gm;
  let m;
  while ((m = entryRe.exec(src)) !== null) {
    const key = m[1] || m[2];
    existing[key] = {
      en: m[3],
      ipa: m[4],
      pos: m[5],
      lemma: m[6] || null,
    };
  }

  // Extract header: everything before `const dictionary: Record<string, DictEntry> = {`
  const dictStart = 'const dictionary: Record<string, DictEntry> = {';
  const dictStartIdx = src.indexOf(dictStart);
  const header = dictStartIdx >= 0 ? src.slice(0, dictStartIdx) : '';

  // Extract footer: everything after the dictionary's closing `};`
  let footer = '';
  if (dictStartIdx >= 0) {
    const afterDict = src.slice(dictStartIdx);
    const lines = afterDict.split('\n');
    let braceDepth = 0;
    let dictEndLine = -1;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const ch of line) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
      }
      if (braceDepth === 0 && i > 0) {
        dictEndLine = i;
        break;
      }
    }
    if (dictEndLine >= 0) {
      footer = '\n' + lines.slice(dictEndLine + 1).join('\n');
    }
  }

  console.log(`Parsed ${Object.keys(existing).length} existing entries`);
  return { existing, header, footer };
}

// ──────────────────────────────────────────────────────────────
// Common English stop words for card-context matching
// ──────────────────────────────────────────────────────────────
const COMMON_ENG_STOP = new Set([
  'the', 'a', 'an', 'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should',
  'may', 'might', 'can', 'could', 'must', 'not', 'and', 'but', 'or', 'so',
  'if', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'from', 'up',
  'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'under', 'over', 'that', 'this', 'these', 'those', 'it', 'its',
  'my', 'your', 'his', 'her', 'our', 'their', 'we', 'they', 'he', 'she',
  'you', 'me', 'him', 'us', 'them', 'who', 'whom', 'which', 'what', 'where',
  'when', 'how', 'very', 'just', 'also', 'too', 'only', 'than', 'then', 'now',
]);

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Dutch Dictionary Rebuild v3 ===\n');

  // Step 2: Collect deck words
  const { wordFreq, wordCards } = collectDeckWords();

  // Read existing dictionary for IPA/POS/lemma preservation
  const { existing, header, footer } = parseExistingDict();

  // Separate function words from words needing translation
  const needTranslation = [];
  const functionResults = {};

  for (const [word] of wordFreq) {
    if (FUNCTION_WORDS[word]) {
      functionResults[word] = FUNCTION_WORDS[word];
    } else {
      needTranslation.push(word);
    }
  }

  console.log(`Function words: ${Object.keys(functionResults).length}`);
  console.log(`Words needing Google translation: ${needTranslation.length}`);

  // Step 3: Google Translate with truncation retry
  console.log('\nStep 3: Translating via Google...');
  const googleRaw = await translateBatch(needTranslation, 'nl');
  console.log(`Got ${Object.keys(googleRaw).length} translations from Google`);

  // Step 4: Post-process all 18 rules
  console.log('\nStep 4: Post-processing...');
  const stats = new PostProcessStats();
  const processed = {};

  // Process function words (hand-curated, no post-processing)
  for (const [word, def] of Object.entries(functionResults)) {
    processed[word] = { en: def, source: 'function_table' };
  }

  // Process Google results
  for (const [word, rawTrans] of Object.entries(googleRaw)) {
    const existingPos = existing[word]?.pos || 'n';
    const result = postProcess(rawTrans, existingPos, word, stats);
    processed[word] = { en: result.text, source: 'google', flagged: result.flagged, flagReasons: result.flagReasons };
  }

  console.log('\n' + stats.report());

  // Step 5: Bad lemma removal
  console.log('\nStep 5: Bad lemma removal...');
  let badLemmaCount = 0;
  for (const [word, ex] of Object.entries(existing)) {
    if (ex.lemma && !existing[ex.lemma] && !processed[ex.lemma]) {
      // Lemma points to a non-existent base word – clear it
      ex.lemma = null;
      badLemmaCount++;
    }
  }
  console.log(`Removed ${badLemmaCount} bad lemma references`);

  // Step 6: Strict lemma copy
  console.log('\nStep 6: Lemma copy...');
  let lemmaCopied = 0;
  for (const [word, ex] of Object.entries(existing)) {
    if (ex.lemma && processed[ex.lemma] && processed[word]) {
      // Copy the lemma's NEW definition to this conjugated form
      processed[word].en = processed[ex.lemma].en;
      lemmaCopied++;
    }
  }
  console.log(`Copied lemma definitions for ${lemmaCopied} entries`);

  // Step 7: Card-context validation
  console.log('\nStep 7: Card-context validation...');
  let contextFixed = 0;
  for (const [word, entry] of Object.entries(processed)) {
    if (entry.source === 'function_table') continue;
    if (!wordCards.has(word)) continue;

    const cards = wordCards.get(word);
    const currentDef = entry.en.replace(/^to /, '').toLowerCase();

    // Check if current definition appears in any card's English
    let defFoundInCard = false;
    for (const card of cards) {
      if (card.english.toLowerCase().includes(currentDef)) {
        defFoundInCard = true;
        break;
      }
    }

    if (!defFoundInCard && cards.length > 0) {
      // If existing dictionary had a definition that fits cards better, prefer it
      if (existing[word]) {
        const oldDef = existing[word].en.replace(/^to /, '').toLowerCase();
        for (const card of cards) {
          if (card.english.toLowerCase().includes(oldDef)) {
            entry.en = existing[word].en;
            contextFixed++;
            break;
          }
        }
      }
    }
  }
  console.log(`Context-fixed ${contextFixed} entries`);

  // Step 8: Build and write dictionary
  console.log('\nStep 8: Writing dictionary...');
  const entries = [];
  const allWords = [...wordFreq.keys()].sort((a, b) => a.localeCompare(b, 'nl'));

  // Also include existing dictionary words that aren't in the deck (preserve them)
  for (const word of Object.keys(existing)) {
    if (!wordFreq.has(word)) {
      allWords.push(word);
    }
  }
  allWords.sort((a, b) => a.localeCompare(b, 'nl'));

  // Deduplicate
  const seenWords = new Set();
  const dedupedWords = [];
  for (const w of allWords) {
    if (!seenWords.has(w)) {
      seenWords.add(w);
      dedupedWords.push(w);
    }
  }

  for (const word of dedupedWords) {
    const proc = processed[word];
    const ex = existing[word] || {};
    const ipa = ex.ipa || '';
    const pos = ex.pos || (proc ? (proc.en.startsWith('to ') ? 'v' : 'n') : 'n');
    const lemma = ex.lemma || null;
    let en = proc ? proc.en : ex.en;

    if (!en) continue; // No definition available

    // Force lowercase for non-proper nouns
    if (en.length > 0 && en[0] === en[0].toUpperCase() && en[0] !== en[0].toLowerCase()) {
      const existingEn = ex.en || '';
      const existingWasCapitalized = existingEn.length > 0 && existingEn[0] === existingEn[0].toUpperCase() && existingEn[0] !== existingEn[0].toLowerCase();
      const isProperNoun = /^(Netherlands|Amsterdam|Rotterdam|Utrecht|The Hague|Den Haag|Eindhoven|Groningen|Maastricht|Christmas|Easter|Europe|Belgium|Suriname)$/i.test(en);
      if (!existingWasCapitalized && !isProperNoun) {
        en = en[0].toLowerCase() + en.slice(1);
      }
    }

    // Ensure verbs have "to " prefix
    if (pos === 'v' && !en.startsWith('to ') && !en.includes(';')) {
      en = 'to ' + en;
    }
    // Ensure non-verbs don't have "to " prefix
    if (pos !== 'v' && en.startsWith('to ') && !en.startsWith('to the') && !en.includes(';')) {
      en = en.replace(/^to /, '');
    }

    // Escape single quotes in values
    const enEsc = en.replace(/'/g, "\\'");
    const ipaEsc = ipa.replace(/'/g, "\\'");

    // Use double quotes for word keys that contain apostrophes
    const wordHasQuote = word.includes("'") || word.includes('\u2019') || word.includes('\u2018');
    const wordQuote = wordHasQuote ? '"' : "'";
    let line = `  ${wordQuote}${word}${wordQuote}: { en: '${enEsc}', ipa: '${ipaEsc}', pos: '${pos}'`;
    if (lemma) {
      line += `, lemma: '${lemma}'`;
    }
    line += ' },';
    entries.push(line);
  }

  // Dutch dict uses `const dictionary`
  const dictContent = header
    + 'const dictionary: Record<string, DictEntry> = {\n'
    + entries.join('\n') + '\n'
    + '};'
    + footer;

  fs.writeFileSync(DICT_PATH, dictContent, 'utf8');
  console.log(`Wrote ${entries.length} entries to ${DICT_PATH}`);

  // Step 9: 100-entry review
  console.log('\nStep 9: Running 100-entry review...');
  const reviewResults = [];
  const allEntryWords = dedupedWords.filter(w => processed[w]);
  const sampleSize = Math.min(100, allEntryWords.length);
  const sample = [];

  // Random sample
  const indices = new Set();
  while (indices.size < sampleSize) {
    indices.add(Math.floor(Math.random() * allEntryWords.length));
  }
  for (const idx of indices) {
    sample.push(allEntryWords[idx]);
  }

  let pass = 0, fail = 0;
  const issues = [];

  for (const word of sample) {
    const proc = processed[word];
    const ex = existing[word] || {};
    const pos = ex.pos || (proc.en.startsWith('to ') ? 'v' : 'n');
    const en = proc.en;
    const problems = [];

    // 1. Wrong "to " prefix on nouns
    if (pos === 'n' && en.startsWith('to ') && !en.startsWith('to the') && !en.includes(';')) {
      problems.push('wrong_to_on_noun');
    }
    // 2. Missing "to " on verbs
    if (pos === 'v' && !en.startsWith('to ') && !en.includes(';')) {
      problems.push('missing_to_on_verb');
    }
    // 3. Conjugated English forms
    if (/\b(eats|goes|comes|reads|writes|runs|sees|gives|takes|makes|knows|thinks|says|gets|wants|works|plays|lives|loves|feels|finds|tells|asks|uses|tries|needs|keeps|brings|starts|moves|pays|meets|calls|shows|helps)\b/i.test(en)) {
      problems.push('conjugated_english');
    }
    if (/\b\w+ing\b/.test(en.replace(/^to /, '')) && !/(thing|morning|evening|ring|king|spring|string|sing|bring|nothing|something|anything|everything|ceiling|feeling|building|wedding|clothing|warning|opening|meaning|meeting|setting|beginning|during|amazing|interesting|willing|missing|fishing|cooking|swimming|parking|reading|living|working|shopping|nursing|banking|housing)/.test(en)) {
      problems.push('conjugated_english_ing');
    }
    if (/\b(went|came|saw|gave|took|made|knew|thought|told|found|left|kept|brought|bought|sold|caught|taught|built|sent|spent|lost|won|met|led|heard|felt|stood|sat|ran|hung|held|lay|paid|said|wore|ate|drank|drove|wrote|broke|spoke|chose|grew|threw|drew|flew|froze|rode|rose|shook|stole|swore|tore|woke)\b/.test(en.replace(/^to /, ''))) {
      problems.push('conjugated_english_past');
    }
    // 4. Mixed case in definition
    if (/[a-z][A-Z]/.test(en)) {
      problems.push('mixed_case');
    }
    // 5. ALL CAPS
    if (/^[A-Z]{2,}$/.test(en)) {
      problems.push('all_caps');
    }
    // 6. Self-referencing
    if (proc.flagReasons && proc.flagReasons.includes('self_referencing')) {
      problems.push('self_referencing');
    }
    // 7. Grammar descriptions in definitions
    if (/\b(conjugat|declens|tense|plural|singular|masculine|feminine|suffix|prefix|inflect|grammar)\b/i.test(en)) {
      problems.push('grammar_description');
    }
    // 8. Truncated / placeholder
    if (en === '?' || en.length < 2) {
      problems.push('truncated');
    }
    // 9. Wrong POS
    if (proc.flagReasons && proc.flagReasons.includes('wrong_pos')) {
      problems.push('wrong_pos');
    }

    if (problems.length === 0) {
      pass++;
      reviewResults.push({ word, en, pos, status: 'PASS' });
    } else {
      fail++;
      reviewResults.push({ word, en, pos, status: 'FAIL', problems });
      issues.push({ word, en, pos, problems });
    }
  }

  const grade = pass >= 90 ? 'A' : pass >= 80 ? 'B' : pass >= 70 ? 'C' : pass >= 60 ? 'D' : 'F';

  // Write review
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let md = `# Dutch Dictionary v3 Rebuild - 100-Entry Review\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total entries written:** ${entries.length}\n`;
  md += `**Function words:** ${Object.keys(functionResults).length}\n`;
  md += `**Google translated:** ${Object.keys(googleRaw).length}\n`;
  md += `**Lemma-copied:** ${lemmaCopied}\n`;
  md += `**Bad lemmas removed:** ${badLemmaCount}\n`;
  md += `**Context-fixed:** ${contextFixed}\n\n`;
  md += `## Review Results\n\n`;
  md += `**Pass:** ${pass} / ${sampleSize}\n`;
  md += `**Fail:** ${fail} / ${sampleSize}\n`;
  md += `**Grade:** ${grade}\n\n`;

  if (issues.length > 0) {
    md += `## Issues Found\n\n`;
    md += `| Word | English | POS | Problems |\n`;
    md += `|------|---------|-----|----------|\n`;
    for (const i of issues) {
      md += `| ${i.word} | ${i.en} | ${i.pos} | ${i.problems.join(', ')} |\n`;
    }
    md += '\n';
  }

  md += `## Full Sample\n\n`;
  md += `| # | Word | English | POS | Status |\n`;
  md += `|---|------|---------|-----|--------|\n`;
  for (let i = 0; i < reviewResults.length; i++) {
    const r = reviewResults[i];
    md += `| ${i + 1} | ${r.word} | ${r.en} | ${r.pos} | ${r.status} |\n`;
  }

  md += `\n## Post-Processing Stats\n\n\`\`\`\n${stats.report()}\n\`\`\`\n`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'nl-v3-review.md'), md, 'utf8');
  console.log(`\nReview written to scripts/output/nl-v3-review.md`);
  console.log(`Grade: ${grade} (${pass}/${sampleSize} pass)`);
}

main().catch(e => { console.error(e); process.exit(1); });
