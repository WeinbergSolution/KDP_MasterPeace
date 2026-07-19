// Pre-Flight check rules for Step 8 (Veröffentlichen), ported 1:1 from the Legacy
// V3 reference. Each rule is a pure domain function testing what the tool can
// actually see; all KDP limits come from the central, versioned KDP_RULES. The
// tool cannot check the finished PDF itself — that is the binding KDP Previewer.

import type { BookProject } from '../../../core/models/book-project';
import { countWords } from '../../project-stats';
import { GUTTERS } from '../format-utils';
import { KDP_RULES } from './kdp-rules';

export type PreflightLevel = 'ok' | 'warn' | 'err';

/** A single preflight result row. */
export interface PreflightCheck {
  readonly level: PreflightLevel;
  readonly text: string;
}

/** The full preflight result with error/warning counts. */
export interface PreflightResult {
  readonly checks: PreflightCheck[];
  readonly errs: number;
  readonly warns: number;
}

type Add = (level: PreflightLevel, text: string) => void;
interface Ctx {
  binding: string;
  pages: number;
  estPages: number;
}

const PAGE_MISSING =
  'Finale Seitenzahl fehlt (im Cover-Schritt eintragen, sobald dein Print-PDF fertig ist). Bis dahin gilt die Schätzung.';

/**
 * Checks that a title (and subtitle) exist within the KDP length limit.
 *
 * @param project The active project.
 * @param add The result collector.
 */
function checkTitle(project: BookProject, add: Add): void {
  const len = (project.title || '').length + (project.subtitle || '').length;
  const max = KDP_RULES.maxTitleSubtitleChars;
  if (!project.title.trim()) add('err', 'Kein Titel eingetragen (Schritt 1).');
  else if (len > max)
    add(
      'warn',
      `Titel + Untertitel haben zusammen ${len} Zeichen — KDP erlaubt max. ${max}.`,
    );
  else add('ok', 'Titel & Untertitel vorhanden und innerhalb des KDP-Limits.');
}

/**
 * Checks that an author name is present (KDP rejects uploads without one).
 *
 * @param project The active project.
 * @param add The result collector.
 */
function checkAuthor(project: BookProject, add: Add): void {
  if (!project.author.trim())
    add(
      'err',
      'Kein Autorname eingetragen (Schritt 1) — ohne Autor lehnt KDP den Upload ab.',
    );
  else add('ok', 'Autorname vorhanden.');
}

/**
 * Checks that chapters exist and are not (near-)empty.
 *
 * @param project The active project.
 * @param add The result collector.
 */
function checkChapters(project: BookProject, add: Add): void {
  const empty = project.outline.filter(
    (ch) => countWords(ch.content) < KDP_RULES.emptyChapterWords,
  );
  const names = empty
    .slice(0, 3)
    .map((ch) => `„${ch.title}"`)
    .join(', ');
  if (!project.outline.length) add('err', 'Noch keine Kapitel vorhanden.');
  else if (empty.length)
    add(
      'warn',
      `${empty.length} Kapitel sind (fast) leer: ${names}${empty.length > 3 ? ' …' : ''}`,
    );
  else add('ok', `Alle ${project.outline.length} Kapitel haben Inhalt.`);
}

/**
 * Checks the page count against the KDP min/max for the chosen binding.
 *
 * @param project The active project.
 * @param ctx The derived binding/page context.
 * @param add The result collector.
 */
function checkPages(project: BookProject, ctx: Ctx, add: Add): void {
  const minP = KDP_RULES.minPages[ctx.binding] ?? 24;
  const maxP = KDP_RULES.maxPages[ctx.binding] ?? 828;
  const n = ctx.estPages;
  const lbl =
    ctx.binding === 'hardcover' ? 'Hardcover ist 75' : 'Taschenbücher ist 24';
  const minMsg = `${n} Seiten — KDP-Minimum für ${lbl} Seiten.`;
  const maxMsg = `${n} Seiten — KDP-Maximum für dieses Format ist ${maxP}.`;
  const okMsg = `Seitenzahl ${n} liegt im erlaubten Bereich (${minP}–${maxP}).`;
  if (!ctx.pages) add('warn', PAGE_MISSING);
  if ((n || 0) > 0 && n < minP) add('err', minMsg);
  else if ((n || 0) > maxP) add('err', maxMsg);
  else if (n) add('ok', okMsg);
}

/**
 * Checks that the gutter setting fits the actual final page count.
 *
 * @param project The active project.
 * @param ctx The derived binding/page context.
 * @param add The result collector.
 */
