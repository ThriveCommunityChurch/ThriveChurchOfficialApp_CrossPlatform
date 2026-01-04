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

/**
 * Available transcript-related features for a sermon message.
 * Use these to determine which API endpoints can be called for additional content.
 */
export type TranscriptFeature = 'Transcript' | 'Notes' | 'StudyGuide';

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
  /**
   * List of transcript features available for this message.
   * Use to determine which API endpoints to call:
   * - 'Transcript': GET /api/sermons/series/message/{id}/transcript
   * - 'Notes': GET /api/sermons/series/message/{id}/notes
   * - 'StudyGuide': GET /api/sermons/series/message/{id}/study-guide
   */
  AvailableTranscriptFeatures?: TranscriptFeature[];
}

// ===== Sermon Notes & Study Guide Types =====
  
/**
 * AI-generated sermon notes containing key points, quotes, and application points
 */
export interface SermonNotesResponse {
  Title: string;
  Speaker: string;
  Date: string;
  MainScripture: string;
  Summary: string;
  KeyPoints: KeyPointResponse[];
  Quotes: QuoteResponse[];
  ApplicationPoints: string[];
  GeneratedAt: string;
  ModelUsed: string;
  WordCount: number;
}

/**
 * A key point from the sermon
 */
export interface KeyPointResponse {
  Point: string;
  Scripture?: string;
  Detail?: string;
  TheologicalContext?: string;
  DirectlyQuoted?: boolean;
}

/**
 * A notable quote from the sermon
 */
export interface QuoteResponse {
  Text: string;
  Context?: string;
}

/**
 * AI-generated study guide for small groups
 */
export interface StudyGuideResponse {
  Title: string;
  Speaker: string;
  Date: string;
  MainScripture: string;
  Summary: string;
  KeyPoints: KeyPointResponse[];
  ScriptureReferences: ScriptureReferenceResponse[];
  DiscussionQuestions: DiscussionQuestionsResponse;
  Illustrations: IllustrationResponse[];
  PrayerPrompts: string[];
  TakeHomeChallenges: string[];
  Devotional?: string;
  AdditionalStudy: AdditionalStudyResponse[];
  EstimatedStudyTime: string;
  GeneratedAt: string;
  ModelUsed: string;
  Confidence: ConfidenceResponse;
}

/**
 * Scripture reference with context
 */
export interface ScriptureReferenceResponse {
  Reference: string;
  Context: string;
  DirectlyQuoted: boolean;
}

/**
 * Categorized discussion questions
 */
export interface DiscussionQuestionsResponse {
  Icebreaker: string[];
  Reflection: string[];
  Application: string[];
  ForLeaders?: string[];
}

/**
 * Illustration or story from the sermon
 */
export interface IllustrationResponse {
  Summary: string;
  Point: string;
}

/**
 * Additional study topics
 */
export interface AdditionalStudyResponse {
  Topic: string;
  Scriptures: string[];
  Note: string;
}

/**
 * Confidence indicators for study guide accuracy
 */
export interface ConfidenceResponse {
  ScriptureAccuracy: string;
  ContentCoverage: string;
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
