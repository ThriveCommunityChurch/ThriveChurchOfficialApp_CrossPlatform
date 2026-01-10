/**
 * Notes Types
 * Data models for Notes feature
 */

/**
 * General note (not linked to a sermon)
 */
export interface Note {
  id: string;
  /** Optional user-defined title for the note */
  title?: string;
  content: string;
  createdAt: number; // epoch milliseconds
  updatedAt: number; // epoch milliseconds
}

/**
 * Sermon-linked note - a note associated with a specific sermon message
 */
export interface SermonNote {
  /** Unique note ID */
  id: string;
  /** The sermon message ID this note is linked to */
  messageId: string;
  /** The series ID the sermon belongs to */
  seriesId?: string;
  /** Title of the sermon message */
  messageTitle: string;
  /** Title of the series */
  seriesTitle?: string;
  /** URL to series artwork */
  seriesArt?: string;
  /** Speaker name */
  speaker: string;
  /** Original sermon date */
  messageDate: string;
  /** Note content (rich text / markdown) */
  content: string;
  /** When the note was created (epoch milliseconds) */
  createdAt: number;
  /** When the note was last updated (epoch milliseconds) */
  updatedAt: number;
}

export interface NotesState {
  notes: Note[];
}

export interface SermonNotesState {
  sermonNotes: SermonNote[];
}
