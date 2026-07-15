# Legacy V3 — Behavior Specification

Source: `docs/reference/legacy-v3/kdp-workbook-studio.tsx` (`KdpWorkbookStudio`).
Status: authored from the readable reference content (hash unverified — see
`docs/reference/legacy-v3/README.md`). This document describes **what the product
does** (behavior parity target). Technical patterns to reject are listed per area
and consolidated in the parity matrix and integration plan.

Date: 2026-07-15 · Package 1 (Audit & Characterization).

---

## 0. Shape of the reference

Single React component with local `useState`/`useMemo`/`useRef` state, persisted
through host globals `window.storage` (get/set/delete). All AI runs go through
`callModel` → direct `fetch('https://api.anthropic.com/v1/messages')` with a
fallback to `window.claude.complete`. Research adds the `web_search_20250305`
tool; cover images use an MCP server (`mcp.higgsfield.ai`). Exports are built as
HTML/EPUB strings in-browser and downloaded or opened for `window.print()`.

Global constants define the domain: `TRIMS`, `GUTTERS`, `FONTS`, `PAPERS`,
`BOOK_TYPES`, `NICHES`, `LANGS`, `BOOK_STRINGS`, `STEPS`, `EXTRA_DEFS`,
`DIGITAL_FORMATS`, `KDP_GUIDE`, `EMAIL_PLAN`, `FILLERS`, prompt system strings
(`SYS_AUTOR`, `FORMAT_REGELN`).

---

## 1. Eight-step workflow (`STEPS`)

`0 Idee · 1 Gliederung · 2 Schreiben · 3 Formatierung · 4 Cover · 5 Export ·
6 KDP-Paket · 7 Veröffentlichen`. A left rail switches steps; step completion is
derived (`done` per step: concept set, outline exists, all chapters written,
blurb set, kdp package set, all publish-guide checks ticked). Current `step` is
persisted with the project. Rail also shows live stats (words, chapters written,
estimated pages) and save status.

- **Behavior to keep:** persisted current step, per-step done indicators, direct
  re-open, no content loss on switch, responsive rail (wraps to horizontal on
  ≤900px), keyboard reachable.
- **Reject:** none structurally; re-implement as routed feature modules (§12.1).

## 2. Book types (`BOOK_TYPES`)

`workbook` (exercises, writing lines, scales, checklists, usage guide, bonus),
`ratgeber` (prose, subheadings, examples, tips; no forced writing lines),
`roman` (scenic prose, dialogue; only intro/closing/author extras via
`extrasFor()`; fiction disclaimer). Book type drives: outline arc
(`outlinePrompt`), chapter structure (`generateChapterText`/`extendText`),
which extras exist (`extrasFor`), quality audit rules (`audit`), preview/export
(fiction vs self-help disclaimer in `buildBookBody`/`epubDocs`), autopilot.

## 3. Niches (`NICHES`) + free input

12 predefined niches plus free text (`project.niche`). Chosen via select or typed.
Feeds every research/idea/outline prompt. **Target:** versioned niche/skill config,
not UI-hardcoded; free niche allowed; localizable labels; per-niche safety rules.

## 4. Languages & localization (`LANGS`, `BOOK_STRINGS`)

Book languages: `de,en,es,fr,it`. `project.language` is the **book** language,
independent of UI (UI is German-only in the reference). `BOOK_STRINGS[lang]`
supplies in-book strings: chapter/contents labels, front/back matter titles,
`rights(year,author)`, copyright, self-help vs fiction disclaimer, publisher line.
Prompts switch language and demand idiomatic (not word-for-word) output. Export
sets `<html lang>`, hyphenation, and language-correct quotation marks (`cleanText`).

- **Keep:** book language per project; language-dependent chapter naming, TOC,
  matter titles, copyright, disclaimers, prompt language, export language tag.
- **Reject:** `BOOK_STRINGS` hardcoded in a component — move to i18n/publishing
  string contracts (ADR-0006).

## 5. Project model & management

