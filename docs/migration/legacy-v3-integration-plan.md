# Legacy V3 — Integration Plan

How the inventoried Legacy V3 product (behavior-spec, parity-matrix, data-map,
ai-task-catalog) is delivered into the existing KDP MasterPeace architecture,
package by package, on `feature/legacy-v3-product-parity-preview` (base `5a3746c`,
= WP-C1 tip). No new libraries beyond the existing taxonomy unless justified.
Date: 2026-07-15 · Package 1.

## 0. Guiding decisions

- **Reuse existing taxonomy** (§12.1): `libs/{ai-core,ai-providers,generation,
  research?,image-generation?,quality,skills,export-core,export-epub,export-pdf,
  export-docx,billing,document-model,preview,domain,contracts,projects,
  projects-prisma,observability}` + `apps/{studio-web,api,worker}`. Only **two**
  candidate new libs are needed and are not yet present: `libs/research` and
  `libs/image-generation` (the reference clearly has search + image provider
  concerns with no existing home). `libs/book-launch` for launch/landing MAY be a
  thin feature lib or folded into `studio-web` + `generation`; decided in Package 9.
- **Addendum overrides demo mode**: the product runs real; mocks are test-only.
  `Project.demoMode` (schema v1) is retained as an internal test/QA flag, not a
  product surface. Unconfigured provider → "Integration nicht konfiguriert".
- **Credential-independent first**: build everything that does not require keys to
  a finished, tested state; provider live-runs are `BLOCKED_BY_CREDENTIAL`.
- **Alignment with roadmap**: this program advances the existing Phase C/D WPs
  (`production-roadmap.md`), re-scoped from "demo" to "production" per the addendum.
  WP-C2 mock→real provider, WP-C6 exports, WP-D* credentials all apply.

## 1. Package sequence (§23) and mapping

Each package ends with: relevant tests, mandatory checks, commit, push, status.

### Paket 1 — Audit & Characterization ✅ (this package)
Reference archive (§7) + behavior-spec + parity-matrix + data-map + ai-task-catalog
+ this plan. No product code. Doc-only. **Credential-independent.**

### Paket 2 — Contracts & Domain (credential-independent)
`libs/contracts`: `BookType`, `IdeaConcept`, `TrendResult`/`DigitalIdea`/
`ReviewGap` + `ResearchSource`, `TitleVariant`, `AuthorVoiceProfile`,
`FormatSettings`, `CoverSpec`, `KdpPackage`, `PublishState`, `DigitalExportSpec`,
`LaunchContent`, `PublishingStrings` (de/en/es/fr/it), V3 backup schema.
`libs/domain`: extend `kdp-specs` (fonts, digital formats, verify KDP minimums +
source date), `estimatePrintCost`, `countWords`, `extrasFor(bookType)`, royalty.
`libs/quality`: `TypographyNormalizer`, `readability`, preflight rules
(deterministic). **Tests:** unit for every rule/normalizer; contract round-trips.

### Paket 3 — Persistence & Migration (credential-independent)
Prisma v2 additions (data-map §3): `AuthorVoiceProfile`, `GenerationRun`/`Step`,
`ResearchRun`/`ResearchSource`, `ImageGenerationRun`, `ExportJob`, `Asset`,
`UsageLedger`, `KdpPackage`/`PublishState`/`LaunchContent`/`CoverSpec` (rows or
JSONB on Book). Migrations + seeds (DE/EN/ES/FR/IT niche packs, sample projects
for the three book types). V3 backup import (extends `importLegacyBackup`).
**Tests:** integration (real PostgreSQL, as WP-B5); non-destructive import.

### Paket 4 — Studio Shell (credential-independent)
`apps/studio-web`: routed 8-step workflow (`shell/`, `project-switcher/`,
`workflow/`, `routes/{idea,outline,writing,formatting,cover,export,marketing,
publishing}`); responsive rail, progress/done, saved step, no content loss;
Angular Signals for local UI state (ADR-0007). Project switcher/new/duplicate/
delete(2-tap)/autosave-status wired to `ProjectService`. **No demo banner.**
**Tests:** component per step; responsive (7 viewports); a11y.

### Paket 5 — Idea & Research (provider-dependent → contracts+adapters+mocks now)
`libs/generation` + `libs/ai-core`/`ai-providers`: concept, title-tester, author-DNA.
`libs/research` (new) + `SearchProviderAdapter`: trend/digital/review-gap.
UI in `routes/idea`. Live runs `BLOCKED_BY_CREDENTIAL`; **contract-tests vs mock**;
"nicht konfiguriert" state. ResearchRun persistence + sources.

