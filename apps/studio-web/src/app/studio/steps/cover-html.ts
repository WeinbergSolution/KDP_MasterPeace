// Print-ready KDP cover-template generator, ported from the Legacy V3 reference
// (buildCoverHtml). Produces a self-contained HTML document at the exact
// computed cover dimensions (back + spine + front, barcode cut-out, optional
// guide lines). Split into small helpers to respect the 14-line function budget.
// External font @import is intentionally dropped (privacy); serif fallbacks keep
// the look. Escaping guards the interpolated project text.

import type { BookProject } from '../../core/models/book-project';
import { FONT_FAMILIES, TRIM_DIMS } from './writing-utils';
import {
  BLEED_MM,
  SAFE_MM,
  coverDimensions,
  spineTextPossible,
  spineWidthMm,
} from './cover-metrics';

/** Fallback body font when the settings font id is unknown. */
const DEFAULT_FONT = FONT_FAMILIES['garamond'];

/** Resolved geometry + colours used across the cover template. */
interface CoverGeo {
  readonly W: number;
  readonly H: number;
  readonly trimW: number;
  readonly trimH: number;
  readonly spine: number;
  readonly pages: number;
  readonly bg: string;
  readonly fg: string;
  readonly fontFamily: string;
}

/**
 * Escapes HTML-significant characters in project text.
 *
 * @param value The raw value.
 * @returns The escaped string.
 */
