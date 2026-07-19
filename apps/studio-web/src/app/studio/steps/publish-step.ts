import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Check, Copy, LucideAngularModule, ShieldCheck } from 'lucide-angular';
import type { PubSpec } from '../../core/models/book-project';
import { ActiveProjectService } from '../active-project.service';
import { computeRailStats } from '../project-stats';
import { TRIM_LABELS } from './writing-utils';
import { missingExtras } from './export/export-audit';
import { KDP_GUIDE } from './publish/kdp-guide';
import { computePricing, type Pricing } from './publish/pricing';
import { runPreflight, type PreflightResult } from './publish/preflight';

// Step 8 (Veröffentlichen), ported 1:1 from the Legacy V3 reference: the KDP
// pre-flight check (tested domain rules), the non-binding price calculator and
// the 9-step upload guide. All KDP limits come from the central, versioned
// KDP_RULES. The tool guides the user but never publishes to Amazon itself.

const COPIED_MS = 1500;
const EMPTY_PREFLIGHT: PreflightResult = { checks: [], errs: 0, warns: 0 };

/** Publishing step (pre-flight, price calculator, upload guide). */
@Component({
  selector: 'app-publish-step',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  templateUrl: './publish-step.html',
})
export class PublishStepComponent {
  private readonly active = inject(ActiveProjectService);

  protected readonly copied = signal('');
  protected readonly project = this.active.current;
  protected readonly guide = KDP_GUIDE;
  protected readonly guideTotal = KDP_GUIDE.length;

  protected readonly preflight = computed<PreflightResult>(() => {
    const p = this.active.current();
    if (!p) return EMPTY_PREFLIGHT;
    return runPreflight(p, computeRailStats(p).pages, missingExtras(p));
  });
  protected readonly badgeClass = computed(() => {
    const pf = this.preflight();
    return pf.errs ? 'bad-bg' : pf.warns ? 'warn-bg' : 'ok-bg';
  });
  protected readonly badgeText = computed(() => {
    const pf = this.preflight();
    return pf.errs
      ? `${pf.errs} Fehler`
      : pf.warns
        ? `${pf.warns} Hinweise`
        : 'Bereit ✓';
  });
  protected readonly pricingPages = computed(() => {
    const p = this.active.current();
    return p ? p.cover.pageCount || computeRailStats(p).pages : 0;
  });
  protected readonly pricing = computed<Pricing>(() => {
    const p = this.active.current();
    return computePricing(
      this.pricingPages(),
      p?.pub.binding ?? 'paperback',
      p?.pub.price ?? 0,
      p?.pub.ebookPrice ?? 0,
    );
  });
  protected readonly guideDone = computed(
    () =>
      Object.values(this.active.current()?.pub.checks ?? {}).filter(Boolean)
        .length,
  );
  protected readonly isHardcover = computed(
    () => this.active.current()?.pub.binding === 'hardcover',
  );
  protected readonly hasKdp = computed(() => !!this.active.current()?.kdp);
  protected readonly trimLabel = computed(() =>
    (TRIM_LABELS[this.active.current()?.settings.trim ?? '7x10'] ?? '')
      .split('(')[0]
      .trim(),
  );
  protected readonly paperLabel = computed(() =>
    this.active.current()?.cover.paper === 'white' ? 'Weißes' : 'Cremefarbenes',
  );

  protected readonly shieldIcon = ShieldCheck;
  protected readonly copyIcon = Copy;
  protected readonly checkIcon = Check;

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

  /** Copies the KDP description (from the generated package). */
  protected copyBeschreibung(): void {
    const d = (this.active.current()?.kdp?.['beschreibung'] as string) || '';
    this.copyText('g-d', d);
  }

  /** Copies all 7 keywords as a semicolon-separated list. */
  protected copyKeywords(): void {
    const kws = (this.active.current()?.kdp?.['keywords'] as string[]) || [];
    this.copyText('g-kw', kws.join('; '));
  }

  /**
   * Applies a partial publishing-config edit (autosaved to the project).
   *
   * @param patch The publishing fields to change.
   */
  private upPub(patch: Partial<PubSpec>): void {
    const p = this.active.current();
    if (p) this.active.patch({ pub: { ...p.pub, ...patch } });
  }

  /**
   * Changes the binding (paperback / hardcover).
   *
   * @param value The chosen binding.
   */
  protected onBinding(value: string): void {
    this.upPub({ binding: value });
  }

  /**
   * Sets the print list price from the input value.
   *
   * @param value The raw input value.
   */
  protected onPrice(value: string): void {
    this.upPub({ price: parseFloat(value) || 0 });
  }

  /**
   * Sets the e-book price from the input value.
   *
   * @param value The raw input value.
   */
  protected onEbookPrice(value: string): void {
    this.upPub({ ebookPrice: parseFloat(value) || 0 });
  }

  /**
   * Toggles a guide step's "done" flag (reversible, persisted).
   *
   * @param k The guide-step key.
   */
  protected togglePubCheck(k: string): void {
    const checks = this.active.current()?.pub.checks ?? {};
    this.upPub({ checks: { ...checks, [k]: !checks[k] } });
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
