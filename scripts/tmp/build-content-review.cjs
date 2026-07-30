#!/usr/bin/env node
const fs = require('fs');
const { tips, jp } = require('/private/tmp/tips-jp-samples.json');
const OUT = '/private/tmp/claude-501/-Users-antoinevj-Documents-GitHub-my-gamified-srs-app--claude-worktrees-awesome-jones/d730b480-f040-446b-beb1-8f2e49265fb4/scratchpad/content-review.html';
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const LANGS = {
  turkish: { name: 'Turkish', flag: '🇹🇷', bcp: 'tr', count: 691 },
  russian: { name: 'Russian', flag: '🇷🇺', bcp: 'ru', count: 704 },
  welsh:   { name: 'Welsh',   flag: '🏴',  bcp: 'cy', count: 774 },
};

const tipCard = (bcp, t) => `
  <article class="card">
    <p class="target" lang="${bcp}">${esc(t.target)}</p>
    <p class="eng">${esc(t.english)}</p>
    <div class="tip"><span class="tip__k">Why?</span>${esc(t.tip)}</div>
  </article>`;

const ruby = tokens => tokens.map(tk => tk.r
  ? `<ruby>${esc(tk.t)}<rt>${esc(tk.r)}</rt></ruby>`
  : esc(tk.t)).join('');

const jpCard = c => `
  <article class="card">
    <p class="target jp" lang="ja">${ruby(c.tokens)}</p>
    <p class="eng">${esc(c.english)}</p>
    ${c.grammar ? `<div class="tip"><span class="tip__k">Why?</span>${esc(c.grammar)}</div>` : ''}
  </article>`;

const tipSections = Object.entries(LANGS).map(([key, L]) => `
  <section class="lang">
    <div class="lang__head">
      <h2><span class="flag">${L.flag}</span> ${L.name}</h2>
      <span class="tally">${L.count} tips · 22%</span>
    </div>
    <div class="grid">${tips[key].map(t => tipCard(L.bcp, t)).join('')}</div>
  </section>`).join('');

const html = `<title>LangLab — content review</title>
<style>
  :root{
    --bg:#f7f6fb; --surface:#ffffff; --surface2:#f1eef9; --text:#181425; --muted:#6a6480; --faint:#9b95ac;
    --accent:#7c3aed; --accent-soft:#efe9fc; --border:#e6e1f0;
    --amber:#b45309; --amber-bg:#fdf6ec; --amber-border:#f0dcc0; --amber-key:#c2740a;
  }
  @media (prefers-color-scheme:dark){:root{
    --bg:#131019; --surface:#1d1929; --surface2:#241f33; --text:#ece9f4; --muted:#a49dba; --faint:#6d6784;
    --accent:#a78bfa; --accent-soft:#2a2340; --border:#302a42;
    --amber:#fbbf24; --amber-bg:#241b0f; --amber-border:#42320f; --amber-key:#f5b833;
  }}
  :root[data-theme="light"]{--bg:#f7f6fb;--surface:#fff;--surface2:#f1eef9;--text:#181425;--muted:#6a6480;--faint:#9b95ac;--accent:#7c3aed;--accent-soft:#efe9fc;--border:#e6e1f0;--amber:#b45309;--amber-bg:#fdf6ec;--amber-border:#f0dcc0;--amber-key:#c2740a}
  :root[data-theme="dark"]{--bg:#131019;--surface:#1d1929;--surface2:#241f33;--text:#ece9f4;--muted:#a49dba;--faint:#6d6784;--accent:#a78bfa;--accent-soft:#2a2340;--border:#302a42;--amber:#fbbf24;--amber-bg:#241b0f;--amber-border:#42320f;--amber-key:#f5b833}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);line-height:1.55;
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
  .wrap{max-width:60rem;margin:0 auto;padding:2.75rem 1.25rem 5rem}
  .eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin:0 0 .5rem}
  h1{font-size:2rem;line-height:1.1;letter-spacing:-.02em;margin:0 0 .5rem;text-wrap:balance}
  .lede{color:var(--muted);font-size:1.05rem;margin:0 0 2.5rem;max-width:42rem}
  .lede b{color:var(--text)}
  .lang{margin-bottom:3rem}
  .lang__head{display:flex;align-items:baseline;justify-content:space-between;gap:1rem;border-bottom:2px solid var(--border);padding-bottom:.6rem;margin-bottom:1.25rem}
  .lang__head h2{font-size:1.4rem;margin:0;letter-spacing:-.01em}
  .flag{font-size:1.2em;margin-right:.15em}
  .tally{font-size:.8rem;font-weight:700;color:var(--accent);background:var(--accent-soft);padding:.2rem .6rem;border-radius:999px;white-space:nowrap;font-variant-numeric:tabular-nums}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(19rem,1fr));gap:.9rem}
  .card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:1rem 1.1rem;display:flex;flex-direction:column;gap:.5rem}
  .target{margin:0;font-size:1.35rem;font-weight:700;letter-spacing:-.01em;line-height:1.35}
  .target.jp{font-size:1.6rem;font-family:"Hiragino Kaku Gothic ProN","Yu Gothic","Noto Sans JP","Meiryo",sans-serif;line-height:2}
  ruby rt{font-size:.5em;font-weight:600;color:var(--muted)}
  .eng{margin:0;font-size:.9rem;color:var(--muted);font-style:italic}
  .tip{margin-top:.15rem;background:var(--amber-bg);border:1px solid var(--amber-border);border-radius:10px;padding:.6rem .7rem;font-size:.88rem;color:var(--text)}
  .tip__k{display:inline-block;font-weight:800;font-size:.66rem;letter-spacing:.08em;text-transform:uppercase;color:var(--amber-key);margin-right:.5rem;vertical-align:.05em}
  .jphead{display:flex;align-items:baseline;justify-content:space-between;gap:1rem;border-bottom:2px solid var(--border);padding-bottom:.6rem;margin-bottom:1.25rem}
  .note{background:var(--surface2);border:1px solid var(--border);border-radius:12px;padding:.85rem 1rem;font-size:.9rem;color:var(--muted);margin:0 0 2.5rem}
  .note b{color:var(--text)}
</style>
<div class="wrap">
  <p class="eyebrow">LangLab · content review</p>
  <h1>New grammar tips + Japanese wave 1</h1>
  <p class="lede">A spread of the freshly authored, adversarially-verified content: <b>Turkish, Russian and Welsh</b> grammar tips (staged, hidden behind the flag), and the first wave of <b>Japanese parity cards</b> with furigana. Tips show as the in-app amber "Why?" panel; Japanese renders kanji readings as ruby.</p>

  ${tipSections}

  <section class="lang">
    <div class="jphead">
      <h2><span class="flag">🇯🇵</span> Japanese — parity wave 1</h2>
      <span class="tally">247 cards · nodes 1–4</span>
    </div>
    <p class="note"><b>100% furigana-clean</b> (every token's reading concatenates exactly back to the sentence). Polite です/ます register throughout. These are authored + verified but <b>not yet merged</b> into the deck.</p>
    <div class="grid">${jp.map(jpCard).join('')}</div>
  </section>
</div>`;

fs.writeFileSync(OUT, html);
console.log('wrote', OUT, `(${(html.length / 1024).toFixed(0)} KB)`);
