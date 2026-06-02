/** Renders a study card as a shareable PNG image.
 *
 * Layout (1080×1350 portrait, social-friendly):
 *   - Violet gradient background, rounded corners
 *   - White card panel, generous padding
 *   - Target sentence in large bold
 *   - Subtle divider
 *   - Translation in italic, smaller
 *   - Language label + LangLab wordmark at the bottom
 *
 * Output: a Blob that can be shared (Web Share API) or downloaded.
 */

export interface CardImageOptions {
  target: string;
  english: string;
  language: string; // e.g. 'spanish'
  ipa?: string;
}

const CANVAS_W = 1080;
const CANVAS_H = 1350;
const PADDING = 80;
const CARD_INSET = 80;

const LANGUAGE_LABELS: Record<string, string> = {
  spanish: 'Spanish', italian: 'Italian', french: 'French', portuguese: 'Portuguese',
  german: 'German', dutch: 'Dutch', swedish: 'Swedish', welsh: 'Welsh',
  hindi: 'Hindi', turkish: 'Turkish', russian: 'Russian',
};

/** Wrap text into lines that fit within maxWidth on the given canvas context. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const trial = current ? `${current} ${w}` : w;
    if (ctx.measureText(trial).width <= maxWidth) {
      current = trial;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Compute an auto font size that fits all lines vertically within maxHeight. */
function fitFontSize(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontFamily: string,
  fontWeight: string,
  maxWidth: number,
  maxHeight: number,
  startSize: number,
  minSize: number,
): { size: number; lines: string[] } {
  for (let size = startSize; size >= minSize; size -= 4) {
    ctx.font = `${fontWeight} ${size}px ${fontFamily}`;
    const lines = wrapText(ctx, text, maxWidth);
    const totalHeight = lines.length * size * 1.2;
    if (totalHeight <= maxHeight) return { size, lines };
  }
  ctx.font = `${fontWeight} ${minSize}px ${fontFamily}`;
  return { size: minSize, lines: wrapText(ctx, text, maxWidth) };
}

export async function renderCardImage(opts: CardImageOptions): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // ── Background — violet gradient (matches PWA icon) ──
  const bg = ctx.createLinearGradient(0, 0, CANVAS_W, CANVAS_H);
  bg.addColorStop(0, '#7C3AED');
  bg.addColorStop(1, '#5B21B6');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // ── White card panel ──
  const cardX = CARD_INSET;
  const cardY = CARD_INSET;
  const cardW = CANVAS_W - 2 * CARD_INSET;
  const cardH = CANVAS_H - 2 * CARD_INSET;
  const cardRadius = 36;

  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.moveTo(cardX + cardRadius, cardY);
  ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, cardRadius);
  ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, cardRadius);
  ctx.arcTo(cardX, cardY + cardH, cardX, cardY, cardRadius);
  ctx.arcTo(cardX, cardY, cardX + cardW, cardY, cardRadius);
  ctx.closePath();
  ctx.fill();

  // ── Language label (top of card) ──
  const labelY = cardY + 80;
  ctx.fillStyle = '#7C3AED';
  ctx.font = 'bold 22px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText((LANGUAGE_LABELS[opts.language] || opts.language).toUpperCase(), CANVAS_W / 2, labelY);

  // ── Target sentence (centered, autosized) ──
  const contentX = cardX + PADDING;
  const contentW = cardW - 2 * PADDING;
  const targetTop = labelY + 80;
  const targetMaxH = (cardH - 80 - 200) / 2;

  ctx.fillStyle = '#1E293B';
  const targetFit = fitFontSize(
    ctx, opts.target,
    '"Inter", system-ui, sans-serif',
    '900',
    contentW, targetMaxH,
    72, 36,
  );
  ctx.font = `900 ${targetFit.size}px "Inter", system-ui, sans-serif`;
  let y = targetTop + targetFit.size;
  for (const line of targetFit.lines) {
    ctx.fillText(line, CANVAS_W / 2, y - targetFit.size);
    y += targetFit.size * 1.2;
  }

  // ── Divider ──
  const dividerY = targetTop + targetMaxH + 40;
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(contentX + 80, dividerY);
  ctx.lineTo(contentX + contentW - 80, dividerY);
  ctx.stroke();

  // ── Translation (italic, smaller) ──
  const engTop = dividerY + 60;
  const engMaxH = cardY + cardH - engTop - 160;

  ctx.fillStyle = '#475569';
  const engFit = fitFontSize(
    ctx, opts.english,
    '"Inter", system-ui, sans-serif',
    'italic 600',
    contentW, engMaxH,
    52, 28,
  );
  ctx.font = `italic 600 ${engFit.size}px "Inter", system-ui, sans-serif`;
  let yy = engTop + engFit.size;
  for (const line of engFit.lines) {
    ctx.fillText(line, CANVAS_W / 2, yy - engFit.size);
    yy += engFit.size * 1.2;
  }

  // ── Brand mark at bottom ──
  const brandY = cardY + cardH - 50;
  ctx.fillStyle = '#7C3AED';
  ctx.font = '900 28px "Orbitron", "Inter", sans-serif';
  ctx.textBaseline = 'bottom';
  ctx.fillText('λ  LangLab', CANVAS_W / 2, brandY);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to render canvas to blob'));
    }, 'image/png', 0.95);
  });
}

/** Trigger native share or fall back to download. Returns true if user
 *  could be presented with a share/save flow. */
export async function shareCardImage(opts: CardImageOptions): Promise<boolean> {
  let blob: Blob;
  try {
    blob = await renderCardImage(opts);
  } catch (e) {
    console.error('renderCardImage failed:', e);
    return false;
  }

  const file = new File([blob], `langlab-${opts.language}.png`, { type: 'image/png' });

  // Try Web Share API (mobile-friendly, opens native share sheet)
  const nav = navigator as Navigator & {
    share?: (data: ShareData) => Promise<void>;
    canShare?: (data: ShareData) => boolean;
  };
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: 'LangLab card', text: opts.target });
      return true;
    } catch (e) {
      // User cancelled, treat as success (no fallback download needed)
      return true;
    }
  }

  // Desktop / no Web Share — trigger download instead
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `langlab-${opts.language}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
