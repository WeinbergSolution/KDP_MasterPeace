import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Public marketing landing page at `/`. Own brand (KDP MasterPeace); warm,
// publishing-SaaS look. No third-party assets, fonts or trackers.

/** A labelled workflow step shown in the "So funktioniert's" section. */
interface WorkflowStep {
  readonly index: number;
  readonly title: string;
  readonly text: string;
}

/** A short titled feature/benefit card. */
interface FeatureCard {
  readonly title: string;
  readonly text: string;
}

/** Public landing page presenting the product and routing to auth. */
@Component({
  selector: 'app-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingComponent {
  protected readonly year = new Date().getFullYear();

  protected readonly workflow: WorkflowStep[] = [
    {
      index: 1,
      title: 'Idee',
      text: 'Nische wählen, Konzept und Trends erkunden.',
    },
    {
      index: 2,
      title: 'Gliederung',
      text: 'Kapitelstruktur mit klarem roten Faden.',
    },
    {
      index: 3,
      title: 'Schreiben',
      text: 'Kapitel entwerfen, Live-Preview mitlesen.',
    },
    {
      index: 4,
      title: 'Formatierung',
      text: 'KDP-Trim, Schrift, Bundsteg, Satz.',
    },
    {
      index: 5,
      title: 'Cover',
      text: 'Maße, Rücken, Klappentext, Designbrief.',
    },
    { index: 6, title: 'Export', text: 'EPUB, Print-PDF, Digitalprodukt.' },
    {
      index: 7,
      title: 'KDP-Paket',
      text: 'Beschreibung, Keywords, Kategorien.',
    },
    {
      index: 8,
      title: 'Veröffentlichen',
      text: 'Preflight, Preis, Upload-Checkliste.',
    },
  ];

  protected readonly benefits: FeatureCard[] = [
    {
      title: 'Ein durchgehender Weg',
      text: 'Von der Marktchance bis zum Launch ohne Tool-Wechsel.',
    },
    {
      title: 'Sichtbare Vorschau',
      text: 'Dein Buch entsteht live mit — kein Blindflug.',
    },
    {
      title: 'KDP-genau',
      text: 'Formate, Bundsteg und Preflight nach den KDP-Vorgaben.',
    },
  ];

  protected readonly features: FeatureCard[] = [
    {
      title: 'Buchtypen',
      text: 'Workbook, Ratgeber und Roman mit eigenen Regeln.',
    },
    {
      title: 'Fünf Buchsprachen',
      text: 'DE, EN, ES, FR, IT — Buchsprache unabhängig von der Oberfläche.',
    },
    {
      title: 'Recherche',
      text: 'Trend-Radar, Digitalprodukte und Rezensions-Lücken.',
    },
    {
      title: 'Redaktion',
      text: 'Humanize, Korrektur, Typografie und Lesbarkeit.',
    },
    {
      title: 'Cover & Assets',
      text: 'Maßgenaue Cover-Vorlagen und Bild-Prompts.',
    },
    { title: 'Marketing', text: 'KDP-Paket, Serien- und Launch-Planung.' },
  ];

  protected readonly exports: string[] = [
    'EPUB 3',
    'Print-Interior-PDF',
    'Digitalprodukt-PDF',
    'Printables',
    'Zitatkarten',
    'Hörbuchskript',
  ];

  protected readonly audiences: FeatureCard[] = [
    {
      title: 'Selfpublisher:innen',
      text: 'Schneller von der Idee zum veröffentlichten Buch.',
    },
    {
      title: 'Coaches & Expert:innen',
      text: 'Wissen als Workbook oder Ratgeber verpacken.',
    },
    { title: 'Autor:innen', text: 'Romane mit sauberem Satz und Export.' },
  ];
}
