# Datenmodell KDP MasterPeace

ER-Modell (PostgreSQL/Prisma) und zentrale TypeScript-Contracts.
IDs: ULID (sortierbar, kollisionssicher – Ersatz für Legacy `Date.now()`, Befund N05).
Alle Tabellen: `createdAt`, `updatedAt`; Soft-Delete (`deletedAt`) wo Nutzer löschen kann.
Ledger-Tabellen (`UsageRecord`, `CostRecord`, `AuditLog`) sind **append-only** (kein UPDATE/DELETE, per DB-Grant erzwungen).

---

## 1. ER-Übersicht (Kardinalitäten)

```
User 1─n Identity                    Organization 1─n Membership n─1 User
User 1─n Session                     Membership n─1 Role
Organization 1─1 Subscription n─1 Plan
Plan 1─n Entitlement
User/Org 1─n ProviderConnection 1─1 ProviderCredential (verschlüsselt)
ModelCatalogEntry n─n ModelRoutingPolicy (über RoutingRule)

Organization 1─n Project 1─n Book 1─n BookVersion 1─1 BookDocument (AST-JSONB)
Book 1─1 BookSettings          BookVersion 1─n Chapter (materialisierte Kapitel-Sicht)
Project 1─n Asset              Project 1─1 CoverProject

Skill 1─n SkillVersion 1─n SkillTranslation
SkillVersion 1─n PromptTemplate      SkillVersion 1─n QualityRule
WorkflowTemplate n─1 SkillVersion

GenerationRun 1─n GenerationStep 1─n GenerationArtifact
GenerationStep 1─1 TokenEstimate     GenerationStep 1─n UsageRecord 1─1 CostRecord
BookVersion 1─n QualityIssue 1─n RepairProposal 1─n RepairApplication
BookVersion 1─n ExportJob 1─n ExportArtifact 1─1 ValidationReport
* ─n AuditLog                        FeatureFlag (global/plan/user-scoped)
```

## 2. Entitäten (Kernfelder)

### Identität, Organisation, Abo

| Entität | Kernfelder |
|---|---|
| `User` | email (unique), passwordHash?, emailVerifiedAt?, displayName, uiLocale, status |
| `Identity` | userId, provider ('google'…), providerSubject, rawProfile |
| `Organization` | name, kind ('personal'\|'team'); jeder User erhält eine Personal-Org (Mandantenanker) |
| `Membership` | orgId, userId, roleId |
| `Role` | key ('owner'\|'admin'\|'member'\|'platform-admin'), permissions (jsonb) |
| `Plan` | key ('free-demo'\|'starter'\|'pro'\|'byok'…), priceCents, interval, status |
| `Subscription` | orgId, planId, status, currentPeriodEnd, cancelAtPeriodEnd, graceUntil |
| `Entitlement` | planId, key ('max-projects'\|'monthly-credits'\|'byok-allowed'\|'export-kdp-package'…), limitValue |

### Provider & Modelle

| Entität | Kernfelder |
|---|---|
| `ProviderConnection` | orgId, providerId ('anthropic'\|'openai'\|'gemini'\|'mock'), mode ('platform'\|'byok'), status |
| `ProviderCredential` | connectionId, ciphertext, keyVersion, algo ('aes-256-gcm'), lastRotatedAt – **nie Klartext-Read-API** |
| `ModelCatalogEntry` | providerId, modelId, displayName, contextWindow, maxOutputTokens, inputPricePerMTokCents, outputPricePerMTokCents, validFrom, validTo?, capabilities (structured, streaming, tokenCount) |
| `ModelRoutingPolicy` | scope (global/plan/org), rules: TaskType → { modelRef, maxOutputTokens, temperature, fallbackModelRef, maxCostCentsPerStep } |

### Projekte & Dokumente

| Entität | Kernfelder |
|---|---|
| `Project` | orgId, name, contentLocale, marketLocale, intakeAnswers (jsonb), demoMode (bool), aiDisclosure (text/cover/interiorImages/translation je: human\|ai-assisted\|ai-generated) |
| `Book` | projectId, workingTitle, formatProfile ('workbook'\|'paperback'\|'nonfiction'\|'ebook'), activeVersionId |
| `BookVersion` | bookId, versionNumber, parentVersionId?, label ('autosave'\|'snapshot'\|'pre-repair'\|'export'), createdBy, immutable ab Referenzierung durch Export/Run |
| `BookDocument` | bookVersionId, schemaVersion, ast (jsonb, Zod-validiert), astHash |
| `BookSettings` | bookId, trim, paper, gutterProfile, font, fontSize, lineHeight, align, wordTargetPerChapter, bleed (bool) |
| `Chapter` | bookVersionId, orderIndex, nodeId (Verweis in AST), title, goal, wordCount (materialisiert für Listen/QA) |
| `Asset` | projectId, kind ('image'\|'cover-art'…), storageKey, mime, bytes, checksum |
| `CoverProject` | projectId, pageCountFinal?, pageCountEstimated, paper, colors, blurb, designBrief, lastComputedDims (jsonb) |

