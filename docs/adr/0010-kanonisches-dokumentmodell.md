# ADR-0010: Kanonisches Dokumentmodell – eigenes versioniertes Book AST (JSON + Zod)

Status: accepted · 2026-07-12

## Kontext
Quelle der Wahrheit darf weder HTML noch Markdown noch Textarea-String sein
(Masterprompt §3.2). Benötigt: Workbook-Spezialknoten (Schreiblinien, Skala,
Übungsbox …), stabile Knoten-IDs für Patches, Schemaversionierung, Renderer-Fanout.

## Optionen
1. **Eigenes AST** – exakt zugeschnittene Knotentypen, Zod-validiert, schlanke Abhängigkeiten.
2. ProseMirror-Dokumentmodell – starkes Editor-Ökosystem, aber Editor-zentrierte
   Semantik, Buch-/Export-Knoten müssten verbogen werden; bindet Persistenz an Editor-Lib.
3. Markdown+Direktiven als Quelle – verletzt die Vorgabe, verlustbehaftet.
4. JATS/DocBook-XML – publishing-korrekt, aber schwergewichtig und LLM-unfreundlich.

## Entscheidung
Eigenes Book AST in `libs/document-model` (Definition: data-model.md §3), Knoten-IDs
als ULID, `schemaVersion` + Migrationsfunktionen. ProseMirror bleibt als spätere
Editor-Option mit bidirektionalem Mapping möglich (document-editor kapselt das).

## Konsequenzen
Alle Renderer, Quality-Engine und Patches arbeiten auf einem Vertrag; Legacy Parser
mappt Workbook-Markup ins AST; LLM-Ausgaben werden als AST-Teilbäume geschemat.

## Risiken
Eigenes Modell = eigene Pflege; Mitigation: kleine Knotenmenge, Golden-Master- und
Property-Tests (parse→render Roundtrips).

## Migrationswirkung
Kern der Legacy-Migration (legacy-react-to-angular.md).

## Revisit Trigger
Einführung eines Rich-Text-Editors: Mapping-Kosten vs. Modellwechsel neu bewerten.
