# ADR-0008: Jobqueue – BullMQ auf Redis

Status: accepted · 2026-07-12

## Kontext
Lange Generierungs- und Exportjobs, Retry/Timeout, Resume, Ratensteuerung,
Fortschritts-Events (Masterprompt §4, §12).

## Optionen
1. **BullMQ** – ausgereift, NestJS-Integration, Delays/Ratelimits/Backoff, Flows.
2. pg-boss – nur Postgres, weniger Ökosystem, ok als Minimalvariante.
3. Temporal – mächtige Workflows, aber schwerer Betriebs-Overhead für Foundation.

## Entscheidung
BullMQ; Redis dient zugleich für Locks und kurzlebigen Status. Job-Payloads sind
schlank (IDs), Zustand liegt in PostgreSQL (`GenerationRun`/`ExportJob`).

## Konsequenzen
Idempotenz über eigene idempotencyKeys je Step; Events werden aus Worker über
Redis-PubSub → API → SSE gebrückt.

## Risiken
Redis-Ausfall stoppt Jobs; Mitigation: Persistenz-Modus, Health-Checks, Requeue aus DB-Status.

## Migrationswirkung
Ersetzt die Legacy-Autopilot-Schleife im UI-Thread.

## Revisit Trigger
Workflow-Komplexität (Kompensation, langlebige Sagas) → Temporal neu bewerten.
