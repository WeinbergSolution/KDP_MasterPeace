// Social-media quote-card generator (ported 1:1 from Legacy V3): draws a real
// 1080×1080 PNG on a canvas — brand-coloured background, white frame, the quote
// (auto-fitted), a large quote mark, the author and the book title.

const SIZE = 1080;

/** Drawing spec for one quote card. */
interface CardSpec {
  accent: string;
  lines: string[];
  fs: number;
  author: string;
  title: string;
}

/**
 * Wraps the quote words into lines that fit the max width at a font size.
 *
 * @param ctx The 2D canvas context.
 * @param words The quote words.
 * @param maxW The maximum line width in px.
 * @param fs The font size in px.
 * @returns The wrapped lines.
 */
function wrapLines(
  ctx: CanvasRenderingContext2D,
  words: string[],
  maxW: number,
  fs: number,
): string[] {
  ctx.font = `600 ${fs}px Fraunces, Georgia, serif`;
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

/**
 * Shrinks the font until the wrapped quote fits the card.
 *
 * @param ctx The 2D canvas context.
 * @param words The quote words.
 * @param maxW The maximum line width in px.
 * @returns The chosen font size + wrapped lines.
 */
function fitLines(
  ctx: CanvasRenderingContext2D,
  words: string[],
  maxW: number,
): { fs: number; lines: string[] } {
  let fs = 62;
  let lines = wrapLines(ctx, words, maxW, fs);
  const tooTall = () => lines.length * fs * 1.4 > SIZE - 460;
  const tooWide = () => lines.some((l) => ctx.measureText(l).width > maxW);
  while ((tooTall() || tooWide()) && fs > 30) {
    fs -= 4;
    lines = wrapLines(ctx, words, maxW, fs);
  }
  return { fs, lines };
}

/**
 * Draws the brand background + white frame and sets the text style.
 *
 * @param ctx The 2D canvas context.
 * @param accent The brand accent colour.
 */
function drawBackground(ctx: CanvasRenderingContext2D, accent: string): void {
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(56, 56, SIZE - 112, SIZE - 112);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
}

/**
 * Draws the wrapped quote text and the large opening quote mark.
 *
 * @param ctx The 2D canvas context.
 * @param lines The wrapped quote lines.
 * @param fs The quote font size.
 */
function drawQuoteText(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  fs: number,
): void {
  let y = SIZE / 2 - ((lines.length - 1) * fs * 1.4) / 2;
  ctx.font = `700 ${fs * 2.3}px Fraunces, Georgia, serif`;
  ctx.globalAlpha = 0.35;
  ctx.fillText('„', SIZE / 2, y - fs * 1.1);
  ctx.globalAlpha = 1;
  ctx.font = `600 ${fs}px Fraunces, Georgia, serif`;
  for (const l of lines) {
    ctx.fillText(l, SIZE / 2, y);
    y += fs * 1.4;
  }
}

/**
 * Draws the full quote card onto the context.
 *
 * @param ctx The 2D canvas context.
 * @param spec The card drawing spec.
 */
function drawCard(ctx: CanvasRenderingContext2D, spec: CardSpec): void {
  drawBackground(ctx, spec.accent);
  drawQuoteText(ctx, spec.lines, spec.fs);
  drawFooter(ctx, spec.author, spec.title);
}

/**
 * Draws the author + title footer text.
 *
 * @param ctx The 2D canvas context.
 * @param author The author name.
 * @param title The book title.
 */
function drawFooter(
  ctx: CanvasRenderingContext2D,
  author: string,
  title: string,
): void {
  ctx.globalAlpha = 0.9;
  ctx.font = '500 30px Inter, sans-serif';
  ctx.fillText(`— ${author}`, SIZE / 2, SIZE - 150);
  ctx.globalAlpha = 0.65;
  ctx.font = '500 23px Inter, sans-serif';
  ctx.fillText(title, SIZE / 2, SIZE - 104);
}

/**
 * Builds a real 1080×1080 quote-card PNG blob.
 *
 * @param quote The quote text.
 * @param accent The brand accent colour.
 * @param author The author name.
 * @param title The book title.
 * @returns A promise of the PNG blob.
 */
export function buildQuoteCardBlob(
  quote: string,
  accent: string,
  author: string,
  title: string,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return Promise.reject(new Error('Canvas 2D nicht verfügbar'));
  const { fs, lines } = fitLines(ctx, quote.split(/\s+/), SIZE - 240);
  drawCard(ctx, { accent, lines, fs, author, title });
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) =>
        b ? resolve(b) : reject(new Error('PNG-Erzeugung fehlgeschlagen')),
      'image/png',
    ),
  );
}
