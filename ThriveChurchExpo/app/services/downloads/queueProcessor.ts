/**
 * Queue Processor Service
 * Handles sequential download processing with network awareness
 * and retry logic.
 */

import * as FileSystem from 'expo-file-system/legacy';
import { useDownloadQueueStore, QueueItem } from '../../stores/downloadQueueStore';
import { subscribeToNetworkChanges, canDownloadNow, getNetworkStatus, NetworkStatus } from './networkMonitor';
import { getDownloadSettings, getStorageLimitInfo } from './downloadSettings';
import {
  ensureDownloadDirectory,
  getDownloadPath,
  getTotalDownloadsSize,
  formatBytes,
} from './downloadManager';
import { saveDownloadedMessage } from '../storage/storage';
import type { SermonMessage } from '../../types/api';
import {
  logDownloadQueueAdd,
  logDownloadComplete,
  logDownloadFailed,
  DownloadEventParams,
} from '../analytics/analyticsService';

// Constants
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;
const SSL_RETRY_DELAY_MS = 5000;
const PROCESS_INTERVAL_MS = 1000;

// Network/SSL errors that should trigger retry with file deletion
const RETRYABLE_ERRORS = [
  'SSL',
  'ssl',
  'DECRYPTION_FAILED',
  'BAD_RECORD_MAC',
  'Connection reset',
  'network',
  'ECONNRESET',
  'ETIMEDOUT',
  'ENOTFOUND',
  'socket hang up',
];

/**
 * Helper to build analytics params from current network/settings state
 */
const getAnalyticsParams = async (messageId: string, seriesId?: string, fileSize?: number): Promise<DownloadEventParams> => {
  const networkStatus = getNetworkStatus();
  const settings = await getDownloadSettings();

  let networkType: 'wifi' | 'cellular' | 'unknown' = 'unknown';
  if (networkStatus.isWifi) {
    networkType = 'wifi';
  } else if (networkStatus.isCellular) {
    networkType = 'cellular';
  }

  return {
    messageId,
    seriesId,
    networkType,
    wifiOnlySetting: settings.wifiOnly,
    fileSize,
  };
};

// State
let isInitialized = false;
let unsubscribeNetwork: (() => void) | null = null;
let processInterval: ReturnType<typeof setInterval> | null = null;
let currentDownload: FileSystem.DownloadResumable | null = null;
let currentDownloadId: string | null = null;

/**
 * Initialize the queue processor
 */
export const startQueueProcessor = async (): Promise<void> => {
  if (isInitialized) {
    console.log('Queue processor already initialized');
    return;
  }

  console.log('Starting queue processor...');

  // Ensure download directory exists
  await ensureDownloadDirectory();

  // Subscribe to network changes
  unsubscribeNetwork = subscribeToNetworkChanges(handleNetworkChange);

  // Start processing interval
  processInterval = setInterval(processQueue, PROCESS_INTERVAL_MS);

  isInitialized = true;
  console.log('Queue processor started');
};

/**
 * Stop the queue processor
 */
export const stopQueueProcessor = (): void => {
  if (unsubscribeNetwork) {
    unsubscribeNetwork();
    unsubscribeNetwork = null;
  }

  if (processInterval) {
    clearInterval(processInterval);
    processInterval = null;
  }

  // Cancel any active download
  if (currentDownload && currentDownloadId) {
    pauseCurrentDownload();
  }

  isInitialized = false;
  console.log('Queue processor stopped');
};

/**
 * Handle network status changes
 */
const handleNetworkChange = (status: NetworkStatus): void => {
  const store = useDownloadQueueStore.getState();

  if (!status.canDownload) {
    // Network changed to unavailable for downloads
    console.log('Network unavailable for downloads, pausing...');
    
    // Pause current download if active
    if (currentDownload && currentDownloadId) {
      pauseCurrentDownload();
    }
    
    // Pause all queued items
    store.pauseAll();
  } else if (store.isPaused && status.canDownload) {
    // Network became available and downloads were paused
    console.log('Network available, resuming downloads...');
    store.resumeAll();
  }
};

