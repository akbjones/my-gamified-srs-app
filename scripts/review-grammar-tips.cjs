/**
 * Review ALL grammar tips in Spanish, Italian, French decks for alignment.
 * Checks:
 * 1. Relevance: tip matches the sentence's actual grammar
 * 2. Accuracy: explanation is correct
 * 3. Usefulness: specific insight vs generic filler
 *
 * Flags tips that mention grammar not demonstrated in the card's target sentence.
 */

const fs = require('fs');
const path = require('path');

const BASE = path.join(__dirname, '..', 'src', 'data');

// Load decks
const es = JSON.parse(fs.readFileSync(path.join(BASE, 'spanish', 'deck.json'), 'utf-8'));
const it = JSON.parse(fs.readFileSync(path.join(BASE, 'italian', 'deck.json'), 'utf-8'));
const fr = JSON.parse(fs.readFileSync(path.join(BASE, 'french', 'deck.json'), 'utf-8'));

// ============================================================
// UTILITY HELPERS
// ============================================================

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function sentenceWords(target) {
  return new Set(normalize(target).split(' '));
}

// Check if a quoted word/phrase from the tip appears in the sentence
function extractQuotedTerms(tip) {
  const terms = [];
  // Match 'word', "word", 'word', 'word'
  const patterns = [/[''']([^''']+)[''']/g, /[""]([^""]+)["" ]/g, /"([^"]+)"/g];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(tip)) !== null) {
      terms.push(m[1].trim());
    }
  }
  return [...new Set(terms)];
}

// Check if a verb form or word mentioned in the tip is in the sentence
function tipMentionsAbsentWord(tip, target, lang) {
  const targetNorm = normalize(target);
  const targetWords = sentenceWords(target);
  const quoted = extractQuotedTerms(tip);

  const absent = [];
  for (const q of quoted) {
    const qNorm = normalize(q);
    // Skip very short terms (articles, etc.) and meta-terms
    if (qNorm.length <= 2) continue;
    // Skip terms that are clearly example phrases (containing spaces with 3+ words)
    // Allow 2-word phrases to be checked
    if (qNorm.split(' ').length > 3) continue;

    // Check if any word from the quoted term appears in the sentence
    const qWords = qNorm.split(' ');
    const anyPresent = qWords.some(w => w.length > 2 && targetNorm.includes(w));
    if (!anyPresent) {
      absent.push(q);
    }
  }
  return absent;
}

// ============================================================
// SPANISH-SPECIFIC CHECKS
// ============================================================

function checkSpanishTip(card) {
  const { target, english, grammar: tip } = card;
  const issues = [];
  const tNorm = normalize(target);
  const tWords = sentenceWords(target);
  const tipLower = tip.toLowerCase();

  // 1. Tip mentions ser/estar but sentence doesn't use them
  if (/\bser\b.*\bestar\b|\bestar\b.*\bser\b/.test(tipLower) ||
      (tipLower.includes("'ser'") && tipLower.includes("'estar'"))) {
    const hasSer = /\b(soy|eres|es|somos|son|era|eras|éramos|eran|fue|fueron|sido|siendo|sea|seas|seamos|sean|fuera|fueras|fuéramos|fueran|ser)\b/.test(tNorm);
    const hasEstar = /\b(estoy|estas|esta|estamos|estan|estaba|estabas|estábamos|estaban|estuvo|estuvieron|estado|estando|este|estes|estemos|esten|estar)\b/.test(tNorm);
    if (!hasSer && !hasEstar) {
      issues.push({ type: 'mismatch', detail: 'Tip about ser/estar but sentence uses neither' });
    }
  }

  // 2. Tip mentions subjunctive but sentence doesn't use it
  if (/subjuntivo|subjunctive/.test(tipLower) && !/\b(que|ojalá|aunque|para que|sin que|antes de que|puede que)\b/.test(tNorm)) {
    // Check for subjunctive verb forms (common endings)
    if (!/\b\w+(e|es|emos|en|a|as|amos|an)\b/.test(tNorm)) {
      // This is a weak check - only flag if tip is ONLY about subjunctive
      if (tipLower.startsWith('the subjunctive') || tipLower.startsWith('subjunctive')) {
        issues.push({ type: 'mismatch', detail: 'Tip focuses on subjunctive but no subjunctive trigger visible' });
      }
    }
  }

  // 3. Tip mentions reflexive verbs but sentence has none
  if (/reflexiv|reflexive/.test(tipLower) && !/\b(me|te|se|nos|os)\b/.test(tNorm)) {
    issues.push({ type: 'mismatch', detail: 'Tip about reflexive verbs but no reflexive pronoun in sentence' });
  }

  // 4. Tip about gustar-like verbs but sentence doesn't use them
  if (/\bgustar\b/.test(tipLower) && !/\b(gusta|gustan|gustó|gustaba|gustaban|gustará|gustarán|gustaría|gustarían|encanta|encantan|importa|importan|falta|faltan|parece|parecen|interesa|interesan|molesta|molestan)\b/.test(tNorm)) {
    issues.push({ type: 'mismatch', detail: 'Tip about gustar-type verbs but sentence uses none' });
  }

  // 5. Tip about por/para but sentence has neither
  if (/\bpor\b.*\bpara\b|\bpara\b.*\bpor\b/.test(tipLower) || tipLower.includes("'por'") || tipLower.includes("'para'")) {
    if (!/\b(por|para)\b/.test(tNorm)) {
      issues.push({ type: 'mismatch', detail: 'Tip about por/para but sentence contains neither' });
    }
  }

  // 6. Tip about imperfect vs preterite but sentence is present tense
  if (/imperfect.*preterit|preterit.*imperfect|pretérito.*imperfect/.test(tipLower)) {
    const hasPast = /\b\w+(aba|abas|ábamos|aban|ía|ías|íamos|ían|é|aste|ó|amos|aron|ieron|iste)\b/.test(tNorm);
    if (!hasPast) {
      issues.push({ type: 'mismatch', detail: 'Tip about past tenses but sentence appears to be present tense' });
    }
  }

  // 7. Check quoted terms not in sentence
  const absent = tipMentionsAbsentWord(tip, target, 'es');
  if (absent.length > 0) {
    // Filter out common grammar terms that are explanatory
    const realAbsent = absent.filter(a => {
      const an = normalize(a);
      // Skip if it's a grammar label
      if (/^(ser|estar|indicative|subjunctive|imperfect|preterit|infinitive|gerund|conditional|future|present|imperative)$/.test(an)) return false;
      // Skip if it's clearly a contrasting example
      if (tip.includes('not') || tip.includes('unlike') || tip.includes('compare')) return false;
      return true;
    });
    if (realAbsent.length >= 2) {
      issues.push({ type: 'irrelevant', detail: `Tip quotes absent terms: ${realAbsent.join(', ')}` });
    }
  }

  // 8. Tip is about a completely different verb than what's in the sentence
  const verbMentionMatch = tipLower.match(/[''](\w+ar|\w+er|\w+ir)['']/);
  if (verbMentionMatch) {
    const mentionedVerb = normalize(verbMentionMatch[1]);
    // Get stem (remove -ar/-er/-ir)
    const stem = mentionedVerb.slice(0, -2);
    if (stem.length >= 3 && !tNorm.includes(stem)) {
      // Check if the tip is primarily ABOUT this verb (not just mentioning it as contrast)
      if (tipLower.indexOf(verbMentionMatch[0]) < 30) {
        issues.push({ type: 'mismatch', detail: `Tip focuses on verb '${mentionedVerb}' whose stem doesn't appear in sentence` });
      }
    }
  }

  return issues;
}

// ============================================================
// ITALIAN-SPECIFIC CHECKS
// ============================================================

function checkItalianTip(card) {
  const { target, english, grammar: tip } = card;
  const issues = [];
  const tNorm = normalize(target);
  const tWords = sentenceWords(target);
  const tipLower = tip.toLowerCase();

  // 1. Tip about preposition contractions (di+il=del etc.) but sentence has none
  if (/\bcontract|articolat|preposizion/.test(tipLower) || /di \+ il|di \+ la|del|della|dello|degli|delle|nel|nella|nello|negli|nelle|sul|sulla|sullo|sugli|sulle|al |alla|allo|agli|alle/.test(tipLower)) {
    if (!/\b(del|della|dello|degli|delle|nel|nella|nello|negli|nelle|sul|sulla|sullo|sugli|sulle|al|alla|allo|agli|alle|dal|dalla|dallo|dagli|dalle)\b/.test(tNorm)) {
      // Only flag if tip is primarily about contractions
      if (tipLower.includes('contract') || tipLower.includes('di +') || tipLower.includes('preposizion')) {
        issues.push({ type: 'mismatch', detail: 'Tip about prepositional contractions but sentence has none' });
      }
    }
  }

  // 2. Tip about congiuntivo/subjunctive but sentence doesn't use it
  if (/congiuntiv|subjunctive/.test(tipLower)) {
    if (!/\b(che|sebbene|benché|affinché|purché|nonostante|prima che|senza che|a meno che)\b/.test(tNorm)) {
      if (tipLower.startsWith('the subjunctive') || tipLower.startsWith('congiuntiv') || /^['"]/.test(tip) === false && tipLower.indexOf('subjunctive') < 20) {
        // Weak signal, only flag if very clearly mismatched
      }
    }
  }

  // 3. Tip mentions 'quanto' but sentence doesn't have it
  if (/['']quanto['']/.test(tipLower) && !/\bquanto|quanta|quanti|quante\b/.test(tNorm)) {
    issues.push({ type: 'mismatch', detail: "Tip about 'quanto' but word not in sentence" });
  }

  // 4. Tip mentions 'anche' but sentence doesn't have it
  if (/['']anche['']/.test(tipLower) && !/\banche|anch\b/.test(tNorm)) {
    issues.push({ type: 'mismatch', detail: "Tip about 'anche' but word not in sentence" });
  }

  // 5. Tip mentions 'molto' but sentence doesn't have it
  if (/['']molto['']/.test(tipLower) && !/\bmolto|molta|molti|molte\b/.test(tNorm)) {
    issues.push({ type: 'mismatch', detail: "Tip about 'molto' but word not in sentence" });
  }

  // 6. Tip about reflexive but no reflexive pronouns
  if (/riflessiv|reflexive/.test(tipLower) && !/\b(mi|ti|si|ci|vi)\b/.test(tNorm)) {
    issues.push({ type: 'mismatch', detail: 'Tip about reflexive verbs but no reflexive pronoun in sentence' });
  }

  // 7. Tip about passato prossimo but sentence isn't past
  if (/passato prossimo/.test(tipLower)) {
    if (!/\b(ho|hai|ha|abbiamo|avete|hanno|sono|sei|è|siamo|siete)\b/.test(tNorm) || !/\b\w+(ato|uto|ito|ato|eso|isto|osto|etto|otto|esso|erto)\b/.test(tNorm)) {
      // Only flag if really no auxiliary+participle pattern
      if (!/\b(ho|hai|ha|abbiamo|hanno|sono|sei|siamo|siete)\b/.test(tNorm)) {
        issues.push({ type: 'mismatch', detail: 'Tip about passato prossimo but no auxiliary verb visible' });
      }
    }
  }

  // 8. Check quoted terms not in sentence
  const absent = tipMentionsAbsentWord(tip, target, 'it');
  if (absent.length > 0) {
    const realAbsent = absent.filter(a => {
      const an = normalize(a);
      if (/^(indicativo|congiuntivo|condizionale|imperfetto|passato|futuro|presente|infinito|gerundio|participio)$/.test(an)) return false;
      if (tip.includes('not') || tip.includes('unlike') || tip.includes('compare') || tip.includes('vs')) return false;
      return true;
    });
    if (realAbsent.length >= 2) {
      issues.push({ type: 'irrelevant', detail: `Tip quotes absent terms: ${realAbsent.join(', ')}` });
    }
  }

  // 9. Tip about a specific verb not in the sentence
  const verbMatch = tipLower.match(/[''](\w+are|\w+ere|\w+ire)['']/);
  if (verbMatch) {
    const mentionedVerb = normalize(verbMatch[1]);
    const stem = mentionedVerb.slice(0, -3);
    if (stem.length >= 3 && !tNorm.includes(stem)) {
      if (tipLower.indexOf(verbMatch[0]) < 30) {
        issues.push({ type: 'mismatch', detail: `Tip focuses on verb '${mentionedVerb}' whose stem doesn't appear in sentence` });
      }
    }
  }

  return issues;
}

// ============================================================
// FRENCH-SPECIFIC CHECKS
// ============================================================

function checkFrenchTip(card) {
  const { target, english, grammar: tip } = card;
  const issues = [];
  const tNorm = normalize(target);
  const tWords = sentenceWords(target);
  const tipLower = tip.toLowerCase();

  // 1. Tip about a specific verb not in the sentence
  const verbMatch = tipLower.match(/[''](\w+er|\w+ir|\w+re|\w+oir)['']/);
  if (verbMatch) {
    const mentionedVerb = normalize(verbMatch[1]);
    let stem;
    if (mentionedVerb.endsWith('er')) stem = mentionedVerb.slice(0, -2);
    else if (mentionedVerb.endsWith('ir')) stem = mentionedVerb.slice(0, -2);
    else if (mentionedVerb.endsWith('re')) stem = mentionedVerb.slice(0, -2);
    else stem = mentionedVerb.slice(0, -3);

    if (stem && stem.length >= 3 && !tNorm.includes(stem)) {
      if (tipLower.indexOf(verbMatch[0]) < 30) {
        issues.push({ type: 'mismatch', detail: `Tip focuses on verb '${mentionedVerb}' whose stem doesn't appear in sentence` });
      }
    }
  }

  // 2. Tip about ne...pas but sentence doesn't have negation
  if (/\bne\.\.\.pas\b|ne\s*\.\.\.\s*pas/.test(tipLower) && !/\b(ne|n)\b/.test(tNorm) && !/\bpas\b/.test(tNorm)) {
    issues.push({ type: 'mismatch', detail: 'Tip about ne...pas negation but sentence has no negation' });
  }

  // 3. Tip about passé composé but no auxiliary
  if (/passé composé/.test(tipLower)) {
    if (!/\b(ai|as|a|avons|avez|ont|suis|es|est|sommes|etes|sont)\b/.test(tNorm)) {
      issues.push({ type: 'mismatch', detail: 'Tip about passé composé but no auxiliary verb visible' });
    }
  }

  // 4. Tip about imparfait but sentence doesn't use it
  if (/\bimparfait\b/.test(tipLower)) {
    if (!/\b\w+(ais|ait|ions|iez|aient)\b/.test(tNorm)) {
      issues.push({ type: 'mismatch', detail: 'Tip about imparfait but no imparfait endings visible' });
    }
  }

  // 5. Tip about reflexive but no reflexive pronouns
  if (/réfléchi|reflexive|pronominal/.test(tipLower) && !/\b(me|m|te|t|se|s|nous|vous)\b/.test(tNorm)) {
    issues.push({ type: 'mismatch', detail: 'Tip about reflexive/pronominal verbs but no reflexive pronoun' });
  }

  // 6. Tip about subjonctif but no trigger
  if (/subjonctif|subjunctive/.test(tipLower) && !/\b(que|qu|bien que|pour que|avant que|sans que|afin que|il faut que|je veux que|il est possible que)\b/.test(tNorm)) {
    // Only flag if tip is primarily about subjunctive
    if (tipLower.indexOf('subjonctif') < 20 || tipLower.indexOf('subjunctive') < 20) {
      // Weak check, don't over-flag
    }
  }

  // 7. Tip mentions 'préparer' but sentence uses different verb
  if (/['']préparer['']/.test(tipLower) && !/\bprépar/.test(tNorm) && !/\bprepar/.test(tNorm)) {
    issues.push({ type: 'mismatch', detail: "Tip about 'préparer' but verb not in sentence" });
  }

  // 8. Tip mentions 'aider' but sentence uses different verb
  if (/['']aider['']/.test(tipLower) && !/\baid/.test(tNorm)) {
    issues.push({ type: 'mismatch', detail: "Tip about 'aider' but verb not in sentence" });
  }

  // 9. Check quoted terms not in sentence
  const absent = tipMentionsAbsentWord(tip, target, 'fr');
  if (absent.length > 0) {
    const realAbsent = absent.filter(a => {
      const an = normalize(a);
      if (/^(indicatif|subjonctif|conditionnel|imparfait|passé|futur|présent|infinitif|gérondif|participe)$/.test(an)) return false;
      if (tip.includes('not') || tip.includes('unlike') || tip.includes('compare') || tip.includes('vs')) return false;
      return true;
    });
    if (realAbsent.length >= 2) {
      issues.push({ type: 'irrelevant', detail: `Tip quotes absent terms: ${realAbsent.join(', ')}` });
    }
  }

  return issues;
}

// ============================================================
// GENERIC FILLER DETECTION (all languages)
// ============================================================

function checkGenericFiller(card) {
  const tip = card.grammar;
  const tipLower = tip.toLowerCase();
  const target = card.target;
  const tNorm = normalize(target);
  const issues = [];

  // Extremely generic tips that add no value
  const fillerPatterns = [
    /^regular -[eai]r verb/i,
    /^this is a (regular|standard|common)/i,
    /^(the|a) (basic|simple|standard|regular) /i,
  ];

  for (const p of fillerPatterns) {
    if (p.test(tip)) {
      issues.push({ type: 'repetitive', detail: 'Generic filler tip with no specific insight' });
      break;
    }
  }

  return issues;
}

// ============================================================
// MAIN PROCESSING
// ============================================================

function processLanguage(deck, langCode, checkFn) {
  const cardsWithTips = deck.filter(c => c.grammar);
  const fixes = [];

  for (const card of cardsWithTips) {
    const langIssues = checkFn(card);
    const genericIssues = checkGenericFiller(card);
    const allIssues = [...langIssues, ...genericIssues];

    if (allIssues.length > 0) {
      // Determine the primary issue type
      const issueTypes = allIssues.map(i => i.type);
      const primaryType = issueTypes.includes('mismatch') ? 'mismatch' :
                          issueTypes.includes('irrelevant') ? 'irrelevant' :
                          issueTypes.includes('wrong') ? 'wrong' : 'repetitive';

      fixes.push({
        id: card.id,
        target: card.target,
        english: card.english,
        current_tip: card.grammar,
        issue: primaryType,
        details: allIssues.map(i => i.detail).join('; '),
        fixed_tip: '' // Will be populated in phase 2
      });
    }
  }

  return { total: cardsWithTips.length, fixes };
}

console.log('=== GRAMMAR TIP ALIGNMENT REVIEW ===\n');

const esResult = processLanguage(es, 'es', checkSpanishTip);
const itResult = processLanguage(it, 'it', checkItalianTip);
const frResult = processLanguage(fr, 'fr', checkFrenchTip);

console.log(`Spanish: ${esResult.total} tips checked, ${esResult.fixes.length} flagged`);
console.log(`Italian: ${itResult.total} tips checked, ${itResult.fixes.length} flagged`);
console.log(`French:  ${frResult.total} tips checked, ${frResult.fixes.length} flagged`);

// Print some samples
function printSamples(label, fixes, n = 5) {
  console.log(`\n--- ${label} samples ---`);
  for (const f of fixes.slice(0, n)) {
    console.log(`  ${f.id}: "${f.target}"`);
    console.log(`    TIP: ${f.current_tip}`);
    console.log(`    ISSUE: ${f.issue} - ${f.details}`);
    console.log('');
  }
}

printSamples('Spanish', esResult.fixes);
printSamples('Italian', itResult.fixes);
printSamples('French', frResult.fixes);

// Also output all flagged for detailed review
const outDir = path.join(__dirname, 'output');
fs.writeFileSync(path.join(outDir, 'es-flagged-raw.json'), JSON.stringify(esResult.fixes, null, 2));
fs.writeFileSync(path.join(outDir, 'it-flagged-raw.json'), JSON.stringify(itResult.fixes, null, 2));
fs.writeFileSync(path.join(outDir, 'fr-flagged-raw.json'), JSON.stringify(frResult.fixes, null, 2));

// Breakdown by issue type
function breakdown(fixes) {
  const counts = {};
  for (const f of fixes) {
    counts[f.issue] = (counts[f.issue] || 0) + 1;
  }
  return counts;
}

console.log('\n=== BREAKDOWN ===');
console.log('Spanish:', JSON.stringify(breakdown(esResult.fixes)));
console.log('Italian:', JSON.stringify(breakdown(itResult.fixes)));
console.log('French:', JSON.stringify(breakdown(frResult.fixes)));