### Skills

| Entität | Kernfelder |
|---|---|
| `Skill` | key ('self-development-crisis-and-self-worth'), kind ('niche'\|'audience'\|'format'\|'locale'\|'safety'\|'task'\|'quality'\|'global'), ownerScope |
| `SkillVersion` | skillId, semver, status ('draft'\|'testing'\|'published'\|'deprecated'\|'archived'), definition (jsonb, schema-validiert), publishedAt, publishedBy; **published = immutable** |
| `SkillTranslation` | skillVersionId, locale ('de'\|'en'\|'es'), translatedFields (jsonb), status |
| `WorkflowTemplate` | key ('workbook-full-run'), steps: TaskType-Sequenz + Abhängigkeiten, skillSlots |
| `PromptTemplate` | skillVersionId, taskType, template, outputSchemaRef, version, tokenBudgetHint |
| `QualityRule` | skillVersionId? (oder global), key, scopeType, severity, params (jsonb), deterministicFix?, aiRepairPromptRef?, locales |

### Generierung, Usage, Kosten

| Entität | Kernfelder |
|---|---|
| `GenerationRun` | projectId, bookVersionId (Ausgangsversion), workflowKey, mode ('manual'\|'autopilot'\|'demo'), status, totalEstimate (jsonb), confirmedAt/By, cancelledAt?, resumeOfRunId? |
| `GenerationStep` | runId, taskType, orderIndex, skillVersionId, promptTemplateVersion, providerId, modelId, params (temperature…), inputHash, idempotencyKey, status, retryCount, errorClass?, startedAt, finishedAt, outputHash, validationResult (jsonb) |
| `TokenEstimate` | stepId, estInputTokens, estOutputTokensP50/P90, estCostCentsMin/Expected/Max, basis ('provider-endpoint'\|'calibrated') |
| `GenerationArtifact` | stepId, kind ('concepts'\|'outline'\|'chapter-ast'\|'patch'\|'marketing'…), payloadRef (jsonb oder storageKey), appliedToVersionId? |
| `UsageRecord` (append-only) | stepId, providerId, modelId, actualInputTokens, actualOutputTokens, cacheTokens?, reasoningTokens?, providerRequestId |
| `CostRecord` (append-only) | usageRecordId, catalogEntryId (Preisversion!), costCents, currency, estimateDeltaCents |

### Qualität & Reparatur

| Entität | Kernfelder |
|---|---|
| `QualityIssue` | bookVersionId, ruleId, severity ('info'\|'warning'\|'error'\|'blocking'), scopeType ('book'\|'chapter'\|'section'\|'node'\|'export'), scopeId, chapterId?, nodeId?, locale, messageKey, evidence (jsonb), deterministicFixAvailable, aiRepairAvailable, status ('open'\|'proposed'\|'resolved'\|'ignored') |
| `RepairProposal` | issueId, source ('deterministic'\|'ai'\|'assistant'), patch (jsonb, AST-Patch-Schema), diffPreview, estimate (Token/Kosten bei AI), status |
| `RepairApplication` | proposalId, appliedToVersionId, resultingVersionId, appliedBy, undoneAt?, recheckIssueStatus |

### Export & Betrieb

| Entität | Kernfelder |
|---|---|
| `ExportJob` | bookVersionId, profile ('docx'\|'epub'\|'pdf-interior'\|'pdf-cover'\|'html'\|'kdp-package'), params (jsonb), status, queuedAt, startedAt, finishedAt, errorClass? |
| `ExportArtifact` | jobId, storageKey, filename, mime, bytes, checksum |
| `ValidationReport` | artifactId, validator ('epubcheck'\|'docx-structure'\|'pdf-format'…), passed, findings (jsonb), validatorVersion |
| `AuditLog` (append-only) | actorUserId?, orgId?, action, entityType, entityId, before?/after?-Hashes, correlationId, ip? (redacted policy) |
| `FeatureFlag` | key, scope, rules (jsonb), status |

