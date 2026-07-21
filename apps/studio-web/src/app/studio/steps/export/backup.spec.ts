import { describe, expect, it } from 'vitest';
import { createEmptyProject } from '../../../core/models/book-project';
import { buildBackupJson, parseBackup } from './backup';

describe('buildBackupJson', () => {
  it('serializes the project, step and active chapter with a schema version', () => {
    const p = createEmptyProject('u1', 'Backup-Test');
    const json = JSON.parse(buildBackupJson(p, 3, 2));
    expect(json.schema).toBe(1);
    expect(json.step).toBe(3);
    expect(json.activeChapter).toBe(2);
    expect(json.project.title).toBe('Backup-Test');
    expect(typeof json.exportedAt).toBe('string');
  });
});

describe('parseBackup', () => {
  it('accepts a valid backup and restores step + active chapter', () => {
    const p = createEmptyProject('u1', 'Genug');
    const json = buildBackupJson(p, 4, 1);
    const result = parseBackup(json, json.length);
    expect(result.ok).toBe(true);
    expect(result.project?.['title']).toBe('Genug');
    expect(result.step).toBe(4);
    expect(result.activeChapter).toBe(1);
  });

  it('accepts a legacy backup that is the raw project object', () => {
    const p = createEmptyProject('u1', 'Legacy');
    const result = parseBackup(JSON.stringify(p), 500);
    expect(result.ok).toBe(true);
    expect(result.project?.['title']).toBe('Legacy');
  });

  it('rejects invalid JSON without overwriting', () => {
    const result = parseBackup('{ not json', 20);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('JSON');
  });

  it('rejects JSON that is not a project', () => {
    const result = parseBackup(JSON.stringify({ hello: 'world' }), 30);
    expect(result.ok).toBe(false);
    expect(result.project).toBeUndefined();
  });

  it('rejects an oversized file', () => {
    const result = parseBackup('{}', 20_000_000);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('groß');
  });

  it('clamps an out-of-range step', () => {
    const p = createEmptyProject('u1', 'X');
    const result = parseBackup(buildBackupJson(p, 99, 0), 500);
    expect(result.step).toBe(7);
  });
});
