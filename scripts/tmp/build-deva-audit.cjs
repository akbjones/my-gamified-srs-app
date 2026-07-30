#!/usr/bin/env node
// Build the full Devanagari sound-audit page: ங candidates up top, then every
// alphabet letter (vowels + consonants) with its expected sound + a player,
// grouped by level, so the user can scan the whole pack and flag wrong ones.
const fs = require('fs'), path = require('path');
const pack = require(path.resolve('src/data/scripts/devanagari.json'));
const nga = require('/private/tmp/deva-nga-candidates/manifest.json');
const AUDIO = path.resolve('public/quest-audio');
const OUT = '/private/tmp/claude-501/-Users-antoinevj-Documents-GitHub-my-gamified-srs-app--claude-worktrees-awesome-jones/d730b480-f040-446b-beb1-8f2e49265fb4/scratchpad/deva-audio-audit.html';

const byId = new Map(pack.items.map(i => [i.id, i]));
const b64 = file => { const p = path.join(AUDIO, file); return fs.existsSync(p) ? fs.readFileSync(p).toString('base64') : null; };
const player = data => data ? `<audio controls preload="none" src="data:audio/mpeg;base64,${data}"></audio>` : `<span class="missing">no clip</span>`;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── ங candidate cards ──
const ngaCards = nga.map(c => {
  const pick = c.id.split('_')[0];
  const isRef = c.id === 'A_current';
  return `<article class="cand${isRef ? ' cand--ref' : ''}">
    <div class="cand__top"><span class="glyph" lang="hi">ङ</span>
      <div><div class="tl"><span class="pick">${pick}</span>${isRef ? '<span class="badge badge--bad">current · wrong</span>' : '<span class="badge">candidate</span>'}</div>
      <p class="desc">${esc(c.label.replace(/^[A-Z_]+\s·?\s*/, '').replace('CURRENT — ', ''))}</p></div></div>
    ${player(c.b64)}</article>`;
}).join('\n');

// ── letter inventory, grouped by level ──
const sections = pack.levels.map(lvl => {
  const letters = lvl.itemIds.map(id => byId.get(id)).filter(it => it && it.kind === 'letter');
  if (!letters.length) return '';
  const rows = letters.map(it => {
    const flagged = it.glyph === 'ङ';
    return `<div class="cell${flagged ? ' cell--flag' : ''}">
      <div class="cell__head"><span class="g" lang="hi">${esc(it.glyph)}</span>
        <div class="cell__meta"><span class="rom">${esc(it.romanization)}</span><span class="snd">${esc(it.sound)}</span></div></div>
      ${flagged ? '<p class="fixing">↑ pick a fix above</p>' : player(b64(it.audio))}</div>`;
  }).join('\n');
  return `<section class="lvl"><h2>Level ${lvl.level} · ${esc(lvl.title)}</h2><div class="grid">${rows}</div></section>`;
}).join('\n');

