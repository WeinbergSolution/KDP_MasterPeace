# Handoff: WP-C2 (MockProvider, Generation-Runs, SSE)

Von: WP-C1 (Book AST, Legacy Parser, Live-Preview) · Datum: 2026-07-15
Voraussetzung erfüllt: WP-C1 abgeschlossen (siehe `wp-c1-implementation-report.md`).

## 1. Ausgangsstand (belastbar, getestet)

- **Book AST** (`libs/contracts`) + **document-model** (Parser, Importer,
  Validierung, Source Map, MW-/PE-Codes). API: `parseMarkup`, `importLegacyBackup`,
  `validateDocument`.
- **preview** (`libs/preview`): `BookPreviewComponent` + rekursiver
  `AstNodeComponent` rendern jeden AST-Knotentyp sicher.
- **studio-web**: Live-Workspace (Editor → Debounce-Parse → Preview + Diagnostik,
  DE/EN/ES-Demos). e2e-Smoke `npm run test:wp-c1`.
- **Persistenz** (aus Phase B): `ProjectService` + Prisma-Adapter, ETag-Konflikt.

## 2. WP-C2-Scope (aus production-roadmap.md)

`MockLlmProviderAdapter` (deterministisch per Seed, simulierte Latenz/Fehler/
Ratelimits/Token), `GenerationRun`/`GenerationStep`-Domäne, Worker-Jobs, SSE-Strom,
Preflight-Bestätigung mit simulierten Kosten, Demo-Banner. **Akzeptanz:** E2E
Konzept→Gliederung→Kapitel im Demo-Modus; **Netzwerk-Guard-Test** beweist: kein
Provider-Egress im Demo-Modus.

## 3. Nächste Libraries/Dateien

- `libs/ai-core`: `LlmProviderAdapter`-Vertrag (data-model.md §3), Run-/Step-Domäne,
  `ModelRoutingPolicy`. Contracts: `GenerationEvent` liegt bereits in `libs/contracts`.
- `libs/ai-providers/mock`: `MockLlmProviderAdapter` (deterministisch per Seed,
  strukturierte Outputs gegen Zod, simulierte Latenz/Fehler/Token).
- `libs/generation`: Workflow-/Jobdefinitionen, Run-State-Maschine, SSE-Eventtypen.
- `apps/worker`: BullMQ-Consumer (Queues stehen: generation/export/validation) für
  Generation-Jobs; `apps/api`: SSE-Hub + Preflight-Command.
- `apps/studio-web`: Preflight-Confirmation-UI, Generierungs-Stream in die Preview
  (partielle AST-Knoten einspeisen), permanentes Demo-Banner.

## 4. Erste Arbeitsschritte

1. `LlmProviderAdapter`-Vertrag + `MockLlmProviderAdapter` (deterministisch,
   strukturierte Antworten als Book-AST-Teilbäume; Preise/Token aus `libs/domain`
   Kostenformel + `ModelCatalog`-Stub).
2. `GenerationRun`/`GenerationStep` (Prisma-Schema v2 erweitern: Kernfelder aus
   data-model.md §2; Demo-Runs mit `providerId='mock'`).
3. Worker-Job + SSE-Events (`queued → estimating → awaiting-confirmation → running
   → partial-content → completed`), Preflight-Bestätigung mit simulierten Kosten.
4. **Netzwerk-Guard:** E2E-Test, der beweist, dass im Demo-Modus kein Provider-
   Egress erfolgt.

## 5. Akzeptanzkriterien

E2E Demo: Konzept → Gliederung → Kapitel; partielle AST-Knoten erscheinen live in
der Preview; Netzwerk-Guard grün; Preflight zeigt simulierte Kosten; Demo-Banner
permanent; keine Konsolenfehler; alle Pflichtchecks grün.

## 6. Non-Goals (WP-C2)

Reale Provider-Adapter (Anthropic/OpenAI/Gemini), Billing, echte Kosten-Ledger
über die Simulation hinaus, Repair-Engine, echte Exporte, Auth-Ausbau.

## 7. Konventionen

Weiter auf `feature/*` von `staging`; `main` unantastbar. Neue Angular-Lib:
ng-packagr + `ng-package.json allowedNonPeerDependencies` für `@kdp/*`,
`composite:false`-tsconfig-Override + `disableReferencedProjectLoad`, Test-Target
`dependsOn ["^build"]`. Jede Funktion ≤14 Zeilen, JSDoc, kein `console.*`,
kein `innerHTML`, Boundaries einhalten.
