import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/** Legacy backup schema variant of a golden-master fixture. */
export type LegacyFixtureSchema = 'v1' | 'v2';

const fixtureFileNames: Record<LegacyFixtureSchema, string> = {
  v1: 'legacy-golden-master-v1.json',
  v2: 'legacy-golden-master.json',
};


/**
 * Resolves the fixtures directory relative to this module, working from both
 * the compiled `dist/lib` output and the `src/lib` sources (both go two levels
 * up to the `libs/testing` root, then into `fixtures`).
 *
 * @returns Absolute path to the committed golden-master fixtures directory.
 */
function fixturesDir(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', '..', 'fixtures');
}


/**
 * Returns the absolute path of a golden-master legacy backup fixture.
 *
 * @param schema Which legacy backup schema variant to locate ('v1' | 'v2').
 * @returns Absolute filesystem path to the fixture JSON file.
 */
export function goldenMasterPath(schema: LegacyFixtureSchema): string {
  return join(fixturesDir(), fixtureFileNames[schema]);
}


/**
 * Loads and parses a golden-master legacy backup fixture as raw JSON.
 *
 * The importer (Phase C) is responsible for schema validation; this loader
 * intentionally returns `unknown` so tests exercise real, untyped backup data.
 *
 * @param schema Which legacy backup schema variant to load ('v1' | 'v2').
 * @returns The parsed fixture content as `unknown`.
 * @throws If the fixture file is missing or contains invalid JSON.
 */
export function loadGoldenMaster(schema: LegacyFixtureSchema): unknown {
  const raw = readFileSync(goldenMasterPath(schema), 'utf8');
  return JSON.parse(raw);
}
