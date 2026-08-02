#!/usr/bin/env node
const fs = require('fs');
const D = require('/private/tmp/sent-sample.json');
const OUT = '/private/tmp/claude-501/-Users-antoinevj-Documents-GitHub-my-gamified-srs-app--claude-worktrees-awesome-jones/d730b480-f040-446b-beb1-8f2e49265fb4/scratchpad/sentence-review.html';
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CAT_LABEL = {
  'unnatural/calque': 'Unnatural / calque', duplicate: 'Duplicate', officialese: 'Officialese',
  'vacuous/padded': 'Vacuous / padded', preachy: 'Preachy', 'niche/trivia': 'Niche / trivia', other: 'Other',
};
const tally = Object.entries(D.cats).sort((a, b) => b[1] - a[1])
  .map(([k, v]) => `<div class="tal"><span class="tal__n">${v}</span><span class="tal__k">${esc(CAT_LABEL[k] || k)}</span></div>`).join('');

const rows = D.sample.map(r => `
  <article class="card">
    <div class="meta"><span class="rank">#${r.rank}</span><span class="node">${esc(r.node)}</span><span class="id">${esc(r.id)}</span></div>
    <p class="reason">${esc(r.reason)}</p>
    <div class="ba ba--old">
      <span class="lab lab--old">out</span>
      <div><p class="hi" lang="hi">${esc(r.oldT)}</p><p class="en">${esc(r.oldE)}</p></div>
    </div>
    <div class="ba ba--new">
      <span class="lab lab--new">in</span>
      <div><p class="hi" lang="hi">${esc(r.newT)}</p><p class="en">${esc(r.newE)}</p></div>
    </div>
  </article>`).join('\n');

const html = `<title>Hindi sentence QC — sample for approval</title>
<style>
 :root{--bg:#f8f7fb;--surface:#fff;--surface2:#f2effa;--text:#191527;--muted:#6a6480;--faint:#9b95ac;--accent:#7c3aed;--accent-soft:#efe9fc;--border:#e6e1f0;--out:#b4413a;--out-bg:#fcf1f0;--out-border:#f0d8d5;--in:#1f7a4d;--in-bg:#ecf7f0;--in-border:#cfe9d8}
 @media(prefers-color-scheme:dark){:root{--bg:#131019;--surface:#1d1929;--surface2:#241f33;--text:#ece9f4;--muted:#a49db5;--faint:#6d6784;--accent:#a78bfa;--accent-soft:#2a2340;--border:#302a42;--out:#f6a29b;--out-bg:#2a1614;--out-border:#4a2420;--in:#5fd497;--in-bg:#132a1e;--in-border:#244a34}}
 :root[data-theme=light]{--bg:#f8f7fb;--surface:#fff;--surface2:#f2effa;--text:#191527;--muted:#6a6480;--faint:#9b95ac;--accent:#7c3aed;--accent-soft:#efe9fc;--border:#e6e1f0;--out:#b4413a;--out-bg:#fcf1f0;--out-border:#f0d8d5;--in:#1f7a4d;--in-bg:#ecf7f0;--in-border:#cfe9d8}
 :root[data-theme=dark]{--bg:#131019;--surface:#1d1929;--surface2:#241f33;--text:#ece9f4;--muted:#a49db5;--faint:#6d6784;--accent:#a78bfa;--accent-soft:#2a2340;--border:#302a42;--out:#f6a29b;--out-bg:#2a1614;--out-border:#4a2420;--in:#5fd497;--in-bg:#132a1e;--in-border:#244a34}
 *{box-sizing:border-box}
 body{margin:0;background:var(--bg);color:var(--text);line-height:1.55;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
 .wrap{max-width:46rem;margin:0 auto;padding:2.75rem 1.15rem 5rem}
 .eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--accent);margin:0 0 .5rem}
 h1{font-size:1.95rem;line-height:1.12;letter-spacing:-.02em;margin:0 0 .55rem;text-wrap:balance}
 .lede{color:var(--muted);font-size:1.02rem;margin:0 0 1.5rem;max-width:40rem}.lede b{color:var(--text)}
 .tally{display:flex;flex-wrap:wrap;gap:.5rem;margin:0 0 2.25rem}
 .tal{display:flex;align-items:baseline;gap:.4rem;background:var(--surface);border:1px solid var(--border);border-radius:999px;padding:.3rem .75rem}
 .tal__n{font-weight:800;color:var(--accent);font-variant-numeric:tabular-nums}
 .tal__k{font-size:.8rem;color:var(--muted)}
 .card{background:var(--surface);border:1px solid var(--border);border-radius:15px;padding:1rem 1.1rem;margin-bottom:.95rem}
 .meta{display:flex;align-items:center;gap:.5rem;margin-bottom:.45rem;font-size:.7rem;font-weight:700;letter-spacing:.04em;text-transform:uppercase}
 .rank{color:var(--accent);background:var(--accent-soft);border-radius:5px;padding:.08rem .45rem;font-variant-numeric:tabular-nums}
 .node,.id{color:var(--faint)}
 .reason{margin:0 0 .8rem;font-size:.86rem;color:var(--muted);font-style:italic}
 .ba{display:flex;gap:.6rem;align-items:flex-start;border-radius:10px;padding:.6rem .7rem;margin-bottom:.45rem}
 .ba--old{background:var(--out-bg);border:1px solid var(--out-border)}
 .ba--new{background:var(--in-bg);border:1px solid var(--in-border);margin-bottom:0}
 .lab{flex:none;font-size:.6rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:.12rem .4rem;border-radius:4px;margin-top:.2rem}
 .lab--old{color:var(--out);background:transparent;border:1px solid var(--out-border)}
 .lab--new{color:var(--in);background:transparent;border:1px solid var(--in-border)}
 .hi{margin:0;font-size:1.15rem;font-weight:600;font-family:"Noto Sans Devanagari","Kohinoor Devanagari","Nirmala UI",system-ui,sans-serif;line-height:1.5}
 .en{margin:.1rem 0 0;font-size:.85rem;color:var(--muted)}
 .foot{margin-top:2rem;padding:1rem 1.1rem;background:var(--surface2);border:1px solid var(--border);border-radius:12px;font-size:.9rem;color:var(--muted)}.foot b{color:var(--text)}
</style>
<div class="wrap">
  <p class="eyebrow">LangLab · Hindi sentence QC</p>
  <h1>${D.total} cards flagged for replacement</h1>
  <p class="lede">A full pass over all 3,172 Hindi cards looking for sentences that are <b>vacuous, preachy, unnatural, officialese or niche</b> — the "we are all very happy and content with our family" problem. Each flagged card gets a natural everyday replacement that teaches the <b>same grammar point</b>. Below: 24 sampled evenly across the deck, in study order.</p>
  <div class="tally">${tally}</div>
  ${rows}
  <div class="foot"><b>Nothing is applied yet.</b> If this looks right, say go and I'll swap all ${D.total} in (ids, grammar nodes and SRS state untouched — only the sentence text changes), then regenerate audio for the replaced cards.</div>
</div>`;
fs.writeFileSync(OUT, html);
console.log('wrote', OUT, `(${(html.length / 1024).toFixed(0)} KB)`);
