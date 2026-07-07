/**
 * Unified language audit runner — Phase 1.
 *
 *   npx tsx scripts/audit-lang.ts <language|all> [--json] [--baseline]
 *
 * Runs the offline audits from docs/audit-checklist.md against the
 * contract registry (src/languages/registry.ts):
 *
 *   1. dict-coverage          every deck token resolves via runtime lookup
 *   2. conjugation-roundtrip  every pos:'v' token round-trips to a table
 *   3. voice-consistency      registry voice == audioService fallback map
 *   4. cache-version-pair     AUDIO_VERSION matches audio-cache-vN
 *   5. register-artifacts     policy doc + offender lexicon exist
 *   6. audio-local            every referenced audio file exists locally
 *
 * (Audio *parity* against R2 is network-heavy: scripts/verify-r2-parity.py.)
 *
 * Exit code: non-zero if any audit REGRESSES below the committed baseline
 * (docs/audit-baseline.json). With --baseline, rewrites the baseline from
 * current results instead. This makes CI green on known gaps but red on
 * any new one — gaps get burned down deliberately, not accidentally.
 */
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { REGISTRY } from '../src/languages/registry';
import type { AuditResult } from '../src/types/language';

const ROOT = new URL('..', import.meta.url).pathname;
const p = (rel: string) => ROOT + rel;

const args = process.argv.slice(2);
const target = args.find(a => !a.startsWith('--')) || 'all';
const asJson = args.includes('--json');
const writeBaseline = args.includes('--baseline');

const langs = target === 'all' ? Object.keys(REGISTRY) : [target];
if (!langs.every(l => REGISTRY[l])) {
  console.error(`Unknown language "${target}". Known: ${Object.keys(REGISTRY).join(', ')}`);
  process.exit(2);
}

interface Card { id: string; target: string; english?: string; audio?: string }

const results: AuditResult[] = [];
const audioSvc = readFileSync(p('src/services/audioService.ts'), 'utf8');
const viteCfg = readFileSync(p('vite.config.ts'), 'utf8');

// ── 4. cache-version-pair (global, run once) ────────────────────
{
  const av = audioSvc.match(/AUDIO_VERSION = '(\d+)'/)?.[1];
  const cn = viteCfg.match(/audio-cache-v(\d+)/)?.[1];
  results.push({
    language: '*', audit: 'cache-version-pair',
    pass: !!av && av === cn, metric: Number(av === cn),
    details: av === cn ? undefined : [`AUDIO_VERSION=${av} but cacheName=audio-cache-v${cn}`],
  });
}

