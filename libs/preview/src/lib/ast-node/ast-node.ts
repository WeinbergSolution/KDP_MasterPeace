import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { DocumentNode } from '@kdp/contracts';

// Recursive, safe renderer for one Book AST node. Renders known node types via a
// declarative template switch and falls back visibly for unknown nodes. Never
// uses innerHTML; children recurse through this same component.

const MAX_WRITING_LINES = 15;
const SCALE_POINTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/** Renders a single canonical Book AST node and its children. */
@Component({
  selector: 'kdp-ast-node',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ast-node.html',
  styleUrl: './ast-node.scss',
})
export class AstNodeComponent {
  @Input({ required: true }) node!: DocumentNode;

  protected readonly scalePoints = SCALE_POINTS;

  /**
   * Reads a string attribute of the node.
   *
   * @param key The attribute name.
   * @returns The attribute value as a string (empty when absent).
   */
  protected attr(key: string): string {
    const value = this.node.attrs?.[key];
    return value === undefined || value === null ? '' : String(value);
  }

  /**
   * Computes the heading level, defaulting to 2.
   *
   * @returns The heading level (2 or 3).
   */
  protected headingLevel(): number {
    return Number(this.node.attrs?.['level']) === 3 ? 3 : 2;
  }

  /**
   * Builds the (clamped) array of writing-line placeholders.
   *
   * @returns An array with one entry per writing line.
   */
  protected writingLines(): number[] {
    const count = Math.min(
      MAX_WRITING_LINES,
      Number(this.node.attrs?.['count']) || 0,
    );
    return Array.from(
      { length: Math.max(0, count) },
      (_unused, index) => index,
    );
  }

  /**
   * Reports whether the node is a checked checklist item.
   *
   * @returns True when the node's `checked` attribute is true.
   */
  protected isChecked(): boolean {
    return this.node.attrs?.['checked'] === true;
  }

  /**
   * Reports whether an inline text run carries the strong mark.
   *
   * @returns True when the node has a 'strong' mark.
   */
  protected isStrong(): boolean {
    return this.node.marks?.includes('strong') ?? false;
  }

  /**
   * Reports whether an inline text run carries the emphasis mark.
   *
   * @returns True when the node has an 'emphasis' mark.
   */
  protected isEmphasis(): boolean {
    return this.node.marks?.includes('emphasis') ?? false;
  }
}