/**
 * Process the queue - called on interval
 */
const processQueue = async (): Promise<void> => {
  const store = useDownloadQueueStore.getState();

  // Skip if already processing or paused
  if (store.isProcessing || store.isPaused) {
    return;
  }

  // Get next item to process
  const nextItem = store.getNextPendingItem();
  if (!nextItem) {
    return;
  }

  // Check if we can download
  const { allowed, reason } = await canDownloadNow();
  if (!allowed) {
    console.log('Cannot download:', reason);
    return;
  }

  // Check storage limit
  const canProceed = await checkStorageLimit(nextItem);
  if (!canProceed) {
    return;
  }

  // Start downloading
  store.setProcessing(true);
  await downloadItem(nextItem);
  store.setProcessing(false);
};

/**
 * Check if download would exceed storage limit
 */
const checkStorageLimit = async (item: QueueItem): Promise<boolean> => {
  const { enabled, limit } = await getStorageLimitInfo();

  if (!enabled) {
    return true;
  }

  const currentUsage = await getTotalDownloadsSize();

  // Estimate file size (use totalBytes if available, otherwise assume ~50MB)
  const estimatedSize = item.totalBytes || 50 * 1024 * 1024;

  if (currentUsage + estimatedSize > limit) {
    console.log(`Storage limit would be exceeded: ${formatBytes(currentUsage)} + ${formatBytes(estimatedSize)} > ${formatBytes(limit)}`);
    
    const store = useDownloadQueueStore.getState();
    store.setItemStatus(item.id, 'failed', 'Storage limit reached');
    
    return false;
  }

  return true;
};

/**
 * Download a queue item
 */
