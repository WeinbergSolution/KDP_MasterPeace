# Book AST (kanonisches Dokumentmodell)

Referenz für WP-C1. Schema: `libs/contracts/src/lib/document-ast.ts` (Zod).
Parser/Validierung: `libs/document-model`. Renderer: `libs/preview`.

## 1. Grundsatz

Das Book AST ist die einzige fachliche Quelle für Preview und spätere Exporte.
Legacy-Markup wird niemals direkt gerendert:

```
Legacy-Markup → Legacy Parser → Book AST → AST-Validierung → Preview Renderer
```

## 2. Dokumentstruktur

```ts
interface BookDocument {
  schemaVersion: number; // AST-Migrationen pro Version (aktuell 1)
  language: string;      // Buchsprache (ISO), unabhängig von UI-Locale
  root: DocumentNode;    // type: 'book'
}

interface DocumentNode {
  id: string;                       // deterministische Pfad-ID (§4)
  type: NodeType;
  attrs?: Record<string, unknown>;  // z. B. heading.level, writingLines.count
  marks?: ('strong' | 'emphasis')[];// nur auf Inline-'text'-Knoten
  text?: string;                    // nur auf 'text'-Knoten
  children?: DocumentNode[];
}
```

## 3. Knotentypen

| Kategorie | Typen |
|---|---|
| Struktur | `book`, `frontMatter`, `backMatter`, `chapter`, `section` |
| Text | `heading` (attrs.level 2/3), `paragraph`, `quote`, `text` (inline run, marks) |
| Listen | `unorderedList`, `orderedList`, `listItem`, `checklist`, `checkItem` (attrs.checked) |
| Interaktiv | `writingLines` (attrs.count ≤15), `scale` (attrs.min/max/question) |
| Boxen | `exerciseBox`, `tipBox`, `exampleBox` (attrs.title) |
| Weitere (Schema) | `image`, `caption`, `pageBreak`, `table`, `tableRow`, `tableCell`, `tableOfContents`, `legalNotice`, `authorProfile` |

Der Legacy-Parser erzeugt aktuell alle Typen außer `image`, `caption`, `table*`
(im Alt-Format nicht vorhanden). Unbekannte Knoten rendert die Preview mit einem
sichtbaren Fallback statt sie zu verwerfen.

Kontrollierte Erweiterung (WP-C1): `text` wurde als Inline-Run ergänzt, um
Teil-`**fett**`-Spans innerhalb eines Blocks darzustellen (die Legacy-Grammatik
verlangt es). Blocktext wird als `children` von Inline-`text`-Knoten geführt.

## 4. IDs (deterministisch)

Jeder Knoten erhält seine Position im Baum als ID: `root`, `root.0`, `root.0.1`, …
Damit sind IDs innerhalb eines Dokuments eindeutig, deterministisch, bei
unverändertem Eingang stabil und in Tests reproduzierbar (keine ULIDs im Parser).
Persistente Server-IDs (ULID) bleiben eine spätere, orthogonale Ebene.

## 5. Source Mapping

`finalizeDocument` erzeugt neben dem AST eine `SourceMapEntry[]`-Liste
(`nodeId`, `nodeType`, `position.line`, `originalToken`). Migrationswarnungen
werden per Zeilennummer mit der zugehörigen `nodeId` angereichert, sodass das
spätere Repair-System (WP-C5) einzelne Stellen eindeutig adressieren kann.

## 6. Validierung

`validateDocument(candidate)` prüft gegen `BookDocumentSchema` (Zod) und liefert
das typisierte Dokument oder strukturierte `ParseError`s (`PE-AST-INVALID`).
Die Preview rendert ausschließlich validierte Dokumente.

## 7. Erweiterungspunkte

- Neue Knotentypen: Enum in `document-ast.ts` ergänzen + Renderer-Case in
  `libs/preview/ast-node`.
- Neue Markup-Konstrukte: Regel im `BlockParser`, ggf. dokumentierte MW-Warnung.
- AST-Migrationen: `schemaVersion` erhöhen + Migrationsfunktion (Phase C+).
