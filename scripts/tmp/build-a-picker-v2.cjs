#!/usr/bin/env node
// v2 picker: refined अ takes (same method as the good vowels, de-clicked +
// tail-extended + level-matched). Republishes to the same artifact file path.
const fs = require('fs');
const D = require('/private/tmp/deva-a-candidates/manifest-v2.json');
const OUT = '/private/tmp/claude-501/-Users-antoinevj-Documents-GitHub-my-gamified-srs-app--claude-worktrees-awesome-jones/d730b480-f040-446b-beb1-8f2e49265fb4/scratchpad/deva-a-picker.html';

const audioTag = b64 => `<audio controls preload="none" src="data:audio/mpeg;base64,${b64}"></audio>`;

const rows = D.takes.map((t, i) => `
    <article class="card">
      <div class="card__head">
        <span class="glyph" lang="hi">अ</span>
        <div class="meta">
          <div class="tagline">
            <span class="pick">${t.id}</span>
            <span class="badge">rate ${t.rate}× · ${t.st.dur}s</span>
          </div>
          <p class="desc">Refined take ${i + 1} — de-clicked, tail extended, level-matched.</p>
          <p class="stats"><span>${t.st.dur}s</span><span>peak ${t.st.peakDbfs} dBFS</span></p>
        </div>
      </div>
      ${audioTag(t.b64)}
    </article>`).join('\n');

const html = `<title>अ audio picker — LangLab Devanagari</title>
<style>
  :root {
    --bg: #faf9fc; --surface: #ffffff; --surface-2: #f4f1fa;
    --text: #1a1626; --muted: #6b6478; --faint: #9a93a8;
    --accent: #7c3aed; --accent-soft: #efe9fc; --border: #e7e2f0;
    --good: #15803d; --good-soft: #eaf6ee; --good-border: #cfe8d6;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #14111c; --surface: #1e1a29; --surface-2: #241f31;
      --text: #ece9f2; --muted: #a49db5; --faint: #6f6880;
      --accent: #a78bfa; --accent-soft: #2a2340; --border: #302a40;
      --good: #4ade80; --good-soft: #16281c; --good-border: #244a30;
    }
  }
  :root[data-theme="light"] {
    --bg: #faf9fc; --surface: #ffffff; --surface-2: #f4f1fa;
    --text: #1a1626; --muted: #6b6478; --faint: #9a93a8;
    --accent: #7c3aed; --accent-soft: #efe9fc; --border: #e7e2f0;
    --good: #15803d; --good-soft: #eaf6ee; --good-border: #cfe8d6;
  }
  :root[data-theme="dark"] {
    --bg: #14111c; --surface: #1e1a29; --surface-2: #241f31;
    --text: #ece9f2; --muted: #a49db5; --faint: #6f6880;
    --accent: #a78bfa; --accent-soft: #2a2340; --border: #302a40;
    --good: #4ade80; --good-soft: #16281c; --good-border: #244a30;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text);
    font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    line-height: 1.5; -webkit-font-smoothing: antialiased; }
  .wrap { max-width: 40rem; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }
  .eyebrow { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--accent); margin: 0 0 0.5rem; }
  h1 { font-size: 1.7rem; line-height: 1.15; margin: 0 0 0.6rem; text-wrap: balance; letter-spacing: -0.01em; }
  h1 .big { font-size: 2rem; vertical-align: -0.12em; }
  .lede { color: var(--muted); font-size: 1rem; margin: 0 0 0.4rem; max-width: 34rem; }
  .lede b { color: var(--text); font-weight: 600; }
  .target { display: inline-block; padding: 0.05rem 0.45rem; border-radius: 7px; background: var(--accent-soft); color: var(--accent); font-weight: 600; }
  .note { margin: 1.5rem 0 2rem; padding: 0.85rem 1rem; border-radius: 12px; background: var(--good-soft); border: 1px solid var(--good-border); font-size: 0.88rem; color: var(--muted); }
  .note b { color: var(--text); }
  .stack { display: flex; flex-direction: column; gap: 0.9rem; }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 1.1rem 1.15rem; display: flex; flex-direction: column; gap: 0.85rem; }
  .card__head { display: flex; align-items: center; gap: 1rem; }
  .glyph { font-size: 3.4rem; line-height: 1; font-weight: 700; flex: none; width: 4.75rem; text-align: center; color: var(--text);
    font-family: "Noto Sans Devanagari", "Kohinoor Devanagari", "Nirmala UI", system-ui, sans-serif; }
  .meta { min-width: 0; }
  .tagline { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; flex-wrap: wrap; }
  .pick { font-weight: 800; font-size: 0.95rem; color: var(--accent); background: var(--accent-soft); border-radius: 7px; padding: 0.05rem 0.5rem; font-variant-numeric: tabular-nums; }
  .badge { font-size: 0.66rem; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--faint); border: 1px solid var(--border); border-radius: 999px; padding: 0.1rem 0.55rem; font-variant-numeric: tabular-nums; }
  .desc { margin: 0.1rem 0 0.35rem; font-size: 0.92rem; color: var(--text); }
  .stats { display: flex; gap: 0.9rem; margin: 0; font-size: 0.76rem; color: var(--faint); font-variant-numeric: tabular-nums; }
  audio { width: 100%; height: 40px; }
  .footer { margin-top: 2.25rem; font-size: 0.85rem; color: var(--muted); }
  .footer b { color: var(--text); }
</style>

<div class="wrap">
  <p class="eyebrow">LangLab · Learn to read Hindi · take 2</p>
  <h1>Pick the cleanest <span class="big" lang="hi">अ</span></h1>
  <p class="lede">Same synthesis method as the vowels you said sound good — I only fixed what you flagged on the first one: killed the <b>click</b>, stopped the <b>clipped</b> tail, kept it level-matched to <b lang="hi">आ इ ई उ ऊ</b>. Six fresh takes (the voice varies slightly each time). Target is still a clean, short <span class="target">“uh” (the u in “fun”)</span>.</p>

  <div class="note">
    All six are de-clicked and tail-extended the same way — they differ only in the underlying take and speed (1.0× vs 0.92–0.95×). <b>Pick whichever is the cleanest single “uh” with no click and no cut-off.</b>
  </div>

  <div class="stack">
${rows}
  </div>

  <p class="footer">Reply with the take — <b>V1–V6</b> — and I’ll drop it into <b>sc-hi-0001.mp3</b>, upload to R2, and bump the audio cache so it reaches your phone. Still not right? Tell me what you hear and I’ll iterate.</p>
</div>`;

fs.writeFileSync(OUT, html);
console.log('wrote', OUT, `(${(html.length / 1024).toFixed(0)} KB)`);
