#!/usr/bin/env node
const fs = require('fs');
const src = fs.readFileSync('src/data/dictionary/hi.ts', 'utf8');
const re = /^\s*['"]([^'"]+)['"]\s*:\s*\{\s*en:\s*'((?:[^'\\]|\\.)*)'\s*,\s*ipa:\s*'((?:[^'\\]|\\.)*)'\s*,\s*pos:\s*'([^']*)'/;
const cur = new Map();
for (const line of src.split('\n')) { const m = line.match(re); if (m) cur.set(m[1], { en: m[2], ipa: m[3], pos: m[4] }); }
const ver = new Map();
for (const f of fs.readdirSync('docs/hi-quality/dictverify').filter(f => /^out-\d+\.json$/.test(f)))
  try { for (const e of JSON.parse(fs.readFileSync('docs/hi-quality/dictverify/' + f, 'utf8'))) if (e && e.word) ver.set(e.word, e); } catch (err) {}

const rows = [];
for (const [w, e] of ver) {
  const c = cur.get(w); if (!c) continue;
  const dEn = e.en && e.en !== c.en, dIpa = e.ipa && e.ipa !== c.ipa, dPos = e.pos && e.pos !== c.pos;
  if (dEn || dIpa || dPos) rows.push({ w, c, e, dEn, dIpa, dPos });
}
const N = 30, step = Math.max(1, Math.floor(rows.length / N));
const sample = []; for (let i = 0; i < N && i * step < rows.length; i++) sample.push(rows[i * step]);
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const cards = sample.map(r => `
  <article class="row">
    <div class="word" lang="hi">${esc(r.w)}</div>
    <div class="cols">
      ${r.dEn ? `<div class="f"><span class="k">meaning</span><span class="old">${esc(r.c.en)}</span><span class="arw">→</span><span class="new">${esc(r.e.en)}</span></div>` : ''}
      ${r.dIpa ? `<div class="f"><span class="k">sound</span><span class="old mono">${esc(r.c.ipa)}</span><span class="arw">→</span><span class="new mono">${esc(r.e.ipa)}</span></div>` : ''}
      ${r.dPos ? `<div class="f"><span class="k">type</span><span class="old">${esc(r.c.pos)}</span><span class="arw">→</span><span class="new">${esc(r.e.pos)}</span></div>` : ''}
    </div>
  </article>`).join('\n');

const html = `<title>Hindi dictionary audit — sample</title>
<style>
 :root{--bg:#f8f7fb;--surface:#fff;--surface2:#f2effa;--text:#191527;--muted:#6a6480;--faint:#9b95ac;--accent:#7c3aed;--accent-soft:#efe9fc;--border:#e6e1f0;--old:#b4413a;--new:#1f7a4d}
 @media(prefers-color-scheme:dark){:root{--bg:#131019;--surface:#1d1929;--surface2:#241f33;--text:#ece9f4;--muted:#a49db5;--faint:#6d6784;--accent:#a78bfa;--accent-soft:#2a2340;--border:#302a42;--old:#f6a29b;--new:#5fd497}}
 :root[data-theme=light]{--bg:#f8f7fb;--surface:#fff;--surface2:#f2effa;--text:#191527;--muted:#6a6480;--faint:#9b95ac;--accent:#7c3aed;--accent-soft:#efe9fc;--border:#e6e1f0;--old:#b4413a;--new:#1f7a4d}
 :root[data-theme=dark]{--bg:#131019;--surface:#1d1929;--surface2:#241f33;--text:#ece9f4;--muted:#a49db5;--faint:#6d6784;--accent:#a78bfa;--accent-soft:#2a2340;--border:#302a42;--old:#f6a29b;--new:#5fd497}
 *{box-sizing:border-box}
 body{margin:0;background:var(--bg);color:var(--text);line-height:1.5;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;-webkit-font-smoothing:antialiased}
 .wrap{max-width:48rem;margin:0 auto;padding:2.75rem 1.15rem 5rem}
 .eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin:0 0 .5rem}
 h1{font-size:1.95rem;line-height:1.12;letter-spacing:-.02em;margin:0 0 .55rem}
 .lede{color:var(--muted);font-size:1.02rem;margin:0 0 1.5rem;max-width:42rem}.lede b{color:var(--text)}
 .tally{display:flex;flex-wrap:wrap;gap:.5rem;margin:0 0 2rem}
 .tal{display:flex;align-items:baseline;gap:.4rem;background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:.3rem .8rem}
 .tal b{color:var(--accent);font-variant-numeric:tabular-nums}.tal span{font-size:.8rem;color:var(--muted)}
 .row{background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:.85rem 1rem;margin-bottom:.7rem;display:flex;gap:1rem;align-items:flex-start}
 .word{flex:none;width:7rem;font-size:1.3rem;font-weight:700;font-family:"Noto Sans Devanagari","Kohinoor Devanagari","Nirmala UI",system-ui,sans-serif;line-height:1.45}
 .cols{flex:1;min-width:0;display:flex;flex-direction:column;gap:.35rem}
 .f{display:flex;flex-wrap:wrap;align-items:baseline;gap:.45rem;font-size:.88rem}
 .k{flex:none;width:3.9rem;font-size:.62rem;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--faint)}
 .old{color:var(--old);text-decoration:line-through;text-decoration-thickness:1px}
 .new{color:var(--new);font-weight:600}
 .arw{color:var(--faint)}
 .mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.85em}
 .foot{margin-top:2rem;padding:1rem 1.1rem;background:var(--surface2);border:1px solid var(--border);border-radius:12px;font-size:.9rem;color:var(--muted)}.foot b{color:var(--text)}
</style>
<div class="wrap">
  <p class="eyebrow">LangLab · Hindi dictionary audit</p>
  <h1>${rows.length} entries corrected</h1>
  <p class="lede">Every one of the 5,362 dictionary entries was checked for gloss accuracy, completeness, IPA, word type and lemma — then a second pass re-derived each IPA from Hindi's phonological rules, correcting <b>433</b> of the proposals and reverting <b>9</b> where the original was right. Below: 30 sampled evenly.</p>
  <div class="tally">
    <div class="tal"><b>1,922</b><span>pronunciations</span></div>
    <div class="tal"><b>2,190</b><span>meanings</span></div>
    <div class="tal"><b>1,249</b><span>lemma links</span></div>
    <div class="tal"><b>239</b><span>word types</span></div>
  </div>
  ${cards}
  <div class="foot"><b>Nothing applied yet.</b> Say go and I'll write all ${rows.length} into the dictionary — no deck cards, audio or SRS state are touched, this is the tap-a-word definitions only.</div>
</div>`;
const OUT = '/private/tmp/claude-501/-Users-antoinevj-Documents-GitHub-my-gamified-srs-app--claude-worktrees-awesome-jones/d730b480-f040-446b-beb1-8f2e49265fb4/scratchpad/dict-review.html';
fs.writeFileSync(OUT, html);
console.log('wrote', OUT, `(${(html.length / 1024).toFixed(0)} KB, ${rows.length} changed, ${sample.length} sampled)`);
