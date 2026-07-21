// Real EPUB-3 builder (ported 1:1 from Legacy V3), including a dependency-free
// store-only ZIP writer so the archive has the required shape: an uncompressed
// `mimetype` first entry, META-INF/container.xml, OEBPS/content.opf, nav.xhtml,
// toc.ncx, a stylesheet and one XHTML document per section.

import type { BookProject } from '../../../core/models/book-project';
import { FONT_FAMILIES } from '../writing-utils';
import { type BookStrings, bookStrings } from './book-strings';
import { esc, parseBlocks } from './block-parse';
import { blocksToHtml } from './blocks-html';

/** A single EPUB content document. */
interface EpubDoc {
  id: string;
  title: string;
  body: string;
}

/** A ZIP entry (name + string or byte payload). */
interface ZipEntry {
  name: string;
  data: string | Uint8Array;
}

/** Builds the CRC-32 lookup table. */
function buildCrcTable(): Uint32Array {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
}

const CRC_TABLE = buildCrcTable();

/** Computes the CRC-32 of a byte array. */
function crc32(buf: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

const u16 = (v: number): Uint8Array =>
  new Uint8Array([v & 255, (v >> 8) & 255]);
const u32 = (v: number): Uint8Array =>
  new Uint8Array([v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255]);

/** Concatenates byte arrays into one. */
function concatBytes(list: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(list.reduce((n, a) => n + a.length, 0));
  let pos = 0;
  for (const a of list) {
    out.set(a, pos);
    pos += a.length;
  }
  return out;
}

/** Builds one local file record (30-byte header + name + data). */
function localRecord(
  name: Uint8Array,
  data: Uint8Array,
  crc: number,
): Uint8Array {
  const buf = new Uint8Array(30 + name.length + data.length);
  const dv = new DataView(buf.buffer);
  dv.setUint32(0, 0x04034b50, true);
  dv.setUint16(4, 20, true);
  dv.setUint16(6, 0x0800, true);
  dv.setUint32(14, crc, true);
  dv.setUint32(18, data.length, true);
  dv.setUint32(22, data.length, true);
  dv.setUint16(26, name.length, true);
  buf.set(name, 30);
  buf.set(data, 30 + name.length);
  return buf;
}

/** Builds one central-directory record (46-byte header + name). */
function centralRecord(
  name: Uint8Array,
  data: Uint8Array,
  crc: number,
  offset: number,
): Uint8Array {
  const buf = new Uint8Array(46 + name.length);
  const dv = new DataView(buf.buffer);
  dv.setUint32(0, 0x02014b50, true);
  dv.setUint16(4, 20, true);
  dv.setUint16(6, 20, true);
  dv.setUint16(8, 0x0800, true);
  dv.setUint32(16, crc, true);
  dv.setUint32(20, data.length, true);
  dv.setUint32(24, data.length, true);
  dv.setUint16(28, name.length, true);
  dv.setUint32(42, offset, true);
  buf.set(name, 46);
  return buf;
}

/** Builds the local + central records for all entries. */
function zipRecords(entries: ZipEntry[]): {
  local: Uint8Array[];
  central: Uint8Array[];
  offset: number;
} {
  const enc = new TextEncoder();
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const e of entries) {
    const name = enc.encode(e.name);
    const data = typeof e.data === 'string' ? enc.encode(e.data) : e.data;
    const crc = crc32(data);
    const rec = localRecord(name, data, crc);
    local.push(rec);
    central.push(centralRecord(name, data, crc, offset));
    offset += rec.length;
  }
  return { local, central, offset };
}

/**
 * Builds a store-only (uncompressed) ZIP archive.
 *
 * @param entries The ZIP entries.
 * @returns The archive bytes.
 */
export function buildZip(entries: ZipEntry[]): Uint8Array {
  const { local, central, offset } = zipRecords(entries);
  const cd = concatBytes(central);
  const eocd = concatBytes([
    u32(0x06054b50),
    u16(0),
    u16(0),
    u16(entries.length),
    u16(entries.length),
    u32(cd.length),
    u32(offset),
    u16(0),
  ]);
  return concatBytes([...local, cd, eocd]);
}

