// A normalized trend, independent of which provider produced it.
export type NormalizedTrend = {
  rank: number;
  name: string;
  url: string;
  tweetVolume: number | null;
};

// Every data source implements this single interface. The rest of the app only
// ever talks to a TrendProvider, so swapping mock -> Apify -> official X API is
// a one-file change in lib/providers/index.ts.
export interface TrendProvider {
  readonly id: string;
  fetchTrends(locationSlug: string): Promise<NormalizedTrend[]>;
}

export function twitterSearchUrl(name: string): string {
  return `https://x.com/search?q=${encodeURIComponent(name)}`;
}
