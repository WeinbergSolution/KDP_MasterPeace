import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  CornerLeftUp,
  FileText,
  Lightbulb,
  LucideAngularModule,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-angular';
import type { Chapter } from '../../core/models/book-project';
import { ActiveProjectService } from '../active-project.service';
import { newChapterId, splitIntoChapters } from './outline-utils';

// Step 2 (Gliederung), ported 1:1 from the Legacy V3 reference. Manuscript import
// (paste + "===" split), manual chapter add/edit/move/merge/delete are LOCAL and
// fully functional + persisted. AI actions (PDF auto-read, generate outline,
// AI structure-fix) are disabled with "Integration nicht konfiguriert".

/** Gliederung step: manual outline editing + import (parity port). */
@Component({
  selector: 'app-gliederung-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './gliederung-step.html',
})
export class GliederungStepComponent {
  private readonly active = inject(ActiveProjectService);
  private loadedId: string | null = null;

  protected importText = '';
  protected chapterCount = 8;
  protected readonly confirmReplace = signal(false);
  protected readonly providerReady = false;

  protected readonly project = this.active.current;
  protected readonly outline = computed(
    () => this.active.current()?.outline ?? [],
  );
  protected readonly hasConcept = computed(
    () => !!this.active.current()?.title,
  );

  protected readonly fileIcon = FileText;
  protected readonly uploadIcon = Upload;
  protected readonly sparkles = Sparkles;
  protected readonly up = ArrowUp;
  protected readonly down = ArrowDown;
  protected readonly merge = CornerLeftUp;
  protected readonly trash = Trash2;
  protected readonly plus = Plus;
  protected readonly chevron = ChevronRight;
  protected readonly bulb = Lightbulb;
  protected readonly refresh = RefreshCw;

  constructor() {
    effect(() => this.syncFromProject());
  }

  /** Syncs the local chapter-count input when a project becomes active. */
  private syncFromProject(): void {
    const project = this.active.current();
    if (!project || project.id === this.loadedId) return;
    this.loadedId = project.id;
    this.chapterCount = project.chapterCount;
  }

  /** Persists the chapter-count input. */
  protected saveCount(): void {
    const value = Math.max(1, Math.min(15, this.chapterCount || 8));
    this.active.patch({ chapterCount: value });
  }

  /**
   * Writes a new outline to the active project.
   *
   * @param outline The updated chapter list.
   */
  private setOutline(outline: Chapter[]): void {
    this.active.patch({ outline });
  }

  /**
   * Updates a chapter field (title or goal).
   *
   * @param index The chapter index.
   * @param patch The changed field(s).
   */
  protected updateChapter(index: number, patch: Partial<Chapter>): void {
    this.setOutline(
      this.outline().map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  }

  /** Appends a new empty chapter. */
  protected addChapter(): void {
    this.setOutline([
      ...this.outline(),
      { id: newChapterId(), title: 'Neues Kapitel', goal: '', content: '' },
    ]);
  }

  /**
   * Removes a chapter.
   *
   * @param index The chapter index to remove.
   */
  protected removeChapter(index: number): void {
    this.setOutline(this.outline().filter((_c, i) => i !== index));
  }

  /**
   * Moves a chapter up or down.
   *
   * @param index The chapter index.
   * @param dir -1 to move up, +1 to move down.
   */
  protected moveChapter(index: number, dir: number): void {
    const list = [...this.outline()];
    const target = index + dir;
    if (target < 0 || target >= list.length) return;
    [list[index], list[target]] = [list[target], list[index]];
    this.setOutline(list);
  }

  /**
   * Merges a chapter into the previous one as a subheading.
   *
   * @param index The chapter index (must be > 0).
   */
  protected mergeChapterUp(index: number): void {
    if (index <= 0) return;
    const list = [...this.outline()];
    const prev = list[index - 1];
    const cur = list[index];
    prev.content = `${prev.content}\n\n## ${cur.title}\n${cur.content}`.trim();
    list.splice(index, 1);
    this.setOutline(list);
  }

  /**
   * Splits the import text into chapters and replaces or appends them.
   *
   * @param mode 'replace' overwrites the outline, 'append' adds to it.
   */
  protected applyImport(mode: 'replace' | 'append'): void {
    const chapters = splitIntoChapters(this.importText);
    if (!chapters.length) return;
    if (mode === 'replace' && this.outline().length && !this.confirmReplace()) {
      this.confirmReplace.set(true);
      setTimeout(() => this.confirmReplace.set(false), 6000);
      return;
    }
    this.confirmReplace.set(false);
    this.setOutline(
      mode === 'append' ? [...this.outline(), ...chapters] : chapters,
    );
    this.importText = '';
  }

  /** Advances to the writing step and resets the active chapter (Legacy parity). */
  protected next(): void {
    this.active.patch({ currentStep: 2, activeChapter: 0 });
  }

  /**
   * Tracks chapters by id for the @for loop.
   *
   * @param _index The row index.
   * @param chapter The chapter.
   * @returns The chapter id.
   */
  protected trackChapter(_index: number, chapter: Chapter): string {
    return chapter.id;
  }
}
