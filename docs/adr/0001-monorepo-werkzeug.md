# ADR-0001: Monorepo-Werkzeug – Nx

Status: accepted · 2026-07-12

## Kontext
Fünf Apps (public-web, studio-web, admin-web, api, worker) und ~20 Libraries mit
strengen Abhängigkeitsregeln (AGENTS.md §4, target-architecture.md §2) brauchen
gemeinsames Tooling, Affected-Builds und erzwungene Modulgrenzen.

## Optionen
1. **Nx** – erstklassige Angular- und NestJS-Generatoren, `enforce-module-boundaries`,
   Task-Caching, affected-Graph.
2. npm/pnpm Workspaces pur – minimal, aber Boundary-Enforcement, Caching und
   Generatoren müssten selbst gebaut werden.
3. Turborepo – gutes Caching, aber keine Angular-/Nest-Integration und keine
   Projektgraph-Lint-Regeln auf Importebene.

## Entscheidung
Nx-Monorepo mit pnpm als Package Manager.

## Konsequenzen
`check:architecture` basiert auf Nx-Boundary-Tags plus eigenen Skripten; CI nutzt
`nx affected`; Generatoren erzwingen kebab-case-Dateinamen und Komponenten-Vierergruppen.

## Risiken
Nx-Versionssprünge koppeln Angular-Upgrades; Mitigation: Nx-Migrationstool, Renovate.

## Migrationswirkung
Keine (Greenfield-Workspace; Legacy bleibt unter `legacy/`).

## Revisit Trigger
Nx blockiert ein Angular-Major-Update > 3 Monate, oder Buildzeiten trotz Cache > 15 min.
