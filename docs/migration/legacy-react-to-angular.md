# Migration: Legacy React-Cloud → Angular-Plattform

Quelle: `legacy/react-cloud/kdp-workbook-studio.legacy.jsx`.
Ergänzend: `docs/architecture/as-is-audit.md` (Befunde), `docs/migration/legacy-backup-schema.md` (Alt-Datenformat).

## 1. Migrationsprinzipien

1. Kein line-by-line Port. Übernommen werden Produktverhalten, Domänenregeln, Prompts und UX-Muster.
2. Der Alt-Content (Workbook-Markup-Strings) wird über einen deterministischen **Legacy Parser** in das kanonische Book AST importiert.
3. Nicht eindeutig konvertierbare Inhalte erzeugen strukturierte **Migrationswarnungen** (`MigrationWarning { code, path, original, decision }`), niemals stillen Datenverlust.
4. Ein Golden-Master-Test fixiert das Importverhalten.

## 2. Migrationsmatrix Alt → Neu

| Alt (Legacy) | Neu (Ziel) | Modus |
|---|---|---|
| `window.storage`-Index + `kdp-proj-*`-Records | PostgreSQL (`Project`, `Book`, `BookVersion`, `BookDocument`) + IndexedDB-Draft-Layer | Ersetzen; Importer für JSON-Backups |
| Backup-JSON `{ project, step }` (v1 und v2) | `LegacyBackupImporter` → `Project` + Book AST + Migrationswarnungen | Transformieren |
| Workbook-Markup-String pro Kapitel | `DocumentNode[]`-Teilbaum (paragraph, heading, quote, list, checklist, writingLines, scale, exerciseBox, tipBox, exampleBox, …) | Transformieren via Legacy Parser |
| `parseBlocks` (L226–256) | `libs/document-model` Legacy Parser mit identischer Grammatik + dokumentierten Abweichungen (siehe §3) | Neu implementieren, verhaltenskompatibel |
| `SYS_AUTOR` + `FORMAT_REGELN` + Task-Prompts (Idee/Gliederung/Kapitel/Extend/Extras/Blurb/Brief/Marketing/Tipps) | Skill-Pack `self-development-crisis-and-self-worth-v1` (Nischen-Skill + TaskModules + QualityProfile, versioniert, DE zuerst, EN/ES als Übersetzungsgerüst) | Transformieren |
| `claude-sonnet-4-6` hart codiert, `max_tokens: 1000` | `ModelCatalogEntry` + `ModelRoutingPolicy` mit aufgabenspezifischen Tokenbudgets | Ersetzen |
| Client-Fetch auf api.anthropic.com + `window.claude`-Fallback | serverseitiges LLM-Gateway (`LlmProviderAdapter`), Demo über `MockLlmProviderAdapter` | Ersetzen |
| `tryParseJson`-Klammerheuristik | Structured Outputs + Zod-/JSON-Schema-Validierung + kontrollierter Re-Request | Ersetzen (verboten laut Masterprompt §3.5) |
| Autopilot-Schleife im UI-Thread | `GenerationRun`/`GenerationStep`-Jobs im Worker, SSE-Events, Resume idempotent | Ersetzen; Verhaltensregeln (Skip fertiger Kapitel, Stop) übernehmen |
| Lokaler Qualitäts-Check (Regex-Booleans) | deklarative `QualityRule`s + `QualityIssue`-Objekte auf AST-Knoten | Transformieren (Regeln inhaltlich übernehmen: Wortzahl, Übung, Linien, Checkliste/Skala, fehlende Rahmenteile) |
| KI-Tipps als Text | `RepairProposal` mit Patch-Schema + Diff-UI | Ersetzen |
| Print-HTML + `window.print()` | Worker-PDF-Renderer (Chromium + Paged.js), CSS-Wissen aus `bookCss` (Ränder, @page :left/:right, page-break-Regeln) übernehmen | Transformieren |
| E-Book-HTML / `.doc` | echter DOCX-Renderer (OOXML) + EPUB-3-Renderer + optional HTML-Export | Ersetzen |
| Cover-HTML (Panels, Hilfslinien, Barcode-Zone) | Cover-PDF-Renderer; Maßformeln in `libs/domain` mit KDP-Testvektoren | Transformieren |
| TRIMS/GUTTERS/PAPERS/Spine-Formel | `KdpSpecs`-Domänenmodul, versioniert, mit Quellenangabe und Testvektoren gegen offizielle KDP-Vorgaben | Transformieren + validieren |
| Seitenschätzung `words/235 + 1.5×Kapitel + 5` | `PageEstimator` mit Kennzeichnung „Schätzung", kalibrierbar nach realem PDF-Rendering | Transformieren |
| Statistiken, Schrittleiste, Save-Status, Fehlerbanner, Chapter-Tabs, Editor+Preview-Grid | Angular Studio-Shell (Signals), gleiche UX-Muster, i18n-fähig | Transformieren |
| Deutsche UI-Texte hart codiert | Transloco-Keys DE/EN/ES | Ersetzen |
| `Date.now()`-IDs | ULID/UUIDv7 serverseitig | Ersetzen |
| CSS-String-Konstante | SCSS + Design Tokens, komponentenlokal | Ersetzen (Farb-/Typo-Werte als Token-Startpunkt übernehmen) |
| `window.confirm`-Löschen ohne Undo | Bestätigungsdialog + Soft-Delete/Snapshot | Ersetzen |
| Krisen-Disclaimer, Copyright-Seite, Rezensions-CTA, `[DEIN-LINK]`-Bonus | FrontMatter-/BackMatter-Templates im Skill/Format-Profil, lokalisierbar | Übernehmen |

