import { readFileSync } from 'node:fs';
import { collectSourceFiles } from './lib/source-files.mjs';
import { analyzeFunctions } from './lib/ts-functions.mjs';

// Framework bootstrap entrypoints carry no domain logic and are exempt (§7).
const EXEMPT_FILES = new Set(['main.ts']);

/**
 * Finds named functions and methods in a file that lack the required JSDoc
 * documentation (AGENTS.md §7).
 *
 * @param file Workspace-relative path to the TypeScript source file.
 * @returns Violation records for undocumented functions in the file.
 */
function violationsIn(file) {
  const text = readFileSync(file, 'utf8');
  return analyzeFunctions(file, text)
    .filter((fn) => fn.requiresJsDoc && !fn.hasJsDoc)
    .map((fn) => ({ file, ...fn }));
}

/**
 * Runs the JSDoc check across all product TypeScript files.
 *
 * @returns Process exit code: 0 when compliant, 1 on any violation.
 */
function run() {
  const files = collectSourceFiles(['.ts', '.tsx']).filter(
    (f) => !EXEMPT_FILES.has(f.split(/[\\/]/).pop()),
  );
  const violations = files.flatMap(violationsIn);
  for (const v of violations) {
    process.stdout.write(`${v.file}:${v.line} ${v.name}() is missing JSDoc\n`);
  }
  process.stdout.write(`check:jsdoc — ${violations.length} violation(s)\n`);
  return violations.length === 0 ? 0 : 1;
}

process.exit(run());
