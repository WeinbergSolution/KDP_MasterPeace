# WP-C1-Implementierungsbericht — Book AST, Legacy Parser, Live-Preview

Datum: 2026-07-15 · Rolle: Senior Angular & Platform Implementation Lead
Branch: `feature/wp-c1-book-ast-preview` (von `origin/staging` `16db269`).
`main` und `staging` unverändert.

## 1. Ergebnis

Vollständige vertikale Kette geliefert und getestet:

```
Legacy-Markup → Parser → validiertes Book AST → Migrationswarnungen
→ zugängliche Angular-Live-Preview → unmittelbare Aktualisierung
```

Deterministisch, ohne LLM, gegen die Golden-Master-Fixtures verifiziert.

## 2. Implementiert

| Bereich | Ort |
|---|---|
| Book-AST-Contract (+ Inline-`text`) | `libs/contracts/src/lib/document-ast.ts` |
| Deterministische IDs + Source Map | `libs/document-model/src/lib/ast` |
| Inline-/Block-Parser (ganze Grammatik) | `libs/document-model/src/lib/parser` |
| Legacy-Backup-Importer (v1/v2) | `libs/document-model/.../legacy-importer.ts` |
| MW-Warncodes + Diagnostik | `libs/document-model/src/lib/migration` |
| AST-Validierung (Zod) | `libs/document-model/.../validate-document.ts` |
| Preview-Komponenten (AST → Angular) | `libs/preview/src/lib/{book-preview,ast-node}` |
| Live-Workspace (Editor/Status/Warnungen/Preview) | `apps/studio-web/src/app/markup-workspace` |
| DE/EN/ES-Demo-Fixtures (offline) | `apps/studio-web/.../demo-fixtures.ts` |
| e2e-Smoke (9 Schritte) | `tools/e2e/wp-c1-smoke.mjs` (`npm run test:wp-c1`) |
| Doku | `docs/architecture/book-ast.md`, `docs/migration/legacy-parser.md` |

## 3. Nachweise

- **AST:** 27 Knotentypen im Contract; Parser erzeugt alle Alt-Format-Konstrukte;
  IDs positionsbasiert (`root`, `root.0`, …), deterministisch/stabil; Source Map
  vorhanden; unbekannte Knoten mit sichtbarem Fallback.
- **Parser:** alle Golden-Master-Konstrukte verarbeitet; MW-Warnungen
  `H1-DEGRADE, OL-INDEX, BOX-UNCLOSED, BOX-UNKNOWN, LINES-CLAMP, BOLD-UNBALANCED`;
  Fehler `PE-INVALID-BACKUP, PE-AST-INVALID`; v1==v2-Ergebnis; kein Inhaltsverlust.
- **Preview:** rendert alle Knotentypen ohne `innerHTML`, responsiv (7 Viewports,
  kein H-Overflow), a11y (Label, `aria-live`-Status, Warnungen als Text+Code,
  Checkbox, Überschriftenhierarchie, Fallback).
- **Live:** Debounce 300 ms, Status sichtbar, letzte gültige Preview bleibt bei
  Fehlern erhalten; Sprachwechsel DE/EN/ES; keine Konsolenfehler (e2e verifiziert).

## 4. Tests & Checks (Exit-Codes)

| Befehl | Exit | Ergebnis |
|---|---|---|
| `format:check`, `sync:check` | 0, 0 | konform / synchron |
| `check:file-size|function-size|jsdoc|console` | 0 | 0 Verstöße |
| `lint` (32 Projekte, Boundaries) | 0 | grün (3 nicht-blockierende Warnungen in generierten e2e-Dateien) |
| `typecheck` (32 Projekte) | 0 | grün |
| `test` (30 Projekte) | 0 | grün — inkl. document-model (23), preview (4), studio-web (7) |
| `test:integration` | 0 | grün (echtes PostgreSQL) |
| `build` (30 Projekte) | 0 | grün (Angular, ng-packagr, Nest, tsc) |
| `check:responsive` (7 Viewports) | 0 | kein H-Overflow |
| `check:frontend-secrets` | 0 | keine Keys |
| `test:wp-c1` (e2e-Smoke) | 0 | 9 Schritte, 0 Konsolenfehler |
| Clean-Checkout (`rm dist .nx` → test/build) | 0 | ohne alte Artefakte grün |

## 5. Coding-Regeln

Größte handgepflegte Datei ≤ 400 LOC (`block-parser.ts` ~270). Größte Funktion
≤ 14 ausführbare Zeilen. JSDoc vollständig. Kein `console.*` (Logger/§9). Keine
God-Component (Preview aus `BookPreview` + rekursivem `AstNode`). Boundaries
erzwungen (document-model agnostisch, preview browser).

## 6. Abweichungen / Risiken

- **P2 (Angular + TS-Solution):** Angular-Lib `preview` ist nicht tsc-composite;
  Typecheck via `tsc -p … --noEmit` (referenzenfreie Configs), Typprüfung
  zusätzlich durch den Angular-Build. Dokumentiert (Fortführung DEV-005/006).
- **P3 (Editor):** unkontrolliertes Textarea (Initial-/Demo-Schreibzugriff), um
  den Cursor zu erhalten; interpolierter Initialinhalt beginnt mit einer Leerzeile.
- Non-Goals (LLM, SSE, Repair, Export, Autosave-DB) sind nicht enthalten.

## 7. Git

Commits (Auszug): `document-model`, `preview`, `studio`, Angular-typecheck-Fix,
Clean-Checkout-test-Fix. Branch gepusht; `main`/`staging` unverändert.
