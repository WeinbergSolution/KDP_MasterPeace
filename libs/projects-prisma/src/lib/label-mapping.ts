import type { VersionLabel } from '@kdp/projects';

// Maps between the domain version label ('pre-repair') and the Prisma enum
// value ('pre_repair'); all other labels are identical.

/** Prisma's VersionLabel enum values (schema.prisma). */
export type PrismaVersionLabel =
  'autosave' | 'snapshot' | 'pre_repair' | 'export';

/**
 * Converts a domain version label to its Prisma enum value.
 *
 * @param label The domain version label.
 * @returns The matching Prisma enum value.
 */
export function toPrismaLabel(label: VersionLabel): PrismaVersionLabel {
  return label === 'pre-repair' ? 'pre_repair' : label;
}

/**
 * Converts a Prisma enum value back to the domain version label.
 *
 * @param label The Prisma enum value.
 * @returns The matching domain version label.
 */
export function fromPrismaLabel(label: PrismaVersionLabel): VersionLabel {
  return label === 'pre_repair' ? 'pre-repair' : label;
}