function checkGutter(project: BookProject, ctx: Ctx, add: Add): void {
  const g = GUTTERS.find((x) => x.key === project.settings.pages);
  if (!ctx.pages || !g) return;
  const [lo, hi] = project.settings.pages
    .split('-')
    .map((n) => parseInt(n, 10));
  if (ctx.pages < lo || ctx.pages > hi)
    add(
      'warn',
      `Bundsteg-Einstellung „${g.label}" passt nicht zu deinen ${ctx.pages} Seiten — in der Formatierung anpassen und Print-PDF neu erzeugen.`,
    );
  else add('ok', `Bundsteg (${g.mm} mm) passt zur Seitenzahl.`);
}

/**
 * Checks the KDP description presence and length limit.
 *
 * @param project The active project.
 * @param add The result collector.
 */
function checkDescription(project: BookProject, add: Add): void {
  const desc = (project.kdp && (project.kdp['beschreibung'] as string)) || '';
  const max = KDP_RULES.maxDescriptionChars;
  if (!desc)
    add(
      'warn',
      'Noch keine Buchbeschreibung — im Schritt „KDP-Paket" generieren.',
    );
  else if (desc.length > max)
    add(
      'warn',
      `Beschreibung hat ${desc.length} Zeichen — KDP erlaubt max. ${max}.`,
    );
  else add('ok', 'Buchbeschreibung vorhanden (unter 4000 Zeichen).');
}

/**
 * Checks the keywords presence and per-keyword length limit.
 *
 * @param project The active project.
 * @param add The result collector.
 */
function checkKeywords(project: BookProject, add: Add): void {
  const kws = (project.kdp && (project.kdp['keywords'] as string[])) || [];
  if (!kws.length) {
    add('warn', 'Noch keine Keywords — im Schritt „KDP-Paket" generieren.');
    return;
  }
  const tooLong = kws.filter((k) => k.length > KDP_RULES.maxKeywordChars);
  if (tooLong.length)
    add(
      'warn',
      `${tooLong.length} Keyword(s) über 50 Zeichen — KDP schneidet sie ab.`,
    );
  else
    add('ok', `${kws.length} Keywords vorhanden, alle innerhalb des Limits.`);
}

/**
 * Checks for the [DEIN-LINK] placeholder and a complete scaffold.
 *
 * @param project The active project.
 * @param missing The list of missing scaffold sections.
 * @param add The result collector.
 */
function checkLinkExtras(
  project: BookProject,
  missing: string[],
  add: Add,
): void {
  const allText =
    project.outline.map((ch) => ch.content).join('\n') +
    '\n' +
    Object.values(project.extras).join('\n');
  if (allText.includes('[DEIN-LINK]'))
    add(
      'warn',
      'Der Platzhalter [DEIN-LINK] steht noch im Text (Bonus-Seite) — vor dem Export durch deinen echten Link ersetzen oder die Bonus-Seite leeren.',
    );
  if (missing.length)
    add('warn', `Buchgerüst unvollständig: ${missing.join(', ')} (Schritt 3).`);
  else add('ok', 'Buchgerüst komplett (Einleitung, Schlusswort & Co.).');
}

/**
 * Checks that a back-cover blurb exists.
 *
 * @param project The active project.
 * @param add The result collector.
 */
function checkBlurb(project: BookProject, add: Add): void {
  if (!project.cover.blurb)
    add(
      'warn',
      'Kein Klappentext für die Buchrückseite — im Cover-Schritt generieren.',
    );
  else add('ok', 'Klappentext vorhanden.');
}

/**
 * Runs every preflight rule in reference order.
 *
 * @param project The active project.
 * @param ctx The derived binding/page context.
 * @param missing The list of missing scaffold sections.
 * @param add The result collector.
 */
function collectChecks(
  project: BookProject,
  ctx: Ctx,
  missing: string[],
  add: Add,
): void {
  checkTitle(project, add);
  checkAuthor(project, add);
  checkChapters(project, add);
  checkPages(project, ctx, add);
  checkGutter(project, ctx, add);
  checkDescription(project, add);
  checkKeywords(project, add);
  checkLinkExtras(project, missing, add);
  checkBlurb(project, add);
}

/**
 * Runs the full KDP pre-flight check for a project.
 *
 * @param project The active project.
 * @param statsPages The estimated page count from the word statistics.
 * @param missing The list of missing scaffold sections (from the export audit).
 * @returns The checks plus error/warning counts.
 */
export function runPreflight(
  project: BookProject,
  statsPages: number,
  missing: string[],
): PreflightResult {
  const pages = project.cover.pageCount || 0;
  const ctx: Ctx = {
    binding: project.pub.binding,
    pages,
    estPages: pages || statsPages,
  };
  const checks: PreflightCheck[] = [];
  const add: Add = (level, text) => checks.push({ level, text });
  collectChecks(project, ctx, missing, add);
  const errs = checks.filter((x) => x.level === 'err').length;
  const warns = checks.filter((x) => x.level === 'warn').length;
  return { checks, errs, warns };
}
