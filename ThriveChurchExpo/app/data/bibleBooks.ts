/**
 * Bible Books Data
 * Static data for 66 books of the Bible with display names and URL slugs
 */

import { BibleBook } from '../types/bible';
import { BibleTranslation, DEFAULT_BIBLE_TRANSLATION } from '../types/settings';

/**
 * All 66 Bible books with their display names, YouVersion URL slugs, and chapter counts
 */
export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament (39 books)
  { name: 'Genesis', slug: 'gen', chapters: 50, testament: 'old' },
  { name: 'Exodus', slug: 'exo', chapters: 40, testament: 'old' },
  { name: 'Leviticus', slug: 'lev', chapters: 27, testament: 'old' },
  { name: 'Numbers', slug: 'num', chapters: 36, testament: 'old' },
  { name: 'Deuteronomy', slug: 'deu', chapters: 34, testament: 'old' },
  { name: 'Joshua', slug: 'jos', chapters: 24, testament: 'old' },
  { name: 'Judges', slug: 'jdg', chapters: 21, testament: 'old' },
  { name: 'Ruth', slug: 'rut', chapters: 4, testament: 'old' },
  { name: '1 Samuel', slug: '1sa', chapters: 31, testament: 'old' },
  { name: '2 Samuel', slug: '2sa', chapters: 24, testament: 'old' },
  { name: '1 Kings', slug: '1ki', chapters: 22, testament: 'old' },
  { name: '2 Kings', slug: '2ki', chapters: 25, testament: 'old' },
  { name: '1 Chronicles', slug: '1ch', chapters: 29, testament: 'old' },
  { name: '2 Chronicles', slug: '2ch', chapters: 36, testament: 'old' },
  { name: 'Ezra', slug: 'ezr', chapters: 10, testament: 'old' },
  { name: 'Nehemiah', slug: 'neh', chapters: 13, testament: 'old' },
  { name: 'Esther', slug: 'est', chapters: 10, testament: 'old' },
  { name: 'Job', slug: 'job', chapters: 42, testament: 'old' },
  { name: 'Psalms', slug: 'psa', chapters: 150, testament: 'old' },
  { name: 'Proverbs', slug: 'pro', chapters: 31, testament: 'old' },
  { name: 'Ecclesiastes', slug: 'ecc', chapters: 12, testament: 'old' },
  { name: 'The Song of Solomon', slug: 'sng', chapters: 8, testament: 'old' },
  { name: 'Isaiah', slug: 'isa', chapters: 66, testament: 'old' },
  { name: 'Jeremiah', slug: 'jer', chapters: 52, testament: 'old' },
  { name: 'Lamentations', slug: 'lam', chapters: 5, testament: 'old' },
  { name: 'Ezekiel', slug: 'eze', chapters: 48, testament: 'old' },
  { name: 'Daniel', slug: 'dan', chapters: 12, testament: 'old' },
  { name: 'Hosea', slug: 'hos', chapters: 14, testament: 'old' },
  { name: 'Joel', slug: 'jol', chapters: 3, testament: 'old' },
  { name: 'Amos', slug: 'amo', chapters: 9, testament: 'old' },
  { name: 'Obadiah', slug: 'oba', chapters: 1, testament: 'old' },
  { name: 'Jonah', slug: 'jon', chapters: 4, testament: 'old' },
  { name: 'Micah', slug: 'mic', chapters: 7, testament: 'old' },
  { name: 'Nahum', slug: 'nah', chapters: 3, testament: 'old' },
  { name: 'Habakkuk', slug: 'hab', chapters: 3, testament: 'old' },
  { name: 'Zephaniah', slug: 'zep', chapters: 3, testament: 'old' },
  { name: 'Haggai', slug: 'hag', chapters: 2, testament: 'old' },
  { name: 'Zechariah', slug: 'zec', chapters: 14, testament: 'old' },
  { name: 'Malachi', slug: 'mal', chapters: 4, testament: 'old' },
  // New Testament (27 books)
  { name: 'Matthew', slug: 'mat', chapters: 28, testament: 'new' },
  { name: 'Mark', slug: 'mar', chapters: 16, testament: 'new' },
  { name: 'Luke', slug: 'luk', chapters: 24, testament: 'new' },
  { name: 'John', slug: 'jhn', chapters: 21, testament: 'new' },
  { name: 'Acts', slug: 'act', chapters: 28, testament: 'new' },
  { name: 'Romans', slug: 'rom', chapters: 16, testament: 'new' },
  { name: '1 Corinthians', slug: '1co', chapters: 16, testament: 'new' },
  { name: '2 Corinthians', slug: '2co', chapters: 13, testament: 'new' },
  { name: 'Galatians', slug: 'gal', chapters: 6, testament: 'new' },
  { name: 'Ephesians', slug: 'eph', chapters: 6, testament: 'new' },
  { name: 'Philippians', slug: 'php', chapters: 4, testament: 'new' },
  { name: 'Colossians', slug: 'col', chapters: 4, testament: 'new' },
  { name: '1 Thessalonians', slug: '1th', chapters: 5, testament: 'new' },
  { name: '2 Thessalonians', slug: '2th', chapters: 3, testament: 'new' },
  { name: '1 Timothy', slug: '1ti', chapters: 6, testament: 'new' },
  { name: '2 Timothy', slug: '2ti', chapters: 4, testament: 'new' },
  { name: 'Titus', slug: 'tit', chapters: 3, testament: 'new' },
  { name: 'Philemon', slug: 'phm', chapters: 1, testament: 'new' },
  { name: 'Hebrews', slug: 'heb', chapters: 13, testament: 'new' },
  { name: 'James', slug: 'jam', chapters: 5, testament: 'new' },
  { name: '1 Peter', slug: '1pe', chapters: 5, testament: 'new' },
  { name: '2 Peter', slug: '2pe', chapters: 3, testament: 'new' },
  { name: '1 John', slug: '1jn', chapters: 5, testament: 'new' },
  { name: '2 John', slug: '2jn', chapters: 1, testament: 'new' },
  { name: '3 John', slug: '3jn', chapters: 1, testament: 'new' },
  { name: 'Jude', slug: 'jud', chapters: 1, testament: 'new' },
  { name: 'Revelation', slug: 'rev', chapters: 22, testament: 'new' },
];

