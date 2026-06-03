#!/usr/bin/env node
/**
 * Rebuild Russian dictionary v3 – uses shared pipeline utilities.
 *
 * Steps:
 *  1. Russian function word table (~150 entries, never sent to Google)
 *  2. Collect all words from deck, tokenize, build frequency map
 *  3. Google Translate non-function words via translateBatch()
 *  4. Post-process every result via postProcess()
 *  5. Strict lemma copy: conjugated forms get lemma's definition
 *  6. Card-context validation: check definition against card English
 *  7. Preserve existing IPA / POS / lemma from current dictionary
 *  8. Write directly to src/data/dictionary/ru.ts
 *  9. 100-entry random review → scripts/output/ru-v3-review.md
 */

const fs = require('fs');
const path = require('path');
const { translateBatch, tokenize } = require('./rebuild-utils.cjs');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DECK_PATH = path.join(ROOT, 'src/data/russian/deck.json');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/ru.ts');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

// ──────────────────────────────────────────────────────────────
// Step 1: Russian function word table (~150 entries)
// ──────────────────────────────────────────────────────────────
const FUNCTION_WORDS = {
  // ── Pronouns ──
  'я': 'I', 'ты': 'you', 'он': 'he', 'она': 'she', 'оно': 'it',
  'мы': 'we', 'вы': 'you', 'они': 'they',
  'меня': 'me', 'тебя': 'you', 'его': 'his/him', 'её': 'her',
  'нас': 'us', 'вас': 'you', 'их': 'their/them',
  'мне': 'to me', 'тебе': 'to you', 'ему': 'to him', 'ей': 'to her',
  'нам': 'to us', 'вам': 'to you', 'им': 'to them',
  'мной': 'with me', 'тобой': 'with you', 'нами': 'with us', 'вами': 'with you', 'ими': 'with them',
  // Possessives
  'мой': 'my', 'моя': 'my', 'моё': 'my', 'мои': 'my',
  'твой': 'your', 'твоя': 'your',
  'наш': 'our', 'наша': 'our', 'наше': 'our', 'наши': 'our',
  'ваш': 'your', 'ваша': 'your', 'ваше': 'your', 'ваши': 'your',
  'свой': 'one\'s own', 'своя': 'one\'s own', 'своё': 'one\'s own', 'свои': 'one\'s own',
  // Interrogatives / relatives
  'кто': 'who', 'что': 'what', 'где': 'where', 'куда': 'where to', 'откуда': 'from where',
  'когда': 'when', 'как': 'how', 'почему': 'why', 'зачем': 'what for',
  'какой': 'which', 'какая': 'which', 'какое': 'which', 'какие': 'which',
  'сколько': 'how much', 'чей': 'whose',

  // ── Prepositions ──
  'в': 'in', 'на': 'on', 'с': 'with', 'к': 'to', 'у': 'at/by',
  'о': 'about', 'из': 'from', 'за': 'behind/for', 'по': 'along/by',
  'от': 'from', 'до': 'until/to', 'без': 'without', 'для': 'for',
  'через': 'through', 'между': 'between', 'над': 'above', 'под': 'under',
  'перед': 'before/in front of', 'при': 'at/during', 'около': 'near',
  'после': 'after', 'против': 'against',

  // ── Conjunctions ──
  'и': 'and', 'а': 'and/but', 'но': 'but', 'или': 'or',
  'чтобы': 'in order to', 'если': 'if',
  'потому': 'because', 'хотя': 'although', 'пока': 'while',

  // ── Particles ──
  'не': 'not', 'ни': 'neither/nor', 'же': 'emphasis particle', 'ли': 'question particle',
  'бы': 'would', 'да': 'yes', 'нет': 'no',
  'вот': 'here is', 'ещё': 'still/more', 'уже': 'already',
  'тоже': 'also', 'тут': 'here', 'там': 'there',
  'здесь': 'here', 'сейчас': 'now', 'потом': 'then/later',
  'очень': 'very', 'только': 'only', 'ведь': 'after all',
  'даже': 'even',

  // ── Common adverbs ──
  'всегда': 'always', 'никогда': 'never', 'часто': 'often',
  'иногда': 'sometimes', 'сегодня': 'today', 'завтра': 'tomorrow',
  'вчера': 'yesterday', 'хорошо': 'well/good', 'плохо': 'badly',
  'быстро': 'quickly', 'медленно': 'slowly', 'больше': 'more',
  'меньше': 'less', 'просто': 'simply', 'точно': 'exactly',
  'конечно': 'of course', 'наверное': 'probably',

  // ── Auxiliaries / copula ──
  'есть': 'is/there is', 'был': 'was', 'была': 'was', 'было': 'was', 'были': 'were',
  'будет': 'will be', 'будут': 'will be', 'буду': 'will be', 'будешь': 'will be',
};