`emptyProject` (see data-map) with `mergeProject` deep-merge migration. Multiple
projects via a `kdp-index` (`{activeId, list:[{id,title}]}`) plus per-project
`kdp-proj-<id>`. Operations: new, switch (`switchProject`, persists current
first), delete (`deleteProject`, two-tap arm/confirm with 6s timeout), duplicate
(`duplicateProject`, deep clone + " (Kopie)"), create-from-series
(`createProjectFrom`). Autosave: 800ms debounce → `window.storage.set`, visible
"Speichert…/Gespeichert" status. Backup export/import (`exportBackup`,
`importBackup` with `mergeProject`). V1→index migration on load.

- **Keep:** all of the above as user behavior.
- **Reject:** `window.storage`, `Date.now()`/`p+Date.now()` ids. Use the existing
  `ProjectService`/Prisma persistence with ETag/version, conflict + retry; ULID
  ids; server + local draft (ADR-0007, WP-C4).

## 6. Step 1 — Idea

- **Concept generation** (`genIdeas` → `BOOK_CONCEPTS`): 4 concepts
  `{titel,untertitel,zielgruppe,versprechen}`; select one (`pickIdea`) fills
  book fields; all editable. Market/language aware.
- **Trend radar** (`genTrends` → `MARKET_TREND_RADAR`, web search): 3 original
  chances `{thema,warum,nachfrage,wettbewerb,idee}`; adopt (`pickTrend`). Explicit
  disclaimer: web research, not Amazon internal sales; ideas original not copied.
- **Digital product radar** (`genDigitalIdeas` → `DIGITAL_PRODUCT_RADAR`): PDF
  product ideas `{format,thema,warum,preis,kapitel,idee}`; one-click setup
  (`pickDigitalIdea`) as compact workbook. Price = orientation only.
- **Review-gap finder** (`genGaps` → `REVIEW_GAP_ANALYSIS`): 4 `{kritik,chance,
  haeufig}`. Source-based; no fabricated reviews.
- **Book fields**: title, subtitle, audience, author, promise, bio; all editable.
- **Title tester** (`genTitleTests` → `TITLE_VARIANT_SCORING`): 8 scored variants
  `{t,u,s,w}` sorted desc; adopt on tap. Score = heuristic, not Amazon forecast.
- **Author DNA** (`genVoice` → `AUTHOR_VOICE_PROFILE`): sample (≥200 chars) →
  editable style profile; applied to all prompts via `sysAutor()`; copied on
  series/duplicate. Never claim to perfectly imitate a person.

## 7. Step 2 — Outline & import

- **Outline** (`genOutline` → `BOOK_OUTLINE`): exactly `chapterCount` chapters
  `{id,title,goal,content:""}`, type-dependent arc. Regenerate warns about content
  loss. Manual add/edit/move/merge/delete (`addChapter`, `moveChapter`,
  `mergeChapterUp`, `removeChapter`). IDs `Date.now()+i` — **reject**, use ULID.
- **PDF manuscript import** (`handlePdfFile`): pdf.js text extraction per page
  with progress; `linesFromItems` groups by Y; `reconstructText` removes
  headers/footers/page-numbers, detects the original TOC and skips it,
  reconstructs paragraphs, marks headings (`===` chapter, `##`/`###` sub);
  `splitIntoChapters` splits on `===` and merges too-short sections;
  `cleanText` typography. Replace (armed confirm) or append. Scanned-PDF fallback
  → manual paste. **Reject:** dynamic CDN script injection, unpinned pdf.js, no
  size/MIME/timeout limits. Use a pinned, sandboxed parser (server or vetted
  browser dep); size/MIME/signature validation; import preview + source mapping;
  archive original with consent.
- **Structure cleanup** (`runStructureFix` → `CLEAN_IMPORTED_STRUCTURE`): AI picks
  true chapter starts; merges false subheadings back (kept as `##`); preview + undo.

## 8. Step 3 — Writing

- **Chapter draft/rewrite/extend** (`writeChapter`/`generateChapterText`,
  `extendChapter`/`extendText` → `CHAPTER_DRAFT`/`CHAPTER_REWRITE`/`CHAPTER_EXTEND`):
  type-aware structure, author DNA, language, book context; live preview via
  `parseBlocks` + `Blocks`. Manual editor. Word count shown.
