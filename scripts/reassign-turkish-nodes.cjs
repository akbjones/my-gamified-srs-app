#!/usr/bin/env node
/**
 * reassign-turkish-nodes.cjs
 *
 * Strategy:
 * 1. The 6 renamed theme nodes (01, 05, 06, 07, 12, 17) had thematic content
 *    that now needs grammar-based reassignment.
 * 2. The other 29 nodes already have grammar-appropriate cards – keep those.
 * 3. Score cards from ALL nodes, but only force-reassign the 6 renamed nodes.
 *    For the other 29, only move a card if it scores drastically better elsewhere.
 * 4. After initial pass, rebalance to ensure 80–200 cards per node.
 *
 * Renamed nodes:
 *   01: "Greetings"   → "Personal pronouns & present tense"
 *   05: "Numbers"     → "Nominative & accusative cases"
 *   06: "Food"        → "Questions & interrogatives"
 *   07: "Family"      → "Adjectives & descriptions"
 *   12: "Daily routine" → "Reflexive verbs & reciprocals"
 *   17: "Directions"  → "Dative case (-e/-a)"
 */

const fs = require('fs');
const path = require('path');

const DECK_PATH = path.join(__dirname, '..', 'src', 'data', 'turkish', 'deck.json');
const deck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));
const originalDeck = JSON.parse(fs.readFileSync(DECK_PATH, 'utf-8'));

// The 6 nodes that changed meaning
const RENAMED_NODES = new Set(['node-01', 'node-05', 'node-06', 'node-07', 'node-12', 'node-17']);

// ── Helpers ──────────────────────────────────────────────────────────────

