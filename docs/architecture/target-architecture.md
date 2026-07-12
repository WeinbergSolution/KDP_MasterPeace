# Zielarchitektur KDP MasterPeace

Verbindliche Referenz für alle Implementierungsphasen. Abweichungen nur per ADR (`docs/adr/`).
Regelbasis: `AGENTS.md` (Root). Detaildokumente werden in der Implementierungsphase je Subsystem ergänzt.

---

## 1. Systemübersicht (C4 Level 1–2, textuell)

```
                         ┌────────────────────────────────────────────┐
  Besucher ────────────► │ apps/public-web   (Angular, SSG/SSR)       │
                         │ Landing · Pricing · FAQ · Legal · Auth-UI  │
                         └───────────────┬────────────────────────────┘
                                         │ REST (OpenAPI) + SSE
  Autor:in ────────────► ┌───────────────┴────────────────────────────┐
                         │ apps/studio-web   (Angular App-Shell, CSR) │
                         │ Intake · Editor · Preview · QA · Export    │
                         └───────────────┬────────────────────────────┘
  Admin ───────────────► ┌───────────────┴────────────────────────────┐
                         │ apps/admin-web    (Angular, getrennt)      │
                         └───────────────┬────────────────────────────┘
                                         │
                         ┌───────────────▼────────────────────────────┐
                         │ apps/api          (NestJS)                 │
                         │ Auth · Projects · Skills · Generation-     │
                         │ Commands · Quality · Export-Commands ·     │
                         │ Billing-Mock · Admin · OpenAPI · SSE-Hub   │
                         └────┬─────────────┬─────────────┬───────────┘
                              │             │             │
                    PostgreSQL│        Redis│      S3-kompatibler
                    (Prisma)  │      (BullMQ│       Object Storage
                              │  Queue/Locks│      (Exporte, Assets)
                              │             │
                         ┌────▼─────────────▼─────────────────────────┐
                         │ apps/worker       (NestJS Standalone)      │
                         │ Generation-Jobs (LLM-Gateway) ·            │
                         │ Export-Jobs (DOCX/EPUB/PDF/Cover/ZIP) ·    │
                         │ Validierung (epubcheck, PDF-Checks)        │
                         └────┬───────────────────────────────────────┘
                              │  serverseitig, Keys nur hier/API
                   ┌──────────▼──────────┐
                   │ LLM-Provider        │  Anthropic · OpenAI · Gemini
                   │ (+ MockProvider für │  – niemals aus dem Browser
                   │   Demo-Modus)       │
                   └─────────────────────┘
```

Kerninvarianten:

1. **Kanonisches Book AST** ist die einzige Quelle der Wahrheit für Buchinhalte. Alle Renderer (Preview, PDF, DOCX, EPUB, HTML) und die Quality-Engine arbeiten ausschließlich auf dem AST.
2. **Provider-Credentials existieren nur serverseitig** (API/Worker), verschlüsselt gespeichert.
3. **Demo-Modus** nutzt denselben `LlmProviderAdapter`-Vertrag über einen `MockLlmProviderAdapter`; ein Netzwerk-Guard blockiert im Demo-Modus jeden Provider-Egress.
4. **Jeder kostenpflichtige Schritt** durchläuft Preflight-Schätzung → Bestätigung → Ausführung → unveränderlichen Usage-/Cost-Ledger-Eintrag.
5. **Alles Lange läuft als Job** (Generierung, Export) mit SSE-Statusstrom; die UI zeigt Inhalte, sobald partielle AST-Knoten eintreffen.

## 2. Monorepo und verbindliche Ordnerstruktur

Nx-Monorepo (ADR-0001). Struktur folgt Masterprompt §4 und AGENTS.md §4.1:

