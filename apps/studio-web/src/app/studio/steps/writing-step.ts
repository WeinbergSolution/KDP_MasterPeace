import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  Check,
  ChevronRight,
  Languages,
  LucideAngularModule,
  PenLine,
  Plus,
  RefreshCw,
  Sparkles,
  Square,
  Wand2,
} from 'lucide-angular';
import type { DocumentNode } from '@kdp/contracts';
import { parseMarkup, type LegacyParseResult } from '@kdp/document-model';
import { AstNodeComponent } from '@kdp/preview';
import {
  LANG_LABELS,
  type BookLanguage,
  type Extras,
} from '../../core/models/book-project';
import { ActiveProjectService } from '../active-project.service';
import { countWords } from '../project-stats';
import {
  CHAPTER_WORD,
  FONT_FAMILIES,
  TRIM_DIMS,
  TRIM_LABELS,
  WORD_TARGETS,
  extrasFor,
  type ExtraDef,
} from './writing-utils';

// Step 3 (Schreiben), ported 1:1 from the Legacy V3 reference: autopilot card,
// translate card, chapter tabs, per-chapter editor with the live WP-C1 preview
// (parseMarkup -> Book AST -> AstNodeComponent) and the book scaffold. Manual
// editing + preview + word count + Firestore autosave are local and functional;
// all AI actions are disabled with "Integration nicht konfiguriert" (no fakes).

const PARSE_DEBOUNCE_MS = 300;

/** Writing step: chapter editor, live WP-C1 preview and book scaffold. */
@Component({
  selector: 'app-writing-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, AstNodeComponent],
  templateUrl: './writing-step.html',
})
export class WritingStepComponent {
  private readonly active = inject(ActiveProjectService);
  private readonly editorRef =
    viewChild<ElementRef<HTMLTextAreaElement>>('editor');
  private loadedKey: string | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly providerReady = false;
  // Autopilot run state (message + percent). Only a server-side autopilot run
  // sets this; with no provider it stays null, so the progress banner is ported
  // but never shows a fabricated run.
  protected readonly auto = signal<{ msg: string; pct: number } | null>(null);
  protected readonly transTarget = signal('');
  protected readonly content = signal('');
  private readonly result = signal<LegacyParseResult>(
    parseMarkup('', { language: 'de' }),
  );

  protected readonly project = this.active.current;
  protected readonly wordTargets = WORD_TARGETS;

  protected readonly hasOutline = computed(
    () => (this.active.current()?.outline.length ?? 0) > 0,
  );
  protected readonly activeIndex = computed(() => this.clampIndex());
  protected readonly activeChapter = computed(
    () => this.active.current()?.outline[this.activeIndex()] ?? null,
  );
  protected readonly scaffold = computed<readonly ExtraDef[]>(() =>
    extrasFor(this.active.current()?.bookType ?? 'workbook'),
  );
  protected readonly langOptions = computed(() => this.buildLangOptions());
  protected readonly chapterWord = computed(
    () => CHAPTER_WORD[this.active.current()?.language ?? 'de'] ?? 'Kapitel',
  );
  protected readonly trimLabel = computed(() =>
    (TRIM_LABELS[this.active.current()?.settings.trim ?? '7x10'] ?? '')
      .split('(')[0]
      .trim(),
  );
  protected readonly previewStyle = computed(() => this.buildPreviewStyle());
  protected readonly wordCount = computed(() => countWords(this.content()));
  protected readonly blocks = computed<DocumentNode[]>(
    () => this.result().document?.root.children ?? [],
  );

  protected readonly wandIcon = Wand2;
  protected readonly langIcon = Languages;
  protected readonly squareIcon = Square;
  protected readonly checkIcon = Check;
  protected readonly penIcon = PenLine;
  protected readonly plusIcon = Plus;
  protected readonly sparklesIcon = Sparkles;
  protected readonly refreshIcon = RefreshCw;
  protected readonly chevronIcon = ChevronRight;

  constructor() {
    effect(() => this.syncFromProject());
  }

  /** Clamps the persisted active-chapter index into the outline range. */
  private clampIndex(): number {
    const project = this.active.current();
    const last = (project?.outline.length ?? 1) - 1;
    return Math.max(0, Math.min(last, project?.activeChapter ?? 0));
  }

