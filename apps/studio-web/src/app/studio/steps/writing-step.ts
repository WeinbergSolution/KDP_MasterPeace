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
import { parseMarkup, type LegacyParseResult } from '@kdp/document-model';
import { BookPreviewComponent } from '@kdp/preview';
import { ActiveProjectService } from '../active-project.service';

// Step 3 (Schreiben): the WP-C1 engine inside the tool — legacy-markup editor →
// debounced parse → Book AST → warnings → live preview. Content persists to the
// project (autosave) and survives reload. The editor is uncontrolled to keep the
// caret; only project switches write the value imperatively.

const PARSE_DEBOUNCE_MS = 300;

/** Writing step embedding the WP-C1 markup editor, parser and preview. */
@Component({
  selector: 'app-writing-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BookPreviewComponent],
  templateUrl: './writing-step.html',
  styleUrl: './writing-step.scss',
})
export class WritingStepComponent {
  private readonly active = inject(ActiveProjectService);
  private readonly editorRef =
    viewChild<ElementRef<HTMLTextAreaElement>>('editor');
  private loadedId: string | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  private readonly result = signal<LegacyParseResult>(
    parseMarkup('', { language: 'de' }),
  );
  protected readonly warnings = computed(() => this.result().warnings);
  protected readonly document = computed(() => this.result().document);

  constructor() {
    effect(() => this.syncFromProject());
  }

  /** Loads markup into the editor + preview when a project becomes active. */
  private syncFromProject(): void {
    const project = this.active.current();
    const editor = this.editorRef();
    if (!project || !editor || project.id === this.loadedId) return;
    this.loadedId = project.id;
    editor.nativeElement.value = project.markup;
    this.reparse(project.markup);
  }

  /**
   * Handles editor input: autosaves markup and schedules a re-parse.
   *
   * @param event The textarea input event.
   */
  protected onInput(event: Event): void {
    const markup = (event.target as HTMLTextAreaElement).value;
    this.active.patch({ markup });
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.reparse(markup), PARSE_DEBOUNCE_MS);
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
}
