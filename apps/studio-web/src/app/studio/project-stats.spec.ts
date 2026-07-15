import { describe, expect, it } from 'vitest';
import {
  STEP_LABELS,
  computeStats,
  countWords,
  estimatePages,
} from './project-stats';

describe('project-stats', () => {
  it('has the eight workflow steps in order', () => {
    expect(STEP_LABELS.length).toBe(8);
    expect(STEP_LABELS[0]).toBe('Idee');
    expect(STEP_LABELS[7]).toBe('Veröffentlichen');
  });

  it('counts whitespace-separated words', () => {
    expect(countWords('  eins zwei   drei ')).toBe(3);
    expect(countWords('')).toBe(0);
  });

  it('estimates pages from words and never goes negative', () => {
    expect(estimatePages(0)).toBe(0);
    expect(estimatePages(470)).toBe(2);
  });

  it('computes combined stats from markup', () => {
    const stats = computeStats('a b c d e');
    expect(stats.words).toBe(5);
    expect(stats.pages).toBe(1);
  });
});
