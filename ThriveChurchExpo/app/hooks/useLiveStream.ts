/**
 * useLiveStream Hook
 * React Query hook for fetching and caching YouTube live stream status
 * Uses smart polling schedule to minimize API quota usage
 *
 * Polling Schedule (Eastern Time):
 * - Sunday 9:30 AM - 10:30 AM: Every 5 minutes (active service time)
 * - Sunday 10:30 AM - 12:00 PM: Every hour
 * - Sunday After 12:00 PM: None (cooloff)
 * - Mon-Fri 5:00 PM - 10:00 PM: Every hour
 * - Mon-Fri Before 5 PM / After 10 PM: None (cooloff)
 * - Saturday: All day - None (cooloff)
 */

import { useQuery } from '@tanstack/react-query';
import { checkLiveStatus, type LiveStreamInfo } from '../services/youtube';

// Query key for the live stream status
export const LIVE_STREAM_QUERY_KEY = ['youtube', 'liveStatus'] as const;

// Polling intervals in milliseconds
const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

// Stale time in milliseconds (30 seconds)
const STALE_TIME = 30 * 1000;

// Garbage collection time in milliseconds (5 minutes)
const GC_TIME = 5 * 60 * 1000;

/**
 * Get the current time in Eastern timezone
 * @returns Object with day of week (0=Sunday), hours (0-23), and minutes (0-59)
 */
const getEasternTime = (): { dayOfWeek: number; hours: number; minutes: number } => {
  const now = new Date();
  const easternTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return {
    dayOfWeek: easternTime.getDay(), // 0 = Sunday, 6 = Saturday
    hours: easternTime.getHours(),
    minutes: easternTime.getMinutes(),
  };
};

/**
 * Calculate the appropriate polling interval based on current day/time
 *
 * Schedule:
 * - Sunday 9:30 AM - 10:30 AM: Every 5 minutes
 * - Sunday 10:30 AM - 12:00 PM: Every hour
 * - Mon-Fri 5:00 PM - 10:00 PM: Every hour
 * - All other times: No polling (returns false)
 *
 * @returns Polling interval in ms, or false to disable polling
 */
export const getPollingInterval = (): number | false => {
  const { dayOfWeek, hours, minutes } = getEasternTime();
  const timeInMinutes = hours * 60 + minutes;

  // Sunday (0)
  if (dayOfWeek === 0) {
    // 9:30 AM - 10:30 AM (570 - 630 minutes): Every 5 minutes
    if (timeInMinutes >= 570 && timeInMinutes < 630) {
      return FIVE_MINUTES;
    }
    // 10:30 AM - 12:00 PM (630 - 720 minutes): Every hour
    if (timeInMinutes >= 630 && timeInMinutes < 720) {
      return ONE_HOUR;
    }
    // After 12:00 PM or before 9:30 AM: No polling
    return false;
  }

  // Saturday (6): No polling
  if (dayOfWeek === 6) {
    return false;
  }

  // Monday-Friday (1-5)
  // 5:00 PM - 10:00 PM (1020 - 1320 minutes): Every hour
  if (timeInMinutes >= 1020 && timeInMinutes < 1320) {
    return ONE_HOUR;
  }

  // Before 5 PM or after 10 PM: No polling
  return false;
};

/**
 * Hook to check if Thrive Church is currently live streaming on YouTube
 *
 * Features:
 * - Smart polling based on service schedule to minimize API quota
 * - Caches results for 30 seconds before considering stale
 * - Keeps cached data for 5 minutes
 * - Retries failed requests up to 2 times
 *
 * @returns Query result with live stream info, loading state, error state, and refetch function
 */
export const useLiveStream = () => {
  const pollingInterval = getPollingInterval();

  return useQuery<LiveStreamInfo>({
    queryKey: LIVE_STREAM_QUERY_KEY,
    queryFn: checkLiveStatus,
    refetchInterval: pollingInterval,
    staleTime: STALE_TIME,
    gcTime: GC_TIME,
    retry: 2,
  });
};

export default useLiveStream;