/**
 * Traditional order (biblical order) - Genesis to Revelation
 */
export const TRADITIONAL_ORDER_SLUGS = [
  'gen', 'exo', 'lev', 'num', 'deu', 'jos', 'jdg', 'rut',
  '1sa', '2sa', '1ki', '2ki', '1ch', '2ch', 'ezr', 'neh',
  'est', 'job', 'psa', 'pro', 'ecc', 'sng', 'isa', 'jer',
  'lam', 'eze', 'dan', 'hos', 'jol', 'amo', 'oba', 'jon',
  'mic', 'nah', 'hab', 'zep', 'hag', 'zec', 'mal', 'mat',
  'mar', 'luk', 'jhn', 'act', 'rom', '1co', '2co', 'gal',
  'eph', 'php', 'col', '1th', '2th', '1ti', '2ti', 'tit',
  'phm', 'heb', 'jam', '1pe', '2pe', '1jn', '2jn', '3jn',
  'jud', 'rev',
];

/**
 * Alphabetical order - Acts to Zephaniah
 */
export const ALPHABETICAL_ORDER_SLUGS = [
  '1ch', '1co', '1jn', '1ki', '1pe', '1sa', '1th', '1ti',
  '2ch', '2co', '2jn', '2ki', '2pe', '2sa', '2th', '2ti',
  '3jn', 'act', 'amo', 'col', 'dan', 'deu', 'ecc', 'eph',
  'est', 'exo', 'eze', 'ezr', 'gal', 'gen', 'hab', 'hag',
  'heb', 'hos', 'isa', 'jam', 'jer', 'job', 'jol', 'jhn',
  'jon', 'jos', 'jud', 'jdg', 'lam', 'lev', 'luk', 'mal',
  'mar', 'mat', 'mic', 'nah', 'neh', 'num', 'oba', 'phm',
  'php', 'pro', 'psa', 'rev', 'rom', 'rut', 'sng', 'tit',
  'zec', 'zep',
];

/**
 * Get books in traditional (biblical) order
 */
export const getTraditionalBooks = (): BibleBook[] => {
  const bookMap = new Map(BIBLE_BOOKS.map(book => [book.slug, book]));
  return TRADITIONAL_ORDER_SLUGS.map(slug => bookMap.get(slug)!);
};

/**
 * Get books in alphabetical order
 */
export const getAlphabeticalBooks = (): BibleBook[] => {
  const bookMap = new Map(BIBLE_BOOKS.map(book => [book.slug, book]));
  return ALPHABETICAL_ORDER_SLUGS.map(slug => bookMap.get(slug)!);
};

/**
 * Get a book by slug
 */
export const getBookBySlug = (slug: string): BibleBook | undefined => {
  return BIBLE_BOOKS.find(book => book.slug === slug);
};

/**
 * YouVersion Bible URL format
 * Version 59 = ESV (English Standard Version)
 * @deprecated Use getYouVersionUrl with translation parameter instead
 */
export const YOUVERSION_BASE_URL = 'https://www.bible.com/bible/59';

/**
 * Generate YouVersion URL for a book with specified translation
 * @param slug - Book slug (e.g., 'gen', 'mat')
 * @param translation - Bible translation (defaults to ESV)
 * @returns Full YouVersion URL
 */
export const getYouVersionUrl = (
  slug: string,
  translation: BibleTranslation = DEFAULT_BIBLE_TRANSLATION
): string => {
  return `https://www.bible.com/bible/${translation.id}/${slug}.1`;
};