const downloadItem = async (item: QueueItem): Promise<void> => {
  const store = useDownloadQueueStore.getState();

  try {
    // Update status to downloading
    store.setItemStatus(item.id, 'downloading');
    currentDownloadId = item.id;

    const downloadPath = getDownloadPath(item.messageId);

    // Create download resumable
    currentDownload = FileSystem.createDownloadResumable(
      item.audioUrl,
      downloadPath,
      {},
      (progress) => {
        const percent = Math.round(
          (progress.totalBytesWritten / progress.totalBytesExpectedToWrite) * 100
        );
        store.updateProgress(
          item.id,
          percent,
          progress.totalBytesWritten,
          progress.totalBytesExpectedToWrite
        );
      }
    );

    // Execute download
    const result = await currentDownload.downloadAsync();

    if (result && result.uri) {
      console.log('Download completed:', item.title);

      // Get file size
      const fileInfo = await FileSystem.getInfoAsync(downloadPath);
      const fileSize = fileInfo.exists ? fileInfo.size || 0 : 0;

      // Create downloaded message
      const downloadedMessage: SermonMessage = {
        ...item.message,
        LocalAudioURI: downloadPath,
        DownloadedOn: Date.now(),
        AudioFileSize: fileSize,
        seriesTitle: item.seriesTitle,
        seriesArt: item.seriesArt,
      };

      // Save to storage
      await saveDownloadedMessage(downloadedMessage);

      // Update queue item status
      store.setItemStatus(item.id, 'completed');

      // Track download complete analytics
      const analyticsParams = await getAnalyticsParams(
        item.messageId,
        item.message.SeriesId,
        fileSize
      );
      logDownloadComplete(analyticsParams);

      // Clear after completion
      setTimeout(() => {
        store.removeFromQueue(item.id);
      }, 3000);
    } else {
      throw new Error('Download failed - no result URI');
    }
  } catch (error) {
    console.error('Error downloading item:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if it was cancelled/paused
    if (errorMessage.includes('cancelled') || errorMessage.includes('paused')) {
      return;
    }

    // Check if this is a retryable network/SSL error
    const isRetryableError = RETRYABLE_ERRORS.some(err => errorMessage.includes(err));

    // For SSL/network errors, delete the partial file to start fresh
    if (isRetryableError) {
      try {
        const downloadPath = getDownloadPath(item.messageId);
        const fileInfo = await FileSystem.getInfoAsync(downloadPath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(downloadPath, { idempotent: true });
          console.log('Deleted partial file for retry:', downloadPath);
        }
      } catch (deleteError) {
        console.warn('Could not delete partial file:', deleteError);
      }
    }

    // Handle retry logic
    if (item.retryCount < MAX_RETRIES) {
      const retryDelay = isRetryableError ? SSL_RETRY_DELAY_MS : RETRY_DELAY_MS;
      console.log(`Retrying download (${item.retryCount + 1}/${MAX_RETRIES}) after ${retryDelay}ms...`);
      store.retryItem(item.id);

      // Delay before retry (longer for SSL errors)
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    } else {
      // Track download failed analytics (only on final failure)
      const analyticsParams = await getAnalyticsParams(item.messageId, item.message.SeriesId);
      logDownloadFailed(analyticsParams, errorMessage);

      store.setItemStatus(item.id, 'failed', `Failed after ${MAX_RETRIES} attempts: ${errorMessage}`);
    }
  } finally {
    currentDownload = null;
    currentDownloadId = null;
  }
};

/**
 * Pause the current download
 */
export const pauseCurrentDownload = async (): Promise<void> => {
  if (!currentDownload || !currentDownloadId) {
    return;
  }

  try {
    const savable = await currentDownload.pauseAsync();
    const store = useDownloadQueueStore.getState();

    // Save resumable URI for later
    if (savable) {
      store.setResumableUri(currentDownloadId, JSON.stringify(savable));
    }

    store.setItemStatus(currentDownloadId, 'paused');
    console.log('Download paused:', currentDownloadId);
  } catch (error) {
    console.error('Error pausing download:', error);
  }

  currentDownload = null;
  currentDownloadId = null;
};

/**
 * Resume a paused download
 */
export const resumeDownload = async (id: string): Promise<void> => {
  const store = useDownloadQueueStore.getState();
  const item = store.items.find((i) => i.id === id);

  if (!item || item.status !== 'paused') {
    console.log('Cannot resume - item not found or not paused');
    return;
  }

  // Resume the item (change status to queued)
  store.resumeItem(id);
};

/**
 * Queue a sermon for download
 * Convenience function to add a sermon to the queue
 */
export const queueSermonDownload = async (
  message: SermonMessage,
  seriesTitle?: string,
  seriesArt?: string
): Promise<void> => {
  if (!message.AudioUrl) {
    console.error('Cannot queue download - no audio URL');
    return;
  }

  const store = useDownloadQueueStore.getState();

  // If this message is already in the queue, decide whether to retry or skip
  const existingItem = store.items.find((item) => item.messageId === message.MessageId);
  if (existingItem) {
    if (existingItem.status === 'failed') {
      // Allow a manual retry of a previously failed download
      store.retryItem(existingItem.id);
      console.log('Retrying failed download for message:', message.MessageId);
    } else {
      // For queued/downloading/paused/completed items, do not enqueue again
      console.log('Message already in queue:', message.MessageId);
    }
    return;
  }

  store.addToQueue({
    messageId: message.MessageId,
    audioUrl: message.AudioUrl,
    title: message.Title,
    seriesTitle: seriesTitle || '',
    seriesArt: seriesArt,
    message,
  });

  // Track download queue add analytics
  const analyticsParams = await getAnalyticsParams(message.MessageId, message.SeriesId);
  logDownloadQueueAdd(analyticsParams);

  console.log('Added to download queue:', message.Title);
};

/**
 * Queue multiple sermons for download (e.g., entire series)
 */
export const queueSeriesDownload = (
  messages: SermonMessage[],
  seriesTitle: string,
  seriesArt?: string
): void => {
  const store = useDownloadQueueStore.getState();

  messages.forEach((message) => {
    if (message.AudioUrl && !store.isInQueue(message.MessageId)) {
      store.addToQueue({
        messageId: message.MessageId,
        audioUrl: message.AudioUrl,
        title: message.Title,
        seriesTitle,
        seriesArt,
        message,
      });
    }
  });

  console.log(`Queued ${messages.length} sermons from series: ${seriesTitle}`);
};

