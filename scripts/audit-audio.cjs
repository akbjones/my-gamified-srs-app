#!/usr/bin/env node
/**
 * Large structured audit of every card's audio across all 11 languages.
 *
 * Checks (per language):
 *   1. COVERAGE       Every deck card has an audio file on disk
 *   2. CONSISTENCY    Every file uses the canonical encoder signature
 *   3. HEALTH         File size distribution (min, p1, median, p99, max)
 *                     + count of suspiciously tiny files (<3 KB) and giants (>200 KB)
 *   4. VALIDITY       Every file starts with a valid MP3 frame header
 *   5. SANITY         Linear correlation between text length and file size
 *                     (longer text → longer audio; outliers may indicate broken regen)
 *   6. ENCODER STAMP  Show the MP3 frame's bitrate index byte for the bulk
 *                     (each TTS provider/tier has a distinct fingerprint)
 *
 * Welsh is allowed two signatures because the bulk uses Azure direct API
 * (0x80) and the regen used Edge TTS (0x64) — both NiaNeural, different
 * bitrates. All other languages should be uniform.
 */

const fs = require('fs');
const path = require('path');

const LANGS = {
  spanish:    { prefix: 'es', canonicalSig: 0x84 },
  italian:    { prefix: 'it', canonicalSig: 0x84 },
  french:     { prefix: 'fr', canonicalSig: 0x84 },
  portuguese: { prefix: 'pt', canonicalSig: 0x84 },
  german:     { prefix: 'de', canonicalSig: 0x84 },
  dutch:      { prefix: 'nl', canonicalSig: 0x84 },
  swedish:    { prefix: 'sv', canonicalSig: 0x84 },
  turkish:    { prefix: 'tr', canonicalSig: 0x84 },
  hindi:      { prefix: 'hi', canonicalSig: 0x84 },
  russian:    { prefix: 'ru', canonicalSig: 0x84 },
  welsh:      { prefix: 'cy', canonicalSig: [0x80, 0x64] }, // two valid signatures
};

const AUDIO_DIR = 'public/quest-audio';

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const idx = Math.floor(sortedArr.length * p);
  return sortedArr[Math.min(idx, sortedArr.length - 1)];
}

function pearson(xs, ys) {
  const n = xs.length;
  if (n === 0) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += xs[i];
    sumY += ys[i];
    sumXY += xs[i] * ys[i];
    sumX2 += xs[i] * xs[i];
    sumY2 += ys[i] * ys[i];
  }
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return den === 0 ? 0 : num / den;
}

function auditLang(lang, cfg) {
  const deckPath = `src/data/${lang}/deck.json`;
  const deck = JSON.parse(fs.readFileSync(deckPath, 'utf8'));
  const result = {
    lang,
    deckCount: deck.length,
    // 1. Coverage
    missingAudioField: 0,
    missingFiles: [],
    // 2. Consistency
    signatures: new Map(),       // sig → count
    nonCanonical: [],            // files with bad signature
    canonicalSet: new Set(Array.isArray(cfg.canonicalSig) ? cfg.canonicalSig : [cfg.canonicalSig]),
    // 3. Health
    sizes: [],
    tinyFiles: [],               // <3 KB
    giantFiles: [],              // >200 KB
    // 4. Validity
    invalidMp3: [],
    // 5. Sanity
    textLens: [],                // parallel array with sizes for correlation
    // For reporting
    sampledCardId: null,
  };

  for (const card of deck) {
    if (!card.audio) { result.missingAudioField++; continue; }
    const filePath = path.join(AUDIO_DIR, card.audio);

    let buf;
    try {
      buf = fs.readFileSync(filePath);
    } catch {
      result.missingFiles.push(card.id);
      continue;
    }

    // 4. Validity — MP3 frame header check
    if (buf.length < 4 || buf[0] !== 0xff || (buf[1] & 0xe0) !== 0xe0) {
      result.invalidMp3.push({ id: card.id, audio: card.audio, firstBytes: buf.slice(0, 4).toString('hex') });
      continue;
    }

    // 2. Consistency — encoder signature
    const sig = buf[2];
    result.signatures.set(sig, (result.signatures.get(sig) || 0) + 1);
    if (!result.canonicalSet.has(sig)) {
      result.nonCanonical.push({ id: card.id, audio: card.audio, sig: '0x' + sig.toString(16) });
    }

    // 3. Health — size buckets
    result.sizes.push(buf.length);
    result.textLens.push(card.target.length);
    if (buf.length < 3000) result.tinyFiles.push({ id: card.id, audio: card.audio, size: buf.length, target: card.target.slice(0, 50) });
    if (buf.length > 200000) result.giantFiles.push({ id: card.id, audio: card.audio, size: buf.length });
  }

  // 5. Sanity — text-length vs file-size correlation
  result.correlation = pearson(result.textLens, result.sizes);

  // Size percentiles
  const sorted = [...result.sizes].sort((a, b) => a - b);
  result.sizeStats = {
    min: sorted[0],
    p01: percentile(sorted, 0.01),
    median: percentile(sorted, 0.5),
    p99: percentile(sorted, 0.99),
    max: sorted[sorted.length - 1],
    mean: Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length),
  };

  return result;
}

// Run
console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║                 LANGLAB AUDIO AUDIT — comprehensive                  ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');
console.log();

