# WP-B5-Follow-up-Bericht (DEV-007 geschlossen)

Datum: 2026-07-12 · Rolle: Senior Angular & Platform Implementation Lead
Branch: `feature/angular-production-foundation` · `main` unangetastet.

## 1. Ziel

Technische Schuld **DEV-007** schließen: Projektpersistenz zusätzlich zum
In-Memory-Adapter mit einem echten Prisma-/PostgreSQL-Adapter implementieren und
gegen echtes PostgreSQL testen.

## 2. Implementiert

| Bereich | Datei(en) | Inhalt |
|---|---|---|
| Domain-Ports | `libs/projects/src/lib/project-store.ts`, `persistence-error.ts` | `ProjectStore` (createProject/getProject), `PersistenceError`, `TenantIsolationError` – ORM-frei (ADR-0003). |
| Prisma-Adapter | `libs/projects-prisma/src/lib/prisma-project.repository.ts` | `PrismaProjectRepository` implementiert `ProjectVersionRepository` + `ProjectStore`, organisationsgescoped, Transaktionen, Fehlerübersetzung (P2002 → `VersionConflictError`), keine Prisma-Details nach außen. |
| Label-Mapping | `libs/projects-prisma/src/lib/label-mapping.ts` | Domain-Label `pre-repair` ↔ Prisma-Enum `pre_repair`. |
| DI-Auswahl | `apps/api/src/app/persistence/persistence.module.ts`, `prisma.service.ts` | `PersistenceModule.forRoot()` wählt per Konfiguration (`DATABASE_URL`) In-Memory- oder Prisma-Adapter – eine Stelle, keine verstreuten Bedingungen. `PrismaService` verwaltet Connect/Disconnect. |
| Migration | `apps/api/prisma/migrations/0001_init/migration.sql` (+ `migration_lock.toml`) | Reproduzierbar, offline via `prisma migrate diff` erzeugt; auf frischer DB angewendet (siehe §4). |
| Seeds | `apps/api/prisma/seed.ts` | Deterministische DE/EN/ES-Demodaten (Org + 3 Projekte + Bücher + Versionen + BookDocuments), idempotent via Upsert. |
| Integrationstest | `libs/projects-prisma/src/lib/prisma-project.repository.integration.spec.ts` | 8 Zusicherungen gegen echtes PostgreSQL, kein stiller In-Memory-Fallback. |
| Tooling | `package.json` (Scripts, `prisma`-Seed-Config, `postinstall: prisma generate`), `vitest.integration.config.mts` | `test:integration:postgres`, `db:*`-Skripte. |

## 3. Fehler- und Konfliktbehandlung

- **Optimistische Nebenläufigkeit:** ETag-Prüfung im `ProjectService` + DB-Unique
  `(bookId, versionNumber)` als letzte Absicherung; eine P2002-Kollision wird zu
  `VersionConflictError` übersetzt (kein stilles Überschreiben).
- **Mandantentrennung:** Adapter ist org-gescoped; fremde Projekte sind unsichtbar
  (`loadHead`/`getProject` → null), Schreibversuche werfen `TenantIsolationError`.
- **Transaktionen:** `createProject` (Project+Book) und `append` (BookVersion+
  BookDocument) laufen je in `prisma.$transaction`; bei Fehler vollständiger Rollback.
- **Übersetzung:** DB-Fehler werden zu `PersistenceError`/`VersionConflictError`/
  `TenantIsolationError`; keine Prisma-Typen verlassen den Adapter.

## 4. Datenbanknachweis (lokal ausgeführt)

- **PostgreSQL-Version:** 18.4 (x86_64-windows), echtes Server-Binary.
- **Bereitstellung:** Die lokal installierte PostgreSQL-18 war unvollständig
  (`share/`-Serverdateien fehlten → `initdb` unmöglich); Docker-Daemon lief nicht.
  Deshalb wurde für Migrationen/Seeds/Tests eine **wegwerfbare, nicht-produktive**
  Instanz über `embedded-postgres` (echtes Postgres-Binary, Trust-Auth, Port 5433/
  5434/5435, `persistent: false`) gestartet. Keine produktiven Zugangsdaten, keine
  produktive DB.
- **Migration:** `prisma migrate deploy` auf frischer DB → `1 migration found …
  Database schema is up to date!`
- **Seeds:** `prisma db seed` (zweifach ausgeführt, idempotent) →
  `{ orgs: 1, projects: 3, versions: 3, docs: 3, locales: ["de","en","es"] }`.
- **Integrationstest:** 6 Testfälle / 8 Zusicherungen grün (11 s):
  1. Projekt anlegen · 2. erneut laden · 3. Version mit korrektem ETag ·
  4./5. alten ETag → `VersionConflictError` · 6. Reload über neue Repository-Instanz ·
  7. Organisationsgrenze (`TenantIsolationError`) · 8. Transaktions-Rollback
  (Duplicate-Key → `PersistenceError`, Projekt **nicht** persistiert).
- In CI läuft derselbe Test gegen den PostgreSQL-16-Service (`.github/workflows/ci.yml`,
  Job `integration`, `DATABASE_URL` gesetzt).

Keine Zugangsdaten werden ausgegeben.

## 5. Checks (Exit-Codes)

| Befehl | Exit | Ergebnis |
|---|---|---|
| `format:check` | 0 | konform |
| `sync:check` | 0 | TS-Referenzen synchron |
| `check:file-size` / `-function-size` / `-jsdoc` / `-console` | 0 | 0 Verstöße |
| `lint` (32 Projekte, Boundaries) | 0 | grün (1 Warnung: unused eslint-disable in generierten e2e-Dateien) |
| `typecheck` (32 Projekte) | 0 | grün |
| `test` (30 Projekte) | 0 | grün |
| `test-integration` (projects + projects-prisma) | 0 | 4 + 6 Tests grün (echtes Postgres) |
| `build` (30 Projekte) | 0 | grün |
| `check:frontend-secrets` | 0 | keine Keys |
| `prisma validate` | 0 | Schema gültig |
| `prisma migrate status` (frische DB) | 0 | up to date |

## 6. Abweichungen / Risiken

- **P2 (embedded-postgres):** Der lokale DB-Test nutzt `embedded-postgres`
  (Test-/Dev-Abhängigkeit). CI nutzt einen echten Postgres-Service. Für dauerhaften
  Betrieb ist eine reguläre PostgreSQL-Instanz vorgesehen (unverändert).
- **P2 (Org-Scoping):** Der API-Prisma-Provider nutzt aktuell eine Demo-Org
  (`org-demo-personal`); request-scopedes Org-Scoping folgt mit dem Auth-Modul (Phase E/WP-C).
- **P3 (Book-Model v1):** Ein Projekt hat genau ein Buch (deterministische Book-ID);
  Mehrbuch-Projekte sind ein späteres Schema-Update.

## 7. Bestätigung

`main` wurde weder angelegt noch verändert. Alle oben genannten Läufe fanden real statt.
