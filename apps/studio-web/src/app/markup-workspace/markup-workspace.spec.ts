import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MarkupWorkspaceComponent } from './markup-workspace';

/**
 * Types markup into the editor and flushes the debounced parse.
 *
 * @param fixture The workspace component fixture.
 * @param value The markup to type.
 */
function typeMarkup(
  fixture: ComponentFixture<MarkupWorkspaceComponent>,
  value: string,
): void {
  const textarea = fixture.nativeElement.querySelector(
    'textarea',
  ) as HTMLTextAreaElement;
  textarea.value = value;
  textarea.dispatchEvent(new Event('input'));
  vi.advanceTimersByTime(400);
  fixture.detectChanges();
}

describe('MarkupWorkspaceComponent', () => {
  let fixture: ComponentFixture<MarkupWorkspaceComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({
      imports: [MarkupWorkspaceComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(MarkupWorkspaceComponent);
    fixture.detectChanges();
    host = fixture.nativeElement as HTMLElement;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders editor, preview and three demo buttons', () => {
    expect(host.querySelector('#markup-input')).not.toBeNull();
    expect(host.querySelector('kdp-book-preview')).not.toBeNull();
    expect(host.querySelectorAll('.workspace__demo').length).toBe(3);
  });

  it('renders the initial demo content in the preview', () => {
    expect(host.querySelector('.book-page')).not.toBeNull();
    expect(host.textContent).toContain('Selbstwert');
  });

  it('updates preview and warnings after editing markup', () => {
    typeMarkup(fixture, '# Legacy title\ntext');
    expect(host.textContent).toContain('MW-H1-DEGRADE');
    expect(host.querySelector('.ast-heading')?.textContent).toContain(
      'Legacy title',
    );
  });

  it('switches demo language content', () => {
    const buttons =
      host.querySelectorAll<HTMLButtonElement>('.workspace__demo');
    buttons[1].click();
    fixture.detectChanges();
    expect(host.textContent).toContain('self-worth');
  });

  it('reports a clean status for valid markup without warnings', () => {
    typeMarkup(fixture, '## Clean heading\nJust a paragraph.');
    expect(host.querySelector('.workspace__status')?.textContent).toContain(
      'keine Warnungen',
    );
  });
});
