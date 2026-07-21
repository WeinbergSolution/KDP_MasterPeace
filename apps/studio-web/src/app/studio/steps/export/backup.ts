// Project backup: versioned export + validated import (ported from Legacy V3 and
// hardened per the Step-6 brief). Export writes the full project plus the current
// step, active chapter, schema version and timestamp. Import validates the JSON,
// detects/normalizes older shapes and never silently overwrites on an invalid
// file — the caller decides what to do with the result.

const BACKUP_APP = 'kdp-masterpeace';
const BACKUP_SCHEMA = 1;
const MAX_BACKUP_BYTES = 8_000_000;

/** The outcome of parsing a backup file. */
export interface BackupResult {
  ok: boolean;
  error?: string;
  project?: Record<string, unknown>;
  step?: number;
  activeChapter?: number;
}

/**
 * Serializes a project to a versioned backup JSON string.
 *
 * @param project The book project.
 * @param step The current workflow step.
 * @param activeChapter The active chapter index.
 * @returns The backup JSON string.
 */
export function buildBackupJson(
  project: unknown,
  step: number,
  activeChapter: number,
): string {
  const payload = {
    app: BACKUP_APP,
    schema: BACKUP_SCHEMA,
    exportedAt: new Date().toISOString(),
    step,
    activeChapter,
    project,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Clamps a value into the [min, max] integer range with a fallback.
 *
 * @param value The candidate value.
 * @param max The maximum allowed.
 * @param fallback The fallback when non-finite.
 * @returns The clamped integer.
 */
function clampInt(value: unknown, max: number, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n)
    ? Math.max(0, Math.min(max, Math.round(n)))
    : fallback;
}

/**
 * Extracts the project object from a parsed backup (new or legacy shape).
 *
 * @param data The parsed JSON value.
 * @returns The project record, or null when none is present.
 */
function extractProject(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  const project = (record['project'] ?? record) as Record<string, unknown>;
  if (!project || typeof project !== 'object') return null;
  if (!('outline' in project) && !('title' in project)) return null;
  return project;
}

const ERR_SIZE = 'Die Datei ist zu groß für ein Projekt-Backup.';
const ERR_JSON =
  'Die Datei ist kein gültiges JSON — ist es ein Backup aus diesem Tool?';
const ERR_NO_PROJECT =
  'Kein Buchprojekt in der Datei gefunden — bitte ein Backup aus diesem Tool wählen.';

/** Parses JSON, returning undefined on failure. */
function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Builds a failed backup result. */
function fail(error: string): BackupResult {
  return { ok: false, error };
}

/**
 * Validates and normalizes a backup file's text content.
 *
 * @param text The raw file text.
 * @param byteSize The file size in bytes.
 * @returns The parse result (ok=false carries a user-facing error).
 */
export function parseBackup(text: string, byteSize: number): BackupResult {
  if (byteSize > MAX_BACKUP_BYTES) return fail(ERR_SIZE);
  const data = tryParseJson(text);
  if (data === undefined) return fail(ERR_JSON);
  const project = extractProject(data);
  if (!project) return fail(ERR_NO_PROJECT);
  const record = data as Record<string, unknown>;
  const rawChapter = record['activeChapter'] ?? project['activeChapter'];
  const step = clampInt(record['step'], 7, 0);
  const activeChapter = clampInt(rawChapter, 999, 0);
  return { ok: true, project, step, activeChapter };
}
