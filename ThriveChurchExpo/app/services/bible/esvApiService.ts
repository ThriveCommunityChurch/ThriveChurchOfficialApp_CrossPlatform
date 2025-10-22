/**
 * ESV API Service
 *
 * Provides access to the ESV Bible text through Crossway's ESV API.
 * Requires an API key from https://api.esv.org/
 *
 * Note: The ESV API is free for non-commercial use with reasonable rate limits.
 * API key is loaded from centralized credentials configuration.
 */

import { apiConfig } from '../../config/app.config';

interface ESVPassageResponse {
  query: string;
  canonical: string;
  parsed: number[][];
  passage_meta: Array<{
    canonical: string;
    chapter_start: number[];
    chapter_end: number[];
    prev_verse?: number;
    next_verse?: number;
    prev_chapter?: number[];
    next_chapter?: number[];
  }>;
  passages: string[];
}

interface ESVApiError {
  detail: string;
}

export interface BiblePassage {
  reference: string;
  canonical: string;
  text: string;
  error?: string;
}

class ESVApiService {
  private readonly baseUrl = 'https://api.esv.org/v3';
  private readonly apiKey: string;

  constructor() {
    // Load API key from centralized credentials configuration
    this.apiKey = apiConfig.esvApiKey || 'DEMO_KEY';
  }

  /**
   * Fetch a Bible passage from the ESV API
   * @param reference - Bible reference (e.g., "John 3:16", "Genesis 1:1-3", "Psalm 23")
   * @returns Promise<BiblePassage>
   */
  async getPassage(reference: string): Promise<BiblePassage> {
    if (!reference || reference.trim() === '') {
      return {
        reference: '',
        canonical: '',
        text: '',
        error: 'No passage reference provided',
      };
    }

    // If no API key is configured, return a helpful message
    if (this.apiKey === 'DEMO_KEY') {
      return {
        reference,
        canonical: reference,
        text: '',
        error: 'ESV API key not configured. Please add your ESV API key to use Bible passage reading.',
      };
    }

    try {
      const url = new URL(`${this.baseUrl}/passage/text/`);
      url.searchParams.append('q', reference);
      
      // Configure text formatting for mobile display
      url.searchParams.append('include-passage-references', 'true');
      url.searchParams.append('include-verse-numbers', 'true');
      url.searchParams.append('include-first-verse-numbers', 'true');
      url.searchParams.append('include-footnotes', 'false'); // Disable footnotes for cleaner mobile display
      url.searchParams.append('include-footnote-body', 'false');
      url.searchParams.append('include-headings', 'true');
      url.searchParams.append('include-short-copyright', 'true');
      url.searchParams.append('include-selahs', 'true');
      url.searchParams.append('line-length', '0'); // No line wrapping, let mobile handle it

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid ESV API key. Please check your API key configuration.');
        } else if (response.status === 400) {
          const errorData: ESVApiError = await response.json();
          throw new Error(errorData.detail || 'Invalid passage reference');
        } else {
          throw new Error(`ESV API error: ${response.status} ${response.statusText}`);
        }
      }

      const data: ESVPassageResponse = await response.json();

      if (!data.passages || data.passages.length === 0) {
        return {
          reference,
          canonical: data.canonical || reference,
          text: '',
          error: 'No passage text found for this reference',
        };
      }

      // Clean up the passage text
      const passageText = data.passages[0]
        .trim()
        .replace(/\n\s*\n/g, '\n\n') // Normalize line breaks
        .replace(/\s+/g, ' ') // Normalize spaces
        .trim();

      return {
        reference,
        canonical: data.canonical,
        text: passageText,
      };

    } catch (error) {
      console.error('ESV API Service Error:', error);
      
      let errorMessage = 'Failed to fetch Bible passage';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        reference,
        canonical: reference,
        text: '',
        error: errorMessage,
      };
    }
  }

  /**
   * Validate if a passage reference looks valid
   * @param reference - Bible reference to validate
   * @returns boolean
   */
  isValidReference(reference: string): boolean {
    if (!reference || reference.trim() === '') {
      return false;
    }

    // Basic validation for common Bible reference patterns
    const patterns = [
      /^\d?\s*[A-Za-z]+\s+\d+:\d+(-\d+)?$/, // John 3:16, 1 John 3:16-17
      /^\d?\s*[A-Za-z]+\s+\d+$/, // John 3, 1 John 3
      /^\d?\s*[A-Za-z]+\s+\d+-\d+$/, // John 3-4, 1 John 3-4
    ];

    return patterns.some(pattern => pattern.test(reference.trim()));
  }

  /**
   * Get API status and configuration info
   * @returns object with API status information
   */
  getApiStatus() {
    return {
      hasApiKey: this.apiKey !== 'DEMO_KEY',
      baseUrl: this.baseUrl,
      isConfigured: this.apiKey !== 'DEMO_KEY',
    };
  }
}

// Export singleton instance
export const esvApiService = new ESVApiService();
export default esvApiService;
