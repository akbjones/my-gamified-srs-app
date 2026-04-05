#!/usr/bin/env node
/**
 * Rebuild Portuguese dictionary v3 — uses shared pipeline utilities.
 *
 * Steps:
 *  1. Portuguese function word table (~180 entries, never sent to Google)
 *  2. Collect all words from deck, tokenize
 *  3. Google Translate non-function words via translateBatch() with truncation retry
 *  4. Post-process every result via postProcess() (all 18 rules)
 *  5. Remove bad lemma entries (lemma field points to non-existent base)
 *  6. Strict lemma copy: conjugated forms get lemma's definition
 *  7. Card-context validation: check definition against card English
 *  8. Apply to pt.ts, preserve IPA/lemma/pos + lookupWord + helpers
 *  9. 100-entry random review -> scripts/output/pt-v3-review.md
 *
 * NOTE: Portuguese dict uses `const dictionary: Record<string, DictEntry> = {`
 */

const fs = require('fs');
const path = require('path');
const { translateBatch, tokenize } = require('./rebuild-utils.cjs');
const { postProcess, PostProcessStats } = require('./post-process-google.cjs');

const ROOT = path.resolve(__dirname, '..');
const DECK_PATH = path.join(ROOT, 'src/data/portuguese/deck.json');
const DICT_PATH = path.join(ROOT, 'src/data/dictionary/pt.ts');
const OUTPUT_DIR = path.join(ROOT, 'scripts/output');

// ──────────────────────────────────────────────────────────────
// Step 1: Portuguese function word table (~180 entries)
// ──────────────────────────────────────────────────────────────
const FUNCTION_WORDS = {
  // ── Articles ──
  'o': 'the (masc. sg.)', 'a': 'the (fem. sg.)',
  'os': 'the (masc. pl.)', 'as': 'the (fem. pl.)',
  'um': 'a, one (masc.)', 'uma': 'a, one (fem.)',
  'uns': 'some (masc.)', 'umas': 'some (fem.)',

  // ── Contracted articles ──
  'do': 'of the (masc. sg.)', 'da': 'of the (fem. sg.)',
  'dos': 'of the (masc. pl.)', 'das': 'of the (fem. pl.)',
  'no': 'in the (masc. sg.)', 'na': 'in the (fem. sg.)',
  'nos': 'in the (masc. pl.); us', 'nas': 'in the (fem. pl.)',
  'ao': 'to the (masc. sg.)', 'à': 'to the (fem. sg.)',
  'aos': 'to the (masc. pl.)', 'às': 'to the (fem. pl.)',
  'pelo': 'by the (masc. sg.)', 'pela': 'by the (fem. sg.)',
  'pelos': 'by the (masc. pl.)', 'pelas': 'by the (fem. pl.)',

  // ── Personal pronouns ──
  'eu': 'I', 'tu': 'you (informal sg.)',
  'ele': 'he', 'ela': 'she',
  'nós': 'we', 'vós': 'you (formal pl.)',
  'eles': 'they (masc.)', 'elas': 'they (fem.)',
  'você': 'you (formal sg.)', 'vocês': 'you (pl.)',

  // ── Object / reflexive pronouns ──
  'me': 'me, myself', 'te': 'you, yourself',
  'se': 'himself, herself, itself, themselves',
  'lhe': 'to him, to her', 'lhes': 'to them',
  'mim': 'me (after prep.)', 'ti': 'you (after prep.)',
  'si': 'himself, herself (after prep.)',

  // ── Possessives ──
  'meu': 'my (masc.)', 'minha': 'my (fem.)',
  'teu': 'your (masc. informal)', 'tua': 'your (fem. informal)',
  'seu': 'his, her, your (masc.)', 'sua': 'his, her, your (fem.)',
  'nosso': 'our (masc.)', 'nossa': 'our (fem.)',

  // ── Interrogatives / relatives ──
  'quem': 'who', 'que': 'that, which, what',
  'qual': 'which', 'quanto': 'how much',
  'onde': 'where', 'como': 'how, like, as',
  'quando': 'when', 'por que': 'why',

  // ── Prepositions ──
  'de': 'of, from', 'em': 'in, on, at',
  'com': 'with', 'por': 'by, for, through',
  'para': 'for, to', 'sem': 'without',
  'sobre': 'about, on, over', 'entre': 'between, among',
  'até': 'until, even', 'desde': 'since, from',
  'durante': 'during', 'contra': 'against',
  'após': 'after', 'sob': 'under',
  'perante': 'before, in the presence of',

  // ── Conjunctions ──
  'e': 'and', 'ou': 'or', 'mas': 'but',
  'porém': 'however', 'nem': 'neither, nor',
  'se': 'if', 'porque': 'because',
  'embora': 'although', 'enquanto': 'while',
  'pois': 'because, since, well',

  // ── Adverbs ──
  'muito': 'very, much', 'também': 'also, too',
  'já': 'already, now', 'ainda': 'still, yet',
  'sempre': 'always', 'nunca': 'never',
  'aqui': 'here', 'ali': 'there (nearby)',
  'lá': 'there (far)', 'hoje': 'today',
  'ontem': 'yesterday', 'amanhã': 'tomorrow',
  'agora': 'now', 'bem': 'well',
  'mal': 'badly, hardly', 'mais': 'more, most',
  'menos': 'less, fewer', 'só': 'only, alone',
  'quase': 'almost', 'talvez': 'perhaps, maybe',

  // ── Auxiliaries / common verb forms ──
  'sou': 'I am (ser)', 'és': 'you are (ser)',
  'é': 'is (ser)', 'somos': 'we are (ser)',
  'são': 'they are (ser)',
  'era': 'was (ser, imperf.)', 'estava': 'was (estar, imperf.)',
  'estou': 'I am (estar)', 'está': 'is (estar)',
  'estamos': 'we are (estar)', 'estão': 'they are (estar)',
  'tenho': 'I have', 'tem': 'has, have',
  'temos': 'we have', 'têm': 'they have',
  'tinha': 'had (imperf.)',
  'fui': 'I was / I went', 'foi': 'was / went',
  'fomos': 'we were / we went', 'foram': 'they were / they went',

  // ── Demonstratives ──
  'este': 'this (masc.)', 'esta': 'this (fem.)',
  'estes': 'these (masc.)', 'estas': 'these (fem.)',
  'esse': 'that (masc.)', 'essa': 'that (fem.)',
  'esses': 'those (masc.)', 'essas': 'those (fem.)',
  'aquele': 'that (masc., far)', 'aquela': 'that (fem., far)',
  'aqueles': 'those (masc., far)', 'aquelas': 'those (fem., far)',
  'isto': 'this (neuter)', 'isso': 'that (neuter)',
  'aquilo': 'that (neuter, far)',

  // ── Common particles / short words ──
  'há': 'there is, there are, ago',
  'não': 'no, not', 'sim': 'yes',
  'tão': 'so, such', 'todo': 'all, every',
  'toda': 'all, every (fem.)', 'todos': 'all, everyone',
  'todas': 'all, everyone (fem.)',
  'cada': 'each, every', 'outro': 'other, another',
  'outra': 'other, another (fem.)',
  'outros': 'others', 'outras': 'others (fem.)',
  'mesmo': 'same, even, indeed', 'mesma': 'same (fem.)',
  'nada': 'nothing', 'algo': 'something',
  'alguém': 'someone', 'ninguém': 'nobody',
  'tudo': 'everything', 'algum': 'some (masc.)',
  'alguma': 'some (fem.)', 'nenhum': 'no, none (masc.)',
  'nenhuma': 'no, none (fem.)',
  'próprio': 'own, proper', 'própria': 'own, proper (fem.)',
  'certo': 'certain, right', 'certa': 'certain (fem.)',
  'tanto': 'so much', 'tanta': 'so much (fem.)',
  'pouco': 'little, few', 'pouca': 'little, few (fem.)',
};

