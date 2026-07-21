import { readFileSync } from 'node:fs';

// KDP MasterPeace is not offered for free. This guard keeps misleading
// "free"/"kostenlos" CTA and offer phrases out of the public UI. The FAQ may
// ASK whether the product is free (answered "Nein"), so the word "kostenlos"
// itself is allowed — only the misleading claim phrases are forbidden.

const BASE = 'apps/studio-web/src/app';
const PUBLIC_TEMPLATES = [
  `${BASE}/landing/landing.html`,
  `${BASE}/auth/login/login.html`,
  `${BASE}/auth/register/register.html`,
  `${BASE}/auth/verify-email/verify-email.html`,
  `${BASE}/auth/action/auth-action.html`,
];

const FORBIDDEN = [
  /Kostenlos\s+(starten|testen)/i,
  /kostenlose[rs]?\s+(Demo|Zugang|Nutzung|Testphase)/i,
  /\bGratis\b/i,
  /\bFree\b/i,
];

/**
 * Collects free-claim violations in one template.
 *
 * @param file Workspace-relative path to the template.
 * @returns Violation strings (file + matched phrase).
 */
function violationsIn(file) {
  const text = readFileSync(file, 'utf8');
  return FORBIDDEN.filter((pattern) => pattern.test(text)).map(
    (pattern) => `${file}: matches ${pattern}`,
  );
}

/**
 * Runs the free-claim guard across the public templates.
 *
 * @returns Process exit code: 0 when compliant, 1 on any violation.
 */
function run() {
  const violations = PUBLIC_TEMPLATES.flatMap(violationsIn);
  for (const v of violations) process.stdout.write(`${v}\n`);
  process.stdout.write(`check:free-claims — ${violations.length} finding(s)\n`);
  return violations.length === 0 ? 0 : 1;
}

process.exit(run());
