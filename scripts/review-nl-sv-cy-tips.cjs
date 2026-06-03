#!/usr/bin/env node
/**
 * Grammar tip alignment review for Dutch, Swedish, and Welsh decks.
 * Checks every card with a grammar tip for relevance, accuracy, usefulness.
 * Outputs fix files to scripts/output/
 */

const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const nl = require(path.join(BASE, 'src/data/dutch/deck.json'));
const sv = require(path.join(BASE, 'src/data/swedish/deck.json'));
const cy = require(path.join(BASE, 'src/data/welsh/deck.json'));

function reviewDutch(cards) {
  const fixes = [];
  const tipsCards = cards.filter(c => c.grammar && c.grammar.trim() !== '');

  for (const c of tipsCards) {
    const tip = c.grammar;
    const sent = c.target.toLowerCase();
    const eng = (c.english || '').toLowerCase();
    const issues = [];

    // MISMATCH: tip about zijn but no form of zijn
    if (/ik ben|'zijn'|"zijn"/i.test(tip) && !/\b(ben|is|zijn|was|waren|bent|geweest)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip discusses 'zijn' but sentence has no form of zijn" });
    }
    // Tip about hebben but no form
    if (/\bhebben\b/i.test(tip) && !/\b(heb|hebt|heeft|hebben|had|hadden|gehad)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip discusses 'hebben' but no form in sentence" });
    }
    // Diminutives
    if (/verkleinwoord|diminutive|\-je\b/i.test(tip) && !/[a-z](je|tje|pje|etje|kje)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about diminutives but no diminutive in sentence" });
    }
    // Negation
    if (/'niet'|'geen'.*negat|\bniet\b.*negat|negat.*\bniet\b/i.test(tip) && !/\b(niet|geen)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about negation but no niet/geen in sentence" });
    }
    // Passive
    if (/passie|passive|lijdende/i.test(tip) && !/\b(wordt|worden|werd|werden|geworden)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about passive but no passive construction" });
    }
    // Modal verbs
    if (/\b(modal|modaal)\b/i.test(tip) && !/\b(moet|moeten|kan|kun|kunnen|wil|willen|mag|mogen|zal|zullen|kon|konden|mocht|mochten|zou|zouden)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about modal verbs but no modal in sentence" });
    }
    // Reflexive
    if (/reflexi|wederkerend/i.test(tip) && !/\b(zich|me|mezelf|jezelf|zichzelf|ons|onszelf)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about reflexive but no reflexive pronoun" });
    }
    // Conditional
    if (/conditiona|zou.*zouden/i.test(tip) && !/\b(zou|zouden)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about conditional but no zou/zouden" });
    }
    // Questions
    if (/\bvraag|question word|interrogat/i.test(tip) && !sent.includes('?') && !/\b(wie|wat|waar|wanneer|waarom|hoe|welk|welke)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about questions but sentence isn't a question" });
    }
    // Past participle
    if (/voltooid deelwoord|past participle/i.test(tip) && !/\bge\w+(d|t|en)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about past participle but none in sentence" });
    }
    // Comparatives/superlatives
    if (/comparati|superlati/i.test(tip) && !/\b(meer|meest)\b/.test(sent) && !/\w+(er|st)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about comparatives/superlatives but none in sentence" });
    }
    // Er expletive
    if (/\ber\b.*expletive|expletive.*\ber\b|'er'.*filler|'er'.*placeholder/i.test(tip) && !/\ber\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about 'er' but no 'er' in sentence" });
    }
    // Generic verb stem rule
    if (/^Dutch verb stems: remove -en, apply spelling rules/.test(tip)) {
      issues.push({ issue: 'repetitive', reason: "Generic verb stem rule not specific to this sentence" });
    }
    // Generic present tense rule
    if (/^Dutch present tense: remove -en from the infinitive/.test(tip)) {
      issues.push({ issue: 'repetitive', reason: "Generic present tense formation – too broad" });
    }
    // Past tense tip on present sentence
    if (/imperfect|simple past|verleden|onvoltooid/i.test(tip)) {
      const pastForms = /\b(was|waren|had|hadden|ging|gingen|kwam|kwamen|liep|liepen|zei|zeiden|deed|deden|zag|zagen|stond|stonden|dacht|dachten|wist|wisten|bleef|bleven|vond|vonden|gaf|gaven|nam|namen|hield|hielden|liet|lieten|schreef|schreven|bracht|brachten|viel|vielen|begon|begonnen|sprak|spraken|reed|reden|droeg|droegen|kreeg|kregen|sliep|sliepen|vloog|vlogen|hing|hingen|won|wonnen|dronk|dronken)\b/.test(sent);
      const pastSuffix = /\b\w+(te|de|ten|den)\b/.test(sent);
      if (!pastForms && !pastSuffix) {
        issues.push({ issue: 'mismatch', reason: "Tip about past tense but sentence appears present" });
      }
    }

    // Quoted word not in sentence
    const allQuoted = [...(tip.match(/'([^']{3,})'/g) || []), ...(tip.match(/"([^"]{3,})"/g) || [])];
    for (const qw of allQuoted) {
      const word = qw.replace(/['"]/g, '').toLowerCase().trim();
      if (word.length > 3 && !sent.includes(word) && !/means|literally|compare|from|like|similar|english|translat|root|cognate|related|infinitive/.test(tip.toLowerCase())) {
        if (!/\b(ik|jij|hij|zij|wij|jullie|het|een|de|en|maar|ook|van|voor|met|aan|op|in|uit|naar|door|om)\b/.test(word)) {
          issues.push({ issue: 'mismatch', reason: `Tip references '${word}' not in sentence` });
          break;
        }
      }
    }

    if (issues.length > 0) {
      fixes.push({
        id: c.id,
        current_tip: tip,
        fixed_tip: '',
        issue: issues[0].issue,
        reason: issues[0].reason,
        sentence: c.target,
        english: c.english
      });
    }
  }
  return { total: tipsCards.length, fixes };
}

function reviewSwedish(cards) {
  const fixes = [];
  const tipsCards = cards.filter(c => c.grammar && c.grammar.trim() !== '');

  for (const c of tipsCards) {
    const tip = c.grammar;
    const sent = c.target.toLowerCase();
    const eng = (c.english || '').toLowerCase();
    const issues = [];

    // Tack mismatch
    if (/\btack\b/i.test(tip) && !/\btack\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about 'tack' but sentence has no 'tack'" });
    }
    // German comparison (irrelevant)
    if (/if you know german|parallel.*german|german.*strong.*weak/i.test(tip)) {
      issues.push({ issue: 'irrelevant', reason: "Compares to German – not helpful for most learners" });
    }
    // Group 1 (-ar) on non-ar sentence
    if (/group 1.*\(-ar\)|group 1 verb|-ar\).*verb|verbs \(-ar\)/i.test(tip) && !/\w+ar\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about group 1 (-ar) verbs but no -ar verb in sentence" });
    }
    // Strong verbs on non-strong verb sentence
    if (/strong verb|group 4|starka verb/i.test(tip)) {
      if (!/\b(gå|gick|gått|se|såg|sett|ta|tog|tagit|ge|gav|gett|giv|dra|drog|dragit|finna|fann|funnit|bli|blev|blivit|skriva|skrev|skrivit|bryta|bröt|brutit|bära|bar|burit|komma|kom|kommit|springa|sprang|sprungit|sjunga|sjöng|sjungit|dricka|drack|druckit|sitta|satt|suttit|ligga|låg|legat|stå|stod|stått|le|log|lett|njuta|njöt|njutit|fara|for|farit|slå|slog|slagit|hålla|höll|hållit|falla|föll|fallit|äta|åt|ätit|sova|sov|sovit|vinna|vann|vunnit|rida|red|ridit|binda|band|bundit|tvinga|tvang|tvungit|flyga|flög|flugit|skjuta|sköt|skjutit|ljuga|ljög|ljugit|suga|sög|sugit|smyga|smög|smugit|stryka|strök|strukit|svika|svek|svikit)\b/.test(sent)) {
        issues.push({ issue: 'mismatch', reason: "Tip about strong verbs but no recognizable strong verb" });
      }
    }
    // Att infinitive marker
    if (/'att'|"att"|infinitive marker.*att/i.test(tip) && !/\batt\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about 'att' but no 'att' in sentence" });
    }
    // En/ett gender
    if (/\ben-word|ett-word|en word|ett word|common gender|neuter.*article/i.test(tip) && !/\b(en|ett|den|det)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about en/ett gender but no article in sentence" });
    }
    // Passive -s
    if (/passive.*-s|s-passive|passiv/i.test(tip) && !/(s\b)/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about s-passive but no s-passive verb" });
    }
    // Questions
    if (/\bfråga|question word|interrogat/i.test(tip) && !sent.includes('?') && !/\b(vem|vad|var|när|varför|hur|vilken|vilket|vilka)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about questions but sentence isn't a question" });
    }
    // Negation
    if (/'inte'|negat.*inte|inte.*negat/i.test(tip) && !/\b(inte|aldrig|ingen|inget|inga)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about negation but no negation word" });
    }
    // Reflexive
    if (/reflexi/i.test(tip) && !/\b(sig|mig|dig|oss|er)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about reflexive but no reflexive pronoun" });
    }
    // Conditional
    if (/conditiona|skulle/i.test(tip) && !/\b(skulle)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about conditional but no 'skulle'" });
    }
    // Comparatives/superlatives
    if (/comparati|superlati/i.test(tip) && !/\b(mer|mest|bättre|bäst|sämre|sämst|större|störst|mindre|minst)\b/.test(sent) && !/\w+(are|ast)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about comparatives/superlatives but none in sentence" });
    }
    // Modal verbs
    if (/modal|hjälpverb/i.test(tip) && !/\b(kan|kunde|ska|skall|skulle|vill|ville|måste|bör|borde|får|fick)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about modal verbs but none in sentence" });
    }
    // Past tense on present
    if (/preterit|past tense|imperfekt/i.test(tip)) {
      const pastForms = /\b(var|hade|gick|kom|tog|såg|gav|fick|stod|satt|låg|sa|slog|höll|föll|bar|sov|vann|sjöng|sprang|drog|flög|sköt|bjöd|bröt|bet|grep|led|red|skreg|sken|steg|strök|svek|vek|log|njöt|for|åt)\b/.test(sent);
      const pastSuffix = /\b\w+(de|te|dde|tte)\b/.test(sent);
      if (!pastForms && !pastSuffix) {
        issues.push({ issue: 'mismatch', reason: "Tip about past tense but sentence is present" });
      }
    }

    // Quoted words not in sentence
    const allQuoted = [...(tip.match(/'([^']{3,})'/g) || []), ...(tip.match(/"([^"]{3,})"/g) || [])];
    for (const qw of allQuoted) {
      const word = qw.replace(/['"]/g, '').toLowerCase().trim();
      if (word.length > 3 && !sent.includes(word) && !/means|literally|compare|from|like|similar|english|translat|root|cognate|past form|infinitive|becomes|related/.test(tip.toLowerCase())) {
        if (!/\b(jag|du|han|hon|vi|de|den|det|en|ett|och|att|som|med|för|inte|på|av|till|är|var|har|hade)\b/.test(word)) {
          issues.push({ issue: 'mismatch', reason: `Tip references '${word}' not in sentence` });
          break;
        }
      }
    }

    if (issues.length > 0) {
      fixes.push({
        id: c.id,
        current_tip: tip,
        fixed_tip: '',
        issue: issues[0].issue,
        reason: issues[0].reason,
        sentence: c.target,
        english: c.english
      });
    }
  }
  return { total: tipsCards.length, fixes };
}

function reviewWelsh(cards) {
  const fixes = [];
  const tipsCards = cards.filter(c => c.grammar && c.grammar.trim() !== '');

  for (const c of tipsCards) {
    const tip = c.grammar;
    const sent = c.target.toLowerCase();
    const eng = (c.english || '').toLowerCase();
    const issues = [];

    // Mae'r mismatch
    if (/"mae'r"|'mae'r'/i.test(tip) && !/mae'r/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about 'Mae'r' but not in sentence" });
    }
    // Mor + adj but no mor
    if (/"mor"|'mor'.*adj|mor \+/i.test(tip) && !/\bmor\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about 'mor' but not in sentence" });
    }
    // Llaeth but no llaeth
    if (/\bllaeth\b/i.test(tip) && !/llaeth/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about 'llaeth' but not in sentence" });
    }
    // Blasus but not in sentence
    if (/\bblasus\b/i.test(tip) && !/\b(blasus|flasus)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about 'blasus' but not in sentence" });
    }
    // Paned but not in sentence
    if (/\bpaned\b/i.test(tip) && !/paned/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about 'paned' but not in sentence" });
    }
    // Galwch but not in sentence
    if (/galwch.*imperative|imperative.*galwch/i.test(tip) && !/galwch/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about 'Galwch' imperative but not in sentence" });
    }
    // Wedi but not in sentence
    if (/'wedi'|"wedi"|wedi.*perfect|past.*wedi/i.test(tip) && !/wedi/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about 'wedi' but not in sentence" });
    }
    // Questions
    if (/\bcwestiwn|question.*form/i.test(tip) && !sent.includes('?') && !/\b(oes|ydy|ydych|ydw|beth|pwy|ble|pryd|pam|sut|faint|pa)\b/.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about questions but sentence isn't a question" });
    }
    // Generic mutation overview
    if (/mutations are one of the most|welsh has three types of mutation|mutation system/i.test(tip)) {
      issues.push({ issue: 'repetitive', reason: "Overly generic mutation overview" });
    }
    // Nasal mutation no trigger
    if (/nasal mutation|treiglad trwynol/i.test(tip) && !/\b(yn|fy|ym|yng)\b/i.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about nasal mutation but no trigger" });
    }
    // Aspirate mutation no trigger
    if (/aspirate mutation|treiglad llaes/i.test(tip) && !/\b(â|a|ei|gyda|tua|na|tri|chwe)\b/i.test(sent)) {
      issues.push({ issue: 'mismatch', reason: "Tip about aspirate mutation but no trigger" });
    }

    // Quoted words not in sentence
    const allQuoted = [...(tip.match(/"([^"]{3,})"/g) || [])];
    for (const qw of allQuoted) {
      const word = qw.replace(/"/g, '').toLowerCase().trim();
      if (word.length > 3 && !sent.includes(word) && !/means|literally|compare|from|mutation|changes|becomes|used in|contraction|translat/.test(tip.toLowerCase())) {
        if (!/\b(dw|i'n|mae|yn|y|yr|a|o|i|e|hi|ni|nhw|chi|ti|fe|fo|wedi|bod|ei|eu|ein)\b/.test(word)) {
          issues.push({ issue: 'mismatch', reason: `Tip references "${word}" not in sentence` });
          break;
        }
      }
    }

    if (issues.length > 0) {
      fixes.push({
        id: c.id,
        current_tip: tip,
        fixed_tip: '',
        issue: issues[0].issue,
        reason: issues[0].reason,
        sentence: c.target,
        english: c.english
      });
    }
  }
  return { total: tipsCards.length, fixes };
}

// Cross-cutting: flag over-duplicated tips
function crossCuttingChecks(fixes, cards) {
  const tipsCards = cards.filter(c => c.grammar && c.grammar.trim() !== '');
  const existingIds = new Set(fixes.map(f => f.id));
  const tipCounts = {};
  for (const c of tipsCards) {
    const tip = c.grammar.trim();
    if (!tipCounts[tip]) tipCounts[tip] = [];
    tipCounts[tip].push(c);
  }
  for (const [tip, tipCards] of Object.entries(tipCounts)) {
    if (tipCards.length > 5) {
      for (let i = 3; i < tipCards.length; i++) {
        const c = tipCards[i];
        if (!existingIds.has(c.id)) {
          fixes.push({
            id: c.id,
            current_tip: tip,
            fixed_tip: '',
            issue: 'repetitive',
            reason: `Exact tip on ${tipCards.length} cards – redundant`,
            sentence: c.target,
            english: c.english
          });
          existingIds.add(c.id);
        }
      }
    }
  }
  return fixes;
}

// Run
console.log('=== Dutch ===');
const nlResult = reviewDutch(nl);
const nlFixes = crossCuttingChecks(nlResult.fixes, nl);
console.log(`Checked: ${nlResult.total}, Flagged: ${nlFixes.length}`);

console.log('=== Swedish ===');
const svResult = reviewSwedish(sv);
const svFixes = crossCuttingChecks(svResult.fixes, sv);
console.log(`Checked: ${svResult.total}, Flagged: ${svFixes.length}`);

console.log('=== Welsh ===');
const cyResult = reviewWelsh(cy);
const cyFixes = crossCuttingChecks(cyResult.fixes, cy);
console.log(`Checked: ${cyResult.total}, Flagged: ${cyFixes.length}`);

function breakdown(fixes) {
  const counts = {};
  for (const f of fixes) counts[f.issue] = (counts[f.issue] || 0) + 1;
  return counts;
}
console.log('\nBreakdown:');
console.log('NL:', JSON.stringify(breakdown(nlFixes)));
console.log('SV:', JSON.stringify(breakdown(svFixes)));
console.log('CY:', JSON.stringify(breakdown(cyFixes)));

// Write output
function toOutput(fixes) {
  return fixes.map(f => ({ id: f.id, current_tip: f.current_tip, fixed_tip: f.fixed_tip, issue: f.issue }));
}
const OUT = path.join(BASE, 'scripts/output');
fs.writeFileSync(path.join(OUT, 'nl-tip-fixes.json'), JSON.stringify(toOutput(nlFixes), null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'sv-tip-fixes.json'), JSON.stringify(toOutput(svFixes), null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'cy-tip-fixes.json'), JSON.stringify(toOutput(cyFixes), null, 2) + '\n');
// Debug versions with context
fs.writeFileSync(path.join(OUT, 'nl-tip-fixes-debug.json'), JSON.stringify(nlFixes, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'sv-tip-fixes-debug.json'), JSON.stringify(svFixes, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'cy-tip-fixes-debug.json'), JSON.stringify(cyFixes, null, 2) + '\n');
console.log('\nFiles written to scripts/output/');
