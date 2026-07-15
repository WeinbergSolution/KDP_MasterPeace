import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProjectStore } from '../core/firestore/project-store.service';
import {
  type BookProject,
  projectCopyFields,
} from '../core/models/book-project';
import { ActiveProjectService } from './active-project.service';
import { STEP_LABELS, computeStats } from './project-stats';
import { IdeaStepComponent } from './steps/idea-step';
import { WritingStepComponent } from './steps/writing-step';
import { PlaceholderStepComponent } from './steps/placeholder-step';

// The tool shell: dark rail (brand, project switcher, 8 steps, stats, save
// status) + main step area. Mirrors the Legacy V3 layout; persistence is
// Firestore (not window.storage). Rendering libs come from WP-C1.

const DELETE_ARM_MS = 4000;

/** Studio tool shell hosting project switching, the 8 steps and preview. */
@Component({
  selector: 'app-studio-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ActiveProjectService],
  imports: [
    RouterLink,
    IdeaStepComponent,
    WritingStepComponent,
    PlaceholderStepComponent,
  ],
  templateUrl: './studio-shell.html',
  styleUrl: './studio-shell.scss',
})
export class StudioShellComponent {
  private readonly store = inject(ProjectStore);
  private readonly active = inject(ActiveProjectService);
  private readonly router = inject(Router);

  readonly projectId = input<string>();
  protected readonly projects = signal<BookProject[]>([]);
  protected readonly confirmDelete = signal(false);
  protected readonly steps = STEP_LABELS;
  protected readonly project = this.active.current;
  protected readonly saving = this.active.isSaving;
  protected readonly stats = computed(() =>
    computeStats(this.project()?.markup ?? ''),
  );

  constructor() {
    effect(() => {
      const id = this.projectId();
      if (id) void this.active.load(id);
    });
    void this.refreshProjects();
  }

  /**
   * Loads the project list; opens the newest when none is selected.
   */
  private async refreshProjects(): Promise<void> {
    const list = await this.store.list();
    this.projects.set(list);
    if (!this.projectId() && list.length) void this.open(list[0].id);
  }

  /** Creates a new project and opens it. */
  protected async createProject(): Promise<void> {
    const created = await this.store.create('Neues Buchprojekt');
    await this.refreshProjects();
    await this.open(created.id);
  }

  /**
   * Navigates to a project by id.
   *
   * @param id The project id to open.
   */
  protected async open(id: string): Promise<void> {
    await this.router.navigate(['/studio/projects', id]);
  }

  /** Handles the project-switcher change event. */
  protected onSwitch(event: Event): void {
    void this.open((event.target as HTMLSelectElement).value);
  }

  /** Duplicates the active project into a new one and opens it. */
  protected async duplicateProject(): Promise<void> {
    const source = this.project();
    if (!source) return;
    const copy = await this.store.create(
      `${source.title || 'Projekt'} (Kopie)`,
    );
    await this.store.update(copy.id, projectCopyFields(source));
    await this.refreshProjects();
    await this.open(copy.id);
  }

  /** Arms delete on first tap, deletes on the second. */
  protected requestDelete(): void {
    if (!this.confirmDelete()) {
      this.confirmDelete.set(true);
      setTimeout(() => this.confirmDelete.set(false), DELETE_ARM_MS);
      return;
    }
    this.confirmDelete.set(false);
    void this.deleteProject();
  }

  /** Deletes the active project and returns to the studio root. */
  private async deleteProject(): Promise<void> {
    const target = this.project();
    if (!target) return;
    await this.store.remove(target.id);
    await this.router.navigate(['/studio']);
  }

  /**
   * Switches the active workflow step (persisted).
   *
   * @param index The zero-based step index.
   */
  protected setStep(index: number): void {
    this.active.patch({ currentStep: index });
  }
}
