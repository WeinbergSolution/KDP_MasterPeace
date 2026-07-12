# Phase-B-Implementierungsbericht (Rolle 2)

Datum: 2026-07-12 · Pflichtbericht gemäß AGENTS.md §15.

## 1. Source Branch

`staging`

## 2. Working Branch

`feature/angular-production-foundation`

## 3. Target Branch

`staging` (Merge nur per PR, nach Freigabe – nicht Teil dieses Durchlaufs)

## 4. Branch-Visualisierung

```
staging (76efd51)
└── feature/angular-production-foundation
     … bc2c8df  docs(reviews): Foundation-Handoff        [Ausgangspunkt Phase B]
      └── 679ed29 feat(workspace): WP-B1 Nx-Workspace, 5 Apps, alle Libs
       └── a2c9d32 feat(testing): WP-B0 Golden-Master-Fixtures
        └── 73aa0e1 feat(checks): WP-B2 Coding-Checks + CI
         └── 93644e0 feat(domain,contracts,observability): WP-B4
          └── e0ec99a feat(ui,studio-web): WP-B3 Design-Tokens + Shell
           └── 4264c6a feat(projects,api,worker): WP-B5 Persistenz + Prisma v1
            └── ef856e4 fix(build): Angular-typecheck (G1 grün)   [HEAD]

main: existiert nicht (unangetastet).
```

## 5. Commit-Hashes

| WP | Hash | Inhalt |
|---|---|---|
| B1 | `679ed29` | Nx-Workspace, 5 Apps, 23 Libs, Boundaries, TS strict |
| B0 | `a2c9d32` | Golden-Master-Legacy-Fixtures (v1/v2) |
| B2 | `73aa0e1` | check:* + CI |
| B4 | `93644e0` | domain (KdpSpecs), contracts (Zod), env, logger |
| B3 | `e0ec99a` | Design-Tokens + responsive App-Shell |
| B5 | `4264c6a` | projects-Persistenz, api/worker-Skeleton, Prisma v1 |
| G1 | `ef856e4` | Angular-typecheck-Fix |

## 6. Pushstatus

**Nicht gepusht.** Das lokale Repository besitzt kein `remote` und die Umgebung
keine Schreib-Credentials (Fortführung DEV-002). Alle Hashes sind lokal real.
Nächster Schritt: Pascal legt Remote an bzw. stellt Deploy-Key/Token bereit;
danach `git push -u origin feature/angular-production-foundation`.

## 7. Geänderte Dateien

381 Dateien geändert (+41 992 / −1), Löwenanteil `package-lock.json`. Neu u. a.:
`nx.json`, `tsconfig.base.json`, `eslint.config.mjs` (Boundaries), `apps/{public-web,
studio-web,admin-web,api,worker}/**`, `libs/**` (23 Libs), `tools/checks/**`,
`.github/workflows/ci.yml`, `apps/api/prisma/schema.prisma`,
`libs/testing/fixtures/legacy-golden-master*.json`.

## 8. LOC je geänderter Datei

Alle handgepflegten Quell-/Template-/Style-/Testdateien ≤ 400 LOC – erzwungen
und verifiziert durch `check:file-size` (Exit 0, 0 Verstöße). Größte handgeschriebene
Datei: `libs/domain/src/lib/kdp-specs.ts` (~116 Zeilen). Generierte Dateien
(nx-welcome, Lockfile) sind laut §5.3 ausgenommen.

## 9. Größte Funktion je Datei

Alle Funktionen ≤ 14 ausführbare Zeilen – erzwungen und verifiziert durch
`check:function-size` (Exit 0, 0 Verstöße; TypeScript-AST-basiert).

## 10. JSDoc-Status

Jede benannte Funktion/Methode dokumentiert – `check:jsdoc` Exit 0 (0 Verstöße).
Ausnahmen laut §7: Bootstrap-Entrypoints (`main.ts`), generierte Dateien.

## 11. Ausgeführte Checks und Exit-Codes

