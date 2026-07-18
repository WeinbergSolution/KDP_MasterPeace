// Printable-generator (single exercises) builder (ported 1:1 from Legacy V3):
// turns each workbook exercise box into a branded A4 worksheet.

import type { BookProject } from '../../../core/models/book-project';
import { FONT_FAMILIES } from '../writing-utils';
import { type Block, esc, parseBlocks } from './block-parse';
import { blocksToHtml } from './blocks-html';
import { fontImport } from './fonts';

/** One collected exercise (title, source chapter, block). */
export interface Exercise {
  title: string;
  chapter: string;
  block: Block;
}

/**
 * Collects up to 20 exercise boxes from the project's chapters.
 *
 * @param project The book project.
 * @returns The collected exercises.
 */
export function collectExercises(project: BookProject): Exercise[] {
  const out: Exercise[] = [];
  project.outline.forEach((ch, ci) => {
    parseBlocks(ch.content).forEach((b) => {
      if (b.t === 'box' && b.kind !== 'tipp') {
        out.push({
          title: b.title || `Übung aus Kapitel ${ci + 1}`,
          chapter: ch.title,
          block: b,
        });
      }
    });
  });
  return out.slice(0, 20);
}

/** Printable head + body base styles. */
function printableCssHead(accent: string, fontKey: string): string {
  const family = FONT_FAMILIES[fontKey] ?? FONT_FAMILIES['garamond'];
  return `${fontImport(fontKey)}
  * { box-sizing: border-box; margin: 0; }
  @page { size: 210mm 297mm; margin: 0; }
  html, body { width: 210mm; min-height: 297mm; }
  body { font-family: ${family}; font-size: 13pt; line-height: 1.65; color: #26212F; padding: 18mm 17mm; }
  .head { border-bottom: 3pt solid ${accent}; padding-bottom: 8mm; margin-bottom: 10mm; }
  .kicker { font-size: 10pt; letter-spacing: 0.22em; text-transform: uppercase; color: ${accent}; margin-bottom: 4mm; }
  h1 { font-family: 'Fraunces', serif; font-size: 26pt; color: ${accent}; line-height: 1.15; }
  p { margin: 0 0 5mm; }`;
}

/** Printable exercise-element + footer styles. */
function printableCssBody(accent: string): string {
  return `.chk { display: flex; gap: 8pt; margin: 0 0 8pt 2pt; } .box { width: 13pt; height: 13pt; border: 1.5pt solid ${accent}; border-radius: 3pt; margin-top: 3pt; flex: none; }
  .li { display: flex; gap: 7pt; margin: 0 0 4pt 4pt; } .dot { width: 4pt; height: 4pt; border-radius: 50%; background: ${accent}; margin-top: 8pt; flex: none; }
  .wlines { margin: 6mm 0; } .wline { border-bottom: 1pt solid #B9B2CC; height: 11mm; }
  .skala { margin: 6mm 0; } .skrow { display: flex; gap: 3mm; margin-top: 3mm; }
  .skrow span { width: 9mm; height: 9mm; border: 1.3pt solid ${accent}; color: ${accent}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10pt; font-weight: 600; }
  .ebox, .elabel { border: 0; padding: 0; margin: 0; } .elabel { display: none; }
  h2, h3, blockquote { color: ${accent}; margin: 5mm 0 2mm; font-size: 14pt; }
  .foot { position: fixed; bottom: 12mm; left: 17mm; right: 17mm; border-top: 1pt solid #E0DCEA; padding-top: 3mm; font-size: 9pt; color: #8B84A0; display: flex; justify-content: space-between; }
  .printbar { position: fixed; top: 12px; right: 12px; font-family: sans-serif; }
  .printbar button { background: ${accent}; color: #fff; border: 0; border-radius: 8px; padding: 12px 18px; font-size: 15px; cursor: pointer; }
  @media print { .printbar { display: none; } }`;
}

/** Builds the printable worksheet stylesheet. */
function printableCss(accent: string, fontKey: string): string {
  return `${printableCssHead(accent, fontKey)}\n${printableCssBody(accent)}`;
}

/**
 * Builds a single-exercise printable A4 worksheet.
 *
 * @param project The book project.
 * @param exercise The exercise to render.
 * @returns The full HTML document.
 */
export function buildPrintableHtml(
  project: BookProject,
  exercise: Exercise,
): string {
  const accent = project.digital.accent || '#6C57B8';
  const css = printableCss(accent, project.settings.font);
  const bar = `<div class="printbar"><button onclick="window.print()">Als PDF speichern</button></div>`;
  const head = `<div class="head"><div class="kicker">${esc(project.title || '')}</div><h1>${esc(exercise.title)}</h1></div>`;
  const foot = `<div class="foot"><span>© ${new Date().getFullYear()} ${esc(project.author || '')}</span><span>${esc(project.subtitle || '')}</span></div>`;
  return `<!DOCTYPE html><html lang="${project.language || 'de'}"><head><meta charset="utf-8"><title>${esc(exercise.title)}</title><style>${css}</style></head><body>${bar}${head}${blocksToHtml(exercise.block.children ?? [])}${foot}</body></html>`;
}
