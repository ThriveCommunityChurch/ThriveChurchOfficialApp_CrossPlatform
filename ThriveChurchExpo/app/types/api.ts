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
 * - Series: Search for sermon series by tags
 * - Message: Search for sermon messages by tags
 * - Speaker: Search for sermon messages by speaker name (returns Messages only)
 */
export enum SearchTarget {
  Series = "Series",
  Message = "Messages",
  Speaker = "Speaker"
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
 * - Tags: Used for Series/Message search (array of tag strings)
 * - SearchValue: Used for Speaker search (speaker name string)
 * - When SearchTarget is Speaker: use SearchValue, leave Tags empty/null
 * - When SearchTarget is Series/Message: use Tags, leave SearchValue empty/null
 */
export interface SermonSearchRequest {
  SearchTarget: SearchTarget;
  SortDirection: SortDirection;
  Tags: string[]; // Array of MessageTag enum string names (e.g., ["Faith", "Hope"])
  SearchValue?: string; // Speaker name for Speaker search
}

/**
 * Response from sermon search API
 * Returns either Series or Messages based on SearchTarget
 * - Series: Returned when SearchTarget is Series
 * - Messages: Returned when SearchTarget is Message or Speaker
 */
export interface SermonSearchResponse {
  Series: SermonSeries[]; // Returned when SearchTarget is Series
  Messages?: SermonMessage[]; // Returned when SearchTarget is Message or Speaker
}

/**
 * Extended SermonSeries with match count for client-side sorting
 */
export interface SermonSeriesWithMatchCount extends SermonSeries {
  matchCount: number; // Number of tags that match the current message
  matchingTags: string[]; // Array of tags that matched
}
