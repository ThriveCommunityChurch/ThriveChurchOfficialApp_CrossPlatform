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
  WeekNum?: number;
  DownloadedOn?: number;
  LocalAudioURI?: string;
  seriesArt?: string; // base64 or URI
  previouslyPlayed?: number;
  seriesTitle?: string;
  Tags?: string[];
}

export interface SermonSeries {
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
