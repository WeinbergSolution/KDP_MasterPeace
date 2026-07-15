// Book project model persisted per user in Firestore (users/{uid}/projects).
// Deterministic normalization on read replaces the legacy free-object merge.
// This slice keeps the fields the idea step + WP-C1 preview need; later packages
// extend it (outline, extras, cover, kdp, launch, …) — no field is removed.

export type BookType = 'workbook' | 'ratgeber' | 'roman';
export type BookLanguage = 'de' | 'en' | 'es' | 'fr' | 'it';

/** A single publishing project owned by one authenticated user. */
export interface BookProject {
  id: string;
  ownerId: string;
  title: string;
  subtitle: string;
  author: string;
  niche: string;
  language: BookLanguage;
  bookType: BookType;
  currentStep: number;
  chapterCount: number;
  markup: string;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export const BOOK_TYPES: readonly BookType[] = [
  'workbook',
  'ratgeber',
  'roman',
];
export const BOOK_LANGUAGES: readonly BookLanguage[] = [
  'de',
  'en',
  'es',
  'fr',
  'it',
];

export const NICHES: readonly string[] = [
  'Selbstwert & toxische Beziehungen',
  'Bindungsangst & Beziehungsmuster',
  'Selbstliebe & Selbstfürsorge',
  'Innere Kindheit & Schattenarbeit',
  'Achtsamkeit & Stressbewältigung',
  'Trauer & Verlust',
  'Gewohnheiten & Disziplin',
  'Produktivität & Fokus',
  'Finanzen & Money Mindset',
  'Kreativität & Journaling',
];

const STARTER_MARKUP = `## Verstehen, was Selbstwert ist
Dein Selbstwert ist **keine feste Eigenschaft**, sondern eine Fähigkeit.
> Du musst dich nicht beweisen, um wertvoll zu sein.
:::uebung Deine innere Stimme
[linien:3]
- [ ] aufgeschrieben
:::`;

const DEFAULTS = {
  title: '',
  subtitle: '',
  author: '',
  niche: '',
  language: 'de' as BookLanguage,
  bookType: 'workbook' as BookType,
  currentStep: 0,
  chapterCount: 8,
  markup: STARTER_MARKUP,
  version: 1,
};

/**
 * Builds a new project payload (without id) for the given owner and title.
 *
 * @param ownerId The authenticated user's uid.
 * @param title The initial project title.
 * @returns A project ready to be written to Firestore.
 */
export function createEmptyProject(
  ownerId: string,
  title: string,
): Omit<BookProject, 'id'> {
  const now = Date.now();
  return { ...DEFAULTS, ownerId, title, createdAt: now, updatedAt: now };
}

/**
 * Coerces a raw Firestore value into a typed BookProject with safe defaults.
 *
 * @param id The document id.
 * @param raw The stored document data (untrusted shape).
 * @returns A normalized BookProject.
 */
export function normalizeProject(id: string, raw: unknown): BookProject {
  const r = (raw ?? {}) as Record<string, unknown>;
  const now = Date.now();
  return {
    ...DEFAULTS,
    ...pickKnown(r),
    id,
    ownerId: str(r['ownerId']),
    createdAt: num(r['createdAt'], now),
    updatedAt: num(r['updatedAt'], now),
  };
}

/**
 * Extracts the known editable fields from a raw record.
 *
 * @param r The raw record.
 * @returns A partial project with validated primitive fields.
 */
function pickKnown(r: Record<string, unknown>): Partial<BookProject> {
  return {
    title: str(r['title']),
    subtitle: str(r['subtitle']),
    author: str(r['author']),
    niche: str(r['niche']),
    language: pickLanguage(r['language']),
    bookType: pickBookType(r['bookType']),
    currentStep: num(r['currentStep'], 0),
    chapterCount: num(r['chapterCount'], 8),
    markup: str(r['markup']) || DEFAULTS.markup,
    version: num(r['version'], 1),
  };
}

/**
 * Validates the book language, defaulting to German.
 *
 * @param value The candidate language value.
 * @returns A supported BookLanguage.
 */
function pickLanguage(value: unknown): BookLanguage {
  return BOOK_LANGUAGES.includes(value as BookLanguage)
    ? (value as BookLanguage)
    : 'de';
}

/**
 * Validates the book type, defaulting to workbook.
 *
 * @param value The candidate book-type value.
 * @returns A supported BookType.
 */
function pickBookType(value: unknown): BookType {
  return BOOK_TYPES.includes(value as BookType)
    ? (value as BookType)
    : 'workbook';
}

/**
 * Reads a string field, defaulting to empty.
 *
 * @param value The candidate value.
 * @returns The string value or an empty string.
 */
function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/**
 * Reads a finite number field with a fallback.
 *
 * @param value The candidate value.
 * @param fallback The default when not a finite number.
 * @returns The numeric value or the fallback.
 */
function num(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/**
 * Extracts the copyable content fields of a project (for "duplicate").
 *
 * @param source The project to copy from.
 * @returns The editable content fields, excluding id/owner/title/timestamps.
 */
export function projectCopyFields(source: BookProject): Partial<BookProject> {
  return {
    subtitle: source.subtitle,
    author: source.author,
    niche: source.niche,
    language: source.language,
    bookType: source.bookType,
    chapterCount: source.chapterCount,
    markup: source.markup,
  };
}
