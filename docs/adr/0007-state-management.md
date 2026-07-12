# ADR-0007: State-Management – Angular Signals + NgRx SignalStore, RxJS nur für Streams

Status: accepted · 2026-07-12

## Kontext
Editor-, Preview-, Run- und Save-State mit hoher Update-Frequenz; SSE-Streams;
AGENTS.md verbietet globale veränderbare Zustände und God Services.

## Optionen
1. **Signals + NgRx SignalStore** – featurelokale Stores, DevTools, klare Grenzen.
2. Klassisches NgRx (Redux) – Boilerplate, 14-Zeilen-Regel schwer einzuhalten.
3. Nur Services mit Signals – möglich, aber ohne Konventionen driftet es zu God Services.

## Entscheidung
NgRx SignalStore pro Feature (`projects`, `generation`, `quality`, `export`);
RxJS ausschließlich an Stream-Grenzen (SSE, Debounce, Retry), sofort in Signals überführt.

## Konsequenzen
Ein Store pro Fachbereich, keine Cross-Feature-Mutationen; Undo/Redo des Editors
lebt im document-editor-Store auf AST-Patch-Basis.

## Risiken
SignalStore-API-Änderungen; Mitigation: dünne eigene `createFeatureStore`-Fassade.

## Migrationswirkung
Legacy-useState-Logik wird nicht portiert, nur Verhaltensregeln.

## Revisit Trigger
Kollaboratives Editing (CRDT) würde Store-Modell neu aufrollen.