// ──────────────────────────────────────────────────────────────
// Step 2: Collect all words from the deck
// ──────────────────────────────────────────────────────────────
function collectDeckWords() {
  const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
  const wordFreq = new Map();
  const wordCards = new Map(); // word → [{target, english}, ...]

  // Cyrillic Unicode range: \u0400-\u04FF
  const CYRILLIC_RE = /[\u0400-\u04FF]/;

  for (const card of deck) {
    const tokens = tokenize(card.target, 'russian');
    for (const tok of tokens) {
      const w = tok.trim()
        .replace(/[''""«»\u200B\u200C\u200D\uFEFF]/g, '') // strip curly quotes, ZWJ, etc.
        .replace(/^[––\-]+|[––\-]+$/g, '')                  // strip leading/trailing dashes
        .trim()
        .toLowerCase();
      if (!w) continue;
      // Only keep tokens that contain at least one Cyrillic character
      if (!CYRILLIC_RE.test(w)) continue;
      // Skip single-char tokens (usually noise)
      if (w.length < 2) continue;
      wordFreq.set(w, (wordFreq.get(w) || 0) + 1);
      if (!wordCards.has(w)) wordCards.set(w, []);
      wordCards.get(w).push({ target: card.target, english: card.english });
    }
  }

  console.log(`Deck has ${deck.length} cards, ${wordFreq.size} unique tokens`);
  return { wordFreq, wordCards };
}