- **Autopilot** (`runAutopilot` → `BOOK_AUTOPILOT`): create outline if missing →
  write each chapter to word target (`700/1200/1800/2400`) with up to 4 extend
  passes, skipping chapters already ≥ min → generate all extras. Progress %, stop
  after safe step (`stopRef`), resume (skips filled), snapshots after each chapter
  (no data loss on error). **Target:** GenerationRun/Step + checkpoints + events +
  cancellation + retry + idempotency + usage ledger + versioned inputs.
- **Translation** (`runTranslate` → `TRANSLATE_BOOK`): whole book (title/subtitle/
  audience/promise, chapter titles + bodies chunked by `chunkByWords`, extras),
  switches `project.language`, resets `kdp` package, progress/stop, partial-
  translation warning. **Reject:** in-place destructive overwrite of the source
  version — target: new BookVersion / language variant, glossary + TM, diff/review.
- **Extras/matter** (`genExtra`/`extraPrompt` → `EXTRA_*`): einleitung,
  arbeitsweise, schlusswort, autorin (uses `bio`), bonus (`[DEIN-LINK]`
  placeholder). Type-dependent set via `extrasFor`.

## 9. Editorial quality (Step 3 tools + Step 6 checks)

- **Humanize** (`runHumanize` → `HUMANIZE_MANUSCRIPT`): chunked per chapter +
  extras; vary sentence length/openings, remove AI clichés, break rule-of-three,
  add concrete detail; **preserve markup/AST**; progress/stop; snapshots. Honesty
  note: quality improvement, **not** detector evasion; KDP AI-disclosure stays.
  **Target adds:** diff preview, accept/reject, undo, BookVersion before/after.
- **Proofread** (`runProofread` → `PROOFREAD_MANUSCRIPT`): per chapter, JSON
  `{fehler:[{falsch,richtig}]}`, applied via string replace, up to 25, samples
  reported; partial progress kept. **Target:** structured patches + diff + undo,
  language-aware, markup preserved, no silent global replace.
- **Em-dash reduction** (`runDashFix`/`dashFixText` → `REDUCE_EM_DASHES`):
  count `— / –`, up to 3 passes, keep number ranges (`8–10`), before/after count.
  No blind regex replacement.
- **Typography** (`applyTypography`/`cleanText`): deterministic — nbsp, multi-
  space, space-before-punctuation, missing space after `,.!?`, ellipsis, dash
  normalization, language quotes, apostrophe, blank lines. → `TypographyNormalizer`
  domain service, fully tested.
- **Readability** (`readabilityOf`, local): avg sentence length, long sentences
  (>25 words), filler-word count (`FILLERS`, language list). No AI. Explainable
  thresholds.
- **Beta panel** (`genBeta` → `SIMULATED_BETA_READER_PANEL`): 3 personas
  `{name,profil,begeistert,fehlt,absprung}`. Clearly labelled simulated AI personas.
- **Quality tips** (`genTips`): 4–6 prioritized improvement suggestions from the
  local audit summary.

## 10. Step 4 — Formatting

Settings: `trim` (`TRIMS`), `pages` gutter group (`GUTTERS`), `font` (`FONTS`),
`fontSize`, `lineHeight`, `align` (justify+hyphenation / left), `wordTarget`.
Live print-like preview via `previewStyle` + `Blocks`; page estimate (`stats`).
Question+writing-lines/scale grouping (`groupLinesWithQuestion`) prevents isolated
answer lines (`page-break-inside: avoid` / `keepTogether`). **Note:** verify
current KDP minimums against official sources (brief §9.26). **Keep:** central
publishing specs with source date, not UI-only truth (`libs/domain/kdp-specs`).

## 11. Step 5 — Cover

Spine (`spineWidthMm` — already in `libs/domain`), full cover size (front+spine+
back+bleed), safe area, barcode zone, spine text ≥100 pages. Colors bg/fg.
Blurb (`genBlurb` → `COVER_BLURB`), design brief (`genBrief` → `COVER_DESIGN_BRIEF`),
image prompt (`genCoverPrompt` → `COVER_IMAGE_PROMPT`), image
(`genCoverImage` → `GENERATE_COVER_IMAGE` via Higgsfield). `buildCoverHtml`
renders final + guides variants. **Reject:** browser-print cover as production PDF;
remote image URL as sole asset. **Target:** CoverSpec/CoverLayout/SpineCalculation/
PrintSpec/AssetReference; server image generation; permanent object-storage asset.

