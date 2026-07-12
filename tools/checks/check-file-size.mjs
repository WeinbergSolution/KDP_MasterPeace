import { readFileSync } from 'node:fs';
import { collectSourceFiles } from './lib/source-files.mjs';

// AGENTS.md §5.3: every hand-maintained source, template, style and test file
// stays at or below 400 physical lines of code.
const MAX_LINES = 400;
const EXTENSIONS = ['.ts', '.tsx', '.html', '.scss'];

/**
 * Counts the physical lines of a file, ignoring a single trailing newline.
 *
 * @param file Workspace-relative path to the file.
 * @returns The number of physical lines in the file.
 */
function lineCount(file) {
  const text = readFileSync(file, 'utf8').replace(/\n$/, '');
  return text === '' ? 0 : text.split('\n').length;
}

/**
 * Runs the file-size check across all product source files and reports any
 * file that exceeds the 400-line budget.
 *
 * @returns Process exit code: 0 when compliant, 1 on any violation.
 */
function run() {
  const violations = collectSourceFiles(EXTENSIONS)
    .map((file) => ({ file, lines: lineCount(file) }))
    .filter((entry) => entry.lines > MAX_LINES);
  for (const { file, lines } of violations) {
    process.stdout.write(`${file}: ${lines} LOC (max ${MAX_LINES})\n`);
  }
  process.stdout.write(`check:file-size — ${violations.length} violation(s)\n`);
  return violations.length === 0 ? 0 : 1;
}

process.exit(run());