for (const lang of langs) {
  const m = REGISTRY[lang];
  const deck: Card[] = JSON.parse(readFileSync(p(m.deckPath), 'utf8'));

  // ── 1. dict-coverage ─────────────────────────────────────────
  {
    let total = 0, hit = 0;
    const missing = new Map<string, number>();
    for (const c of deck) {
      for (const raw of m.script.tokenize(c.target)) {
        const tok = raw.replace(/[^\p{L}\p{M}-]/gu, '');
        if (!tok) continue;
        total++;
        if (m.lookup(tok) || m.lookup(m.script.lowercase(tok))) hit++;
        else missing.set(tok, (missing.get(tok) || 0) + 1);
      }
    }
    const pct = total ? (hit * 100) / total : 100;
    results.push({
      language: lang, audit: 'dict-coverage',
      pass: pct >= 99.95, metric: Number(pct.toFixed(2)),
      details: [...missing.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
        .map(([t, n]) => `${t} ×${n}`),
    });
  }

  // ── 2. conjugation-roundtrip ─────────────────────────────────
  {
    if (!m.findInfinitive) {
      results.push({
        language: lang, audit: 'conjugation-roundtrip', pass: false, metric: 0,
        details: ['engine does not export findInfinitive — contract gap'],
      });
    } else {
      let verbs = 0, ok = 0;
      const failures = new Map<string, number>();
      for (const c of deck) {
        for (const raw of m.script.tokenize(c.target)) {
          const tok = raw.replace(/[^\p{L}\p{M}-]/gu, '');
          if (!tok) continue;
          const entry = m.lookup(tok) || m.lookup(m.script.lowercase(tok));
          if (!entry || entry.pos !== 'v') continue;
          verbs++;
          const lemma = entry.lemma || m.findInfinitive(tok);
          if (!lemma) { failures.set(tok, (failures.get(tok) || 0) + 1); continue; }
          const table = m.conjugate(lemma) as { tenses?: Record<string, string[]> } | null;
          if (!table) { failures.set(tok, (failures.get(tok) || 0) + 1); continue; }
          const low = m.script.lowercase(tok);
          const forms = new Set<string>();
          for (const arr of Object.values(table.tenses || {})) {
            for (const f of arr) {
              forms.add(m.script.lowercase(f));
              for (const w of f.split(/\s+/)) forms.add(m.script.lowercase(w));
            }
          }
          if (low === m.script.lowercase(lemma) || forms.has(low)) ok++;
          else failures.set(tok, (failures.get(tok) || 0) + 1);
        }
      }
      const pct = verbs ? (ok * 100) / verbs : 100;
      results.push({
        language: lang, audit: 'conjugation-roundtrip',
        pass: pct >= 95, metric: Number(pct.toFixed(2)),
        details: [...failures.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
          .map(([t, n]) => `${t} ×${n}`),
      });
    }
  }

  // ── 3. voice-consistency ─────────────────────────────────────
  {
    if (m.voice.provider === 'google') {
      const re = new RegExp(`${lang}:\\s*\\{\\s*languageCode:\\s*'([^']+)',\\s*name:\\s*'([^']+)'`);
      const fb = audioSvc.match(re);
      const pass = !!fb && fb[1] === m.voice.languageCode && fb[2] === m.voice.name;
      results.push({
        language: lang, audit: 'voice-consistency', pass, metric: Number(pass),
        details: pass ? undefined : [`registry=${m.voice.name} fallback=${fb?.[2] ?? 'NOT FOUND'}`],
      });
    } else {
      results.push({ language: lang, audit: 'voice-consistency', pass: true, metric: 1,
        details: ['edge-tts provider — no Google fallback expected'] });
    }
  }

  // ── 5. register-artifacts ────────────────────────────────────
  {
    const missing: string[] = [];
    for (const [k, v] of Object.entries(m.registerPolicy)) {
      if (!v) missing.push(`${k}: not declared`);
      else if (!existsSync(p(v))) missing.push(`${k}: ${v} missing on disk`);
    }
    results.push({
      language: lang, audit: 'register-lexical',
      pass: missing.length === 0, metric: 2 - missing.length,
      details: missing.length ? missing : undefined,
    });
  }

  // ── 6. audio-local ───────────────────────────────────────────
  {
    const gone = deck.filter(c => !c.audio || !existsSync(p(`public/quest-audio/${c.audio}`)));
    results.push({
      language: lang, audit: 'audio-parity', // local-existence proxy; R2 parity is the python sweep
      pass: gone.length === 0, metric: deck.length - gone.length,
      details: gone.slice(0, 5).map(c => c.id),
    });
  }
}

// ── Baseline compare ────────────────────────────────────────────
const BASELINE_PATH = p('docs/audit-baseline.json');
type Base = Record<string, number>;
const keyOf = (r: AuditResult) => `${r.language}:${r.audit}`;
const current: Base = Object.fromEntries(results.map(r => [keyOf(r), r.metric]));

if (writeBaseline) {
  writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 1));
  console.log(`baseline written: ${BASELINE_PATH}`);
}
const baseline: Base = existsSync(BASELINE_PATH)
  ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) : {};

let regressions = 0;
const rows = results.map(r => {
  const base = baseline[keyOf(r)];
  const regressed = base !== undefined && r.metric < base;
  if (regressed) regressions++;
  return { ...r, base, regressed };
});

if (asJson) {
  console.log(JSON.stringify(rows, null, 1));
} else {
  console.log('language     audit                    metric    base   status');
  for (const r of rows) {
    const status = r.regressed ? 'REGRESSED' : r.pass ? 'ok' : 'gap';
    console.log(
      `${r.language.padEnd(12)} ${r.audit.padEnd(24)} ${String(r.metric).padStart(7)} ${String(r.base ?? '-').padStart(7)}   ${status}`);
    if ((r.regressed || !r.pass) && r.details?.length) {
      for (const d of r.details.slice(0, 4)) console.log(`               · ${d}`);
    }
  }
  console.log(`\n${regressions} regression(s) vs baseline; ${rows.filter(r => !r.pass).length} known gap(s).`);
}
process.exit(regressions > 0 ? 1 : 0);
