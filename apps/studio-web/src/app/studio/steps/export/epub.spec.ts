import { describe, expect, it } from 'vitest';
import {
  createEmptyProject,
  type BookProject,
} from '../../../core/models/book-project';
import { buildEpub, buildEpubBytes, buildZip } from './epub';

/** A project with one chapter for the EPUB tests. */
function sampleProject(): BookProject {
  const p = createEmptyProject('u1', 'Mein Buch');
  return {
    ...p,
    id: 'p1',
    author: 'Mara Feld',
    language: 'de',
    outline: [
      { id: 'c1', title: 'Der Anfang', goal: '', content: '## Los\nText.' },
    ],
  };
}

/** Reads the EPUB archive into a decoded string + byte view. */
function readEpub(): { text: string; bytes: Uint8Array } {
  const bytes = buildEpubBytes(sampleProject());
  return {
    text: new TextDecoder('utf-8', { fatal: false }).decode(bytes),
    bytes,
  };
}

describe('buildZip', () => {
  it('writes a store-only archive with the local-file signature first', () => {
    const zip = buildZip([{ name: 'mimetype', data: 'application/epub+zip' }]);
    expect([zip[0], zip[1], zip[2], zip[3]]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(zip[8]).toBe(0); // compression method = stored
    expect(zip[9]).toBe(0);
  });
});

describe('buildEpub', () => {
  it('returns an application/epub+zip blob', () => {
    expect(buildEpub(sampleProject()).type).toBe('application/epub+zip');
  });

  it('has the mimetype as the very first entry', () => {
    const { text } = readEpub();
    expect(text.indexOf('mimetype')).toBeLessThan(text.indexOf('META-INF'));
    expect(text).toContain('application/epub+zip');
  });

  it('contains the required EPUB-3 structure files', () => {
    const { text } = readEpub();
    for (const name of [
      'META-INF/container.xml',
      'OEBPS/content.opf',
      'OEBPS/nav.xhtml',
      'OEBPS/toc.ncx',
      'OEBPS/style.css',
    ]) {
      expect(text).toContain(name);
    }
  });

  it('carries the book metadata (title, language, author)', () => {
    const { text } = readEpub();
    expect(text).toContain('<dc:title>Mein Buch</dc:title>');
    expect(text).toContain('<dc:language>de</dc:language>');
    expect(text).toContain('<dc:creator>Mara Feld</dc:creator>');
  });

  it('includes a chapter document with the chapter title', () => {
    const { text } = readEpub();
    expect(text).toContain('OEBPS/ch1.xhtml');
    expect(text).toContain('Der Anfang');
  });
});
