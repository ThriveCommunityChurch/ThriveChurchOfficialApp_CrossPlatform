import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

// Storage key for logs
const LOG_STORAGE_KEY = '@thrive_app_logs';

// Maximum number of log lines to keep (FIFO)
const MAX_LOG_LINES = 1000;

// Log levels
export enum LogLevel {
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
}

// Mutex for async-safe operations
let isWriting = false;
const writeQueue: (() => Promise<void>)[] = [];

/**
 * Process the write queue to ensure thread-safe operations
 */
const processWriteQueue = async (): Promise<void> => {
  if (isWriting || writeQueue.length === 0) {
    return;
  }

  isWriting = true;
  const operation = writeQueue.shift();
  
  if (operation) {
    try {
      await operation();
    } catch (error) {
      console.error('Error processing write queue:', error);
    }
  }

  isWriting = false;
  
  // Process next item in queue
  if (writeQueue.length > 0) {
    processWriteQueue();
  }
};

/**
 * Format timestamp in ISO 8601 format
 */
const formatTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Read logs from AsyncStorage
 */
const readLogs = async (): Promise<LogEntry[]> => {
  try {
    const logsJson = await AsyncStorage.getItem(LOG_STORAGE_KEY);
    if (!logsJson) {
      return [];
    }
    return JSON.parse(logsJson);
  } catch (error) {
    console.error('Error reading logs from storage:', error);
    return [];
  }
};

/**
 * Write logs to AsyncStorage with FIFO enforcement
 */
const writeLogs = async (logs: LogEntry[]): Promise<void> => {
  try {
    // Enforce FIFO - keep only the most recent MAX_LOG_LINES
    const trimmedLogs = logs.slice(-MAX_LOG_LINES);
    await AsyncStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error('Error writing logs to storage:', error);
    throw error;
  }
};

/**
 * Add a log entry (internal method with queue support)
 */
const addLogEntry = async (level: LogLevel, message: string): Promise<void> => {
  const operation = async () => {
    try {
      const logs = await readLogs();
      const newEntry: LogEntry = {
        timestamp: formatTimestamp(),
        level,
        message,
      };
      
      logs.push(newEntry);
      await writeLogs(logs);
    } catch (error) {
      console.error('Error adding log entry:', error);
    }
  };

  writeQueue.push(operation);
  processWriteQueue();
};

/**
 * Log an error message
 * @param message - The error message to log
 */
export const logError = async (message: string): Promise<void> => {
  console.error(`[ERROR] ${message}`);
  await addLogEntry(LogLevel.ERROR, message);
};

/**
 * Log a success message (only when explicitly called)
 * @param message - The success message to log
 */
export const logSuccess = async (message: string): Promise<void> => {
  console.log(`[SUCCESS] ${message}`);
  await addLogEntry(LogLevel.SUCCESS, message);
};

/**
 * Log a warning message
 * @param message - The warning message to log
 */
export const logWarning = async (message: string): Promise<void> => {
  console.warn(`[WARNING] ${message}`);
  await addLogEntry(LogLevel.WARNING, message);
};

/**
 * Log an info message
 * @param message - The info message to log
 */
export const logInfo = async (message: string): Promise<void> => {
  console.log(`[INFO] ${message}`);
  await addLogEntry(LogLevel.INFO, message);
};

/**
 * Get all logs
 * @returns Array of log entries
 */
export const getLogs = async (): Promise<LogEntry[]> => {
  return await readLogs();
};

/**
 * Clear all logs
 */
export const clearLogs = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LOG_STORAGE_KEY);
    console.log('All logs cleared');
  } catch (error) {
    console.error('Error clearing logs:', error);
    throw error;
  }
};

/**
 * Get logs as formatted string
 * @returns Formatted log string
 */
export const getLogsAsString = async (): Promise<string> => {
  const logs = await readLogs();
  
  if (logs.length === 0) {
    return 'No logs available.';
  }

  return logs
    .map((log) => `[${log.timestamp}] [${log.level}] ${log.message}`)
    .join('\n');
};

/**
 * Export logs to a file
 * @param deviceInfo - Device information to include in the log file
 * @param appInfo - Application information to include in the log file
 * @returns Path to the exported log file
 */
export const exportLogsToFile = async (
  deviceInfo: {
    model: string;
    systemName: string;
    systemVersion: string;
    deviceName: string;
  },
  appInfo: {
    version: string;
    buildNumber: string;
  }
): Promise<string> => {
  try {
    const logs = await readLogs();
    const timestamp = new Date().toISOString();
    const year = new Date().getFullYear();
    const feedbackId = generateFeedbackId();
    
    // Create log file header
    const header = `PLEASE DO NOT MODIFY THE CONTENTS OF THIS FILE

©${year} Thrive Community Church. All information collected is used solely for product development and is never sold.

Device Information
Model: ${deviceInfo.model}
System: ${deviceInfo.systemName} ${deviceInfo.systemVersion}
Device Name: ${deviceInfo.deviceName}
Current Time: ${timestamp}

Application Information
Version: ${appInfo.version}
Build #: ${appInfo.buildNumber}
Feedback ID: ${feedbackId}

================================================================================
APPLICATION LOGS
================================================================================

`;

    // Format logs
    const logsContent = logs.length > 0
      ? logs.map((log) => `[${log.timestamp}] [${log.level}] ${log.message}`).join('\n')
      : 'No logs available.';

    const fileContent = header + logsContent;

    // Save to file
    const fileName = `${feedbackId}.log`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    await FileSystem.writeAsStringAsync(filePath, fileContent);
    
    console.log('Log file exported to:', filePath);
    return filePath;
  } catch (error) {
    console.error('Error exporting logs to file:', error);
    throw error;
  }
};

/**
 * Generate a unique feedback ID (last 8 characters of UUID)
 */
const generateFeedbackId = (): string => {
  return 'xxxxxxxx'.replace(/x/g, () => {
    return Math.floor(Math.random() * 16).toString(16);
  }).toUpperCase();
};

/**
 * Get log statistics
 * @returns Object with log counts by level
 */
export const getLogStats = async (): Promise<{
  total: number;
  errors: number;
  successes: number;
  warnings: number;
  info: number;
}> => {
  const logs = await readLogs();
  
  return {
    total: logs.length,
    errors: logs.filter((log) => log.level === LogLevel.ERROR).length,
    successes: logs.filter((log) => log.level === LogLevel.SUCCESS).length,
    warnings: logs.filter((log) => log.level === LogLevel.WARNING).length,
    info: logs.filter((log) => log.level === LogLevel.INFO).length,
  };
};

// Export logger instance for convenience
export default {
  logError,
  logSuccess,
  logWarning,
  logInfo,
  getLogs,
  clearLogs,
  getLogsAsString,
  exportLogsToFile,
  getLogStats,
};