| Check | Exit | Ergebnis |
|---|---|---|
| `format:check` (prettier) | 0 | alle Dateien konform |
| `nx sync:check` | 0 | TS-Referenzen synchron |
| `check:file-size` | 0 | 0 Verstöße |
| `check:function-size` | 0 | 0 Verstöße |
| `check:jsdoc` | 0 | 0 Verstöße |
| `check:console` | 0 | 0 Verstöße |
| `lint` (enforce-module-boundaries, 31 Projekte) | 0 | Boundaries grün |
| `typecheck` (31 Projekte) | 0 | strict, fehlerfrei |
| `test` (31 Projekte) | 0 | alle Unit-/Component-Tests grün |
| `test-integration` (projects) | 0 | Save/Load + Versionskonflikt grün |
| `build` (29 Projekte) | 0 | Angular + Nest + Libs grün |
| `check:responsive` (7 Viewports) | 0 | 0 horizontale Overflows |
| `check:frontend-secrets` | 0 | keine Keys im Bundle |
| `prisma validate` | 0 | Schema v1 gültig |

Boundary-Erzwingung positiv verifiziert: ein absichtlicher Import einer
`platform:server`-Lib in `studio-web` (`platform:browser`) lässt `lint` rot werden.
Ebenso faerben absichtliche Verstöße (15-Zeilen-Funktion, `console.log`, fehlende
JSDoc) die jeweiligen Checks rot; Entfernen macht sie grün.

## 12. Getestete Viewports

320×568, 360×800, 390×844, 768×1024, 1024×768, 1440×900, 1920×1080 –
`check:responsive` (Playwright/Chromium) gegen den ausgelieferten `studio-web`-Build:
kein horizontaler Seiten-Scrollbalken.

## 13. Konsolenstatus

Kein `console.*` in Anwendungscode (`check:console` Exit 0). Technische Logs laufen
über `libs/observability` (stdout, Redaction, Correlation-ID).

## 14. Bekannte Abweichungen (AGENTS.md §13.2)

| ID | Abweichung | Begründung | Folgeaufgabe |
|---|---|---|---|
| DEV-002 | ~~Kein Push.~~ **ERLEDIGT 2026-07-12:** `feature/angular-production-foundation` nach `origin` gepusht (neuer Remote-Branch, kein Force). | Push-Credentials waren beim Follow-up-Durchlauf verfügbar. | — |
| DEV-004 | npm statt pnpm (ADR-0001). | corepack-pnpm-Shim im Sandbox nicht installierbar (EPERM auf `Program Files/nodejs`). Nx unterstützt PM-Wechsel. | Migration auf pnpm, sobald Shim verfügbar; ADR-0001 aktualisieren oder Ausnahme dokumentieren. |
| DEV-005 | `NX_IGNORE_UNSUPPORTED_TS_SETUP=true` für Angular. | Angular unterstützt das TS-Solution-/Project-References-Setup des `ts`-Presets nicht; Web-Apps bauen über den Angular-Builder, konsumieren Libs als gebaute Workspace-Pakete. | Beibehalten; bei Angular-Update auf Nativ-Support prüfen. |
| DEV-006 | Angular-`typecheck` via `tsc --noEmit` statt `tsc -b`. | Node-Lib-Basis-tsconfig (composite/emitDeclarationOnly) ist mit dem Angular-Build-Modus unvereinbar. Volle Template-Prüfung erfolgt im Angular-Build (auch in CI). | Beibehalten. |
| DEV-007 | ~~`test:integration` läuft nur gegen In-Memory-Adapter.~~ **GESCHLOSSEN 2026-07-12** (Follow-up-Durchlauf). | Prisma-Adapter (`libs/projects-prisma`), reproduzierbare Migration (`0001_init`), DE/EN/ES-Seeds und ein echter PostgreSQL-Integrationstest (8 Zusicherungen) laufen grün gegen echtes PostgreSQL 18.4. Details: `wp-b5-followup-report.md`. | — |

## 15. Bestätigung: `main` wurde nicht verändert

`git branch` zeigt ausschließlich `feature/angular-production-foundation` und
`staging`. **Ein `main`-Branch existiert nicht und wurde nicht angelegt.**

## 16. Nächster sicherer Arbeitsschritt

Push-Zugang herstellen (DEV-002), dann Phase C ab WP-C1
(Book AST + Legacy Parser + Preview) – Details in `handoff-phase-c.md`.
