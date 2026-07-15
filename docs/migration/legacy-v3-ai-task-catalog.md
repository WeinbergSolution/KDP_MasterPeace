# Legacy V3 — AI / Research / Image Task Catalog

Every AI-backed task in `kdp-workbook-studio.tsx`, its provider channel, expected
structured output, and the target contract. All tasks move behind the
provider-neutral server orchestration (`libs/ai-core`, `libs/research`,
`libs/image-generation`); **no provider call from Angular**. Outputs are
Zod-validated at the boundary (replacing `tryParseJson`'s aggressive repair).
Date: 2026-07-15 · Package 1.

Channels in the reference:
- **LLM** — `askClaude` → `callModel` → `fetch(api.anthropic.com)` (model
  `claude-sonnet-4-6`), fallback `window.claude.complete`.
- **LLM+Search** — `askClaudeWithSearch` (adds `web_search_20250305` tool).
- **Image** — `askHiggsfieldImage` (MCP `mcp.higgsfield.ai`).

Target: `LlmProviderAdapter`, `SearchProviderAdapter`,
`ImageGenerationProviderAdapter` (ADR-0014 credentials, ADR-0016 streaming,
ADR-0017 cost). System prompts (`SYS_AUTOR`, `FORMAT_REGELN`, `sysAutor(project)`,
`bookContext(project)`) become **versioned skill templates** in `libs/skills`.

Status note: all live runs are `BLOCKED_BY_CREDENTIAL` until keys exist; adapters,
contracts, prompt templates, error handling and **test-mocks** are built anyway
(mocks live only in tests). The book-writing tasks must return a **validated Book
AST subtree or AstPatch**, never raw text injected into the preview.

| Task | Trigger | Channel | Structured output (Zod target) | Skill/prompt | Notes / guardrails |
|---|---|---|---|---|---|
| `BOOK_CONCEPTS` | `genIdeas` | LLM | `IdeaConcept[4] {title,subtitle,audience,promise}` | ideation | market/lang aware |
| `MARKET_TREND_RADAR` | `genTrends` | LLM+Search | `TrendResult[3] {thema,warum,nachfrage,wettbewerb,idee,sources[]}` | research | sources+fetchedAt; no Amazon-internal claim; original ideas |
| `DIGITAL_PRODUCT_RADAR` | `genDigitalIdeas` | LLM+Search | `DigitalIdea[3] {format,thema,warum,preis,kapitel,idee,sources[]}` | research | price = orientation only |
| `REVIEW_GAP_ANALYSIS` | `genGaps` | LLM+Search | `ReviewGap[4] {kritik,chance,haeufig,sources[]}` | research | no fabricated reviews; no long copyrighted quotes |
| `TITLE_VARIANT_SCORING` | `genTitleTests` | LLM | `TitleVariant[8] {t,u,s,w}` sorted | ideation | score = heuristic, not Amazon forecast |
| `AUTHOR_VOICE_PROFILE` | `genVoice` | LLM | `AuthorVoiceProfile {rules,noGos,sourceLocale}` | editorial | consent; never "perfect imitation" |
| `BOOK_OUTLINE` | `genOutline`,autopilot | LLM | `{kapitel:[{titel,ziel}]}` → `chapter` AST nodes | outline | type-arc; ULID ids; regen warns |
| `CHAPTER_DRAFT` | `writeChapter` | LLM | Book AST subtree (validated) | writing | type/DNA/lang aware |
| `CHAPTER_REWRITE` | `writeChapter` (re) | LLM | Book AST subtree | writing | replaces chapter content |
| `CHAPTER_EXTEND` | `extendChapter` | LLM | AST subtree appended | writing | seamless continuation |
| `EXTRA_INTRODUCTION`/`_FOREWORD` | `genExtra('einleitung')` | LLM | matter AST | matter | roman → foreword variant |
| `EXTRA_USAGE_GUIDE` | `genExtra('arbeitsweise')` | LLM | matter AST | matter | non-roman only |
| `EXTRA_CONCLUSION`/`_AFTERWORD` | `genExtra('schlusswort')` | LLM | matter AST | matter | review-request ask |
| `EXTRA_AUTHOR_BIO` | `genExtra('autorin')` | LLM | `authorProfile` AST | matter | no invented credentials |
| `EXTRA_BONUS` | `genExtra('bonus')` | LLM | matter AST | matter | `[DEIN-LINK]` placeholder preserved |
| `BOOK_AUTOPILOT` | `runAutopilot` | LLM (orchestration) | sequence of the above | orchestration | GenerationRun/Step, checkpoints, stop/resume, idempotency, usage |
| `TRANSLATE_BOOK` | `runTranslate` | LLM | translated AST → **new BookVersion** | translation | non-destructive; glossary/TM; resets KDP pkg |
| `HUMANIZE_MANUSCRIPT` | `runHumanize` | LLM | AST/AstPatch + diff | editorial | markup-preserving; not detector evasion; disclosure intact |
| `PROOFREAD_MANUSCRIPT` | `runProofread` | LLM | `{fehler:[{falsch,richtig}]}` → AstPatch | editorial | ≤25; diff+undo; language-aware |
| `REDUCE_EM_DASHES` | `runDashFix` | LLM | `{ersetzungen:[{alt,neu}]}` → AstPatch | editorial | ≤3 passes; keep number ranges |
| `CLEAN_IMPORTED_STRUCTURE` | `runStructureFix` | LLM | `{kapitel:[indices]}` | import | merges false subheadings; preview+undo |
| `SIMULATED_BETA_READER_PANEL` | `genBeta` | LLM | `Persona[3] {name,profil,begeistert,fehlt,absprung}` | editorial | labelled simulated personas |
| `QUALITY_TIPS` | `genTips` | LLM | markdown list 4–6 | editorial | from local audit summary |
| `KDP_MARKETING_PACKAGE` | `genKdp` | LLM+Search | `{beschreibung,keywords[7],kategorien[3],sources[]}` | marketing | 7 KW ≤50 chars; no A9/A10 guarantee; validate categories |
| `COVER_BLURB` | `genBlurb` | LLM | text (back-cover) | cover | |
| `COVER_DESIGN_BRIEF` | `genBrief` | LLM | markdown brief | cover | |
| `COVER_IMAGE_PROMPT` | `genCoverPrompt` | LLM | prompt text (front+back) | cover | "no text in image" clause |
| `GENERATE_COVER_IMAGE` | `genCoverImage` | Image (Higgsfield) | image asset URL → **stored Asset** | image | credits confirm; persist asset; MIME/size/safety |
| `LAUNCH_SOCIAL_PLAN` | `genPosts` | LLM | `Post[30] {t,idee}` (2 batches) | launch | |
| `LAUNCH_EMAIL_SEQUENCE` | `genEmails` | LLM | `Email[5] {tag,betreff,text}` | launch | `EMAIL_PLAN` roles day 0/2/4/6/8 |
| `BOOK_SERIES_PLAN` | `genSeries` | LLM | `Band[2] {titel,untertitel,fokus,zielgruppe,versprechen}` | series | one-click new project |

## Deterministic (NOT AI) — do not route through a provider

`applyTypography`/`cleanText` (TypographyNormalizer), `readabilityOf`,
`preflight`, `estimatePrintCost`, `spineWidthMm`, `countWords`,
`parseBlocks`/`groupLinesWithQuestion` (already `libs/document-model`),
`collectQuotes`/`collectExercises`, `blocksToAudio`. These belong in
`libs/domain`/`libs/quality`/`libs/document-model` and are fully unit-testable now.

## Boundary rules applied to every task

1. Server-only execution; API key in backend secret store (ADR-0014).
2. Structured output validated by Zod; on invalid → typed error + one repair
   retry (no silent truncation).
3. Persisted `GenerationRun`/`GenerationStep` (+ `ResearchRun`/`ImageGenerationRun`)
   with provider, model, task type, locale, project version, estimate, actual usage.
4. Streaming via the ADR-0016 protocol; cancellation + timeout + retry with
   idempotency (no double charge).
5. Cost estimate before run; real cost after (ADR-0017); real external cost only
   after visible user confirmation.
6. Writing tasks return validated AST/AstPatch — never raw text into the preview.
