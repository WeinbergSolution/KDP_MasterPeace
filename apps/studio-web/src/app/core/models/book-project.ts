// Book project model persisted per user in Firestore (users/{uid}/projects).
// Mirrors the Legacy V3 `emptyProject` shape 1:1 so no visible reference field is
// lost. Deterministic normalization on read replaces the legacy free-object merge.

export type BookType = 'workbook' | 'ratgeber' | 'roman';
export type BookLanguage = 'de' | 'en' | 'es' | 'fr' | 'it';

/** Author voice profile (Autoren-DNA). */
export interface VoiceProfile {
  sample: string;
  profile: string;
}

/** Launch kit content (social posts + email sequence). */
export interface LaunchKit {
  posts: Record<string, unknown>[];
  emails: Record<string, unknown>[];
}

/** A single outline chapter. */
export interface Chapter {
  id: string;
  title: string;
  goal: string;
  content: string;
}

/** Front/back matter sections. */
export interface Extras {
  einleitung: string;
  arbeitsweise: string;
  schlusswort: string;
  autorin: string;
  bonus: string;
}

/** Cover spec + generated assets. */
export interface CoverSpec {
  pageCount: number;
  paper: string;
  bg: string;
  fg: string;
  blurb: string;
  brief: string;
  imgPrompt: string;
  imageUrl: string;
}

/** Publishing config (binding, prices, guide checks). */
export interface PubSpec {
  binding: string;
  price: number;
  ebookPrice: number;
  checks: Record<string, boolean>;
}

/** Digital-product export config. */
export interface DigitalSpec {
  format: string;
  fontSize: number;
  accent: string;
  align: string;
  withExtras: boolean;
  sel: Record<string, boolean>;
}

/** Print/format settings. */
export interface FormatSettings {
  trim: string;
  pages: string;
  font: string;
  fontSize: number;
  lineHeight: number;
  align: string;
  wordTarget: number;
}

/** A publishing project owned by one authenticated user (Legacy V3 parity). */
export interface BookProject {
  id: string;
  ownerId: string;
  niche: string;
  language: BookLanguage;
  bookType: BookType;
  chapterCount: number;
  ideas: Record<string, unknown>[];
  trends: Record<string, unknown>[];
  digitalIdeas: Record<string, unknown>[];
  gaps: Record<string, unknown>[];
  titleTests: Record<string, unknown>[];
  series: Record<string, unknown>[];
  voice: VoiceProfile;
  launch: LaunchKit;
  title: string;
  subtitle: string;
  audience: string;
  promise: string;
  author: string;
  bio: string;
  outline: Chapter[];
  extras: Extras;
  cover: CoverSpec;
  pub: PubSpec;
  digital: DigitalSpec;
  settings: FormatSettings;
  kdp: Record<string, unknown> | null;
  currentStep: number;
  activeChapter: number;
  createdAt: number;
  updatedAt: number;
  version: number;
}

export const BOOK_TYPE_LABELS: Record<BookType, string> = {
  workbook: 'Workbook / Arbeitsbuch (mit Übungen & Schreiblinien)',
  ratgeber: 'Ratgeber / Sachbuch (Fließtext, ohne Ausfüllelemente)',
  roman: 'Roman / Erzählung (Belletristik)',
};

export const LANG_LABELS: Record<BookLanguage, string> = {
  de: 'Deutsch',
  en: 'Englisch',
  es: 'Spanisch',
  fr: 'Französisch',
  it: 'Italienisch',
};

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
  'Eltern & Erziehung',
  'Spiritualität & Manifestation',
  'Kreativität & Journaling',
];

