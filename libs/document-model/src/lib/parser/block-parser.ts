import { raw, type NodeType, type RawNode } from '../ast/raw-node.js';
import type { MigrationWarning } from '../migration/diagnostics.js';
import { MW, migrationWarning } from '../migration/warning-codes.js';
import { parseInline } from './inline.js';

// Line-based block parser for the legacy workbook markup (legacy-backup-schema.md
// §4). Produces raw nodes (ids assigned later) and structured MW-* warnings.
// Consecutive list items are grouped into their list parent.

const BOX_TYPES: Record<string, NodeType> = {
  uebung: 'exerciseBox',
  übung: 'exerciseBox',
  tipp: 'tipBox',
  beispiel: 'exampleBox',
};

/** Parses one markup string into grouped raw blocks and migration warnings. */
export class BlockParser {
  private blocks: RawNode[] = [];
  private box: RawNode | null = null;
  private openList: { node: RawNode; kind: string } | null = null;
  private readonly warnings: MigrationWarning[] = [];

  /**
   * Parses markup into raw blocks plus warnings.
   *
   * @param markup The legacy markup string (any line endings).
   * @returns The top-level raw blocks and collected warnings.
   */
  parse(markup: string): { blocks: RawNode[]; warnings: MigrationWarning[] } {
    const lines = markup.replace(/\r\n?/g, '\n').split('\n');
    lines.forEach((line, index) => this.handleLine(line.trim(), index + 1));
    if (this.box)
      this.warnings.push(
        migrationWarning(MW.BOX_UNCLOSED, { line: this.box.line ?? 1 }),
      );
    return { blocks: this.blocks, warnings: this.warnings };
  }

  /**
   * Returns the container that new nodes are appended to (open box or top level).
   *
   * @returns The current target children array.
   */
  private target(): RawNode[] {
    return this.box ? (this.box.children ??= []) : this.blocks;
  }

  /**
   * Appends a non-list node and ends any open list grouping.
   *
   * @param node The node to append.
   */
  private push(node: RawNode): void {
    this.target().push(node);
    this.openList = null;
  }

  /**
   * Appends a list item, opening a new list container when the kind changes.
   *
   * @param kind The grouping kind ('unordered' | 'ordered' | 'checklist').
   * @param listType The list node type to create.
   * @param item The list item node.
   */
  private pushItem(kind: string, listType: NodeType, item: RawNode): void {
    if (!this.openList || this.openList.kind !== kind) {
      const list = raw(listType, { children: [] });
      this.target().push(list);
      this.openList = { node: list, kind };
    }
    (this.openList.node.children ??= []).push(item);
  }

  /**
   * Parses inline markup and records an unbalanced-bold warning if needed.
   *
   * @param text The inline text.
   * @param line The 1-based source line.
   * @returns The inline text runs.
   */
  private inline(text: string, line: number): RawNode[] {
    const { runs, unbalanced } = parseInline(text);
    if (unbalanced)
      this.warnings.push(
        migrationWarning(
          MW.BOLD_UNBALANCED,
          { line },
          { context: { original: text } },
        ),
      );
    return runs;
  }

  /**
   * Classifies and dispatches a single trimmed source line.
   *
   * @param l The trimmed line text.
   * @param line The 1-based source line number.
   */
  private handleLine(l: string, line: number): void {
    if (l.startsWith(':::')) return this.handleFence(l, line);
    if (l === '') return;
    if (l.startsWith('### '))
      return this.push(this.heading(3, l.slice(4), line));
    if (l.startsWith('## '))
      return this.push(this.heading(2, l.slice(3), line));
    if (l.startsWith('# ')) return this.degradedHeading(l.slice(2), line);
    this.handleInlineLine(l, line);
  }

  /**
   * Handles list-, quote-, scale-, lines- and paragraph-level lines.
   *
   * @param l The trimmed line text.
   * @param line The 1-based source line number.
   */
  private handleInlineLine(l: string, line: number): void {
    if (/^\[linien:\s*\d+\]/i.test(l)) return this.writingLines(l, line);
    if (/^\[skala\]/i.test(l)) return this.push(this.scale(l, line));
    if (l.startsWith('- [ ]') || l.startsWith('- [x]'))
      return this.checkItem(l, line);
    if (l.startsWith('> '))
      return this.push(this.textBlock('quote', l.slice(2), line));
    if (l.startsWith('- ') || l.startsWith('* '))
      return this.bullet(l.slice(2), line);
    if (/^\d+\.\s/.test(l)) return this.ordered(l, line);
    this.push(this.textBlock('paragraph', l, line, l));
  }

  /**
   * Builds a text-bearing block (paragraph or quote) with inline children.
   *
   * @param type The block node type.
   * @param text The inline text.
   * @param line Source line.
   * @param token Optional original source token.
   * @returns The text block raw node.
   */
  private textBlock(
    type: NodeType,
    text: string,
    line: number,
    token?: string,
  ): RawNode {
    return raw(type, {
      children: this.inline(text, line),
      line,
      originalToken: token,
    });
  }