// ──────────────────────────────────────────────────────────────
// Step 7: Parse existing dictionary for IPA / POS / lemma
// ──────────────────────────────────────────────────────────────
function parseExistingDict() {
  const src = fs.readFileSync(DICT_PATH, 'utf8');
  const existing = {};

  // Match entries like: 'word': { en: 'x', ipa: 'y', pos: 'z' },
  // or with lemma: 'word': { en: 'x', ipa: 'y', pos: 'z', lemma: 'w' },
  const entryRe = /^\s*'([^']+)':\s*\{\s*en:\s*'([^']*)',\s*ipa:\s*'([^']*)',\s*pos:\s*'([^']*)'\s*(?:,\s*lemma:\s*'([^']*)')?\s*\}/gm;
  let m;
  while ((m = entryRe.exec(src)) !== null) {
    existing[m[1]] = {
      en: m[2],
      ipa: m[3],
      pos: m[4],
      lemma: m[5] || null,
    };
  }

  // Extract footer: everything after the dictionary closing '};'
  // In Russian dict, footer starts with "// ── Word form resolution"
  const closingIdx = src.indexOf('\n};\n\n\n\n\n\n// ── Word form resolution');
  let footer = '';
  if (closingIdx >= 0) {
    footer = src.slice(closingIdx + 4); // after '};\n'
  } else {
    // Fallback: find '};\n' followed by word form resolution
    const altIdx = src.indexOf('\n};\n');
    if (altIdx >= 0) {
      const afterClose = src.slice(altIdx + 4);
      if (afterClose.includes('Word form resolution') || afterClose.includes('NOUN_ENDINGS') || afterClose.includes('lookupWord')) {
        footer = afterClose;
      }
    }
  }

  // Extract header (everything before the dictionary object)
  const dictStartIdx = src.indexOf('const dictionary: Record<string, DictEntry> = {');
  const header = dictStartIdx >= 0 ? src.slice(0, dictStartIdx) : '';

  console.log(`Parsed ${Object.keys(existing).length} existing entries`);
  return { existing, header, footer };
}

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Russian Dictionary Rebuild v3 ===\n');

  // Step 2
  const { wordFreq, wordCards } = collectDeckWords();

  // Step 7 (read early so we can merge)
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

  // Step 3: Google Translate
  console.log('\nStep 3: Translating via Google...');
  const googleRaw = await translateBatch(needTranslation, 'ru');
  console.log(`Got ${Object.keys(googleRaw).length} translations from Google`);

  // Step 4: Post-process
  console.log('\nStep 4: Post-processing...');
  const stats = new PostProcessStats();
  const processed = {};

  // Process function words (no post-processing needed – they're hand-curated)
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

  // Step 5: Strict lemma copy
  console.log('\nStep 5: Lemma copy...');
  let lemmaCopied = 0;
  for (const [word, ex] of Object.entries(existing)) {
    if (ex.lemma && processed[ex.lemma] && processed[word]) {
      // Copy the lemma's NEW definition to this conjugated form
      processed[word].en = processed[ex.lemma].en;
      lemmaCopied++;
    }
  }
  console.log(`Copied lemma definitions for ${lemmaCopied} entries`);

  // Step 6: Card-context validation
  console.log('\nStep 6: Card-context validation...');
  let contextFixed = 0;
  for (const [word, entry] of Object.entries(processed)) {
    if (entry.source === 'function_table') continue; // Skip function words
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
      // If existing dictionary had a definition and it's found in cards, prefer it
      if (existing[word]) {
        const oldDef = existing[word].en.replace(/^to /, '').toLowerCase();
        for (const card of cards) {
          if (card.english.toLowerCase().includes(oldDef)) {
            // Old definition was better for card context
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
  const allWords = [...wordFreq.keys()].sort((a, b) => a.localeCompare(b, 'ru'));

  for (const word of allWords) {
    const proc = processed[word];
    if (!proc) continue;

    const ex = existing[word] || {};
    const ipa = ex.ipa || '';
    const pos = ex.pos || (proc.en.startsWith('to ') ? 'v' : 'n');
    const lemma = ex.lemma || null;
    let en = proc.en;

    // The post-process proper noun detector is too aggressive for Russian (all non-Latin source)
    // Strategy: only keep capitalized if the EXISTING dictionary had it capitalized
    // (indicating a hand-verified proper noun like "Байкал", "Москва", etc.)
    if (en.length > 0 && en[0] === en[0].toUpperCase() && en[0] !== en[0].toLowerCase()) {
      const existingEn = ex.en || '';
      const existingWasCapitalized = existingEn.length > 0 && existingEn[0] === existingEn[0].toUpperCase() && existingEn[0] !== existingEn[0].toLowerCase();
      if (!existingWasCapitalized) {
        en = en[0].toLowerCase() + en.slice(1);
      }
    }

    // Ensure verbs have "to " prefix
    if (pos === 'v' && !en.startsWith('to ')) {
      en = 'to ' + en;
    }
    // Ensure non-verbs don't have "to " prefix (unless it's a real phrase like "to the")
    if (pos !== 'v' && en.startsWith('to ') && !en.startsWith('to the')) {
      en = en.replace(/^to /, '');
    }

    // Escape single quotes in values
    const enEsc = en.replace(/'/g, "\\'");
    const ipaEsc = ipa.replace(/'/g, "\\'");

    // Use double quotes for word keys that contain single quotes or special chars
    const wordHasQuote = word.includes("'") || word.includes('\u2019') || word.includes('\u2018');
    const wordQuote = wordHasQuote ? '"' : "'";
    let line = `  ${wordQuote}${word}${wordQuote}: { en: '${enEsc}', ipa: '${ipaEsc}', pos: '${pos}'`;
    if (lemma) {
      line += `, lemma: '${lemma}'`;
    }
    line += ' },';
    entries.push(line);
  }

  const dictContent = header
    + 'const dictionary: Record<string, DictEntry> = {\n'
    + entries.join('\n') + '\n'
    + '};\n'
    + '\n'
    + footer;

  fs.writeFileSync(DICT_PATH, dictContent, 'utf8');
  console.log(`Wrote ${entries.length} entries to ${DICT_PATH}`);

  // Step 9: 100-entry review
  console.log('\nStep 9: Running 100-entry review...');
  const reviewResults = [];
  const allEntryWords = allWords.filter(w => processed[w]);
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
    if (pos === 'n' && en.startsWith('to ') && !en.startsWith('to the')) {
      problems.push('wrong_to_on_noun');
    }
    // 2. Missing "to " on verbs
    if (pos === 'v' && !en.startsWith('to ')) {
      problems.push('missing_to_on_verb');
    }
    // 3. Conjugated English (eats, went, reading)
    if (/\b(eats|goes|comes|reads|writes|runs|sees|gives|takes|makes|knows|thinks|says|gets|wants|works|plays|lives|loves|feels|finds|tells|asks|uses|tries|needs|keeps|brings|starts|moves|pays|meets|calls|shows|helps)\b/i.test(en)) {
      problems.push('conjugated_english');
    }
    if (/\b\w+ing\b/.test(en.replace(/^to /, '')) && !/(thing|morning|evening|ring|king|spring|string|sing|bring|nothing|something|anything|everything|ceiling|feeling|building|wedding|clothing|warning|opening|meaning|meeting|setting|beginning|during|amazing|interesting|willing|missing|fishing|cooking|swimming|parking|reading|living|working|shopping|nursing|banking|housing|nothing|something|anything|everything)/.test(en)) {
      problems.push('conjugated_english_ing');
    }
    if (/\b(went|came|saw|gave|took|made|knew|thought|told|found|left|kept|brought|bought|sold|caught|taught|built|sent|spent|lost|won|met|led|read|heard|felt|stood|sat|ran|hung|held|lay|paid|said|wore|ate|drank|drove|wrote|broke|spoke|chose|grew|threw|drew|flew|froze|rode|rose|shook|stole|swore|tore|woke|bore|bit|blew|fought|forgot|hid|hit|hurt|knelt|meant|proved|put|quit|rid|sought|shut|sank|slid|split|spread|stuck|stung|struck|swung|wept|wound)\b/.test(en.replace(/^to /, ''))) {
      problems.push('conjugated_english_past');
    }
    // 4. Mixed case
    if (/[a-z][A-Z]/.test(en)) {
      problems.push('mixed_case');
    }
    // 5. Self-referencing (English looks like transliteration of Russian)
    if (proc.flagReasons && proc.flagReasons.includes('self_referencing')) {
      problems.push('self_referencing');
    }
    // 6. Grammar descriptions
    if (/\b(conjugat|declens|tense|plural|singular|masculine|feminine|suffix|prefix|inflect|grammar)\b/i.test(en)) {
      problems.push('grammar_description');
    }
    // 7. Truncated
    if (en === '?' || en.length < 2) {
      problems.push('truncated');
    }
    // 8. "?" placeholder
    if (en.includes('?')) {
      problems.push('question_mark');
    }
    // 9. Proper noun lowercase
    if (proc.flagReasons && proc.flagReasons.includes('proper_noun')) {
      if (en[0] !== en[0].toUpperCase()) {
        problems.push('proper_noun_lowercase');
      }
    }
    // 10. Wrong POS (basic check)
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

  let md = `# Russian Dictionary v3 Rebuild – 100-Entry Review\n\n`;
  md += `**Date:** ${new Date().toISOString().split('T')[0]}\n`;
  md += `**Total entries written:** ${entries.length}\n`;
  md += `**Function words:** ${Object.keys(functionResults).length}\n`;
  md += `**Google translated:** ${Object.keys(googleRaw).length}\n`;
  md += `**Lemma-copied:** ${lemmaCopied}\n`;
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

  fs.writeFileSync(path.join(OUTPUT_DIR, 'ru-v3-review.md'), md, 'utf8');
  console.log(`\nReview written to scripts/output/ru-v3-review.md`);
  console.log(`Grade: ${grade} (${pass}/${sampleSize} pass)`);
}

// Common English stop words for card-context matching
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

main().catch(e => { console.error(e); process.exit(1); });
