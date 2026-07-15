# Legacy V3 — Feature Parity Matrix

Maps every user-facing product function of `kdp-workbook-studio.tsx` onto the
existing KDP MasterPeace architecture. Source of truth for scope + status.
Date: 2026-07-15 · Package 1.

## Legend

**Status** (§8.1): `NOT_STARTED` · `PARTIAL` · `IMPLEMENTED` · `VERIFIED` ·
`DEFERRED_WITH_CONTRACT` (contract/adapter built, live run needs config) ·
`BLOCKED_BY_EXTERNAL_SERVICE` · `REJECTED_TECHNICAL_PATTERN` (the *mechanism* is
rejected; the *feature* is not — it is re-built the safe way).
Real provider execution/E2E without keys is additionally tagged
`BLOCKED_BY_CREDENTIAL` in the Provider column.

**Demo-Modus column:** intentionally omitted. Per the binding addendum
(`Opus_Ergaenzung_Vollwertige_Produktionsumsetzung.md`) there is **no demo mode in
the product**; deterministic mocks are permitted **only inside automated tests**
(shown as "test-mock" in Tests). When a provider is unconfigured the UI shows
"Integration nicht konfiguriert", never a fabricated answer.

**Prio:** P0 core visible chain · P1 quality/cover/import · P2 research/editorial
extras/marketing · P3 polish.

**Current coverage baseline (from WP-C1 + Foundation, `5a3746c`):** Book AST +
Legacy parser + validation (`libs/document-model`), safe renderer (`libs/preview`,
VERIFIED), studio markup workspace, `ProjectService`/Prisma (Organization/Project/
Book/BookVersion/BookDocument), `libs/domain` (kdp-specs/spine/cover, page + cost
estimators), `libs/contracts` (AST/patch/quality-issue/generation-event). All
other feature libs (ai-core, ai-providers, generation, export-*, quality, skills,
billing, auth, document-editor) are stubs.

---

## Table 1 — Identity, target, provider, status, priority

