import { describe, expect, it } from 'vitest';
import { CONTENT_MAX_WIDTH_PX, MANDATORY_VIEWPORTS } from './design-tokens.js';

describe('design tokens', () => {
  it('caps content at 1440px (AGENTS.md §11.4)', () => {
    expect(CONTENT_MAX_WIDTH_PX).toBe(1440);
  });

  it('covers all seven mandatory viewports starting at 320px', () => {
    expect(MANDATORY_VIEWPORTS).toHaveLength(7);
    expect(MANDATORY_VIEWPORTS[0].width).toBe(320);
  });
});
