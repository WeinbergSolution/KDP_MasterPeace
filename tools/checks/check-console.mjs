import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { collectSourceFiles } from './lib/source-files.mjs';

// AGENTS.md §9.1: application code must not use console.*; technical logging
// goes through the central logger (libs/observability). Bootstrap entrypoints
// are exempt because framework-generated top-level error handlers use console.
const CONSOLE_METHODS = new Set([
  'log',
  'warn',
  'error',
  'info',
  'debug',
  'trace',
]);
const EXEMPT_FILES = new Set(['main.ts']);

/**
 * Collects the source lines of every `console.<method>(...)` call in a file
 * using the TypeScript AST (so comments and strings never match).
 *
 * @param file Workspace-relative path to the TypeScript source file.
 * @returns One violation record per console call site.
 */
function violationsIn(file) {
  const text = readFileSync(file, 'utf8');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
  const hits = [];
  const visit = (node) => {
    if (isConsoleAccess(node))
      hits.push({ file, line: lineOf(sf, node), name: node.name.getText() });
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return hits;
}

/**
 * Tests whether a node is a `console.<method>` property access.
 *
 * @param node The AST node to test.
 * @returns True when the node accesses a known console method.
 */
function isConsoleAccess(node) {
  if (!ts.isPropertyAccessExpression(node)) return false;
  const onConsole =
    ts.isIdentifier(node.expression) && node.expression.text === 'console';
  return onConsole && CONSOLE_METHODS.has(node.name.getText());
}

/**
 * Resolves the 1-based line number of a node within its source file.
 *
 * @param sf The parsed source file.
 * @param node The node to locate.
 * @returns The 1-based line number.
 */
function lineOf(sf, node) {
  return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
}

/**
 * Runs the console-usage check across all non-bootstrap product source files.
 *
 * @returns Process exit code: 0 when compliant, 1 on any violation.
 */
function run() {
  const files = collectSourceFiles(['.ts', '.tsx']).filter(
    (f) => !EXEMPT_FILES.has(f.split(/[\\/]/).pop()),
  );
  const violations = files.flatMap(violationsIn);
  for (const v of violations)
    process.stdout.write(
      `${v.file}:${v.line} console.${v.name} is forbidden\n`,
    );
  process.stdout.write(`check:console — ${violations.length} violation(s)\n`);
  return violations.length === 0 ? 0 : 1;
}

process.exit(run());