const html = `<title>Devanagari sound audit — LangLab</title>
<style>
  :root{--bg:#faf9fc;--surface:#fff;--surface2:#f4f1fa;--text:#1a1626;--muted:#6b6478;--faint:#9a93a8;--accent:#7c3aed;--accent-soft:#efe9fc;--border:#e7e2f0;--bad:#c2410c;--bad-soft:#fdf1ea;--bad-border:#f2d6c4;--flag-soft:#fff8ed;--flag-border:#f5e0bf}
  @media (prefers-color-scheme:dark){:root{--bg:#14111c;--surface:#1e1a29;--surface2:#241f31;--text:#ece9f2;--muted:#a49db5;--faint:#6f6880;--accent:#a78bfa;--accent-soft:#2a2340;--border:#302a40;--bad:#fb923c;--bad-soft:#2c2016;--bad-border:#4a3421;--flag-soft:#251d10;--flag-border:#463415}}
  :root[data-theme="light"]{--bg:#faf9fc;--surface:#fff;--surface2:#f4f1fa;--text:#1a1626;--muted:#6b6478;--faint:#9a93a8;--accent:#7c3aed;--accent-soft:#efe9fc;--border:#e7e2f0;--bad:#c2410c;--bad-soft:#fdf1ea;--bad-border:#f2d6c4;--flag-soft:#fff8ed;--flag-border:#f5e0bf}
  :root[data-theme="dark"]{--bg:#14111c;--surface:#1e1a29;--surface2:#241f31;--text:#ece9f2;--muted:#a49db5;--faint:#6f6880;--accent:#a78bfa;--accent-soft:#2a2340;--border:#302a40;--bad:#fb923c;--bad-soft:#2c2016;--bad-border:#4a3421;--flag-soft:#251d10;--flag-border:#463415}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;line-height:1.5;-webkit-font-smoothing:antialiased}
  .wrap{max-width:52rem;margin:0 auto;padding:2.5rem 1.15rem 4rem}
  .eyebrow{font-size:.72rem;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 .5rem}
  h1{font-size:1.7rem;line-height:1.15;margin:0 0 .5rem;letter-spacing:-.01em}
  .lede{color:var(--muted);font-size:1rem;margin:0 0 1.5rem;max-width:40rem}
  .lede b{color:var(--text)}
  .devfont,[lang="hi"]{font-family:"Noto Sans Devanagari","Kohinoor Devanagari","Nirmala UI",system-ui,sans-serif}
  .fixblock{background:var(--bad-soft);border:1px solid var(--bad-border);border-radius:16px;padding:1.1rem 1.15rem 1.25rem;margin-bottom:2.25rem}
  .fixblock h2{margin:0 0 .25rem;font-size:1.1rem}
  .fixblock p.sub{margin:0 0 1rem;font-size:.9rem;color:var(--muted)}
  .cands{display:flex;flex-direction:column;gap:.7rem}
  .cand{background:var(--surface);border:1px solid var(--border);border-radius:13px;padding:.85rem .9rem;display:flex;flex-direction:column;gap:.6rem}
  .cand--ref{background:transparent;border-style:dashed}
  .cand__top{display:flex;align-items:center;gap:.85rem}
  .cand .glyph{font-size:2.6rem;line-height:1;width:3.2rem;text-align:center;font-family:"Noto Sans Devanagari","Kohinoor Devanagari","Nirmala UI",sans-serif}
  .tl{display:flex;align-items:center;gap:.45rem;margin-bottom:.15rem;flex-wrap:wrap}
  .pick{font-weight:800;color:var(--accent);background:var(--accent-soft);border-radius:6px;padding:.03rem .45rem}
  .cand--ref .pick{color:var(--bad);background:transparent;padding-left:0}
  .badge{font-size:.62rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--faint);border:1px solid var(--border);border-radius:999px;padding:.08rem .5rem}
  .badge--bad{color:var(--bad);border-color:var(--bad-border)}
  .desc{margin:0;font-size:.88rem;color:var(--text)}
  h2{font-size:.95rem;letter-spacing:.02em}
  .lvl{margin-bottom:1.75rem}
  .lvl h2{margin:0 0 .75rem;color:var(--text);border-bottom:1px solid var(--border);padding-bottom:.4rem}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(13.5rem,1fr));gap:.7rem}
  .cell{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:.7rem .75rem;display:flex;flex-direction:column;gap:.55rem}
  .cell--flag{background:var(--flag-soft);border-color:var(--flag-border)}
  .cell__head{display:flex;align-items:center;gap:.65rem}
  .cell .g{font-size:2rem;line-height:1;width:2.4rem;text-align:center;font-family:"Noto Sans Devanagari","Kohinoor Devanagari","Nirmala UI",sans-serif}
  .cell__meta{display:flex;flex-direction:column;min-width:0}
  .rom{font-weight:700;font-size:.92rem}
  .snd{font-size:.75rem;color:var(--muted)}
  .fixing{margin:0;font-size:.78rem;color:var(--bad);font-weight:600}
  audio{width:100%;height:36px}
  .missing{font-size:.75rem;color:var(--faint)}
  .foot{margin-top:2rem;padding:1rem 1.1rem;background:var(--surface2);border:1px solid var(--border);border-radius:12px;font-size:.9rem;color:var(--muted)}
  .foot b{color:var(--text)}
</style>
<div class="wrap">
  <p class="eyebrow">LangLab · Learn to read Hindi</p>
  <h1>Devanagari sound audit</h1>
  <p class="lede">Every alphabet letter with a player and its expected sound. Scan through, and <b>tell me every one that sounds wrong</b> (just list the letters). Isolated letters that never start a Hindi word — nasals like <b lang="hi">ङ ञ ण</b> — are the usual offenders. First, pick a fix for <b lang="hi">ङ</b>.</p>

  <div class="fixblock">
    <h2>Fix in progress: <span lang="hi">ङ</span> (nga — "ng in sing")</h2>
    <p class="sub">Currently comes out like "wee". Pick the one that sounds most like <b>nga</b> / the ng in "sing".</p>
    <div class="cands">${ngaCards}</div>
  </div>

  ${sections}

  <div class="foot"><b>Reply with:</b> (1) the <span lang="hi">ङ</span> take you want — <b>A–E</b>; (2) any other letters that sound wrong, by their romanization or glyph. I'll regenerate the flagged set, verify against these, upload to R2, and bump the cache.</div>
</div>`;

fs.writeFileSync(OUT, html);
console.log('wrote', OUT, `(${(html.length / 1024).toFixed(0)} KB)`);
