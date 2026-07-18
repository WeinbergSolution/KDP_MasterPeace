// Digital-product PDF builder (ported 1:1 from Legacy V3): a smartphone/tablet/
// A4-sized, brand-coloured PDF that reacts to the selected chapters, format,
// accent colour, font size and scaffold inclusion.

import type { BookProject } from '../../../core/models/book-project';
import { FONT_FAMILIES } from '../writing-utils';
import { type BookStrings, bookStrings } from './book-strings';
import { esc, parseBlocks } from './block-parse';
import { blocksToHtml } from './blocks-html';
import { extraSection } from './book-body';
import { fontImport } from './fonts';

/** Digital-product page formats (mm). */
export const DIGITAL_FORMATS: Record<
  string,
  { label: string; w: number; h: number }
> = {
  phone: {
    label: 'Smartphone hoch (9:16) – ohne Zoomen lesbar',
    w: 113,
    h: 201,
  },
  a5: { label: 'A5 / Tablet (14,8 × 21 cm)', w: 148, h: 210 },
  a4: { label: 'A4 – Bildschirm & Selbstausdruck', w: 210, h: 297 },
};

/** Resolved digital-export context. */
interface DigCtx {
  accent: string;
  fs: number;
  align: string;
  family: string;
  fw: number;
  fh: number;
  fontKey: string;
}

/** Base reset, page size and heading typography. */
function cssDigBase(c: DigCtx): string {
  return `${fontImport(c.fontKey)}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: ${c.fw}mm ${c.fh}mm; margin: 11mm 10mm 13mm 10mm; }
  body { font-family: ${c.family}; font-size: ${c.fs}pt; line-height: 1.6; color: #26212F; }
  h1 { font-family: 'Fraunces', ${c.family}; font-size: ${c.fs * 1.7}pt; font-weight: 700; color: ${c.accent}; margin: 0 0 ${c.fs}pt; line-height: 1.2; }
  h2 { font-family: 'Fraunces', ${c.family}; font-size: ${c.fs * 1.25}pt; font-weight: 700; color: ${c.accent}; margin: ${c.fs * 1.3}pt 0 ${c.fs * 0.5}pt; }
  h3 { font-size: ${c.fs * 1.05}pt; font-weight: 600; margin: ${c.fs}pt 0 ${c.fs * 0.35}pt; }
  p { margin: 0 0 ${c.fs * 0.6}pt; text-align: ${c.align}; hyphens: auto; -webkit-hyphens: auto; }`;
}

/** Workbook element styling in the brand colour. */
function cssDigElements(c: DigCtx): string {
  return `blockquote { margin: ${c.fs * 0.8}pt 0; padding: ${c.fs * 0.5}pt ${c.fs * 0.9}pt; border-left: 3pt solid ${c.accent}; font-style: italic; background: ${c.accent}12; border-radius: 0 6pt 6pt 0; }
  .li { display: flex; gap: 6pt; margin: 0 0 4pt 4pt; } .dot { width: 4pt; height: 4pt; border-radius: 50%; background: ${c.accent}; margin-top: ${c.fs * 0.55}pt; flex: none; }
  .chk { display: flex; gap: 7pt; margin: 0 0 7pt 2pt; align-items: flex-start; } .box { width: 12pt; height: 12pt; border: 1.4pt solid ${c.accent}; border-radius: 3pt; margin-top: 2pt; flex: none; }
  .wlines { margin: 8pt 0 12pt; } .wline { border-bottom: 0.9pt solid #B9B2CC; height: 26pt; }
  .skala { margin: 8pt 0 12pt; } .skrow { display: flex; gap: 5pt; margin-top: 6pt; flex-wrap: wrap; }
  .skrow span { width: 21pt; height: 21pt; border: 1.2pt solid ${c.accent}; color: ${c.accent}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${c.fs * 0.75}pt; font-weight: 600; }
  .ebox { border: 1.4pt solid ${c.accent}; background: ${c.accent}0E; border-radius: 8pt; padding: 11pt 12pt; margin: 11pt 0 13pt; } .ebox.tipp { border-style: dashed; background: transparent; }
  .elabel { font-family: 'Fraunces', serif; font-weight: 700; font-size: ${c.fs * 0.8}pt; letter-spacing: 0.12em; text-transform: uppercase; color: ${c.accent}; margin-bottom: 5pt; }
  .ch-num { font-size: ${c.fs * 0.8}pt; letter-spacing: 0.25em; text-transform: uppercase; color: ${c.accent}; margin-bottom: 8pt; }`;
}

/** Page-break, cover, TOC and print-bar styling. */
function cssDigLayout(c: DigCtx): string {
  return `.chapter, .front { page-break-before: always; } h2, h3 { page-break-after: avoid; } .ebox, .wlines, .skala, .grp { page-break-inside: avoid; }
  .coverpage { page-break-before: avoid; background: ${c.accent}; color: #fff; border-radius: 10pt; min-height: 92vh; display: flex; flex-direction: column; justify-content: center; text-align: center; padding: 8%; }
  .coverpage .tt { font-family: 'Fraunces', serif; font-size: ${c.fs * 2.2}pt; font-weight: 700; line-height: 1.15; margin-bottom: 12pt; }
  .coverpage .st { font-size: ${c.fs * 1.1}pt; font-style: italic; opacity: 0.92; margin-bottom: 30pt; } .coverpage .au { font-size: ${c.fs * 0.95}pt; letter-spacing: 0.15em; text-transform: uppercase; }
  .coverpage .imprint { margin-top: 40pt; font-size: ${c.fs * 0.7}pt; opacity: 0.75; }
  .toc h1 { margin-bottom: ${c.fs * 1.4}pt; } .toc .trow { border-bottom: 0.7pt dotted #B9B2CC; padding: 6pt 0; }
  .printbar { position: fixed; top: 12px; right: 12px; z-index: 99; font-family: sans-serif; }
  .printbar button { background: ${c.accent}; color: #fff; border: 0; border-radius: 8px; padding: 12px 18px; font-size: 15px; cursor: pointer; }
  .printbar p { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 8px 10px; font-size: 12px; max-width: 270px; margin-top: 8px; }
  @media print { .printbar { display: none; } }`;
}

