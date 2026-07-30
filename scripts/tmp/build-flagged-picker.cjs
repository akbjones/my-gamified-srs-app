#!/usr/bin/env node
const fs = require('fs'), path = require('path');
const M = require('/private/tmp/deva-flagged/manifest.json');
const AUDIO = path.resolve('public/quest-audio');
const OUT = '/private/tmp/claude-501/-Users-antoinevj-Documents-GitHub-my-gamified-srs-app--claude-worktrees-awesome-jones/d730b480-f040-446b-beb1-8f2e49265fb4/scratchpad/deva-flagged-picker.html';
const curB64 = f => { const p = path.join(AUDIO, f); return fs.existsSync(p) ? fs.readFileSync(p).toString('base64') : null; };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const audio = (b64, cls = '') => b64 ? `<audio class="${cls}" controls preload="none" src="data:audio/mpeg;base64,${b64}"></audio>` : '<span class="missing">no clip</span>';

const cards = M.map(L => {
  const cur = curB64(L.audio);
  const cands = L.cands.map(c => `
    <div class="cand">
      <div class="cand__lab"><span class="pick">${esc(c.id)}</span><span class="cd">${esc(c.label)}</span><span class="dur">${c.qc.voiced}s</span></div>
      ${audio(c.b64)}
    </div>`).join('');
  return `
  <section class="letter">
    <div class="lh">
      <span class="glyph" lang="hi">${esc(L.glyph)}</span>
      <div class="lh__meta">
        <div class="rom">${esc(L.roman)}</div>
        <div class="want">should be: ${esc(L.want)}</div>
      </div>
    </div>
    <div class="cur">
      <span class="curlab">current (wrong)</span>
      ${audio(cur, 'ref')}
    </div>
    <div class="cands">${cands}</div>
  </section>`;
}).join('\n');

const html = `<title>Pick fixes — flagged Devanagari letters</title>
<style>
  :root{--bg:#faf9fc;--surface:#fff;--surface2:#f4f1fa;--text:#1a1626;--muted:#6b6478;--faint:#9a93a8;--accent:#7c3aed;--accent-soft:#efe9fc;--border:#e7e2f0;--bad:#c2410c;--bad-soft:#fdf1ea;--bad-border:#f2d6c4}
  @media (prefers-color-scheme:dark){:root{--bg:#14111c;--surface:#1e1a29;--surface2:#241f31;--text:#ece9f2;--muted:#a49db5;--faint:#6f6880;--accent:#a78bfa;--accent-soft:#2a2340;--border:#302a40;--bad:#fb923c;--bad-soft:#2c2016;--bad-border:#4a3421}}
  :root[data-theme="light"]{--bg:#faf9fc;--surface:#fff;--surface2:#f4f1fa;--text:#1a1626;--muted:#6b6478;--faint:#9a93a8;--accent:#7c3aed;--accent-soft:#efe9fc;--border:#e7e2f0;--bad:#c2410c;--bad-soft:#fdf1ea;--bad-border:#f2d6c4}
  :root[data-theme="dark"]{--bg:#14111c;--surface:#1e1a29;--surface2:#241f31;--text:#ece9f2;--muted:#a49db5;--faint:#6f6880;--accent:#a78bfa;--accent-soft:#2a2340;--border:#302a40;--bad:#fb923c;--bad-soft:#2c2016;--bad-border:#4a3421}}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased}
  .wrap{max-width:44rem;margin:0 auto;padding:2.5rem 1.15rem 4rem}
  .eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 .5rem}
  h1{font-size:1.65rem;line-height:1.15;margin:0 0 .5rem}
  .lede{color:var(--muted);font-size:1rem;margin:0 0 1.75rem;max-width:38rem}
  .lede b{color:var(--text)}
  [lang="hi"]{font-family:"Noto Sans Devanagari","Kohinoor Devanagari","Nirmala UI",system-ui,sans-serif}
  .letter{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:1.1rem 1.15rem;margin-bottom:1.1rem}
  .lh{display:flex;align-items:center;gap:1rem;margin-bottom:.85rem}
  .glyph{font-size:3.2rem;line-height:1;width:4rem;text-align:center}
  .rom{font-weight:800;font-size:1.15rem}
  .want{font-size:.85rem;color:var(--muted)}
  .cur{display:flex;align-items:center;gap:.7rem;padding:.5rem .7rem;background:var(--bad-soft);border:1px solid var(--bad-border);border-radius:10px;margin-bottom:.85rem}
  .curlab{font-size:.68rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--bad);white-space:nowrap}
  .cands{display:grid;grid-template-columns:repeat(auto-fill,minmax(17rem,1fr));gap:.6rem}
  .cand{background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:.55rem .65rem}
  .cand__lab{display:flex;align-items:center;gap:.45rem;margin-bottom:.4rem}
  .pick{font-weight:800;color:var(--accent);background:var(--accent-soft);border-radius:6px;padding:.03rem .45rem;font-size:.82rem}
  .cd{font-size:.78rem;color:var(--muted);flex:1;min-width:0}
  .dur{font-size:.7rem;color:var(--faint);font-variant-numeric:tabular-nums}
  audio{width:100%;height:34px}
  audio.ref{flex:1}
  .missing{font-size:.72rem;color:var(--faint)}
  .foot{margin-top:1.5rem;padding:1rem 1.1rem;background:var(--surface2);border:1px solid var(--border);border-radius:12px;font-size:.9rem;color:var(--muted)}
  .foot b{color:var(--text)}
  code{background:var(--accent-soft);color:var(--accent);padding:.05rem .35rem;border-radius:5px;font-size:.85em}
</style>
<div class="wrap">
  <p class="eyebrow">LangLab · Devanagari sound fixes</p>
  <h1>Pick a take for each flagged letter</h1>
  <p class="lede">Each letter shows the <b>current (wrong)</b> clip, then four candidates. <b>aa</b> = the reliable <span lang="hi">Cा</span> form (guaranteed consonant, slightly long); <b>r1/r2/slow</b> = re-rolls of the plain letter that can land a clean short sound. Pick whichever is right per letter.</p>
  ${cards}
  <div class="foot"><b>Reply like:</b> <code>cha=aa, chha=aa, nya=r1, pha=slow, fa=aa, za=aa, ha=r2, ta=aa, ai=none</code>. Say <code>none</code> if a letter still has nothing good and I'll try another approach (e.g. a word carrier). I'll ship all your picks together — R2 + cache bump + deploy.</div>
</div>`;

fs.writeFileSync(OUT, html);
console.log('wrote', OUT, `(${(html.length / 1024).toFixed(0)} KB)`);