/** Wraps a body fragment in an XHTML document. */
function xhtmlWrap(title: string, body: string, lang: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${lang}" lang="${lang}">
<head><title>${esc(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>${body}</body></html>`;
}

/** Builds the title-page document. */
function titleDoc(project: BookProject): EpubDoc {
  return {
    id: 'titlepage',
    title: project.title || 'Titel',
    body: `<div class="titlepage"><h1 class="tt">${esc(project.title || '')}</h1><p class="st">${esc(project.subtitle || '')}</p><p class="au">${esc(project.author || '')}</p></div>`,
  };
}

/** Builds the copyright document. */
function copyrightDoc(project: BookProject, S: BookStrings): EpubDoc {
  const isRoman = project.bookType === 'roman';
  const disclaimer = isRoman ? S.disclaimerFiction : S.disclaimerSelfhelp;
  return {
    id: 'copyright',
    title: 'Copyright',
    body: `<div class="copyright"><p>${S.rights(new Date().getFullYear(), esc(project.author || ''))}</p><p>${S.copy}</p><p>${disclaimer}</p><p>${S.publisher}</p></div>`,
  };
}

/** Builds one chapter document. */
function chapterDoc(
  ch: { title: string; content: string },
  i: number,
  S: BookStrings,
): EpubDoc {
  return {
    id: `ch${i + 1}`,
    title: `${S.chapter} ${i + 1}: ${ch.title}`,
    body: `<p class="chnum">${S.chapter} ${i + 1}</p><h1>${esc(ch.title)}</h1>${blocksToHtml(parseBlocks(ch.content))}`,
  };
}

/** Builds a scaffold document (empty array when the content is blank). */
function extraDoc(id: string, title: string, content: string): EpubDoc[] {
  if (!content || !content.trim()) return [];
  return [
    {
      id,
      title,
      body: `<h1>${esc(title)}</h1>${blocksToHtml(parseBlocks(content))}`,
    },
  ];
}

/**
 * Builds the ordered list of EPUB content documents.
 *
 * @param project The book project.
 * @returns The content documents.
 */
function epubDocs(project: BookProject): EpubDoc[] {
  const S = bookStrings(project.language);
  const isRoman = project.bookType === 'roman';
  const ex = project.extras;
  const chapters = project.outline.map((ch, i) => chapterDoc(ch, i, S));
  return [
    titleDoc(project),
    copyrightDoc(project, S),
    ...extraDoc('intro', isRoman ? S.prolog : S.intro, ex.einleitung),
    ...(isRoman ? [] : extraDoc('howto', S.howto, ex.arbeitsweise)),
    ...chapters,
    ...extraDoc('closing', isRoman ? S.afterword : S.closing, ex.schlusswort),
    ...extraDoc('about', S.about, ex.autorin),
    ...(isRoman ? [] : extraDoc('bonus', S.bonus, ex.bonus)),
  ];
}

/** Builds the EPUB stylesheet. */
function epubCss(project: BookProject): string {
  const family =
    FONT_FAMILIES[project.settings.font] ?? FONT_FAMILIES['garamond'];
  return `body{font-family:${family};line-height:1.6;}
h1{font-size:1.7em;line-height:1.2;margin:0 0 0.8em;} h2{font-size:1.3em;margin:1.2em 0 0.4em;} h3{font-size:1.1em;margin:1em 0 0.3em;}
p{margin:0 0 0.6em;} .chnum{font-size:0.8em;letter-spacing:0.2em;text-transform:uppercase;color:#666;}
blockquote{margin:1em 1.5em;font-style:italic;}
.titlepage{text-align:center;margin-top:20%;} .tt{font-size:2em;} .st{font-style:italic;} .au{letter-spacing:0.15em;text-transform:uppercase;margin-top:2em;} .copyright{font-size:0.85em;margin-top:60%;}
.li{margin:0 0 0.3em 1em;} .chk{margin:0 0 0.5em;} .box{display:inline-block;width:0.85em;height:0.85em;border:1px solid #333;border-radius:2px;margin-right:0.5em;vertical-align:-0.1em;}
.wlines{margin:0.6em 0 1em;} .wline{border-bottom:1px solid #999;height:1.8em;}
.skala p{margin-bottom:0.3em;} .skrow span{display:inline-block;width:1.5em;height:1.5em;border:1px solid #333;border-radius:50%;text-align:center;line-height:1.5em;margin-right:0.3em;font-size:0.85em;}
.ebox{border:1px solid #333;border-radius:6px;padding:0.8em 1em;margin:1em 0;} .ebox.tipp{border-style:dashed;}
.elabel{font-weight:bold;font-size:0.8em;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:0.4em;}`;
}

/** Builds the OPF package document. */
function epubOpf(
  project: BookProject,
  docs: EpubDoc[],
  uuid: string,
  lang: string,
): string {
  const manifest = docs
    .map(
      (d) =>
        `<item id="${d.id}" href="${d.id}.xhtml" media-type="application/xhtml+xml"/>`,
    )
    .join('\n    ');
  const spine = docs.map((d) => `<itemref idref="${d.id}"/>`).join('');
  const modified = new Date().toISOString().replace(/\.\d+Z/, 'Z');
  const meta = `<metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="bookid">${uuid}</dc:identifier><dc:title>${esc(project.title || 'Ohne Titel')}</dc:title><dc:language>${lang}</dc:language><dc:creator>${esc(project.author || '')}</dc:creator><meta property="dcterms:modified">${modified}</meta></metadata>`;
  const items = `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="css" href="style.css" media-type="text/css"/>${manifest}`;
  return `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">${meta}<manifest>${items}</manifest><spine toc="ncx">${spine}</spine></package>`;
}

/** Builds the navigation document (EPUB 3 nav + fallback NCX). */
function epubNav(docs: EpubDoc[], S: BookStrings, lang: string): string {
  const items = docs
    .map((d) => `<li><a href="${d.id}.xhtml">${esc(d.title)}</a></li>`)
    .join('\n      ');
  return xhtmlWrap(
    S.contents,
    `<nav epub:type="toc" xmlns:epub="http://www.idpf.org/2007/ops"><h1>${S.contents}</h1><ol>\n      ${items}\n    </ol></nav>`,
    lang,
  );
}

/** Builds the NCX navigation document. */
function epubNcx(project: BookProject, docs: EpubDoc[], uuid: string): string {
  const points = docs
    .map(
      (d, i) =>
        `<navPoint id="np${i + 1}" playOrder="${i + 1}"><navLabel><text>${esc(d.title)}</text></navLabel><content src="${d.id}.xhtml"/></navPoint>`,
    )
    .join('');
  const head = `<head><meta name="dtb:uid" content="${uuid}"/><meta name="dtb:depth" content="1"/><meta name="dtb:totalPageCount" content="0"/><meta name="dtb:maxPageNumber" content="0"/></head>`;
  return `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">${head}<docTitle><text>${esc(project.title || '')}</text></docTitle><navMap>${points}</navMap></ncx>`;
}

const CONTAINER_XML = `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`;

/**
 * Builds a valid EPUB-3 archive for the project.
 *
 * @param project The book project.
 * @returns The EPUB file as a Blob.
 */
/**
 * Assembles the ordered ZIP entries for the EPUB archive.
 *
 * @param project The book project.
 * @param docs The content documents.
 * @param uuid The book identifier.
 * @param lang The book language.
 * @returns The archive entries (mimetype first).
 */
function epubEntries(
  project: BookProject,
  docs: EpubDoc[],
  uuid: string,
  lang: string,
): ZipEntry[] {
  const S = bookStrings(lang);
  return [
    { name: 'mimetype', data: 'application/epub+zip' },
    { name: 'META-INF/container.xml', data: CONTAINER_XML },
    { name: 'OEBPS/content.opf', data: epubOpf(project, docs, uuid, lang) },
    { name: 'OEBPS/nav.xhtml', data: epubNav(docs, S, lang) },
    { name: 'OEBPS/toc.ncx', data: epubNcx(project, docs, uuid) },
    { name: 'OEBPS/style.css', data: epubCss(project) },
    ...docs.map((d) => ({
      name: `OEBPS/${d.id}.xhtml`,
      data: xhtmlWrap(d.title, d.body, lang),
    })),
  ];
}

/**
 * Builds the raw bytes of a valid EPUB-3 archive.
 *
 * @param project The book project.
 * @returns The EPUB archive bytes.
 */
export function buildEpubBytes(project: BookProject): Uint8Array {
  const lang = project.language || 'de';
  const docs = epubDocs(project);
  const uuid = `urn:uuid:${crypto.randomUUID()}`;
  return buildZip(epubEntries(project, docs, uuid, lang));
}

/**
 * Builds a valid EPUB-3 archive for the project.
 *
 * @param project The book project.
 * @returns The EPUB file as a Blob.
 */
export function buildEpub(project: BookProject): Blob {
  const bytes = buildEpubBytes(project);
  return new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/epub+zip',
  });
}
