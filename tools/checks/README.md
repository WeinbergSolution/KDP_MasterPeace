# tools/checks

Custom coding-rule gates that back the mandatory checks in `AGENTS.md §13.1`.
They complement (do not replace) `lint`, `typecheck`, `test` and `build`.

| Script                    | Rule                                          | Source          |
| ------------------------- | --------------------------------------------- | --------------- |
| `check-file-size.mjs`     | ≤ 400 LOC per hand-written file               | AGENTS.md §5.3  |
| `check-function-size.mjs` | ≤ 14 executable lines per function            | AGENTS.md §5.2  |
| `check-jsdoc.mjs`         | JSDoc on every named function/method          | AGENTS.md §7    |
| `check-console.mjs`       | no `console.*` in application code            | AGENTS.md §9.1  |
| `check-responsive.mjs`    | no horizontal overflow at mandatory viewports | AGENTS.md §11.6 |

`check:architecture` is the Nx `enforce-module-boundaries` lint rule
(`eslint.config.mjs`), run via `nx run-many -t lint`.

## Scope

Only hand-written product source under `apps/*/src` and `libs/*/src` is checked.
Exempt: `*.spec.ts`, `*.config.*`, `*.d.ts`, generated files (`nx-welcome.ts`),
bootstrap entrypoints (`main.ts`), and everything under `node_modules`/`dist`.
Analysis of TypeScript functions uses the TypeScript compiler AST
(`lib/ts-functions.mjs`) so comments and strings never cause false positives.

## Responsive check

`check-responsive.mjs` drives Playwright/Chromium against `RESPONSIVE_URL`
(default `http://localhost:4200`). When Playwright/Chromium is not installed it
prints `SKIPPED` and exits 0; CI installs the browser and serves a built app so
the check is enforced there.
