/**
 * Notes Types
 * Data models for Notes feature
 */

export interface Note {
  id: string;
  content: string;
  createdAt: number; // epoch milliseconds
  updatedAt: number; // epoch milliseconds
}

export interface NotesState {
  notes: Note[];
}

