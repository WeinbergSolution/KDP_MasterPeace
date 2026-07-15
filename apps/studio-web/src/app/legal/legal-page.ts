import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

// Shared legal page for /impressum, /datenschutz, /nutzungsbedingungen. The
// document key comes from route data. Content is placeholder scaffolding and is
// explicitly marked as not legally reviewed (no false claim of legal validity).

const TITLES: Record<string, string> = {
  impressum: 'Impressum',
  datenschutz: 'Datenschutzerklärung',
  nutzungsbedingungen: 'Nutzungsbedingungen',
};

/** Renders one of the legal pages selected by route data `doc`. */
@Component({
  selector: 'app-legal-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './legal-page.html',
  styleUrl: './legal-page.scss',
})
export class LegalPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly docKey =
    (this.route.snapshot.data['doc'] as string) ?? 'impressum';
  protected readonly title = TITLES[this.docKey] ?? 'Rechtliches';
}
