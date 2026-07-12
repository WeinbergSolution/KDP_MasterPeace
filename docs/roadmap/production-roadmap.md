# Produktions-Roadmap und Umsetzungsplan

Basiert auf Masterprompt §17 (Phasen A–E) und den Rollen 1–6 (§25).
Branch-Regeln: AGENTS.md §3 – Arbeit ausschließlich auf `feature/*` von `staging`, `main` unantastbar.
Jedes Arbeitspaket (WP) endet mit Pflichtchecks, Commit, Push und Berichtseintrag (AGENTS.md §13–§15).

---

## Phasenüberblick

| Phase | Inhalt | Status | Rolle |
|---|---|---|---|
| A | Audit & Sicherung | **abgeschlossen** | 1 |
| B | Workspace & Architektur-Foundation | **abgeschlossen** (2026-07-12; Gate G1 erfüllt; WP-B5-Follow-up DEV-007 geschlossen: Prisma-Adapter + echter PostgreSQL-Integrationstest grün) | 1→2 |
| C | Demo-Vertical-Slice | offen (nächste Phase) | 2 |
| D | KI-Provider-Foundation | offen | 2→3 |
| E | Öffentliche Produkt-Shell | offen | 2 |
| F+ | Reale Provider, Publishing-Tiefe, QA/Security, Billing/Launch | offen | 3–6 |

---

## Phase B – Workspace & Architektur (Rolle 2, sofort)

### WP-B0: Golden-Master-Fixtures
Legacy-Backup-Fixtures (v1/v2, alle Markup-Konstrukte, Grenzfälle nach as-is-audit.md §6) unter `libs/testing/fixtures/`.
**Akzeptanz:** Fixtures deterministisch, im Repo, von Schema-Doku referenziert.

### WP-B1: Nx-Workspace-Bootstrap
Nx + pnpm; Apps `public-web`, `studio-web`, `admin-web` (je eigene `index.html`, `main.ts`, `styles.scss`), `api`, `worker`; alle Libs aus target-architecture.md §2 als leere, getaggte Projekte; TS strict überall; Prettier/ESLint-Basis.
**Akzeptanz:** `nx graph` zeigt Zielstruktur; `npm run build` (alle Apps) grün; Boundary-Tags aktiv.

### WP-B2: Qualitäts-Checks & CI
Skripte `check:file-size` (400 LOC), `check:function-size` (14 ausführbare Zeilen), `check:jsdoc`, `check:console`, `check:responsive` (Playwright, Pflicht-Viewports aus AGENTS.md §11.6), `check:architecture`; CI-Workflow mit allen Pflichtchecks aus AGENTS.md §13; Blockierregeln aus §13.1.
**Akzeptanz:** Absichtlicher Verstoß (Testdatei mit 401 LOC / 15-Zeilen-Funktion / console.log) lässt CI rot werden; Removal macht sie grün.

### WP-B3: Design Tokens & UI-Shell
`libs/ui`: SCSS-Tokens (Farben/Typo/Spacing/Radien aus Legacy-CSS als Startwerte), App-Shell-Layout (Rail + Main, portrait-first, 320-px-fähig, max-width 1440 px, Fokus-States, reduced motion).
**Akzeptanz:** Storybook-freie Demo-Route; `check:responsive` grün auf allen Pflicht-Viewports.

### WP-B4: Contracts, Domain, Environment, Logging
`libs/contracts` (Zod-Schemas: Project/Book/AST/QualityIssue/GenerationEvent/API-Fehler), `libs/domain` (KdpSpecs mit Legacy-Testvektoren, PageEstimator, Kostenformel), Environment-Schema (Zod-validiert, fail-fast), `libs/observability` (Logger, Correlation-ID, Redaction).
**Akzeptanz:** Unit-Tests für KdpSpecs (Rückenformel gegen Legacy-Werte + offizielle KDP-Vektoren-TODO markiert), Kostenformel, Env-Schema.

### WP-B5: API-/Worker-Skeleton + Persistenz
NestJS api (Health, OpenAPI, Auth-Skeleton, Projects-CRUD), worker (BullMQ-Anbindung), Prisma-Schema v1 (Kernentitäten aus data-model.md), Migrationen, Seeds (Demo-Fixtures DE/EN/ES).
**Akzeptanz:** `test:integration` für Projekt speichern/laden + Versionskonflikt (ETag) grün; keine Secrets im Frontend-Build (Check).

## Phase C – Demo-Vertical-Slice (Rolle 2)

### WP-C1: Book AST + Legacy Parser + Preview
`libs/document-model` (AST, Zod, Migrationen), Legacy Parser mit Golden-Master-Test, `libs/preview` (AST→Angular), Markup-Editor mit Live-AST-Sync und Undo.
**Akzeptanz:** Golden-Master-Snapshot grün; Preview rendert alle Knotentypen; 320-px-Check grün.