function esc(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Escapes text and renders **bold** as <strong>.
 *
 * @param text The raw inline text.
 * @returns The formatted HTML.
 */
function fmtHtml(text: string): string {
  return esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

/**
 * Renders the blurb into back-cover paragraphs.
 *
 * @param blurb The blurb text.
 * @returns The paragraph HTML.
 */
function blurbToHtml(blurb: string): string {
  return (blurb || 'Dein Klappentext — generiere ihn im Cover-Schritt.')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => `<p>${fmtHtml(line.replace(/^[-•]\s*/, '• '))}</p>`)
    .join('');
}

/**
 * Builds the base page/body CSS.
 *
 * @param g The cover geometry.
 * @returns The CSS string.
 */
function cssPage(g: CoverGeo): string {
  return `* { box-sizing: border-box; margin: 0; }
@page { size: ${g.W}mm ${g.H}mm; margin: 0; }
html, body { width: ${g.W}mm; height: ${g.H}mm; }
body { background: ${g.bg}; color: ${g.fg}; font-family: ${g.fontFamily}; position: relative; overflow: hidden; }
.panel { position: absolute; top: 0; height: ${g.H}mm; }`;
}

/**
 * Builds the back/spine/front panel CSS.
 *
 * @param g The cover geometry.
 * @param imageUrl The optional front-cover image URL.
 * @returns The CSS string.
 */
function cssPanels(g: CoverGeo, imageUrl: string): string {
  const b = BLEED_MM;
  const sf = SAFE_MM;
  const frontBg = imageUrl
    ? `background: linear-gradient(${g.bg}D9, ${g.bg}8C), url('${imageUrl}') center/cover no-repeat;`
    : '';
  return `.back { left: 0; width: ${b + g.trimW}mm; padding: ${b + sf + 6}mm ${sf + 4}mm ${b + sf}mm ${b + sf + 2}mm; }
.spine { left: ${b + g.trimW}mm; width: ${g.spine}mm; display: flex; align-items: center; justify-content: center; }
.frontp { left: ${b + g.trimW + g.spine}mm; width: ${g.trimW + b}mm; padding: ${b + sf}mm ${b + sf + 2}mm ${b + sf}mm ${sf + 4}mm; display: flex; flex-direction: column; justify-content: center; text-align: center; ${frontBg} }
.frontp .tt { font-family: 'Fraunces', Georgia, serif; font-size: 34pt; font-weight: 700; line-height: 1.12; margin-bottom: 10mm; }
.frontp .st { font-size: 14pt; font-style: italic; margin-bottom: 22mm; opacity: 0.92; }
.frontp .au { font-size: 13pt; letter-spacing: 0.18em; text-transform: uppercase; }
.back p { font-size: 10.5pt; line-height: 1.55; margin-bottom: 4mm; max-width: ${g.trimW - sf * 2 - 8}mm; }
.back .bt { font-family: 'Fraunces', Georgia, serif; font-size: 15pt; font-weight: 700; margin-bottom: 6mm; }
.spine .sp { writing-mode: vertical-rl; font-family: 'Fraunces', Georgia, serif; font-size: ${Math.min(13, Math.max(7, g.spine * 1.7))}pt; letter-spacing: 0.06em; white-space: nowrap; }`;
}

/**
 * Builds the barcode, guide-line and print-bar CSS.
 *
 * @param g The cover geometry.
 * @returns The CSS string.
 */
function cssChrome(g: CoverGeo): string {
  return `.barcode { position: absolute; right: ${BLEED_MM + SAFE_MM}mm; bottom: ${BLEED_MM + SAFE_MM}mm; width: 50.8mm; height: 30.5mm; background: #ffffff; border-radius: 1.5mm; display: flex; align-items: center; justify-content: center; color: #999; font-family: sans-serif; font-size: 8pt; text-align: center; }
.g { position: absolute; border: 0; border-left: 0.4mm dashed rgba(255,255,255,0.55); }
.g.v { top: 0; height: ${g.H}mm; width: 0; }
.g.h { left: 0; width: ${g.W}mm; height: 0; border-left: 0; border-top: 0.4mm dashed rgba(255,255,255,0.55); }
.glabel { position: absolute; top: 2mm; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.55); color: #fff; font-family: sans-serif; font-size: 7pt; padding: 1mm 3mm; border-radius: 2mm; }
.printbar { position: fixed; top: 12px; right: 12px; z-index: 99; font-family: sans-serif; }
.printbar button { background: #6c57b8; color: #fff; border: 0; border-radius: 8px; padding: 12px 18px; font-size: 15px; cursor: pointer; }
.printbar div { background: #fff; color: #333; border: 1px solid #ddd; border-radius: 8px; padding: 8px 10px; font-size: 12px; max-width: 280px; margin-top: 8px; }
@media print { .printbar { display: none; } }`;
}

/**
 * Builds the cover body (print bar + back + spine + front panels).
 *
 * @param project The book project.
 * @param spineText Whether spine text is shown.
 * @param note The print-dialog hint shown in the print bar.
 * @returns The body HTML.
 */
function coverBody(
  project: BookProject,
  spineText: boolean,
  note: string,
): string {
  const c = project.cover;
  const bar = `<div class="printbar"><button onclick="window.print()">Als PDF speichern</button><div>${note}</div></div>`;
  const back = `<div class="panel back"><div class="bt">${esc(project.promise || project.subtitle || '')}</div>${blurbToHtml(c.blurb)}<div class="barcode">Barcode-Bereich<br>frei lassen (fügt KDP ein)</div></div>`;
  const sp = spineText
    ? `<div class="sp">${esc(project.title)} · ${esc(project.author)}</div>`
    : '';
  const spine = `<div class="panel spine">${sp}</div>`;
  const front = `<div class="panel frontp"><div class="tt">${esc(project.title || 'Titel')}</div><div class="st">${esc(project.subtitle || '')}</div><div class="au">${esc(project.author || '')}</div></div>`;
  return bar + back + spine + front;
}

/**
 * Builds the dashed guide-line overlay (empty unless requested).
 *
 * @param g The cover geometry.
 * @param withGuides Whether to render guide lines.
 * @returns The guides HTML.
 */
function coverGuides(g: CoverGeo, withGuides: boolean): string {
  if (!withGuides) return '';
  const b = BLEED_MM;
  return `<div class="g v" style="left:${b}mm"></div><div class="g v" style="left:${b + g.trimW}mm"></div><div class="g v" style="left:${b + g.trimW + g.spine}mm"></div><div class="g v" style="left:${b + g.trimW * 2 + g.spine}mm"></div><div class="g h" style="top:${b}mm"></div><div class="g h" style="top:${b + g.trimH}mm"></div><div class="glabel">Hilfslinien: gestrichelt = Schnittkanten &amp; Buchrücken. Für die finale Datei die Version ohne Hilfslinien drucken.</div>`;
}

/**
 * Builds the print-dialog hint line.
 *
 * @param g The cover geometry.
 * @param paper The paper key.
 * @returns The hint text.
 */
function printNote(g: CoverGeo, paper: string): string {
  const stock = paper === 'white' ? 'weißes' : 'cremefarbenes';
  return `Gesamtmaß: ${g.W} × ${g.H} mm · Buchrücken: ${g.spine} mm bei ${g.pages} Seiten (${stock} Papier). „Hintergrundgrafiken" AN und „Kopf- und Fußzeilen" AUS (unter „Weitere Einstellungen" im Druckdialog)!`;
}

/**
 * Resolves the cover geometry (trim, spine, dimensions, colours, font).
 *
 * @param project The book project.
 * @param fallbackPages The estimated page count (used when none is entered).
 * @returns The resolved cover geometry.
 */
function coverGeo(project: BookProject, fallbackPages: number): CoverGeo {
  const c = project.cover;
  const trim = TRIM_DIMS[project.settings.trim] ?? TRIM_DIMS['7x10'];
  const s = spineWidthMm(c.pageCount, c.paper, fallbackPages);
  const dims = coverDimensions(trim.w, trim.h, s.mm);
  return {
    W: dims.widthMm,
    H: dims.heightMm,
    trimW: trim.w,
    trimH: trim.h,
    spine: s.mm,
    pages: s.pages,
    bg: c.bg || '#2E2A3B',
    fg: c.fg || '#F5F1E6',
    fontFamily: FONT_FAMILIES[project.settings.font] ?? DEFAULT_FONT,
  };
}

/**
 * Builds the complete print-ready cover HTML document.
 *
 * @param project The book project.
 * @param fallbackPages The estimated page count (used when none is entered).
 * @param withGuides Whether to overlay cut/spine guide lines.
 * @returns The full HTML document string.
 */
export function buildCoverHtml(
  project: BookProject,
  fallbackPages: number,
  withGuides: boolean,
): string {
  const g = coverGeo(project, fallbackPages);
  const css = cssPage(g) + cssPanels(g, project.cover.imageUrl) + cssChrome(g);
  const body = coverBody(
    project,
    spineTextPossible(g.pages),
    printNote(g, project.cover.paper),
  );
  const doc = `<style>${css}</style></head><body>${body}${coverGuides(g, withGuides)}`;
  return `<!DOCTYPE html><html lang="${project.language}"><head><meta charset="utf-8"><title>Cover — ${esc(project.title)}</title>${doc}</body></html>`;
}
