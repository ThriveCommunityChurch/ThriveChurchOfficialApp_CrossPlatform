/**
 * Bible Books Data
 * Static data for 66 books of the Bible with display names and URL slugs
 */

import { BibleBook } from '../types/bible';
import { BibleTranslation, DEFAULT_BIBLE_TRANSLATION } from '../types/settings';

/**
 * All 66 Bible books with their display names and YouVersion URL slugs
 */
export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { name: 'Genesis', slug: 'gen' },
  { name: 'Exodus', slug: 'exo' },
  { name: 'Leviticus', slug: 'lev' },
  { name: 'Numbers', slug: 'num' },
  { name: 'Deuteronomy', slug: 'deu' },
  { name: 'Joshua', slug: 'jos' },
  { name: 'Judges', slug: 'jdg' },
  { name: 'Ruth', slug: 'rut' },
  { name: '1 Samuel', slug: '1sa' },
  { name: '2 Samuel', slug: '2sa' },
  { name: '1 Kings', slug: '1ki' },
  { name: '2 Kings', slug: '2ki' },
  { name: '1 Chronicles', slug: '1ch' },
  { name: '2 Chronicles', slug: '2ch' },
  { name: 'Ezra', slug: 'ezr' },
  { name: 'Nehemiah', slug: 'neh' },
  { name: 'Esther', slug: 'est' },
  { name: 'Job', slug: 'job' },
  { name: 'Psalms', slug: 'psa' },
  { name: 'Proverbs', slug: 'pro' },
  { name: 'Ecclesiastes', slug: 'ecc' },
  { name: 'The Song of Solomon', slug: 'sng' },
  { name: 'Isaiah', slug: 'isa' },
  { name: 'Jeremiah', slug: 'jer' },
  { name: 'Lamentations', slug: 'lam' },
  { name: 'Ezekiel', slug: 'eze' },
  { name: 'Daniel', slug: 'dan' },
  { name: 'Hosea', slug: 'hos' },
  { name: 'Joel', slug: 'jol' },
  { name: 'Amos', slug: 'amo' },
  { name: 'Obadiah', slug: 'oba' },
  { name: 'Jonah', slug: 'jon' },
  { name: 'Micah', slug: 'mic' },
  { name: 'Nahum', slug: 'nah' },
  { name: 'Habakkuk', slug: 'hab' },
  { name: 'Zephaniah', slug: 'zep' },
  { name: 'Haggai', slug: 'hag' },
  { name: 'Zechariah', slug: 'zec' },
  { name: 'Malachi', slug: 'mal' },
  // New Testament
  { name: 'Matthew', slug: 'mat' },
  { name: 'Mark', slug: 'mar' },
  { name: 'Luke', slug: 'luk' },
  { name: 'John', slug: 'jhn' },
  { name: 'Acts', slug: 'act' },
  { name: 'Romans', slug: 'rom' },
  { name: '1 Corinthians', slug: '1co' },
  { name: '2 Corinthians', slug: '2co' },
  { name: 'Galatians', slug: 'gal' },
  { name: 'Ephesians', slug: 'eph' },
  { name: 'Philippians', slug: 'php' },
  { name: 'Colossians', slug: 'col' },
  { name: '1 Thessalonians', slug: '1th' },
  { name: '2 Thessalonians', slug: '2th' },
  { name: '1 Timothy', slug: '1ti' },
  { name: '2 Timothy', slug: '2ti' },
  { name: 'Titus', slug: 'tit' },
  { name: 'Philemon', slug: 'phm' },
  { name: 'Hebrews', slug: 'heb' },
  { name: 'James', slug: 'jam' },
  { name: '1 Peter', slug: '1pe' },
  { name: '2 Peter', slug: '2pe' },
  { name: '1 John', slug: '1jn' },
  { name: '2 John', slug: '2jn' },
  { name: '3 John', slug: '3jn' },
  { name: 'Jude', slug: 'jud' },
  { name: 'Revelation', slug: 'rev' },
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

