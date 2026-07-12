# Handoff: Phase C (Demo-Vertical-Slice)

Von: Rolle 2 (Phase-B-Durchlauf) · Datum: 2026-07-12
Voraussetzung erfüllt: **Gate G1 vollständig** (siehe `phase-b-implementation-report.md`).

## 1. Was jetzt steht (belastbar, getestet)

- **Nx-Workspace** (npm) mit 5 Apps (`public-web`, `studio-web`, `admin-web` = Angular;
  `api`, `worker` = NestJS) und 23 getaggten Libs; Boundaries per
  `enforce-module-boundaries` erzwungen (`platform:{agnostic,browser,server,any}` +
  `type:app`). `nx graph` zeigt die Zielstruktur.
- **Coding-Gates** blockierend in CI: `check:file-size|function-size|jsdoc|console|
  responsive|frontend-secrets` + `format`, `lint`, `typecheck`, `test`, `build`.
- **libs/domain** – KdpSpecs (Trim/Gutter/Paper/Spine/Cover/Bleed), PageEstimator,
  Kostenformel; Legacy-Werte als Testvektoren (offizielle KDP-Vektoren als TODO markiert).
- **libs/contracts** – Zod: Book-AST, AstPatch, QualityIssue, GenerationEvent (SSE),
  ApiError, Project, Env (fail-fast `parseEnv`).
- **libs/observability** – strukturierter Logger (Redaction, Correlation-ID).
- **libs/testing** – Golden-Master-Fixtures (v1/v2) + Loader `loadGoldenMaster`.
- **libs/projects** – `ProjectService` mit optimistischer Nebenläufigkeit (ETag),
  `ProjectVersionRepository`-Port + In-Memory-Adapter, `VersionConflictError`.
- **libs/ui** – SCSS-Design-Tokens + responsive App-Shell (320 px … 1440 px-Cap).
- **apps/api** – Health, Swagger (`/api/docs`), Projects-CRUD (If-Match → 409).
- **apps/worker** – BullMQ-Queue-Namen + Redis-Connection (lazy).
- **Prisma v1** – `apps/api/prisma/schema.prisma` (Organization/Project/Book/
  BookVersion/BookDocument), `prisma validate` grün.

## 2. Direkt nächste Arbeitspakete (Reihenfolge, aus production-roadmap.md)

1. **WP-B5-Follow-up (Schuld aus Phase B):** Prisma-Adapter für
   `ProjectVersionRepository` + DB-Integrationstest gegen Postgres (CI-Service steht),
   Migrationen + Seeds (Demo-Fixtures DE/EN/ES). (DEV-007)
2. **WP-C1:** `libs/document-model` – Book AST + **Legacy Parser** (Grammatik aus
   `legacy-backup-schema.md §4`), Golden-Master-Test gegen die B0-Fixtures
   (`@kdp/testing`), Migrationswarnungen MW-* (`legacy-react-to-angular.md §3`);
   `libs/preview` (AST→Angular); Markup-Editor mit Live-AST-Sync.
3. **WP-C2:** `MockLlmProviderAdapter` (deterministisch), GenerationRun/Step, Worker-Jobs,
   SSE, Preflight-Bestätigung, Demo-Banner; **Netzwerk-Guard-Test** (kein Provider-Egress).
4. **WP-C3–C6:** Skills v1, Autosave/Versionen/Reload, Quality+Einzelreparatur,
   echte Exporte (DOCX/EPUB/PDF + Validatoren) – Gate **G2**.

## 3. Wichtige Konventionen (nicht brechen)

- **Branch:** weiter auf `feature/angular-production-foundation`; `main` niemals anfassen.
- **ESM:** Libs importieren relativ mit `.js`-Endung (nodenext); Nest-Apps ohne `.js`.
- **Cross-Lib-Deps** in `package.json` deklarieren (`"@kdp/x": "*"`) + `nx sync` laufen lassen.
- **Neue Lib:** `nx g @nx/js:library libs/<name> --bundler=tsc --unitTestRunner=vitest
  --tags="platform:…,type:…"`; danach Stub durch dokumentierten Code ersetzen.
- **Angular-Befehle** mit `NX_IGNORE_UNSUPPORTED_TS_SETUP=true` (DEV-005).
- **Jede Funktion** ≤ 14 ausführbare Zeilen, JSDoc, kein `console.*`, kein statisches
  HTML in TS – die Checks blockieren sonst.

## 4. Offene Abweichungen (aus §14 des Berichts)

DEV-002 (Push), DEV-004 (npm statt pnpm), DEV-005 (Angular-TS-Setup),
DEV-006 (Angular-typecheck), DEV-007 (Prisma-Integrationstest ausstehend).

## 5. Non-Goals (unverändert)

Reale Zahlungsabwicklung, produktive OAuth, echte Provider-Adapter über
Contracts hinaus, vollständige Admin-CRUD-Flächen, Realtime-Kollaboration.
Nichts davon als fertig darstellen.