## 3. Zentrale TypeScript-Contracts (libs/contracts, Auszug)

```ts
/** Kanonisches Dokumentmodell (libs/document-model). */
type NodeType =
  | 'book' | 'frontMatter' | 'backMatter' | 'chapter' | 'section'
  | 'heading' | 'paragraph' | 'quote'
  | 'unorderedList' | 'orderedList' | 'listItem'
  | 'checklist' | 'checkItem'
  | 'writingLines' | 'scale'
  | 'exerciseBox' | 'tipBox' | 'exampleBox'
  | 'image' | 'caption' | 'pageBreak'
  | 'table' | 'tableRow' | 'tableCell'
  | 'tableOfContents' | 'legalNotice' | 'authorProfile';

interface DocumentNode {
  id: string;                       // ULID, stabil über Versionen (Patch-Adressierung)
  type: NodeType;
  attrs?: Record<string, unknown>;  // z. B. heading.level, writingLines.count, scale.question
  marks?: InlineMark[];             // strong, emphasis – nur auf Textknoten
  text?: string;                    // nur Blattknoten
  children?: DocumentNode[];
}

interface BookDocument {
  schemaVersion: number;            // AST-Migrationen pro Version
  language: string;                 // Buchsprache, unabhängig von UI-Locale
  root: DocumentNode;               // type: 'book'
}


/** AST-Patch – einziges Format, in dem Reparaturen angewendet werden. */
type AstPatchOp =
  | { op: 'replaceNode'; nodeId: string; node: DocumentNode }
  | { op: 'insertAfter' | 'insertBefore'; nodeId: string; node: DocumentNode }
  | { op: 'insertChild'; parentId: string; index: number; node: DocumentNode }
  | { op: 'removeNode'; nodeId: string }
  | { op: 'setAttrs'; nodeId: string; attrs: Record<string, unknown> };

interface AstPatch {
  baseAstHash: string;              // Konfliktschutz: Patch gilt nur für diese Basis
  ops: AstPatchOp[];
}


/** Provider-Vertrag (libs/ai-core) – Masterprompt §7. */
interface LlmProviderAdapter {
  providerId: string;
  listAvailableModels(context: ProviderContext): Promise<ModelDescriptor[]>;
  estimateInputTokens(request: LlmRequest): Promise<TokenEstimate>;
  generateStructured<T>(request: StructuredLlmRequest<T>): Promise<LlmResult<T>>;
  generateText(request: TextLlmRequest): Promise<LlmResult<string>>;
  streamText(request: TextLlmRequest): AsyncIterable<LlmStreamEvent>;
  healthCheck(): Promise<ProviderHealth>;
}


/** SSE-Events der Generierung (libs/generation). */
type GenerationEvent =
  | { type: 'queued' | 'estimating' | 'running' | 'validating'
      | 'repairing' | 'saving' | 'completed' | 'cancelled'; runId: string; stepId?: string }
  | { type: 'awaiting-confirmation'; runId: string; estimate: RunEstimate }
  | { type: 'partial-content'; runId: string; stepId: string; nodes: DocumentNode[] }
  | { type: 'failed'; runId: string; stepId?: string; errorClass: string; messageKey: string };
```

## 4. Verbindliche Modell-Invarianten

1. Jede `GenerationStep`-Zeile referenziert BookVersion, SkillVersion, PromptTemplate-Version, Provider, Modell und Parameter – revisionssichere Herkunft jedes Textes (behebt P16).
2. Kapitel und Bücher sind über `BookVersion` versionierbar; destruktive Aktionen (Outline-Regeneration, Repair, Import) erzeugen zuvor einen Snapshot (behebt N02/N03).
3. Reparaturen erzeugen `RepairApplication` mit neuer Version oder nachvollziehbarem Patch; Undo = Rücksprung auf `appliedToVersionId`.
4. Exporte hängen an einer unveränderlichen `BookVersion` und sind reproduzierbar.
5. `CostRecord` referenziert die Preisversion (`catalogEntryId`) – Preisänderungen verfälschen nie historische Kosten.
6. `ProviderCredential` bietet keinerlei Klartext-Leseoperation; Nutzung nur innerhalb des Gateways.
7. Demo-Projekte (`Project.demoMode = true`) dürfen ausschließlich `providerId = 'mock'`-Steps besitzen (DB-Check + Runtime-Guard + E2E-Netzwerktest).
