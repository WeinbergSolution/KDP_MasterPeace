import { raw, type RawNode } from '../ast/raw-node.js';
import type {
  LegacyParseResult,
  MigrationWarning,
} from '../migration/diagnostics.js';
import { BlockParser } from './block-parser.js';
import { finalizeResult } from './parse-markup.js';

// Legacy backup importer (legacy-backup-schema.md): a `{ project, step }` (v2) or
// bare project (v1) backup becomes a full Book AST. Chapter/extra markup is
// parsed by the shared BlockParser; no content is silently dropped.

type Rec = Record<string, unknown>;

const META_KEYS = ['title', 'subtitle', 'author', 'audience', 'promise'];

/**
 * Builds the result for a backup that has no usable project object.
 *
 * @returns A parse result carrying a single PE-INVALID-BACKUP error.
 */
function invalidBackup(): LegacyParseResult {
  const error = {
    code: 'PE-INVALID-BACKUP',
    message: 'Backup has no project object',
    severity: 'error' as const,
  };
  return { document: null, warnings: [], errors: [error], sourceMap: [] };
}

/**
 * Type guard for a plain (non-array) object.
 *
 * @param value The value to test.
 * @returns True when value is a plain record.
 */
function isRecord(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Coerces a value to a record (empty when it is not one).
 *
 * @param value The value to coerce.
 * @returns The value as a record, or an empty record.
 */
function asRecord(value: unknown): Rec {
  return isRecord(value) ? value : {};
}

/**
 * Extracts the legacy project object, tolerating both backup schema variants.
 *
 * @param json The parsed backup JSON.
 * @returns The project record candidate (v2 `.project`, else the bare object).
 */
function extractProject(json: unknown): unknown {
  const root = asRecord(json);
  return isRecord(root['project']) ? root['project'] : json;
}

/**
 * Picks the given keys from a record where the value is a non-empty string.
 *
 * @param source The source record.
 * @param keys The keys to pick.
 * @returns A record of the present string values.
 */
function pickStrings(source: Rec, keys: string[]): Rec {
  const out: Rec = {};
  for (const key of keys)
    if (typeof source[key] === 'string' && source[key] !== '')
      out[key] = source[key];
  return out;
}

/** Imports a legacy workbook backup into a validated Book AST. */
export class LegacyImporter {
  private readonly warnings: MigrationWarning[] = [];

  /**
   * Imports a parsed legacy backup into a validated parse result.
   *
   * @param json The parsed backup JSON (v1 or v2).
   * @returns The Book AST parse result (document, warnings, errors, sourceMap).
   */
  import(json: unknown): LegacyParseResult {
    const project = extractProject(json);
    if (!isRecord(project)) return invalidBackup();
    return finalizeResult(this.buildRoot(project), 'de', this.warnings);
  }

  /**
   * Assembles the book root (front matter, chapters, back matter, metadata).
   *
   * @param project The legacy project record.
   * @returns The raw book root node.
   */
  private buildRoot(project: Rec): RawNode {
    const children = [
      ...this.frontMatter(project),
      ...this.chapters(project),
      ...this.backMatter(project),
    ];
    return raw('book', { attrs: pickStrings(project, META_KEYS), children });
  }

  /**
   * Parses one markup section, collecting its warnings.
   *
   * @param markup The section markup (ignored when not a non-empty string).
   * @returns The parsed raw blocks (empty when there is no content).
   */
  private section(markup: unknown): RawNode[] {
    if (typeof markup !== 'string' || markup.trim() === '') return [];
    const { blocks, warnings } = new BlockParser().parse(markup);
    this.warnings.push(...warnings);
    return blocks;
  }

  /**
   * Builds the front matter from the legacy intro and how-to-use sections.
   *
   * @param project The legacy project record.
   * @returns A single frontMatter node, or nothing when empty.
   */
  private frontMatter(project: Rec): RawNode[] {
    const extras = asRecord(project['extras']);
    const children = [
      ...this.section(extras['einleitung']),
      ...this.section(extras['arbeitsweise']),
    ];
    return children.length > 0 ? [raw('frontMatter', { children })] : [];
  }

  /**
   * Builds chapter nodes from the legacy outline.
   *
   * @param project The legacy project record.
   * @returns One chapter node per outline entry.
   */
  private chapters(project: Rec): RawNode[] {
    const outline = Array.isArray(project['outline']) ? project['outline'] : [];
    return outline.map((entry) => this.chapter(asRecord(entry)));
  }

  /**
   * Builds one chapter node from a legacy outline entry.
   *
   * @param entry The outline entry record.
   * @returns The chapter node with parsed content.
   */
  private chapter(entry: Rec): RawNode {
    return raw('chapter', {
      attrs: pickStrings(entry, ['title', 'goal']),
      children: this.section(entry['content']),
    });
  }

  /**
   * Builds the back matter from closing word, author bio and bonus sections.
   *
   * @param project The legacy project record.
   * @returns A single backMatter node, or nothing when empty.
   */
  private backMatter(project: Rec): RawNode[] {
    const extras = asRecord(project['extras']);
    const author = this.section(extras['autorin']);
    const authorNode =
      author.length > 0 ? [raw('authorProfile', { children: author })] : [];
    const children = [
      ...this.section(extras['schlusswort']),
      ...authorNode,
      ...this.section(extras['bonus']),
    ];
    return children.length > 0 ? [raw('backMatter', { children })] : [];
  }
}

/**
 * Imports a legacy workbook backup into a validated Book AST.
 *
 * @param json The parsed backup JSON (v1 or v2).
 * @returns The Book AST parse result.
 */
export function importLegacyBackup(json: unknown): LegacyParseResult {
  return new LegacyImporter().import(json);
}