## 12. Step 6 — Export

`QualityAudit` (`audit`) + preflight-ish checks; editorial tools (§9).
Artifacts: print interior (`buildPrintHtml`+`bookCss(true)`), ebook HTML
(`buildEbookHtml`), **EPUB 3** (`buildEpub`+`buildZip`+`crc32`+`epubDocs`),
`.doc`(=HTML), digital product PDF (`buildDigitalHtml`, `DIGITAL_FORMATS`
phone/a5/a4, chapter selection, brand color), single-exercise printables
(`collectExercises`+`buildPrintableHtml`), quote cards PNG 1080²
(`collectQuotes`+`downloadQuoteCard`, canvas), audio script
(`blocksToAudio`+`buildAudioScript`), backup JSON. **Reject:** browser-print as
final PDF, `.doc`=HTML, hand-rolled ZIP with `Math.random` UUID, unvalidated
blobs. **Target:** worker-built EPUB/PDF via `export-epub`/`export-pdf` with
validation (epubcheck/format), stored artifact + hash + size + status (ADR-0011/12/13,
WP-C6).

## 13. Step 7 — KDP marketing package

`genKdp` → `KDP_MARKETING_PACKAGE` (web search): SEO description (150–200 words,
keywords in first sentences), exactly 7 backend keywords (≤50 chars, no title
repeats, no competitor brands), 3 categories. Launch kit: 30-day social plan
(`genPosts` → `LAUNCH_SOCIAL_PLAN`, two batches), 5-mail sequence
(`genEmails` → `LAUNCH_EMAIL_SEQUENCE`, `EMAIL_PLAN` day 0/2/4/6/8). Quote cards,
landing page (`buildLandingHtml`), series planner (`genSeries` → `BOOK_SERIES_PLAN`
+ `createProjectFrom`). Disclaimers: no A9/A10 guarantee, verify categories,
validate keywords, check brand/forbidden terms.

## 14. Step 8 — Publishing

Local **preflight** (`preflight` useMemo): title/subtitle length (≤200), author
present, empty chapters, page min/max per binding, gutter vs page count,
description length (≤4000), keyword count/length, `[DEIN-LINK]` placeholder,
missing extras, blurb. Errors/warnings/ok. **Price calculator**: `estimatePrintCost`
(paperback/hardcover), list price, royalty (60% net − print cost), min price,
ebook royalty (70% 2.99–9.99 else 35%). Estimation only; official calculator is
binding. **Upload guide** (`KDP_GUIDE`, 9 steps) with per-step tick persistence and
copy buttons. Legal/tax = general info only; verify KDP figures with sources + date.

## 15. Cross-cutting utilities

- `parseBlocks`/`groupLinesWithQuestion` — Legacy markup → block tree (already
  re-implemented in `libs/document-model` as the canonical AST + parser, WP-C1).
- `Blocks`/`blocksToHtml`/`blocksToAudio` — renderers (React preview already
  replaced by `libs/preview`; HTML/audio renderers → export libs).
- `tryParseJson` — model JSON parsing/repair. **Reject** aggressive truncation →
  structured outputs validated by Zod at the provider boundary.
- `download`/`downloadBlob`/`openHtml` — client download/print. → real artifacts
  via API/worker + signed object-storage URLs.
- `countWords`, `estimatePrintCost`, `spineWidthMm` — pure domain (partly already
  in `libs/domain`).

## 16. Error & empty states (behavior to preserve)

Global error banner (`error`), success notice (`notice`, dismissable), manual-copy
fallback when clipboard blocked (`manualCopy`), autobar with progress + stop
(`auto`), armed two-tap confirms (`arm`/`confirmArm`), "no outline yet" guidance,
partial-progress-kept messages on interruption, popup-blocked → download fallback.
All of these are good product behavior and are kept; only their unsafe mechanics
(silent catches, host globals) are replaced with typed error handling and the
observability logger (no `console.*`).
