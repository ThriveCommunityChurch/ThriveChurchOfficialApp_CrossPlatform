/**
 * Download Queue Store
 * Zustand store for managing download queue state
 * Supports persistence, pause/resume, and progress tracking
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SermonMessage } from '../types/api';

// Queue item status types
export type QueueItemStatus =
  | 'queued'      // Waiting to be downloaded
  | 'downloading' // Currently downloading
  | 'paused'      // User paused or network unavailable
  | 'completed'   // Successfully downloaded
  | 'failed';     // Failed (will retry)

// Queue item interface
export interface QueueItem {
  id: string;                   // Unique queue item ID (usually messageId)
  messageId: string;            // Sermon message ID
  audioUrl: string;             // URL to download
  title: string;                // Sermon title
  seriesTitle: string;          // Series name
  seriesArt?: string;           // Series thumbnail URL
  message: SermonMessage;       // Full message object for metadata
  status: QueueItemStatus;
  progress: number;             // 0-100
  downloadedBytes: number;
  totalBytes: number;
  addedAt: number;              // Timestamp when added to queue
  startedAt?: number;           // Timestamp when download started
  completedAt?: number;         // Timestamp when completed
  error?: string;               // Error message if failed
  retryCount: number;           // Number of retry attempts
  resumableUri?: string;        // URI for resuming download
}

// Store state interface
interface DownloadQueueState {
  // Data
  items: QueueItem[];
  isProcessing: boolean;        // True when actively processing queue
  isPaused: boolean;            // True when all downloads paused

  // Queue actions
  addToQueue: (item: Omit<QueueItem, 'id' | 'status' | 'progress' | 'downloadedBytes' | 'totalBytes' | 'addedAt' | 'retryCount'>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  clearCompleted: () => void;

  // Item actions
  pauseItem: (id: string) => void;
  resumeItem: (id: string) => void;
  retryItem: (id: string) => void;
  cancelItem: (id: string) => void;

  // Progress updates
  updateProgress: (id: string, progress: number, downloadedBytes: number, totalBytes: number) => void;
  setItemStatus: (id: string, status: QueueItemStatus, error?: string) => void;
  setResumableUri: (id: string, uri: string) => void;

  // Processing controls
  setProcessing: (isProcessing: boolean) => void;
  pauseAll: () => void;
  resumeAll: () => void;

  // Queue operations
  moveToFront: (id: string) => void;
  getNextPendingItem: () => QueueItem | undefined;
  isInQueue: (messageId: string) => boolean;
}

export const useDownloadQueueStore = create<DownloadQueueState>()(
  persist(
    (set, get) => ({
      items: [],
      isProcessing: false,
      isPaused: false,

      // Add item to queue
      addToQueue: (item) => {
        const id = item.messageId;
        const existingItem = get().items.find((i) => i.messageId === item.messageId);
        if (existingItem) {
          console.log(`Item ${id} already in queue`);
          return;
        }

        const newItem: QueueItem = {
          ...item,
          id,
          status: 'queued',
          progress: 0,
          downloadedBytes: 0,
          totalBytes: 0,
          addedAt: Date.now(),
          retryCount: 0,
        };

        set((state) => ({
          items: [...state.items, newItem],
        }));
      },

      // Remove item from queue
      removeFromQueue: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      // Clear entire queue
      clearQueue: () => {
        set({ items: [] });
      },

      // Clear completed items
      clearCompleted: () => {
        set((state) => ({
          items: state.items.filter((item) => item.status !== 'completed'),
        }));
      },

      // Pause single item
      pauseItem: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && (item.status === 'downloading' || item.status === 'queued')
              ? { ...item, status: 'paused' as QueueItemStatus }
              : item
          ),
        }));
      },

      // Resume single item
      resumeItem: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && item.status === 'paused'
              ? { ...item, status: 'queued' as QueueItemStatus }
              : item
          ),
        }));
      },

      // Retry failed item
      retryItem: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && item.status === 'failed'
              ? { ...item, status: 'queued' as QueueItemStatus, error: undefined, retryCount: item.retryCount + 1 }
              : item
          ),
        }));
      },

      // Cancel item (remove from queue)
      cancelItem: (id) => {
        get().removeFromQueue(id);
      },

      // Update download progress
      updateProgress: (id, progress, downloadedBytes, totalBytes) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, progress, downloadedBytes, totalBytes }
              : item
          ),
        }));
      },

      // Set item status
      setItemStatus: (id, status, error) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;

            const updates: Partial<QueueItem> = { status };

            if (status === 'downloading' && !item.startedAt) {
              updates.startedAt = Date.now();
            }

            if (status === 'completed') {
              updates.completedAt = Date.now();
              updates.progress = 100;
            }

            if (status === 'failed') {
              updates.error = error;
            }

            return { ...item, ...updates };
          }),
        }));
      },

      // Set resumable URI for pause/resume
      setResumableUri: (id, uri) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, resumableUri: uri } : item
          ),
        }));
      },

      // Set processing state
      setProcessing: (isProcessing) => {
        set({ isProcessing });
      },

      // Pause all downloads
      pauseAll: () => {
        set((state) => ({
          isPaused: true,
          items: state.items.map((item) =>
            item.status === 'downloading' || item.status === 'queued'
              ? { ...item, status: 'paused' as QueueItemStatus }
              : item
          ),
        }));
      },

      // Resume all paused downloads
      resumeAll: () => {
        set((state) => ({
          isPaused: false,
          items: state.items.map((item) =>
            item.status === 'paused'
              ? { ...item, status: 'queued' as QueueItemStatus }
              : item
          ),
        }));
      },

      // Move item to front of queue
      moveToFront: (id) => {
        set((state) => {
          const item = state.items.find((i) => i.id === id);
          if (!item) return state;

          const otherItems = state.items.filter((i) => i.id !== id);
          return { items: [item, ...otherItems] };
        });
      },

      // Get next item to process
      getNextPendingItem: () => {
        const { items, isPaused } = get();
        if (isPaused) return undefined;

        return items.find((item) => item.status === 'queued');
      },

      // Check if message is in queue
      isInQueue: (messageId) => {
        return get().items.some((item) => item.messageId === messageId);
      },
    }),
    {
      name: 'download-queue-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist items and isPaused - not processing state
      partialize: (state) => ({
        items: state.items,
        isPaused: state.isPaused,
      }),
    }
  )
);

// Selector functions for convenience
export const selectQueuedItems = (state: DownloadQueueState) =>
  state.items.filter((item) => item.status === 'queued');

export const selectActiveDownload = (state: DownloadQueueState) =>
  state.items.find((item) => item.status === 'downloading');

export const selectCompletedItems = (state: DownloadQueueState) =>
  state.items.filter((item) => item.status === 'completed');

export const selectFailedItems = (state: DownloadQueueState) =>
  state.items.filter((item) => item.status === 'failed');

export const selectPausedItems = (state: DownloadQueueState) =>
  state.items.filter((item) => item.status === 'paused');

export const selectPendingItems = (state: DownloadQueueState) =>
  state.items.filter((item) => item.status === 'queued' || item.status === 'paused' || item.status === 'downloading');

export const selectQueueStats = (state: DownloadQueueState) => ({
  total: state.items.length,
  queued: state.items.filter((item) => item.status === 'queued').length,
  downloading: state.items.filter((item) => item.status === 'downloading').length,
  paused: state.items.filter((item) => item.status === 'paused').length,
  completed: state.items.filter((item) => item.status === 'completed').length,
  failed: state.items.filter((item) => item.status === 'failed').length,
});

