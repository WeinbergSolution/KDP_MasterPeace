import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Integration config: runs ONLY the real-Postgres integration specs. Used by
// the `test-integration` target (npm run test:integration:postgres).
//
// Workspace packages (@kdp/*) publish their entry via package.json exports ->
// ./dist. To run the integration test from a clean checkout WITHOUT a prior
// build, resolve every @kdp/* package to its TypeScript source instead of dist.
// The alias map is derived from the workspace package.json names so it never
// goes stale.

const here = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(here, '../..');
const SKIP_DIRS = new Set([
  'node_modules',
  'dist',
  'src',
  'out-tsc',
  'test-output',
]);

function collectPackageDirs(dir: string, acc: string[]): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (existsSync(join(full, 'package.json'))) acc.push(full);
    else collectPackageDirs(full, acc);
  }
  return acc;
}

function sourceAliases(): { find: RegExp; replacement: string }[] {
  const aliases: { find: RegExp; replacement: string }[] = [];
  for (const dir of collectPackageDirs(join(workspaceRoot, 'libs'), [])) {
    const { name } = JSON.parse(
      readFileSync(join(dir, 'package.json'), 'utf8'),
    );
    const entry = join(dir, 'src', 'index.ts');
    if (
      typeof name === 'string' &&
      name.startsWith('@kdp/') &&
      existsSync(entry)
    ) {
      aliases.push({ find: new RegExp(`^${name}$`), replacement: entry });
    }
  }
  return aliases;
}

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/projects-prisma-integration',
  resolve: { alias: sourceAliases() },
  test: {
    name: 'projects-prisma-integration',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.integration.spec.{ts,mts,cts}'],
    hookTimeout: 240000,
    testTimeout: 60000,
    reporters: ['default'],
  },
}));
