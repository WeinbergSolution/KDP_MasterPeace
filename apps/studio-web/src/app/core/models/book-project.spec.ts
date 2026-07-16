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
    expect(p.chapterCount).toBe(8);
    expect(p.createdAt).toBeGreaterThan(0);
  });

  it('normalizes raw data, filling missing fields from defaults (lossless)', () => {
    const p = normalizeProject('doc-1', { title: 'X', author: 'A' });
    expect(p.id).toBe('doc-1');
    expect(p.title).toBe('X');
    expect(p.author).toBe('A');
    expect(p.language).toBe('de');
    expect(p.bookType).toBe('workbook');
    expect(p.extras.einleitung).toBe('');
    expect(p.cover.paper).toBe('cream');
    expect(Array.isArray(p.outline)).toBe(true);
  });

  it('preserves nested sections that are stored', () => {
    const p = normalizeProject('doc-2', {
      voice: { sample: 'S', profile: 'P' },
      settings: { trim: '6x9' },
    });
    expect(p.voice.sample).toBe('S');
    expect(p.settings.trim).toBe('6x9');
    expect(p.settings.font).toBe('garamond');
  });

  it('copies content fields and labels the copy, excluding id/owner', () => {
    const base = createEmptyProject('uid', 'T');
    const fields = projectCopyFields({ ...base, id: 'id' });
    expect(fields.title).toBe('T (Kopie)');
    expect('id' in fields).toBe(false);
    expect('ownerId' in fields).toBe(false);
    expect(fields.bookType).toBe('workbook');
  });
});
