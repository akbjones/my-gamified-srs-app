#!/usr/bin/env node
const fs = require('fs'), path = require('path');
const M = require('/private/tmp/deva-words/manifest.json');
const AUDIO = path.resolve('public/quest-audio');
const pack = require(path.resolve('src/data/scripts/devanagari.json'));
const byId = new Map(pack.items.map(i => [i.id, i]));
const OUT = '/private/tmp/claude-501/-Users-antoinevj-Documents-GitHub-my-gamified-srs-app--claude-worktrees-awesome-jones/d730b480-f040-446b-beb1-8f2e49265fb4/scratchpad/deva-words-picker.html';
const cur = f => { const p = path.join(AUDIO, f); return fs.existsSync(p) ? fs.readFileSync(p).toString('base64') : null; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const au = (b64, cls = '') => b64 ? `<audio class="${cls}" controls preload="none" src="data:audio/mpeg;base64,${b64}"></audio>` : '<span class="missing">no clip</span>';

const cards = M.map(L => {
  const it = byId.get(L.id);
  const cands = L.cands.map(c => `
    <div class="cand">
      <div class="cand__lab"><span class="pick" lang="hi">${esc(c.word)}</span><span class="cd">${esc(c.id)} · ${esc(c.gloss)}</span></div>
      ${au(c.b64)}
    </div>`).join('');
  return `
  <section class="letter">
    <div class="lh">
      <span class="glyph" lang="hi">${esc(L.glyph)}</span>
      <div class="lh__meta"><div class="rom">${esc(L.roman)}</div><div class="want">${esc(L.note)}</div></div>
    </div>
    <div class="cur"><span class="curlab">current</span>${au(cur(it.audio), 'ref')}</div>
    <div class="cands">${cands}</div>
  </section>`;
}).join('\n');

const html = `<title>फ + nasals — word-carrier picker</title>
<style>
  :root{--bg:#faf9fc;--surface:#fff;--surface2:#f4f1fa;--text:#1a1626;--muted:#6b6478;--faint:#9a93a8;--accent:#7c3aed;--accent-soft:#efe9fc;--border:#e7e2f0;--bad:#c2410c;--bad-soft:#fdf1ea;--bad-border:#f2d6c4}
  @media (prefers-color-scheme:dark){:root{--bg:#14111c;--surface:#1e1a29;--surface2:#241f31;--text:#ece9f2;--muted:#a49db5;--faint:#6f6880;--accent:#a78bfa;--accent-soft:#2a2340;--border:#302a40;--bad:#fb923c;--bad-soft:#2c2016;--bad-border:#4a3421}}
  :root[data-theme="light"]{--bg:#faf9fc;--surface:#fff;--surface2:#f4f1fa;--text:#1a1626;--muted:#6b6478;--faint:#9a93a8;--accent:#7c3aed;--accent-soft:#efe9fc;--border:#e7e2f0;--bad:#c2410c;--bad-soft:#fdf1ea;--bad-border:#f2d6c4}
  :root[data-theme="dark"]{--bg:#14111c;--surface:#1e1a29;--surface2:#241f31;--text:#ece9f2;--muted:#a49db5;--faint:#6f6880;--accent:#a78bfa;--accent-soft:#2a2340;--border:#302a40;--bad:#fb923c;--bad-soft:#2c2016;--bad-border:#4a3421}
  *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased}
  .wrap{max-width:44rem;margin:0 auto;padding:2.5rem 1.15rem 4rem}
  .eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 .5rem}
  h1{font-size:1.6rem;margin:0 0 .5rem}.lede{color:var(--muted);font-size:1rem;margin:0 0 1.75rem;max-width:38rem}.lede b{color:var(--text)}
  [lang="hi"]{font-family:"Noto Sans Devanagari","Kohinoor Devanagari","Nirmala UI",system-ui,sans-serif}
  .letter{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.1rem 1.15rem;margin-bottom:1.1rem}
  .lh{display:flex;align-items:center;gap:1rem;margin-bottom:.85rem}.glyph{font-size:3rem;line-height:1;width:3.6rem;text-align:center}
  .rom{font-weight:800;font-size:1.1rem}.want{font-size:.83rem;color:var(--muted)}
  .cur{display:flex;align-items:center;gap:.7rem;padding:.5rem .7rem;background:var(--surface2);border:1px solid var(--border);border-radius:10px;margin-bottom:.85rem}
  .curlab{font-size:.68rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
  .cands{display:grid;grid-template-columns:repeat(auto-fill,minmax(16rem,1fr));gap:.6rem}
  .cand{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:.55rem .65rem}
  .cand__lab{display:flex;align-items:baseline;gap:.45rem;margin-bottom:.4rem}
  .pick{font-weight:800;color:var(--accent);font-size:1.15rem}.cd{font-size:.74rem;color:var(--muted)}
  audio{width:100%;height:34px}audio.ref{flex:1}.missing{font-size:.72rem;color:var(--faint)}
  .foot{margin-top:1.5rem;padding:1rem 1.1rem;background:var(--surface2);border:1px solid var(--border);border-radius:12px;font-size:.9rem;color:var(--muted)}.foot b{color:var(--text)}
  code{background:var(--accent-soft);color:var(--accent);padding:.05rem .35rem;border-radius:5px}
  .callout{padding:.85rem 1rem;background:var(--bad-soft);border:1px solid var(--bad-border);border-radius:12px;font-size:.9rem;margin-bottom:1.5rem}
</style>
<div class="wrap">
  <p class="eyebrow">LangLab · Devanagari · word carriers</p>
  <h1>Teach these inside a word</h1>
  <p class="lede">The nasal/breath marks <b lang="hi">ं ँ ः</b> only ever attach to a letter, and <b lang="hi">फ</b> won't give a clean isolated sound. So each is demoed with a short real word. Pick the clearest one per row.</p>
  <div class="callout"><b lang="hi">फ</b> reality check: classically फ is "pʰa" (p+breath), but modern Hindi merges it with फ़ into a plain <b>"f"</b> — this voice will always say "f". Pick a word if it helps, or tell me to just relabel फ as the "f" sound and drop the "pha" framing.</div>
  ${cards}
  <div class="foot"><b>Reply like:</b> <code>ph=phool, anusvara=hain, chandrabindu=maa, visarga=namah</code> (or <code>ph=relabel</code>). Picking a word means I wire that word as the demo (audio + shown on the card). I'll ship it with everything else.</div>
</div>`;
fs.writeFileSync(OUT, html);
console.log('wrote', OUT, `(${(html.length / 1024).toFixed(0)} KB)`);
