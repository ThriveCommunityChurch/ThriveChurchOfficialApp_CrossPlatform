/**
 * Network Monitor Service
 * Monitors network connectivity and determines if downloads are allowed
 * based on connection type and user settings.
 */

import NetInfo, { NetInfoState, NetInfoStateType } from '@react-native-community/netinfo';
import { getDownloadSettings } from './downloadSettings';

// Network status interface
export interface NetworkStatus {
  isConnected: boolean;
  isWifi: boolean;
  isCellular: boolean;
  type: NetInfoStateType;
  canDownload: boolean; // Based on settings + connection
}

// Callback type for network changes
type NetworkChangeCallback = (status: NetworkStatus) => void;

// Set of listeners for network changes
const listeners: Set<NetworkChangeCallback> = new Set();

// Current network status (cached)
let currentStatus: NetworkStatus = {
  isConnected: false,
  isWifi: false,
  isCellular: false,
  type: NetInfoStateType.unknown,
  canDownload: false,
};

// NetInfo unsubscribe function
let unsubscribe: (() => void) | null = null;

/**
 * Parse NetInfo state into our NetworkStatus format
 * Checks user settings to determine if downloads are allowed
 */
const parseNetInfoState = async (state: NetInfoState): Promise<NetworkStatus> => {
  const isConnected = state.isConnected ?? false;
  const isWifi = state.type === NetInfoStateType.wifi;
  const isCellular = state.type === NetInfoStateType.cellular;

  // Check settings to determine if we can download
  const settings = await getDownloadSettings();
  let canDownload = isConnected;

  // If WiFi-only is enabled and we're not on WiFi, can't download
  if (settings.wifiOnly && !isWifi) {
    canDownload = false;
  }

  return {
    isConnected,
    isWifi,
    isCellular,
    type: state.type,
    canDownload,
  };
};

/**
 * Start network monitoring
 * Initializes NetInfo listener and tracks network state changes
 */
export const startNetworkMonitoring = (): void => {
  if (unsubscribe) {
    console.log('Network monitoring already active');
    return;
  }

  unsubscribe = NetInfo.addEventListener(async (state) => {
    const newStatus = await parseNetInfoState(state);
    const statusChanged =
      currentStatus.canDownload !== newStatus.canDownload ||
      currentStatus.isConnected !== newStatus.isConnected ||
      currentStatus.isWifi !== newStatus.isWifi;

    currentStatus = newStatus;

    // Notify all listeners if status changed
    if (statusChanged) {
      listeners.forEach((callback) => callback(newStatus));
    }
  });

  // Get initial state
  NetInfo.fetch().then(async (state) => {
    currentStatus = await parseNetInfoState(state);
    listeners.forEach((callback) => callback(currentStatus));
  });

  console.log('Network monitoring started');
};

/**
 * Stop network monitoring
 * Cleans up NetInfo listener
 */
export const stopNetworkMonitoring = (): void => {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
    console.log('Network monitoring stopped');
  }
};

/**
 * Subscribe to network changes
 * Returns unsubscribe function
 */
export const subscribeToNetworkChanges = (callback: NetworkChangeCallback): (() => void) => {
  listeners.add(callback);

  // Immediately call with current status
  callback(currentStatus);

  // Return unsubscribe function
  return () => {
    listeners.delete(callback);
  };
};

/**
 * Get current network status synchronously
 * Returns cached status (may be stale if not monitoring)
 */
export const getNetworkStatus = (): NetworkStatus => {
  return currentStatus;
};

/**
 * Refresh network status
 * Force refreshes and notifies all listeners
 */
export const refreshNetworkStatus = async (): Promise<NetworkStatus> => {
  const state = await NetInfo.fetch();
  currentStatus = await parseNetInfoState(state);
  listeners.forEach((callback) => callback(currentStatus));
  return currentStatus;
};

/**
 * Check if download is allowed right now
 * Returns { allowed: boolean, reason?: string }
 */
export const canDownloadNow = async (): Promise<{ allowed: boolean; reason?: string }> => {
  const state = await NetInfo.fetch();
  const status = await parseNetInfoState(state);

  if (!status.isConnected) {
    return { allowed: false, reason: 'No internet connection' };
  }

  const settings = await getDownloadSettings();

  if (settings.wifiOnly && !status.isWifi) {
    return {
      allowed: false,
      reason: 'WiFi-only downloads enabled. Connect to WiFi to download.',
    };
  }

  return { allowed: true };
};

