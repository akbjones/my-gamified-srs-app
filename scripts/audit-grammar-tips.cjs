/**
 * audit-grammar-tips.cjs — Detect and fix stale grammar tips.
 *
 * Finds grammar tips that don't match their card's sentence content.
 * E.g., a superlative "-ísimo" tip on a sentence without superlatives,
 * or a reflexive verb tip on a sentence without reflexive verbs.
 *
 * Conservative approach: only auto-removes HIGH-CONFIDENCE mismatches
 * (superlative tips on non-superlative sentences, quoted full-sentence
 * examples from other cards). Reports borderline cases for review.
 *
 * Run: node scripts/audit-grammar-tips.cjs [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'spanish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

let autoRemoved = 0;
let flaggedForReview = 0;
let clean = 0;
let noTip = 0;

// Strip accents for pattern matching
function stripAccents(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

// Check if string looks like a full sentence (3+ words, starts with capital or ¿/¡)
function isFullSentence(s) {
  return s.split(/\s+/).length >= 3;
}

// Check if any word stem from the quoted text appears in the target
function stemOverlap(quoted, target) {
  const qWords = quoted.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const tLower = target.toLowerCase();
  const tStripped = stripAccents(tLower);
  for (const w of qWords) {
    const stem = stripAccents(w).replace(/(ar|er|ir|ando|iendo|ado|ido|ción|miento)$/, '');
    if (stem.length >= 3 && (tStripped.includes(stem) || tLower.includes(w))) {
      return true;
    }
  }
  return false;
}

// ── HIGH-CONFIDENCE Rules (auto-remove) ───────────────────────
// These are specific enough that a mismatch is almost certainly wrong.
const HIGH_CONFIDENCE_RULES = [
  {
    name: 'SUPERLATIVE_ON_NON_SUPERLATIVE',
    tipPattern: /superlativ|[íi]simo|[íi]sima/i,
    sentencePattern: /[íi]sim[oa]|el m[áa]s|la m[áa]s|los m[áa]s|las m[áa]s|muy\s/i,
  },
];

// ── REVIEW Rules (flag for manual check) ─────────────────────
// These have higher false-positive rates, so we only report them.
const REVIEW_RULES = [
  {
    name: 'IMPERATIVE_ON_NON_IMPERATIVE',
    tipPattern: /\bimperative\b|\bcommand\b|\bimperativo\b/i,
    sentencePattern: /^[¡!]?(no\s+)?(pon|haz|di|ven|sal|ten|ve|dime|dame|sigue|mira|escucha|espera|prueba|llama|env[ií]a|compra|abre|cierra|lee|baja|sube|corre|para|pasa|toma|deja|busca|habla|come|bebe|paga|repite|traduce|siéntese|siéntense|ponga|perdone|disculpe|escriba|dígame|espere)\b/i,
  },
  {
    name: 'REFLEXIVE_ON_NON_REFLEXIVE',
    tipPattern: /\breflexiv[eo]\b|\breflexive\b/i,
    // Broad: any reflexive pronoun before a verb
    sentencePattern: /\b(me|te|se|nos|os)\s+\w{3,}/i,
  },
];

// ── Audit Logic ─────────────────────────────────────────────

const autoIssues = [];
const reviewIssues = [];

for (const card of deck) {
  if (!card.grammar || card.grammar.trim().length === 0) {
    noTip++;
    continue;
  }

  const grammar = card.grammar;
  const target = stripAccents(card.target);
  const targetRaw = card.target;
  let isAutoRemove = false;
  let isReview = false;
  let matchedRules = [];

  // Check high-confidence rules
  for (const rule of HIGH_CONFIDENCE_RULES) {
    if (rule.tipPattern.test(grammar)) {
      if (!rule.sentencePattern.test(targetRaw) && !rule.sentencePattern.test(target)) {
        isAutoRemove = true;
        matchedRules.push(rule.name);
      }
    }
  }

  // Check quoted FULL SENTENCE mismatch (not single-word vocabulary)
  const quoteMatch = grammar.match(/^"([^"]+)"/);
  if (quoteMatch) {
    const quotedText = quoteMatch[1];
    if (isFullSentence(quotedText) && !stemOverlap(quotedText, card.target)) {
      isAutoRemove = true;
      matchedRules.push('QUOTED_SENTENCE_MISMATCH');
    }
  }

  // Check review rules (flag only)
  if (!isAutoRemove) {
    for (const rule of REVIEW_RULES) {
      if (rule.tipPattern.test(grammar)) {
        if (!rule.sentencePattern.test(targetRaw) && !rule.sentencePattern.test(target)) {
          isReview = true;
          matchedRules.push(rule.name);
        }
      }
    }
  }

  if (isAutoRemove) {
    autoIssues.push({
      id: card.id,
      target: card.target,
      english: card.english,
      grammar: card.grammar,
      grammarNode: card.grammarNode,
      rules: matchedRules,
    });

    if (!DRY_RUN) {
      delete card.grammar;
      autoRemoved++;
    }
  } else if (isReview) {
    reviewIssues.push({
      id: card.id,
      target: card.target,
      english: card.english,
      grammar: card.grammar,
      grammarNode: card.grammarNode,
      rules: matchedRules,
    });
    flaggedForReview++;
    clean++; // still counted as kept
  } else {
    clean++;
  }
}

// ── Report ──────────────────────────────────────────────────

console.log('=== Grammar Tip Audit ===\n');
console.log(`Total cards: ${deck.length}`);
console.log(`Cards without tips: ${noTip}`);
console.log(`Clean tips (kept): ${clean}`);
console.log(`Auto-${DRY_RUN ? 'remove' : 'removed'} (high confidence): ${autoIssues.length}`);
console.log(`Flagged for review (not removed): ${flaggedForReview}`);

if (autoIssues.length > 0) {
  console.log(`\n--- ${DRY_RUN ? 'Would Auto-Remove' : 'Auto-Removed'} ---\n`);
  for (const issue of autoIssues) {
    console.log(`[${issue.rules.join(', ')}] Card #${issue.id} (${issue.grammarNode})`);
    console.log(`  ES: ${issue.target}`);
    console.log(`  EN: ${issue.english}`);
    console.log(`  Tip: ${issue.grammar.substring(0, 120)}${issue.grammar.length > 120 ? '...' : ''}`);
    console.log('');
  }
}

if (reviewIssues.length > 0) {
  console.log('\n--- Flagged for Manual Review (not removed) ---\n');
  for (const issue of reviewIssues.slice(0, 20)) {
    console.log(`[${issue.rules.join(', ')}] Card #${issue.id} (${issue.grammarNode})`);
    console.log(`  ES: ${issue.target}`);
    console.log(`  Tip: ${issue.grammar.substring(0, 80)}${issue.grammar.length > 80 ? '...' : ''}`);
    console.log('');
  }
  if (reviewIssues.length > 20) {
    console.log(`  ... and ${reviewIssues.length - 20} more (not shown)\n`);
  }
}

if (!DRY_RUN) {
  fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2));
  console.log(`\nDeck saved. ${autoRemoved} stale tips removed.`);
} else {
  console.log('\n(dry run - no changes written)');
}
