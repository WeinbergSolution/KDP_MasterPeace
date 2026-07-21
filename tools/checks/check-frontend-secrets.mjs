import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// AGENTS.md §13.1 / target-architecture.md §12: no provider secret may ever ship
// in a frontend bundle. Scans built browser output for known key shapes. The
// architecture boundary rule additionally prevents importing ai-providers.

const FRONTEND_DIST = ['public-web', 'studio-web', 'admin-web'].map((a) =>
  join('dist', 'apps', a),
);
const SECRET_PATTERNS = [
  /sk-ant-[A-Za-z0-9-]{8,}/, // Anthropic
  /sk-[A-Za-z0-9]{20,}/, // OpenAI-style
  /AIza[0-9A-Za-z_-]{20,}/, // Google API key
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/, // PEM private key
];

/**
 * Recursively lists all files under a directory.
 *
 * @param dir Directory to walk.
 * @param acc Accumulator for file paths.
 * @returns The accumulated file paths.
 */
function walk(dir, acc) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

/**
 * Scans a single built file for any known secret pattern.
 *
 * @param file Path to the built asset.
 * @returns Matching pattern descriptions (empty when clean).
 */
function scanFile(file) {
  const text = readFileSync(file, 'utf8');
  return SECRET_PATTERNS.filter((re) => re.test(text)).map(
    (re) => `${file}: matches ${re}`,
  );
}

/**
 * Runs the frontend-secret scan across all existing frontend builds.
 *
 * @returns Process exit code: 0 when clean or nothing built, 1 on any match.
 */
function run() {
  const dists = FRONTEND_DIST.filter((d) => existsSync(d));
  if (dists.length === 0) {
    process.stdout.write(
      'check:frontend-secrets — SKIPPED (no frontend build found)\n',
    );
    return 0;
  }
  const findings = dists.flatMap((d) => walk(d, [])).flatMap(scanFile);
  for (const f of findings) process.stdout.write(`${f}\n`);
  process.stdout.write(
    `check:frontend-secrets — ${findings.length} finding(s)\n`,
  );
  return findings.length === 0 ? 0 : 1;
}

process.exit(run());
