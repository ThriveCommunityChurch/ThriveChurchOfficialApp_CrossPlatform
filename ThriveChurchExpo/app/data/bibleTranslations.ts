/**
 * Bible Translations Data
 * Available English Bible translations from Bible.com (YouVersion)
 * 
 * Data sourced from https://www.bible.com/versions
 * IDs and codes are stable and maintained by YouVersion
 */

import { BibleTranslation } from '../types/settings';

/**
 * Available English Bible Translations
 * Ordered by popularity and common usage
 */
export const BIBLE_TRANSLATIONS: BibleTranslation[] = [
  {
    name: 'ESV',
    fullName: 'English Standard Version',
    id: 59,
    code: 'ESV',
  },
  {
    name: 'NIV',
    fullName: 'New International Version',
    id: 111,
    code: 'NIV',
  },
  {
    name: 'NLT',
    fullName: 'New Living Translation',
    id: 116,
    code: 'NLT',
  },
  {
    name: 'KJV',
    fullName: 'King James Version',
    id: 1,
    code: 'KJV',
  },
  {
    name: 'NKJV',
    fullName: 'New King James Version',
    id: 114,
    code: 'NKJV',
  },
  {
    name: 'NASB',
    fullName: 'New American Standard Bible',
    id: 2692,
    code: 'NASB',
  },
  {
    name: 'CSB',
    fullName: 'Christian Standard Bible',
    id: 1713,
    code: 'CSB',
  },
  {
    name: 'MSG',
    fullName: 'The Message',
    id: 97,
    code: 'MSG',
  },
  {
    name: 'AMP',
    fullName: 'Amplified Bible',
    id: 1588,
    code: 'AMP',
  },
  {
    name: 'HCSB',
    fullName: 'Holman Christian Standard Bible',
    id: 72,
    code: 'HCSB',
  },
  {
    name: 'LSB',
    fullName: 'Legacy Standard Bible',
    id: 3345,
    code: 'LSB',
  },
  {
    name: 'NRSV',
    fullName: 'New Revised Standard Version - Updated Edition',
    id: 3523,
    code: 'NRSV',
  },
  {
    name: 'GNT',
    fullName: 'Good News Translation',
    id: 68,
    code: 'GNT',
  },
  {
    name: 'CEV',
    fullName: 'Contemporary English Version',
    id: 392,
    code: 'CEV',
  },
  {
    name: 'CEB',
    fullName: 'Common English Bible',
    id: 37,
    code: 'CEB',
  },
  {
    name: 'NET',
    fullName: 'New English Translation',
    id: 107,
    code: 'NET',
  },
  {
    name: 'BSB',
    fullName: 'Berean Standard Bible',
    id: 3034,
    code: 'BSB',
  },
  {
    name: 'TPT',
    fullName: 'The Passion Translation',
    id: 1849,
    code: 'TPT',
  },
  {
    name: 'NIrV',
    fullName: "New International Reader's Version",
    id: 110,
    code: 'NIrV',
  },
  {
    name: 'ASV',
    fullName: 'American Standard Version',
    id: 12,
    code: 'ASV',
  },
];

/**
 * Get translation by ID
 * @param id - Bible.com version ID
 * @returns BibleTranslation if found, undefined otherwise
 */
export const getTranslationById = (id: number): BibleTranslation | undefined => {
  return BIBLE_TRANSLATIONS.find(t => t.id === id);
};

/**
 * Get translation by code
 * @param code - Translation code (e.g., "ESV", "NIV")
 * @returns BibleTranslation if found, undefined otherwise
 */
export const getTranslationByCode = (code: string): BibleTranslation | undefined => {
  return BIBLE_TRANSLATIONS.find(t => t.code === code);
};