```text
apps/
  public-web/          Angular-MPA: Landing, Pricing, FAQ, Legal, Login/Registrierung (SSG/SSR)
    src/index.html
    src/main.ts
    src/styles.scss
  studio-web/          Angular-Autorenstudio (eigener Einstiegspunkt, internes Routing erlaubt)
    src/index.html · src/main.ts · src/styles.scss
  admin-web/           getrennte Angular-Admin-App (eigener Einstiegspunkt, Guards, getrenntes Bundle)
    src/index.html · src/main.ts · src/styles.scss
  api/                 NestJS-Backend (REST + SSE)
  worker/              NestJS-Standalone: BullMQ-Consumer für Generation/Export/Validierung

libs/
  domain/              reine Domänenmodelle & Regeln (KdpSpecs, PageEstimator, Kostenformel …)
  contracts/           API-/Event-/Job-Verträge, Zod-Schemas, OpenAPI-Quelle, i18n-Message-Keys
  ui/                  Design-System: Tokens (SCSS), Basis-Komponenten, Layout-Shell
  auth/                Auth-/Rollen-/Guard-Logik (Frontend- und Backend-Teil getrennt exportiert)
  projects/            Projekte, Versionen, Autosave, Draft-/Offline-Schicht (IndexedDB)
  skills/              Skill-Definitionen, Registry, Resolver, Versionierung
  ai-core/             providerunabhängige Orchestrierung, Run-/Step-Domain, Routing-Policy
  ai-providers/        Adapter: mock/, anthropic/, openai/, gemini/ (je eigenes Sub-Lib)
  generation/          Workflows, Jobdefinitionen, Run-State-Maschine, SSE-Eventtypen
  document-model/      kanonisches Book AST, Zod-Schemas, Legacy Parser, AST-Transformationen
  document-editor/     Editor-/Mappinglogik (Markup-Editor ↔ AST in Phase 1)
  preview/             Preview-Renderer (AST → Angular-Komponenten)
  quality/             QualityRules, Issue-Engine, Repair-Pläne, Patch-Anwendung
  export-core/         Export-Contracts, Jobsteuerung, Validierungsberichte
  export-docx/         echter DOCX-Renderer (AST → OOXML)
  export-epub/         EPUB-3-Renderer (AST → Container/OPF/NAV/XHTML)
  export-pdf/          Print-PDF-Renderer (AST → Paged-HTML → Chromium) + Cover-PDF
  billing/             Pläne, Entitlements, Usage, Mock-Billing-Provider
  admin/               Admin-Domain (Skill-Verwaltung, Katalog, Flags, Audit)
  observability/       Logger, Correlation-ID, Redaction, Metrik-Contracts
  testing/             Fixtures (inkl. Golden Master), MockProvider-Helfer, Testutils

docs/
  architecture/ · adr/ · migration/ · roadmap/ · reviews/

legacy/
  react-cloud/         unveränderter Prototyp (read-only)

tools/
  checks/              check:file-size · check:function-size · check:jsdoc · check:console ·
                       check:responsive · check:architecture (Nx-Boundary-Regeln + eigene Skripte)
```

Abhängigkeitsregeln (per Nx `enforce-module-boundaries` erzwungen, `check:architecture`):

- `apps/*` dürfen `libs/*` nutzen, nie umgekehrt; Apps nie untereinander.
- `libs/domain`, `libs/contracts`, `libs/document-model` sind fundamental: keine Abhängigkeit auf Angular, NestJS, DB oder Provider-SDKs.
- `libs/ai-providers/*` implementieren nur `libs/ai-core`-Verträge; nichts außer `apps/api`/`apps/worker` importiert Provider-SDKs.
- Frontend-Apps importieren niemals `ai-providers`, `export-*`-Renderer oder Server-Auth-Interna.

## 3. Frontend

- Angular (aktuelle stabile Version zum Implementierungszeitpunkt; Baseline Angular 22), Standalone Components, striktes TypeScript.
- **MPA:** drei getrennte Einstiegspunkte mit je eigener `index.html`; `public-web` wird für Landing/Pricing/FAQ/Legal statisch vorgerendert (SSG, SSR wo nötig); `studio-web` ist eine clientseitige App-Shell mit internem Routing; `admin-web` wird getrennt geladen, Route-Guards + serverseitige Rollenprüfung.
- **State:** Signals für lokalen/Feature-State, NgRx SignalStore für Feature-Stores (ADR-0007), RxJS ausschließlich für Streams (SSE, Job-Events, Autosave-Debounce).
- **i18n:** Transloco, Runtime-Wechsel DE/EN/ES (ADR-0006); UI-Locale, Buchsprache, Skill-Locale, Markt- und Formatierungs-Locale sind getrennte Felder.
- **Styling:** SCSS mit Design Tokens in `libs/ui`; komponentenlokale Styles; AGENTS.md §11/§12 (320 px, kein H-Overflow, max-width 1440 px, reduced motion, Fokus-States) sind Definition-of-Done-Kriterien mit `check:responsive`.
- **Unmittelbare Sichtbarkeit:** Preview rendert partielle AST-Knoten während der Generierung; Save-/Job-Status permanent sichtbar; Demo-Modus-Banner permanent, wenn aktiv.

## 4. Backend (apps/api)