  /** Loads the active chapter into the editor when project or chapter changes. */
  private syncFromProject(): void {
    const project = this.active.current();
    const editor = this.editorRef();
    if (!project || !editor) return;
    if (!this.transTarget())
      this.transTarget.set(this.firstOtherLang(project.language));
    const key = `${project.id}#${this.activeIndex()}`;
    if (key === this.loadedKey) return;
    this.loadedKey = key;
    const markup = project.outline[this.activeIndex()]?.content ?? '';
    editor.nativeElement.value = markup;
    this.content.set(markup);
    this.reparse(markup);
  }

  /**
   * Parses markup into the Book AST for the current book language.
   *
   * @param markup The markup to parse.
   */
  private reparse(markup: string): void {
    const language = this.active.current()?.language ?? 'de';
    this.result.set(parseMarkup(markup, { language }));
  }

  /**
   * Handles editor input: live word count, autosave and debounced re-parse.
   *
   * @param event The textarea input event.
   */
  protected onEditorInput(event: Event): void {
    const markup = (event.target as HTMLTextAreaElement).value;
    this.content.set(markup);
    this.saveChapter(markup);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.reparse(markup), PARSE_DEBOUNCE_MS);
  }

  /**
   * Persists edited markup back into the active chapter.
   *
   * @param markup The new chapter content.
   */
  private saveChapter(markup: string): void {
    const project = this.active.current();
    if (!project || !project.outline.length) return;
    const index = this.activeIndex();
    const outline = project.outline.map((c, i) =>
      i === index ? { ...c, content: markup } : c,
    );
    this.active.patch({ outline });
  }

  /**
   * Switches the active chapter and persists it.
   *
   * @param index The chapter index to open.
   */
  protected setActiveCh(index: number): void {
    this.active.patch({ activeChapter: index });
  }

  /**
   * Persists an edited scaffold section.
   *
   * @param key The scaffold key.
   * @param value The new text.
   */
  protected onExtraChange(key: keyof Extras, value: string): void {
    const extras = this.active.current()?.extras;
    if (!extras) return;
    this.active.patch({ extras: { ...extras, [key]: value } });
  }

  /**
   * Persists the author bio note.
   *
   * @param value The new bio text.
   */
  protected onBioChange(value: string): void {
    this.active.patch({ bio: value });
  }

  /**
   * Persists the autopilot target length (a local print setting).
   *
   * @param value The selected words-per-chapter value.
   */
  protected saveWordTarget(value: string): void {
    const settings = this.active.current()?.settings;
    if (!settings) return;
    this.active.patch({ settings: { ...settings, wordTarget: Number(value) } });
  }

  /** Advances to the formatting step. */
  protected next(): void {
    this.active.patch({ currentStep: 3 });
  }

  /**
   * Reads a scaffold section's current text.
   *
   * @param key The scaffold key.
   * @returns The stored text, or an empty string.
   */
  protected extraValue(key: keyof Extras): string {
    return this.active.current()?.extras[key] ?? '';
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

  /** Builds the translate target options (all languages except the current). */
  private buildLangOptions(): { key: string; label: string }[] {
    const current = this.active.current()?.language;
    return Object.entries(LANG_LABELS)
      .filter(([key]) => key !== current)
      .map(([key, label]) => ({ key, label }));
  }

  /**
   * Returns the first language that is not the given one.
   *
   * @param language The current book language.
   * @returns A different language key.
   */
  private firstOtherLang(language: BookLanguage): string {
    return Object.keys(LANG_LABELS).find((k) => k !== language) ?? 'en';
  }

  /** Builds the inline preview page style (font, size, aspect ratio, align). */
  private buildPreviewStyle(): string {
    const s = this.active.current()?.settings;
    const dims = TRIM_DIMS[s?.trim ?? '7x10'] ?? TRIM_DIMS['7x10'];
    const family =
      FONT_FAMILIES[s?.font ?? 'garamond'] ?? FONT_FAMILIES['garamond'];
    const align = s?.align === 'left' ? 'left' : 'justify';
    const size = (s?.fontSize ?? 11.5) * 1.05;
    return `font-family:${family};font-size:${size}px;line-height:${s?.lineHeight ?? 1.55};aspect-ratio:${dims.w}/${dims.h};--al:${align};`;
  }
}
