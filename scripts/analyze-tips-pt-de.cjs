const fs = require('fs');
const path = require('path');

const pt = require('../src/data/portuguese/deck.json');
const de = require('../src/data/german/deck.json');

// ==================== UTILITY FUNCTIONS ====================

function countOccurrences(cards) {
  const tipCounts = {};
  for (const c of cards) {
    if (!c.grammar) continue;
    const tip = c.grammar.trim();
    if (!tipCounts[tip]) tipCounts[tip] = [];
    tipCounts[tip].push(c.id);
  }
  return tipCounts;
}

// ==================== PORTUGUESE ANALYSIS ====================

function analyzePT() {
  const ptWithGrammar = pt.filter(c => c.grammar);
  const tipCounts = countOccurrences(pt);
  
  // Find tips repeated 20+ times
  const repetitiveTips = {};
  for (const [tip, ids] of Object.entries(tipCounts)) {
    if (ids.length >= 20) {
      repetitiveTips[tip] = ids;
    }
  }
  
  console.log('\n=== PORTUGUESE ANALYSIS ===');
  console.log('Total cards with grammar:', ptWithGrammar.length);
  console.log('Unique tips:', Object.keys(tipCounts).length);
  console.log('Tips repeated 20+ times:', Object.keys(repetitiveTips).length);
  
  // Show top repeated tips
  const sorted = Object.entries(repetitiveTips).sort((a,b) => b[1].length - a[1].length);
  console.log('\nTop repeated tips:');
  for (const [tip, ids] of sorted.slice(0, 30)) {
    console.log(`  [${ids.length}x] ${tip.substring(0, 100)}...`);
  }
  
  // Now check for specific issues
  const issues = [];
  
  for (const card of ptWithGrammar) {
    const tip = card.grammar;
    const sent = card.target;
    const eng = card.english;
    const id = card.id;
    
    // 1. Check for tense mismatches
    // Detect what tense the sentence actually uses
    const sentLower = sent.toLowerCase();
    const tipLower = tip.toLowerCase();
    
    // Subjunctive keywords in tip but not in sentence
    if (tipLower.includes('subjuntivo') || tipLower.includes('subjunctive')) {
      const hasSubjunctive = /\b(que eu|que ele|que ela|que você|que nós|que eles|embora|talvez|oxalá|antes que|para que|caso|mesmo que|a menos que|sem que)\b/i.test(sent);
      if (!hasSubjunctive && !tipLower.includes('vs') && !tipLower.includes('contrast')) {
        issues.push({ id, current_tip: tip, issue: 'mismatch', reason: 'Tip mentions subjunctive but sentence does not use it' });
      }
    }
    
    // Imperative in tip but sentence is not imperative
    if (tipLower.includes('imperativ') && !tipLower.includes('vs')) {
      const hasImperative = /^(faz|faça|vai|vá|vem|venha|diz|diga|fala|fale|olha|olhe|para|pare|come|coma|abre|abra|fecha|feche|anda|senta|sente|levanta|põe|ponha|traz|traga|sai|saia|entra|entre|corre|corra|espera|espere|lê|leia|escreve|escreva|toma|tome|pega|pegue|liga|ligue|desliga|desligue|ouve|ouça|dorme|durma|acorda|acorde)/i.test(sent.replace(/^[¡¿]/, ''));
      if (!hasImperative) {
        issues.push({ id, current_tip: tip, issue: 'mismatch', reason: 'Tip mentions imperative but sentence is not imperative' });
      }
    }
    
    // Future subjunctive in tip
    if (tipLower.includes('futuro do subjuntivo') || tipLower.includes('future subjunctive')) {
      const hasFutureSubj = /\b(quando|se|enquanto|assim que|logo que|depois que|sempre que|como)\b/i.test(sent);
      if (!hasFutureSubj) {
        issues.push({ id, current_tip: tip, issue: 'mismatch', reason: 'Tip mentions future subjunctive but sentence lacks trigger words' });
      }
    }
    
    // Preterite/Imperfect in tip but sentence is present tense
    if ((tipLower.includes('pretérito') || tipLower.includes('preterit') || tipLower.includes('perfeito')) && !tipLower.includes('choose') && !tipLower.includes('vs') && !tipLower.includes('contrast') && !tipLower.includes('use ')) {
      // Check if sentence has past tense markers
      const hasPast = /\b(foi|fui|esteve|estive|teve|tive|fez|fiz|disse|quis|soube|pôde|deu|dei|veio|vim|trouxe|coube|houve|pôs|vi|viu|ouviu|ouvi|caiu|abriu|fechou|comeu|comi|bebeu|bebi|dormiu|dormi|saiu|saí|entrou|entrei|comprou|comprei|vendeu|vendi|pagou|paguei|trabalhou|trabalhei|estudou|estudei|falou|falei|morou|morei|viajou|viajei|chegou|cheguei|voltou|voltei|ficou|fiquei|começou|comecei|terminou|terminei|era|estava|tinha|fazia|dizia|ia|vinha|punha|sabia|podia|queria|havia|morreu|nasceu|cresceu|conheceu|conheci)\b/i.test(sent);
      if (!hasPast) {
        // Also check English for past tense
        const engPast = /\b(was|were|did|had|went|came|got|made|said|told|gave|took|saw|knew|found|thought|heard|left|felt|became|kept|began|showed|started|called|tried|asked|needed|turned|moved|lived|played|worked|walked|talked|looked|wanted|used|seemed|loved)\b/i.test(eng);
        if (!engPast) {
          issues.push({ id, current_tip: tip, issue: 'mismatch', reason: 'Tip mentions past tense (pretérito/perfeito) but sentence appears to be present tense' });
        }
      }
    }
    
    // 2. Check for conjugation table patterns (not contextual)
    if (/\b(eu|tu|ele|ela|nós|eles|elas|vocês?)\s*[-––:]\s*(eu|tu|ele|ela|nós|eles|elas|vocês?)\s*[-––:]/i.test(tip) ||
        /eu \w+, tu \w+, ele \w+/i.test(tip) ||
        /\beu\b.*\btu\b.*\bele\b.*\bnós\b.*\beles\b/i.test(tip)) {
      issues.push({ id, current_tip: tip, issue: 'irrelevant', reason: 'Tip is a conjugation table/pattern rather than contextual explanation' });
    }
    
    // 3. Check for generic filler tips
    if (tipLower.match(/^(practice|remember|note that|keep in mind|don't forget)/)) {
      if (tip.length < 40) {
        issues.push({ id, current_tip: tip, issue: 'irrelevant', reason: 'Generic filler tip - too short and vague' });
      }
    }
    
    // 4. Ser/Estar mismatch
    if (tipLower.includes("'ser'") || tipLower.includes("use ser") || tipLower.includes("ser is")) {
      if (!sent.includes('é') && !sent.includes('são') && !sent.includes('somos') && !sent.includes('sou') && !/\bser\b/.test(sent) && !/\bfoi\b/.test(sent) && !/\beram\b/.test(sent) && !/\bera\b/.test(sent)) {
        if (tipLower.includes('estar') && (sent.includes('está') || sent.includes('estou') || sent.includes('estão') || sent.includes('estamos'))) {
          // tip compares ser vs estar and sentence uses estar - ok
        } else if (!tipLower.includes('vs') && !tipLower.includes('contrast') && !tipLower.includes('unlike')) {
          issues.push({ id, current_tip: tip, issue: 'mismatch', reason: 'Tip focuses on ser but sentence does not use ser' });
        }
      }
    }
    
    // 5. Por/Para mismatch  
    if ((tipLower.includes("'por'") || tipLower.includes("use por ") || tipLower.startsWith("por ")) && !tipLower.includes("para")) {
      if (!sentLower.includes(' por ') && !sentLower.includes(' pelo ') && !sentLower.includes(' pela ') && !sentLower.includes(' pelos ') && !sentLower.includes(' pelas ')) {
        issues.push({ id, current_tip: tip, issue: 'mismatch', reason: 'Tip discusses por but sentence does not contain por/pelo/pela' });
      }
    }
    
    // 6. Conditional in tip but sentence not conditional
    if (tipLower.includes('condicional') || tipLower.includes('conditional')) {
      const hasConditional = /\b(ia|ias|íamos|iam|aria|arias|aríamos|ariam|eria|erias|eríamos|eriam|iria|irias|iríamos|iriam|gostaria|poderia|deveria|faria|seria|teria|diria|viria|queria|ficaria|daria|levaria|tomaria|precisaria|conseguiria)\b/i.test(sent);
      if (!hasConditional && !tipLower.includes('vs') && !tipLower.includes('contrast')) {
        issues.push({ id, current_tip: tip, issue: 'mismatch', reason: 'Tip mentions conditional but sentence does not use conditional tense' });
      }
    }
  }
  
  // Deduplicate issues (one card can only have one issue flagged)
  const seen = new Set();
  const deduped = issues.filter(i => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
  
  console.log('\nIssues found:', deduped.length);
  const byType = {};
  for (const i of deduped) {
    byType[i.issue] = (byType[i.issue] || 0) + 1;
  }
  console.log('By type:', JSON.stringify(byType));
  
  // Output repetitive tips with counts
  console.log('\n--- Repetitive tips (20+) ---');
  for (const [tip, ids] of sorted) {
    console.log(`COUNT=${ids.length} | TIP=${tip}`);
  }
  
  return { issues: deduped, repetitiveTips: sorted, tipCounts };
}

// ==================== GERMAN ANALYSIS ====================

function analyzeDE() {
  const deWithGrammar = de.filter(c => c.grammar);
  const tipCounts = countOccurrences(de);
  
  const repetitiveTips = {};
  for (const [tip, ids] of Object.entries(tipCounts)) {
    if (ids.length >= 20) {
      repetitiveTips[tip] = ids;
    }
  }
  
  console.log('\n=== GERMAN ANALYSIS ===');
  console.log('Total cards with grammar:', deWithGrammar.length);
  console.log('Unique tips:', Object.keys(tipCounts).length);
  console.log('Tips repeated 20+ times:', Object.keys(repetitiveTips).length);
  
  const sorted = Object.entries(repetitiveTips).sort((a,b) => b[1].length - a[1].length);
  console.log('\nTop repeated tips:');
  for (const [tip, ids] of sorted.slice(0, 30)) {
    console.log(`  [${ids.length}x] ${tip.substring(0, 100)}...`);
  }
  
  const issues = [];
  
  for (const card of deWithGrammar) {
    const tip = card.grammar;
    const sent = card.target;
    const eng = card.english;
    const id = card.id;
    const tipLower = tip.toLowerCase();
    const sentLower = sent.toLowerCase();
    
    // 1. Case mismatches
    // Tip mentions dative but sentence might not use dative
    if (tipLower.includes('dativ') && !tipLower.includes('vs') && !tipLower.includes('akkusativ')) {
      const dativePreps = /\b(mit|nach|bei|seit|von|zu|aus|außer|gegenüber|zum|zur|beim|vom)\b/i;
      const dativeVerbs = /\b(hilft|helfe|helfen|gefällt|gefallen|gehört|gehören|dankt|danke|danken|folgt|folge|folgen|antworte|antwortet|antworten|gratuliere|gratuliert|fehlt|fehlen|passt|passen|schmeckt|schmecken|vertraut|vertraue|glaubt|glaube|gelingt)\b/i;
      if (!dativePreps.test(sent) && !dativeVerbs.test(sent) && !sentLower.includes(' mir ') && !sentLower.includes(' dir ') && !sentLower.includes(' ihm ') && !sentLower.includes(' ihr ') && !sentLower.includes(' uns ') && !sentLower.includes(' ihnen ') && !sentLower.includes(' dem ') && !sentLower.includes(' den ') && !sentLower.includes(' einem ') && !sentLower.includes(' einer ') && !sentLower.includes(' meinem ') && !sentLower.includes(' meiner ') && !sentLower.includes(' seinem ') && !sentLower.includes(' seiner ') && !sentLower.includes(' ihrem ') && !sentLower.includes(' ihrer ')) {
        issues.push({ id, current_tip: tip, issue: 'mismatch', reason: 'Tip mentions dative case but sentence lacks dative markers' });
      }
    }
    
    // Tip mentions genitive
    if (tipLower.includes('genitiv') && !tipLower.includes('vs')) {
      const hasGenitive = /\b(des|der|eines|einer|meines|meiner|seines|seiner|ihres|ihrer|wegen|trotz|während|statt|anstatt|aufgrund|innerhalb|außerhalb)\b/i.test(sent);
      if (!hasGenitive) {
        issues.push({ id, current_tip: tip, issue: 'mismatch', reason: 'Tip mentions genitive case but sentence lacks genitive markers' });
      }
    }
    
    // 2. Subjunctive (Konjunktiv) in tip
    if (tipLower.includes('konjunktiv') || tipLower.includes('subjunctive')) {
      const hasKonjunktiv = /\b(wäre|hätte|könnte|würde|müsste|sollte|dürfte|möchte|käme|gäbe|wüsste|ginge|fände|bräuchte|täte|sei|seien|habe|wenn.*würde|als ob)\b/i.test(sent);
      if (!hasKonjunktiv && !tipLower.includes('vs') && !tipLower.includes('indicative')) {
        issues.push({ id, current_tip: tip, issue: 'mismatch', reason: 'Tip mentions Konjunktiv but sentence does not use subjunctive forms' });
      }
    }
    
    // 3. Passive voice in tip
    if (tipLower.includes('passiv') && !tipLower.includes('vs')) {
      const hasPassive = /\b(wird|werden|wurde|wurden|worden|geworden)\b.*\b(ge\w+t|ge\w+en)\b/i.test(sent) || /\b(ge\w+t|ge\w+en)\b.*\b(wird|werden|wurde|wurden)\b/i.test(sent);
      if (!hasPassive && !sentLower.includes(' wird ') && !sentLower.includes(' werden ') && !sentLower.includes(' wurde ') && !sentLower.includes(' wurden ')) {
        issues.push({ id, current_tip: tip, issue: 'mismatch', reason: 'Tip mentions passive voice but sentence does not use passive construction' });
      }
    }
    
    // 4. Separable verb tip but verb not separated
    if (tipLower.includes('trennbar') || tipLower.includes('separable')) {
      // This is fine in subordinate clauses where verb goes to end
      // Only flag if tip says "prefix separates" and verb is clearly not separated
    }
    
    // 5. Conjugation table patterns
    if (/\b(ich|du|er|sie|wir|ihr)\s*[-––:]\s*(ich|du|er|sie|wir|ihr)\s*[-––:]/i.test(tip) ||
        /ich \w+, du \w+, er \w+/i.test(tip) ||
        /\bich\b.*\bdu\b.*\ber\b.*\bwir\b.*\bsie\b/i.test(tip)) {
      issues.push({ id, current_tip: tip, issue: 'irrelevant', reason: 'Tip is a conjugation table/pattern rather than contextual explanation' });
    }
    
    // 6. Tip mentions Präteritum but sentence is present
    if ((tipLower.includes('präteritum') || tipLower.includes('preterite') || tipLower.includes('simple past')) && !tipLower.includes('vs') && !tipLower.includes('contrast') && !tipLower.includes('prefer')) {
      const hasPast = /\b(war|waren|hatte|hatten|wurde|wurden|konnte|konnten|musste|wollte|sollte|durfte|ging|kam|sah|gab|nahm|sprach|fand|stand|lag|saß|lief|fuhr|flog|trug|schlief|blieb|schrieb|las|aß|trank|wusste|kannte|brachte|dachte|nannte|rannte|begann|bekam|verstand|vergaß|hielt|rief|fiel|schlug|zog|warf|stieg|schnitt|schwamm|sang|sprang|hing|bat|half|ließ|erschien|verlor|gewann|empfahl)\b/i.test(sent);
      if (!hasPast) {
        issues.push({ id, current_tip: tip, issue: 'mismatch', reason: 'Tip mentions Präteritum/simple past but sentence is not in past tense' });
      }
    }
    
    // 7. Tip mentions Perfekt but sentence doesn't use it
    if (tipLower.includes('perfekt') && !tipLower.includes('vs') && !tipLower.includes('präteritum') && !tipLower.includes('contrast')) {
      const hasPerfekt = /\b(habe|hast|hat|haben|habt|bin|bist|ist|sind|seid)\b.*\b(ge\w+t|ge\w+en|ge\w+n)\b/i.test(sent) || /\b(ge\w+t|ge\w+en|ge\w+n)\b.*\b(habe|hast|hat|haben)\b/i.test(sent);
      if (!hasPerfekt && !sentLower.includes('ge')) {
        issues.push({ id, current_tip: tip, issue: 'mismatch', reason: 'Tip mentions Perfekt but sentence does not use Perfekt construction' });
      }
    }
    
    // 8. Accusative tip but no accusative evidence
    if (tipLower.includes('akkusativ') && !tipLower.includes('vs') && !tipLower.includes('dativ')) {
      const accPreps = /\b(durch|für|gegen|ohne|um|bis|entlang)\b/i;
      const accPronouns = /\b(mich|dich|ihn|sie|uns|euch|den|einen|einen|keinen|meinen|seinen|ihren|unseren)\b/i;
      if (!accPreps.test(sent) && !accPronouns.test(sent)) {
        // Could still be direct object - harder to detect, skip this check
      }
    }
    
    // 9. Generic filler
    if (tipLower.match(/^(practice|remember|note that|keep in mind|don't forget)/)) {
      if (tip.length < 40) {
        issues.push({ id, current_tip: tip, issue: 'irrelevant', reason: 'Generic filler tip - too short and vague' });
      }
    }
  }
  
  // Deduplicate 
  const seen = new Set();
  const deduped = issues.filter(i => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });
  
  console.log('\nIssues found:', deduped.length);
  const byType = {};
  for (const i of deduped) {
    byType[i.issue] = (byType[i.issue] || 0) + 1;
  }
  console.log('By type:', JSON.stringify(byType));
  
  console.log('\n--- Repetitive tips (20+) ---');
  for (const [tip, ids] of sorted) {
    console.log(`COUNT=${ids.length} | TIP=${tip}`);
  }
  
  return { issues: deduped, repetitiveTips: sorted, tipCounts };
}

const ptResult = analyzePT();
const deResult = analyzeDE();

// Write raw data for deeper analysis
fs.writeFileSync('/tmp/pt-analysis.json', JSON.stringify(ptResult, null, 2));
fs.writeFileSync('/tmp/de-analysis.json', JSON.stringify(deResult, null, 2));
console.log('\nWrote analysis to /tmp/pt-analysis.json and /tmp/de-analysis.json');
