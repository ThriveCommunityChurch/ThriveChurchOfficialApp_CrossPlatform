/**
 * Bible Types
 * Data models for Bible feature
 */

export interface BibleBook {
  name: string;
  slug: string;
}

export type BibleOrderType = 'traditional' | 'alphabetical';

export interface BibleBookSelection {
  book: BibleBook;
  orderType: BibleOrderType;
}