- NestJS (ADR-0002), modulare Struktur je Fachbereich, OpenAPI-generiert aus `libs/contracts`.
- REST für Commands/Queries, SSE für Generation-/Export-Events (`queued → estimating → awaiting-confirmation → running → partial-content → validating → repairing → saving → completed | failed | cancelled`).
- Idempotente Commands (Idempotency-Key), ETag-/Versionsnummern für Konflikterkennung, Rate Limits, Correlation-IDs, strukturierte Logs über `libs/observability`.
- Autorisierung serverseitig auf jeder Ressource (Mandantentrennung: jede Query ist owner-/org-gescoped).

## 5. Worker (apps/worker)

- BullMQ auf Redis (ADR-0008). Queues: `generation`, `export`, `validation`.
- Jobs sind idempotent und resumable (`GenerationRun` speichert Fortschritt pro Step; Wiederaufnahme setzt beim ersten nicht abgeschlossenen Step an – Verhalten des Legacy-Autopiloten, sauber persistiert).
- Export-Jobs erzeugen Artefakte in Object Storage, dann Validierung (epubcheck, PDF-Format-/Font-Checks, DOCX-ZIP/XML-Checks), dann `ValidationReport`.

## 6. Daten

- PostgreSQL via Prisma (ADR-0003), Migrationen versioniert, reproduzierbare Seeds (inkl. Demo-Fixtures DE/EN/ES).
- Object Storage S3-kompatibel (ADR-0009): Exporte, Cover, Bilder; presigned Downloads.
- Redis: Queue, Locks, kurzlebiger Jobstatus.
- IndexedDB im Studio: lokale Drafts + Offline-Queue; Server ist Source of Truth; optimistische Updates mit Konfliktdialog bei Versionskonflikt.
- ER-Modell: `docs/architecture/data-model.md`.

## 7. LLM-Gateway

- Vertrag `LlmProviderAdapter` (Masterprompt §7) in `libs/ai-core`; Adapter in `libs/ai-providers/*`.
- Zwei Nutzungsarten: Platform-managed Billing und BYOK; BYOK-Keys AES-256-GCM-verschlüsselt (Envelope Encryption, ADR-0014), nie im Klartext abrufbar, nie an den Browser.
- Structured Outputs: jede strukturierte Antwort wird gegen Zod-/JSON-Schema validiert; bei Fehlern kontrollierter Re-Request mit Fehlerfeedback (max. konfigurierbare Versuche); jede Antwort protokolliert (Input-/Output-Hash). Keine Klammerheuristiken.
- Modellrouting per `ModelRoutingPolicy` (Task-Typ → Modell + Tokenbudget + Fallback), keine verstreuten `if`s.
- Token/Kosten: Preflight-Schätzung (offizielle Count-Endpoints wo vorhanden, sonst kalibrierte Schätzung mit P50/P90-Historie), versionierter `ModelCatalog` für Preise, unveränderlicher Usage-/Cost-Ledger, Budgets + Hard Stop, keine Doppelabrechnung bei Retries (Idempotenz-Key je Step).
- Consumer-Limit-Ehrlichkeit: Prozentwerte privater Chat-Abos nur bei dokumentierter Provider-API; sonst höchstens klar markierte „lokale Schätzung".

## 8. Skill-System

- Deklarative, schema-validierte, versionierte Skill-Packs; Komposition aus GlobalPublishingPolicy + LocalePolicy + FormatPolicy + NicheSkill + AudienceSkill + SafetyProfile + TaskModule + QualityProfile (+ ModelRouting/Tokenbudget).
- Lifecycle: draft → testing → published → deprecated → archived; veröffentlichte Versionen unveränderlich (ADR-0015).
- Resolver zweistufig: deterministische Metadaten-Filterung, optional KI-Vorschlag; finale Auswahl wird dem Nutzer angezeigt und bestätigt.
- Erster migrierter Skill: `self-development-crisis-and-self-worth-v1` (aus `SYS_AUTOR`, `FORMAT_REGELN` und den Task-Prompts des Prototyps), inkl. Safety-Profil (Abgrenzung zu Therapie, Krisen-Disclaimer, keine erfundenen Qualifikationen).
- Kein ausführbarer Admin-Code in Produktion; Skills sind Daten.

## 9. Dokumentmodell (Book AST)

