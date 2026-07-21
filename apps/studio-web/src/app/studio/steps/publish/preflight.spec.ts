import { describe, expect, it } from 'vitest';
import {
  createEmptyProject,
  type BookProject,
  type Chapter,
} from '../../../core/models/book-project';
import { runPreflight, type PreflightResult } from './preflight';

/** Builds a chapter with enough words to count as non-empty. */
function chapter(id: string): Chapter {
  return { id, title: `Kapitel ${id}`, goal: '', content: 'Wort '.repeat(40) };
}

/** A project that passes every preflight rule (the "Bereit ✓" case). */
function completeProject(): BookProject {
  const base = createEmptyProject('u1', 'Mein Titel');
  return {
    ...base,
    id: 'p1',
    subtitle: 'Untertitel',
    author: 'Mara Feld',
    outline: [chapter('c1'), chapter('c2')],
    cover: { ...base.cover, pageCount: 200, blurb: 'Ein Klappentext.' },
    kdp: {
      beschreibung: 'Eine gute Beschreibung.',
      keywords: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
    },
  };
}

/** Runs the preflight against a modified complete project. */
function run(
  overrides: Partial<BookProject>,
  missing: string[] = [],
): PreflightResult {
  return runPreflight({ ...completeProject(), ...overrides }, 200, missing);
}

describe('runPreflight', () => {
  it('reports zero errors and warnings for a complete project', () => {
    const r = run({});
    expect(r.errs).toBe(0);
    expect(r.warns).toBe(0);
    expect(r.checks.every((c) => c.level === 'ok')).toBe(true);
  });

  it('errors when the title is missing', () => {
    const r = run({ title: '' });
    expect(r.errs).toBeGreaterThan(0);
    expect(r.checks.some((c) => c.text.includes('Kein Titel'))).toBe(true);
  });

  it('warns when title + subtitle exceed 200 characters', () => {
    const r = run({ title: 'x'.repeat(150), subtitle: 'y'.repeat(60) });
    expect(r.checks.some((c) => /max\. 200/.test(c.text))).toBe(true);
  });

  it('errors when the author is missing', () => {
    expect(run({ author: '' }).errs).toBeGreaterThan(0);
  });

  it('errors when there are no chapters', () => {
    const r = run({ outline: [] });
    expect(r.checks.some((c) => c.text.includes('Noch keine Kapitel'))).toBe(
      true,
    );
  });

  it('warns about (near-)empty chapters', () => {
    const empty: Chapter = { id: 'e', title: 'Leer', goal: '', content: '' };
    const r = run({ outline: [chapter('c1'), empty] });
    expect(r.checks.some((c) => /\(fast\) leer/.test(c.text))).toBe(true);
  });

  it('errors below the hardcover page minimum', () => {
    const base = completeProject();
    const r = run({
      pub: { ...base.pub, binding: 'hardcover' },
      cover: { ...base.cover, pageCount: 50 },
    });
    expect(r.checks.some((c) => /Minimum für Hardcover/.test(c.text))).toBe(
      true,
    );
  });

  it('errors above the paperback page maximum', () => {
    const base = completeProject();
    const r = run({ cover: { ...base.cover, pageCount: 900 } });
    expect(r.checks.some((c) => /Maximum für dieses Format/.test(c.text))).toBe(
      true,
    );
  });

  it('warns when the gutter does not fit the page count', () => {
    const base = completeProject();
    const r = run({ cover: { ...base.cover, pageCount: 400 } });
    expect(r.checks.some((c) => /Bundsteg-Einstellung/.test(c.text))).toBe(
      true,
    );
  });

  it('warns about an over-long description', () => {
    const r = run({ kdp: { beschreibung: 'x'.repeat(4001), keywords: ['a'] } });
    expect(r.checks.some((c) => /max\. 4000/.test(c.text))).toBe(true);
  });

  it('warns when keywords are missing', () => {
    const r = run({ kdp: { beschreibung: 'd', keywords: [] } });
    expect(r.checks.some((c) => /Noch keine Keywords/.test(c.text))).toBe(true);
  });

  it('warns about a keyword over 50 characters', () => {
    const r = run({ kdp: { beschreibung: 'd', keywords: ['x'.repeat(51)] } });
    expect(r.checks.some((c) => /über 50 Zeichen/.test(c.text))).toBe(true);
  });

  it('warns about the [DEIN-LINK] placeholder', () => {
    const r = run({
      outline: [
        chapter('c1'),
        { ...chapter('c2'), content: 'Hol dir [DEIN-LINK]' },
      ],
    });
    expect(r.checks.some((c) => c.text.includes('[DEIN-LINK]'))).toBe(true);
  });

  it('warns when the scaffold is incomplete', () => {
    const r = run({}, ['Einleitung']);
    expect(r.checks.some((c) => /Buchgerüst unvollständig/.test(c.text))).toBe(
      true,
    );
  });

  it('warns when there is no blurb', () => {
    const base = completeProject();
    const r = run({ cover: { ...base.cover, blurb: '' } });
    expect(r.checks.some((c) => c.text.includes('Kein Klappentext'))).toBe(
      true,
    );
  });
});