### Paket 6 — Writing & Editorial
Outline, chapter draft/rewrite/extend, autopilot (worker + SSE), translation
(new BookVersion), extras. Editorial: humanize (diff/undo/version), proofread
(patch), dash-fix, structure-fix; typography/readability/beta already partly
Paket 2. Book tasks emit validated AST/AstPatch (WP-C5 patch schema exists).
Live `BLOCKED_BY_CREDENTIAL`; orchestration + persistence + mocks built.

### Paket 7 — Format, Cover & Assets
Formatting settings + live preview (reuse `libs/preview`, `libs/domain`).
Cover geometry (domain spine/cover exist) → `CoverSpec`/`CoverLayout`.
Blurb/brief/prompt (LLM). `libs/image-generation` (new) + Higgsfield adapter
(server, MCP/API per current docs) → `ImageGenerationRun` + object-storage `Asset`.
Higgsfield MCP requires connector authorization → `BLOCKED_BY_CREDENTIAL`.

### Paket 8 — Export & Publishing (mostly credential-independent)
`export-epub` (real EPUB 3 + epubcheck), `export-pdf` (print interior + cover +
digital PDF via worker), `export-docx` (real DOCX, not `.doc`=HTML),
printables, quote-card PNG, audio script, landing page (sanitized). ExportJobs +
ValidationReport UI + KDP-package ZIP. Preflight + price calculator + upload guide.
**Tests:** `validate:epub`/`validate:pdf`/`validate:docx`; artifact hash+size.
Real artifacts, no browser-print. **Credential-independent** (no provider needed).

### Paket 9 — Launch (provider-dependent)
Series planner, 30-day social plan, 5-mail sequence (`book-launch`/`generation`).
Live `BLOCKED_BY_CREDENTIAL`; mocks + persistence.

### Paket 10 — Visible product + deployment prep
End-to-end wiring, screenshots (7 viewports), visual checks, Vercel (frontend) +
API/worker deploy config (Dockerfiles/manifests verified, prod build green).
**No live deploy without separate approval** (per user + addendum §9). PR to
`staging` prepared, not merged.

## 2. Provider / infra integration points (server-side only)

| Concern | Adapter | ADR | Live status |
|---|---|---|---|
| LLM (Anthropic first) | `LlmProviderAdapter` (libs/ai-core + ai-providers) | 0014,0016,0017 | BLOCKED_BY_CREDENTIAL |
| Web search | `SearchProviderAdapter` (libs/research) | 0014 | BLOCKED_BY_CREDENTIAL |
| Image (Higgsfield) | `ImageGenerationProviderAdapter` (libs/image-generation) | 0009,0014 | BLOCKED_BY_CREDENTIAL (MCP connector unauthorized) |
| PostgreSQL | Prisma (exists) | 0003 | available locally |
| Redis/BullMQ | worker queues (exist: generation/export/validation) | 0008 | available locally |
| Object storage | storage adapter | 0009 | DEFERRED_WITH_CONTRACT (local MinIO/dev) |

`.env.example` gains the required keys; **no secret is read, created, or committed**.

## 3. BLOCKED_BY_CREDENTIAL register (current)

Real execution and E2E of: all LLM tasks (Paket 5/6/9), all search tasks
(Paket 5, KDP pkg Paket 8-marketing), Higgsfield image (Paket 7), any live
deployment (Paket 10). Everything else — contracts, domain, persistence, UI,
deterministic services, export artifacts, error handling, adapters, and their
test-mocks — is built and verified without credentials.

## 4. Open questions / clarifications for the owner

1. **Raw reference file** for SHA-256 verification (README action).
2. **First real LLM provider** confirm = Anthropic (roadmap WP-D4 assumes it)?
   Which search provider is licensed? Higgsfield MCP connector authorization.
3. **Object storage** target for local/prod (MinIO dev? R2/S3 prod?) per ADR-0009.
4. **`FormatProfile` enum**: extend to represent `ratgeber`/`roman` explicitly, or
   map via a separate `BookType` contract (plan assumes the latter).
5. **`libs/research` / `libs/image-generation` / `libs/book-launch`** creation:
   confirmed acceptable as new libs (taxonomy has no existing home for search /
   image / launch concerns).
6. **Deployment approval**: live deploy is out until separately approved (§9 / user).

## 5. Definition of Done tracking

The addendum §12 DoD is tracked per package. Package 1 satisfies: full parity
matrix created; reference archived; honest hash status; no product change; `main`
and `staging` untouched.
