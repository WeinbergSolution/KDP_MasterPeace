import { describe, expect, it } from 'vitest';
import {
  createEmptyProject,
  type BookProject,
  type Chapter,
} from '../../../core/models/book-project';
import { collectQuotes } from './quotes';

/** Builds a project with the given chapter contents. */
function withChapters(contents: string[]): BookProject {
  const outline: Chapter[] = contents.map((content, i) => ({
    id: `c${i}`,
    title: `K${i}`,
    goal: '',
    content,
  }));
  return { ...createEmptyProject('u1', 'Q'), id: 'p1', outline };
}

describe('collectQuotes', () => {
  it('extracts quotes from "> " lines', () => {
    const quotes = collectQuotes(
      withChapters([
        'Text.\n> Du musst dich nicht beweisen, um wertvoll zu sein.',
      ]),
    );
    expect(quotes).toContain(
      'Du musst dich nicht beweisen, um wertvoll zu sein.',
    );
  });

  it('removes duplicate quotes', () => {
    const q = '> Kleine Schritte schlagen großen Vorsatz jeden Tag.';
    const quotes = collectQuotes(withChapters([q, q]));
    expect(quotes.length).toBe(1);
  });

  it('ignores quotes that are too short', () => {
    expect(collectQuotes(withChapters(['> Zu kurz']))).toEqual([]);
  });

  it('caps the number of quotes at 12', () => {
    const many = Array.from(
      { length: 20 },
      (_u, i) => `> Merksatz Nummer ${i} über Selbstwert und Wachstum.`,
    ).join('\n');
    expect(collectQuotes(withChapters([many])).length).toBe(12);
  });
});
