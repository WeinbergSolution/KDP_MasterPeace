import { describe, expect, it } from 'vitest';
import { goldenMasterPath, loadGoldenMaster } from './legacy-fixtures.js';

/**
 * Narrow accessor for the legacy project object embedded in a fixture,
 * tolerating both the `{ project, step }` wrapper (v2) and the bare project (v1).
 *
 * @param fixture The parsed fixture content.
 * @returns The legacy project object as a plain record.
 */
function projectOf(fixture: unknown): Record<string, unknown> {
  const wrapper = fixture as { project?: Record<string, unknown> };
  return (wrapper.project ?? fixture) as Record<string, unknown>;
}


/**
 * Concatenates all chapter markup strings of a legacy project fixture.
 *
 * @param project The legacy project object.
 * @returns Newline-joined chapter content markup.
 */
function chapterMarkup(project: Record<string, unknown>): string {
  const outline = project['outline'] as Array<{ content?: string }>;
  return outline.map((chapter) => chapter.content ?? '').join('\n');
}


describe('legacy golden-master fixtures', () => {
  it('exposes both schema variants at stable paths', () => {
    expect(goldenMasterPath('v2')).toMatch(/legacy-golden-master\.json$/);
    expect(goldenMasterPath('v1')).toMatch(/legacy-golden-master-v1\.json$/);
  });


  it('wraps v2 as { project, step } and keeps v1 as the bare project', () => {
    const v2 = loadGoldenMaster('v2') as { project: unknown; step: number };
    const v1 = loadGoldenMaster('v1') as Record<string, unknown>;
    expect(v2.step).toBe(5);
    expect(v2.project).toBeTypeOf('object');
    expect(v1['outline']).toBeTypeOf('object');
  });


  it('carries identical project data across both schema variants (determinism)', () => {
    const fromV2 = JSON.stringify(projectOf(loadGoldenMaster('v2')));
    const fromV1 = JSON.stringify(projectOf(loadGoldenMaster('v1')));
    expect(fromV1).toEqual(fromV2);
  });


  it('exercises every markup construct required by the parser spec', () => {
    const markup = chapterMarkup(projectOf(loadGoldenMaster('v2')));
    for (const token of ['## ', '### ', '**', '> ', '- ', '* ', '1. ', '[skala]', '[linien:', '- [ ]', '- [x]', ':::uebung', ':::tipp', ':::beispiel']) {
      expect(markup, `missing construct: ${token}`).toContain(token);
    }
  });


  it('includes the documented parser edge cases (MW-* warnings)', () => {
    const markup = chapterMarkup(projectOf(loadGoldenMaster('v2')));
    expect(markup).toContain('# Alte Ueberschrift'); // MW-H1-DEGRADE
    expect(markup).toContain('[linien:20]'); // MW-LINES-CLAMP
    expect(markup).toContain('5. Fuenftens'); // MW-OL-INDEX
    expect(markup).toContain(':::unbekannt'); // MW-BOX-UNKNOWN
    expect(markup).toContain('unbalancierten Fettdruck'); // MW-BOLD-UNBALANCED
  });
});
