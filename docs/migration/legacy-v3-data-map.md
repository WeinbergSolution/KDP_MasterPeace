# Legacy V3 — Data Map

Maps the Legacy `emptyProject` shape (and derived state) onto the target
contracts (`libs/contracts`, Zod), domain (`libs/domain`), and persistence
(`apps/api/prisma/schema.prisma`). Date: 2026-07-15 · Package 1.

Existing persistence (schema v1, WP-B5): `Organization`, `Project`
(`contentLocale`, `marketLocale`, `demoMode`, 4× `AiDisclosureLevel`,
`deletedAt`), `Book` (`workingTitle`, `formatProfile`), `BookVersion`
(`versionNumber`, `etag`, `label`, `parentVersionId`), `BookDocument`
(`schemaVersion`, `astHash`, `ast` JSONB). Reference: `docs/architecture/data-model.md`.

Rule (§6): replace `window.storage`, `Date.now()`/`Math.random()` ids, and free
untyped objects with Zod-validated contracts, ULID/cuid ids, and Prisma rows.

---

## 1. `emptyProject` field-by-field

| Legacy field | Meaning | Target home | Notes |
|---|---|---|---|
| `niche` (string) | niche/free text | `Project` + `NichePack` ref (libs/skills) | free niche allowed; versioned pack |
| `language` | **book** language | `Project.contentLocale` | already exists |
| (research market) | de/en market | `Project.marketLocale` | already exists |
| `bookType` | workbook/ratgeber/roman | `Book.formatProfile` (+enum align) | enum has workbook/paperback/nonfiction/ebook → add/align `ratgeber`/`roman` mapping in a `BookType` contract |
| `chapterCount` | target chapters | transient outline input | not persisted as truth; outline length is |
| `ideas[]` | concept candidates | `IdeaConcept[]` contract (ephemeral or `GenerationRun` output) | validated `{title,subtitle,audience,promise}` |
| `trends[]` | trend findings | `ResearchRun` result (libs/research) | with sources |
| `digitalIdeas[]` | digital product ideas | `ResearchRun` result | with sources |
| `gaps[]` | review gaps | `ResearchRun` result | with sources |
| `titleTests[]` | scored titles | `GenerationRun` output | heuristic score flagged |
| `series[]` | follow-up volumes | `GenerationRun` output → `createProjectFrom` | |
| `voice{sample,profile}` | author DNA | `AuthorVoiceProfile` contract + row | consent + version + source-lang |
| `launch{posts,emails}` | launch kit | `LaunchContent` rows (libs/book-launch) | |
| `title/subtitle/audience/promise/author/bio` | book meta | `Book`/`BookMeta` contract | `workingTitle` exists; add subtitle/audience/promise/author/bio |
| `outline[]` `{id,title,goal,content}` | chapters | Book AST (`chapter` nodes) in `BookDocument.ast` | ids → ULID; content parsed to AST |
| `extras{einleitung,arbeitsweise,schlusswort,autorin,bonus}` | matter | Book AST `frontMatter`/`backMatter`/`authorProfile` nodes | already modelled in AST |
| `cover{pageCount,paper,bg,fg,blurb,brief,imgPrompt,imageUrl}` | cover | `CoverSpec` contract + `Asset` (image) | imageUrl → object-storage `Asset` |
| `pub{binding,price,ebookPrice,checks}` | publish | `PublishState` contract/row | checks = guide ticks |
| `digital{format,fontSize,accent,align,withExtras,sel}` | digital export cfg | `DigitalExportSpec` contract | |
| `settings{trim,pages,font,fontSize,lineHeight,align,wordTarget}` | formatting | `FormatSettings` contract (+ libs/domain specs) | trim/gutter/font keys already in domain |
| `kdp{beschreibung,keywords,kategorien}` | marketing pkg | `KdpPackage` contract/row | 7-keyword invariant |

Derived (not persisted): `stats` (words/pages), `audit`, `preflight`,
`readability` — recomputed by domain/quality services.

## 2. Global constants → domain/contracts

| Legacy const | Target |
|---|---|
| `TRIMS`, `GUTTERS`, `PAPERS`, `FONTS` | `libs/domain/kdp-specs` (TRIMS/GUTTER/PAPER exist) + `FontCatalog` |
| `BOOK_TYPES` | `BookType` contract (workbook/ratgeber/roman) |
| `NICHES` | `NichePack` seed (libs/skills) |
| `LANGS`, `BOOK_STRINGS` | i18n + `PublishingStrings` contract (ADR-0006) per locale de/en/es/fr/it |
| `STEPS`, `EXTRA_DEFS` | studio-web workflow config + `extrasFor(bookType)` domain rule |
| `DIGITAL_FORMATS` | `libs/domain` digital format table |
| `KDP_GUIDE`, `EMAIL_PLAN` | studio-web publishing config + `book-launch` |
| `FILLERS` | `libs/quality` readability (per-language filler lists) |
| `SYS_AUTOR`, `FORMAT_REGELN`, prompt builders | `libs/skills` skill prompt templates (versioned) |
| `estimatePrintCost`, `spineWidthMm`, `countWords` | `libs/domain` (spine/cost exist; add print-cost + word count) |

## 3. New Prisma models required (later WPs, not in this doc-only package)

Aligned with `data-model.md` §2 (Generierung, Research, Export, Assets, Usage):

- `AuthorVoiceProfile` (projectId, version, sourceLocale, profile, sampleRef, consentAt)
- `GenerationRun` / `GenerationStep` (projectId, bookVersionId, taskType, provider,
  model, locale, phase, estimate, actualUsage, idempotencyKey, status) — WP-C2
- `ResearchRun` + `ResearchSource` (url, title, fetchedAt, excerpt, qualityRating)
- `ImageGenerationRun` (provider, jobId, status, assetId)
- `ExportJob` (kind, status, artifactAssetId, validationReport) — WP-C6
- `Asset` (kind, storageKey, mime, byteSize, sha256, signedUrlExpiry) — ADR-0009
- `UsageLedger` / cost entries (append-only) — ADR-0017
- `KdpPackage`, `PublishState`, `LaunchContent`, `CoverSpec` (or JSONB on Book)

## 4. Legacy backup ↔ new backup

`exportBackup` writes `{project, step}`; `importBackup` runs `mergeProject`.
The **v1/v2 legacy backup importer already exists** (`libs/document-model`
`importLegacyBackup`, WP-C1) and maps a legacy project into the Book AST. The
V3 backup format extends this with the new sections (research/editorial/cover/
launch/publish) as a versioned, Zod-validated schema; import remains
non-destructive (new BookVersion) and preserves all content (no silent drop).

## 5. Invariants to enforce (from `data-model.md` §4 + brief)

- Book language (`contentLocale`) independent of UI locale.
- Every generation/research/image/export run pins provider+model+locale+version
  and (for AI) an idempotency key; retries never double-charge the ledger.
- Assets persisted to object storage; remote provider URLs are never the sole
  reference (they expire).
- KDP marketing package: exactly 7 keywords, each ≤50 chars.
- Optimistic concurrency via `BookVersion.etag` (no silent overwrite).
- AI disclosure levels are first-class (`Project.disclosure*`); humanize/translate
  never flip disclosure to hide AI involvement.
