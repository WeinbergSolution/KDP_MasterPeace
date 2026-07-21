import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  ArrowRight,
  BookOpen,
  Check,
  Download,
  Feather,
  FileText,
  GraduationCap,
  Image as ImageIcon,
  LayoutTemplate,
  ListTree,
  type LucideIconData,
  LucideAngularModule,
  Megaphone,
  NotebookPen,
  Palette,
  PenLine,
  Rocket,
  Smartphone,
  Sparkles,
  Store,
} from 'lucide-angular';
import { AuthService } from '../core/firebase/auth.service';
import { AI_CREDIT_RULES, BOOKING_PENDING_NOTICE, PLANS } from './pricing-data';
import { COMPARE_COLUMNS, COMPARE_NOTE, COMPARE_ROWS } from './comparison-data';

// Public marketing landing page at `/`. Premium publishing-SaaS composition for
// KDP MasterPeace: warm ivory base, deep-ink contrast sections, gold + cover
// accents. The four real example covers ship from /covers. No third-party
// assets, fonts or trackers; no invented stats or testimonials.

/** An example book cover shown in the hero showcase and gallery. */
interface Cover {
  readonly file: string;
  readonly title: string;
  readonly author: string;
  readonly type: string;
  readonly category: string;
  readonly tone: string;
}

/** A titled tile with a lucide icon (capabilities, results, audiences). */
interface Tile {
  readonly icon: LucideIconData;
  readonly title: string;
  readonly text: string;
}

/** A numbered workflow step. */
interface Step {
  readonly index: number;
  readonly title: string;
  readonly text: string;
}

