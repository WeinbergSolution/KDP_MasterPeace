import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BOOK_LANGUAGES,
  BOOK_TYPES,
  type BookProject,
  NICHES,
} from '../../core/models/book-project';
import { ActiveProjectService } from '../active-project.service';

// Step 1 (Idee): edit book type, language, niche and the core book fields.
// Local fields are two-way bound (stable caret); every change autosaves.

/** Idea step: book meta editing wired to the active-project autosave. */
@Component({
  selector: 'app-idea-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  templateUrl: './idea-step.html',
  styleUrl: './idea-step.scss',
})
export class IdeaStepComponent {
  private readonly active = inject(ActiveProjectService);
  private loadedId: string | null = null;

  protected title = '';
  protected subtitle = '';
  protected author = '';
  protected niche = '';
  protected language = 'de';
  protected bookType = 'workbook';
  protected chapterCount = 8;

  protected readonly bookTypes = BOOK_TYPES;
  protected readonly languages = BOOK_LANGUAGES;
  protected readonly niches = NICHES;

  constructor() {
    effect(() => this.syncFromProject());
  }

  /** Reloads local fields when a different project becomes active. */
  private syncFromProject(): void {
    const project = this.active.current();
    if (!project || project.id === this.loadedId) return;
    this.loadedId = project.id;
    this.applyLocal(project);
  }

  /**
   * Copies a project's fields into the local editable state.
   *
   * @param project The active project.
   */
  private applyLocal(project: BookProject): void {
    this.title = project.title;
    this.subtitle = project.subtitle;
    this.author = project.author;
    this.niche = project.niche;
    this.language = project.language;
    this.bookType = project.bookType;
    this.chapterCount = project.chapterCount;
  }

  /**
   * Persists a single changed field through the autosave service.
   *
   * @param patch The changed field(s).
   */
  protected save(patch: Partial<BookProject>): void {
    this.active.patch(patch);
  }
}
