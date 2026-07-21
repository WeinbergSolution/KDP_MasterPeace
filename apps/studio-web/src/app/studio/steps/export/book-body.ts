// Print-interior + e-book HTML builders (ported 1:1 from Legacy V3): title page,
// copyright + language/book-type disclaimer, table of contents, scaffold and
// chapters, using the Step-4 formatting (trim, gutter, font, size, line height,
// alignment, hyphenation) with mirrored margins and avoid-break rules.

import type {
  BookProject,
  FormatSettings,
} from '../../../core/models/book-project';
import { FONT_FAMILIES, TRIM_DIMS } from '../writing-utils';
import { GUTTERS } from '../format-utils';
import { type BookStrings, bookStrings } from './book-strings';
import { esc, parseBlocks } from './block-parse';
import { blocksToHtml } from './blocks-html';
import { fontImport } from './fonts';

/** Returns the gutter (inner margin) in mm for a page-count band. */
function gutterMm(pagesKey: string): number {
  return GUTTERS.find((g) => g.key === pagesKey)?.mm ?? 16.5;
}

/** Base reset + body typography. */
function cssBase(s: FormatSettings): string {
  const family = FONT_FAMILIES[s.font] ?? FONT_FAMILIES['garamond'];
  return `${fontImport(s.font)}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: ${family}; font-size: ${s.fontSize}pt; line-height: ${s.lineHeight}; color: #1d1a24; }`;
}

/** Print-only page size, mirrored margins and page-break rules. */
function cssPageRules(s: FormatSettings): string {
  const trim = TRIM_DIMS[s.trim] ?? TRIM_DIMS['7x10'];
  const g = gutterMm(s.pages);
  return `@page { size: ${trim.w}mm ${trim.h}mm; margin: 19mm ${g}mm 20mm ${g}mm; }
  @page :right { margin-left: ${g}mm; margin-right: 15mm; }
  @page :left { margin-left: 15mm; margin-right: ${g}mm; }
  .chapter, .front { page-break-before: always; }
  .titlepage { page-break-before: avoid; }
  h2, h3 { page-break-after: avoid; }
  .ebox, .wlines, .skala, .grp { page-break-inside: avoid; }`;
}

/** Heading + paragraph + quote typography. */
function cssType(s: FormatSettings): string {
  const family = FONT_FAMILIES[s.font] ?? FONT_FAMILIES['garamond'];
  const align = s.align === 'left' ? 'left' : 'justify';
  const f = s.fontSize;
  return `h1 { font-family: 'Fraunces', ${family}; font-size: ${f * 2}pt; font-weight: 700; margin: 0 0 ${f * 1.6}pt; line-height: 1.15; }
  h2 { font-family: 'Fraunces', ${family}; font-size: ${f * 1.35}pt; font-weight: 700; margin: ${f * 1.5}pt 0 ${f * 0.6}pt; }
  h3 { font-size: ${f * 1.1}pt; font-weight: 600; margin: ${f * 1.1}pt 0 ${f * 0.4}pt; }
  p { margin: 0 0 ${f * 0.65}pt; text-align: ${align}; hyphens: auto; -webkit-hyphens: auto; word-spacing: normal; }
  blockquote { margin: ${f}pt ${f * 1.5}pt; font-style: italic; text-align: center; }`;
}

