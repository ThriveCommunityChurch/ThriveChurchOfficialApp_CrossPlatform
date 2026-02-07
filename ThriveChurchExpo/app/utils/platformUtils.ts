import { Platform } from 'react-native';

/**
 * Platform detection utilities for iOS 26+ liquid glass UI and cross-platform styling
 */

// Check if running on iOS
export const isIOS = Platform.OS === 'ios';

// Check if running on Android
export const isAndroid = Platform.OS === 'android';

/**
 * Get the iOS major version number
 * Returns 0 for non-iOS platforms
 */
export const getIOSMajorVersion = (): number => {
  if (!isIOS) return 0;
  const version = Platform.Version;
  if (typeof version === 'string') {
    return parseInt(version.split('.')[0], 10) || 0;
  }
  return typeof version === 'number' ? version : 0;
};

// iOS major version (0 for non-iOS)
export const iosMajorVersion = getIOSMajorVersion();

/**
 * Check if the device is running iOS 26+ with liquid glass UI
 * Liquid glass is Apple's new design language introduced in iOS 26
 */
export const isLiquidGlass = isIOS && iosMajorVersion >= 26;

/**
 * Header button margins for proper positioning
 * 
 * For iOS 26+ liquid glass:
 * - Left margin of 6 centers icons in the left glass button area
 * - Right margin of 6 centers icons in the right glass button area
 * 
 * For iOS < 26 and Android:
 * - Standard margins for proper edge spacing
 */
export const HEADER_BUTTON_MARGINS = {
  // Margin for left-side header buttons (like search icon)
  left: isLiquidGlass ? 6 : (isIOS ? 16 : 16),
  // Margin for right-side header button containers
  rightContainer: isLiquidGlass ? 6 : (isIOS ? 12 : 8),
  // Margin to add to left side of right-positioned single icons (centers in glass area)
  rightIconLeft: isLiquidGlass ? 6 : 0,
};

