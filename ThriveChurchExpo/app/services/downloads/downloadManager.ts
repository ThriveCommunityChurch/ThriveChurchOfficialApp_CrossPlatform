import * as FileSystem from 'expo-file-system/legacy';
import { SermonMessage } from '../../types/api';
import {
  saveDownloadedMessage,
  removeDownloadedMessage,
  getDownloadedMessage,
  isMessageDownloaded,
  addToDownloadQueue,
  updateDownloadQueueItem,
  removeFromDownloadQueue,
  getDownloadQueue,
  DownloadQueueItem,
  getAllDownloadedMessages,
} from '../storage/storage';

// Download directory
const DOWNLOAD_DIR = `${FileSystem.documentDirectory}sermons/`;

// Ensure download directory exists
export const ensureDownloadDirectory = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DOWNLOAD_DIR, { intermediates: true });
      console.log('Download directory created:', DOWNLOAD_DIR);
    }
  } catch (error) {
    console.error('Error creating download directory:', error);
    throw error;
  }
};

// Get file path for a message
export const getDownloadPath = (messageId: string): string => {
  return `${DOWNLOAD_DIR}/${messageId}.mp3`;
};

// Download progress callback type
export type DownloadProgressCallback = (progress: number) => void;

// Download a sermon message
export const downloadSermon = async (
  message: SermonMessage,
  seriesTitle?: string,
  seriesArt?: string,
  onProgress?: DownloadProgressCallback
): Promise<string> => {
  try {
    // Ensure directory exists
    await ensureDownloadDirectory();

    // Check if already downloaded
    if (await isMessageDownloaded(message.MessageId)) {
      const existingMessage = await getDownloadedMessage(message.MessageId);
      if (existingMessage?.LocalAudioURI) {
        const fileInfo = await FileSystem.getInfoAsync(existingMessage.LocalAudioURI);
        if (fileInfo.exists) {
          console.log('Message already downloaded:', message.MessageId);
          return existingMessage.LocalAudioURI;
        }
      }
    }

    // Validate audio URL
    if (!message.AudioUrl) {
      throw new Error('No audio URL available for download');
    }

    const downloadPath = getDownloadPath(message.MessageId);

    // Add to download queue
    const queueItem: DownloadQueueItem = {
      messageId: message.MessageId,
      audioUrl: message.AudioUrl,
      title: message.Title,
      seriesTitle,
      seriesArt,
      status: 'downloading',
      progress: 0,
    };
    await addToDownloadQueue(queueItem);

    // Start download
    const downloadResumable = FileSystem.createDownloadResumable(
      message.AudioUrl,
      downloadPath,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;

        // Update queue item
        updateDownloadQueueItem(message.MessageId, {
          progress: progress * 100,
        });

        // Call progress callback
        if (onProgress) {
          onProgress(progress);
        }
      }
    );

    const downloadResult = await downloadResumable.downloadAsync();

    if (downloadResult && downloadResult.uri) {
      console.log('Download completed:', downloadPath);

      // Get the file size
      const fileInfo = await FileSystem.getInfoAsync(downloadPath);
      const fileSize = fileInfo.exists ? fileInfo.size || 0 : 0;

      // Update message with local URI, download timestamp, and file size
      const downloadedMessage: SermonMessage = {
        ...message,
        LocalAudioURI: downloadPath,
        DownloadedOn: Date.now(),
        AudioFileSize: fileSize,
        seriesTitle,
        seriesArt,
      };

      // Save to storage
      await saveDownloadedMessage(downloadedMessage);

      // Update queue item to completed
      await updateDownloadQueueItem(message.MessageId, {
        status: 'completed',
        progress: 100,
      });

      // Remove from queue after a delay
      setTimeout(async () => {
        await removeFromDownloadQueue(message.MessageId);
      }, 2000);

      return downloadPath;
    } else {
      throw new Error('Download failed');
    }
  } catch (error) {
    console.error('Error downloading sermon:', error);
    
    // Update queue item to failed
    await updateDownloadQueueItem(message.MessageId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    throw error;
  }
};

// Cancel a download
export const cancelDownload = async (messageId: string): Promise<void> => {
  try {
    const queue = await getDownloadQueue();
    const item = queue.find(q => q.messageId === messageId);

    if (item && item.status === 'downloading') {
      // Delete the partial file
      const downloadPath = getDownloadPath(messageId);
      const fileInfo = await FileSystem.getInfoAsync(downloadPath);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(downloadPath);
      }

      // Remove from queue
      await removeFromDownloadQueue(messageId);

      console.log('Download cancelled:', messageId);
    }
  } catch (error) {
    console.error('Error cancelling download:', error);
    throw error;
  }
};

// Delete a downloaded sermon
export const deleteDownload = async (messageId: string): Promise<void> => {
  try {
    const message = await getDownloadedMessage(messageId);

    if (message?.LocalAudioURI) {
      const fileInfo = await FileSystem.getInfoAsync(message.LocalAudioURI);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(message.LocalAudioURI);
        console.log('File deleted:', message.LocalAudioURI);
      }
    }

    // Remove from storage
    await removeDownloadedMessage(messageId);

    console.log('Download deleted:', messageId);
  } catch (error) {
    console.error('Error deleting download:', error);
    throw error;
  }
};

