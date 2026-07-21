import { z } from 'zod';

// Project/Book contracts (data-model.md §2). Locales for UI, content and market
// are distinct fields (fixes legacy finding P14); demo projects are constrained
// to the mock provider elsewhere (invariant §4.7).

/** How AI involvement is disclosed per book component (KDP transparency). */
export const AiDisclosureLevelSchema = z.enum([
  'human',
  'ai-assisted',
  'ai-generated',
]);

/** Per-component AI disclosure for a project. */
export const AiDisclosureSchema = z.object({
  text: AiDisclosureLevelSchema,
  cover: AiDisclosureLevelSchema,
  interiorImages: AiDisclosureLevelSchema,
  translation: AiDisclosureLevelSchema,
});

/** The book format profile a project targets. */
export const FormatProfileSchema = z.enum([
  'workbook',
  'paperback',
  'nonfiction',
  'ebook',
]);

/** A publishing project (tenant-scoped by organization). */
export const ProjectSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  name: z.string().min(1),
  contentLocale: z.string().min(2),
  marketLocale: z.string().min(2),
  demoMode: z.boolean(),
  aiDisclosure: AiDisclosureSchema,
});

/** A publishing project (tenant-scoped by organization). */
export type Project = z.infer<typeof ProjectSchema>;
