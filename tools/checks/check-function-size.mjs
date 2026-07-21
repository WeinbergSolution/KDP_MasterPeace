import { readFileSync } from 'node:fs';
import { collectSourceFiles } from './lib/source-files.mjs';
import { analyzeFunctions } from './lib/ts-functions.mjs';

// AGENTS.md §5.2: at most 14 executable lines per function or method.
const MAX_EXEC_LINES = 14;

/**
 * Analyses a single TypeScript file for functions that exceed the executable
 * line budget.
 *
 * @param file Workspace-relative path to the TypeScript source file.
 * @returns Violation records for over-long functions in the file.
 */
function violationsIn(file) {
  const text = readFileSync(file, 'utf8');
  return analyzeFunctions(file, text)
    .filter((fn) => fn.execLines > MAX_EXEC_LINES)
    .map((fn) => ({ file, ...fn }));
}

/**
 * Runs the function-size check across all product TypeScript files.
 *
 * @returns Process exit code: 0 when compliant, 1 on any violation.
 */
function run() {
  const violations = collectSourceFiles(['.ts', '.tsx']).flatMap(violationsIn);
  for (const v of violations) {
    process.stdout.write(
      `${v.file}:${v.line} ${v.name}() has ${v.execLines} exec lines (max ${MAX_EXEC_LINES})\n`,
    );
  }
  process.stdout.write(
    `check:function-size — ${violations.length} violation(s)\n`,
  );
  return violations.length === 0 ? 0 : 1;
}

process.exit(run());
