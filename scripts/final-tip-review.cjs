#!/usr/bin/env node
/**
 * FINAL grammar tip alignment review for Dutch, Swedish, and Welsh.
 * Outputs: scripts/output/{nl,sv,cy}-tip-fixes.json
 * 
 * Each entry: { id, current_tip, fixed_tip, issue }
 * issue: "mismatch" | "irrelevant" | "wrong" | "repetitive"
 */
const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const nl = require(path.join(BASE, 'src/data/dutch/deck.json'));
const sv = require(path.join(BASE, 'src/data/swedish/deck.json'));
const cy = require(path.join(BASE, 'src/data/welsh/deck.json'));

function hasTip(c) { return c.grammar && c.grammar.trim() !== ''; }

// ─── Find over-repeated tips ─── 
function findRepetitive(cards, threshold) {
  const tipMap = {};
  for (const c of cards.filter(hasTip)) {
    const t = c.grammar.trim();
    if (!tipMap[t]) tipMap[t] = [];
    tipMap[t].push(c);
  }
  const dupes = [];
  for (const [tip, tipCards] of Object.entries(tipMap)) {
    if (tipCards.length > threshold) {
      for (let i = threshold; i < tipCards.length; i++) {
        dupes.push({
          id: tipCards[i].id,
          current_tip: tip,
          fixed_tip: '',
          issue: 'repetitive'
        });
      }
    }
  }
  return { dupes, tipMap };
}

// ─── DUTCH ───

