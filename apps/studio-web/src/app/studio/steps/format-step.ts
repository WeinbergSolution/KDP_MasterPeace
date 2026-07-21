import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ChevronRight, Lightbulb, LucideAngularModule } from 'lucide-angular';
import type { DocumentNode } from '@kdp/contracts';
import { parseMarkup } from '@kdp/document-model';
import { AstNodeComponent } from '@kdp/preview';
import type { FormatSettings } from '../../core/models/book-project';
import { ActiveProjectService } from '../active-project.service';
import { computeRailStats } from '../project-stats';
import { CHAPTER_WORD, TRIM_LABELS, previewPageStyle } from './writing-utils';
import {
  ALIGN_OPTIONS,
  FONT_OPTIONS,
  GUTTERS,
  SAMPLE_MARKUP,
  TRIM_OPTIONS,
} from './format-utils';

// Step 4 (Formatierung), ported 1:1 from the Legacy V3 reference: a two-column
// layout with the print settings (trim, gutter, font, alignment, size + line
// height sliders) on the left and the live WP-C1 book-page preview on the right.
// Every setting persists to Firestore and updates the preview immediately.

/** Formatting step: KDP print settings with a live preview page. */
@Component({
  selector: 'app-format-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, AstNodeComponent],
  templateUrl: './format-step.html',
})
export class FormatStepComponent {
  private readonly active = inject(ActiveProjectService);

  protected readonly project = this.active.current;
  protected readonly trimOptions = TRIM_OPTIONS;
  protected readonly gutterOptions = GUTTERS;
  protected readonly fontOptions = FONT_OPTIONS;
  protected readonly alignOptions = ALIGN_OPTIONS;
  protected readonly bulbIcon = Lightbulb;
  protected readonly chevronIcon = ChevronRight;

  protected readonly settings = computed<FormatSettings | null>(
    () => this.active.current()?.settings ?? null,
  );
  protected readonly pageEstimate = computed(() => {
    const p = this.active.current();
    return p ? computeRailStats(p).pages : 0;
  });
  protected readonly chapterWord = computed(
    () => CHAPTER_WORD[this.active.current()?.language ?? 'de'] ?? 'Kapitel',
  );
  protected readonly firstTitle = computed(
    () => this.active.current()?.outline[0]?.title || 'Dein erstes Kapitel',
  );
  protected readonly trimLabel = computed(() =>
    (TRIM_LABELS[this.active.current()?.settings.trim ?? '7x10'] ?? '')
      .split('(')[0]
      .trim(),
  );
  protected readonly previewStyle = computed(() => {
    const s = this.settings();
    return s ? previewPageStyle(s) : '';
  });
  protected readonly blocks = computed<DocumentNode[]>(() => {
    const markup = this.active.current()?.outline[0]?.content || SAMPLE_MARKUP;
    const language = this.active.current()?.language ?? 'de';
    return parseMarkup(markup, { language }).document?.root.children ?? [];
  });

  /**
   * Persists a change to a string print setting.
   *
   * @param key The settings key.
   * @param value The new value.
   */
  protected saveText(
    key: 'trim' | 'pages' | 'font' | 'align',
    value: string,
  ): void {
    const settings = this.settings();
    if (!settings) return;
    this.active.patch({ settings: { ...settings, [key]: value } });
  }

  /**
   * Persists a change to a numeric slider setting.
   *
   * @param key The settings key.
   * @param value The new value (parsed to a float).
   */
  protected saveNumber(key: 'fontSize' | 'lineHeight', value: string): void {
    const settings = this.settings();
    if (!settings) return;
    this.active.patch({ settings: { ...settings, [key]: parseFloat(value) } });
  }

  /** Advances to the cover step. */
  protected next(): void {
    this.active.patch({ currentStep: 4 });
  }

  /**
   * Tracks AST blocks by index for the preview loop.
   *
   * @param index The block index.
   * @returns The block index.
   */
  protected trackBlock(index: number): number {
    return index;
  }
}