// ──────────────────────────────────────────────────────────────
// Step 2: Collect all words from the deck
// ──────────────────────────────────────────────────────────────
function collectDeckWords() {
  const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf8'));
  const wordFreq = new Map();
  const wordCards = new Map(); // word -> [{target, english}, ...]

  for (const card of deck) {
    const tokens = tokenize(card.target, 'portuguese');
    for (const tok of tokens) {
      const w = tok.trim()
        .toLowerCase()
        .replace(/[''""«»\u200B\u200C\u200D\uFEFF]/g, '') // strip curly quotes, ZWJ
        .replace(/^[—–\-]+|[—–\-]+$/g, '')                  // strip leading/trailing dashes
        .trim();
      if (!w) continue;
      // Skip single-char tokens (except Portuguese 'a', 'e', 'o', 'à' — handled in function words)
      if (w.length < 2) continue;
      // Only keep tokens with Portuguese/Latin chars
      if (!/[a-zà-ÿçáâãéêíóôõú]/i.test(w)) continue;
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
// Portuguese dict uses `const dictionary: Record<string, DictEntry> = {`
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
  console.log('=== Portuguese Dictionary Rebuild v3 ===\n');

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
  const googleRaw = await translateBatch(needTranslation, 'pt');
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
      // Lemma points to a non-existent base word — clear it
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
  const allWords = [...wordFreq.keys()].sort((a, b) => a.localeCompare(b, 'pt'));

  // Also include existing dictionary words that aren't in the deck (preserve them)
  for (const word of Object.keys(existing)) {
    if (!wordFreq.has(word)) {
      allWords.push(word);
    }
  }
  allWords.sort((a, b) => a.localeCompare(b, 'pt'));

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
      const isProperNoun = /^(Brazil|Portugal|Lisbon|Porto|Rio|Amazon|Atlantic|Europe|Africa|America|Christmas|Easter|Carnival)$/i.test(en);
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

  // Portuguese dict uses `const dictionary` (not `const DICT`)
  const dictContent = header
    + 'const dictionary: Record<string, DictEntry> = {\n'
    + entries.join('\n') + '\n'
    + '};'
    + footer;

  fs.writeFileSync(DICT_PATH, dictContent, 'utf8');
  console.log(`Wrote ${entries.length} entries to ${DICT_PATH}`);

  // Verify TypeScript syntax
  console.log('\nVerifying TypeScript...');
  try {
    const tscPath = path.join(ROOT, 'node_modules/.bin/tsc');
    const { execSync } = require('child_process');
    execSync(`${tscPath} --noEmit ${DICT_PATH}`, { cwd: ROOT, stdio: 'pipe' });
    console.log('TypeScript: OK');
  } catch (e) {
    const errOutput = e.stderr ? e.stderr.toString() : e.stdout ? e.stdout.toString() : '';
    console.log('TypeScript errors (may be expected for isolated file check):');
    // Only show first few lines
    const lines = errOutput.split('\n').slice(0, 10);
    console.log(lines.join('\n'));
  }

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

  let md = `# Portuguese Dictionary v3 Rebuild - 100-Entry Review\n\n`;
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

  fs.writeFileSync(path.join(OUTPUT_DIR, 'pt-v3-review.md'), md, 'utf8');
  console.log(`\nReview written to scripts/output/pt-v3-review.md`);
  console.log(`Grade: ${grade} (${pass}/${sampleSize} pass)`);
}

main().catch(e => { console.error(e); process.exit(1); });
