import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { StudioTopbarComponent } from './studio-topbar';
import { AuthService } from '../../core/firebase/auth.service';
import { EntitlementService } from '../../core/firebase/entitlement.service';
import { STEP_LABELS } from '../project-stats';

/** Builds fake auth + entitlement services with signal-backed state. */
function fakes() {
  const logout = vi.fn().mockResolvedValue(undefined);
  const clear = vi.fn();
  const auth = {
    isReady: signal(true),
    isAuthenticated: () => true,
    displayName: signal('Erika Mustermann'),
    currentUser: signal({ email: 'erika@example.com' }),
    logout,
  };
  const entitlement = {
    isActive: signal(true),
    entitlement: signal({
      status: 'active',
      planId: 'creator',
      billingCycle: 'annual',
      source: 'test_phase',
    }),
    refresh: vi.fn().mockResolvedValue(undefined),
    clear,
  };
  return { auth, entitlement, logout, clear };
}

/** Mounts the topbar with the given fakes and returns the fixture + element. */
async function mount(f: ReturnType<typeof fakes>) {
  await TestBed.configureTestingModule({
    imports: [StudioTopbarComponent],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: f.auth as unknown as AuthService },
      {
        provide: EntitlementService,
        useValue: f.entitlement as unknown as EntitlementService,
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(StudioTopbarComponent);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

/** Opens the account menu by clicking the avatar. */
function openMenu(el: HTMLElement, fixture: { detectChanges(): void }) {
  el.querySelector<HTMLButtonElement>('.stopbar__avatar')!.click();
  fixture.detectChanges();
}

describe('StudioTopbarComponent', () => {
  let f: ReturnType<typeof fakes>;
  beforeEach(() => {
    f = fakes();
  });

  it('shows the active plan and the test-access note', async () => {
    const { el } = await mount(f);
    expect(el.querySelector('.stopbar__plan-name')?.textContent).toContain(
      'Creator · jährlich',
    );
    expect(el.querySelector('.stopbar__badge')?.textContent).toContain(
      'Testzugang',
    );
  });

  it('shows the display name and initials', async () => {
    const { el } = await mount(f);
    expect(el.querySelector('.stopbar__initial')?.textContent).toContain('EM');
    expect(el.querySelector('.stopbar__avatar-name')?.textContent).toContain(
      'Erika Mustermann',
    );
  });

  it('links "Mein Konto", "Tarif wechseln" and "Zur Landingpage" correctly', async () => {
    const { el, fixture } = await mount(f);
    openMenu(el, fixture);
    const hrefs = Array.from(el.querySelectorAll('a.stopbar__item')).map((a) =>
      a.getAttribute('href'),
    );
    expect(hrefs).toContain('/konto');
    expect(hrefs).toContain('/tarif-waehlen?change=1');
    expect(hrefs).toContain('/');
  });

  it('logs out, clears the entitlement and navigates home', async () => {
    const { el, fixture } = await mount(f);
    const router = TestBed.inject(Router);
    const nav = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    openMenu(el, fixture);
    el.querySelector<HTMLButtonElement>('.stopbar__item--btn')!.click();
    await fixture.whenStable();
    expect(f.logout).toHaveBeenCalled();
    expect(f.clear).toHaveBeenCalled();
    expect(nav).toHaveBeenCalledWith('/');
  });

  it('is keyboard operable: a real button trigger and focusable menu items', async () => {
    const { el, fixture } = await mount(f);
    const trigger = el.querySelector<HTMLButtonElement>('.stopbar__avatar')!;
    expect(trigger.tagName).toBe('BUTTON');
    expect(trigger.getAttribute('aria-controls')).toBe('studio-account-menu');
    openMenu(el, fixture);
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    for (const item of Array.from(el.querySelectorAll('.stopbar__item')))
      expect(['A', 'BUTTON']).toContain(item.tagName);
  });

  it('closes the menu on Escape', async () => {
    const { el, fixture } = await mount(f);
    openMenu(el, fixture);
    expect(el.querySelector('.stopbar__menu')).not.toBeNull();
    el.querySelector('.stopbar')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    fixture.detectChanges();
    expect(el.querySelector('.stopbar__menu')).toBeNull();
  });

  it('leaves the eight studio steps unchanged (additive only)', () => {
    expect(STEP_LABELS.length).toBe(8);
  });
});
