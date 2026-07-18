import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  Check,
  ChevronRight,
  Download,
  Feather,
  FileText,
  LucideAngularModule,
  Mic,
  PenLine,
  Printer,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Upload,
  Users,
} from 'lucide-angular';
import type {
  BookProject,
  Chapter,
  DigitalSpec,
  Extras,
} from '../../core/models/book-project';
import { normalizeProject } from '../../core/models/book-project';
import { ActiveProjectService } from '../active-project.service';
import { TRIM_LABELS } from './writing-utils';
import {
  downloadBlobFile,
  downloadTextFile,
  openHtmlInNewTab,
} from './browser-open';
import {
  auditRows,
  cleanText,
  missingExtras,
  readabilityRows,
} from './export/export-audit';
import { buildPrintHtml, buildEbookHtml } from './export/book-body';
import { buildEpub } from './export/epub';
import { DIGITAL_FORMATS, buildDigitalHtml } from './export/digital-html';
import { buildAudioScript } from './export/audio-script';
import {
  type Exercise,
  buildPrintableHtml,
  collectExercises,
} from './export/printable-html';
import { buildBackupJson, parseBackup } from './export/backup';

// Step 6 (Export), ported 1:1 from the Legacy V3 reference: quality check +
// readability + beta panel, paperback interior, e-book (EPUB/HTML/Word), digital
// product, audiobook script, printable generator, project backup and the KDP
// checklist. All generators are local + real (open/download); AI actions are
// disabled with "Integration nicht konfiguriert" (no fakes).

const POPUP_NOTE =
  'Popup blockiert — die Datei wurde heruntergeladen. Öffne sie im Browser und speichere sie über Strg/Cmd+P als PDF.';

/** Export step: quality checks + all KDP export artifacts. */
@Component({
  selector: 'app-export-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './export-step.html',
})
export class ExportStepComponent {
  private readonly active = inject(ActiveProjectService);

  protected readonly providerReady = false;
  protected readonly notice = signal('');
  protected readonly restore = signal<{
    outline: Chapter[];
    extras: Extras;
  } | null>(null);

  protected readonly project = this.active.current;
  protected readonly digitalFormats = Object.entries(DIGITAL_FORMATS).map(
    ([key, v]) => ({
      key,
      label: v.label,
    }),
  );

  protected readonly hasOutline = computed(
    () => (this.active.current()?.outline.length ?? 0) > 0,
  );
  protected readonly isWb = computed(
    () => this.active.current()?.bookType === 'workbook',
  );
  protected readonly rows = computed(() => {
    const p = this.active.current();
    return p ? auditRows(p) : [];
  });
  protected readonly missing = computed(() => {
    const p = this.active.current();
    return p ? missingExtras(p) : [];
  });
  protected readonly readability = computed(() => {
    const p = this.active.current();
    return p ? readabilityRows(p) : [];
  });
  protected readonly exercises = computed<Exercise[]>(() => {
    const p = this.active.current();
    return p ? collectExercises(p) : [];
  });
  protected readonly showPrintable = computed(
    () => this.isWb() && this.exercises().length > 0,
  );
  protected readonly digital = computed<DigitalSpec | null>(
    () => this.active.current()?.digital ?? null,
  );
  protected readonly trimLabel = computed(() =>
    (TRIM_LABELS[this.active.current()?.settings.trim ?? '7x10'] ?? '')
      .split('(')[0]
      .trim(),
  );

  protected readonly shieldIcon = ShieldCheck;
  protected readonly sparklesIcon = Sparkles;
  protected readonly checkIcon = Check;
  protected readonly penIcon = PenLine;
  protected readonly featherIcon = Feather;
  protected readonly usersIcon = Users;
  protected readonly printerIcon = Printer;
  protected readonly fileIcon = FileText;
  protected readonly smartphoneIcon = Smartphone;
  protected readonly micIcon = Mic;
  protected readonly saveIcon = Save;
  protected readonly downloadIcon = Download;
  protected readonly uploadIcon = Upload;
  protected readonly chevronIcon = ChevronRight;

  /**
   * Builds a filename slug from the book title.
   *
   * @param fallback The fallback base name.
   * @returns The slugified name.
   */
  private slug(fallback: string): string {
    return (this.active.current()?.title || fallback).replace(/\s+/g, '-');
  }

  /**
   * Opens generated HTML in a new tab, noting a blocked popup.
   *
   * @param html The HTML document.
   * @param name The fallback download name.
   */
  private openArtifact(html: string, name: string): void {
    this.notice.set(openHtmlInNewTab(html, name) ? '' : POPUP_NOTE);
  }

  /** Applies the local typography cleanup (with a recoverable snapshot). */
  protected applyTypography(): void {
    const p = this.active.current();
    if (!p) return;
    this.restore.set({ outline: p.outline, extras: p.extras });
    const outline = p.outline.map((c) => ({
      ...c,
      content: cleanText(c.content, p.language),
    }));
    const extras = Object.fromEntries(
      Object.entries(p.extras).map(([k, v]) => [k, cleanText(v, p.language)]),
    ) as unknown as Extras;
    this.active.patch({ outline, extras });
    this.notice.set(
      'Typografie bereinigt: Abstände, Satzzeichen, Anführungszeichen und Gedankenstriche vereinheitlicht. Markup blieb erhalten.',
    );
  }