| ID | Bereich | Nutzerziel | Ref-Funktion | Zielmodul | Provider | Status | Prio |
|---|---|---|---|---|---|---|---|
| LV3-001 | Shell | 8-Schritt-Workflow, Fortschritt, kein Verlust | `STEPS`, rail | apps/studio-web (shell/workflow/routes) | – | NOT_STARTED | P0 |
| LV3-002 | Shell | Buchtyp wählt Regeln/Prompts/Export | `BOOK_TYPES`,`extrasFor` | libs/contracts + libs/domain | – | PARTIAL (AST kennt Typen) | P0 |
| LV3-003 | Shell | Nische (Liste+frei) | `NICHES` | libs/skills (NichePack) + contracts | – | NOT_STARTED | P1 |
| LV3-004 | i18n | Buchsprache unabh. von UI; In-Buch-Strings | `LANGS`,`BOOK_STRINGS` | libs/contracts (publishing-strings) + ADR-0006 | – | NOT_STARTED | P0 |
| LV3-010 | Projekt | V3-Projektmodell | `emptyProject`,`mergeProject` | libs/contracts + apps/api/prisma | – | PARTIAL (Project/Book/Version da) | P0 |
| LV3-011 | Projekt | Mehrere Projekte, wechseln | `switchProject` | libs/projects + apps/api | ✱ | PARTIAL | P0 |
| LV3-012 | Projekt | Neu/Kopie/Löschen (2-Tap) | `newProject`,`duplicateProject`,`deleteProject` | libs/projects + studio-web | ✱ | NOT_STARTED | P1 |
| LV3-013 | Projekt | Autosave + Speicherstatus | autosave `useEffect` | libs/projects (ETag) + WP-C4 | ✱ | PARTIAL (ETag da) | P0 |
| LV3-014 | Projekt | Backup export/import + Legacy-Import | `exportBackup`,`importBackup`,`importLegacyBackup` | libs/document-model (importer da) + api | ✱ | PARTIAL (v1/v2 importer da) | P1 |
| LV3-015 | Projekt | Serienprojekt anlegen | `createProjectFrom` | libs/projects | ✱ | NOT_STARTED | P2 |
| LV3-020 | Idee | 4 Buchkonzepte | `genIdeas`/BOOK_CONCEPTS | libs/generation + ai-core | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P0 |
| LV3-021 | Idee | Trend-Radar (Websuche) | `genTrends`/MARKET_TREND_RADAR | libs/research + ai-core | Search (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P2 |
| LV3-022 | Idee | Digital-Produkt-Radar | `genDigitalIdeas`/DIGITAL_PRODUCT_RADAR | libs/research | Search (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P2 |
| LV3-023 | Idee | Rezensions-Lücken | `genGaps`/REVIEW_GAP_ANALYSIS | libs/research | Search (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P2 |
| LV3-024 | Idee | Titel-Tester (8, Score) | `genTitleTests`/TITLE_VARIANT_SCORING | libs/generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P2 |
| LV3-025 | Idee | Autoren-DNA | `genVoice`/AUTHOR_VOICE_PROFILE | libs/generation + contracts (AuthorVoiceProfile) | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P2 |
| LV3-026 | Idee | Buchdaten editieren | fields+`pickIdea` | studio-web + libs/projects | ✱ | NOT_STARTED | P0 |
| LV3-030 | Gliederung | Gliederung generieren | `genOutline`/BOOK_OUTLINE | libs/generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P0 |
| LV3-031 | Gliederung | Kapitel add/move/merge/del | `addChapter`… | studio-web + libs/projects | ✱ | NOT_STARTED | P0 |
| LV3-032 | Import | PDF-Manuskript importieren | `handlePdfFile`,`reconstructText`… | libs/book-import (neu) + apps/api | – (parser) | REJECTED_TECHNICAL_PATTERN (CDN inject) | P1 |
| LV3-033 | Import | KI-Strukturbereinigung | `runStructureFix`/CLEAN_IMPORTED_STRUCTURE | libs/generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P2 |
| LV3-040 | Schreiben | Kapitel generieren | `writeChapter`/CHAPTER_DRAFT | libs/generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P0 |
| LV3-041 | Schreiben | Kapitel neu schreiben | CHAPTER_REWRITE | libs/generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P1 |
| LV3-042 | Schreiben | Kapitel verlängern | `extendChapter`/CHAPTER_EXTEND | libs/generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P1 |
| LV3-043 | Schreiben | Autopilot ganzes Buch | `runAutopilot`/BOOK_AUTOPILOT | libs/generation + apps/worker | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P1 |
| LV3-044 | Schreiben | Buch übersetzen | `runTranslate`/TRANSLATE_BOOK | libs/generation + BookVersion | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P2 |
| LV3-045 | Schreiben | Rahmenteile | `genExtra`/EXTRA_* | libs/generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P1 |
| LV3-050 | Editorial | Humanize | `runHumanize`/HUMANIZE_MANUSCRIPT | libs/quality + generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P1 |
| LV3-051 | Editorial | Proofread | `runProofread`/PROOFREAD_MANUSCRIPT | libs/quality + generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P1 |
| LV3-052 | Editorial | Gedankenstrich-Reduktion | `runDashFix`/REDUCE_EM_DASHES | libs/quality + generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P2 |
| LV3-053 | Editorial | Typografie-Normalizer | `cleanText`,`tidy` | libs/quality (TypographyNormalizer) | – (deterministisch) | NOT_STARTED | P1 |
| LV3-054 | Editorial | Lesbarkeitsanalyse | `readabilityOf` | libs/quality | – (deterministisch) | NOT_STARTED | P1 |
| LV3-055 | Editorial | Beta-Leser-Panel | `genBeta`/SIMULATED_BETA_READER_PANEL | libs/generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P2 |
| LV3-056 | Editorial | Verbesserungstipps | `genTips` | libs/generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P3 |
| LV3-060 | Format | Formateinstellungen + Preview | `settings`,`previewStyle` | studio-web + libs/preview + domain | – | PARTIAL (specs+preview da) | P0 |
| LV3-061 | Format | KeepTogether-Gruppen | `groupLinesWithQuestion` | libs/document-model (vorhanden) + preview/export | – | PARTIAL | P1 |
| LV3-070 | Cover | Spine/Cover-Geometrie | `spineWidthMm`,`buildCoverHtml` Maße | libs/domain (spine/cover da) | – | PARTIAL | P1 |
| LV3-071 | Cover | Klappentext | `genBlurb`/COVER_BLURB | libs/generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P1 |
| LV3-072 | Cover | Design-Briefing | `genBrief`/COVER_DESIGN_BRIEF | libs/generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P2 |
| LV3-073 | Cover | Cover-Bild-Prompt | `genCoverPrompt`/COVER_IMAGE_PROMPT | libs/generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P2 |
| LV3-074 | Cover | Cover-Bild erzeugen | `genCoverImage`/GENERATE_COVER_IMAGE | libs/image-generation + worker + storage | Higgsfield (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P2 |
| LV3-075 | Cover | Cover-Render final/guides | `buildCoverHtml` | libs/export-pdf (Cover-PDF) | – | NOT_STARTED | P1 |
| LV3-080 | Export | Print-Interior | `buildPrintHtml`,`bookCss` | libs/export-pdf + worker | – | REJECTED_TECHNICAL_PATTERN (Browserdruck) | P0 |
| LV3-081 | Export | EPUB 3 | `buildEpub`,`buildZip`,`epubDocs` | libs/export-epub + worker | – | NOT_STARTED (Legacy-Writer wird durch geprüfte Lib ersetzt) | P0 |
| LV3-082 | Export | Ebook HTML / Word | `buildEbookHtml`, `.doc` | libs/export-docx (echtes DOCX) | – | REJECTED_TECHNICAL_PATTERN (.doc=HTML) | P2 |
| LV3-083 | Export | Digital-Produkt-PDF | `buildDigitalHtml`,`DIGITAL_FORMATS` | libs/export-pdf + worker | – | NOT_STARTED | P2 |
| LV3-084 | Export | Printables (Einzel-Übung) | `collectExercises`,`buildPrintableHtml` | libs/export-pdf + document-model | – | NOT_STARTED | P2 |
| LV3-085 | Export | Zitatkarten PNG | `collectQuotes`,`downloadQuoteCard` | libs/export-core (image) + worker | – | NOT_STARTED | P2 |
| LV3-086 | Export | Hörbuchskript | `blocksToAudio`,`buildAudioScript` | libs/export-core (text) | – | NOT_STARTED | P2 |
| LV3-087 | Export | Landingpage | `buildLandingHtml` | libs/book-launch (neu) / export-core | – | NOT_STARTED | P2 |
| LV3-090 | Marketing | KDP-Paket (SEO) | `genKdp`/KDP_MARKETING_PACKAGE | libs/research + generation | Search+LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P1 |
| LV3-091 | Launch | Social-Plan 30 Tage | `genPosts`/LAUNCH_SOCIAL_PLAN | libs/book-launch + generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P2 |
| LV3-092 | Launch | E-Mail-Sequenz 5 | `genEmails`/LAUNCH_EMAIL_SEQUENCE | libs/book-launch + generation | LLM (BLOCKED_BY_CREDENTIAL) | NOT_STARTED | P2 |
| LV3-093 | Publish | KDP-Preflight | `preflight` useMemo | libs/quality (QualityIssue da) | – (deterministisch) | PARTIAL (contract da) | P0 |
| LV3-094 | Publish | Preis-Kalkulator | `estimatePrintCost`, royalty | libs/domain (cost-estimator da) | – | PARTIAL | P1 |
| LV3-095 | Publish | Upload-Anleitung + Ticks | `KDP_GUIDE`,`togglePubCheck` | studio-web + libs/projects | ✱ | NOT_STARTED | P1 |
| LV3-100 | Provider | LLM-Adapter serverseitig | `callModel`,`askClaude` | libs/ai-core + libs/ai-providers | LLM (DEFERRED_WITH_CONTRACT) | NOT_STARTED | P0 |
| LV3-101 | Provider | Search-Adapter | `askClaudeWithSearch` | libs/research (SearchProviderAdapter) | Search (DEFERRED_WITH_CONTRACT) | NOT_STARTED | P2 |
| LV3-102 | Provider | Image-Adapter | `askHiggsfieldImage` | libs/image-generation | Higgsfield (DEFERRED_WITH_CONTRACT) | NOT_STARTED | P2 |
| LV3-103 | Orchestrierung | GenerationRun/Step + Events/SSE | run-loops+`auto` | libs/generation + apps/api (SSE) + worker | – | NOT_STARTED (event-contract da) | P0 |
| LV3-104 | Orchestrierung | ResearchRun | research fns | libs/research + prisma | – | NOT_STARTED | P2 |
| LV3-105 | Orchestrierung | ImageGenerationRun | `genCoverImage` | libs/image-generation + prisma | – | NOT_STARTED | P2 |
| LV3-106 | Orchestrierung | ExportJob | export fns | libs/export-core + worker + prisma | – | NOT_STARTED | P0 |
| LV3-107 | Infra | Object-Storage-Assets | cover URL | ADR-0009 storage + libs/export-core | – (DEFERRED_WITH_CONTRACT) | NOT_STARTED | P1 |
| LV3-108 | Infra | Usage/Kosten-Ledger | (fehlt in Legacy) | libs/billing + domain (cost-estimator da) | – | NOT_STARTED | P1 |

✱ = Persistenz-abhängig (PostgreSQL/Prisma vorhanden; kein Provider nötig).

---

## Table 2 — I/O, side effects, delivery needs, rejected pattern, tests

Keyed by ID. "Reject" = the Legacy mechanism replaced (feature preserved).

| ID | Eingaben → Ausgaben | Seiteneffekte / Persistenz | API / Worker | Reject (Abweichung) | Tests |
|---|---|---|---|---|---|
| LV3-001 | step-Klick → aktiver Schritt | `step` persistiert | api project state | – | component (8 steps) |
| LV3-002 | bookType → Regelsatz | project.bookType | – | UI-hardcode → contract | domain unit (extrasFor/rules) |
| LV3-004 | lang → In-Buch-Strings | project.language | – | BOOK_STRINGS hardcode → i18n | unit (5 locales) |
| LV3-010 | – → validiertes Projekt | Prisma Project/Book/Version | api CRUD | freie Objekte → Zod | contract + integration |
| LV3-013 | edits → gespeichert | ETag/version, IndexedDB draft | api PATCH | window.storage → server | neg. offline/2-tab |
| LV3-014 | file → Projekt / Projekt → file | – | api import/export | – | round-trip + legacy v1/v2 |
| LV3-020 | niche/type/lang → 4 Konzepte | Run persistiert | api+worker | Browser-fetch → server | test-mock LLM |
| LV3-021..023 | niche → Findings+Quellen | ResearchRun + Quellen | api+worker+search | Browser web_search → server | test-mock search |
| LV3-024 | title → 8 Scores | – (oder Run) | api+worker | – | test-mock LLM |
| LV3-025 | sample → Stilprofil | AuthorVoiceProfile persist | api+worker | – | test-mock LLM; Einwilligung |
| LV3-030 | concept → N Kapitel | outline persist | api+worker | Date.now ids → ULID | test-mock LLM |
| LV3-032 | PDF → Kapitel | Original opt. archiviert | api (upload) + parser | CDN inject/kein Limit → pinned+sandbox | fixture PDF → chapters |
| LV3-040..043 | context → AST/Patch | GenerationRun/Step, BookVersion | api+worker (SSE) | Textchunk → validiertes AST/Patch | test-mock LLM; parity |
| LV3-044 | book+lang → neue Version | neue BookVersion (nicht destruktiv) | api+worker | in-place overwrite → Version | test-mock; version diff |
| LV3-050 | text → humanisiert | BookVersion vor/nach; Diff | api+worker | kein Diff/Undo → Patch+Diff | markup-preserve; diff/undo |
| LV3-051 | text → Patches | Diff+Undo | api+worker | stille Ersetzung → Patch | patch apply/undo |
| LV3-052 | text → weniger Dashes | before/after count | api+worker | blindes Regex → gezielt | number-range preserved |
| LV3-053 | text → normalisiert | – | lokal (domain) | – | deterministisch, alle Regeln |
| LV3-054 | text → Kennzahlen | – | lokal | – | thresholds |
| LV3-060 | settings → Preview+Seiten | project.settings | – | – | preview snapshot (7 vp) |
| LV3-070/075 | pages/paper → Maße+Cover | CoverSpec/Asset | export-pdf worker | Browserdruck → PDF-Worker | spine math (vorhanden) |
| LV3-074 | prompt → Bild-Asset | ImageGenerationRun + Storage | api+worker+storage | Browser-MCP/URL-only → server+persist | test-mock image |
| LV3-080/081/083/084 | project → PDF/EPUB | ExportJob + Artefakt+Hash | export-* worker | Browserdruck/hand-ZIP → Lib+Validierung | validate:epub/pdf |
| LV3-085 | quotes → PNG | Artefakt | export-core worker | Canvas-only → server render | render + font fallback |
| LV3-086 | book → txt | Artefakt | export-core | – | AST→audio unit |
| LV3-087 | project → HTML-Paket | Artefakt | book-launch | unsafe HTML → sanitized template | template unit |
| LV3-090 | book → Beschr./7 KW/Kat | ResearchRun | api+worker+search+LLM | – | test-mock; 7-KW + ≤50 assert |
| LV3-093 | project → Issues | QualityIssue[] | lokal (quality) | veraltete KDP-Zahlen → Quelle+Datum | rule unit (each check) |
| LV3-094 | pages/binding → Kosten | – | domain | – | cost unit |
| LV3-100 | prompt → strukturierte Antwort | GenerationRun/Step + Usage | api+worker | Frontend-Key/egress → server+Envelope | contract-test vs mock (+real if key) |
| LV3-103 | run → Events | SSE-Strom (ADR-0016) | api SSE + worker | – | event-sequence test |
| LV3-106 | request → Artefakt | ExportJob status + ValidationReport | export worker | – | job lifecycle test |
| LV3-107 | asset → signierte URL | Object Storage (ADR-0009) | storage adapter | Remote-URL-only → persist+sign | storage adapter contract |

---

## Summary counts

- Inventoried user-facing features: **60** (LV3-001 … LV3-108).
- `PARTIAL` reusing existing foundation: 10 (project/persistence, AST/parser,
  preview, keep-together, domain specs/spine/cost, preflight contract, i18n type).
- `REJECTED_TECHNICAL_PATTERN` (feature kept, mechanism replaced): 4 (PDF CDN
  inject, browser-print PDF, `.doc`=HTML, and the browser-side provider egress
  underlying all AI/search/image features).
- Provider-run features tagged `BLOCKED_BY_CREDENTIAL` until keys exist: 22
  (all LLM/Search/Higgsfield tasks) — code + contracts + test-mocks built anyway.
- Deterministic (no provider) features buildable now: typography, readability,
  preflight, price/spine/page math, formatting/preview, keep-together, export
  renderers (structure), audio script, project/persistence, import parsing.
