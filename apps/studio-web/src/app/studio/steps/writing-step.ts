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
import type { BookProject } from '../../core/models/book-project';
import { ActiveProjectService } from '../active-project.service';

// Step 3 (Schreiben) — interim: the WP-C1 engine (markup editor -> Book AST ->
// live preview) bound to the active chapter. The full Legacy V3 writing step
// (autopilot, per-chapter tabs, book scaffold) is ported in a later package.

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

  /**
   * Reads the content of the active chapter.
   *
   * @param project The active project.
   * @returns The active chapter's markup, or an empty string.
   */
  private chapterContent(project: BookProject): string {
    return project.outline[project.activeChapter]?.content ?? '';
  }

  /** Loads chapter markup into the editor + preview on project change. */
  private syncFromProject(): void {
    const project = this.active.current();
    const editor = this.editorRef();
    if (!project || !editor || project.id === this.loadedId) return;
    this.loadedId = project.id;
    editor.nativeElement.value = this.chapterContent(project);
    this.reparse(this.chapterContent(project));
  }

  /**
   * Handles editor input: saves the chapter and schedules a re-parse.
   *
   * @param event The textarea input event.
   */
  protected onInput(event: Event): void {
    const markup = (event.target as HTMLTextAreaElement).value;
    this.saveChapter(markup);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.reparse(markup), PARSE_DEBOUNCE_MS);
  }

  /**
   * Persists edited markup back into the active chapter.
   *
   * @param content The new chapter content.
   */
  private saveChapter(content: string): void {
    const project = this.active.current();
    if (!project || !project.outline.length) return;
    const outline = project.outline.map((c, i) =>
      i === project.activeChapter ? { ...c, content } : c,
    );
    this.active.patch({ outline });
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