  /** Reverts the last typography cleanup from the snapshot. */
  protected undoTypography(): void {
    const snap = this.restore();
    if (!snap) return;
    this.active.patch({ outline: snap.outline, extras: snap.extras });
    this.restore.set(null);
    this.notice.set('Typografie-Bereinigung rückgängig gemacht.');
  }

  /** Opens the print interior in a new tab. */
  protected openPrint(): void {
    const p = this.active.current();
    if (p)
      this.openArtifact(buildPrintHtml(p), `${this.slug('buch')}-print.html`);
  }

  /** Downloads the print interior as an HTML file. */
  protected downloadPrint(): void {
    const p = this.active.current();
    if (p)
      downloadTextFile(
        `${this.slug('buch')}-print.html`,
        buildPrintHtml(p),
        'text/html',
      );
  }

  /** Downloads the real EPUB-3 archive. */
  protected downloadEpub(): void {
    const p = this.active.current();
    if (p) downloadBlobFile(`${this.slug('ebook')}.epub`, buildEpub(p));
  }

  /** Downloads the e-book HTML. */
  protected downloadHtml(): void {
    const p = this.active.current();
    if (p)
      downloadTextFile(
        `${this.slug('ebook')}.html`,
        buildEbookHtml(p),
        'text/html',
      );
  }

  /** Downloads the e-book as a Word document. */
  protected downloadWord(): void {
    const p = this.active.current();
    if (p)
      downloadTextFile(
        `${this.slug('buch')}.doc`,
        buildEbookHtml(p),
        'application/msword',
      );
  }

  /** Opens the digital-product PDF in a new tab. */
  protected openDigital(): void {
    const p = this.active.current();
    if (p)
      this.openArtifact(
        buildDigitalHtml(p),
        `${this.slug('digital')}-digital.html`,
      );
  }

  /** Downloads the digital-product HTML. */
  protected downloadDigital(): void {
    const p = this.active.current();
    if (p)
      downloadTextFile(
        `${this.slug('digital')}-digital.html`,
        buildDigitalHtml(p),
        'text/html',
      );
  }

  /** Downloads the audiobook script (.txt). */
  protected downloadAudio(): void {
    const p = this.active.current();
    if (p)
      downloadTextFile(
        `${this.slug('buch')}-hoerbuch-skript.txt`,
        buildAudioScript(p),
        'text/plain',
      );
  }

  /**
   * Opens a single-exercise printable worksheet.
   *
   * @param exercise The exercise to render.
   * @param index The exercise index (for the file name).
   */
  protected openPrintable(exercise: Exercise, index: number): void {
    const p = this.active.current();
    if (p)
      this.openArtifact(
        buildPrintableHtml(p, exercise),
        `uebung-${index + 1}.html`,
      );
  }

  /** Downloads a versioned project backup. */
  protected exportBackup(): void {
    const p = this.active.current();
    if (!p) return;
    const json = buildBackupJson(p, p.currentStep, p.activeChapter);
    downloadTextFile(
      `${this.slug('buchprojekt')}-backup.json`,
      json,
      'application/json',
    );
  }

  /**
   * Handles a backup file selection: validate, back up current, then import.
   *
   * @param event The file input change event.
   */
  protected async onBackupFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    const result = parseBackup(await file.text(), file.size);
    if (!result.ok || !result.project) {
      this.notice.set(result.error ?? 'Backup konnte nicht gelesen werden.');
      return;
    }
    this.exportBackup();
    this.applyImported(
      result.project,
      result.step ?? 0,
      result.activeChapter ?? 0,
    );
  }

  /**
   * Applies an imported project over the active one (normalized + persisted).
   *
   * @param raw The imported project record.
   * @param step The imported workflow step.
   * @param activeChapter The imported active chapter index.
   */
  private applyImported(
    raw: Record<string, unknown>,
    step: number,
    activeChapter: number,
  ): void {
    const current = this.active.current();
    if (!current) return;
    const merged = normalizeProject(current.id, {
      ...raw,
      ownerId: current.ownerId,
    });
    const fields: Record<string, unknown> = {
      ...merged,
      currentStep: step,
      activeChapter,
    };
    for (const key of ['id', 'ownerId', 'createdAt']) delete fields[key];
    this.active.patch(fields as Partial<BookProject>);
    this.notice.set(
      'Backup eingespielt — dein vorheriges Projekt wurde vorher als Datei gesichert.',
    );
  }

  /**
   * Persists a digital-product setting change.
   *
   * @param patch The changed digital fields.
   */
  protected saveDigital(patch: Partial<DigitalSpec>): void {
    const digital = this.digital();
    if (digital) this.active.patch({ digital: { ...digital, ...patch } });
  }

  /**
   * Reports whether a chapter is selected for the digital product.
   *
   * @param id The chapter id.
   * @returns True when selected.
   */
  protected isDigitalOn(id: string): boolean {
    return this.digital()?.sel[id] !== false;
  }

  /**
   * Toggles a chapter's inclusion in the digital product.
   *
   * @param id The chapter id.
   */
  protected toggleDigitalCh(id: string): void {
    const digital = this.digital();
    if (!digital) return;
    const sel = {
      ...digital.sel,
      [id]: digital.sel[id] === false ? true : false,
    };
    this.saveDigital({ sel });
  }

  /** Advances to the KDP package step. */
  protected next(): void {
    this.active.patch({ currentStep: 6 });
  }

  /**
   * Tracks quality rows by index.
   *
   * @param index The row index.
   * @returns The row index.
   */
  protected trackRow(index: number): number {
    return index;
  }
}