function reviewDutch() {
  const fixes = [];
  const flagged = new Set();
  const tipped = nl.filter(hasTip);

  for (const c of tipped) {
    const tip = c.grammar;
    const sent = c.target.toLowerCase();
    const eng = (c.english || '').toLowerCase();
    let fix = null;

    // "Alstublieft/alsjeblieft" tip on non-please sentences
    if (/alstublieft.*alsjeblieft|alsjeblieft.*alstublieft/i.test(tip) && !/alstublieft|alsjeblieft/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Question formation tip on non-question/exclamatory sentence
    if (!fix && /^Dutch forms questions by inverting/i.test(tip) && !sent.includes('?')) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Past tense tip on present tense sentence
    if (!fix && /^Dutch past: regular verbs use "-te\/-de"/i.test(tip)) {
      const hasPastForm = /\b(was|waren|had|hadden|ging|gingen|kwam|kwamen|liep|liepen|zei|zeiden|deed|deden|zag|zagen|stond|stonden|dacht|dachten|wist|wisten|bleef|bleven|vond|vonden|gaf|gaven|nam|namen|hield|hielden|liet|lieten|schreef|schreven|bracht|brachten|viel|vielen|begon|begonnen|sprak|spraken|reed|reden|droeg|droegen|kreeg|kregen|sliep|sliepen|vloog|vlogen)\b/.test(sent);
      const hasPastSuffix = /\b\w+(te|de|tte|dde)\b/.test(sent);
      const hasPP = /\bge\w+(d|t|en)\b/.test(sent);
      if (!hasPastForm && !hasPastSuffix && !hasPP) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      }
    }

    // Passive "worden" tip on non-worden-passive sentence
    if (!fix && /^Passive with 'worden'/i.test(tip)) {
      if (!/\b(wordt|worden|werd|werden)\b/.test(sent)) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      }
    }

    // State passive "zijn" tip but no state passive
    if (!fix && /^State passive: 'zijn'/i.test(tip)) {
      if (!/\b(is|zijn|was|waren)\s+\w*(ge\w+(d|t|en))\b/.test(sent) && !/\b(is|zijn|was|waren)\b.*\bge\w+(d|t|en)\b/.test(sent)) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      }
    }

    // Diminutive tips on non-diminutive sentences
    if (!fix && /^Diminutive.*:.*→.*je/i.test(tip) && !/[a-z](je|tje|pje|etje|kje)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Written Dutch" general observation
    if (!fix && /^Written Dutch allows more complex subordination/i.test(tip)) {
      fix = { issue: 'irrelevant', fixed_tip: '' };
    }

    // Vocabulary inventory tips (Cultural X + compound Y + formal Z format)
    if (!fix && /^Cultural '|^Academic '|^Conditional \+ cultural/i.test(tip)) {
      fix = { issue: 'irrelevant', fixed_tip: '' };
    }

    // Perfect tense tip on non-perfect sentence
    if (!fix && /^Dutch perfect tense: 'hebben\/zijn'/i.test(tip)) {
      if (!/\b(heb|hebt|heeft|hebben|ben|bent|is|zijn)\b/.test(sent) || !/\bge\w+(d|t|en)\b/.test(sent)) {
        // Check if it's clearly not perfect
        if (!/gehad|geweest|gedaan|gegaan|gekomen|gewerkt|gemaakt|gezien|gegeven|genomen/.test(sent) && !/\bge\w+\b/.test(sent)) {
          fix = { issue: 'mismatch', fixed_tip: '' };
        }
      }
    }

    // Imperfectum irregular tip but verb isn't in sentence
    if (!fix && /^Imperfectum irregular: 'helpen'/i.test(tip) && !/hielp|hielpen|helpen|help/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }
    if (!fix && /^Imperfectum: 'moeten'/i.test(tip) && !/moest|moesten|moeten|moet/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Future "zullen" tip but no zullen
    if (!fix && /^Dutch future: 'zullen'/i.test(tip) && !/\b(zal|zullen|zou|zouden)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // 'Ontkende dat' tip but no ontkende
    if (!fix && /^'Ontkende dat'/i.test(tip) && !/ontkende/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Generic 'de/het' article tip on sentences that don't focus on articles
    if (!fix && /^About two-thirds of Dutch nouns use 'de'/i.test(tip)) {
      // Only flag if sentence doesn't actually contain both de AND het
      if (!/\bde\b/.test(sent) || !/\bhet\b/.test(sent)) {
        // Still has at least one article — only flag if neither
        if (!/\b(de|het)\b/.test(sent)) {
          fix = { issue: 'mismatch', fixed_tip: '' };
        }
      }
    }

    // 'Embedded question in P1' tips - check if sentence actually has fronted clause
    if (!fix && /^Embedded question in P1/i.test(tip)) {
      // These are usually valid - sentence has a fronted subordinate clause
      // Don't flag unless clearly wrong
    }

    if (fix) {
      fixes.push({
        id: c.id,
        current_tip: tip,
        fixed_tip: fix.fixed_tip,
        issue: fix.issue
      });
      flagged.add(c.id);
    }
  }

  // Add repetitive tips (threshold: 5 copies)
  const { dupes } = findRepetitive(nl, 5);
  for (const d of dupes) {
    if (!flagged.has(d.id)) {
      fixes.push(d);
      flagged.add(d.id);
    }
  }

  return { total: tipped.length, fixes };
}

// ─── SWEDISH ───

function reviewSwedish() {
  const fixes = [];
  const flagged = new Set();
  const tipped = sv.filter(hasTip);

  // Build map of which verbs are in which group
  const group1 = new Set(); // -ar present
  const group2 = new Set(); // -er present (2a: -de past, 2b: -te past)
  const group3 = new Set(); // -r present (short stem vowel)
  const group4 = new Set(); // -er present (vowel change = strong)
  
  // Group 1 verbs (present ends in -ar): talar, arbetar, lagar, tittar, skickar, cyklar, dansar, promenerar, etc
  ['talar','arbetar','lagar','tittar','skickar','cyklar','dansar','promenerar','tvättar','lyssnar','handlar','pluggar','springer','diskar','dammsuger','bakar','simmar','klagar','planerar','studerar','sjungar','spelar','tränar','surfar','kopplar','ringer','radar','ropar','hoppar','åkar','plockar','skattar','skapar','kallar','namnar','kostar','betalar','beställar','önskar','öppnar','stängar','börjar','slutar','vandrar','reser','kastar','målar','sjungar','drömmar','övar','jobar','jobbar','stannar','lämnar','passar','saknar','tackar','hälsar','firar','festar','bryr','visar','köpar','säljar','hämtar','lämnar'].forEach(v => group1.add(v));

  // Group 4 strong verbs (present often -er, vowel change in past)
  const strongPresent = new Set(['gör','går','gå','ser','tar','ger','drar','blir','skriver','bryter','bär','kommer','springer','sjunger','dricker','sitter','ligger','står','far','slår','håller','faller','äter','sover','vinner','rider','binder','flyger','skjuter','ljuger','suger','smyger','stryker','sviker','ler','njuter','biter','griper','lider','rider','skriker','skiner','stiger','viker','bjuder']);

  for (const c of tipped) {
    const tip = c.grammar;
    const sent = c.target.toLowerCase();
    const eng = (c.english || '').toLowerCase();
    let fix = null;

    // "Tack" tip on non-tack sentence
    if (/^"Tack" means thanks/i.test(tip) && !/\btack\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Hej" greeting tip on non-hej sentence
    if (!fix && /^"Hej" is informal/i.test(tip) && !/\bhej\b/.test(sent) && !/\bgod dag\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // German comparison (irrelevant)
    if (!fix && /if you know german|parallel.*german|german.*strong.*weak/i.test(tip)) {
      fix = { issue: 'irrelevant', fixed_tip: '' };
    }

    // Shoes-off cultural tip on non-home sentence
    if (!fix && /taking shoes off/i.test(tip) && !/\b(skor?|hem|hemma|hus|inne)\b/.test(sent)) {
      fix = { issue: 'irrelevant', fixed_tip: '' };
    }

    // Group 1 (-ar) tip on non-group-1 sentence
    if (!fix && /group 1.*\(-ar\)|group 1 verb|\(-ar\).*largest|group 1.*most common/i.test(tip)) {
      if (!/\w+ar\b/.test(sent)) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      }
    }

    // "Most verbs daily are group 1" on non-ar verb
    if (!fix && /^Most verbs you'll encounter daily are group 1/i.test(tip)) {
      if (!/\w+ar\b/.test(sent)) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      }
    }

    // Group 3 tip on non-group-3 sentence
    if (!fix && /^Group 3 verbs have a short stem/i.test(tip)) {
      // Group 3: bor, tror, syr, når, mår, dör, etc.
      if (!/\b(bor|tror|syr|når|mår|dör|rår|ror|gör)\b/.test(sent)) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      }
    }

    // Specific group 3 verb tips
    if (!fix && /^'Bo' → 'bor'.*Group 3/i.test(tip) && !/\bbor?\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }
    if (!fix && /^'Gå' → 'går'.*Group 3/i.test(tip) && !/\bgår?\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Group 4 (strong) tips on non-strong verb sentences
    if (!fix && /^Strong verbs \(group 4\)|^Group 4 \(strong\)/i.test(tip)) {
      const words = sent.split(/\s+/).map(w => w.replace(/[.,!?]/g, ''));
      const hasStrong = words.some(w => strongPresent.has(w));
      // Also check past forms
      const strongPast = /\b(gick|gått|såg|sett|tog|tagit|gav|gett|drog|dragit|blev|blivit|skrev|skrivit|bröt|brutit|bar|burit|kom|kommit|sprang|sprungit|sjöng|sjungit|drack|druckit|satt|suttit|låg|legat|stod|stått|for|farit|slog|slagit|höll|hållit|föll|fallit|åt|ätit|sov|sovit|vann|vunnit|log|lett|njöt|njutit|flög|flugit|sköt|skjutit)\b/.test(sent);
      if (!hasStrong && !strongPast) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      }
    }

    // "Strong verbs are common in everyday" on non-strong verb
    if (!fix && /^Strong verbs \(group 4\) are common in everyday/i.test(tip)) {
      const words = sent.split(/\s+/).map(w => w.replace(/[.,!?]/g, ''));
      const hasStrong = words.some(w => strongPresent.has(w));
      const strongPast = /\b(gick|gått|såg|sett|tog|tagit|gav|gett|drog|dragit|blev|blivit|skrev|skrivit|bröt|brutit|bar|burit|kom|kommit|sprang|sprungit|sjöng|sjungit|drack|druckit|satt|suttit|låg|legat|stod|stått|åt|ätit|sov|sovit)\b/.test(sent);
      if (!hasStrong && !strongPast) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      }
    }

    // Specific verb group tips
    if (!fix && /^'Skriva' → 'skriver'.*Group 4/i.test(tip) && !/\b(skriva|skriver|skrev|skrivit)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }
    if (!fix && /^'Läsa' → 'läser'.*Group 2/i.test(tip) && !/\b(läsa|läser|läste|läst)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }
    if (!fix && /^'Komma' → 'kommer'.*Group 4/i.test(tip) && !/\b(komma|kommer|kom|kommit)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }
    if (!fix && /^'Jobba' → 'jobbar'.*Group 1/i.test(tip) && !/\b(jobba|jobbar|jobbade|jobbat)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }
    if (!fix && /^'Studera' → 'studerar'.*Group 1/i.test(tip) && !/\b(studera|studerar|studerade|studerat)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Group 2 verb tips
    if (!fix && /^Group 2 verbs split into 2a/i.test(tip)) {
      // Group 2 verbs have -er present. Check for presence
      if (!/\w+er\b/.test(sent)) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      }
    }
    if (!fix && /^Group 8.*supine.*-t\./i.test(tip)) {
      // Doesn't exist, group number wrong
    }

    // Reflexive tip but no reflexive use  
    if (!fix && /^Reflexive pronoun "sig"|^"Mig".*"dig".*"sig"/i.test(tip)) {
      // These tips explain reflexive pronouns - only relevant if sentence uses reflexive
      if (!/\b(sig|mig|dig|oss)\b/.test(sent)) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      } else {
        // Check if mig/dig/oss is used reflexively (not just as object pronoun)
        // Hard to detect - skip
      }
    }

    // "'Sig' is the reflexive" tip but no sig
    if (!fix && /^'Sig' is the reflexive/i.test(tip) && !/\bsig\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Hur" question tip but no hur
    if (!fix && /^'Hur'.*manner.*degree/i.test(tip) && !/\bhur\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Var" question tip but no var  
    if (!fix && /^'Var'.*location questions/i.test(tip) && !/\bvar\b/.test(sent) && !sent.includes('?')) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Vad" question tip but no vad
    if (!fix && /^'Vad'.*starts questions/i.test(tip) && !/\bvad\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Deponent verbs tip but no deponent verb
    if (!fix && /^S-verbs \(deponent\)|deponent.*-s.*active/i.test(tip)) {
      if (!/\b(finns|hoppas|minnas|lyckas|andas|brås|fattas|kräks|låtsas|synas|svettas|trivs|törs|undras)\b/.test(sent)) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      }
    }

    // "Hoppas" deponent tip but no hoppas
    if (!fix && /^'Hoppas'.*deponent/i.test(tip) && !/\bhoppas\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Supine form tip - check if sentence uses perfect tense
    if (!fix && /^The supine form.*used with 'har'/i.test(tip)) {
      if (!/\b(har|hade)\b/.test(sent)) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      }
    }

    // Group verb identification tip on wrong sentence
    if (!fix && /^If you're unsure of a verb's group/i.test(tip)) {
      // Generic tip - OK on any sentence with a verb
    }

    // Irregular verb tip
    if (!fix && /^Irregular verbs like 'vara'.*'ha'.*'göra'/i.test(tip)) {
      if (!/\b(är|var|varit|har|hade|haft|gör|gjorde|gjort)\b/.test(sent)) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      }
    }

    // "Kan" modal tip but no kan
    if (!fix && /^'Kan' \(can\)/i.test(tip) && !/\bkan\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Bra" tip but no bra
    if (!fix && /^'Bra' \(good\)/i.test(tip) && !/\bbra\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Med" tip but no med
    if (!fix && /^'Med' \(with\)/i.test(tip) && !/\bmed\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Vi" pronoun tip but no vi
    if (!fix && /^'Vi' \(we\)/i.test(tip) && !/\bvi\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "För att" tip but no för att
    if (!fix && /^'För att'.*because.*in order/i.test(tip) && !/för att/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    if (fix) {
      fixes.push({
        id: c.id,
        current_tip: tip,
        fixed_tip: fix.fixed_tip,
        issue: fix.issue
      });
      flagged.add(c.id);
    }
  }

  // Add repetitive (threshold 5)
  const { dupes } = findRepetitive(sv, 5);
  for (const d of dupes) {
    if (!flagged.has(d.id)) {
      fixes.push(d);
      flagged.add(d.id);
    }
  }

  return { total: tipped.length, fixes };
}

// ─── WELSH ───

function reviewWelsh() {
  const fixes = [];
  const flagged = new Set();
  const tipped = cy.filter(hasTip);

  for (const c of tipped) {
    const tip = c.grammar;
    const sent = c.target.toLowerCase();
    const eng = (c.english || '').toLowerCase();
    let fix = null;

    // "Llaeth" milk tip but no milk
    if (/\bllaeth\b/i.test(tip) && !/llaeth/.test(sent) && !/milk/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Blasus" tip but no blasus/flasus
    if (!fix && /\bblasus\b/i.test(tip) && !/\b(blasus|flasus)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Galwch ambiwlans" tip on unrelated sentence
    if (!fix && /galwch ambiwlans/i.test(tip) && !/galwch/.test(sent) && !/ambiwlans/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Roedd hi'n bwrw glaw" rain tip on non-rain sentence
    if (!fix && /roedd hi'n bwrw glaw/i.test(tip) && !/bwrw/.test(sent) && !/glaw/.test(sent) && !/rain/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Tywydd" weather tip on non-weather sentence
    if (!fix && /^"Tywydd"/i.test(tip) && !/tywydd/.test(sent) && !/weather/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Mae'r" contraction tip but no mae'r
    if (!fix && /"Mae'r".*contraction|'Mae'r'.*contraction/i.test(tip) && !/mae'r/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Mor" + adj tip but no mor
    if (!fix && /^"Mor" \+ adjective/i.test(tip) && !/\bmor\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Eisiau" tip on non-eisiau sentence
    if (!fix && /^"Eisiau"/i.test(tip) && !/eisiau/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Mae pen tost" headache tip on non-headache sentence
    if (!fix && /mae pen tost/i.test(tip) && !/pen tost/.test(sent) && !/headache/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Yn gywir" sincerely tip on non-letter sentence
    if (!fix && /^"Yn gywir"/i.test(tip) && !/yn gywir/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Arholiad" exam tip on non-exam sentence
    if (!fix && /^"Arholiad"/i.test(tip) && !/arholiad/.test(sent) && !/exam/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Basai" conditional on non-conditional sentence
    if (!fix && /^"Basai fe'n hapus"/i.test(tip) && !/\b(basai|baswn|baset|basen|basech|fasai|faswn|faset|fasen|fasech)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Fi sy'n" cleft on non-cleft sentence
    if (!fix && /^"Fi sy'n"/i.test(tip) && !/fi sy/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "After dy" mutation tip but no "dy"
    if (!fix && /^After "dy"/i.test(tip) && !/\bdy\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "A" relative pronoun tip on sentence without "a" relative
    if (!fix && /^"A" is used for non-present tense/i.test(tip) && !/\ba\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Er bod" although tip but no "er"
    if (!fix && /^"Er bod"/i.test(tip) && !/\ber\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // T.H. Parry-Williams/Waldo Williams literary tip on non-literary sentence
    if (!fix && /T\.H\. Parry-Williams|Waldo Williams/i.test(tip) && !/bardd|cerdd|poem|llenydd|parry|williams|waldo/.test(sent + ' ' + eng)) {
      fix = { issue: 'irrelevant', fixed_tip: '' };
    }

    // "Llawn-amser/rhan-amser" tip but neither present
    if (!fix && /^"Llawn-amser"/i.test(tip) && !/llawn-amser|rhan-amser/.test(sent) && !/full-time|part-time/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Punt" pound tip but no punt
    if (!fix && /^"Punt".*mutate/i.test(tip) && !/punt|bunt/.test(sent) && !/pound/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Annwyd" cold tip on non-illness sentence
    if (!fix && /^"Annwyd"/i.test(tip) && !/annwyd/.test(sent) && !/cold/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Paned" tea tip but no paned
    if (!fix && /\bpaned\b/i.test(tip) && !/paned/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Fy" nasal mutation tip but no "fy"
    if (!fix && /^"Fy".*nasal|^"Fy".*triggers/i.test(tip) && !/\bfy\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Conditional forms table but no conditional
    if (!fix && /^Conditional forms: baswn/i.test(tip) && !/\b(baswn|baset|basai|basen|basech|faswn|faset|fasai|fasen|fasech)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Ddoe" yesterday tip but no ddoe
    if (!fix && /^"Ddoe"/i.test(tip) && !/ddoe/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Vigesimal counting on non-number sentence
    if (!fix && /vigesimal|base-20/i.test(tip) && !/\b(ugain|deugain|trigain)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Dau/dwy" tip but neither present
    if (!fix && /^"Dau\/dwy"/i.test(tip) && !/\b(dau|dwy)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Faswn i ddim" negative conditional but no faswn
    if (!fix && /^"Faswn i ddim"/i.test(tip) && !/faswn/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Talu" pay tip but no talu/dalu
    if (!fix && /^"Talu"/i.test(tip) && !/talu|dalu/.test(sent) && !/pay/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Wrthi'n" busy tip but no wrthi
    if (!fix && /^"Wrthi'n"/i.test(tip) && !/wrthi/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Iaith" language tip on non-language sentence
    if (!fix && /^"Iaith"/i.test(tip) && !/iaith/.test(sent) && !/gymraeg/.test(sent) && !/language/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Arfer" used-to tip but no arfer
    if (!fix && /^"Arfer"/i.test(tip) && !/arfer/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Cafodd" passive but no cafodd
    if (!fix && /^"Cafodd".*passive/i.test(tip) && !/cafodd/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Englyn" poetry on non-poetry sentence
    if (!fix && /^"Englyn"/i.test(tip) && !/englyn/.test(sent + ' ' + eng)) {
      fix = { issue: 'irrelevant', fixed_tip: '' };
    }

    // "Annwyl" letter tip on non-letter
    if (!fix && /^"Annwyl/i.test(tip) && !/annwyl/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Bydda i'n" future tip but no bydda/bydd
    if (!fix && /^"Bydda i'n"/i.test(tip) && !/bydda/.test(sent) && !/bydd/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Future with "bod" tip but no future form
    if (!fix && /^Future with "bod"/i.test(tip) && !/\b(bydda|byddi|bydd|byddwn|byddwch|byddan|fydda|fyddi|fydd|fyddwn|fyddwch|fyddan)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Imperfect "roedd-" tip but no imperfect
    if (!fix && /^The imperfect uses "roedd-"/i.test(tip) && !/\b(roeddwn|roeddet|roedd|roedden|oeddwn|oeddet|oedd|oedden|ro'n|ro't)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Nid" negation but no nid
    if (!fix && /^"Nid" negat/i.test(tip) && !/\bnid\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Fydda i ddim" future negative but no fydda/fydd
    if (!fix && /^"Fydda i ddim"/i.test(tip) && !/fydda/.test(sent) && !/fydd/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Rhaid" must tip but no rhaid
    if (!fix && /^"Rhaid"/i.test(tip) && !/rhaid/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Cymru am byth" on unrelated
    if (!fix && /cymru am byth/i.test(tip) && !/cymru/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Cywydd" poetry on non-poetry
    if (!fix && /^"Cywydd"/i.test(tip) && !/cywydd/.test(sent + ' ' + eng)) {
      fix = { issue: 'irrelevant', fixed_tip: '' };
    }

    // "Noson lawen" tip on non-entertainment
    if (!fix && /^"Noson lawen"/i.test(tip) && !/noson lawen/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Prifysgol" tip but no prifysgol
    if (!fix && /^"Prifysgol"/i.test(tip) && !/prifysgol/.test(sent) && !/university/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Mwy" more/bigger tip but no mwy
    if (!fix && /^"Mwy" means/i.test(tip) && !/\bmwy\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "A fydd" question tip but no fydd
    if (!fix && /^"A fydd/i.test(tip) && !/\bfydd\b/.test(sent) && !sent.includes('?')) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Gwnes i" past tip but no gwnes
    if (!fix && /^"Gwnes i"/i.test(tip) && !/gwnes/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Wedi'i" passive tip but no wedi'i/wedi
    if (!fix && /^"Wedi'i"/i.test(tip) && !/wedi'i/.test(sent) && !/wedi/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Impersonal "-wyd" but no -wyd
    if (!fix && /impersonal.*"-wyd"|"-wyd" ending/i.test(tip) && !/\w+wyd\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Eisteddfod on non-Eisteddfod
    if (!fix && /^The Eisteddfod/i.test(tip) && !/eisteddfod/.test(sent + ' ' + eng)) {
      fix = { issue: 'irrelevant', fixed_tip: '' };
    }

    // Nasal mutation table on no-nasal sentence
    if (!fix && /^Nasal mutation: c→ngh/i.test(tip) && !/\b(yn|fy|ym|yng)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Cofion gorau" tip on non-letter
    if (!fix && /^"Cofion gorau"/i.test(tip) && !/cofion/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Ar fin" about-to tip but no ar fin
    if (!fix && /^"Ar fin"/i.test(tip) && !/ar fin/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Impersonal "-ir" passive but no -ir
    if (!fix && /^Impersonal passive.*"-ir"|"-ir" ending/i.test(tip) && !/\w+ir\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Pluperfect tip but no pluperfect
    if (!fix && /^Pluperfect:/i.test(tip) && !/\b(roeddwn|roeddet|roedd|oeddwn|oeddet|oedd|ro'n)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Negative relative: nad" but no nad
    if (!fix && /^Negative relative.*"nad"/i.test(tip) && !/\bnad\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Family mutation tip but no family word + fy
    if (!fix && /^Family words mutate after "fy"/i.test(tip) && !/\bfy\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Aspirate mutation tip on non-aspirate context
    if (!fix && /^Aspirate mutation only affects/i.test(tip)) {
      if (!/\b(â|gyda|tua|na|tri|chwe|chwech|ei)\b/.test(sent) && !/\b(ch|ph|th)\w+\b/.test(sent)) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      }
    }

    // "Yn" before places nasal tip but no relevant context
    if (!fix && /^"Yn".*place names.*nasal/i.test(tip) && !/\b(yng|ym)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Dydd Gŵyl Dewi" St David's on unrelated
    if (!fix && /Dydd Gŵyl Dewi|St David's Day/i.test(tip) && !/dewi|dydd gŵyl/.test(sent + ' ' + eng)) {
      fix = { issue: 'irrelevant', fixed_tip: '' };
    }

    // "Pe baswn" hypothetical but not in sentence
    if (!fix && /^"Pe baswn/i.test(tip) && !/\bpe\b/.test(sent) && !/baswn/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Irregular preterite tip but no preterite
    if (!fix && /^For irregular verbs, memorize the stem/i.test(tip)) {
      if (!/\b(es|dest|aeth|aethon|aethoch|des|daeth|daethon|daethoch|gwnes|gwnest|gwnaeth|gwnaethon|gwnaethoch|ces|cest|cafodd|cawson|cawsoch)\b/.test(sent)) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      }
    }

    // "Bwrw glaw" raining tip but no rain
    if (!fix && /^"Bwrw glaw" means/i.test(tip) && !/bwrw/.test(sent) && !/rain/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Welsh seasons tip but no season
    if (!fix && /^Welsh seasons:/i.test(tip) && !/\b(gwanwyn|haf|hydref|gaeaf)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Preterite endings tip but no preterite
    if (!fix && /^Welsh preterite has specific/i.test(tip)) {
      if (!/\b\w+(ais|aist|odd|oedd|on|och)\b/.test(sent)) {
        fix = { issue: 'mismatch', fixed_tip: '' };
      }
    }

    // "Agos" near tip but no agos
    if (!fix && /^"Agos".*near/i.test(tip) && !/agos/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Dal ati" keep going but not present
    if (!fix && /^"Dal ati"/i.test(tip) && !/dal ati/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Cennin Pedr" daffodils on non-symbol
    if (!fix && /^"Cennin Pedr"/i.test(tip) && !/cennin/.test(sent)) {
      fix = { issue: 'irrelevant', fixed_tip: '' };
    }

    // Irregular comparatives tip but no comparative
    if (!fix && /^Irregular comparatives:/i.test(tip) && !/\b(gwell|gorau|gwaeth|gwaethaf|mwy|mwyaf|llai|lleiaf)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Rhad"/"drud" cheap/expensive tip
    if (!fix && /^"Rhad".*"drud"/i.test(tip) && !/\b(rhad|drud)\b/.test(sent) && !/cheap|expensive/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Er mwyn" purpose tip but no er mwyn
    if (!fix && /^"Er mwyn"/i.test(tip) && !/er mwyn/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Achos"/"oherwydd" because tip but neither present
    if (!fix && /^"Achos".*"oherwydd"/i.test(tip) && !/\b(achos|oherwydd)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Cyn"/"ar ôl" tip but neither present
    if (!fix && /^"Cyn".*"ar ôl"/i.test(tip) && !/\b(cyn|ar ôl)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Sy/sydd" relative tip but no sy/sydd
    if (!fix && /^"Sy\/sydd"/i.test(tip) && !/\b(sy|sydd|sy'n)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Meddyg" mutates tip but no meddyg
    if (!fix && /^"Meddyg"/i.test(tip) && !/meddyg|feddyg/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Gradd" degree tip but no gradd
    if (!fix && /^"Gradd"/i.test(tip) && !/gradd/.test(sent) && !/degree/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Tystiolaeth" evidence tip but no tystiolaeth
    if (!fix && /^"Tystiolaeth"/i.test(tip) && !/tystiolaeth/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Marchnad" market tip but no marchnad
    if (!fix && /^"Marchnad"/i.test(tip) && !/marchnad/.test(sent) && !/market/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Pris" price tip but no pris
    if (!fix && /^"Pris"/i.test(tip) && !/pris/.test(sent) && !/price/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Darllen" reading tip but no darllen
    if (!fix && /^"Darllen"/i.test(tip) && !/darllen/.test(sent) && !/read/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Amserlen" timetable tip but no amserlen
    if (!fix && /^"Amserlen"/i.test(tip) && !/amserlen/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Cyflog" salary tip but no cyflog
    if (!fix && /^"Cyflog"/i.test(tip) && !/cyflog/.test(sent) && !/salary/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Swyddfa" office tip but no swyddfa
    if (!fix && /^"Swyddfa"/i.test(tip) && !/swyddfa/.test(sent) && !/office/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Cyhoeddi" publish tip but no cyhoeddi
    if (!fix && /^"Cyhoeddi"/i.test(tip) && !/cyhoeddi|gyhoeddi/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Dadansoddi" analyze tip but no dadansoddi
    if (!fix && /^"Dadansoddi"/i.test(tip) && !/dadansoddi/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Eira" snow tip but no eira/snow
    if (!fix && /^"Eira"/i.test(tip) && !/eira/.test(sent) && !/snow/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Hedfan" fly tip but no hedfan
    if (!fix && /^"Hedfan"/i.test(tip) && !/hedfan/.test(sent) && !/fly/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Gallu" can/able tip but no gallu
    if (!fix && /^"Gallu"/i.test(tip) && !/gallu/.test(sent) && !/\bgallu\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Faint" how much tip but no faint
    if (!fix && /^"Faint"/i.test(tip) && !/faint/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Dyma/dyna" demonstrative tip but neither present
    if (!fix && /^"Dyma\/dyna"/i.test(tip) && !/\b(dyma|dyna)\b/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Gyferbyn â" opposite tip but not present
    if (!fix && /^"Gyferbyn â"/i.test(tip) && !/gyferbyn/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Ar bwys" near tip but not present
    if (!fix && /^"Ar bwys"/i.test(tip) && !/ar bwys/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Pen-blwydd" birthday tip but not present
    if (!fix && /^Welsh uses "pen-blwydd"/i.test(tip) && !/pen-blwydd|penblwydd/.test(sent) && !/birthday/.test(eng)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // Mabinogi literary on non-literary
    if (!fix && /^The Mabinogi/i.test(tip) && !/mabinogi/.test(sent + ' ' + eng)) {
      fix = { issue: 'irrelevant', fixed_tip: '' };
    }

    // "Dŵr dan bont" idiom on non-idiom
    if (!fix && /^"Dŵr dan bont"/i.test(tip) && !/dŵr dan bont/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Ar bigau'r drain" idiom on non-idiom
    if (!fix && /^"Ar bigau'r drain"/i.test(tip) && !/bigau/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Hen ddigon" idiom but not present
    if (!fix && /^"Hen ddigon"/i.test(tip) && !/hen ddigon/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Methodolog" tip but not present
    if (!fix && /^"Methodoleg"/i.test(tip) && !/methodoleg/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    // "Ymchwil" tip but not present
    if (!fix && /^"Ymchwil"/i.test(tip) && !/ymchwil/.test(sent)) {
      fix = { issue: 'mismatch', fixed_tip: '' };
    }

    if (fix) {
      fixes.push({
        id: c.id,
        current_tip: tip,
        fixed_tip: fix.fixed_tip,
        issue: fix.issue
      });
      flagged.add(c.id);
    }
  }

  // Repetitive (threshold 5)
  const { dupes } = findRepetitive(cy, 5);
  for (const d of dupes) {
    if (!flagged.has(d.id)) {
      fixes.push(d);
      flagged.add(d.id);
    }
  }

  return { total: tipped.length, fixes };
}

// ─── RUN ───

const nlR = reviewDutch();
const svR = reviewSwedish();
const cyR = reviewWelsh();

function breakdown(fixes) {
  const c = {};
  for (const f of fixes) c[f.issue] = (c[f.issue] || 0) + 1;
  return c;
}

console.log('=== DUTCH ===');
console.log(`Checked: ${nlR.total}, Flagged: ${nlR.fixes.length}`);
console.log('Breakdown:', JSON.stringify(breakdown(nlR.fixes)));

console.log('\n=== SWEDISH ===');
console.log(`Checked: ${svR.total}, Flagged: ${svR.fixes.length}`);
console.log('Breakdown:', JSON.stringify(breakdown(svR.fixes)));

console.log('\n=== WELSH ===');
console.log(`Checked: ${cyR.total}, Flagged: ${cyR.fixes.length}`);
console.log('Breakdown:', JSON.stringify(breakdown(cyR.fixes)));

// Write final output
const OUT = path.join(BASE, 'scripts/output');
fs.writeFileSync(path.join(OUT, 'nl-tip-fixes.json'), JSON.stringify(nlR.fixes, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'sv-tip-fixes.json'), JSON.stringify(svR.fixes, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'cy-tip-fixes.json'), JSON.stringify(cyR.fixes, null, 2) + '\n');

console.log('\nOutput written to scripts/output/');