- Typisiertes, versioniertes AST in `libs/document-model` (ADR-0010); Knotentypen gemäß Masterprompt §3.2 (Buch, FrontMatter, Kapitel, Abschnitt, Headings, Absatz, Hervorhebung, Zitat, Listen, Checkliste, Schreiblinien, Skala, Übungs-/Tipp-/Beispielbox, Bild, Bildunterschrift, Seitenumbruch, Tabelle, Metadaten, Cover-Metadaten, Legal, Autorenprofil, TOC).
- Jeder Knoten: `id` (ULID), `type`, `attrs`, `children`, optional `marks` (Inline). Schemaversion im Dokumentkopf; Migrationsfunktionen pro Schemaversion.
- Legacy Parser: Workbook-Markup → AST (Import); für Phase 1 bleibt Markup als Editor-Eingabeformat mit Live-AST-Sync, das AST ist Persistenz- und Renderformat.

## 10. Export-Pipeline

- Exporte laufen als Worker-Jobs auf einer fixierten `BookVersion`; reproduzierbar (gleiche Version + Profil ⇒ byte-stabil bis auf Zeitstempel-Metadaten).
- **DOCX:** echtes OOXML via `docx`-Bibliothek (ADR-0011): Stile, Headings, TOC-kompatible Struktur, Listen/Checklisten, Tabellen, Boxen, Seitenumbrüche, Metadaten, Sprache, Bilder, Print-Seitengrößen/-Ränder; Validierung: ZIP-Struktur + XML + Smoke-Open.
- **EPUB 3:** eigener Builder (ADR-0012): mimetype unkomprimiert an Position 1, container.xml, Package/Manifest/Spine, NAV, XHTML je Kapitel, CSS, Cover, Sprache, a11y-Metadaten; Validierung mit epubcheck im Worker/CI.
- **Print-PDF:** Chromium + Paged.js im Worker (ADR-0013): exakte Seitengröße, gespiegelte Ränder + Bundsteg, Widow/Orphan soweit unterstützt, eingebettete (selbst gehostete) Fonts, No-Bleed-/Bleed-Profile; automatische Prüfung von Seitenformat, Font-Embedding, Seitenzahl. Browser-Druckdialog ist nie der Exportweg.
- **Cover-PDF:** eigenes Artefakt; Maße aus `KdpSpecs` (Trim, Papier, Druckart, Seitenzahl, Bleed) mit Testvektoren gegen offizielle KDP-Vorgaben; Warnung bei geschätzter Seitenzahl; finales Cover erst nach finaler Interior-Seitenzahl; Preview mit/ohne Guides.
- **KDP-Paket:** ZIP mit interior-print.pdf, cover-print.pdf, ebook.epub, editable.docx, metadata.json/csv, quality-report.json/html, generation-disclosure.json (KI-Kennzeichnung getrennt für Text/Cover/Innenbilder/Übersetzung), README.txt.

## 11. Quality- und Repair-Engine

- Deklarative `QualityRule`s (Scope: book/frontmatter/chapter/section/node/format/locale/skill/audience/export) erzeugen strukturierte `QualityIssue`s (Schema Masterprompt §9) mit exakter AST-Lokalisierung.
- Reparatur: deterministische Fixes wo möglich; KI-Reparatur sendet nur Regel + fehlerhafte Stelle + minimalen Nachbarkontext + Patch-Schema; Antwort ist ein strukturiertes Patch-Objekt; UI zeigt Diff, Apply/Reject/Undo, Re-Check. Nie Kapitel- oder Buch-Regeneration für einen Einzelknoten.
- Jeder Lauf erzeugt ein Testprotokoll (Regeln, Ergebnisse, Issues, Reparaturen, Re-Check, Reststatus).

## 12. Security

- Keine Secrets im Frontend-Bundle (CI-Check); CSP; Input-Validierung (Zod an jeder Grenze); Output-Sanitization (AST-Renderer erzeugen nie ungefiltertes `innerHTML`); Prompt-Injection-Härtung für Skill-/Projektdaten (Delimiter, Instruktionshierarchie, Output-Schema-Zwang).
- Auth: E-Mail/Passwort (Argon2id), E-Mail-Verifizierung, Passwort-Reset, Sessions, Google OAuth; Rollen (user, admin) mit Guards + serverseitiger Prüfung (ADR-0004). Mock-Auth ausschließlich Development (Build-Time- und Runtime-Schutz, sichtbarer Dev-Banner, CI-Test dass Production-Builds keinen Mock enthalten). Kein `1337`-Bypass, keine versteckten Logins.
- Mandantentrennung, Audit-Logs, PII-Redaction in Logs, keine Manuskripte in Logs, Datenexport/-löschung für Nutzer, Secret Rotation, Dependency Scanning, Upload-Prüfung (MIME/Größe/Scan) sobald Uploads existieren.
- Inhaltliche Safety: keine Heilversprechen; SafetyProfile für sensible Themen sowie Kinder/Jugendliche verpflichtend im Skill-System verankert.
