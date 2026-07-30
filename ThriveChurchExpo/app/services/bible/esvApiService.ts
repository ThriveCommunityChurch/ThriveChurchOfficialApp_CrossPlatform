/**
 * ESV API Service
 *
 * Provides access to the ESV Bible text through Crossway's ESV API.
 * Requires an API key from https://api.esv.org/
 *
 * Note: The ESV API is free for non-commercial use with reasonable rate limits.
 * API key is loaded from centralized credentials configuration.
 */

import i18next from 'i18next';
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
  private readonly fishApiKey: string;

  constructor() {
    // Load API keys from centralized credentials configuration
    this.apiKey = apiConfig.esvApiKey || 'DEMO_KEY';
    this.fishApiKey = apiConfig.fishApiKey || '';
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
        error: i18next.t('esvApi.noReferenceProvided'),
      };
    }

    // If no API key is configured, return a helpful message
    if (this.apiKey === 'DEMO_KEY') {
      return {
        reference,
        canonical: reference,
        text: '',
        error: i18next.t('esvApi.apiKeyNotConfigured'),
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
          error: i18next.t('esvApi.noPassageFound'),
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

      let errorMessage = i18next.t('esvApi.fetchFailed');
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
    * Get audio URL for a Bible passage using Fish Audio TTS with streaming
    * @param reference - Bible reference (e.g., "John 3:16", "Genesis 1:1-3")
    * @returns Promise<string> - URL to audio blob object
    */
   async getAudioUrl(reference: string): Promise<string> {
     if (!reference || reference.trim() === '') {
       throw new Error('No passage reference provided');
     }

     // First, get the passage text from ESV API
     const passage = await this.getPassage(reference);
     if (passage.error) {
       throw new Error(passage.error);
     }

     const text = passage.text;
     if (!text) {
       throw new Error('No text found for passage');
     }

     // If Fish API key is not configured, throw an error
     if (!this.fishApiKey) {
       throw new Error('Fish API key not configured');
     }

try {
        const response = await fetch('https://api.fish.audio/v1/tts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.fishApiKey}`,
            'Content-Type': 'application/json',
            model: 's2.1-pro-free',
          },
          body: JSON.stringify({
            text: text,
            // We need a reference_id for the voice. We can use a default one or make it configurable.
            // For now, we'll use a placeholder. In production, we should allow voice selection.
            reference_id: 'e3cd384158934cc9a01029cd7d278634', // Updated voice reference_id
            format: 'mp3',
          }),
        });

       if (!response.ok) {
         // Try to get error message from response
         let errorMessage = `Fish API error: ${response.status}`;
         try {
           const errorData = await response.json();
           if (errorData.message) {
             errorMessage = `Fish API error: ${errorData.message}`;
           }
         } catch (e) {
           // Ignore
         }
         throw new Error(errorMessage);
       }

       // Handle streaming response - read chunks as they arrive
       const reader = response.body?.getReader();
       if (!reader) {
         throw new Error('Response body is not readable');
       }

       const chunks: Uint8Array[] = [];
       let done = false;

       while (!done) {
         const { value, done: doneReading } = await reader.read();
         done = doneReading;
         if (value) {
           chunks.push(value);
         }
       }

// Concatenate all chunks
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        if (totalLength === 0) {
          throw new Error('Received empty audio response from Fish API');
        }
        const result = new Uint8Array(totalLength);
        let position = 0;
        for (const chunk of chunks) {
          result.set(chunk, position);
          position += chunk.length;
        }

        // Create blob URL from the concatenated audio data
        const blob = new Blob([result], { type: 'audio/mpeg' });
        return URL.createObjectURL(blob);
     } catch (error) {
       console.error('Fish Audio TTS Error:', error);
       throw error;
     }
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

/**
     * Check if Fish API key is configured
     * @returns boolean
     */
    hasFishApiKey(): boolean {
      return !!this.fishApiKey;
    }

  /**
   * Fetch a Bible chapter as HTML from the ESV API
   * Optimized for WebView display with cross-references, headings, and verse numbers
   * @param book - Book name (e.g., "Genesis", "John")
   * @param chapter - Chapter number
   * @returns Promise with HTML content and metadata
   */
  async getChapterHtml(book: string, chapter: number): Promise<{
    html: string;
    canonical: string;
    prevChapter: number[] | null;
    nextChapter: number[] | null;
    error?: string;
  }> {
    const reference = `${book} ${chapter}`;

    if (this.apiKey === 'DEMO_KEY') {
      return {
        html: '',
        canonical: reference,
        prevChapter: null,
        nextChapter: null,
        error: i18next.t('esvApi.apiKeyNotConfigured'),
      };
    }

    try {
      const url = new URL(`${this.baseUrl}/passage/html/`);
      url.searchParams.append('q', reference);

      // Configure HTML formatting for WebView display
      url.searchParams.append('include-passage-references', 'false'); // We show in nav header
      url.searchParams.append('include-verse-numbers', 'true');
      url.searchParams.append('include-first-verse-numbers', 'false'); // Don't show :1 after chapter
      url.searchParams.append('include-footnotes', 'false'); // Keep it clean
      url.searchParams.append('include-footnote-body', 'false');
      url.searchParams.append('include-headings', 'true');
      url.searchParams.append('include-short-copyright', 'false');
      url.searchParams.append('include-chapter-numbers', 'true');
      url.searchParams.append('include-crossrefs', 'true'); // Cross-references!
      url.searchParams.append('include-subheadings', 'true');
      url.searchParams.append('include-verse-anchors', 'true');
      url.searchParams.append('include-audio-link', 'false'); // We handle audio ourselves
      url.searchParams.append('include-css-link', 'false'); // We provide our own CSS
      url.searchParams.append('inline-styles', 'false'); // We provide our own CSS
      url.searchParams.append('wrapping-div', 'true');
      url.searchParams.append('div-classes', 'esv-text');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid ESV API key');
        } else if (response.status === 400) {
          const errorData: ESVApiError = await response.json();
          throw new Error(errorData.detail || 'Invalid passage reference');
        } else {
          throw new Error(`ESV API error: ${response.status}`);
        }
      }

      const data: ESVPassageResponse = await response.json();

      if (!data.passages || data.passages.length === 0) {
        return {
          html: '',
          canonical: data.canonical || reference,
          prevChapter: null,
          nextChapter: null,
          error: i18next.t('esvApi.noPassageFound'),
        };
      }

      const meta = data.passage_meta[0];

      return {
        html: data.passages[0],
        canonical: data.canonical,
        prevChapter: meta?.prev_chapter || null,
        nextChapter: meta?.next_chapter || null,
      };

    } catch (error) {
      console.error('ESV API HTML Error:', error);

      let errorMessage = i18next.t('esvApi.fetchFailed');
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return {
        html: '',
        canonical: reference,
        prevChapter: null,
        nextChapter: null,
        error: errorMessage,
      };
    }
  }

  /**
   * Fetch any Bible passage as HTML (for cross-reference navigation)
   * @param reference - Bible reference (e.g., "John 3:16", "Genesis 1:1-3")
   * @returns Promise with HTML content and metadata
   */
  async getPassageHtml(reference: string): Promise<{
    html: string;
    canonical: string;
    error?: string;
  }> {
    if (!reference || reference.trim() === '') {
      return {
        html: '',
        canonical: '',
        error: i18next.t('esvApi.noReferenceProvided'),
      };
    }

    if (this.apiKey === 'DEMO_KEY') {
      return {
        html: '',
        canonical: reference,
        error: i18next.t('esvApi.apiKeyNotConfigured'),
      };
    }

    try {
      const url = new URL(`${this.baseUrl}/passage/html/`);
      url.searchParams.append('q', reference);

      // Configure for cross-ref display (simpler than full chapter)
      url.searchParams.append('include-passage-references', 'true');
      url.searchParams.append('include-verse-numbers', 'true');
      url.searchParams.append('include-footnotes', 'false');
      url.searchParams.append('include-headings', 'true');
      url.searchParams.append('include-short-copyright', 'true');
      url.searchParams.append('include-crossrefs', 'true');
      url.searchParams.append('include-css-link', 'false');
      url.searchParams.append('inline-styles', 'false');
      url.searchParams.append('wrapping-div', 'true');
      url.searchParams.append('div-classes', 'esv-text');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ESV API error: ${response.status}`);
      }

      const data: ESVPassageResponse = await response.json();

      if (!data.passages || data.passages.length === 0) {
        return {
          html: '',
          canonical: data.canonical || reference,
          error: i18next.t('esvApi.noPassageFound'),
        };
      }

      return {
        html: data.passages[0],
        canonical: data.canonical,
      };

    } catch (error) {
      console.error('ESV API Passage HTML Error:', error);

      return {
        html: '',
        canonical: reference,
        error: error instanceof Error ? error.message : i18next.t('esvApi.fetchFailed'),
      };
    }
  }
}

// Export singleton instance
export const esvApiService = new ESVApiService();
export default esvApiService;
