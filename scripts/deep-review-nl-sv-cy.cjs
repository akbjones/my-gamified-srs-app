#!/usr/bin/env node
/**
 * Deep grammar tip alignment review for Dutch, Swedish, and Welsh.
 * 
 * Categories of issues:
 * 1. mismatch - tip discusses grammar NOT demonstrated in the sentence
 * 2. irrelevant - tip is about a completely different topic/word  
 * 3. wrong - factually incorrect grammar explanation
 * 4. repetitive - exact same tip used on too many cards (>5 copies)
 */
const fs = require('fs');
const path = require('path');

const BASE = path.resolve(__dirname, '..');
const nl = require(path.join(BASE, 'src/data/dutch/deck.json'));
const sv = require(path.join(BASE, 'src/data/swedish/deck.json'));
const cy = require(path.join(BASE, 'src/data/welsh/deck.json'));

// ─── HELPERS ───

function hasTip(c) { return c.grammar && c.grammar.trim() !== ''; }

function findDuplicates(cards, threshold = 5) {
  const tipMap = {};
  for (const c of cards.filter(hasTip)) {
    const t = c.grammar.trim();
    if (!tipMap[t]) tipMap[t] = [];
    tipMap[t].push(c);
  }
  const dupes = [];
  for (const [tip, tipCards] of Object.entries(tipMap)) {
    if (tipCards.length > threshold) {
      // Keep first 3, flag rest as repetitive
      for (let i = 3; i < tipCards.length; i++) {
        dupes.push({
          id: tipCards[i].id,
          current_tip: tip,
          fixed_tip: '',
          issue: 'repetitive'
        });
      }
    }
  }
  return dupes;
}

// ─── DUTCH REVIEW ───

