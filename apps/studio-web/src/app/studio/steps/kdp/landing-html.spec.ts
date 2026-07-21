import { describe, expect, it } from 'vitest';
import {
  createEmptyProject,
  type BookProject,
} from '../../../core/models/book-project';
import { buildLandingHtml } from './landing-html';

/** A project with a title, author and one chapter. */
function sampleProject(overrides: Partial<BookProject> = {}): BookProject {
  const p = createEmptyProject('u1', 'Genug');
  return {
    ...p,
    id: 'p1',
    author: 'Mara Feld',
    subtitle: 'Selbstwert',
    promise: 'Du baust deinen Selbstwert auf.',
    outline: [
      { id: 'c1', title: 'Der Anfang', goal: '', content: '## Los\nText.' },
    ],
    ...overrides,
  };
}

describe('buildLandingHtml', () => {
  const html = buildLandingHtml(sampleProject());

  it('includes the responsive viewport meta', () => {
    expect(html).toContain('name="viewport"');
  });

  it('includes the hero with title, subtitle and author', () => {
    expect(html).toContain('class="hero"');
    expect(html).toContain('Genug');
    expect(html).toContain('Mara Feld');
  });

  it('includes both purchase CTAs with the [KAUF-LINK] placeholder', () => {
    expect((html.match(/\[KAUF-LINK\]/g) ?? []).length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it('includes the benefit list, sample and fade-out', () => {
    expect(html).toContain('class="benefits"');
    expect(html).toContain('class="probe"');
    expect(html).toContain('class="fade"');
  });

  it('includes the newsletter block with the replace-form note', () => {
    expect(html).toContain('class="signup"');
    expect(html).toContain('durch den Einbett-Code');
  });

  it('includes imprint, privacy placeholders and copyright', () => {
    expect(html).toContain('[IMPRESSUM-LINK]');
    expect(html).toContain('[DATENSCHUTZ-LINK]');
    expect(html).toContain('©');
  });

  it('escapes manuscript HTML (no raw script tag)', () => {
    const evil = buildLandingHtml(
      sampleProject({
        outline: [
          {
            id: 'c1',
            title: '<script>alert(1)</script>',
            goal: '',
            content: 'x',
          },
        ],
      }),
    );
    expect(evil).not.toContain('<script>alert(1)</script>');
    expect(evil).toContain('&lt;script&gt;');
  });
});
