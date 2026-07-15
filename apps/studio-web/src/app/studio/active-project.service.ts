import { Injectable, inject, signal } from '@angular/core';
import { ProjectStore } from '../core/firestore/project-store.service';
import type { BookProject } from '../core/models/book-project';

// Holds the currently open project and persists edits to Firestore with a
// debounced autosave. Edits update the signal immediately (visible per AGENTS
// §10); the write is coalesced and the save status is observable.

const AUTOSAVE_MS = 700;

/** Reactive holder + debounced autosave for the active book project. */
@Injectable()
export class ActiveProjectService {
  private readonly store = inject(ProjectStore);
  private readonly projectSignal = signal<BookProject | null>(null);
  private readonly savingSignal = signal(false);
  private pending: Partial<BookProject> = {};
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly current = this.projectSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();

  /**
   * Loads a project by id into the active slot.
   *
   * @param id The project id to open.
   */
  async load(id: string): Promise<void> {
    this.projectSignal.set(await this.store.get(id));
  }

  /**
   * Applies an optimistic edit and schedules a debounced save.
   *
   * @param patch The fields to change.
   */
  patch(patch: Partial<BookProject>): void {
    const project = this.projectSignal();
    if (!project) return;
    this.projectSignal.set({ ...project, ...patch });
    this.pending = { ...this.pending, ...patch };
    this.scheduleSave();
  }

  /** Restarts the autosave debounce timer and marks the state as saving. */
  private scheduleSave(): void {
    this.savingSignal.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), AUTOSAVE_MS);
  }

  /** Writes the coalesced pending changes and clears the saving flag. */
  private async flush(): Promise<void> {
    const project = this.projectSignal();
    const patch = this.pending;
    this.pending = {};
    if (!project) return this.savingSignal.set(false);
    try {
      await this.store.update(project.id, patch);
    } finally {
      this.savingSignal.set(false);
    }
  }
}
