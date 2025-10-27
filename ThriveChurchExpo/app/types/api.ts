export interface SermonSeriesSummary {
  Id: string;
  Title: string;
  StartDate: string;
  ArtUrl: string;
}

export interface PagingInfo {
  TotalPageCount: number;
}

export interface SermonsSummaryPagedResponse {
  Summaries: SermonSeriesSummary[];
  PagingInfo: PagingInfo;
}

export interface SermonMessage {
  AudioUrl?: string;
  AudioDuration?: number;
  AudioFileSize?: number;
  VideoUrl?: string;
  PassageRef?: string;
  Speaker: string;
  Title: string;
  Summary?: string;
  Date: string;
  MessageId: string;
  SeriesId?: string;
  WeekNum?: number;
  DownloadedOn?: number;
  LocalAudioURI?: string;
  seriesArt?: string; // base64 or URI
  previouslyPlayed?: number;
  seriesTitle?: string;
  Tags?: string[];
}

export interface SermonSeries {
  Id: string; // Series ID used for API calls
  StartDate: string;
  EndDate?: string;
  Messages: SermonMessage[];
  Name: string;
  Year: string;
  Slug: string;
  Thumbnail: string;
  ArtUrl: string;
  LastUpdated?: string;
  Tags?: string[];
  Summary?: string;
}

// ===== Related Series Search Types =====

/**
 * Enum for search target type (using string values as per API requirement)
 */
export enum SearchTarget {
  Series = "Series",
  Message = "Messages"
}

/**
 * Enum for sort direction (using string values as per API requirement)
 */
export enum SortDirection {
  Ascending = "Ascending",
  Descending = "Descending"
}

/**
 * Request payload for sermon search API
 */
export interface SermonSearchRequest {
  SearchTarget: SearchTarget;
  SortDirection: SortDirection;
  Tags: string[]; // Array of MessageTag enum string names (e.g., ["Faith", "Hope"])
}

/**
 * Response from sermon search API
 * Returns either Series or Messages based on SearchTarget
 */
export interface SermonSearchResponse {
  Series: SermonSeries[]; // Returned when SearchTarget is Series
  Messages?: SermonMessage[]; // Returned when SearchTarget is Message
}

/**
 * Extended SermonSeries with match count for client-side sorting
 */
export interface SermonSeriesWithMatchCount extends SermonSeries {
  matchCount: number; // Number of tags that match the current message
  matchingTags: string[]; // Array of tags that matched
}
