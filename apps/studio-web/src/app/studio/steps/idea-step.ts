import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ChevronRight,
  Feather,
  LucideAngularModule,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
} from 'lucide-angular';
import {
  BOOK_TYPE_LABELS,
  type BookLanguage,
  type BookProject,
  LANG_LABELS,
  NICHES,
} from '../../core/models/book-project';
import { ActiveProjectService } from '../active-project.service';

// Step 1 (Idee), ported 1:1 from the Legacy V3 reference: type/language/niche +
// Konzepte, Trend-Radar, Digital-Produkt-Ideen, Rezensions-Lücken-Finder,
// Konzeptkarten, Buchdaten + Titel-Tester, Autoren-DNA, "Weiter zur Gliederung".
// Provider-backed buttons are disabled with "Integration nicht konfiguriert"
// until the server AI adapter is configured — no fake results.

/** Idea step: book meta editing + research entry points (parity port). */
@Component({
  selector: 'app-idea-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './idea-step.html',
})
export class IdeaStepComponent {
  private readonly active = inject(ActiveProjectService);
  private loadedId: string | null = null;

  protected title = '';
  protected subtitle = '';
  protected audience = '';
  protected author = '';
  protected promise = '';
  protected bio = '';
  protected niche = '';
  protected language = 'de';
  protected bookType = 'workbook';
  protected chapterCount = 8;
  protected voiceSample = '';
  protected voiceProfile = '';

  protected readonly bookTypeEntries = Object.entries(BOOK_TYPE_LABELS);
  protected readonly langEntries = Object.entries(LANG_LABELS);
  protected readonly niches = NICHES;
  protected readonly providerReady = false;

  protected readonly sparkles = Sparkles;
  protected readonly trending = TrendingUp;
  protected readonly smartphone = Smartphone;
  protected readonly shield = ShieldCheck;
  protected readonly feather = Feather;
  protected readonly chevron = ChevronRight;

  /** The chosen non-German language label, or empty for German (parity hint). */
  protected get otherLangLabel(): string {
    return this.language !== 'de'
      ? (LANG_LABELS[this.language as BookLanguage] ?? '')
      : '';
  }

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
   * Copies a project's editable fields into the local state.
   *
   * @param p The active project.
   */
  private applyLocal(p: BookProject): void {
    this.title = p.title;
    this.subtitle = p.subtitle;
    this.audience = p.audience;
    this.author = p.author;
    this.promise = p.promise;
    this.bio = p.bio;
    this.niche = p.niche;
    this.language = p.language;
    this.bookType = p.bookType;
    this.chapterCount = p.chapterCount;
    this.voiceSample = p.voice.sample;
    this.voiceProfile = p.voice.profile;
  }

  /**
   * Persists changed field(s) through the autosave service.
   *
   * @param patch The changed fields.
   */
  protected save(patch: Partial<BookProject>): void {
    this.active.patch(patch);
  }

  /** Persists the author-voice sample and profile. */
  protected saveVoice(): void {
    this.active.patch({
      voice: { sample: this.voiceSample, profile: this.voiceProfile },
    });
  }
}
