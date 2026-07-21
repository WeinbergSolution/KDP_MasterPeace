import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { BookDocument, DocumentNode } from '@kdp/contracts';
import { AstNodeComponent } from '../ast-node/ast-node';

// Renders a validated Book AST as a book-like page. It only ever receives a
// validated document (WP-C1 §8.1) and delegates node rendering to AstNodeComponent.

/** Renders a Book AST document as a print-like preview page. */
@Component({
  selector: 'kdp-book-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AstNodeComponent],
  templateUrl: './book-preview.html',
  styleUrl: './book-preview.scss',
})
export class BookPreviewComponent {
  @Input({ required: true }) document!: BookDocument;

  /**
   * Reads the book title from the root node's attributes.
   *
   * @returns The book title, or an empty string.
   */
  protected bookTitle(): string {
    return String(this.document.root.attrs?.['title'] ?? '');
  }

  /**
   * Reads the book subtitle from the root node's attributes.
   *
   * @returns The book subtitle, or an empty string.
   */
  protected bookSubtitle(): string {
    return String(this.document.root.attrs?.['subtitle'] ?? '');
  }

  /**
   * Returns the top-level child nodes of the book.
   *
   * @returns The root node's children (empty when none).
   */
  protected children(): DocumentNode[] {
    return this.document.root.children ?? [];
  }
}
