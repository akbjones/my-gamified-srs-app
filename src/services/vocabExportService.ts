/** Export the vocab list as a printable HTML page that the user can save
 *  as a PDF via the browser's print dialog (Save as PDF).
 *
 *  Why not jsPDF / pdfmake? They bloat the bundle and choke on Devanagari
 *  / Cyrillic / Arabic-script fonts without manual embedding. The browser
 *  print path uses the user's installed fonts and renders any script
 *  correctly out of the box.
 */

import { VocabEntry } from '../types';

const LANGUAGE_LABELS: Record<string, string> = {
  spanish: 'Spanish', italian: 'Italian', french: 'French', portuguese: 'Portuguese',
  german: 'German', dutch: 'Dutch', swedish: 'Swedish', welsh: 'Welsh',
  hindi: 'Hindi', turkish: 'Turkish', russian: 'Russian',
};

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function exportVocabList(
  entries: Array<VocabEntry & { translation?: string; ipa?: string; pos?: string }>,
  language: string,
): void {
  const langLabel = LANGUAGE_LABELS[language] || language;
  const date = new Date().toLocaleDateString();

  // Sort alphabetically for the export
  const sorted = [...entries].sort((a, b) =>
    a.word.localeCompare(b.word, undefined, { sensitivity: 'base' }),
  );

  // Group by first letter
  const groups: Record<string, typeof sorted> = {};
  for (const e of sorted) {
    const letter = (e.word[0] || '').toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(e);
  }

  const groupHtml = Object.entries(groups)
    .map(([letter, items]) => `
      <section class="group">
        <h2 class="letter">${escapeHtml(letter)}</h2>
        <table>
          <tbody>
            ${items.map(e => `
              <tr>
                <td class="word">${escapeHtml(e.word)}</td>
                <td class="ipa">${e.ipa ? escapeHtml('/' + e.ipa + '/') : ''}</td>
                <td class="pos">${e.pos ? escapeHtml(e.pos) : ''}</td>
                <td class="translation">${escapeHtml(e.translation || '')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </section>
    `).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>LangLab Vocab – ${langLabel}</title>
  <style>
    @page { size: A4; margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      color: #1e293b;
      margin: 0;
      padding: 0;
      line-height: 1.4;
    }
    header {
      border-bottom: 2px solid #7c3aed;
      margin-bottom: 24px;
      padding-bottom: 16px;
    }
    h1 {
      font-size: 28px;
      font-weight: 900;
      margin: 0 0 4px 0;
      color: #5b21b6;
      letter-spacing: -0.5px;
    }
    .meta {
      font-size: 11px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 600;
    }
    .group { break-inside: avoid; margin-bottom: 24px; }
    .letter {
      font-size: 18px;
      font-weight: 800;
      color: #7c3aed;
      margin: 0 0 8px 0;
      padding: 4px 8px;
      background: #f5f3ff;
      border-radius: 4px;
      display: inline-block;
      min-width: 32px;
      text-align: center;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }
    td {
      padding: 4px 6px;
      vertical-align: top;
      border-bottom: 1px dotted #e2e8f0;
    }
    .word {
      font-weight: 700;
      width: 22%;
      color: #1e293b;
    }
    .ipa {
      width: 18%;
      color: #94a3b8;
      font-family: 'Cambria', 'Times', serif;
      font-style: italic;
    }
    .pos {
      width: 8%;
      color: #94a3b8;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 600;
    }
    .translation {
      color: #475569;
    }
    footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #e2e8f0;
      font-size: 10px;
      color: #94a3b8;
      text-align: center;
      letter-spacing: 2px;
      text-transform: uppercase;
      font-weight: 700;
    }
    @media print {
      .no-print { display: none; }
    }
    .no-print {
      margin: 16px 0;
      padding: 12px;
      background: #f5f3ff;
      border-radius: 8px;
      text-align: center;
      font-size: 13px;
    }
    .no-print button {
      background: #7c3aed;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 700;
      cursor: pointer;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="no-print">
    Use your browser's <strong>Print → Save as PDF</strong> to export this list.
    <br><br>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>

  <header>
    <h1>LangLab vocabulary</h1>
    <div class="meta">${escapeHtml(langLabel)} · ${entries.length} words · ${escapeHtml(date)}</div>
  </header>

  ${groupHtml}

  <footer>
    LangLab · langlab-srs.pages.dev
  </footer>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    // popup blocked – fallback to download
    const a = document.createElement('a');
    a.href = url;
    a.download = `langlab-vocab-${language}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
