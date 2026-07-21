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
  Copy,
  Download,
  LucideAngularModule,
  Palette,
  Printer,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-angular';
import type { CoverSpec } from '../../core/models/book-project';
import { ActiveProjectService } from '../active-project.service';
import { computeRailStats } from '../project-stats';
import { TRIM_DIMS } from './writing-utils';
import {
  PAPERS,
  coverDimensions,
  spineTextPossible,
  spineWidthMm,
} from './cover-metrics';
import { buildCoverHtml } from './cover-html';
import { downloadTextFile, openHtmlInNewTab } from './browser-open';

// Step 5 (Cover), ported 1:1 from the Legacy V3 reference: KDP dimension maths
// (spine + cover size), blurb + Canva briefing + Higgsfield cover-image cards,
// and the print-ready cover template (final / with guides / download). Metrics,
// colours, blurb and the template are local + persisted; all AI/Higgsfield
// actions are disabled with "Integration nicht konfiguriert" (no fakes).

const COPIED_MS = 1500;

/** Cover step: KDP cover metrics, blurb/briefing and the print template. */
@Component({
  selector: 'app-cover-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './cover-step.html',
})
export class CoverStepComponent {
  private readonly active = inject(ActiveProjectService);

  protected readonly providerReady = false;
  protected readonly copied = signal('');
  protected readonly notice = signal('');
  protected readonly paperOptions = Object.entries(PAPERS).map(([key, v]) => ({
    key,
    label: v.label,
  }));

  protected readonly project = this.active.current;
  protected readonly cover = computed<CoverSpec | null>(
    () => this.active.current()?.cover ?? null,
  );
  protected readonly hasConcept = computed(
    () => (this.active.current()?.title ?? '').trim().length > 0,
  );
  protected readonly pageEstimate = computed(() => {
    const p = this.active.current();
    return p ? computeRailStats(p).pages : 0;
  });
  protected readonly spine = computed(() => {
    const c = this.cover();
    return spineWidthMm(
      c?.pageCount ?? 0,
      c?.paper ?? 'cream',
      this.pageEstimate(),
    );
  });
  protected readonly dimsLabel = computed(() => this.buildDimsLabel());
  protected readonly spinePossible = computed(() =>
    spineTextPossible(this.spine().pages),
  );
  protected readonly briefLines = computed(() =>
    (this.cover()?.brief ?? '').split('\n').filter((line) => line.trim()),
  );

  protected readonly paletteIcon = Palette;
  protected readonly sparklesIcon = Sparkles;
  protected readonly wandIcon = Wand2;
  protected readonly copyIcon = Copy;
  protected readonly checkIcon = Check;
  protected readonly trashIcon = Trash2;
  protected readonly printerIcon = Printer;
  protected readonly downloadIcon = Download;
  protected readonly chevronIcon = ChevronRight;

  /** Builds the "W × H mm" cover-size label (1 decimal, Legacy parity). */
  private buildDimsLabel(): string {
    const trim = TRIM_DIMS[this.active.current()?.settings.trim ?? '7x10'];
    const dims = coverDimensions(trim.w, trim.h, this.spine().mm);
    return `${round1(dims.widthMm)} × ${round1(dims.heightMm)}`;
  }

  /**
   * Persists a change to the cover spec.
   *
   * @param patch The changed cover fields.
   */
  protected saveCover(patch: Partial<CoverSpec>): void {
    const cover = this.cover();
    if (!cover) return;
    this.active.patch({ cover: { ...cover, ...patch } });
  }

  /**
   * Persists the final page count (0 falls back to the estimate).
   *
   * @param value The entered page count.
   */
  protected onPageCount(value: string): void {
    this.saveCover({ pageCount: parseInt(value, 10) || 0 });
  }

  /**
   * Copies text to the clipboard and shows brief feedback.
   *
   * @param key The copy-target key (for the feedback icon).
   * @param text The text to copy.
   */
  protected copyText(key: string, text: string): void {
    void navigator.clipboard?.writeText(text);
    this.copied.set(key);
    setTimeout(() => this.copied.set(''), COPIED_MS);
  }

  /**
   * Opens the print-ready cover template in a new tab.
   *
   * @param withGuides Whether to overlay cut/spine guide lines.
   */
  protected openCover(withGuides: boolean): void {
    const project = this.active.current();
    if (!project) return;
    const name = withGuides ? 'cover-hilfslinien.html' : 'cover-final.html';
    const html = buildCoverHtml(project, this.pageEstimate(), withGuides);
    const opened = openHtmlInNewTab(html, name);
    this.notice.set(
      opened
        ? ''
        : 'Popup blockiert — die Datei wurde heruntergeladen. Öffne sie im Browser und speichere sie über Strg/Cmd+P als PDF.',
    );
  }

  /** Downloads the final cover template as an HTML file. */
  protected downloadCover(): void {
    const project = this.active.current();
    if (!project) return;
    const html = buildCoverHtml(project, this.pageEstimate(), false);
    downloadTextFile('cover-final.html', html, 'text/html');
  }

  /** Advances to the export step. */
  protected next(): void {
    this.active.patch({ currentStep: 5 });
  }
}

/**
 * Rounds a value to one decimal place (returns a number).
 *
 * @param value The value to round.
 * @returns The rounded value.
 */
function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
