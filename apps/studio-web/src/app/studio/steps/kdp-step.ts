import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  Check,
  ChevronRight,
  Copy,
  Download,
  FolderPlus,
  Globe,
  Library,
  LucideAngularModule,
  Megaphone,
  Quote,
  Rocket,
  Sparkles,
} from 'lucide-angular';
import type { BookProject } from '../../core/models/book-project';
import { ProjectStore } from '../../core/firestore/project-store.service';
import { ActiveProjectService } from '../active-project.service';
import {
  downloadBlobFile,
  downloadTextFile,
  openHtmlInNewTab,
} from './browser-open';
import { collectQuotes } from './kdp/quotes';
import { buildLandingHtml } from './kdp/landing-html';
import { buildQuoteCardBlob } from './kdp/quote-card';

// Step 7 (KDP-Paket), ported 1:1 from the Legacy V3 reference: SEO package
// (description/keywords/categories), Launch-Kit (content plan + email sequence),
// social quote cards (real 1080×1080 PNG), the reader-sample landing page and the
// series planner. AI generation is disabled with "Integration nicht konfiguriert"
// (no fakes); quote cards, landing page and "Als Projekt anlegen" are real.

const COPIED_MS = 1500;

/** The SEO package (description, keywords, categories). */
interface KdpPackage {
  beschreibung: string;
  keywords: string[];
  kategorien: string[];
}

/** One content-plan post. */
interface LaunchPost {
  t: number;
  idee: string;
}

/** One launch email. */
interface LaunchEmail {
  tag: number;
  betreff: string;
  text: string;
}

/** One planned series volume. */
interface SeriesBand {
  titel: string;
  untertitel: string;
  fokus: string;
  zielgruppe: string;
  versprechen: string;
}

/** KDP marketing package step. */
@Component({
  selector: 'app-kdp-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './kdp-step.html',
})
export class KdpStepComponent {
  private readonly active = inject(ActiveProjectService);
  private readonly store = inject(ProjectStore);
  private readonly router = inject(Router);

  protected readonly providerReady = false;
  protected readonly copied = signal('');
  protected readonly notice = signal('');
  protected readonly project = this.active.current;

  protected readonly hasConcept = computed(
    () => (this.active.current()?.title ?? '').trim().length > 0,
  );
  protected readonly hasOutline = computed(
    () => (this.active.current()?.outline.length ?? 0) > 0,
  );
  protected readonly kdp = computed<KdpPackage | null>(() => {
    const raw = this.active.current()?.kdp;
    return raw ? (raw as unknown as KdpPackage) : null;
  });
  protected readonly beschreibungParagraphs = computed(() =>
    (this.kdp()?.beschreibung ?? '').split('\n').filter((p) => p.trim()),
  );
  protected readonly keywords = computed(() => this.kdp()?.keywords ?? []);
  protected readonly kategorien = computed(() => this.kdp()?.kategorien ?? []);
  protected readonly posts = computed<LaunchPost[]>(
    () =>
      (this.active.current()?.launch.posts ?? []) as unknown as LaunchPost[],
  );
  protected readonly emails = computed<LaunchEmail[]>(
    () =>
      (this.active.current()?.launch.emails ?? []) as unknown as LaunchEmail[],
  );
  protected readonly series = computed<SeriesBand[]>(
    () => (this.active.current()?.series ?? []) as unknown as SeriesBand[],
  );
  protected readonly quotes = computed(() => {
    const p = this.active.current();
    return p ? collectQuotes(p) : [];
  });

  protected readonly megaphoneIcon = Megaphone;
  protected readonly sparklesIcon = Sparkles;
  protected readonly rocketIcon = Rocket;
  protected readonly quoteIcon = Quote;
  protected readonly globeIcon = Globe;
  protected readonly libraryIcon = Library;
  protected readonly copyIcon = Copy;
  protected readonly checkIcon = Check;
  protected readonly downloadIcon = Download;
  protected readonly folderPlusIcon = FolderPlus;
  protected readonly chevronIcon = ChevronRight;

  /**
   * Copies text to the clipboard and shows brief feedback.
   *
   * @param key The copy-target key (for the feedback icon).
   * @param text The text to copy.
   */
  protected copyText(key: string, text: string): void {
    void navigator.clipboard?.writeText(text);
    this.copied.set(key);
    setTimeout(() => this.copied.set(''), COPIED_MS);
  }

  /** Copies the keywords as a semicolon-separated list. */
  protected copyKeywords(): void {
    this.copyText('kw', this.keywords().join('; '));
  }

  /** Copies the whole content plan (one "Tag X: idea" per line). */
  protected copyPosts(): void {
    this.copyText(
      'posts',
      this.posts()
        .map((p) => `Tag ${p.t}: ${p.idee}`)
        .join('\n'),
    );
  }

  /**
   * Copies a single email (subject + body).
   *
   * @param index The email index.
   * @param mail The email.
   */
  protected copyEmail(index: number, mail: LaunchEmail): void {
    this.copyText(`mail${index}`, `Betreff: ${mail.betreff}\n\n${mail.text}`);
  }

  /**
   * Generates and downloads a real 1080×1080 quote-card PNG.
   *
   * @param quote The quote text.
   */
  protected async downloadQuoteCard(quote: string): Promise<void> {
    const p = this.active.current();
    if (!p) return;
    const blob = await buildQuoteCardBlob(
      quote,
      p.digital.accent || '#6C57B8',
      p.author || '',
      p.title || '',
    );
    downloadBlobFile('zitat-karte.png', blob);
  }

  /** Opens the reader-sample landing page in a new tab. */
  protected openLanding(): void {
    const p = this.active.current();
    if (!p) return;
    const opened = openHtmlInNewTab(buildLandingHtml(p), 'landingpage.html');
    if (!opened)
      this.notice.set('Popup blockiert — die Datei wurde heruntergeladen.');
  }

  /** Downloads the reader-sample landing page HTML. */
  protected downloadLanding(): void {
    const p = this.active.current();
    if (p)
      downloadTextFile('landingpage.html', buildLandingHtml(p), 'text/html');
  }

  /**
   * Creates a new series-volume project from a planned band and opens it.
   *
   * @param band The planned series volume.
   */
  protected async createSeriesProject(band: SeriesBand): Promise<void> {
    const src = this.active.current();
    if (!src) return;
    const created = await this.store.create(band.titel || 'Band 2');
    await this.store.update(created.id, seriesFields(src, band, created));
    await this.router.navigate(['/studio/projects', created.id]);
  }

  /** Advances to the publishing step. */
  protected next(): void {
    this.active.patch({ currentStep: 7 });
  }

  /**
   * Tracks list items by index.
   *
   * @param index The item index.
   * @returns The item index.
   */
  protected track(index: number): number {
    return index;
  }
}

/**
 * Builds the inherited fields for a new series-volume project.
 *
 * @param src The source project.
 * @param band The planned series volume.
 * @param created The freshly created (default) project.
 * @returns The fields to persist on the new project.
 */
function seriesFields(
  src: BookProject,
  band: SeriesBand,
  created: BookProject,
): Partial<BookProject> {
  return {
    subtitle: band.untertitel || '',
    niche: src.niche,
    language: src.language,
    bookType: src.bookType,
    author: src.author,
    bio: src.bio,
    voice: { ...src.voice },
    digital: { ...created.digital, accent: src.digital.accent },
    audience: band.zielgruppe || src.audience,
    promise: band.versprechen || '',
    currentStep: 1,
    activeChapter: 0,
  };
}