/** Public landing page presenting the product and routing to auth. */
@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, LucideAngularModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingComponent {
  private readonly auth = inject(AuthService);

  protected readonly year = new Date().getFullYear();
  protected readonly arrow = ArrowRight;
  protected readonly checkIcon = Check;

  protected readonly isAuthed = this.auth.isAuthenticated;
  protected readonly bookingNotice = signal('');

  protected readonly plans = PLANS;
  protected readonly aiRules = AI_CREDIT_RULES;
  protected readonly compareColumns = COMPARE_COLUMNS;
  protected readonly compareRows = COMPARE_ROWS;
  protected readonly compareNote = COMPARE_NOTE;

  protected readonly covers: Cover[] = [
    {
      file: 'der-weg-zu-finanzieller-freiheit.webp',
      title: 'Der Weg zu finanzieller Freiheit',
      author: 'Prof. Dr. Markus Stein',
      type: 'Ratgeber',
      category: 'Finanzen & Vermögensaufbau',
      tone: 'navy',
    },
    {
      file: 'der-weg-zur-inneren-ruhe.webp',
      title: 'Der Weg zur inneren Ruhe',
      author: 'Dr. Eva Meissner',
      type: 'Workbook',
      category: 'Achtsamkeit & Stressbewältigung',
      tone: 'teal',
    },
    {
      file: 'mein-kreatives-lebens-journal.webp',
      title: 'Mein kreatives Lebens-Journal',
      author: 'Lena Vogel',
      type: 'Workbook',
      category: 'Kreativität & Journaling',
      tone: 'coral',
    },
    {
      file: 'das-kind-in-mir.webp',
      title: 'Das Kind in mir',
      author: 'Clara Weiss',
      type: 'Roman',
      category: 'Heilung & Selbstfindung',
      tone: 'forest',
    },
  ];

  protected readonly capabilities: Tile[] = [
    {
      icon: Sparkles,
      title: 'Idee & Recherche',
      text: 'Nische, Trend-Radar, Digitalprodukt-Ideen und Rezensions-Lücken.',
    },
    {
      icon: ListTree,
      title: 'Gliederung',
      text: 'Kapitelstruktur mit klarem roten Faden — manuell oder KI-gestützt.',
    },
    {
      icon: PenLine,
      title: 'Schreiben',
      text: 'Kapitel entwerfen mit Live-Vorschau und deiner Autoren-DNA.',
    },
    {
      icon: LayoutTemplate,
      title: 'Formatierung',
      text: 'KDP-Trim, Schrift, Bundsteg und Satz — druckgenau eingestellt.',
    },
    {
      icon: Palette,
      title: 'Cover',
      text: 'Maße, Rücken, Klappentext und druckfertige Cover-Vorlage.',
    },
    {
      icon: Download,
      title: 'Export',
      text: 'Print-Interior-PDF, EPUB und Digitalprodukt in einem Schritt.',
    },
    {
      icon: Megaphone,
      title: 'KDP-Paket',
      text: 'Beschreibung, 7 Keywords, Kategorien und ein Launch-Kit.',
    },
    {
      icon: Rocket,
      title: 'Veröffentlichung',
      text: 'Pre-Flight-Check, Preis-Kalkulator und Upload-Anleitung.',
    },
  ];

  protected readonly steps: Step[] = [
    {
      index: 1,
      title: 'Idee',
      text: 'Nische wählen, Konzept und Trends erkunden.',
    },
    { index: 2, title: 'Gliederung', text: 'Kapitelstruktur mit rotem Faden.' },
    {
      index: 3,
      title: 'Schreiben',
      text: 'Kapitel entwerfen, Live-Vorschau mitlesen.',
    },
    {
      index: 4,
      title: 'Formatierung',
      text: 'Trim, Schrift, Bundsteg und Satz.',
    },
    {
      index: 5,
      title: 'Cover',
      text: 'Maße, Rücken, Klappentext, Designbrief.',
    },
    { index: 6, title: 'Export', text: 'EPUB, Print-PDF und Digitalprodukt.' },
    {
      index: 7,
      title: 'KDP-Paket',
      text: 'Beschreibung, Keywords, Kategorien.',
    },
    {
      index: 8,
      title: 'Veröffentlichen',
      text: 'Pre-Flight, Preis, Upload-Anleitung.',
    },
  ];

  protected readonly results: Tile[] = [
    {
      icon: FileText,
      title: 'Print-Interior-PDF',
      text: 'Druckfertiges Manuskript im exakten KDP-Trim.',
    },
    {
      icon: BookOpen,
      title: 'EPUB',
      text: 'Reflowable E-Book für Kindle & Co.',
    },
    {
      icon: ImageIcon,
      title: 'Cover-Vorlage',
      text: 'Maßgenaue, druckfertige Cover-Datei.',
    },
    {
      icon: Smartphone,
      title: 'Digitalprodukt',
      text: 'PDF in deiner Markenfarbe für die eigene Website.',
    },
    {
      icon: Megaphone,
      title: 'KDP-Marketing-Paket',
      text: 'Beschreibung, Keywords, Kategorien, Launch-Kit.',
    },
  ];

  protected readonly audiences: Tile[] = [
    {
      icon: NotebookPen,
      title: 'Workbook-Ersteller:innen',
      text: 'Übungen, Schreiblinien und Journals mit klarer Struktur.',
    },
    {
      icon: GraduationCap,
      title: 'Ratgeber-Autor:innen',
      text: 'Wissen sauber gegliedert und typografisch gesetzt.',
    },
    {
      icon: Feather,
      title: 'Romanschreibende',
      text: 'Belletristik mit sauberem Satz und sicherem Export.',
    },
    {
      icon: Store,
      title: 'Selfpublisher:innen',
      text: 'Von der Idee bis zum KDP-Upload ohne Tool-Wechsel.',
    },
  ];

  /**
   * Handles a plan CTA for a signed-in user: shows an honest "booking is being
   * prepared" notice (no payment integration and no studio access is granted).
   */
  protected selectPlan(): void {
    this.bookingNotice.set(BOOKING_PENDING_NOTICE);
  }
}