  /**
   * Builds a heading node at the given level.
   *
   * @param level Heading level (2 or 3).
   * @param text Heading text.
   * @param line Source line.
   * @returns The heading raw node.
   */
  private heading(level: number, text: string, line: number): RawNode {
    return raw('heading', {
      attrs: { level },
      children: this.inline(text, line),
      line,
      originalToken: text,
    });
  }

  /**
   * Emits a level-2 heading for a legacy `# ` line and warns (MW-H1-DEGRADE).
   *
   * @param text Heading text.
   * @param line Source line.
   */
  private degradedHeading(text: string, line: number): void {
    this.warnings.push(
      migrationWarning(
        MW.H1_DEGRADE,
        { line },
        { context: { original: `# ${text}` } },
      ),
    );
    this.push(this.heading(2, text, line));
  }

  /**
   * Emits a writing-lines node, clamping the count to 15 (MW-LINES-CLAMP).
   *
   * @param l The trimmed line.
   * @param line Source line.
   */
  private writingLines(l: string, line: number): void {
    const requested = parseInt(l.match(/\d+/)?.[0] ?? '3', 10);
    const count = Math.min(15, requested);
    if (requested > 15)
      this.warnings.push(
        migrationWarning(
          MW.LINES_CLAMP,
          { line },
          { context: { requested, count } },
        ),
      );
    this.push(
      raw('writingLines', { attrs: { count }, line, originalToken: l }),
    );
  }

  /**
   * Builds a 1–10 scale node from a `[skala] question` line.
   *
   * @param l The trimmed line.
   * @param line Source line.
   * @returns The scale raw node.
   */
  private scale(l: string, line: number): RawNode {
    const question = l.replace(/^\[skala\]\s*/i, '');
    return raw('scale', {
      attrs: { min: 1, max: 10, question },
      line,
      originalToken: l,
    });
  }

  /**
   * Adds a checklist item, grouping consecutive items into one checklist.
   *
   * @param l The trimmed line.
   * @param line Source line.
   */
  private checkItem(l: string, line: number): void {
    const checked = l.startsWith('- [x]');
    const item = raw('checkItem', {
      attrs: { checked },
      children: this.inline(l.slice(5).trim(), line),
      line,
    });
    this.pushItem('checklist', 'checklist', item);
  }

  /**
   * Adds an unordered list item, grouping consecutive bullets.
   *
   * @param text Item text.
   * @param line Source line.
   */
  private bullet(text: string, line: number): void {
    const item = raw('listItem', { children: this.inline(text, line), line });
    this.pushItem('unordered', 'unorderedList', item);
  }

  /**
   * Adds an ordered list item and warns when source numbering is not 1..n.
   *
   * @param l The trimmed line.
   * @param line Source line.
   */
  private ordered(l: string, line: number): void {
    const sourceNumber = parseInt(l.match(/^(\d+)\./)?.[1] ?? '0', 10);
    const current =
      this.openList?.kind === 'ordered'
        ? (this.openList.node.children?.length ?? 0)
        : 0;
    if (sourceNumber !== current + 1)
      this.warn(MW.OL_INDEX, line, { sourceNumber, expected: current + 1 });
    const item = raw('listItem', {
      children: this.inline(l.replace(/^\d+\.\s/, ''), line),
      line,
    });
    this.pushItem('ordered', 'orderedList', item);
  }

  /**
   * Pushes a documented MW-* migration warning for a source line.
   *
   * @param code The MW-* warning code.
   * @param line The source line.
   * @param context Optional machine-readable context.
   */
  private warn(
    code: (typeof MW)[keyof typeof MW],
    line: number,
    context?: Record<string, unknown>,
  ): void {
    this.warnings.push(
      migrationWarning(code, { line }, context ? { context } : {}),
    );
  }

  /**
   * Handles a `:::` fence line: open/close a box or preserve an unknown fence.
   *
   * @param l The trimmed line.
   * @param line Source line.
   */
  private handleFence(l: string, line: number): void {
    if (this.box && l === ':::') return this.closeBox();
    const match = l.match(/^:::(uebung|übung|tipp|beispiel)\s*(.*)$/i);
    if (match) return this.openBox(match[1].toLowerCase(), match[2], line);
    this.warnings.push(
      migrationWarning(MW.BOX_UNKNOWN, { line }, { context: { original: l } }),
    );
    this.push(
      raw('paragraph', {
        children: this.inline(l, line),
        line,
        originalToken: l,
      }),
    );
  }

  /**
   * Opens a typed box (closing any previously open box first).
   *
   * @param kindToken The lowercase box keyword.
   * @param title The optional box title.
   * @param line Source line.
   */
  private openBox(kindToken: string, title: string, line: number): void {
    this.box = null;
    const box = raw(BOX_TYPES[kindToken], { children: [], line });
    if (title.trim()) box.attrs = { title: title.trim() };
    this.blocks.push(box);
    this.box = box;
    this.openList = null;
  }

  /**
   * Closes the currently open box.
   */
  private closeBox(): void {
    this.box = null;
    this.openList = null;
  }
}
