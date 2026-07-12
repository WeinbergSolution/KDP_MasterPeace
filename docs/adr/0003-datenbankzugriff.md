# ADR-0003: Datenbankzugriff – Prisma auf PostgreSQL

Status: accepted · 2026-07-12

## Kontext
Relationale Persistenz mit versionierten Migrationen, reproduzierbaren Seeds,
JSONB (AST, Skill-Definitionen) und append-only-Ledgern (data-model.md).

## Optionen
1. **Prisma** – deklaratives Schema, ausgereifte Migrations, Typensicherheit, Seeds.
2. Drizzle – SQL-nah, leichtgewichtig, aber jüngeres Migrationstooling.
3. TypeORM – Decorator-Modelle, historisch fehleranfällige Migrationen.
4. Kysely + eigene Migrationen – maximale Kontrolle, maximaler Eigenbau.

## Entscheidung
Prisma. Append-only-Charakter der Ledger wird zusätzlich per DB-Grants/Trigger erzwungen
(nicht nur per ORM-Disziplin).

## Konsequenzen
`schema.prisma` ist generiert-ähnliche Datei (LOC-Ausnahme dokumentiert);
Repositories kapseln Prisma hinter Ports in `libs/*`, damit Domain frei von ORM bleibt.

## Risiken
Prisma-JSONB-Filterung ist begrenzt; komplexe AST-Queries laufen über astHash/
materialisierte Spalten (Chapter-Tabelle) statt JSON-Pfadabfragen.

## Migrationswirkung
Legacy-Backups werden per Importer eingelesen, keine DB-Altbestände.

## Revisit Trigger
Messbare Query-Engpässe auf JSONB oder Bedarf an DB-seitigen AST-Operationen.