// Get download size
export const getDownloadSize = async (messageId: string): Promise<number> => {
  try {
    const message = await getDownloadedMessage(messageId);

    if (message?.LocalAudioURI) {
      const fileInfo = await FileSystem.getInfoAsync(message.LocalAudioURI);

      if (fileInfo.exists) {
        return fileInfo.size || 0;
      }
    }

    return 0;
  } catch (error) {
    console.error('Error getting download size:', error);
    return 0;
  }
};

// Get total downloads size
export const getTotalDownloadsSize = async (): Promise<number> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);

    if (!dirInfo.exists) {
      return 0;
    }

    const files = await FileSystem.readDirectoryAsync(DOWNLOAD_DIR);
    let totalSize = 0;

    for (const fileName of files) {
      const filePath = `${DOWNLOAD_DIR}${fileName}`;
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists && !fileInfo.isDirectory) {
        totalSize += fileInfo.size || 0;
      }
    }

    return totalSize;
  } catch (error) {
    console.error('Error getting total downloads size:', error);
    return 0;
  }
};

// Format bytes to human-readable size
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// Check if there's enough space for download
export const hasEnoughSpace = async (requiredBytes: number): Promise<boolean> => {
  try {
    const freeSpace = await FileSystem.getFreeDiskStorageAsync();
    return freeSpace > requiredBytes;
  } catch (error) {
    console.error('Error checking free space:', error);
    return false;
  }
};

// Clear all downloads
export const clearAllDownloads = async (): Promise<void> => {
  try {
    const dirInfo = await FileSystem.getInfoAsync(DOWNLOAD_DIR);

    if (dirInfo.exists) {
      await FileSystem.deleteAsync(DOWNLOAD_DIR);
      await ensureDownloadDirectory();
      // Also clear from storage
      const { clearDownloadedMessages } = await import('../storage/storage');
      await clearDownloadedMessages();
      console.log('All downloads cleared');
    }
  } catch (error) {
    console.error('Error clearing all downloads:', error);
    throw error;
  }
};

// Get downloads sorted by file size (largest first)
export const getDownloadsSortedBySize = async (): Promise<SermonMessage[]> => {
  try {
    const messages = await getAllDownloadedMessages();
    return messages.sort((a, b) => (b.AudioFileSize || 0) - (a.AudioFileSize || 0));
  } catch (error) {
    console.error('Error getting downloads sorted by size:', error);
    return [];
  }
};

// Get downloads sorted by date (oldest first)
export const getDownloadsSortedByDate = async (): Promise<SermonMessage[]> => {
  try {
    const messages = await getAllDownloadedMessages();
    return messages.sort((a, b) => (a.DownloadedOn || 0) - (b.DownloadedOn || 0));
  } catch (error) {
    console.error('Error getting downloads sorted by date:', error);
    return [];
  }
};

// Delete multiple downloads at once
export const deleteMultipleDownloads = async (messageIds: string[]): Promise<void> => {
  try {
    for (const messageId of messageIds) {
      await deleteDownload(messageId);
    }
    console.log(`Deleted ${messageIds.length} downloads`);
  } catch (error) {
    console.error('Error deleting multiple downloads:', error);
    throw error;
  }
};

// Free up space by deleting oldest downloads until under target size
export const freeUpSpace = async (targetSize: number): Promise<number> => {
  try {
    let currentSize = await getTotalDownloadsSize();
    let deletedCount = 0;

    if (currentSize <= targetSize) {
      return 0;
    }

    const sortedDownloads = await getDownloadsSortedByDate();

    for (const download of sortedDownloads) {
      if (currentSize <= targetSize) {
        break;
      }

      const fileSize = download.AudioFileSize || 0;
      await deleteDownload(download.MessageId);
      currentSize -= fileSize;
      deletedCount++;
    }

    console.log(`Freed up space by deleting ${deletedCount} downloads`);
    return deletedCount;
  } catch (error) {
    console.error('Error freeing up space:', error);
    throw error;
  }
};

// Get storage breakdown by series
interface SeriesBreakdown {
  seriesTitle: string;
  messageCount: number;
  totalSize: number;
  messages: SermonMessage[];
}

export const getStorageBreakdownBySeries = async (): Promise<SeriesBreakdown[]> => {
  try {
    const messages = await getAllDownloadedMessages();
    const seriesMap = new Map<string, SeriesBreakdown>();

    for (const message of messages) {
      const seriesTitle = message.seriesTitle || 'Unknown Series';

      if (!seriesMap.has(seriesTitle)) {
        seriesMap.set(seriesTitle, {
          seriesTitle,
          messageCount: 0,
          totalSize: 0,
          messages: [],
        });
      }

      const series = seriesMap.get(seriesTitle)!;
      series.messageCount++;
      series.totalSize += message.AudioFileSize || 0;
      series.messages.push(message);
    }

    // Sort by total size descending
    return Array.from(seriesMap.values()).sort((a, b) => b.totalSize - a.totalSize);
  } catch (error) {
    console.error('Error getting storage breakdown:', error);
    return [];
  }
};
