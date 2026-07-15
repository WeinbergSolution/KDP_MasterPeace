import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import type { BookDocument } from '@kdp/contracts';
import { importLegacyBackup } from '@kdp/document-model';
import { loadGoldenMaster } from '@kdp/testing';
import { BookPreviewComponent } from './book-preview';

/**
 * Renders a document through BookPreviewComponent and returns the host element.
 *
 * @param document The book document to render.
 * @returns The rendered host HTML element.
 */
function render(document: BookDocument): HTMLElement {
  const fixture = TestBed.createComponent(BookPreviewComponent);
  fixture.componentRef.setInput('document', document);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('BookPreviewComponent', () => {
  it('renders every golden-master construct as safe DOM', () => {
    const document = importLegacyBackup(loadGoldenMaster('v2')).document!;
    const host = render(document);
    expect(
      host.querySelectorAll('h2.ast-chapter__title').length,
    ).toBeGreaterThan(0);
    expect(
      host.querySelector('.ast-checkitem input[type="checkbox"]'),
    ).not.toBeNull();
    expect(host.querySelector('.ast-box--exercise')).not.toBeNull();
    expect(host.querySelector('.ast-box--tip')).not.toBeNull();
    expect(host.querySelectorAll('.ast-writingline').length).toBeGreaterThan(0);
    expect(host.querySelector('.ast-scale__points')?.children.length).toBe(10);
    expect(host.querySelector('.ast-quote')).not.toBeNull();
    expect(host.querySelector('strong')?.textContent).toBeTruthy();
  });

  it('never emits raw markup as HTML (no unescaped fence text)', () => {
    const document = importLegacyBackup(loadGoldenMaster('v2')).document!;
    const host = render(document);
    // The unknown fence line is preserved as escaped paragraph text, not markup.
    expect(host.textContent).toContain(':::unbekannt');
    expect(host.querySelector('.ast-fallback')).toBeNull();
  });

  it('renders an empty document without error', () => {
    const empty: BookDocument = {
      schemaVersion: 1,
      language: 'de',
      root: { id: 'root', type: 'book' },
    };
    expect(() => render(empty)).not.toThrow();
  });

  it('shows a visible fallback for an unknown node type', () => {
    const doc = {
      schemaVersion: 1,
      language: 'de',
      root: {
        id: 'root',
        type: 'book',
        children: [{ id: 'root.0', type: 'legalNotice', text: 'legal' }],
      },
    } as BookDocument;
    const host = render(doc);
    expect(host.querySelector('.ast-fallback')).not.toBeNull();
    expect(host.textContent).toContain('legal');
  });
});