function words(text) {
  return text.replace(/[.,!?;:'"()\-––…«»""'']/g, ' ').split(/\s+/).filter(Boolean);
}

function countWords(text, re) {
  return words(text).filter(w => re.test(w)).length;
}

// ── Scoring ──────────────────────────────────────────────────────────────

function scoreCard(card) {
  const t = card.target || '';
  const e = card.english || '';
  const g = (card.grammar || '').toLowerCase();
  const tw = words(t);
  const tl = t.toLowerCase();

  const scores = {};
  for (let i = 1; i <= 35; i++) {
    scores[`node-${String(i).padStart(2, '0')}`] = 0;
  }
  const s = (n, pts) => { scores[n] += pts; };

  // ═══════════════════════════════════════════════════════════════════════
  // GRAMMAR TIP – strongest signal (20 pts)
  // ═══════════════════════════════════════════════════════════════════════
  if (g) {
    if (/\bpronoun|\bpresent\s+tense/.test(g) && !/continuous|perfect/.test(g)) s('node-01', 20);
    if (/continuous|yor\b/.test(g)) s('node-02', 20);
    if (/\bvar\b|\byok\b|there is|there isn/.test(g)) s('node-03', 20);
    if (/vowel\s+harmony/.test(g)) s('node-04', 20);
    if (/accusative|direct\s+object|nominative/.test(g)) s('node-05', 20);
    if (/question|interrogat|\bmi\b|\bmı\b/.test(g)) s('node-06', 20);
    if (/\badjective|\bdescription/.test(g) && !/compar|superlat/.test(g)) s('node-07', 18);
    if (/common\s+(express|phrase)|everyday|greeting|farewell/.test(g)) s('node-08', 18);
    if (/simple\s+past|definite\s+past|past\s+tense.*-d/.test(g)) s('node-09', 20);
    if (/aorist|habitual|general\s+truth/.test(g)) s('node-10', 20);
    if (/modal|ability|-(e|a)bil/.test(g)) s('node-11', 20);
    if (/reflexive|reciprocal|\bkendi/.test(g)) s('node-12', 20);
    if (/negat|\bdegil|\bdeğil/.test(g)) s('node-13', 20);
    if (/locative|ablative/.test(g)) s('node-14', 20);
    if (/compar|superlat|\bdaha\b/.test(g)) s('node-15', 20);
    if (/reported\s+past|evidential|hearsay|-m[iıuü]ş/.test(g)) s('node-16', 20);
    if (/\bdative\b|indirect\s+object/.test(g)) s('node-17', 20);
    if (/subordinat|clause.*-d[iı]ğ/.test(g)) s('node-18', 20);
    if (/imperative|optative|command/.test(g)) s('node-19', 20);
    if (/case\s+stack|double\s+case|object\s+mark/.test(g)) s('node-20', 20);
    if (/relative\s+clause|participl/.test(g)) s('node-21', 20);
    if (/passive/.test(g)) s('node-22', 20);
    if (/causative/.test(g)) s('node-23', 20);
    if (/future|-(e|a)cak/.test(g)) s('node-24', 20);
    if (/connector|conjunction|linking/.test(g)) s('node-25', 20);
    if (/izafet|noun\s+compound|genitive|possessive\s+compound/.test(g)) s('node-26', 20);
    if (/reported\s+speech|indirect\s+speech|\bdiye\b/.test(g)) s('node-27', 20);
    if (/\bidiom/.test(g)) s('node-28', 20);
    if (/register|formal|informal/.test(g)) s('node-29', 18);
    if (/suffix|word\s+formation|derivat/.test(g)) s('node-30', 20);
    if (/complex\s+sentence|compound\s+verb/.test(g)) s('node-31', 18);
    if (/literary|archaic|written/.test(g)) s('node-32', 18);
    if (/academic|scientific|research/.test(g)) s('node-33', 18);
    if (/cultur|tradition|custom/.test(g)) s('node-34', 18);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // TURKISH MORPHOLOGY (10–12 pts max per feature)
  // ═══════════════════════════════════════════════════════════════════════

  // Present continuous -yor
  const yorCount = tw.filter(w => /[iıuü]yor(um|sun|sunuz|uz|lar)?$/i.test(w)).length;
  if (yorCount > 0) s('node-02', 6 + Math.min(yorCount, 2) * 3);

  // Simple past -di (careful to exclude other patterns)
  const diCount = tw.filter(w => {
    if (w.length < 5) return false;
    if (/yor|m[iıuü][şs]|[ae]c[ae]k|[ae]bil/i.test(w)) return false;
    return /[dtDT][iıuü](m|n|k|niz)?$/i.test(w);
  }).length;
  if (diCount > 0) s('node-09', 4 + Math.min(diCount, 2) * 2);

  // Reported past -miş
  const misCount = tw.filter(w => w.length >= 5 && /m[iıuü][şs](ım|sın|ız|lar|tır?)?$/i.test(w)).length;
  if (misCount > 0) s('node-16', 6 + Math.min(misCount, 2) * 3);

  // Future -ecek/-acak
  const futCount = tw.filter(w => /[ae]c[ae][kğ](ım|sın|sınız|ız|lar)?$/i.test(w)).length;
  if (futCount > 0) s('node-24', 6 + Math.min(futCount, 2) * 3);

  // Aorist (very common in Turkish – give moderate weight)
  const aoristCount = tw.filter(w => {
    if (w.length < 5) return false;
    if (/^(her|bir|var|dar|kar|bar|yer|ter|zor|kadar|sonra|sıra|ara)$/i.test(w)) return false;
    if (/yor|[ae]c[ae]k|m[iıuü][şs]|[ae]bil/i.test(w)) return false;
    return /[aeiıoöuü]r(ım|sın|sınız|ız|lar)?$/i.test(w);
  }).length;
  if (aoristCount > 0) s('node-10', 3 + Math.min(aoristCount, 2) * 2);

  // Modal -ebil/-abil
  if (tw.some(w => /[ae]bil/i.test(w))) s('node-11', 8);

  // Var/yok
  if (/\bvar\b/i.test(tl)) s('node-03', 6);
  if (/\byok\b/i.test(tl)) s('node-03', 6);

  // Negation
  if (/\bdeğil\b/i.test(tl)) s('node-13', 6);
  if (tw.some(w => /m[ea](yor|[dtz]|[ck]|z|l[iıuü])/i.test(w))) s('node-13', 5);

  // Locative (known patterns)
  const locCount = tw.filter(w => /(evde|okulda|parkta|sokakta|şehirde|ülkede|bahçede|mutfakta|odada|masada|yolda|işte|dışarıda|içeride|arada|burada|orada|nerede|hastanede|otelde|caddede|meydanda|sahilde|plajda|denizde|dağda|köyde|kasabada|havaalanında|otobüste|trende|gemide|vapurda|uçakta|arabada|takside)$/i.test(w)).length;
  if (locCount > 0) s('node-14', 5 + Math.min(locCount, 3) * 2);
  // Generic locative pattern (noun+-de/-da/-te/-ta at word end, but only clear ones)
  const genericLoc = tw.filter(w => w.length >= 5 && /[dt][ea]$/i.test(w) && !/^(belde|sende|bende|elde|ade)$/i.test(w));
  if (genericLoc.length >= 2) s('node-14', 3);

  // Ablative -den/-dan
  const ablCount = tw.filter(w => w.length >= 5 && /[dt][ea]n$/i.test(w)).length;
  if (ablCount > 0) s('node-14', 3 + Math.min(ablCount, 2) * 2);

  // Dative (known patterns)
  const datCount = tw.filter(w => /(eve|okula|parka|sokağa|şehre|ülkeye|bahçeye|mutfağa|odaya|masaya|yola|dışarıya|içeriye|buraya|oraya|nereye|hastaneye|otele|caddeye|meydana|sahile|plaja|denize|dağa|köye|kasabaya|havaalanına|otobüse|trene|gemiye|vapura|uçağa|arabaya|taksiye|işe)$/i.test(w)).length;
  if (datCount > 0) s('node-17', 5 + Math.min(datCount, 3) * 2);

  // Accusative (known patterns)
  const accCount = tw.filter(w => /(kitabı|arabayı|kapıyı|suyu|evi|yemeği|dersi|işi|parayı|çayı|kahveyi|ekmeği|sütü|filmi|haberi|mektubu|gazeteyi|telefonu|bilgisayarı|cevabı|soruyu|yolu|sözü|hayatı|dünyayı|ülkeyi|şehri|odayı|masayı|arabayı|otobüsü|treni|uçağı|bavulu|çantayı|anahtarı|kapıyı|pencereyi|sandalyeyi|tabağı|bardağı|bıçağı|kaşığı|çatalı)$/i.test(w)).length;
  if (accCount > 0) s('node-05', 5 + Math.min(accCount, 3) * 2);

  // Genitive + possessive (izafet)
  const genCount = tw.filter(w => w.length >= 4 && /n[iıuü]n$/i.test(w) && !/^(onun|bunun|şunun)$/i.test(w)).length;
  if (genCount > 0) s('node-26', 4 + genCount * 2);

  // Relative clause
  if (tw.some(w => w.length >= 5 && /d[iı][gğ][iıuü]$/i.test(w))) s('node-21', 6);

  // Subordinate markers
  if (tw.some(w => /d[iı][gğ][iıuü]nd[ae]$/i.test(w))) s('node-18', 7);
  if (tw.some(w => /[iı]nc[ae]$/i.test(w) && w.length >= 5)) s('node-18', 6);
  if (tw.some(w => /[ae]r[ae]k$/i.test(w) && w.length >= 5)) s('node-18', 5);
  if (/\bçünkü\b|\bzira\b/i.test(tl)) s('node-18', 4);

  // Conditional -se/-sa
  if (tw.some(w => w.length >= 5 && /s[ae](m|n|nız|k|lar)?$/i.test(w))) s('node-18', 4);
  if (/\bkeşke\b/i.test(tl)) s('node-31', 5);
  if (/saydı|seydı|saydık|seydik/i.test(tl)) s('node-31', 6);

  // Passive
  if (tw.some(w => w.length >= 7 && /[iıuü]l[iıuü]?(yor|[dt][iıuü]|m[iıuü][şs]|[ae]c[ae]k)/i.test(w))) s('node-22', 6);

  // Causative
  if (tw.some(w => w.length >= 8 && /[dt][iıuü]r(ıyor|[dt][iıuü]|m[iıuü][şs]|[ae]c[ae]k)/i.test(w))) s('node-23', 6);

  // Imperative
  if (t.endsWith('!') && tw.length <= 4) s('node-19', 6);
  if (/^(gel|git|yap|al|ver|bak|dur|oku|yaz|aç|kapa|söyle|dinle|bekle|koş|otur|kalk|sus|kes|tut|at|sat|bırak)\s/i.test(tl)) s('node-19', 5);

  // Questions
  if (t.includes('?')) s('node-06', 6);
  if (/\b(ne|nere|nasıl|kaç|kim|neden|niçin|hangi|niye)\b/i.test(tl)) s('node-06', 4);
  if (/\bm[iıuü]\b/i.test(tl) && t.includes('?')) s('node-06', 3);

  // Reflexive / reciprocal
  if (/\bkendi(m|n|si|miz|niz|leri)?\b/i.test(tl)) s('node-12', 10);
  if (/\bbirbir/i.test(tl)) s('node-12', 12);

  // Adjectives
  const ADJ_RE = /\b(güzel|büyük|küçük|uzun|kısa|hızlı|yavaş|eski|yeni|sıcak|soğuk|zor|kolay|önemli|mutlu|üzgün|iyi|kötü|zengin|fakir|temiz|kirli|pahalı|ucuz|taze|genç|yaşlı|doğru|yanlış|sessiz|derin|geniş|dar|ince|kalın|yumuşak|sert|hafif|ağır|açık|kapalı|tatlı|acı|tuzlu|boş|dolu|kuru|ıslak|güçlü|zayıf|yüksek|alçak|parlak|karanlık|sağlıklı|tehlikeli|güvenli|rahat|meşhur|ünlü|harika|mükemmel|korkunç|berbat|garip|tuhaf|ilginç|sıkıcı|eğlenceli|şaşırtıcı|muhteşem)\b/i;
  const adjCount = countWords(tl, ADJ_RE);
  if (adjCount >= 2) s('node-07', 6);
  else if (adjCount >= 1) s('node-07', 3);

  // Comparatives
  if (/\bdaha\b/i.test(tl)) s('node-15', 7);
  if (/\ben\s+(güzel|büyük|küçük|iyi|kötü|önemli|hızlı|yavaş|uzun|kısa|çok|az)\b/i.test(tl)) s('node-15', 7);

  // Connectors
  if (/\b(ancak|fakat|lakin|oysa|halbuki|nitekim|dolayısıyla|üstelik|böylece|öte\s+yandan|her\s+ne\s+kadar|gerçi|ne\s+var\s+ki|bununla\s+birlikte|bunun\s+yanı\s+sıra)\b/i.test(tl)) s('node-25', 8);

  // Formal register
  if (/\b(efendim|buyurun|zatıâliniz|müsaade|bilvesile|hususunda|tarafınızdan)\b/i.test(tl)) s('node-29', 8);
  if (/\blütfen\b/i.test(tl)) s('node-29', 2);

  // Reported speech
  if (/\bdiye\b/i.test(tl)) s('node-27', 8);
  if (/\b(demiş|söylemiş|anlattı|dediler|söylediler|sormuş)\b/i.test(tl)) s('node-27', 6);

  // Idioms
  if (/\b(ağzın|gözün|başın|elin|ayağın|kalbin|canın|aklın|yüzün|başı|gözü|ağzı|canı|eli|aklı)\b/i.test(tl)) s('node-28', 4);
  // Turkish proverbs and sayings
  if (tw.length <= 8 && !t.includes('?') && !t.includes('!') && /\b(su|ateş|taş|kuş|kurt|köpek|aslan|at|balık|arı)\b/i.test(tl)) s('node-28', 2);

  // Academic
  if (/\b(araştırma|bilimsel|hipotez|analiz|sentez|kavram|teori|yöntem|bulgu|sonuç|olgu|kuram|deney|gözlem|tez|makale)\b/i.test(tl)) s('node-33', 7);

  // Literary/archaic
  if (/\b(lakin|vaktiyle|ezcümle|binaenaleyh|müstakbel|hâlihazırda|velhasıl|hakeza|maahaza)\b/i.test(tl)) s('node-32', 8);

  // Personal pronouns (for node-01)
  const prons = countWords(tl, /^(ben|sen|o|biz|siz|onlar|benim|senin|onun|bizim|sizin|onların|beni|seni|onu|bizi|sizi|onları|bana|sana|ona|bize|size|onlara|bende|sende|onda|bizde|sizde|onlarda|benden|senden|ondan|bizden|sizden|onlardan)$/i);
  if (prons >= 2) s('node-01', 5);
  else if (prons >= 1) s('node-01', 2);

  // ═══════════════════════════════════════════════════════════════════════
  // ENGLISH-SIDE (light)
  // ═══════════════════════════════════════════════════════════════════════
  if (e) {
    if (/\b(will|going to)\b/i.test(e)) s('node-24', 2);
    if (/\b(can|could|must|should|may|might)\b/i.test(e)) s('node-11', 2);
    if (/\bthan\b/i.test(e)) s('node-15', 3);
    if (/\b(said that|told me|mentioned|claimed|stated)\b/i.test(e)) s('node-27', 3);
    if (e.endsWith('?')) s('node-06', 2);
  }

  // Short expressions bias
  if (tw.length <= 3) s('node-08', 4);

  return scores;
}

// ── Assignment logic ─────────────────────────────────────────────────────

function getBestNode(scores) {
  let best = 'node-08';
  let bestScore = -1;
  for (const [node, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = node;
    }
  }
  return { node: best, score: bestScore };
}

// ── Phase 1: Score and assign ────────────────────────────────────────────

const originalDist = {};
deck.forEach(c => { originalDist[c.grammarNode] = (originalDist[c.grammarNode] || 0) + 1; });

let phase1Changes = 0;
const sampleChanges = [];

// Pre-compute all scores
const allScores = deck.map(c => scoreCard(c));

deck.forEach((card, i) => {
  const scores = allScores[i];
  const { node: bestNode, score: bestScore } = getBestNode(scores);
  const origNode = card.grammarNode;
  const origScore = scores[origNode] || 0;

  if (RENAMED_NODES.has(origNode)) {
    // Card is in a renamed node – MUST reassign based on grammar
    if (bestScore > 0) {
      if (bestNode !== origNode) {
        if (sampleChanges.length < 50) {
          sampleChanges.push({
            id: card.id, target: card.target.substring(0, 60),
            english: card.english.substring(0, 50),
            old: origNode, new: bestNode, score: bestScore,
          });
        }
        card.grammarNode = bestNode;
        phase1Changes++;
      }
    } else {
      // No strong signal – keep in original (now grammar-named) node
    }
  } else {
    // Card is in an unchanged grammar node – only move if MUCH better elsewhere
    // and original score is weak (< 3)
    if (origScore < 3 && bestScore >= origScore + 12 && bestNode !== origNode) {
      if (sampleChanges.length < 50) {
        sampleChanges.push({
          id: card.id, target: card.target.substring(0, 60),
          english: card.english.substring(0, 50),
          old: origNode, new: bestNode, score: bestScore,
        });
      }
      card.grammarNode = bestNode;
      phase1Changes++;
    }
  }
});

const afterPhase1 = {};
deck.forEach(c => { afterPhase1[c.grammarNode] = (afterPhase1[c.grammarNode] || 0) + 1; });

// ── Phase 2: Rebalance (80–200 cards) ────────────────────────────────────

const MIN_CARDS = 80;
const MAX_CARDS = 200;
let rebalanceMoves = 0;

function getDist() {
  const d = {};
  deck.forEach(c => { d[c.grammarNode] = (d[c.grammarNode] || 0) + 1; });
  for (let i = 1; i <= 35; i++) {
    const id = `node-${String(i).padStart(2, '0')}`;
    if (!d[id]) d[id] = 0;
  }
  return d;
}

for (let round = 0; round < 20; round++) {
  let moved = 0;
  const dist = getDist();

  // Fix overflow
  for (let n = 1; n <= 35; n++) {
    const nodeId = `node-${String(n).padStart(2, '0')}`;
    if (dist[nodeId] <= MAX_CARDS) continue;

    const indices = [];
    deck.forEach((c, i) => { if (c.grammarNode === nodeId) indices.push(i); });
    // Sort by score for this node ascending (weakest first)
    indices.sort((a, b) => allScores[a][nodeId] - allScores[b][nodeId]);

    const excess = dist[nodeId] - MAX_CARDS;
    let cnt = 0;
    for (const idx of indices) {
      if (cnt >= excess) break;
      // Find best alt under MAX
      let bestAlt = null, bestAltScore = -1;
      for (const [an, as] of Object.entries(allScores[idx])) {
        if (an === nodeId) continue;
        if (dist[an] >= MAX_CARDS) continue;
        if (as > bestAltScore) { bestAltScore = as; bestAlt = an; }
      }
      if (bestAlt) {
        dist[nodeId]--;
        dist[bestAlt]++;
        deck[idx].grammarNode = bestAlt;
        cnt++;
        moved++;
        rebalanceMoves++;
      }
    }
  }

  // Fix underflow – two passes: first scored candidates, then any from large nodes
  // CEFR tiers for each node
  const nodeTier = {};
  for (let i = 1; i <= 8; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'A1';
  for (let i = 9; i <= 15; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'A2';
  for (let i = 16; i <= 21; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'B1';
  for (let i = 22; i <= 27; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'B2';
  for (let i = 28; i <= 31; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'C1';
  for (let i = 32; i <= 35; i++) nodeTier[`node-${String(i).padStart(2, '0')}`] = 'C2';

  for (let n = 1; n <= 35; n++) {
    const nodeId = `node-${String(n).padStart(2, '0')}`;
    if (dist[nodeId] >= MIN_CARDS) continue;

    const needed = MIN_CARDS - dist[nodeId];
    const tier = nodeTier[nodeId];

    // Pass 1: candidates with score > 0 for this node
    const scored = [];
    deck.forEach((c, i) => {
      if (c.grammarNode === nodeId) return;
      if (dist[c.grammarNode] <= MIN_CARDS) return;
      if (allScores[i][nodeId] > 0) {
        scored.push({ idx: i, score: allScores[i][nodeId], srcNode: c.grammarNode });
      }
    });
    scored.sort((a, b) => b.score - a.score);

    let filled = 0;
    for (const c of scored) {
      if (filled >= needed) break;
      if (dist[c.srcNode] <= MIN_CARDS) continue;
      dist[c.srcNode]--;
      dist[nodeId]++;
      deck[c.idx].grammarNode = nodeId;
      filled++;
      moved++;
      rebalanceMoves++;
    }

    // Pass 2: if still under, pull from same-tier overflowing nodes (weakest-scored cards)
    if (filled < needed) {
      const sameTierOverflow = [];
      deck.forEach((c, i) => {
        if (c.grammarNode === nodeId) return;
        if (dist[c.grammarNode] <= 110) return; // only steal from well-stocked nodes
        // Prefer same tier, but accept adjacent tiers
        const srcTier = nodeTier[c.grammarNode];
        const tierDist = Math.abs('A1A2B1B2C1C2'.indexOf(tier) - 'A1A2B1B2C1C2'.indexOf(srcTier));
        if (tierDist <= 4) { // same or adjacent CEFR
          sameTierOverflow.push({
            idx: i,
            srcScore: allScores[i][c.grammarNode],
            srcNode: c.grammarNode,
            tierDist,
          });
        }
      });
      // Sort: prefer same tier, then weakest source score
      sameTierOverflow.sort((a, b) => a.tierDist - b.tierDist || a.srcScore - b.srcScore);

      for (const c of sameTierOverflow) {
        if (filled >= needed) break;
        if (dist[c.srcNode] <= 110) continue;
        dist[c.srcNode]--;
        dist[nodeId]++;
        deck[c.idx].grammarNode = nodeId;
        filled++;
        moved++;
        rebalanceMoves++;
      }
    }
  }

  if (moved === 0) break;
}

// ── Stats ────────────────────────────────────────────────────────────────

const finalDist = getDist();

let totalChanged = 0;
deck.forEach((c, i) => {
  if (c.grammarNode !== originalDeck[i].grammarNode) totalChanged++;
});

const nodeNames = {
  'node-01': 'Personal pronouns & present tense',
  'node-02': 'Present continuous (-yor)',
  'node-03': 'Var/yok',
  'node-04': 'Vowel harmony basics',
  'node-05': 'Nominative & accusative cases',
  'node-06': 'Questions & interrogatives',
  'node-07': 'Adjectives & descriptions',
  'node-08': 'Common expressions',
  'node-09': 'Simple past (-di/-dı)',
  'node-10': 'Aorist (general truths)',
  'node-11': 'Modal suffixes (-ebil/-abil)',
  'node-12': 'Reflexive verbs & reciprocals',
  'node-13': 'Negation (-me/-ma)',
  'node-14': 'Locative & ablative cases',
  'node-15': 'Adjectives & comparisons',
  'node-16': 'Reported past (-miş/-mış)',
  'node-17': 'Dative case (-e/-a)',
  'node-18': 'Subordinate clauses',
  'node-19': 'Imperative & optative',
  'node-20': 'Accusative & dative (adv)',
  'node-21': 'Relative clauses',
  'node-22': 'Passive voice',
  'node-23': 'Causative',
  'node-24': 'Future tense',
  'node-25': 'Advanced connectors',
  'node-26': 'Noun compounds (izafet)',
  'node-27': 'Reported speech',
  'node-28': 'Idiomatic expressions',
  'node-29': 'Formal vs informal',
  'node-30': 'Word formation',
  'node-31': 'Complex sentences',
  'node-32': 'Literary Turkish',
  'node-33': 'Academic discourse',
  'node-34': 'Cultural fluency',
  'node-35': 'Advanced mastery',
};

console.log('=== TURKISH GRAMMAR NODE REASSIGNMENT ===\n');
console.log('Cards per node (BEFORE → phase1 → FINAL):');
console.log('-'.repeat(80));

for (let i = 1; i <= 35; i++) {
  const id = `node-${String(i).padStart(2, '0')}`;
  const before = originalDist[id] || 0;
  const mid = afterPhase1[id] || 0;
  const after = finalDist[id] || 0;
  const delta = after - before;
  const deltaStr = delta > 0 ? `+${delta}` : delta === 0 ? '  0' : `${delta}`;
  const bar = '#'.repeat(Math.round(after / 5));
  const renamed = RENAMED_NODES.has(id) ? ' *' : '';
  const warn = after < MIN_CARDS ? ' LOW' : after > MAX_CARDS ? ' HIGH' : '';
  console.log(`  ${id} ${String(before).padStart(3)} → ${String(mid).padStart(3)} → ${String(after).padStart(3)} (${deltaStr.padStart(4)}) ${bar}${warn}${renamed}  ${nodeNames[id]}`);
}

console.log('-'.repeat(80));
console.log(`Total cards: ${deck.length}`);
console.log(`Phase 1 changes: ${phase1Changes}`);
console.log(`Phase 2 rebalance moves: ${rebalanceMoves}`);
console.log(`Total changed from original: ${totalChanged}`);
console.log(`Distribution: ${Math.min(...Object.values(finalDist))} – ${Math.max(...Object.values(finalDist))}`);
console.log(`* = renamed node`);

console.log('\n=== SAMPLE REASSIGNMENTS ===\n');
sampleChanges.slice(0, 20).forEach(ch => {
  console.log(`  ${ch.id}: ${ch.old} → ${ch.new} (score=${ch.score})`);
  console.log(`    TR: ${ch.target}`);
  console.log(`    EN: ${ch.english}`);
  console.log();
});

// Write
fs.writeFileSync(DECK_PATH, JSON.stringify(deck, null, 2) + '\n');
console.log(`Updated deck written to ${DECK_PATH}`);
