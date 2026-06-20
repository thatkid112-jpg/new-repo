import { NormalizedTrend, TrendProvider, twitterSearchUrl } from "./types";

// Reads live US trends from an Apify task that scrapes trends24.in.
//
// Setup (see README): a saved `cheerio-scraper` task with
//   startUrls = ["https://trends24.in/united-states/"]
// and a pageFunction that emits one row per trend:
//   { rank, trend, timeWindow, scrapedAt, url }
// A schedule runs the task periodically. Rather than trigger a run ourselves, we READ the
// task's most recent successful run — cheapest, and it reuses the schedule's output.
//
// Env: TRENDS_PROVIDER=apify, APIFY_TOKEN, APIFY_TASK_ID (the saved task, e.g. "username~task-name",
// from the task's API tab in Apify).

// One scraped row as produced by the trends24 pageFunction.
type Trends24Row = {
  rank?: number;
  trend?: string;
  timeWindow?: string;
  scrapedAt?: string;
  url?: string;
};

export const apifyProvider: TrendProvider = {
  id: "apify",
  async fetchTrends(_locationSlug: string): Promise<NormalizedTrend[]> {
    const token = process.env.APIFY_TOKEN;
    const taskId = process.env.APIFY_TASK_ID;
    if (!token || !taskId) {
      throw new Error(
        "TRENDS_PROVIDER=apify but APIFY_TOKEN / APIFY_TASK_ID are not set. " +
          "Add them to .env (APIFY_TASK_ID is your saved scraper task), or use TRENDS_PROVIDER=mock."
      );
    }

    // Latest SUCCEEDED run's dataset items — no run is triggered.
    const endpoint =
      `https://api.apify.com/v2/actor-tasks/${encodeURIComponent(taskId)}` +
      `/runs/last/dataset/items?token=${token}&status=SUCCEEDED&format=json`;

    const res = await fetch(endpoint);
    if (!res.ok) {
      throw new Error(`Apify task fetch failed: ${res.status} ${res.statusText}`);
    }

    const rows: Trends24Row[] = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error(
        "Apify task returned no items. Has a run succeeded yet, and do the pageFunction " +
          "selectors still match trends24's HTML?"
      );
    }

    // trends24 renders the newest time-window card first, and the pageFunction iterates in
    // document order — so the first row's timeWindow is the most recent snapshot. Keep only
    // that group as "now".
    const latestWindow = rows[0].timeWindow;
    const current = rows.filter((r) => r.timeWindow === latestWindow);

    return current.map((row, i) => {
      const name = String(row.trend ?? "").trim();
      const href = String(row.url ?? "");
      return {
        rank: Number(row.rank ?? i + 1),
        name,
        // trends24 hrefs are usually absolute; fall back to an X search link if relative/missing.
        url: href.startsWith("http") ? href : twitterSearchUrl(name),
        tweetVolume: null, // this scrape does not capture tweet volume
      } satisfies NormalizedTrend;
    });
  },
};