const results = [];
for (const [lang, cfg] of Object.entries(LANGS)) {
  results.push(auditLang(lang, cfg));
}

// ─── Summary table ─────────────────────────────────────────────
console.log('1. COVERAGE & CONSISTENCY');
console.log('─────────────────────────────────────────────────────────────────────────');
console.log('lang        cards   missing   invalid   non-canonical-sig   distinct-sigs');
for (const r of results) {
  const sigs = [...r.signatures.entries()].map(([s, n]) => `0x${s.toString(16)}×${n}`).join(' ');
  const status = r.missingFiles.length === 0 && r.nonCanonical.length === 0 && r.invalidMp3.length === 0 ? '✓' : '✗';
  console.log([
    r.lang.padEnd(11),
    String(r.deckCount).padStart(5),
    String(r.missingFiles.length).padStart(9),
    String(r.invalidMp3.length).padStart(9),
    String(r.nonCanonical.length).padStart(19),
    sigs,
    status,
  ].join('  '));
}
console.log();

// ─── Size health ──────────────────────────────────────────────
console.log('2. FILE SIZE HEALTH (bytes)');
console.log('─────────────────────────────────────────────────────────────────────────');
console.log('lang          min       p01    median       p99       max     tiny  giant');
for (const r of results) {
  const s = r.sizeStats;
  console.log([
    r.lang.padEnd(11),
    String(s.min).padStart(7),
    String(s.p01).padStart(9),
    String(s.median).padStart(9),
    String(s.p99).padStart(9),
    String(s.max).padStart(9),
    String(r.tinyFiles.length).padStart(8),
    String(r.giantFiles.length).padStart(6),
  ].join('  '));
}
console.log();

// ─── Sanity correlation ──────────────────────────────────────
console.log('3. TEXT-LENGTH ↔ FILE-SIZE CORRELATION');
console.log('   (higher = healthier; <0.5 indicates many broken or off-target files)');
console.log('─────────────────────────────────────────────────────────────────────────');
for (const r of results) {
  const bar = '█'.repeat(Math.round(r.correlation * 30));
  const tag = r.correlation > 0.8 ? '✓ strong'
            : r.correlation > 0.6 ? '~ moderate'
            : r.correlation > 0.4 ? '? weak'
            : '✗ poor';
  console.log(`  ${r.lang.padEnd(11)} r=${r.correlation.toFixed(3)}  ${bar.padEnd(30)} ${tag}`);
}
console.log();

// ─── Issues detail ───────────────────────────────────────────
let anyIssues = false;
for (const r of results) {
  if (r.missingFiles.length || r.invalidMp3.length || r.nonCanonical.length || r.tinyFiles.length) {
    if (!anyIssues) {
      console.log('4. ISSUES TO INVESTIGATE');
      console.log('─────────────────────────────────────────────────────────────────────────');
    }
    anyIssues = true;
    console.log(`\n● ${r.lang}`);
    if (r.missingAudioField) console.log(`    ⚠ ${r.missingAudioField} cards have no audio field`);
    if (r.missingFiles.length) {
      console.log(`    ⚠ ${r.missingFiles.length} cards reference missing files. Examples: ${r.missingFiles.slice(0,3).join(', ')}`);
    }
    if (r.invalidMp3.length) {
      console.log(`    ⚠ ${r.invalidMp3.length} files are not valid MP3.`);
      for (const x of r.invalidMp3.slice(0, 3)) console.log(`        [${x.id}] ${x.audio}  starts with ${x.firstBytes}`);
    }
    if (r.nonCanonical.length) {
      console.log(`    ⚠ ${r.nonCanonical.length} files have a non-canonical encoder signature.`);
      for (const x of r.nonCanonical.slice(0, 3)) console.log(`        [${x.id}] ${x.audio}  sig=${x.sig}`);
    }
    if (r.tinyFiles.length) {
      console.log(`    ⚠ ${r.tinyFiles.length} files smaller than 3 KB (likely silent/broken):`);
      for (const x of r.tinyFiles.slice(0, 3)) console.log(`        [${x.id}] ${x.size}B  target: ${x.target}`);
    }
    if (r.giantFiles.length > 0 && r.giantFiles.length < 20) {
      console.log(`    (info) ${r.giantFiles.length} files larger than 200 KB (could be legitimate long sentences)`);
    }
  }
}

if (!anyIssues) {
  console.log('4. NO ISSUES FOUND — clean across all 11 languages ✓');
}

// ─── Aggregate ────────────────────────────────────────────────
const totalCards = results.reduce((a, r) => a + r.deckCount, 0);
const totalSize = results.reduce((a, r) => a + r.sizes.reduce((b, c) => b + c, 0), 0);
const totalIssues = results.reduce((a, r) =>
  a + r.missingFiles.length + r.invalidMp3.length + r.nonCanonical.length + r.tinyFiles.length, 0);

console.log();
console.log('═══════════════════════════════════════════════════════════════════════');
console.log(`Total cards audited:  ${totalCards.toLocaleString()}`);
console.log(`Total audio size:     ${(totalSize / 1024 / 1024 / 1024).toFixed(2)} GB`);
console.log(`Total issues found:   ${totalIssues}`);
console.log('═══════════════════════════════════════════════════════════════════════');
