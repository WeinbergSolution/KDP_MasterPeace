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
  private pendingId: string | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly current = this.projectSignal.asReadonly();
  readonly isSaving = this.savingSignal.asReadonly();

  /**
   * Loads a project by id, flushing any pending edits of the previous project
   * first so a project switch never loses or misroutes an autosave.
   *
   * @param id The project id to open.
   */
  async load(id: string): Promise<void> {
    await this.flush();
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
    this.pendingId = project.id;
    this.scheduleSave();
  }

  /** Restarts the autosave debounce timer and marks the state as saving. */
  private scheduleSave(): void {
    this.savingSignal.set(true);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), AUTOSAVE_MS);
  }

  /** Writes the coalesced pending changes to their own project id. */
  private async flush(): Promise<void> {
    clearTimeout(this.timer);
    const id = this.pendingId;
    const patch = this.pending;
    this.pending = {};
    this.pendingId = null;
    if (!id || Object.keys(patch).length === 0)
      return this.savingSignal.set(false);
    try {
      await this.store.update(id, patch);
    } finally {
      this.savingSignal.set(false);
    }
  }
}
