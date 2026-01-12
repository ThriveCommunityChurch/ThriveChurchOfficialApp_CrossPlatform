/**
 * YouTube Service
 * Handles YouTube Data API v3 interactions for live streaming feature
 */

import { youtubeConfig } from '../../config/app.config';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Information about a live stream
 */
export interface LiveStreamInfo {
  isLive: boolean;
  videoId: string | null;
  title: string | null;
  viewerCount: number | null;
}

/**
 * YouTube Search API response types
 */
interface YouTubeSearchItem {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    channelTitle: string;
    liveBroadcastContent: string;
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

/**
 * YouTube Videos API response types (for viewer count)
 */
interface YouTubeVideoStatistics {
  viewCount: string;
  likeCount?: string;
  commentCount?: string;
}

interface YouTubeVideoItem {
  id: string;
  liveStreamingDetails?: {
    concurrentViewers?: string;
    activeLiveChatId?: string;
  };
  statistics: YouTubeVideoStatistics;
}

interface YouTubeVideoResponse {
  items: YouTubeVideoItem[];
}

// ============================================================================
// URL Helper Functions
// ============================================================================

/**
 * Get the YouTube watch URL for a video
 * @param videoId - The YouTube video ID
 * @returns The full YouTube watch URL
 */
export const getYouTubeWatchUrl = (videoId: string): string => {
  return `https://www.youtube.com/watch?v=${videoId}`;
};

/**
 * Get the YouTube embed URL for a video (for WebView)
 * @param videoId - The YouTube video ID
 * @returns The YouTube embed URL with autoplay enabled
 */
export const getYouTubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`;
};

/**
 * Get HTML content for embedding YouTube in a WebView
 * This uses an HTML wrapper to properly set referrer policies and avoid Error 153
 * @param videoId - The YouTube video ID
 * @returns HTML string to load in WebView
 */
export const getYouTubeEmbedHtml = (videoId: string): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      height: 100%;
      background-color: #000;
      overflow: hidden;
    }
    .video-container {
      position: relative;
      width: 100%;
      height: 100%;
    }
    iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
    }
  </style>
</head>
<body>
  <div class="video-container">
    <iframe
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&enablejsapi=1&rel=0&modestbranding=1"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Get the YouTube app deep link URL for a video
 * @param videoId - The YouTube video ID
 * @returns The YouTube app deep link URL
 */
export const getYouTubeAppUrl = (videoId: string): string => {
  return `vnd.youtube://${videoId}`;
};

// ============================================================================
// API Functions
// ============================================================================

/**
 * Check if the Thrive Church channel is currently live streaming
 * @returns LiveStreamInfo object with stream details or offline status
 */
export const checkLiveStatus = async (): Promise<LiveStreamInfo> => {
  const { apiKey, channelId } = youtubeConfig;

  // Return offline if no API key configured
  if (!apiKey) {
    console.warn('YouTube API key not configured');
    return { isLive: false, videoId: null, title: null, viewerCount: null };
  }

  try {
    // Step 1: Search for live broadcasts on the channel
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('channelId', channelId);
    searchUrl.searchParams.set('eventType', 'live');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('key', apiKey);

    const searchResponse = await fetch(searchUrl.toString());
    
    if (!searchResponse.ok) {
      throw new Error(`YouTube Search API error: ${searchResponse.status}`);
    }

    const searchData: YouTubeSearchResponse = await searchResponse.json();

    // No live streams found
    if (!searchData.items || searchData.items.length === 0) {
      return { isLive: false, videoId: null, title: null, viewerCount: null };
    }

    const liveVideo = searchData.items[0];
    const videoId = liveVideo.id.videoId;
    const title = liveVideo.snippet.title;

    // Step 2: Get viewer count from Videos API
    const videoUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    videoUrl.searchParams.set('part', 'liveStreamingDetails,statistics');
    videoUrl.searchParams.set('id', videoId);
    videoUrl.searchParams.set('key', apiKey);

    const videoResponse = await fetch(videoUrl.toString());
    
    if (!videoResponse.ok) {
      // Return live status without viewer count if this fails
      return { isLive: true, videoId, title, viewerCount: null };
    }

    const videoData: YouTubeVideoResponse = await videoResponse.json();
    
    let viewerCount: number | null = null;
    if (videoData.items?.[0]?.liveStreamingDetails?.concurrentViewers) {
      viewerCount = parseInt(videoData.items[0].liveStreamingDetails.concurrentViewers, 10);
    }

    return { isLive: true, videoId, title, viewerCount };
  } catch (error) {
    console.error('Error checking YouTube live status:', error);
    return { isLive: false, videoId: null, title: null, viewerCount: null };
  }
};

