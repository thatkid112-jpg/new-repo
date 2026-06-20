import { NormalizedTrend, TrendProvider, twitterSearchUrl } from "./types";

// A pool of believable US trend topics. The mock provider samples and shuffles
// these deterministically per-hour so the timeline shows realistic churn:
// some topics persist for hours, others appear and drop off.
const TOPIC_POOL = [
  "#MondayMotivation", "Taylor Swift", "#Election2026", "Lakers", "$AAPL",
  "Ukraine", "ChatGPT", "#WorldCup", "Bitcoin", "SpaceX", "#NowPlaying",
  "Super Bowl", "Yankees", "#BlackFriday", "Tesla", "Marvel", "Eagles",
  "#ClimateAction", "Powerball", "GTA 6", "#OOTD", "Fed", "Nvidia",
  "#CyberMonday", "Wordle", "Celtics", "iPhone", "Drake", "#NBA",
  "Beyonce", "#StarWars", "Warriors", "Ethereum", "#Caturday", "Cowboys",
  "Federer", "#TBT", "Messi", "Knicks", "#FridayFeeling",
];

// Mulberry32 — a tiny deterministic PRNG so a given hour always yields the same trends.
function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Build a deterministic top-N for a given location + hourly timestamp.
export function mockTrendsFor(locationSlug: string, capturedAt: Date, count = 30): NormalizedTrend[] {
  const hourKey = Math.floor(capturedAt.getTime() / (60 * 60 * 1000));
  const slugSeed = [...locationSlug].reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = seededRandom(hourKey * 1000 + slugSeed);

  const shuffled = [...TOPIC_POOL]
    .map((name) => ({ name, sort: rand() }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, count);

  return shuffled.map(({ name }, i) => ({
    rank: i + 1,
    name,
    url: twitterSearchUrl(name),
    // Roughly half of trends report a tweet volume, like the real feed.
    tweetVolume: rand() > 0.5 ? Math.floor(5_000 + rand() * 500_000) : null,
  }));
}

export const mockProvider: TrendProvider = {
  id: "mock",
  async fetchTrends(locationSlug: string) {
    return mockTrendsFor(locationSlug, new Date());
  },
};