### WP-C2: MockProvider + Generation-Runs + SSE
`MockLlmProviderAdapter` (deterministisch per Seed, simulierte Latenz/Fehler/Ratelimits/Token), GenerationRun/Step-Domain, Worker-Jobs, SSE-Strom, Preflight-Confirmation-UI mit simulierten Kosten, Demo-Banner.
**Akzeptanz:** E2E: Konzept→Gliederung→Kapitel im Demo-Modus; Netzwerk-Guard-Test beweist: kein Provider-Egress im Demo-Modus.

### WP-C3: Skill-System v1 + erster Skill
Skill-Registry/Resolver (deterministische Stufe), Intake-Formular (Fragen aus Masterprompt §6), Skill `self-development-crisis-and-self-worth-v1` aus den Legacy-Prompts (DE published, EN/ES draft), Nutzerbestätigung der Auswahl.
**Akzeptanz:** Unit-Tests Resolver; Skill schema-validiert; Runs pinnen SkillVersion.

### WP-C4: Autosave, Versionen, Reload
Server-Persistenz + IndexedDB-Drafts, sichtbarer Save-Status, Retry, Konfliktdialog, Snapshots vor riskanten Aktionen (Outline-Regeneration, Import, Repair), Versionsliste + Wiederherstellung, Backup-Export/-Import (neu + Legacy-Import).
**Akzeptanz:** Negativtests Offline-Autosave & Zwei-Tab-Konflikt; kein stiller Save-Fehler (Fehlerbanner-E2E).

### WP-C5: Quality Engine + Einzelreparatur
QualityRules (Legacy-Regeln deklarativ: Wortzahl, Übung, Linien, Checkliste/Skala, fehlende Rahmenteile, leere Box, Headinghierarchie), QualityIssue-Objekte mit Knoten-Lokalisierung, deterministische Fixes, Mock-KI-Repair mit Patch-Schema, Diff-UI mit Apply/Reject/Undo/Re-Check.
**Akzeptanz:** E2E: absichtlicher Fehler → genau dieser wird repariert → Diff → Apply → Re-Check grün; Kapitel wird dabei nie vollständig regeneriert (Assertion auf Tokenverbrauch/Steps).

### WP-C6: Echte Exporte
export-docx, export-epub, export-pdf (+ Cover-PDF) gemäß ADR-0011/0012/0013, ExportJobs mit Status + ValidationReport-UI; KDP-Paket-ZIP.
**Akzeptanz:** `validate:docx` (ZIP/XML), `validate:epub` (epubcheck 0 Errors), `validate:pdf` (Format/Fonts/Seitenzahl) grün; Artefakte mit Größe im Bericht; Export aus Demo-Daten für DE/EN/ES-Beispielprojekte.

## Phase D – KI-Provider-Foundation (Rolle 2/3)

WP-D1 Credential-Grenze + Envelope Encryption (ADR-0014) · WP-D2 Modellkatalog + Routing-Policy + Admin-Pflege · WP-D3 Token-/Kosten-Ledger + Preflight real · WP-D4 Anthropic-Adapter hinter ENV-Konfiguration (oder vollständig contract-testbar, falls keine Credentials) · WP-D5 Adapter-Skeletons OpenAI/Gemini + Contract-Testsuite.
**Akzeptanz:** Contract-Tests laufen gegen Mock und (wenn Credentials) real; kein Key im Bundle (CI-Scan); Budgets + Hard Stop getestet; keine Doppelabrechnung bei Retry (Idempotenz-Test).

## Phase E – Öffentliche Produkt-Shell (Rolle 2)

WP-E1 Landingpage/Feature/How-it-works/Format-Übersicht (SSG, DE/EN/ES) · WP-E2 Pricing-Shell + Mock-Billing-Guards · WP-E3 Login/Registrierung + Dev-Mock-Auth mit Produktionsschutz-Tests · WP-E4 Admin-Shell (Nutzer/Skills/Katalog/Flags/Audit – Lesend zuerst) · WP-E5 Legal-Seiten mit Prüfhinweis (nicht „anwaltlich geprüft").
**Akzeptanz:** „Muss jetzt funktionieren"-Liste aus Masterprompt §18 vollständig grün; Marketing ohne Garantie-Claims.

## Skill-Backlog (Auszug, Details: docs/roadmap/skill-backlog.md)
Research-Backlog-Struktur statt erfundener „Top 10": Datenquelle, Markt, Erhebungsdatum, Nische, Nachfrage-/Wettbewerbsindikatoren, Format-Eignung, Risiko, Skill-Vorschlag, Priorität. Die eigentliche Recherche ist eine separate, datierte Aufgabe (Rolle 6/Research).

## Meilenstein-Gates
- **G1 (nach B): ERFÜLLT (2026-07-12).** CI mit allen Pflichtchecks blockierend; Architektur-Boundaries per `enforce-module-boundaries` erzwungen (Verstoß-Probe verifiziert). Beleg: `docs/reviews/phase-b-implementation-report.md`.
- **G2 (nach C):** kompletter Demo-E2E (Masterprompt §16, 12 Schritte) grün; drei valide Exportartefakte.
- **G3 (nach D):** realer Providerlauf mit Ledger + Preflight, Security-Review der Credential-Grenze.
- **G4 (nach E):** Production-Build aller Apps, §18-Liste vollständig, Übergabe an Rolle 3/4.