export const PROJECT_DEFAULTS = {
  niche: 'Selbstwert stärken nach toxischen Beziehungen',
  language: 'de' as BookLanguage,
  bookType: 'workbook' as BookType,
  chapterCount: 8,
  ideas: [] as Record<string, unknown>[],
  trends: [] as Record<string, unknown>[],
  digitalIdeas: [] as Record<string, unknown>[],
  gaps: [] as Record<string, unknown>[],
  titleTests: [] as Record<string, unknown>[],
  series: [] as Record<string, unknown>[],
  voice: { sample: '', profile: '' },
  launch: { posts: [], emails: [] },
  title: '',
  subtitle: '',
  audience: '',
  promise: '',
  author: '',
  bio: '',
  outline: [] as Chapter[],
  extras: {
    einleitung: '',
    arbeitsweise: '',
    schlusswort: '',
    autorin: '',
    bonus: '',
  },
  cover: {
    pageCount: 0,
    paper: 'cream',
    bg: '#2E2A3B',
    fg: '#F5F1E6',
    blurb: '',
    brief: '',
    imgPrompt: '',
    imageUrl: '',
  },
  pub: { binding: 'paperback', price: 12.99, ebookPrice: 4.99, checks: {} },
  digital: {
    format: 'phone',
    fontSize: 14,
    accent: '#6C57B8',
    align: 'left',
    withExtras: true,
    sel: {},
  },
  settings: {
    trim: '7x10',
    pages: '151-300',
    font: 'garamond',
    fontSize: 11.5,
    lineHeight: 1.55,
    align: 'justify',
    wordTarget: 1200,
  },
  kdp: null,
  currentStep: 0,
  activeChapter: 0,
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
  return {
    ...PROJECT_DEFAULTS,
    ownerId,
    title,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Extracts the copyable content fields of a project (for "duplicate").
 *
 * @param source The project to copy from.
 * @returns The editable content fields, excluding id/owner/timestamps.
 */
export function projectCopyFields(source: BookProject): Partial<BookProject> {
  const copy: Partial<BookProject> = { ...source };
  delete copy.id;
  delete copy.ownerId;
  delete copy.createdAt;
  delete copy.updatedAt;
  copy.title = `${source.title || 'Projekt'} (Kopie)`;
  return copy;
}

/**
 * Coerces a value to a plain record (empty when not one).
 *
 * @param value The candidate value.
 * @returns The value as a record, or an empty record.
 */
function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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
 * Merges the raw nested section objects onto their defaults.
 *
 * @param r The raw project record.
 * @returns The normalized nested sections.
 */
function nestedSections(r: Record<string, unknown>) {
  const d = PROJECT_DEFAULTS;
  return {
    voice: { ...d.voice, ...asRecord(r['voice']) } as VoiceProfile,
    launch: { ...d.launch, ...asRecord(r['launch']) } as LaunchKit,
    extras: { ...d.extras, ...asRecord(r['extras']) } as Extras,
    cover: { ...d.cover, ...asRecord(r['cover']) } as CoverSpec,
    pub: { ...d.pub, ...asRecord(r['pub']) } as PubSpec,
    digital: { ...d.digital, ...asRecord(r['digital']) } as DigitalSpec,
    settings: { ...d.settings, ...asRecord(r['settings']) } as FormatSettings,
    outline: Array.isArray(r['outline']) ? (r['outline'] as Chapter[]) : [],
    kdp:
      asRecord(r['kdp']) && r['kdp']
        ? (r['kdp'] as Record<string, unknown>)
        : null,
  };
}

/**
 * Coerces a raw Firestore value into a typed BookProject with safe defaults.
 *
 * @param id The document id.
 * @param raw The stored document data (untrusted shape).
 * @returns A normalized BookProject preserving every stored field.
 */
export function normalizeProject(id: string, raw: unknown): BookProject {
  const r = asRecord(raw);
  const now = Date.now();
  return {
    ...PROJECT_DEFAULTS,
    ...r,
    ...nestedSections(r),
    id,
    ownerId: str(r['ownerId']),
    createdAt: num(r['createdAt'], now),
    updatedAt: num(r['updatedAt'], now),
  } as BookProject;
}
