import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  BookOpen,
  Check,
  Copy,
  Download,
  FolderPlus,
  LayoutTemplate,
  ListTree,
  type LucideIconData,
  LucideAngularModule,
  Megaphone,
  Palette,
  PenLine,
  Rocket,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-angular';
import { ProjectStore } from '../core/firestore/project-store.service';
import {
  type BookProject,
  projectCopyFields,
} from '../core/models/book-project';
import { ActiveProjectService } from './active-project.service';
import { STEP_LABELS, computeRailStats } from './project-stats';
import { IdeaStepComponent } from './steps/idea-step';
import { GliederungStepComponent } from './steps/gliederung-step';
import { WritingStepComponent } from './steps/writing-step';
import { PlaceholderStepComponent } from './steps/placeholder-step';

// The tool shell in Legacy V3 optics: dark rail (brand, project box, 8 steps,
// stats, save status) + wide main area. ViewEncapsulation.None ports the legacy
// stylesheet 1:1 (AGENTS §2: current instruction outranks §12). Persistence is
// Firestore (not window.storage).

const DELETE_ARM_MS = 4000;

/** A rail step with its label and lucide icon. */
interface RailStep {
  readonly label: string;
  readonly icon: LucideIconData;
}

const STEP_ICONS: LucideIconData[] = [
  Sparkles,
  ListTree,
  PenLine,
  LayoutTemplate,
  Palette,
  Download,
  Megaphone,
  Rocket,
];

/** Studio tool shell hosting project switching, the 8 steps and preview. */
@Component({
  selector: 'app-studio-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [ActiveProjectService],
  imports: [
    RouterLink,
    LucideAngularModule,
    IdeaStepComponent,
    GliederungStepComponent,
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
  protected readonly steps: RailStep[] = STEP_LABELS.map((label, i) => ({
    label,
    icon: STEP_ICONS[i],
  }));
  protected readonly project = this.active.current;
  protected readonly saving = this.active.isSaving;
  protected readonly stats = computed(() => {
    const p = this.project();
    return p ? computeRailStats(p) : { words: 0, written: 0, pages: 0 };
  });

  protected readonly brandIcon = BookOpen;
  protected readonly newIcon = FolderPlus;
  protected readonly copyIcon = Copy;
  protected readonly deleteIcon = Trash2;
  protected readonly checkIcon = Check;
  protected readonly saveIcon = Save;

  constructor() {
    effect(() => {
      const id = this.projectId();
      if (id) void this.active.load(id);
    });
    void this.refreshProjects();
  }

  /** Loads the project list; opens the newest when none is selected. */
  private async refreshProjects(): Promise<void> {
    const list = await this.store.list();
    this.projects.set(list);
    if (!this.projectId() && list.length) void this.open(list[0].id);
  }

  /** Creates a new (untitled) project and opens it (Legacy: emptyProject.title=""). */
  protected async createProject(): Promise<void> {
    const created = await this.store.create('');
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

  /**
   * Reports whether a step is considered done (Legacy V3 rail logic).
   *
   * @param index The step index.
   * @returns True when the step's completion condition is met.
   */
  protected isDone(index: number): boolean {
    const p = this.project();
    if (!p) return false;
    if (index === 0) return !!p.title;
    if (index === 1) return p.outline.length > 0;
    if (index === 4) return !!p.cover.blurb;
    if (index === 6) return !!p.kdp;
    return false;
  }
}
