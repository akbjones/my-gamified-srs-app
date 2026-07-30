#!/usr/bin/env node
// Build the अ audio-picker artifact from the candidate manifest.
const fs = require('fs');
const M = require('/private/tmp/deva-a-candidates/manifest.json');
const OUT = '/private/tmp/claude-501/-Users-antoinevj-Documents-GitHub-my-gamified-srs-app--claude-worktrees-awesome-jones/d730b480-f040-446b-beb1-8f2e49265fb4/scratchpad/deva-a-picker.html';

// Show only the takes with real voiced content; C/D collapsed to silence.
const SHOW = ['A_current', 'B_slow_danda', 'E_double_space', 'F_period', 'G_carrier_ab'];
const cards = SHOW.map(id => M.find(c => c.id === id)).filter(Boolean);
const audioTag = c => `<audio controls preload="none" src="data:audio/mpeg;base64,${c.b64}"></audio>`;

const rows = cards.map(c => {
  const isRef = c.id === 'A_current';
  const pick = c.id.split('_')[0];
  return `
    <article class="card${isRef ? ' card--ref' : ''}">
      <div class="card__head">
        <span class="glyph" lang="hi">अ</span>
        <div class="meta">
          <div class="tagline">
            <span class="pick">${pick}</span>
            ${isRef ? '<span class="badge badge--bad">current · the broken one</span>' : '<span class="badge">candidate</span>'}
          </div>
          <p class="desc">${c.label.replace(/^[A-Z_]+\s·?\s*/, '').replace('CURRENT (the wrong one) — ', '')}</p>
          <p class="stats"><span>${c.qc.durSec}s clip</span><span>${c.qc.voicedSec}s voiced</span><span>${c.qc.rmsPeakDb} dB</span></p>
        </div>
      </div>
      ${audioTag(c)}
    </article>`;
}).join('\n');

const html = `<title>अ audio picker — LangLab Devanagari</title>
<style>
  :root {
    --bg: #faf9fc; --surface: #ffffff; --surface-2: #f4f1fa;
    --text: #1a1626; --muted: #6b6478; --faint: #9a93a8;
    --accent: #7c3aed; --accent-soft: #efe9fc; --border: #e7e2f0;
    --bad: #c2410c; --bad-soft: #fdf1ea; --bad-border: #f2d6c4;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #14111c; --surface: #1e1a29; --surface-2: #241f31;
      --text: #ece9f2; --muted: #a49db5; --faint: #6f6880;
      --accent: #a78bfa; --accent-soft: #2a2340; --border: #302a40;
      --bad: #fb923c; --bad-soft: #2c2016; --bad-border: #4a3421;
    }
  }
  :root[data-theme="light"] {
    --bg: #faf9fc; --surface: #ffffff; --surface-2: #f4f1fa;
    --text: #1a1626; --muted: #6b6478; --faint: #9a93a8;
    --accent: #7c3aed; --accent-soft: #efe9fc; --border: #e7e2f0;
    --bad: #c2410c; --bad-soft: #fdf1ea; --bad-border: #f2d6c4;
  }
  :root[data-theme="dark"] {
    --bg: #14111c; --surface: #1e1a29; --surface-2: #241f31;
    --text: #ece9f2; --muted: #a49db5; --faint: #6f6880;
    --accent: #a78bfa; --accent-soft: #2a2340; --border: #302a40;
    --bad: #fb923c; --bad-soft: #2c2016; --bad-border: #4a3421;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    line-height: 1.5; -webkit-font-smoothing: antialiased;
  }
  .wrap { max-width: 40rem; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }
  .eyebrow {
    font-size: 0.72rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase;
    color: var(--accent); margin: 0 0 0.5rem;
  }
  h1 { font-size: 1.7rem; line-height: 1.15; margin: 0 0 0.6rem; text-wrap: balance; letter-spacing: -0.01em; }
  h1 .big { font-size: 2rem; vertical-align: -0.12em; }
  .lede { color: var(--muted); font-size: 1rem; margin: 0 0 0.4rem; max-width: 34rem; }
  .lede b { color: var(--text); font-weight: 600; }
  .note {
    margin: 1.5rem 0 2rem; padding: 0.85rem 1rem; border-radius: 12px;
    background: var(--surface-2); border: 1px solid var(--border);
    font-size: 0.88rem; color: var(--muted);
  }
  .stack { display: flex; flex-direction: column; gap: 0.9rem; }
  .card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    padding: 1.1rem 1.15rem; display: flex; flex-direction: column; gap: 0.85rem;
  }
  .card--ref { background: var(--bad-soft); border-color: var(--bad-border); }
  .card__head { display: flex; align-items: center; gap: 1rem; }
  .glyph {
    font-size: 3.4rem; line-height: 1; font-weight: 700; flex: none;
    width: 4.75rem; text-align: center; color: var(--text);
    font-family: "Noto Sans Devanagari", "Kohinoor Devanagari", "Nirmala UI", system-ui, sans-serif;
  }
  .card--ref .glyph { color: var(--bad); }
  .meta { min-width: 0; }
  .tagline { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; }
  .pick {
    font-weight: 800; font-size: 0.95rem; color: var(--accent);
    background: var(--accent-soft); border-radius: 7px; padding: 0.05rem 0.5rem;
    font-variant-numeric: tabular-nums;
  }
  .card--ref .pick { color: var(--bad); background: transparent; padding-left: 0; }
  .badge {
    font-size: 0.66rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    color: var(--faint); border: 1px solid var(--border); border-radius: 999px; padding: 0.1rem 0.55rem;
  }
  .badge--bad { color: var(--bad); border-color: var(--bad-border); }
  .desc { margin: 0.1rem 0 0.35rem; font-size: 0.92rem; color: var(--text); }
  .stats { display: flex; gap: 0.9rem; margin: 0; font-size: 0.76rem; color: var(--faint); font-variant-numeric: tabular-nums; }
  audio { width: 100%; height: 40px; }
  .footer { margin-top: 2.25rem; font-size: 0.85rem; color: var(--muted); }
  .footer b { color: var(--text); }
  .target {
    display: inline-block; margin-top: 0.15rem; padding: 0.15rem 0.5rem; border-radius: 7px;
    background: var(--accent-soft); color: var(--accent); font-weight: 600; font-size: 0.85rem;
  }
</style>

<div class="wrap">
  <p class="eyebrow">LangLab · Learn to read Hindi</p>
  <h1>Which <span class="big" lang="hi">अ</span> sounds right?</h1>
  <p class="lede">The very first Devanagari letter, <b lang="hi">अ</b>, is coming out garbled in the lesson. Every other vowel is fine. Have a listen to these takes and tell me which one is a clean, short <b>“uh”</b> — the target is the <span class="target">u in “fun”</span>.</p>

  <div class="note">
    The top card is the <b>current, broken</b> clip so you can hear what’s wrong. Below it are fresh candidates — same Hindi voice as the rest of the pack, just synthesized differently (slower, different spacing, or ridden on a short carrier word). Two more takes came back near-silent and were dropped.
  </div>

  <div class="stack">
${rows}
  </div>

  <p class="footer">Just tell me the letter — <b>B, E, F, or G</b> — and I’ll trim it into place, upload it, and bump the audio cache so it lands on your phone. If none are right, say so and I’ll try other approaches (or a different voice for this one sound).</p>
</div>`;

fs.writeFileSync(OUT, html);
console.log('wrote', OUT, `(${(html.length / 1024).toFixed(0)} KB)`);
