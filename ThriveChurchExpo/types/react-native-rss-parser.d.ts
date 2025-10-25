declare module 'react-native-rss-parser' {
  export interface RSSItem {
    id: string;
    title: string;
    description: string;
    published?: string;
    links?: Array<{ url: string; rel?: string }>;
    enclosures?: Array<{ url: string; type?: string; length?: string }>;
    authors?: Array<{ name: string }>;
    categories?: Array<{ name: string }>;
    [key: string]: any;
  }

  export interface RSSFeed {
    type: string;
    title: string;
    description: string;
    links?: Array<{ url: string; rel?: string }>;
    items: RSSItem[];
    [key: string]: any;
  }

  export function parse(xml: string): Promise<RSSFeed>;
}

