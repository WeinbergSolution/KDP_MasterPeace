# Legacy Parser (Workbook-Markup → Book AST)

Implementierung: `libs/document-model`. Grammatikquelle: `legacy-backup-schema.md §4`.
Abweichungen/Warncodes: `legacy-react-to-angular.md §3`.

## 1. Öffentliche API

```ts
parseMarkup(markup: string, opts?): LegacyParseResult   // Editor: Markup-String
importLegacyBackup(json: unknown): LegacyParseResult     // Backup (v1/v2) -> Buch
validateDocument(candidate): { document, errors }        // Zod-Validierung

interface LegacyParseResult {
  document: BookDocument | null;
  warnings: MigrationWarning[];
  errors: ParseError[];
  sourceMap: SourceMapEntry[];
}
```

## 2. Grammatik (zeilenbasiert)

| Konstrukt | AST-Ziel |
|---|---|
| `## `, `### ` | `heading{level:2|3}` |
| `# ` | `heading{level:2}` + Warnung |
| Fließtext, `**fett**` | `paragraph` mit `text`-Runs (marks: strong) |
| `> ` | `quote` |
| `- `, `* ` | `unorderedList > listItem` (Gruppierung) |
| `1. ` | `orderedList > listItem` (fortlaufend normalisiert) |
| `- [ ]`, `- [x]` | `checklist > checkItem{checked}` |
| `[linien:n]` | `writingLines{count}` (Clamp 15) |
| `[skala] Frage` | `scale{min:1,max:10,question}` |
| `:::uebung|übung|tipp|beispiel … :::` | `exerciseBox|tipBox|exampleBox{title}` |

Aufeinanderfolgende gleichartige Listenelemente werden zu einem Listenknoten
gruppiert. Leerzeilen trennen Blöcke, erzeugen aber keine Knoten (kein Verlust).

## 3. Migrationswarnungen (MW-*)

Jede Warnung: `code`, `message`, `severity`, `position.line`, optional `nodeId`,
`context`, `action`. Stabile Codes (`warning-codes.ts`):

| Code | Anlass |
|---|---|
| `MW-H1-DEGRADE` | `# `-Überschrift → Ebene 2 |
| `MW-OL-INDEX` | Alt-Nummerierung ≠ 1..n → normalisiert |
| `MW-BOX-UNCLOSED` | offene `:::`-Box am Ende automatisch geschlossen |
| `MW-BOX-UNKNOWN` | unbekannter `:::`-Typ → als Absatz erhalten |
| `MW-LINES-CLAMP` | `[linien:n>15]` auf 15 geclampt (Original in `context.requested`) |
| `MW-BOLD-UNBALANCED` | unbalanciertes `**` bleibt Rohtext |
| `MW-EMPTYLINE-LOSS` | dokumentiert: Leerzeilen ohne Struktur (kein Knoten, kein Verlust; wird nicht als Warnung emittiert) |

Neue Codes nur mit Eintrag hier und in `legacy-react-to-angular.md`.

## 4. Fehlercodes (PE-*)

| Code | Anlass |
|---|---|
| `PE-INVALID-BACKUP` | Backup ohne verwertbares Projektobjekt |
| `PE-AST-INVALID` | Ergebnis verletzt das Book-AST-Zod-Schema |

Der Parser wirft keine ungefangenen Exceptions bis in die UI; unklare Eingaben
werden tolerant gelesen und als Warnung/Fehler gemeldet.

## 5. Determinismus & Golden Master

Gleicher Eingang ⇒ identisches Ergebnis (Blockparser deterministisch, Pfad-IDs
positionsbasiert). `libs/document-model/.../legacy-importer.spec.ts` fixiert das
Import-Verhalten gegen die Golden-Master-Fixtures (v1/v2): alle Knotentypen, alle
MW-Warnungen, Determinismus, stabile IDs und Inhaltserhalt. Bewusste Abweichungen
sind ausschließlich als MW-Warnung oder PE-Fehler sichtbar.

## 6. Nicht unterstützt (Alt-Format)

Tabellen, Bilder, Seitenumbrüche und verschachtelte Boxen existieren im
Alt-Format nicht; der Importer erzeugt sie nicht. Das AST/Preview unterstützt
`table*`, `image`, `caption`, `pageBreak` bereits für spätere Editoren/Importe.
