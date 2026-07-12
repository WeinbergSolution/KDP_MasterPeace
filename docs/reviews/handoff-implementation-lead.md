# Handoff an Rolle 2: Senior Angular & Platform Implementation Lead

Von: Rolle 1 (Principal Software Architect & Foundation Engineer) · Datum: 2026-07-12

## 1. Aktueller Stand

- Remote `WeinbergSolution/KDP_MasterPeace` war leer; lokal existiert `staging` (Bootstrap) und `feature/angular-production-foundation` mit vollständiger Architektur-Dokumentation. **Kein Push erfolgt** (keine Credentials, DEV-002) – erster Schritt ist die Sicherung des Branches zum Remote.
- Legacy-Code (1614 Zeilen React) vollständig auditiert: 16 Auftragsprobleme verifiziert (P01–P16), 15 neue Befunde (N01–N15), Feature-Inventar F01–F21 → `docs/architecture/as-is-audit.md`.
- `AGENTS.md` liegt unverändert im Root und ist verbindlich; Legacy unverändert unter `legacy/react-cloud/`.
- **Es existiert noch kein Nx-Workspace und keine Zeile Produktionscode.** Alles Implementierte in diesem Repo ist Dokumentation.

## 2. Architekturentscheidungen (bindend, Änderung nur per superseding ADR)

Nx+pnpm (0001) · NestJS für api+worker (0002) · Prisma/PostgreSQL, Ledger append-only (0003) · eigenes Auth-Modul, Passport, Argon2id, Dev-Mock nur non-prod (0004) · Billing-Port + Mock, Stripe später (0005) · Transloco + prerenderte Locale-Routen (0006) · Signals + NgRx SignalStore, RxJS nur Streams (0007) · BullMQ/Redis (0008) · S3-kompatibler Storage (0009) · eigenes versioniertes Book AST (0010) · DOCX via `docx`-Lib (0011) · eigener EPUB-3-Builder + epubcheck (0012) · Print-PDF via Playwright-Chromium + Paged.js, selbst gehostete Fonts (0013) · Envelope Encryption für Credentials (0014) · unveränderliche published SkillVersions (0015) · SSE (0016) · versionierter ModelCatalog + append-only-Kostenledger (0017).

Ordnerstruktur und Abhängigkeitsregeln: `docs/architecture/target-architecture.md` §2 (verbindlich, per Nx-Boundaries zu erzwingen). Datenmodell: `docs/architecture/data-model.md`.

## 3. Offene Phase

Phase B (Workspace & Architektur-Foundation), danach C (Demo-Vertical-Slice). Phasendefinition, Gates G1–G4: `docs/roadmap/production-roadmap.md`.

## 4. Konkrete nächste Arbeitspakete (Reihenfolge)

1. **WP-Setup:** Branch zum Remote pushen; Pascal um Branch Protection für `main`/`staging` und Anlage von `main` bitten (DEV-001/002 im Foundation-Bericht).
2. **WP-B0:** Golden-Master-Legacy-Fixtures (Definition: as-is-audit.md §6, legacy-backup-schema.md).
3. **WP-B1:** Nx-Workspace mit 5 Apps + allen Libs (leer, getaggt), TS strict.
4. **WP-B2:** die sechs `check:*`-Skripte + CI mit Blockierregeln aus AGENTS.md §13.1.
5. **WP-B3:** Design Tokens + responsive App-Shell (320 px, 1440 px-Cap).
6. **WP-B4:** contracts/domain (KdpSpecs mit Legacy-Testvektoren!), Env-Schema, Logger.
7. **WP-B5:** api/worker-Skeleton, Prisma v1, Projekt-CRUD mit Versionskonflikt-Test.
8. Danach Phase C gemäß Roadmap (C1 AST/Parser/Preview → C2 MockProvider/SSE → C3 Skills → C4 Autosave/Versionen → C5 Quality/Repair → C6 echte Exporte).

## 5. Akzeptanzkriterien

Je WP in `production-roadmap.md` definiert. Übergreifend gilt Masterprompt §18
(„Muss jetzt funktionieren") als Abschlusskriterium der Foundation und AGENTS.md §14
als Definition of Done jeder einzelnen Änderung. Nicht verhandelbar u. a.:
Demo-Modus ohne jeden Provider-Netzwerkaufruf (E2E-Netzwerk-Guard), echte
DOCX/EPUB/PDF-Dateien mit bestandener Validierung, sichtbare Save-Fehler,
Einzel-Issue-Repair mit Diff/Undo ohne Kapitel-Regeneration, kein Key im Bundle.

## 6. Betroffene Dateien/Bereiche

Neu entsteht alles unter `apps/`, `libs/`, `tools/checks/`, `.github/` (CI).
Nicht anfassen: `legacy/react-cloud/*` (read-only), `AGENTS.md` (nur Pascal).
Detaildokumente je Subsystem (DEV-003) beim jeweiligen WP unter `docs/architecture/` ergänzen.

## 7. Tests

Testpyramide gemäß Masterprompt §16: Unit (Parser, KdpSpecs, Kostenformel,
QualityRules, Patches), Contract (Provider-Adapter, API, Structured Outputs),
Integration (Persistenz, Konflikt, Demo-Generierung, Repair, drei Exporte + Validatoren,
Legacy-Import, Skill-Versionierung), E2E-Smoke (12-Schritte-Demo-Flow),
Negativtests (Provider down, Rate Limit, ungültige strukturierte Antwort,
Offline-Autosave, Zwei-Tab-Konflikt, Demo-Egress-Versuch, Prod-Mock-Auth,
Fremdprojekt-Zugriff, SkillVersion-Wechsel bei laufendem Run).

## 8. Non-Goals dieser Phase

Reale Zahlungsabwicklung · produktive Google-OAuth-Einrichtung · OpenAI-/Gemini-
Adapter über Skeletons+Contracts hinaus · vollständige Admin-CRUD-Flächen ·
weitere Nischen-Skills jenseits SKB-001..003 · Realtime-Kollaboration ·
automatische KDP-Veröffentlichung · direkte KPF-Erzeugung · Bildgenerierung ·
Team-Abrechnung. Nichts davon als fertig darstellen (Masterprompt §19).

## 9. Branch-Regeln (Kurzfassung, vollständige Fassung: AGENTS.md §3)

Arbeiten ausschließlich auf `feature/angular-production-foundation` (bzw. neuen
`feature|fix|chore/*` von aktuellem `staging`). Niemals `main` anfassen; Zustimmung
zur Implementierung ist keine Zustimmung zum Main-Merge. Nach jedem geprüften
Arbeitspaket: Checks → logische Commits → Push → Bericht (Branch, Hash, Pushstatus,
Checks, LOC/größte Funktion je Datei, Viewports, Konsolenstatus, „main unverändert").
Kein Force Push, keine Branch-Löschung, keine Produktionsmigration, keine Secrets-Änderung.
