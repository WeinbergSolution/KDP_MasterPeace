# ADR-0002: Backend-Framework – NestJS

Status: accepted · 2026-07-12

## Kontext
TypeScript-Backend mit modularer Struktur, OpenAPI, SSE, Guards, DI und
Worker-Wiederverwendung (Masterprompt §4 empfiehlt NestJS oder gleichwertig).

## Optionen
1. **NestJS** – Module/DI/Guards/Interceptors, @nestjs/swagger, BullMQ-Integration,
   identisches Programmiermodell für api und worker.
2. Fastify pur + Zod – schlanker, aber Struktur/DI/OpenAPI selbst zu bauen.
3. Express + eigene Struktur – am meisten Eigenbau, kein Vorteil.

## Entscheidung
NestJS (auf Fastify-Adapter) für `apps/api` und als Standalone-Context für `apps/worker`.

## Konsequenzen
Contracts aus `libs/contracts` (Zod) werden via zod-to-openapi in Swagger gespiegelt;
Nest-Module folgen dem Fachschnitt (auth, projects, skills, generation, quality, export, billing, admin).

## Risiken
Decorator-Magie kann 14-Zeilen-Regel kaschieren; Mitigation: `check:function-size`
zählt Methodenkörper unabhängig von Decorators.

## Migrationswirkung
Keine (kein Alt-Backend vorhanden).

## Revisit Trigger
SSE-/Streaming-Anforderungen, die der Nest-Lifecycle nachweislich behindert.
