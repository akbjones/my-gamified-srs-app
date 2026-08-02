#!/usr/bin/env node
const fs = require('fs');
const M = require('/private/tmp/ac-candidates/manifest.json');
const OUT = '/private/tmp/claude-501/-Users-antoinevj-Documents-GitHub-my-gamified-srs-app--claude-worktrees-awesome-jones/d730b480-f040-446b-beb1-8f2e49265fb4/scratchpad/ac-picker.html';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const rows = M.map(c => `
  <article class="cand${c.id === 'A_current' ? ' cand--ref' : ''}">
    <div class="head">
      <span class="pick">${esc(c.id.split('_')[0])}</span>
      <span class="lab">${esc(c.label)}</span>
    </div>
    <p class="sent" lang="hi">${esc(c.text)}</p>
    <audio controls preload="none" src="data:audio/mpeg;base64,${c.b64}"></audio>
  </article>`).join('\n');

const html = `<title>AC sentence — which reads right?</title>
<style>
 :root{--bg:#faf9fc;--surface:#fff;--surface2:#f4f1fa;--text:#1a1626;--muted:#6b6478;--accent:#7c3aed;--accent-soft:#efe9fc;--border:#e7e2f0;--bad:#c2410c;--bad-soft:#fdf1ea;--bad-border:#f2d6c4}
 @media(prefers-color-scheme:dark){:root{--bg:#14111c;--surface:#1e1a29;--surface2:#241f31;--text:#ece9f2;--muted:#a49db5;--accent:#a78bfa;--accent-soft:#2a2340;--border:#302a40;--bad:#fb923c;--bad-soft:#2c2016;--bad-border:#4a3421}}
 :root[data-theme=light]{--bg:#faf9fc;--surface:#fff;--surface2:#f4f1fa;--text:#1a1626;--muted:#6b6478;--accent:#7c3aed;--accent-soft:#efe9fc;--border:#e7e2f0;--bad:#c2410c;--bad-soft:#fdf1ea;--bad-border:#f2d6c4}
 :root[data-theme=dark]{--bg:#14111c;--surface:#1e1a29;--surface2:#241f31;--text:#ece9f2;--muted:#a49db5;--accent:#a78bfa;--accent-soft:#2a2340;--border:#302a40;--bad:#fb923c;--bad-soft:#2c2016;--bad-border:#4a3421}
 *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);line-height:1.55;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
 .wrap{max-width:40rem;margin:0 auto;padding:2.5rem 1.15rem 4rem}
 .eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 .5rem}
 h1{font-size:1.6rem;margin:0 0 .5rem;letter-spacing:-.01em}
 .lede{color:var(--muted);margin:0 0 1.9rem;max-width:36rem}.lede b{color:var(--text)}
 .cand{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:.9rem 1rem;margin-bottom:.8rem}
 .cand--ref{background:var(--bad-soft);border-color:var(--bad-border)}
 .head{display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem}
 .pick{font-weight:800;color:var(--accent);background:var(--accent-soft);border-radius:6px;padding:.05rem .5rem}
 .cand--ref .pick{color:var(--bad);background:transparent;padding-left:0}
 .lab{font-size:.85rem;color:var(--muted)}
 .sent{margin:0 0 .6rem;font-size:1.25rem;font-weight:600;font-family:"Noto Sans Devanagari","Kohinoor Devanagari","Nirmala UI",system-ui,sans-serif}
 audio{width:100%;height:38px}
 .foot{margin-top:1.6rem;padding:1rem 1.1rem;background:var(--surface2);border:1px solid var(--border);border-radius:12px;font-size:.9rem;color:var(--muted)}.foot b{color:var(--text)}
 code{background:var(--accent-soft);color:var(--accent);padding:.05rem .35rem;border-radius:5px}
</style>
<div class="wrap">
 <p class="eyebrow">LangLab · Hindi audio</p>
 <h1>Which "AC" reads right?</h1>
 <p class="lede">Same sentence — <b>the AC in the room isn't working</b> — with "AC" written five ways. The clip itself is fine technically, so this is purely about how the voice says it. <b>A is the current one.</b> The card will keep showing एसी either way; only the text fed to the voice changes.</p>
 ${rows}
 <div class="foot"><b>Reply with the letter</b> (e.g. <code>B</code>) and I'll add a pronunciation-override field, regenerate all 5 एसी clips, and ship them. If none sound right, say what you hear.</div>
</div>`;
fs.writeFileSync(OUT, html);
console.log('wrote', OUT, `(${(html.length / 1024).toFixed(0)} KB)`);