/** Workbook element styling (lists, checkboxes, lines, scale, boxes). */
function cssBlocks(s: FormatSettings): string {
  const f = s.fontSize;
  return `.li { display: flex; gap: 7pt; margin: 0 0 4pt 8pt; } .dot { width: 4pt; height: 4pt; border-radius: 50%; background: #1d1a24; margin-top: ${f * 0.55}pt; flex: none; }
  .chk { display: flex; gap: 8pt; margin: 0 0 7pt 4pt; align-items: flex-start; }
  .box { width: 11pt; height: 11pt; border: 1.2pt solid #1d1a24; border-radius: 2.5pt; margin-top: 2pt; flex: none; }
  .wlines { margin: 8pt 0 12pt; } .wline { border-bottom: 0.8pt solid #9a93ad; height: 24pt; }
  .skala { margin: 8pt 0 12pt; } .skrow { display: flex; gap: 6pt; margin-top: 6pt; }
  .skrow span { width: 20pt; height: 20pt; border: 1pt solid #1d1a24; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: ${f * 0.8}pt; }
  .ebox { border: 1.1pt solid #1d1a24; border-radius: 6pt; padding: 12pt 14pt; margin: 12pt 0 14pt; } .ebox.tipp { border-style: dashed; }
  .elabel { font-family: 'Fraunces', serif; font-weight: 700; font-size: ${f * 0.85}pt; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6pt; }
  .ch-num { font-size: ${f * 0.85}pt; letter-spacing: 0.25em; text-transform: uppercase; margin-bottom: 10pt; }`;
}

/** Title page, copyright and table-of-contents styling. */
function cssFront(s: FormatSettings): string {
  const f = s.fontSize;
  return `.titlepage { text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 85vh; }
  .titlepage .tt { font-family: 'Fraunces', serif; font-size: ${f * 2.6}pt; font-weight: 700; line-height: 1.15; margin-bottom: 14pt; }
  .titlepage .st { font-size: ${f * 1.2}pt; font-style: italic; margin-bottom: 40pt; }
  .titlepage .au { font-size: ${f * 1.1}pt; letter-spacing: 0.15em; text-transform: uppercase; }
  .copyright { font-size: ${f * 0.8}pt; display: flex; flex-direction: column; justify-content: flex-end; min-height: 80vh; } .copyright p { text-align: left; margin-bottom: 6pt; }
  .toc h1 { margin-bottom: ${f * 2}pt; } .toc .trow { display: flex; justify-content: space-between; border-bottom: 0.6pt dotted #9a93ad; padding: 6pt 0; }`;
}

/**
 * Builds the full interior stylesheet.
 *
 * @param project The book project.
 * @param forPrint Whether to include print page/break rules.
 * @returns The CSS string.
 */
export function bookCss(project: BookProject, forPrint: boolean): string {
  const s = project.settings;
  const parts = [
    cssBase(s),
    forPrint ? cssPageRules(s) : '',
    cssType(s),
    cssBlocks(s),
    cssFront(s),
  ];
  return parts.join('\n');
}

/**
 * Builds a scaffold section (empty string when the content is blank).
 *
 * @param title The section title.
 * @param content The section markup.
 * @returns The section HTML.
 */
export function extraSection(title: string, content: string): string {
  if (!content || !content.trim()) return '';
  return `<section class="chapter"><h1>${esc(title)}</h1>${blocksToHtml(parseBlocks(content))}</section>`;
}

/**
 * Builds the title page + copyright/disclaimer front matter.
 *
 * @param project The book project.
 * @param S The localized in-book strings.
 * @returns The front-matter HTML.
 */
function buildFront(project: BookProject, S: BookStrings): string {
  const year = new Date().getFullYear();
  const isRoman = project.bookType === 'roman';
  const disclaimer = isRoman ? S.disclaimerFiction : S.disclaimerSelfhelp;
  return `<div class="titlepage"><div class="tt">${esc(project.title || 'Ohne Titel')}</div><div class="st">${esc(project.subtitle || '')}</div><div class="au">${esc(project.author || '')}</div></div>
  <div class="front copyright"><p>${S.rights(year, esc(project.author || ''))}</p><p>${S.copy}</p><p>${disclaimer}</p><p>${S.publisher}</p></div>`;
}

/**
 * Builds the table-of-contents front-matter section.
 *
 * @param project The book project.
 * @param S The localized in-book strings.
 * @returns The TOC HTML.
 */
