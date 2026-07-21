import { describe, expect, it } from 'vitest';
import {
  createEmptyProject,
  type BookProject,
  type Chapter,
} from '../../../core/models/book-project';
import {
  auditRows,
  cleanText,
  missingExtras,
  readabilityOf,
} from './export-audit';

/** Builds a project with the given chapters + book type for the audit tests. */
function projectWith(
  bookType: BookProject['bookType'],
  chapters: Chapter[],
): BookProject {
  return {
    ...createEmptyProject('u1', 'Test'),
    id: 'p1',
    bookType,
    outline: chapters,
  };
}

const wbChapter: Chapter = {
  id: 'c1',
  title: 'Kapitel',
  goal: '',
  content: '## Titel\n:::uebung Test\n[linien:3]\n- [ ] Punkt\n:::',
};

describe('auditRows', () => {
  it('detects exercise, lines and checklist for a workbook chapter', () => {
    const [row] = auditRows(projectWith('workbook', [wbChapter]));
    expect(row.uebung).toBe(true);
    expect(row.linien).toBe(true);
    expect(row.check).toBe(true);
  });

  it('flags a workbook chapter missing the elements', () => {
    const bare: Chapter = {
      id: 'c',
      title: 'K',
      goal: '',
      content: 'Nur Text.',
    };
    const [row] = auditRows(projectWith('workbook', [bare]));
    expect(row.uebung).toBe(false);
    expect(row.linien).toBe(false);
    expect(row.check).toBe(false);
  });

  it('marks all element columns true for a non-workbook (ratgeber)', () => {
    const bare: Chapter = {
      id: 'c',
      title: 'K',
      goal: '',
      content: 'Fließtext.',
    };
    const [row] = auditRows(projectWith('ratgeber', [bare]));
    expect(row.uebung && row.linien && row.check).toBe(true);
  });

  it('counts words', () => {
    const ch: Chapter = {
      id: 'c',
      title: 'K',
      goal: '',
      content: 'eins zwei drei',
    };
    expect(auditRows(projectWith('ratgeber', [ch]))[0].words).toBe(3);
  });
});

describe('missingExtras', () => {
  it('lists empty scaffold parts', () => {
    expect(missingExtras(projectWith('workbook', []))).toContain('Einleitung');
  });
});

describe('readabilityOf', () => {
  it('computes average sentence length and long-sentence count', () => {
    const text = 'Kurzer Satz. ' + 'Wort '.repeat(30) + '.';
    const r = readabilityOf(text);
    expect(r.long).toBeGreaterThanOrEqual(1);
    expect(r.avg).toBeGreaterThan(0);
  });

  it('counts filler words', () => {
    expect(readabilityOf('Das ist eigentlich irgendwie gut.').fill).toBe(2);
  });
});

describe('cleanText', () => {
  it('preserves the WP-C1 markup markers', () => {
    const input =
      '## Überschrift\n:::uebung Titel\n[linien:4]\n- [ ] Punkt\n[skala] Frage\n:::';
    const out = cleanText(input, 'de');
    expect(out).toContain('## Überschrift');
    expect(out).toContain(':::uebung Titel');
    expect(out).toContain('[linien:4]');
    expect(out).toContain('- [ ] Punkt');
    expect(out).toContain('[skala] Frage');
  });

  it('collapses multiple spaces and fixes punctuation spacing', () => {
    expect(cleanText('Hallo    Welt .Neu', 'de')).toBe('Hallo Welt. Neu');
  });

  it('applies German typographic quotes', () => {
    expect(cleanText('Er sagte "hallo".', 'de')).toContain('„hallo“');
  });
});
