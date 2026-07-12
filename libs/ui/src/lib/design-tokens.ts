// TypeScript mirror of the layout design tokens (libs/ui/src/styles/_tokens.scss)
// for consumers that need the values in code (e.g. responsive checks, canvas
// rendering). SCSS remains the single source for styling.

/** Maximum width of the primary content column, in pixels (AGENTS.md §11.4). */
export const CONTENT_MAX_WIDTH_PX = 1440;

/** Width of the app-shell rail, in pixels. */
export const RAIL_WIDTH_PX = 236;

/** The mandatory test viewports every page must support (AGENTS.md §11.6). */
export const MANDATORY_VIEWPORTS = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
] as const;

/** A single responsive viewport size. */
export type Viewport = (typeof MANDATORY_VIEWPORTS)[number];