function buildToc(project: BookProject, S: BookStrings): string {
  const isRoman = project.bookType === 'roman';
  const ex = project.extras;
  const rows: string[] = [];
  if (ex.einleitung?.trim()) rows.push(isRoman ? S.prolog : S.intro);
  if (!isRoman && ex.arbeitsweise?.trim()) rows.push(S.howto);
  project.outline.forEach((ch, i) =>
    rows.push(`${S.chapter} ${i + 1} — ${ch.title}`),
  );
  if (ex.schlusswort?.trim()) rows.push(isRoman ? S.afterword : S.closing);
  if (ex.autorin?.trim()) rows.push(S.about);
  if (!isRoman && ex.bonus?.trim()) rows.push(S.bonus);
  const trows = rows
    .map((r) => `<div class="trow"><span>${esc(r)}</span></div>`)
    .join('');
  return `<div class="front toc"><h1>${S.contents}</h1>${trows}</div>`;
}

/**
 * Builds the chapter sections.
 *
 * @param project The book project.
 * @param S The localized in-book strings.
 * @returns The chapters HTML.
 */
function buildChapters(project: BookProject, S: BookStrings): string {
  return project.outline
    .map(
      (ch, i) =>
        `<section class="chapter"><div class="ch-num">${S.chapter} ${i + 1}</div><h1>${esc(ch.title)}</h1>${blocksToHtml(parseBlocks(ch.content))}</section>`,
    )
    .join('');
}

/**
 * Builds the complete book body (front matter, TOC, scaffold, chapters).
 *
 * @param project The book project.
 * @returns The body HTML.
 */
export function buildBookBody(project: BookProject): string {
  const S = bookStrings(project.language);
  const isRoman = project.bookType === 'roman';
  const ex = project.extras;
  const intro = extraSection(isRoman ? S.prolog : S.intro, ex.einleitung);
  const howto = isRoman ? '' : extraSection(S.howto, ex.arbeitsweise);
  const closing = extraSection(
    isRoman ? S.afterword : S.closing,
    ex.schlusswort,
  );
  const bonus = isRoman ? '' : extraSection(S.bonus, ex.bonus);
  return `${buildFront(project, S)}${buildToc(project, S)}${intro}${howto}${buildChapters(project, S)}${closing}${extraSection(S.about, ex.autorin)}${bonus}`;
}

/**
 * Builds the print-ready interior HTML document.
 *
 * @param project The book project.
 * @returns The full HTML document.
 */
export function buildPrintHtml(project: BookProject): string {
  const bar = `<div class="printbar"><button onclick="window.print()">Als PDF speichern (Drucken)</button><p>Im Druckdialog: Ziel „Als PDF speichern", Ränder „Standard", „Hintergrundgrafiken" AN — und unter „Weitere Einstellungen" den Haken bei „Kopf- und Fußzeilen" ENTFERNEN (sonst druckt der Browser Dateipfad/Datum auf jede Seite). Papierformat wird automatisch gesetzt.</p></div>`;
  const css = `${bookCss(project, true)}
  .printbar { position: fixed; top: 12px; right: 12px; z-index: 99; font-family: sans-serif; }
  .printbar button { background: #6c57b8; color: #fff; border: 0; border-radius: 8px; padding: 12px 18px; font-size: 15px; cursor: pointer; }
  .printbar p { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 8px 10px; font-size: 12px; max-width: 260px; margin-top: 8px; }
  @media print { .printbar { display: none; } }`;
  return `<!DOCTYPE html><html lang="${project.language || 'de'}"><head><meta charset="utf-8"><title>${esc(project.title)} — Print-Interior</title><style>${css}</style></head><body>${bar}${buildBookBody(project)}</body></html>`;
}

/**
 * Builds the e-book HTML document (also used for the Word .doc export).
 *
 * @param project The book project.
 * @returns The full HTML document.
 */
export function buildEbookHtml(project: BookProject): string {
  const css = `${bookCss(project, false)}
  body { max-width: 640px; margin: 0 auto; padding: 24px; }
  .chapter { margin-top: 60px; }`;
  return `<!DOCTYPE html><html lang="${project.language || 'de'}"><head><meta charset="utf-8"><title>${esc(project.title)}</title><style>${css}</style></head><body>${buildBookBody(project)}</body></html>`;
}
