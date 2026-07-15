import type { MigrationWarning, SourcePosition } from './diagnostics.js';

// Stable migration warning codes (legacy-react-to-angular.md §3). No new code
// may be emitted without a documented entry here.
export const MW = {
  H1_DEGRADE: 'MW-H1-DEGRADE',
  OL_INDEX: 'MW-OL-INDEX',
  BOX_UNCLOSED: 'MW-BOX-UNCLOSED',
  BOX_UNKNOWN: 'MW-BOX-UNKNOWN',
  LINES_CLAMP: 'MW-LINES-CLAMP',
  EMPTYLINE_LOSS: 'MW-EMPTYLINE-LOSS',
  BOLD_UNBALANCED: 'MW-BOLD-UNBALANCED',
} as const;

const MESSAGES: Record<string, string> = {
  [MW.H1_DEGRADE]: 'Legacy `# ` heading was degraded to level 2.',
  [MW.OL_INDEX]:
    'Ordered list numbering was normalized to a continuous sequence.',
  [MW.BOX_UNCLOSED]:
    'An open `:::` box was auto-closed at the end of the content.',
  [MW.BOX_UNKNOWN]: 'Unknown `:::` box type was preserved as a paragraph.',
  [MW.LINES_CLAMP]:
    'Writing lines count was clamped to the format limit of 15.',
  [MW.EMPTYLINE_LOSS]:
    'Blank source lines carry no structure and were not emitted as nodes.',
  [MW.BOLD_UNBALANCED]: 'Unbalanced `**` was kept as literal text.',
};

/**
 * Builds a structured migration warning for a documented MW-* deviation.
 *
 * @param code One of the stable MW-* codes.
 * @param position The source position the warning refers to.
 * @param extra Optional nodeId, machine-readable context and a user action.
 * @returns The assembled migration warning (severity 'warning').
 */
export function migrationWarning(
  code: (typeof MW)[keyof typeof MW],
  position: SourcePosition,
  extra: {
    nodeId?: string;
    context?: Record<string, unknown>;
    action?: string;
  } = {},
): MigrationWarning {
  return {
    code,
    message: MESSAGES[code],
    severity: 'warning',
    position,
    ...extra,
  };
}