## 3. Bewusst dokumentierte Parser-Abweichungen (werden Migrationswarnungen)

| Code | Alt-Verhalten | Neu-Verhalten |
|---|---|---|
| MW-H1-DEGRADE | `# Titel` wird zu h2 gerendert | wird `heading level=2` + Warnung `legacy-h1-degraded` |
| MW-OL-INDEX | nummerierte Listen rendern Blockindex statt echter Nummer | echte `orderedList` mit fortlaufender Nummerierung + Warnung, falls Alt-Nummern nicht 1..n |
| MW-BOX-UNCLOSED | offene `:::`-Box am Textende wird stillschweigend geschlossen | Box wird geschlossen + Warnung `legacy-box-unclosed` |
| MW-BOX-UNKNOWN | unbekannter `:::typ` schließt offene Box, Zeile verworfen | Zeile wird als Absatz erhalten + Warnung |
| MW-LINES-CLAMP | `[linien:n]` auf 15 geclampt | Clamp bleibt (Formatprofil-Limit), Original-n in Warnung protokolliert wenn n>15 |
| MW-EMPTYLINE-LOSS | Leerzeilen ohne Bedeutung | Absätze bleiben getrennte Knoten; kein Informationsverlust im AST |
| MW-BOLD-UNBALANCED | unbalanciertes `**` bleibt Rohtext | identisch, plus Warnung |

## 4. Golden-Master-Test (Definition)

- Input: `libs/testing/fixtures/legacy-golden-master.json` (Alt-Schema v2) und
  `libs/testing/fixtures/legacy-golden-master-v1.json` (Alt-Schema v1). Deterministisch
  erzeugt via `libs/testing/fixtures/generate-fixtures.mjs`; geladen über
  `@kdp/testing` (`loadGoldenMaster('v1'|'v2')`). Struktur-/Determinismus-Test:
  `libs/testing/src/lib/legacy-fixtures.spec.ts` (WP-B0).
- Erwartung: deterministischer AST-Snapshot, vollständige Migrationswarnungsliste, Roundtrip AST → Preview-HTML strukturell äquivalent zur Legacy-Preview (blockweise verglichen).
- Der Test ist Teil von `npm run test:integration` und blockiert bei jeder ungewollten Parser-Änderung.

## 5. Nicht migriert (bewusst verworfen)

- `window.claude`-Fallback (N01) – proprietär, nicht nachvollziehbar.
- JSON-Klammerreparatur (P06) – durch Schema-Validierung ersetzt.
- `.doc`-/HTML-E-Book-Downloads (P07/P09) – durch echte Renderer ersetzt.
- Popup-Print als primärer PDF-Weg (P08) – nur noch optionale Browser-Vorschau, nie Exportpfad.
- Stille `catch`-Blöcke (P10/N11) – verboten laut AGENTS.md §8/§9.