/**
 * Builds the digital-export table of contents.
 *
 * @param selChapters The selected chapters.
 * @param project The book project.
 * @param S The localized in-book strings.
 * @returns The TOC HTML.
 */
function digitalToc(
  selChapters: { title: string }[],
  project: BookProject,
  S: BookStrings,
): string {
  const isRoman = project.bookType === 'roman';
  const ex = project.extras;
  const withEx = project.digital.withExtras;
  const rows: string[] = [];
  if (withEx && ex.einleitung?.trim()) rows.push(isRoman ? S.prolog : S.intro);
  selChapters.forEach((ch) => rows.push(ch.title));
  if (withEx && ex.schlusswort?.trim())
    rows.push(isRoman ? S.afterword : S.closing);
  if (withEx && !isRoman && ex.bonus?.trim()) rows.push(S.bonus);
  const trows = rows.map((r) => `<div class="trow">${esc(r)}</div>`).join('');
  return `<div class="front toc"><h1>${S.contents}</h1>${trows}</div>`;
}

/**
 * Builds the print-ready digital-product HTML document.
 *
 * @param project The book project.
 * @returns The full HTML document.
 */
/** Resolves the digital-export context from the project. */
function digitalCtx(project: BookProject, f: { w: number; h: number }): DigCtx {
  const d = project.digital;
  return {
    accent: d.accent || '#6C57B8',
    fs: d.fontSize || 14,
    align: d.align === 'justify' ? 'justify' : 'left',
    family: FONT_FAMILIES[project.settings.font] ?? FONT_FAMILIES['garamond'],
    fw: f.w,
    fh: f.h,
    fontKey: project.settings.font,
  };
}

/** Renders the selected chapters. */
function digitalChapters(
  selChapters: { title: string; content: string }[],
  S: BookStrings,
): string {
  return selChapters
    .map(
      (ch, i) =>
        `<section class="chapter"><div class="ch-num">${S.chapter} ${i + 1}</div><h1>${esc(ch.title)}</h1>${blocksToHtml(parseBlocks(ch.content))}</section>`,
    )
    .join('');
}

/**
 * Builds the digital body (print bar, cover, TOC, scaffold and chapters).
 *
 * @param project The book project.
 * @param S The localized in-book strings.
 * @param selChapters The selected chapters.
 * @param chapters The pre-rendered chapters HTML.
 * @returns The body HTML.
 */
function digitalBody(
  project: BookProject,
  S: BookStrings,
  selChapters: { title: string }[],
  chapters: string,
): string {
  const d = project.digital;
  const isRoman = project.bookType === 'roman';
  const ex = project.extras;
  const cover = `<div class="coverpage"><div class="tt">${esc(project.title || 'Ohne Titel')}</div><div class="st">${esc(project.subtitle || '')}</div><div class="au">${esc(project.author || '')}</div><div class="imprint">© ${new Date().getFullYear()} ${esc(project.author || '')} · ${S.publisher}</div></div>`;
  const bar = `<div class="printbar"><button onclick="window.print()">Als PDF speichern</button><p>Druckdialog: Ziel „Als PDF speichern", „Hintergrundgrafiken" AN, „Kopf- und Fußzeilen" AUS (unter „Weitere Einstellungen").</p></div>`;
  const intro = d.withExtras
    ? extraSection(isRoman ? S.prolog : S.intro, ex.einleitung)
    : '';
  const closing = d.withExtras
    ? extraSection(isRoman ? S.afterword : S.closing, ex.schlusswort)
    : '';
  const bonus = d.withExtras && !isRoman ? extraSection(S.bonus, ex.bonus) : '';
  return `${bar}${cover}${digitalToc(selChapters, project, S)}${intro}${chapters}${closing}${bonus}`;
}

/**
 * Builds the print-ready digital-product HTML document.
 *
 * @param project The book project.
 * @returns The full HTML document.
 */
export function buildDigitalHtml(project: BookProject): string {
  const f = DIGITAL_FORMATS[project.digital.format] ?? DIGITAL_FORMATS['phone'];
  const S = bookStrings(project.language);
  const c = digitalCtx(project, f);
  const selChapters = project.outline.filter(
    (ch) => project.digital.sel[ch.id] !== false,
  );
  const chapters = digitalChapters(selChapters, S);
  const css = `${cssDigBase(c)}\n${cssDigElements(c)}\n${cssDigLayout(c)}`;
  const body = digitalBody(project, S, selChapters, chapters);
  return `<!DOCTYPE html><html lang="${project.language || 'de'}"><head><meta charset="utf-8"><title>${esc(project.title)} — Digital</title><style>${css}</style></head><body>${body}</body></html>`;
}
