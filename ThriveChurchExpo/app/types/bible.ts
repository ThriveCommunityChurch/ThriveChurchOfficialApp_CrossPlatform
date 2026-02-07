/**
 * Bible Types
 * Data models for Bible feature
 */

export interface BibleBook {
  name: string;
  slug: string;
  chapters: number;
  testament: 'old' | 'new';
}

export type BibleOrderType = 'traditional' | 'alphabetical';

export interface BibleBookSelection {
  book: BibleBook;
  orderType: BibleOrderType;
}

/**
 * ESV API HTML Response
 */
export interface ESVHtmlResponse {
  query: string;
  canonical: string;
  parsed: number[][];
  passage_meta: ESVPassageMeta[];
  passages: string[];
}

export interface ESVPassageMeta {
  canonical: string;
  chapter_start: number[];
  chapter_end: number[];
  prev_verse?: number;
  next_verse?: number;
  prev_chapter?: number[];
  next_chapter?: number[];
}

