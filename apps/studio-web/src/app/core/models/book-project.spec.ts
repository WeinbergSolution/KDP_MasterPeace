import { describe, expect, it } from 'vitest';
import {
  createEmptyProject,
  normalizeProject,
  projectCopyFields,
} from './book-project';

describe('book-project', () => {
  it('creates an empty project with defaults and timestamps', () => {
    const p = createEmptyProject('uid-1', 'Mein Buch');
    expect(p.ownerId).toBe('uid-1');
    expect(p.title).toBe('Mein Buch');
    expect(p.language).toBe('de');
    expect(p.bookType).toBe('workbook');
    expect(p.createdAt).toBeGreaterThan(0);
  });

  it('normalizes unknown/invalid raw data to safe values', () => {
    const p = normalizeProject('doc-1', {
      title: 'X',
      language: 'xx',
      bookType: 'nope',
      chapterCount: 'bad',
    });
    expect(p.id).toBe('doc-1');
    expect(p.language).toBe('de');
    expect(p.bookType).toBe('workbook');
    expect(p.chapterCount).toBe(8);
  });

  it('copies only editable content fields', () => {
    const base = createEmptyProject('uid', 'T');
    const fields = projectCopyFields({ ...base, id: 'id', markup: 'M' });
    expect(fields.markup).toBe('M');
    expect('id' in fields).toBe(false);
    expect('title' in fields).toBe(false);
  });
});
