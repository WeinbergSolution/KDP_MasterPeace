import { readdirSync, statSync } from 'node:fs';
import { join, sep, extname, basename } from 'node:path';

// Only hand-written product source is checked; generated, spec, config, e2e
// and vendor files are exempt per AGENTS.md §5.3 / §13.2.
const ROOTS = ['apps', 'libs'];
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'out-tsc',
  '.nx',
  'coverage',
]);
const GENERATED_FILES = new Set(['nx-welcome.ts']);

/**
 * Decides whether a file is exempt from the coding checks.
 *
 * @param name The file's basename.
 * @returns True when the file is a spec, config, declaration, or generated file.
 */
function isExempt(name) {
  if (GENERATED_FILES.has(name)) return true;
  if (name.endsWith('.d.ts')) return true;
  if (/\.(spec|test)\.[cm]?tsx?$/.test(name)) return true;
  return (
    /\.config\.[cm]?[jt]s$/.test(name) || /^(jest|vitest)\.config/.test(name)
  );
}

/**
 * Recursively collects files under a directory, skipping vendor and build dirs.
 *
 * @param dir Absolute or workspace-relative directory to walk.
 * @param acc Accumulator array that receives matching file paths.
 * @returns The accumulator with all descended file paths appended.
 */
function walk(dir, acc) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (SKIP_DIRS.has(entry)) continue;
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

/**
 * Keeps only product source files that live under a `src/` segment, match one
 * of the requested extensions, are inside a real (non-e2e) project, and are not
 * exempt (spec/config/generated).
 *
 * @param files Candidate file paths.
 * @param extensions Allowed file extensions, e.g. ['.ts', '.html'].
 * @returns The filtered list of files subject to checking.
 */
function keepSources(files, extensions) {
  const inSrc = (f) =>
    f.split(sep).includes('src') && !f.includes(`-e2e${sep}`);
  const matches = (f) =>
    extensions.includes(extname(f)) && !isExempt(basename(f));
  return files.filter((f) => inSrc(f) && matches(f));
}

/**
 * Enumerates all hand-written product source files across apps and libs.
 *
 * @param extensions Allowed file extensions, e.g. ['.ts', '.html', '.scss'].
 * @returns Sorted list of workspace-relative source file paths.
 */
export function collectSourceFiles(extensions) {
  const found = [];
  for (const root of ROOTS) walk(root, found);
  return keepSources(found, extensions).sort();
}
