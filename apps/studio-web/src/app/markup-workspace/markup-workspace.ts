import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import type { BookDocument } from '@kdp/contracts';
import { parseMarkup, type LegacyParseResult } from '@kdp/document-model';
import { BookPreviewComponent } from '@kdp/preview';
import { DEMO_FIXTURES, type DemoFixture } from './demo-fixtures';

// WP-C1 live workspace: markup editor -> debounced parse -> validated AST ->
// warnings/errors + book preview. Content is visible immediately (§10); the
// last valid preview is retained if a parse fails so nothing is lost (§9.4).
// The editor is uncontrolled (initial + demo writes only) to keep the caret.

const DEBOUNCE_MS = 300;
type ParseStatus = 'ready' | 'parsing';

/** Live markup editor with parser diagnostics and book preview. */
@Component({
  selector: 'app-markup-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BookPreviewComponent],
  templateUrl: './markup-workspace.html',
  styleUrl: './markup-workspace.scss',
})
export class MarkupWorkspaceComponent {
  protected readonly demos = DEMO_FIXTURES;
  protected readonly initialMarkup = DEMO_FIXTURES[0].markup;
  protected readonly locale = signal<DemoFixture['locale']>('de');
  protected readonly status = signal<ParseStatus>('ready');
  private readonly editor =
    viewChild.required<ElementRef<HTMLTextAreaElement>>('editor');
  private readonly markup = signal(DEMO_FIXTURES[0].markup);
  private readonly result = signal<LegacyParseResult>(this.initialResult());
  private readonly lastValid = signal<BookDocument | null>(
    this.result().document,
  );
  private timer: ReturnType<typeof setTimeout> | undefined;

  protected readonly warnings = computed(() => this.result().warnings);
  protected readonly errors = computed(() => this.result().errors);
  protected readonly document = computed(() => this.lastValid());
  protected readonly statusLabel = computed(() => this.buildStatusLabel());

  /**
   * Parses the first demo fixture to seed the initial state.
   *
   * @returns The initial parse result.
   */
  private initialResult(): LegacyParseResult {
    return parseMarkup(DEMO_FIXTURES[0].markup, { language: 'de' });
  }

  /**
   * Handles editor input: stores markup and schedules a debounced parse.
   *
   * @param event The textarea input event.
   */
  protected onInput(event: Event): void {
    this.markup.set((event.target as HTMLTextAreaElement).value);
    this.status.set('parsing');
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.runParse(), DEBOUNCE_MS);
  }

  /**
   * Loads a demo fixture, writes it to the editor and parses it immediately.
   *
   * @param demo The demo fixture to load.
   */
  protected selectDemo(demo: DemoFixture): void {
    this.locale.set(demo.locale);
    this.markup.set(demo.markup);
    this.editor().nativeElement.value = demo.markup;
    this.runParse();
  }

  /**
   * Parses the current markup, updating diagnostics and the last valid preview.
   */
  private runParse(): void {
    const parsed = parseMarkup(this.markup(), { language: this.locale() });
    this.result.set(parsed);
    if (parsed.document) this.lastValid.set(parsed.document);
    this.status.set('ready');
  }

  /**
   * Builds the accessible parser status label.
   *
   * @returns A human-readable status string.
   */
  private buildStatusLabel(): string {
    if (this.status() === 'parsing') return 'Wird geparst …';
    if (this.errors().length > 0)
      return `${this.errors().length} Fehler, ${this.warnings().length} Warnung(en)`;
    if (this.warnings().length > 0)
      return `Gültig · ${this.warnings().length} Warnung(en)`;
    return 'Gültig · keine Warnungen';
  }
}