function reviewDutchDeep(cards) {
  const fixes = [];
  const flaggedIds = new Set();
  const tipped = cards.filter(hasTip);

  for (const c of tipped) {
    const tip = c.grammar;
    const sent = c.target.toLowerCase();
    const eng = (c.english || '').toLowerCase();
    let issue = null;

    // 1. Tip about "alstublieft/alsjeblieft" but neither in sentence
    if (/alstublieft|alsjeblieft/i.test(tip) && !/alstublieft|alsjeblieft/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 2. Tip about "hoe" questions but no question in sentence
    if (!issue && /'hoe'.*question|'hoe'.*manner/i.test(tip) && !/\bhoe\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 3. Tip about diminutives but no diminutive
    if (!issue && /verkleinwoord|diminuti/i.test(tip) && !/[a-z](je|tje|pje|etje|kje)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 4. Tip about passive but no passive construction
    if (!issue && /\bpassi(e|ve|ef)|lijdende vorm/i.test(tip) && !/\b(wordt|worden|werd|werden|geworden|is\s+ge|zijn\s+ge|was\s+ge|waren\s+ge)\b/.test(sent) && !/\bge\w+(d|t)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 5. Tip about reflexive but no reflexive pronoun
    if (!issue && /reflexi|wederkerend|zich|'zich'/i.test(tip) && !/\b(zich|me|mezelf|jezelf|zichzelf|ons|onszelf|je)\b/.test(sent)) {
      // 'je' can be reflexive, but also regular - only flag if tip specifically about reflexive 
      if (/reflexi|wederkerend/i.test(tip)) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 6. Tip about conditional zou/zouden but none in sentence
    if (!issue && /\bcondition(al|eel)|zou.*zouden|zouden.*zou/i.test(tip) && !/\b(zou|zouden)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 7. Tip about comparatives/superlatives but none in sentence  
    if (!issue && /comparati|superlati|vergrotende|overtreffende/i.test(tip)) {
      if (!/\b(meer|meest|minder|minst|beter|best|groter|grootst|kleiner|kleinst)\b/.test(sent) && !/\w+(er|st)e?\b/.test(sent)) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 8. Tip about "er" expletive specifically but no "er"
    if (!issue && /'er'.*expletive|expletive.*'er'|'er'.*filler|'er'.*placeholder/i.test(tip) && !/\ber\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 9. Tip about negation but sentence is positive
    if (!issue && /\bnegati|'niet'.*negat|'geen'.*negat/i.test(tip) && !/\b(niet|geen|nooit|nergens|niemand|niets|niks)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 10. Tip about questions but sentence isn't a question
    if (!issue && /\bvraagwoord|question word/i.test(tip) && !sent.includes('?') && !/\b(wie|wat|waar|wanneer|waarom|hoe|welk|welke)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 11. Tip discusses verb inversion for questions but sentence isn't a question
    if (!issue && /inversie.*vraag|question.*inver|invert.*question/i.test(tip) && !sent.includes('?')) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 12. Tip about separable verbs but sentence has no separated prefix
    if (!issue && /scheidbaar|separab.*verb|split.*verb/i.test(tip)) {
      // Check for common separated prefixes at end of sentence
      const words = sent.replace(/[.,!?]/g, '').split(/\s+/);
      const lastWord = words[words.length - 1];
      const prefixes = ['op','aan','uit','af','mee','terug','weg','bij','in','om','door','over','na','voor','rond','samen','tegen','toe','vast','open','dicht','los','klaar','neer','langs','thuis','schoon'];
      const hasSep = prefixes.some(p => words.includes(p));
      if (!hasSep && !/\b(opbellen|aankomen|uitgaan|afspreken|meenemen|terugkomen)\b/.test(sent)) {
        // Only flag if tip is very specific about separation
        if (/split in main|split.*hoofd/i.test(tip)) {
          issue = { issue: 'mismatch', fixed: '' };
        }
      }
    }

    // 13. Tip about past participle (ge-) but none in sentence
    if (!issue && /voltooid deelwoord|past participle/i.test(tip) && !/\bge\w+(d|t|en)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 14. Tip about imperfect/simple past on present tense sentence
    if (!issue && /\bimperfect|onvoltooid verleden|simple past/i.test(tip)) {
      const hasPast = /\b(was|waren|had|hadden|ging|gingen|kwam|kwamen|liep|liepen|zei|zeiden|deed|deden|zag|zagen|stond|stonden|dacht|dachten|wist|wisten|bleef|bleven|vond|vonden|gaf|gaven|nam|namen|hield|hielden|liet|lieten|schreef|schreven|bracht|brachten|viel|vielen|begon|begonnen|sprak|spraken|reed|reden|droeg|droegen|kreeg|kregen|sliep|sliepen|vloog|vlogen)\b/.test(sent);
      const hasPastSuffix = /\b\w+(te|de|tte|dde)\b/.test(sent);
      if (!hasPast && !hasPastSuffix) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 15. Tip about modal verbs but none present
    if (!issue && /\bmodal|modaal\b/i.test(tip)) {
      if (!/\b(moet|moeten|kan|kun|kunnen|wil|willen|mag|mogen|zal|zullen|kon|konden|mocht|mochten|zou|zouden|hoeft|hoeven)\b/.test(sent)) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 16. Tip about perfect tense with "hebben" but no perfect tense
    if (!issue && /perfect.*hebben|hebben.*perfect|'heb'.*'ge/i.test(tip)) {
      if (!/\b(heb|hebt|heeft|hebben)\s+ge/.test(sent) && !/\b(heb|hebt|heeft|hebben)\b/.test(sent)) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 17. Tip about "tot" but no "tot" in sentence
    if (!issue && /^'Tot'.*until/i.test(tip) && !/\btot\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 18. Tip about animal/body idioms on non-idiomatic sentence
    if (!issue && /dutch idioms often involve/i.test(tip)) {
      // Check if sentence actually contains an idiom
      const idiomWords = ['deur', 'huis vallen', 'kat', 'hond', 'neus', 'oor', 'been', 'kop'];
      if (!idiomWords.some(w => sent.includes(w))) {
        // Loose check - could be any idiom
      }
    }

    if (issue) {
      fixes.push({
        id: c.id,
        current_tip: tip,
        fixed_tip: issue.fixed,
        issue: issue.issue
      });
      flaggedIds.add(c.id);
    }
  }

  // Add duplicates
  const dupes = findDuplicates(cards, 5);
  for (const d of dupes) {
    if (!flaggedIds.has(d.id)) {
      fixes.push(d);
      flaggedIds.add(d.id);
    }
  }

  return { total: tipped.length, fixes };
}

// ─── SWEDISH REVIEW ───

function reviewSwedishDeep(cards) {
  const fixes = [];
  const flaggedIds = new Set();
  const tipped = cards.filter(hasTip);

  for (const c of tipped) {
    const tip = c.grammar;
    const sent = c.target.toLowerCase();
    const eng = (c.english || '').toLowerCase();
    let issue = null;

    // 1. "Tack" tip but no tack in sentence
    if (/^"Tack" means thanks/i.test(tip) && !/\btack\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 2. German comparison (irrelevant for Swedish learners)
    if (!issue && /if you know german|parallel.*german|german.*strong.*weak/i.test(tip)) {
      issue = { issue: 'irrelevant', fixed: '' };
    }

    // 3. "Hej" greeting tip on non-greeting sentence
    if (!issue && /^"Hej" is informal|"hej".*informal/i.test(tip) && !/\bhej\b/.test(sent) && !/god dag/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 4. Group 1 (-ar) tip on sentence with no -ar verb
    if (!issue && /group 1.*\(-ar\)|group 1 verb|\(-ar\).*largest/i.test(tip)) {
      if (!/\w+ar\b/.test(sent)) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 5. Strong verbs/group 4 on non-strong verb sentence
    if (!issue && /strong verb.*group 4|group 4.*strong|group 4 verb/i.test(tip)) {
      const strongForms = /\b(gå|gick|gått|se|såg|sett|ta|tog|tagit|ge|gav|gett|dra|drog|dragit|bli|blev|blivit|skriva|skrev|skrivit|bryta|bröt|brutit|bära|bar|burit|komma|kom|kommit|springa|sprang|sprungit|sjunga|sjöng|sjungit|dricka|drack|druckit|sitta|satt|suttit|ligga|låg|legat|stå|stod|stått|fara|for|farit|slå|slog|slagit|hålla|höll|hållit|falla|föll|fallit|äta|åt|ätit|sova|sov|sovit|le|log|lett|njuta|njöt|njutit|vinna|vann|vunnit|flyga|flög|flugit)\b/.test(sent);
      if (!strongForms) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 6. Reflexive tip but no reflexive pronoun
    if (!issue && /reflexiv|'sig'|reflexive pronoun/i.test(tip)) {
      if (!/\b(sig|mig|dig|oss|er)\b/.test(sent)) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 7. Shoes-off cultural tip on non-home sentence
    if (!issue && /taking shoes off|unspoken rule.*homes/i.test(tip)) {
      if (!/\b(skor?|hem|hemma|hus|inne|inomhus)\b/.test(sent)) {
        issue = { issue: 'irrelevant', fixed: '' };
      }
    }

    // 8. Modal verb tip but no modal in sentence
    if (!issue && /^Modal verbs:|^"Modal"|modal.*kan.*ska/i.test(tip)) {
      if (!/\b(kan|kunde|ska|skall|skulle|vill|ville|måste|bör|borde|får|fick)\b/.test(sent)) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 9. Conditional tip but no 'skulle' 
    if (!issue && /conditional.*skulle|skulle.*conditional/i.test(tip) && !/\bskulle\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 10. Passive -s tip but no s-passive
    if (!issue && /s-passive|passive.*-s form|passiv.*-s/i.test(tip)) {
      // Check if any verb ends in -s (s-passive)
      if (!/\b\w+(s)\b/.test(sent) || /\b(hans|hennes|deras|oss|dess)\b/.test(sent)) {
        // Common -s words that aren't passive — need more care
      }
    }

    // 11. Question tip on declarative sentence
    if (!issue && /frågeord|question word/i.test(tip) && !sent.includes('?') && !/\b(vem|vad|var|när|varför|hur|vilken|vilket|vilka)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 12. Negation tip but no negation  
    if (!issue && /'inte'.*after the verb|"inte".*after|negation.*inte/i.test(tip) && !/\b(inte|aldrig|ingen|inget|inga|ingenting)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 13. Comparative/superlative tip but none in sentence
    if (!issue && /comparativ|superlativ|jämförelse/i.test(tip)) {
      if (!/\b(mer|mest|bättre|bäst|sämre|sämst|större|störst|mindre|minst)\b/.test(sent) && !/\w+(are|ast|re|st)\b/.test(sent)) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 14. Group 3 (-r, past -dde) tip on non-group-3 sentence
    if (!issue && /group 3.*short.*vowel|group 3.*-dde|group 3.*add -r/i.test(tip)) {
      // Group 3 verbs: bo, tro, sy, nå, må, etc. (short stem ending in vowel)
      if (!/\b(bor|tror|syr|når|mår|rår|ror|dör|gör|slår|går|står)\b/.test(sent)) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 15. Separable verbs tip but no separated verb
    if (!issue && /separable.*split|split.*main clause|separab.*verb/i.test(tip)) {
      // Swedish separable: "ringer upp", "tittar på", etc.
      const particles = ['upp', 'ner', 'ut', 'in', 'av', 'på', 'om', 'an', 'bort', 'ihop', 'isär', 'med', 'till', 'tillbaka', 'undan', 'åt', 'över'];
      const hasParticle = particles.some(p => sent.includes(' ' + p));
      if (!hasParticle) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 16. Deponent verbs tip but no deponent in sentence
    if (!issue && /deponent.*-s|s-verb.*deponent|deponent verb/i.test(tip)) {
      if (!/\b(finns|hoppas|minnas|lyckas|andas|brås|fattas|kräks|låtsas|synas|svettas|trivs|törs|undras)\b/.test(sent)) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 17. "Hur" question tip but no "hur" and no question
    if (!issue && /'hur'.*manner|'hur'.*degree/i.test(tip) && !/\bhur\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    if (issue) {
      fixes.push({
        id: c.id,
        current_tip: tip,
        fixed_tip: issue.fixed,
        issue: issue.issue
      });
      flaggedIds.add(c.id);
    }
  }

  // Add duplicates
  const dupes = findDuplicates(cards, 5);
  for (const d of dupes) {
    if (!flaggedIds.has(d.id)) {
      fixes.push(d);
      flaggedIds.add(d.id);
    }
  }

  return { total: tipped.length, fixes };
}

// ─── WELSH REVIEW ───

function reviewWelshDeep(cards) {
  const fixes = [];
  const flaggedIds = new Set();
  const tipped = cards.filter(hasTip);

  for (const c of tipped) {
    const tip = c.grammar;
    const sent = c.target.toLowerCase();
    const eng = (c.english || '').toLowerCase();
    let issue = null;

    // 1. "Llaeth" tip but no llaeth in sentence
    if (/\bllaeth\b/i.test(tip) && !/llaeth/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 2. "Blasus/flasus" tip but neither in sentence
    if (!issue && /\bblasus\b/i.test(tip) && !/\b(blasus|flasus)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 3. "Galwch ambiwlans" tip but sentence doesn't contain it
    if (!issue && /galwch ambiwlans/i.test(tip) && !/galwch/.test(sent) && !/ambiwlans/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 4. "Roedd hi'n bwrw glaw" tip but no bwrw glaw
    if (!issue && /roedd hi'n bwrw glaw/i.test(tip) && !/bwrw glaw/.test(sent) && !/bwrw/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 5. "Tywydd" tip but no tywydd in sentence
    if (!issue && /^"Tywydd"/i.test(tip) && !/tywydd/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 6. "Mae'r" tip but no mae'r
    if (!issue && /"mae'r".*contraction|'mae'r'.*contraction/i.test(tip) && !/mae'r/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 7. "Mor" + adj tip but no "mor" 
    if (!issue && /^"Mor".*adjective|"mor".*"as\/so"/i.test(tip) && !/\bmor\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 8. "Eisiau" tip but no eisiau in sentence
    if (!issue && /^"Eisiau"/i.test(tip) && !/eisiau/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 9. "Mae pen tost" tip but no "pen tost" in sentence
    if (!issue && /mae pen tost/i.test(tip) && !/pen tost/.test(sent) && !/pen/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 10. "Yn gywir" tip on non-letter sentence
    if (!issue && /^"Yn gywir"/i.test(tip) && !/yn gywir/.test(sent) && !/llythyr|letter/.test(eng)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 11. "Arholiad" tip but no arholiad
    if (!issue && /^"Arholiad"/i.test(tip) && !/arholiad/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 12. "Basai" conditional tip but no basai/baswn/basech
    if (!issue && /^"Basai/i.test(tip) && !/\b(basai|baswn|baset|basen|basech)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 13. "Fi sy'n" tip but no "fi sy'n" 
    if (!issue && /^"Fi sy'n"/i.test(tip) && !/fi sy'n/.test(sent) && !/fi sy/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 14. Feminine adj mutation tip but sentence has no feminine adj pattern
    if (!issue && /^Feminine adjectives take soft mutation/i.test(tip) && !/merch|menyw|cath|afon|pont|ysgol|gardd|coeden|cadair|ffenestr|gwlad|stori|noson|llaw/.test(sent)) {
      // Loose check - many feminine nouns exist
    }

    // 15. "After dy" tip but no "dy" in sentence
    if (!issue && /^After "dy"/i.test(tip) && !/\bdy\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 16. "A" relative pronoun tip but no "a" relative
    if (!issue && /^"A" is used for non-present/i.test(tip) && !/\ba\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 17. "Er bod" tip but no "er bod/er" in sentence  
    if (!issue && /^"Er bod"/i.test(tip) && !/er bod/.test(sent) && !/\ber\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 18. T.H. Parry-Williams literary tip on non-literary sentence
    if (!issue && /T\.H\. Parry-Williams|Waldo Williams/i.test(tip)) {
      if (!/bardd|cerdd|poem|llenydd|literature|parry|williams|waldo/.test(sent + ' ' + eng)) {
        issue = { issue: 'irrelevant', fixed: '' };
      }
    }

    // 19. "Llawn-amser/rhan-amser" tip but neither in sentence
    if (!issue && /^"Llawn-amser"/i.test(tip) && !/llawn-amser|rhan-amser/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 20. "Punt" (pound) tip but no punt in sentence
    if (!issue && /^"Punt".*mutate/i.test(tip) && !/punt|bunt/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 21. "Annwyd" cold/illness tip but no annwyd
    if (!issue && /^"Annwyd"/i.test(tip) && !/annwyd/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 22. "Paned" tip but no paned
    if (!issue && /\bpaned\b/i.test(tip) && !/paned/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 23. "Fy" nasal mutation tip but no "fy" in sentence
    if (!issue && /^"Fy".*nasal|fy.*nasal mutation/i.test(tip) && !/\bfy\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 24. Conditional forms tip but no conditional in sentence
    if (!issue && /^Conditional forms: baswn/i.test(tip) && !/\b(baswn|baset|basai|basen|basech|faswn|faset|fasai|fasen|fasech)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 25. "Ddoe" tip but no "ddoe" in sentence
    if (!issue && /^"Ddoe"/i.test(tip) && !/ddoe/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 26. Vigesimal counting tip on non-number sentence
    if (!issue && /vigesimal|base-20/i.test(tip) && !/\b(ugain|deugain|trigain|un|dau|dwy|tri|tair|pedwar|pedair|pump|chwech|saith|wyth|naw|deg)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 27. "Dau/dwy" tip but neither in sentence
    if (!issue && /^"Dau\/dwy"/i.test(tip) && !/\b(dau|dwy)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 28. "Faswn i ddim" tip but not in sentence
    if (!issue && /^"Faswn i ddim"/i.test(tip) && !/faswn/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 29. "Talu" pay tip but no talu/dalu
    if (!issue && /^"Talu"/i.test(tip) && !/talu|dalu/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 30. "Wrthi'n" tip but not in sentence
    if (!issue && /^"Wrthi'n"/i.test(tip) && !/wrthi/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 31. "Iaith" tip but not in sentence
    if (!issue && /^"Iaith"/i.test(tip) && !/iaith/.test(sent) && !/gymraeg/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 32. "Arfer" tip but not in sentence
    if (!issue && /^"Arfer"/i.test(tip) && !/arfer/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 33. "Cafodd" passive tip but no cafodd
    if (!issue && /^"Cafodd".*passive/i.test(tip) && !/cafodd/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 34. "Englyn" poetry tip on non-poetry sentence
    if (!issue && /^"Englyn"/i.test(tip) && !/englyn|cerdd|bardd/.test(sent + ' ' + eng)) {
      issue = { issue: 'irrelevant', fixed: '' };
    }

    // 35. "Annwyl Syr/Madam" tip on non-letter sentence
    if (!issue && /^"Annwyl/i.test(tip) && !/annwyl/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 36. "Bydda i'n" future tip but no bydda/bydd
    if (!issue && /^"Bydda i'n"/i.test(tip) && !/bydda/.test(sent) && !/bydd/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 37. Future with bod tip but no future form
    if (!issue && /^Future with "bod"/i.test(tip) && !/\b(bydda|byddi|bydd|byddwn|byddwch|byddan|fydda|fyddi|fydd|fyddwn|fyddwch|fyddan)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 38. Imperfect "roedd-" tip but no imperfect form  
    if (!issue && /^The imperfect uses "roedd-"/i.test(tip) && !/\b(roeddwn|roeddet|roedd|roedden|oeddwn|oeddet|oedd|oedden|ro'n|ro't)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 39. "Nid" negation tip but no "nid"
    if (!issue && /^"Nid" negat/i.test(tip) && !/\bnid\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 40. "Fydda i ddim" future negative but not in sentence
    if (!issue && /^"Fydda i ddim"/i.test(tip) && !/fydda/.test(sent) && !/fydd/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 41. "Rhaid" must tip but no rhaid
    if (!issue && /^"Rhaid"/i.test(tip) && !/rhaid/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 42. "Cymru am byth" tip on unrelated sentence
    if (!issue && /cymru am byth/i.test(tip) && !/cymru am byth/.test(sent) && !/cymru/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 43. "Cywydd" poetry tip on non-poetry sentence
    if (!issue && /^"Cywydd"/i.test(tip) && !/cywydd|cerdd|bardd/.test(sent + ' ' + eng)) {
      issue = { issue: 'irrelevant', fixed: '' };
    }

    // 44. "Noson lawen" tip on non-entertainment sentence
    if (!issue && /^"Noson lawen"/i.test(tip) && !/noson lawen/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 45. "Prifysgol" tip but no prifysgol
    if (!issue && /^"Prifysgol"/i.test(tip) && !/prifysgol/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 46. "Mwy" tip but no mwy
    if (!issue && /^"Mwy" means/i.test(tip) && !/\bmwy\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 47. "A fydd" question tip but no "fydd" question
    if (!issue && /^"A fydd/i.test(tip) && !/\bfydd\b/.test(sent) && !sent.includes('?')) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 48. "Gwnes i" past tip but no gwnes
    if (!issue && /^"Gwnes i"/i.test(tip) && !/gwnes/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 49. "Wedi'i" passive tip but no wedi'i
    if (!issue && /^"Wedi'i"/i.test(tip) && !/wedi'i/.test(sent) && !/wedi/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 50. Impersonal "-wyd" tip but no -wyd
    if (!issue && /impersonal.*-wyd|"-wyd" ending/i.test(tip) && !/\w+wyd\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 51. Eisteddfod tip on non-Eisteddfod sentence  
    if (!issue && /^The Eisteddfod/i.test(tip) && !/eisteddfod/.test(sent + ' ' + eng)) {
      issue = { issue: 'irrelevant', fixed: '' };
    }

    // 52. Nasal mutation table on sentence with no nasal mutation
    if (!issue && /^Nasal mutation: c→ngh/i.test(tip) && !/\b(yn|fy|ym|yng)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 53. "Cofion gorau" tip on non-letter sentence
    if (!issue && /^"Cofion gorau"/i.test(tip) && !/cofion/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 54. "Ar fin" about-to tip but no "ar fin"
    if (!issue && /^"Ar fin"/i.test(tip) && !/ar fin/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 55. Impersonal "-ir" passive but no -ir
    if (!issue && /impersonal.*"-ir"|"-ir" ending/i.test(tip) && !/\w+ir\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 56. "Pluperfect" tip but no pluperfect
    if (!issue && /^Pluperfect:/i.test(tip) && !/\b(roeddwn|roeddet|roedd|oeddwn|oeddet|oedd|ro'n)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 57. "Negative relative: nad" but no "nad"
    if (!issue && /^Negative relative.*"nad"/i.test(tip) && !/\bnad\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 58. Welsh fronting tip but sentence doesn't demonstrate fronting
    if (!issue && /^Welsh uses fronting/i.test(tip)) {
      // Fronting means a non-subject element comes first for emphasis
      // Hard to detect programmatically — skip
    }

    // 59. "Dy" mutation tip but no "dy"
    if (!issue && /after "dy"|after dy/i.test(tip) && !/\bdy\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 60. "Dylwn" should tip but no dylwn/ddylwn
    if (!issue && /^"Dylwn/i.test(tip) && !/dylwn|ddylwn|dylet|ddylet|dylai|ddylai|dylen|ddylen|dylech|ddylech/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 61. "Diolch" tip on non-thanks sentence
    if (!issue && /^"Diolch".*most important/i.test(tip) && !/diolch/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 62. "Peidiwch â" negative imperative but not in sentence
    if (!issue && /^"Peidiwch â"/i.test(tip) && !/peidiwch/.test(sent) && !/paid/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 63. "Mabinogi" literary tip on non-literary sentence
    if (!issue && /^The Mabinogi/i.test(tip) && !/mabinogi/.test(sent + ' ' + eng)) {
      issue = { issue: 'irrelevant', fixed: '' };
    }

    // 64. "Methodolog" tip on non-methodology sentence
    if (!issue && /^"Methodoleg"/i.test(tip) && !/methodoleg/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 65. "Ymchwil" tip but no ymchwil
    if (!issue && /^"Ymchwil"/i.test(tip) && !/ymchwil/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 66. "Er mwyn" tip but no er mwyn
    if (!issue && /^"Er mwyn"/i.test(tip) && !/er mwyn/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 67. "Achos"/"oherwydd" because tip but neither in sentence
    if (!issue && /^"Achos".*"oherwydd"/i.test(tip) && !/\b(achos|oherwydd)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 68. "Cyn"/"ar ôl" tip but neither in sentence
    if (!issue && /^"Cyn".*"ar ôl"/i.test(tip) && !/\b(cyn|ar ôl)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 69. Family mutation tip but no family word
    if (!issue && /^Family words mutate/i.test(tip) && !/\b(tad|nhad|mam|brawd|mrawd|chwaer|ewythr|modryb|nain|taid)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 70. Aspirate mutation only c,p,t tip on sentence without aspirate context
    if (!issue && /^Aspirate mutation only affects/i.test(tip) && !/\b(â|a|ei|na|tri|chwe|chwech)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 71. "Yn" before places tip but no "yn" + place
    if (!issue && /^"Yn".*place names.*nasal/i.test(tip) && !/\b(yng nghymru|ym mangor|yn nolgellau|yng nghaerdydd|ym mhontypridd|yn nhreforys)\b/.test(sent)) {
      if (!/\b(yng|ym)\b/.test(sent)) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 72. "Dydd Gŵyl Dewi" tip on non-St-David's sentence
    if (!issue && /Dydd Gŵyl Dewi|St David's Day/i.test(tip) && !/dewi|dydd gŵyl/.test(sent + ' ' + eng)) {
      issue = { issue: 'irrelevant', fixed: '' };
    }

    // 73. "Pe baswn i'n" conditional tip but not in sentence
    if (!issue && /^"Pe baswn/i.test(tip) && !/\bpe\b/.test(sent) && !/baswn/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 74. Irregular preterite tip but no preterite forms
    if (!issue && /^For irregular verbs, memorize the stem/i.test(tip)) {
      if (!/\b(es|dest|aeth|aethon|aethoch|des|daeth|daethon|daethoch|gwnes|gwnest|gwnaeth|gwnaethon|gwnaethoch|ces|cest|cafodd|cawson|cawsoch)\b/.test(sent)) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 75. "Bwrw glaw" raining tip but no rain
    if (!issue && /^"Bwrw glaw" means/i.test(tip) && !/bwrw glaw/.test(sent) && !/bwrw/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 76. Welsh seasons tip on non-season sentence
    if (!issue && /^Welsh seasons:/i.test(tip) && !/\b(gwanwyn|haf|hydref|gaeaf)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 77. Preterite endings tip but no preterite
    if (!issue && /^Welsh preterite has specific/i.test(tip)) {
      if (!/\b\w+(ais|aist|odd|oedd|on|och)\b/.test(sent)) {
        issue = { issue: 'mismatch', fixed: '' };
      }
    }

    // 78. "Agos" near/close tip but no agos
    if (!issue && /^"Agos".*near/i.test(tip) && !/agos/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 79. "Dal ati" tip but not in sentence
    if (!issue && /^"Dal ati"/i.test(tip) && !/dal ati/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    // 80. "Cennin Pedr" daffodils tip on non-symbol sentence
    if (!issue && /^"Cennin Pedr"/i.test(tip) && !/cennin/.test(sent)) {
      issue = { issue: 'irrelevant', fixed: '' };
    }

    // 81. Irregular comparatives tip but no comparatives
    if (!issue && /^Irregular comparatives:/i.test(tip) && !/\b(gwell|gorau|gwaeth|gwaethaf|mwy|mwyaf|llai|lleiaf)\b/.test(sent)) {
      issue = { issue: 'mismatch', fixed: '' };
    }

    if (issue) {
      fixes.push({
        id: c.id,
        current_tip: tip,
        fixed_tip: issue.fixed,
        issue: issue.issue
      });
      flaggedIds.add(c.id);
    }
  }

  // Add duplicates
  const dupes = findDuplicates(cards, 5);
  for (const d of dupes) {
    if (!flaggedIds.has(d.id)) {
      fixes.push(d);
      flaggedIds.add(d.id);
    }
  }

  return { total: tipped.length, fixes };
}

// ─── RUN ───

console.log('=== DUTCH ===');
const nlR = reviewDutchDeep(nl);
console.log(`Checked: ${nlR.total}, Flagged: ${nlR.fixes.length}`);

console.log('=== SWEDISH ===');
const svR = reviewSwedishDeep(sv);
console.log(`Checked: ${svR.total}, Flagged: ${svR.fixes.length}`);

console.log('=== WELSH ===');
const cyR = reviewWelshDeep(cy);
console.log(`Checked: ${cyR.total}, Flagged: ${cyR.fixes.length}`);

function breakdown(fixes) {
  const c = {};
  for (const f of fixes) c[f.issue] = (c[f.issue] || 0) + 1;
  return c;
}
console.log('\nBreakdown:');
console.log('NL:', JSON.stringify(breakdown(nlR.fixes)));
console.log('SV:', JSON.stringify(breakdown(svR.fixes)));
console.log('CY:', JSON.stringify(breakdown(cyR.fixes)));

const OUT = path.join(BASE, 'scripts/output');
fs.writeFileSync(path.join(OUT, 'nl-tip-fixes.json'), JSON.stringify(nlR.fixes, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'sv-tip-fixes.json'), JSON.stringify(svR.fixes, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'cy-tip-fixes.json'), JSON.stringify(cyR.fixes, null, 2) + '\n');
console.log('\nFiles written.');
